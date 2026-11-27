/* Dashboard Peserta: status profil, asesmen, dan hasil dari server. */
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;
    let peserta=null;
    try{peserta=JSON.parse(localStorage.getItem("skillupLoggedIn")||"null");}catch(_){}
    if(!peserta||peserta.role!=="user")return;

    const welcome=document.getElementById("welcomeName");
    const avatar=document.getElementById("userAvatar");
    const profileStatus=document.getElementById("profileStatus");
    const assessmentStatus=document.getElementById("assessmentStatus");
    const interestStatus=document.getElementById("interestStatus");
    const nextText=document.getElementById("nextStepText");
    const nextButton=document.getElementById("nextStepButton");

    function initials(name){
        return String(name||"Peserta").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"P";
    }
    function showAvatar(name,photo){
        if(!avatar)return;
        avatar.replaceChildren();
        if(photo){
            const img=document.createElement("img");img.src=photo;img.alt="Foto Profil Peserta";
            img.onerror=()=>{avatar.textContent=initials(name).charAt(0);};
            avatar.appendChild(img);
        }else avatar.textContent=initials(name).charAt(0);
    }
    async function load(){
        try{
            const data=await window.SkillUpAPI.get("participant/dashboard");
            const p=data.profile||{};
            const a=data.assessment;
            const c=data.classification;
            const name=p.nama||peserta.name||"Peserta";
            const complete=Boolean(p.birth_date&&p.education&&p.work_experience&&p.address&&peserta.phone);
            if(welcome)welcome.textContent="Halo, "+name+"!";
            showAvatar(name,window.SkillUpAPI.assetUrl(p.photo_path||""));
            if(profileStatus)profileStatus.textContent=complete?"Lengkap":"Belum lengkap";
            if(assessmentStatus)assessmentStatus.textContent=a
                ? (a.practical_level ? "Sudah dinilai ("+a.practical_level+")" : "Menunggu penilaian Admin")
                : "Belum diisi";
            if(interestStatus)interestStatus.textContent=a?.interest_category||"Belum dipilih";
            if(!nextText||!nextButton)return;
            if(!complete){
                nextText.textContent="Lengkapi tanggal lahir, pendidikan terakhir, pengalaman kerja, nomor telepon, dan alamat pada profil.";
                nextButton.href="../EditProfil/edit-profil-peserta.html";
                nextButton.textContent="Lengkapi Profil";
            }else if(!a){
                nextText.textContent="Profil Anda sudah tersedia. Berikutnya isi asesmen awal mengenai minat, kemampuan komputer, dan komunikasi.";
                nextButton.href="../AsesmenAwal/asesmen-awal.html";
                nextButton.textContent="Isi Asesmen Awal";
            }else if(!c){
                nextText.textContent="Asesmen tersimpan. Admin perlu melengkapi penilaian keterampilan praktik dan memproses klasifikasi.";
                nextButton.href="../AsesmenAwal/asesmen-awal.html";
                nextButton.textContent="Lihat Status Asesmen";
            }else{
                nextText.textContent="Hasil pemetaan kebutuhan pelatihan Anda sudah tersedia. Buka hasil rekomendasi untuk melihat bidang yang disarankan.";
                nextButton.href="../HasilRekomendasi/hasil-rekomendasi.html";
                nextButton.textContent="Lihat Hasil Rekomendasi";
            }
        }catch(error){
            console.error("Gagal memuat Dashboard Peserta:",error);
            if(nextText)nextText.textContent="Informasi dashboard belum dapat dimuat. Periksa koneksi server.";
        }
    }
    await load();
    window.addEventListener("skillupProfileUpdated",load);
});
