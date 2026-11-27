/* Data Asesmen Admin: asesmen awal dan riwayat penilaian praktik dari MySQL. */
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;
    let admin=null;
    try{admin=JSON.parse(localStorage.getItem("skillupLoggedIn")||"null");}catch(_){}
    if(!admin||admin.role!=="admin")return;

    const table=document.getElementById("asesmenTable");
    const search=document.getElementById("searchAsesmen");
    const modal=document.getElementById("modalPenilaian");
    const form=document.getElementById("formPenilaian");
    const saveButton=document.getElementById("tombolSimpanPenilaian");
    if(!table||!search||!modal||!form||!saveButton)return;

    const category={
        KEC:"Kecantikan dan Tata Rias",KUL:"Kuliner dan Tata Boga",TEK:"Teknik dan Alat Berat",
        BUS:"Tata Busana dan Kerajinan",ADM:"Administrasi dan Teknologi",LIS:"Kelistrikan dan Keterampilan Teknik",
        PAR:"Pariwisata dan Perhotelan",WIR:"Kewirausahaan"
    };
    const indicatorIds=["indikator1","indikator2","indikator3","indikator4","indikator5"];
    const fields=[
        ["indikator1","indikator1Error"],["indikator2","indikator2Error"],
        ["indikator3","indikator3Error"],["indikator4","indikator4Error"],
        ["indikator5","indikator5Error"],["kemandirian","kemandirianError"],
        ["kemampuanTeknis","kemampuanTeknisError"],["catatanPenilaian","catatanPenilaianError"]
    ];
    let assessments=[];
    let selected=null;

    function escapeText(value){return String(value??"");}
    function alreadyScored(item){return Boolean(item.practical_id&&item.keterampilan_praktik);}
    function showError(id,errorId,message){
        const input=document.getElementById(id),node=document.getElementById(errorId);
        if(input){input.classList.add("input-invalid");input.setAttribute("aria-invalid","true");}
        if(node){node.textContent=message;node.classList.add("show");}
    }
    function clearError(id,errorId){
        const input=document.getElementById(id),node=document.getElementById(errorId);
        if(input){input.classList.remove("input-invalid");input.setAttribute("aria-invalid","false");}
        if(node){node.textContent="";node.classList.remove("show");}
    }
    function clearErrors(){fields.forEach(([id,eid])=>clearError(id,eid));}
    function validate(){
        clearErrors();let valid=true;let first=null;
        fields.forEach(([id,eid])=>{
            const input=document.getElementById(id);
            if(!input||!input.value.trim()){
                showError(id,eid,id==="catatanPenilaian"?"Catatan penilaian wajib diisi.":"Kolom ini wajib diisi.");
                valid=false;if(!first)first=input;
            }
        });
        if(first)first.focus();
        return valid;
    }
    function addCell(row,value){
        const td=document.createElement("td");td.textContent=escapeText(value||"-");row.appendChild(td);
    }
    function render(){
        const keyword=String(search.value||"").trim().toLowerCase();
        const rows=assessments.filter(item=>[
            item.nama,item.email,category[item.minat_bidang]||item.minat_bidang
        ].some(value=>String(value||"").toLowerCase().includes(keyword)));
        table.replaceChildren();
        if(!rows.length){
            table.innerHTML='<tr><td colspan="8" class="admin-empty">Belum ada data asesmen.</td></tr>';
            return;
        }
        rows.forEach((a,index)=>{
            const row=document.createElement("tr");
            [
                index+1,a.nama||a.email,category[a.minat_bidang]||a.minat_bidang,
                a.kemampuan_komputer,a.kemampuan_komunikasi,
                a.keterampilan_praktik||"Belum dinilai"
            ].forEach(value=>addCell(row,value));
            const status=document.createElement("td");
            const badge=document.createElement("span");
            badge.className=alreadyScored(a)?"admin-status done":"admin-status";
            badge.textContent=alreadyScored(a)?"Siap klasifikasi":"Menunggu praktik";
            status.appendChild(badge);row.appendChild(status);
            const action=document.createElement("td");
            const button=document.createElement("button");
            button.type="button";button.className="admin-button-secondary";
            button.dataset.assessmentId=a.assessment_id;
            button.textContent=alreadyScored(a)?"Ubah Penilaian":"Nilai Praktik";
            action.appendChild(button);
            row.appendChild(action);
            table.appendChild(row);
        });
    }
    async function load(){
        try{
            const result=await window.SkillUpAPI.get("admin/assessments");
            assessments=(result.assessments||[]).map(item=>{
                let indicators={};
                try{indicators=typeof item.indikator_json==="string"?JSON.parse(item.indikator_json):item.indikator_json||{};}catch(_){}
                return {...item,indikator_penilaian:indicators,catatan_penilaian:item.catatan_penilaian||""};
            });
            render();
        }catch(error){
            console.error("Gagal memuat asesmen:",error);
            table.innerHTML='<tr><td colspan="8" class="admin-empty">Data asesmen belum dapat dimuat. Periksa koneksi server.</td></tr>';
        }
    }
    function openModal(id){
        selected=assessments.find(item=>String(item.assessment_id)===String(id));
        if(!selected)return;
        form.reset();clearErrors();
        document.getElementById("emailPeserta").value=selected.email||"";
        document.getElementById("detailNama").textContent=selected.nama||selected.email||"-";
        document.getElementById("detailBidang").textContent=category[selected.minat_bidang]||selected.minat_bidang||"Bidang Pelatihan";
        document.getElementById("detailUsia").textContent=(selected.usia??"-")+" tahun";
        document.getElementById("detailPendidikan").textContent=selected.pendidikan||"-";
        document.getElementById("detailPengalaman").textContent=selected.pengalaman_kerja||"-";
        indicatorIds.forEach(id=>document.getElementById(id).value=selected.indikator_penilaian?.[id]||"");
        document.getElementById("kemandirian").value=selected.kemandirian_praktik||"";
        document.getElementById("kemampuanTeknis").value=selected.keterampilan_praktik||"";
        document.getElementById("catatanPenilaian").value=selected.catatan_penilaian||"";
        document.getElementById("judulModalPenilaian").textContent=alreadyScored(selected)?"Ubah Penilaian Keterampilan Praktik":"Penilaian Keterampilan Praktik";
        saveButton.textContent=alreadyScored(selected)?"Simpan Perubahan":"Simpan Penilaian";
        modal.classList.add("show");modal.setAttribute("aria-hidden","false");document.body.classList.add("modal-terbuka");
        document.getElementById("tutupModal")?.focus();
    }
    function closeModal(){
        modal.classList.remove("show");modal.setAttribute("aria-hidden","true");
        document.body.classList.remove("modal-terbuka");form.reset();clearErrors();selected=null;
    }

    table.addEventListener("click",event=>{
        const button=event.target.closest("[data-assessment-id]");
        if(button)openModal(button.dataset.assessmentId);
    });
    document.getElementById("tutupModal")?.addEventListener("click",closeModal);
    document.getElementById("batalPenilaian")?.addEventListener("click",closeModal);
    modal.addEventListener("click",event=>{if(event.target===modal)closeModal();});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal.classList.contains("show"))closeModal();});
    search.addEventListener("input",render);

    form.addEventListener("submit",async event=>{
        event.preventDefault();
        if(!selected||!validate())return;
        const indicators={};
        indicatorIds.forEach(id=>indicators[id]=document.getElementById(id).value);
        const payload={
            indicators,
            independence_level:document.getElementById("kemandirian").value,
            practical_level:document.getElementById("kemampuanTeknis").value,
            notes:document.getElementById("catatanPenilaian").value.trim()
        };
        saveButton.disabled=true;saveButton.textContent="Menyimpan...";
        try{
            await window.SkillUpAPI.post("admin/assessments/"+encodeURIComponent(selected.assessment_id)+"/practical",payload);
            closeModal();
            await load();
            await window.SkillUpPopup?.sukses(
                "Penilaian Berhasil Disimpan",
                "Penilaian praktik tersimpan sebagai riwayat baru. Hasil klasifikasi sebelumnya dinonaktifkan agar dapat diproses ulang."
            );
        }catch(error){
            console.error("Gagal menyimpan penilaian praktik:",error);
            await window.SkillUpPopup?.gagal("Penilaian Gagal Disimpan",error.message||"Periksa data dan koneksi server.");
        }finally{
            saveButton.disabled=false;
            saveButton.textContent="Simpan Penilaian";
        }
    });

    await load();
});
