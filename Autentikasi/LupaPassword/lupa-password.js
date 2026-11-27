/* Pemulihan password melalui OTP Gmail dan backend PHP. */
document.addEventListener("DOMContentLoaded",function(){
    const form=document.getElementById("resetPasswordForm");
    const email=document.getElementById("resetEmail");
    const code=document.getElementById("resetCode");
    const password=document.getElementById("newPassword");
    const confirm=document.getElementById("confirmPassword");
    const send=document.getElementById("sendOtpButton");
    const submit=document.getElementById("resetSubmit");
    const notice=document.getElementById("otpNotice");
    if(!form||!email||!code||!password||!confirm||!send||!submit)return;
    let otpRequested=false;
    const errorIds={
        email:"resetEmailError",code:"resetCodeError",
        password:"newPasswordError",confirm:"confirmPasswordError"
    };
    function error(field,message){
        const node=document.getElementById(errorIds[field]);
        if(node)node.textContent=message;
        const input={email,code,password,confirm}[field];
        if(input){input.classList.add("input-invalid");input.setAttribute("aria-invalid","true");}
    }
    function clear(field){
        const node=document.getElementById(errorIds[field]);
        if(node)node.textContent="";
        const input={email,code,password,confirm}[field];
        if(input){input.classList.remove("input-invalid");input.removeAttribute("aria-invalid");}
    }
    function validEmail(){
        const value=email.value.trim().toLowerCase();
        if(!/^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/.test(value)){
            error("email","Masukkan alamat Gmail dengan format yang valid.");return false;
        }
        clear("email");return true;
    }
    send.addEventListener("click",async function(){
        if(!validEmail())return;
        send.disabled=true;send.textContent="Mengirim...";
        try{
            const result=await window.SkillUpAPI.post("auth/forgot-password",{email:email.value.trim().toLowerCase()});
            otpRequested=true;
            code.disabled=false;password.disabled=false;confirm.disabled=false;submit.disabled=false;
            if(result.dev_code)await window.SkillUpPopup?.sukses("Kode OTP (Mode Pengembangan)","Kode OTP Anda: "+result.dev_code+". Kode ini hanya tampil saat SKILLUP_DEBUG=1 dan SMTP belum diisi.");
            email.readOnly=true;
            if(notice)notice.textContent=result.message||"Jika email terdaftar, kode verifikasi akan dikirim ke Gmail Anda. Periksa kotak masuk dan folder spam.";
            code.focus();
        }catch(err){
            if(notice)notice.textContent=err.message||"Kode OTP tidak dapat diminta. Silakan coba kembali.";
            error("email",err.message||"Permintaan OTP gagal.");
        }finally{
            send.disabled=false;send.textContent="Kirim Ulang Kode OTP";
        }
    });
    email.addEventListener("input",()=>clear("email"));
    code.addEventListener("input",function(){this.value=this.value.replace(/\D/g,"").slice(0,6);clear("code");});
    password.addEventListener("input",()=>clear("password"));
    confirm.addEventListener("input",()=>clear("confirm"));
    document.querySelectorAll(".reset-toggle").forEach(button=>{
        button.addEventListener("click",()=>{
            const input=document.getElementById(button.dataset.target);if(!input)return;
            const show=input.type==="password";input.type=show?"text":"password";
            button.setAttribute("aria-pressed",String(show));
            button.setAttribute("aria-label",show?"Sembunyikan password":"Lihat password");
        });
    });
    form.addEventListener("submit",async function(event){
        event.preventDefault();
        if(!otpRequested){if(notice)notice.textContent="Minta kode OTP terlebih dahulu.";return;}
        let valid=true;
        if(!/^\d{6}$/.test(code.value)){error("code","Kode OTP harus terdiri dari 6 digit.");valid=false;}
        if(password.value.length<8||!/[A-Z]/.test(password.value)||!/[a-z]/.test(password.value)||!/[0-9]/.test(password.value)||!/[^A-Za-z0-9]/.test(password.value)){
            error("password","Password minimal 8 karakter dan harus memuat huruf besar, huruf kecil, angka, serta karakter khusus.");valid=false;
        }
        if(confirm.value!==password.value){error("confirm","Konfirmasi password belum sama.");valid=false;}
        if(!valid)return;
        submit.disabled=true;submit.textContent="Memperbarui...";
        try{
            const result=await window.SkillUpAPI.post("auth/reset-password",{
                email:email.value.trim().toLowerCase(),code:code.value,password:password.value
            });
            await window.SkillUpPopup?.sukses("Password Berhasil Diperbarui",result.message||"Silakan login menggunakan password baru.");
            window.location.replace("../Login/login.html");
        }catch(err){
            if(err.errors?.code)error("code",err.errors.code);
            else if(err.errors?.password)error("password",err.errors.password);
            else if(notice)notice.textContent=err.message||"Kode OTP tidak valid atau sudah kedaluwarsa.";
        }finally{
            submit.disabled=false;submit.textContent="Atur Password Baru";
        }
    });
});
