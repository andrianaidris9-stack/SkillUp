/* Hasil Klasifikasi: proses ID3 dan simpan hasil pada database melalui API. */
document.addEventListener("DOMContentLoaded",async function(){
    if(window.SkillUpSessionReady)await window.SkillUpSessionReady;
    let admin=null;try{admin=JSON.parse(localStorage.getItem("skillupLoggedIn")||"null");}catch(_){}
    if(!admin||admin.role!=="admin")return;
    const processButton=document.getElementById("processClassification");
    const status=document.getElementById("modelStatus");
    const table=document.getElementById("classificationTable");
    if(!processButton||!status||!table)return;
    const name=document.getElementById("adminName"),avatar=document.getElementById("adminAvatar");
    if(name)name.textContent=admin.name||"Admin SkillUp";
    if(avatar)avatar.textContent=String(admin.name||"A").charAt(0).toUpperCase();

    function dateText(value){
        if(!value)return"-";
        const date=new Date(String(value).replace(" ","T"));
        return Number.isNaN(date.getTime())?value:date.toLocaleString("id-ID");
    }
    function cell(row,value){
        const td=document.createElement("td");td.textContent=value??"-";row.appendChild(td);
    }
    async function load(){
        try{
            const result=await window.SkillUpAPI.get("admin/classifications");
            const rows=result.classifications||[];
            table.replaceChildren();
            if(!rows.length){
                table.innerHTML='<tr><td colspan="7" class="admin-empty">Belum ada hasil klasifikasi.</td></tr>';
                return;
            }
            rows.forEach((item,index)=>{
                const row=document.createElement("tr");
                cell(row,index+1);cell(row,item.name||item.email);
                cell(row,item.interest_category||item.interest_code);
                cell(row,item.predicted_category);cell(row,item.predicted_category_code);
                cell(row,dateText(item.processed_at));
                const action=document.createElement("td");
                const button=document.createElement("button");
                button.type="button";button.className="admin-button-danger";
                button.textContent="Hapus";button.dataset.id=item.classification_id||item.id;
                action.appendChild(button);row.appendChild(action);
                table.appendChild(row);
            });
        }catch(error){
            console.error("Gagal memuat klasifikasi:",error);
            table.innerHTML='<tr><td colspan="7" class="admin-empty">Hasil klasifikasi belum dapat dimuat. Periksa koneksi server.</td></tr>';
        }
    }
    table.addEventListener("click",async event=>{
        const button=event.target.closest("button[data-id]");if(!button)return;
        const yes=window.SkillUpPopup?.konfirmasi
            ? await window.SkillUpPopup.konfirmasi("Arsipkan Hasil Klasifikasi?","Hanya hasil aktif yang diarsipkan. Profil, asesmen, dan riwayat klasifikasi tetap tersimpan.")
            : window.confirm("Arsipkan hasil klasifikasi ini?");
        if(!yes)return;
        button.disabled=true;
        try{
            await window.SkillUpAPI.delete("admin/classifications/"+encodeURIComponent(button.dataset.id));
            await load();
            await window.SkillUpPopup?.sukses("Hasil Diarsipkan","Hasil klasifikasi tidak lagi ditampilkan sebagai hasil aktif.");
        }catch(error){
            button.disabled=false;
            await window.SkillUpPopup?.gagal("Gagal Mengarsipkan",error.message||"Silakan coba kembali.");
        }
    });
    processButton.addEventListener("click",async()=>{
        processButton.disabled=true;processButton.textContent="Memproses...";
        status.textContent="Server sedang melatih Decision Tree ID3 dari dataset dan memeriksa kelengkapan peserta...";
        try{
            const result=await window.SkillUpAPI.post("admin/classifications/process",{});
            await load();
            status.textContent=`Proses selesai. Dataset: ${result.dataset_rows} baris. Berhasil diklasifikasikan: ${result.processed} peserta. Belum lengkap: ${result.incomplete} peserta.`;
            await window.SkillUpPopup?.sukses("Klasifikasi Selesai",result.message||"Hasil klasifikasi berhasil disimpan.");
        }catch(error){
            console.error("Proses klasifikasi gagal:",error);
            status.textContent=error.message||"Proses klasifikasi gagal. Data sebelumnya tetap dipertahankan.";
            await window.SkillUpPopup?.gagal("Klasifikasi Gagal",error.message||"Silakan periksa data peserta dan koneksi server.");
        }finally{
            processButton.disabled=false;processButton.textContent="Proses Klasifikasi";
        }
    });
    await load();
});
