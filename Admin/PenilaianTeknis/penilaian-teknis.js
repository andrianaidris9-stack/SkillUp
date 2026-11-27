/* Halaman Penilaian Praktik: menggunakan data dan endpoint asesmen server. */
document.addEventListener("DOMContentLoaded",async function(){
    if(window.SkillUpSessionReady)await window.SkillUpSessionReady;
    let admin=null;try{admin=JSON.parse(localStorage.getItem("skillupLoggedIn")||"null");}catch(_){}
    if(!admin||admin.role!=="admin")return;
    const table=document.getElementById("daftarPeserta"),filter=document.getElementById("filterPenilaian");
    const modal=document.getElementById("modalPenilaian"),form=document.getElementById("formPenilaian");
    const save=document.querySelector('#formPenilaian [type="submit"]');
    if(!table||!filter||!modal||!form||!save)return;
    const names={KEC:"Kecantikan dan Tata Rias",KUL:"Kuliner dan Tata Boga",TEK:"Teknik dan Alat Berat",BUS:"Tata Busana dan Kerajinan",ADM:"Administrasi dan Teknologi",LIS:"Kelistrikan dan Keterampilan Teknik",PAR:"Pariwisata dan Perhotelan",WIR:"Kewirausahaan"};
    const ids=["indikator1","indikator2","indikator3","indikator4","indikator5"];
    let data=[],selected=null;
    function scored(p){return Boolean(p.practical_id&&p.keterampilan_praktik);}
    function age(date){if(!date)return"-";const d=new Date(date+"T00:00:00");if(Number.isNaN(d.getTime()))return"-";const n=new Date();let y=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))y--;return y;}
    async function load(){
        try{
            const result=await window.SkillUpAPI.get("admin/assessments");
            data=(result.assessments||[]).map(p=>{let indicators={};try{indicators=typeof p.indikator_json==="string"?JSON.parse(p.indikator_json):p.indikator_json||{};}catch(_){}return {...p,indikator_penilaian:indicators};});
            render();
        }catch(error){console.error(error);table.innerHTML='<tr><td colspan="7" class="kosong">Data asesmen belum dapat dimuat.</td></tr>';}
    }
    function cell(row,value){const td=document.createElement("td");td.textContent=value||"-";row.appendChild(td);}
    function render(){
        const waiting=data.filter(p=>!scored(p)),done=data.filter(scored);
        document.getElementById("totalPeserta").textContent=data.length;
        document.getElementById("totalMenunggu").textContent=waiting.length;
        document.getElementById("totalSelesai").textContent=done.length;
        const mode=filter.value;
        const rows=data.filter(p=>mode==="Menunggu"?!scored(p):mode==="Selesai"?scored(p):true);
        table.replaceChildren();
        if(!rows.length){table.innerHTML='<tr><td colspan="7" class="kosong">Belum ada data peserta pada kategori ini.</td></tr>';return;}
        rows.forEach((p,index)=>{
            const row=document.createElement("tr");
            cell(row,index+1);cell(row,p.nama);cell(row,p.pendidikan);cell(row,p.pengalaman_kerja);
            cell(row,p.keterampilan_praktik||"Belum dinilai");
            const status=document.createElement("td");const badge=document.createElement("span");
            badge.className="status "+(scored(p)?"selesai":"menunggu");badge.textContent=scored(p)?"Selesai Dinilai":"Menunggu";status.appendChild(badge);row.appendChild(status);
            const action=document.createElement("td");const button=document.createElement("button");
            button.type="button";button.className="btn-nilai";button.dataset.id=p.assessment_id;
            button.textContent=scored(p)?"Ubah Penilaian":"Nilai Praktik";action.appendChild(button);row.appendChild(action);table.appendChild(row);
        });
    }
    function open(id){
        selected=data.find(p=>String(p.assessment_id)===String(id));if(!selected)return;
        form.reset();
        document.getElementById("emailPeserta").value=selected.email||"";
        document.getElementById("detailNama").textContent=selected.nama||selected.email;
        document.getElementById("detailBidang").textContent=names[selected.minat_bidang]||selected.minat_bidang||"-";
        document.getElementById("detailUsia").textContent=age(selected.birth_date)+" tahun";
        document.getElementById("detailPendidikan").textContent=selected.pendidikan||"-";
        document.getElementById("detailPengalaman").textContent=selected.pengalaman_kerja||"-";
        ids.forEach(id=>document.getElementById(id).value=selected.indikator_penilaian?.[id]||"");
        document.getElementById("kemandirian").value=selected.kemandirian_praktik||"";
        document.getElementById("kemampuanTeknis").value=selected.keterampilan_praktik||"";
        document.getElementById("catatanPenilaian").value=selected.catatan_penilaian||"";
        modal.classList.add("show");modal.setAttribute("aria-hidden","false");
    }
    function close(){modal.classList.remove("show");modal.setAttribute("aria-hidden","true");form.reset();selected=null;}
    table.addEventListener("click",e=>{const b=e.target.closest("button[data-id]");if(b)open(b.dataset.id);});
    filter.addEventListener("change",render);
    document.getElementById("tutupModal")?.addEventListener("click",close);
    document.getElementById("batalPenilaian")?.addEventListener("click",close);
    modal.addEventListener("click",e=>{if(e.target===modal)close();});
    form.addEventListener("submit",async e=>{
        e.preventDefault();if(!selected)return;
        const indicators={};let valid=true;
        ids.forEach(id=>{const v=document.getElementById(id).value;if(!v)valid=false;indicators[id]=v;});
        const independence=document.getElementById("kemandirian").value;
        const level=document.getElementById("kemampuanTeknis").value;
        const notes=document.getElementById("catatanPenilaian").value.trim();
        if(!valid||!independence||!level||!notes){await window.SkillUpPopup?.peringatan("Penilaian Belum Lengkap","Lengkapi seluruh indikator, kemandirian, tingkat keterampilan, dan catatan.");return;}
        save.disabled=true;save.textContent="Menyimpan...";
        try{
            await window.SkillUpAPI.post("admin/assessments/"+encodeURIComponent(selected.assessment_id)+"/practical",{indicators,independence_level:independence,practical_level:level,notes});
            close();await load();await window.SkillUpPopup?.sukses("Penilaian Berhasil Disimpan","Riwayat penilaian praktik tersimpan. Hasil klasifikasi lama dinonaktifkan.");
        }catch(error){await window.SkillUpPopup?.gagal("Penilaian Gagal",error.message||"Silakan coba kembali.");}
        finally{save.disabled=false;save.textContent="Simpan Penilaian";}
    });
    await load();
    const email=new URLSearchParams(location.search).get("email");
    if(email){const p=data.find(x=>String(x.email).toLowerCase()===email.toLowerCase());if(p)open(p.assessment_id);}
});
