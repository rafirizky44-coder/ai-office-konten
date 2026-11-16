import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zkwadclyvaiqhwzqyqil.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HeKrX6-7WjuK_6ypNK0QoA_cVfkNOvu";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const AGENTS=[
{name:"AI Director",icon:"♛",role:"Koordinasi operasional",desc:"Membagi pekerjaan, menjaga standar, memeriksa output, dan mengelola approval.",out:"Brief kerja & laporan harian"},
{name:"AI Researcher",icon:"⌕",role:"Riset pasar dan tren",desc:"Meneliti pertanyaan audiens, tren konten, kompetitor, dan peluang topik.",out:"Content research brief"},
{name:"AI Copywriter",icon:"✎",role:"Naskah dan copywriting",desc:"Menghasilkan ide, hook, skrip, caption, CTA, dan variasi pesan.",out:"Naskah siap produksi"},
{name:"AI Graphic Designer",icon:"▧",role:"Desain visual",desc:"Menyusun konsep visual, carousel, thumbnail, dan materi promosi.",out:"Brief desain & aset visual"},
{name:"AI Video Editor",icon:"▣",role:"Produksi video faceless",desc:"Menyusun storyboard, urutan klip, subtitle, audio, dan arahan editing.",out:"Video draft & file final"},
{name:"AI Social Analyst",icon:"⌁",role:"Analisis media sosial",desc:"Membaca performa konten, menemukan pola, dan mengusulkan waktu tayang.",out:"Laporan performa & rekomendasi"},
{name:"AI Publisher",icon:"➤",role:"Penjadwalan dan distribusi",desc:"Memvalidasi approval, menyiapkan metadata, dan menerbitkan konten melalui integrasi resmi.",out:"Publish job & URL konten"},
{name:"AI Sales & CRM",icon:"◇",role:"Prospek dan layanan pelanggan",desc:"Membantu FAQ, pencatatan prospek, tindak lanjut, dan ringkasan penjualan.",out:"Lead record & sales report"}
];
const WORKFLOWS=[
["01","Intake ide","Owner / Researcher","Membuat brief konten dan target audiens."],
["02","Riset","Research Agent","Menghasilkan tren, insight, dan referensi yang dapat diverifikasi."],
["03","Produksi naskah","Copywriter Agent","Membuat hook, skrip, caption, CTA, dan hashtag."],
["04","Produksi kreatif","Designer + Video Editor","Membuat aset visual/video dan menyimpan file ke storage."],
["05","Quality assurance","Director Agent","Memeriksa akurasi klaim, hak cipta, lisensi, format, dan brand voice."],
["06","Persetujuan owner","Owner Dashboard","Menunggu persetujuan eksplisit; penolakan mengembalikan konten untuk revisi."],
["07","Penjadwalan","Publisher Agent","Mencari slot terbaik dari analytics, lalu membuat publish job."],
["08","Publikasi","Platform API","Menerbitkan hanya konten approved dan mencatat hasil API."],
["09","Analisis","Social Analyst","Mengambil metrik setelah publikasi dan memperbarui rekomendasi."]
];
const seed=[
{id:1,title:"Selamat datang di Konten Cuan Digital",platform:"Instagram + TikTok",format:"Reels / Short video",status:"draft",date:"",caption:"Konten perkenalan brand dan positioning."},
{id:2,title:"Mau mulai affiliate tapi bingung bikin konten?",platform:"Instagram + TikTok",format:"Carousel",status:"review",date:"",caption:"Konten problem-awareness untuk pemula."},
{id:3,title:"Kenalan dengan 7500+ Video Affiliate",platform:"Instagram + TikTok",format:"Video demo produk",status:"idea",date:"",caption:"Tampilkan isi folder Google Drive yang benar-benar tersedia."}
];
let items=[];
let currentUser=null;
let currentWorkspace=null;
let realtimeChannel=null;
let authMode="login";
let isSaving=false;
const statusLabel={idea:"Ide",draft:"Draft",review:"Menunggu persetujuan",approved:"Disetujui",scheduled:"Terjadwal",published:"Terpublikasi",revision:"Perlu revisi"};
const statusClass={idea:"blue",draft:"gray",review:"warn",approved:"",scheduled:"blue",published:"",revision:"red"};
function save(){render()}
function platformToArray(value){return String(value||"").toLowerCase().includes("instagram + tiktok")?["instagram","tiktok"]:[String(value||"").toLowerCase().includes("instagram")?["instagram"]:["tiktok"]][0]}
function platformToLabel(value){const p=Array.isArray(value)?value:[];if(p.includes("instagram")&&p.includes("tiktok"))return "Instagram + TikTok";if(p.includes("instagram"))return "Instagram";if(p.includes("tiktok"))return "TikTok";return "Belum ditentukan"}
function toLocalInput(value){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}
function fromDb(row){return {id:row.id,title:row.title,platform:platformToLabel(row.platform),format:row.format||"Reels / Short video",caption:row.caption||"",status:row.status,date:toLocalInput(row.scheduled_at),workspace_id:row.workspace_id,approved_at:row.approved_at}}
async function loadContents(){if(!currentWorkspace)return;const {data,error}=await supabase.from("content_items").select("*").eq("workspace_id",currentWorkspace.id).order("created_at",{ascending:false});if(error)throw error;items=(data||[]).map(fromDb);render()}
function setConnection(message,ok=false){const el=document.getElementById("connectionText");if(el)el.textContent=message;const badge=document.getElementById("connectionBadge");if(badge){badge.textContent=ok?"Terhubung":"Belum terhubung";badge.className=ok?"status":"status warn";}const foot=document.getElementById("sideConnection");if(foot)foot.textContent=message;}
function showAuth(show){document.getElementById("authGate").classList.toggle("show",show)}
function showAuthMessage(message,isError=false){const el=document.getElementById("authMessage");el.textContent=message;el.style.color=isError?"#df9690":"#a8c7a5"}
async function ensureWorkspace(user){const {data,error}=await supabase.from("workspaces").upsert({owner_id:user.id,name:"Konten Cuan Digital",brand_name:"Konten Cuan Digital",product_name:"7500+ Video Affiliate",timezone:"Asia/Jakarta"},{onConflict:"owner_id"}).select().single();if(error)throw error;return data}
async function startRealtime(){if(realtimeChannel)await supabase.removeChannel(realtimeChannel);realtimeChannel=supabase.channel("ai-office-content-"+currentWorkspace.id).on("postgres_changes",{event:"*",schema:"public",table:"content_items",filter:"workspace_id=eq."+currentWorkspace.id},()=>loadContents().catch(showError)).subscribe((status)=>{if(status==="SUBSCRIBED")setConnection("Supabase tersambung · sinkronisasi aktif",true);});}
function showError(error){console.error(error);alert("Terjadi kendala: "+(error?.message||String(error)));}
async function activateSession(session){currentUser=session?.user||null;if(!currentUser){currentWorkspace=null;items=[];showAuth(true);setConnection("Silakan login untuk mengakses data");render();return;}try{currentWorkspace=await ensureWorkspace(currentUser);document.getElementById("businessName").value=currentWorkspace.brand_name||currentWorkspace.name||"Konten Cuan Digital";document.getElementById("productName").value=currentWorkspace.product_name||"7500+ Video Affiliate";document.getElementById("slogan").value=currentWorkspace.slogan||"Mulai Kecil, Bangun Peluang Digital";await loadContents();await startRealtime();showAuth(false);document.getElementById("logoutBtn").hidden=false;document.getElementById("userEmail").textContent=currentUser.email||"Pemilik";setConnection("Supabase tersambung · "+(currentUser.email||"Pemilik"),true);}catch(error){showAuth(true);showAuthMessage("Koneksi database gagal: "+error.message,true);setConnection("Gagal memuat workspace");}}
async function uploadSelectedAsset(contentId){const file=document.getElementById("fAsset").files[0];if(!file)return;if(!currentUser||!currentWorkspace)throw new Error("Sesi login tidak tersedia.");const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=currentUser.id+"/"+contentId+"/"+Date.now()+"-"+safeName;const {data,error}=await supabase.storage.from("content-assets").upload(path,file,{upsert:false});if(error)throw error;const ext=(file.name.split(".").pop()||"").toLowerCase();const kind=file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":file.type.startsWith("audio/")?"audio":"other";const {error:rowError}=await supabase.from("content_assets").insert({workspace_id:currentWorkspace.id,content_id:contentId,storage_path:data.path,asset_type:kind,mime_type:file.type||null});if(rowError)throw rowError;return data.path;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateFmt(v){if(!v)return"Belum ditentukan";let d=new Date(v);return isNaN(d)?"Belum ditentukan":d.toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}
function agentCard(a){return `<div class="agent"><div class="agenttop"><span class="agenticon">${a.icon}</span><span class="status">AI ROLE</span></div><h3>${a.name}</h3><p>${a.desc}</p><small>${a.out}</small></div>`}
function render(){
 document.getElementById("statTotal").textContent=items.length;
 document.getElementById("statPending").textContent=items.filter(x=>x.status==="review").length;
 document.getElementById("statScheduled").textContent=items.filter(x=>x.status==="scheduled").length;
 document.getElementById("statPublished").textContent=items.filter(x=>x.status==="published").length;
 document.getElementById("overviewAgents").innerHTML=AGENTS.slice(0,4).map(agentCard).join("");
 document.getElementById("allAgents").innerHTML=AGENTS.map(agentCard).join("");
 let q=items.filter(x=>["review","draft","idea","revision"].includes(x.status)).slice(0,5);
 document.getElementById("queueList").innerHTML=q.length?q.map(x=>`<div class="item"><div class="avatar">✦</div><div class="itemmain"><strong>${esc(x.title)}</strong><small>${esc(x.platform)} · ${statusLabel[x.status]}</small></div><button class="btn small" onclick="openItem('${x.id}')">Buka</button></div>`).join(""):`<div class="empty">Tidak ada pekerjaan dalam antrean.</div>`;
 let search=(document.getElementById("searchContent")?.value||"").toLowerCase(), filter=document.getElementById("filterStatus")?.value||"";
 let rows=items.filter(x=>(!search||x.title.toLowerCase().includes(search))&&(!filter||x.status===filter));
 document.getElementById("contentRows").innerHTML=rows.length?rows.map(x=>`<tr><td><strong>${esc(x.title)}</strong><br><span class="muted">${esc(x.caption||"")}</span></td><td>${esc(x.platform)}</td><td>${esc(x.format)}</td><td><span class="status ${statusClass[x.status]||""}">${statusLabel[x.status]}</span></td><td>${dateFmt(x.date)}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn small" onclick="openItem('${x.id}')">Kelola</button><button class="btn small danger" onclick="deleteContent('${x.id}')">Hapus</button></div></td></tr>`).join(""):`<tr><td colspan="6" class="empty">Belum ada konten yang cocok.</td></tr>`;
 let pending=items.filter(x=>x.status==="review");
 document.getElementById("approvalList").innerHTML=pending.length?pending.map(x=>`<div class="item"><div class="avatar">✓</div><div class="itemmain"><strong>${esc(x.title)}</strong><small>${esc(x.platform)} · ${esc(x.format)}</small><small>${esc(x.caption||"Belum ada catatan")}</small></div><button class="btn small primary" onclick="approve('${x.id}')">Setujui</button><button class="btn small danger" onclick="revise('${x.id}')">Revisi</button></div>`).join(""):`<div class="empty card">Tidak ada konten yang menunggu persetujuan.</div>`;
 let days=["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
 document.getElementById("calendarGrid").innerHTML=days.map((d,i)=>{let date=new Date();date.setDate(date.getDate()-((date.getDay()+6)%7)+i);let ds=date.toISOString().slice(0,10);let ev=items.filter(x=>x.date&&x.date.slice(0,10)===ds);return `<div class="day"><div class="dayhead">${d} · ${date.getDate()}</div>${ev.map(x=>`<div class="event ${x.status}">${esc(x.title)}</div>`).join("")}</div>`}).join("");
 document.getElementById("workflowList").innerHTML=WORKFLOWS.map(w=>`<div class="item"><div class="avatar">${w[0]}</div><div class="itemmain"><strong>${w[1]}</strong><small>${w[2]} · ${w[3]}</small></div><span class="status gray">Rancangan</span></div>`).join("");
}
function showView(v){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.getElementById("view-"+v).classList.add("active");document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));let titles={overview:"Dashboard operasional",agents:"Karyawan AI",content:"Manajemen konten",calendar:"Kalender publikasi",approval:"Persetujuan owner",analytics:"Analitik media sosial",workflow:"Workflow otomatisasi",settings:"Pengaturan workspace"};document.getElementById("pageTitle").textContent=titles[v]||"AI Office";window.scrollTo(0,0)}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.goto)));
document.getElementById("todayLabel").textContent=new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+" · Workspace pemilik";
const modal=document.getElementById("modal");
function openModal(item){document.getElementById("contentForm").dataset.id=item?.id||"";document.getElementById("modalTitle").textContent=item?"Kelola konten":"Tambah konten";document.getElementById("fTitle").value=item?.title||"";document.getElementById("fPlatform").value=item?.platform||"Instagram + TikTok";document.getElementById("fFormat").value=item?.format||"Reels / Short video";document.getElementById("fCaption").value=item?.caption||"";const statusEl=document.getElementById("fStatus");statusEl.disabled=["approved","scheduled","published"].includes(item?.status);statusEl.value=item?.status||"idea";document.getElementById("fDate").value=item?.date||"";document.getElementById("fAsset").value="";modal.classList.add("show")}
function closeModal(){modal.classList.remove("show")}
document.getElementById("newContent").onclick=()=>openModal();document.getElementById("newContent2").onclick=()=>openModal();document.getElementById("calendarAdd").onclick=()=>openModal();
document.getElementById("cancelModal").onclick=closeModal;modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});
document.getElementById("contentForm").addEventListener("submit",async e=>{e.preventDefault();if(isSaving)return;if(!currentUser||!currentWorkspace){alert("Silakan login terlebih dahulu.");return;}isSaving=true;const submit=e.target.querySelector('button[type="submit"]');submit.disabled=true;try{const id=e.target.dataset.id;const status=document.getElementById("fStatus").value;const payload={workspace_id:currentWorkspace.id,title:document.getElementById("fTitle").value.trim(),platform:platformToArray(document.getElementById("fPlatform").value),format:document.getElementById("fFormat").value,caption:document.getElementById("fCaption").value,status,approval_required:true,scheduled_at:document.getElementById("fDate").value?new Date(document.getElementById("fDate").value).toISOString():null};let saved;if(id){const {data,error}=await supabase.from("content_items").update(payload).eq("id",id).eq("workspace_id",currentWorkspace.id).select().single();if(error)throw error;saved=data;}else{const {data,error}=await supabase.from("content_items").insert(payload).select().single();if(error)throw error;saved=data;}await uploadSelectedAsset(saved.id);closeModal();document.getElementById("fAsset").value="";await loadContents();}catch(error){showError(error);}finally{isSaving=false;submit.disabled=false;}});
window.openItem=id=>{let x=items.find(y=>y.id===id);if(x)openModal(x)};
window.deleteContent=async id=>{
 if(!currentUser||!currentWorkspace)return;
 const item=items.find(x=>x.id===id);
 if(!item)return;
 const warning=item.status==="published"?"Konten ini sudah berstatus TERPUBLIKASI. Menghapusnya dari AI Office tidak menghapus postingan yang sudah tayang di Instagram/TikTok. ":"";
 const confirmed=window.confirm(warning+`Hapus konten "${item.title}"? File aset terkait juga akan dihapus dari Storage. Riwayat persetujuan yang terhubung dapat ikut terhapus karena relasi database saat ini menggunakan ON DELETE CASCADE. Tindakan ini tidak dapat dibatalkan.`);
 if(!confirmed)return;
 try{
   // Ambil path aset sebelum baris content_items dihapus (metadata aset memakai ON DELETE CASCADE).
   const {data:assets,error:assetReadError}=await supabase.from("content_assets").select("storage_path").eq("content_id",id).eq("workspace_id",currentWorkspace.id);
   if(assetReadError)throw assetReadError;
   const {data:deletedRows,error:deleteError}=await supabase.from("content_items").delete().eq("id",id).eq("workspace_id",currentWorkspace.id).select("id");
   if(deleteError)throw deleteError;
   if(!deletedRows||deletedRows.length===0)throw new Error("Konten tidak terhapus. Periksa kebijakan DELETE RLS pada tabel content_items.");
   // Hapus file fisik setelah baris konten berhasil dihapus.
   const paths=(assets||[]).map(a=>a.storage_path).filter(Boolean);
   let storageWarning="";
   if(paths.length){
     const {error:storageError}=await supabase.storage.from("content-assets").remove(paths);
     if(storageError)storageWarning=" Konten sudah terhapus dari database, tetapi sebagian file Storage gagal dihapus: "+storageError.message;
   }
   await loadContents();
   alert("Konten berhasil dihapus."+storageWarning);
 }catch(error){showError(error);}
};
window.approve=async id=>{if(!currentUser||!currentWorkspace)return;try{const {data,error}=await supabase.from("content_items").update({status:"approved",approved_by:currentUser.id,approved_at:new Date().toISOString()}).eq("id",id).eq("workspace_id",currentWorkspace.id).select().single();if(error)throw error;const {error:auditError}=await supabase.from("approval_events").insert({workspace_id:currentWorkspace.id,content_id:id,actor_id:currentUser.id,decision:"approved",notes:"Disetujui oleh pemilik melalui dashboard."});if(auditError)throw auditError;await loadContents();alert("Konten disetujui dan riwayat persetujuan tersimpan. Konten belum dipublikasikan.");}catch(error){showError(error)}};
window.revise=async id=>{if(!currentUser||!currentWorkspace)return;try{const {error}=await supabase.from("content_items").update({status:"revision",approved_by:null,approved_at:null}).eq("id",id).eq("workspace_id",currentWorkspace.id);if(error)throw error;const {error:auditError}=await supabase.from("approval_events").insert({workspace_id:currentWorkspace.id,content_id:id,actor_id:currentUser.id,decision:"revision",notes:"Dikembalikan untuk revisi oleh pemilik."});if(auditError)throw auditError;await loadContents();}catch(error){showError(error)}};
document.getElementById("searchContent").addEventListener("input",render);document.getElementById("filterStatus").addEventListener("change",render);
document.getElementById("saveSettings").onclick=async()=>{if(!currentWorkspace){alert("Login terlebih dahulu.");return;}const values={name:document.getElementById("businessName").value.trim(),brand_name:document.getElementById("businessName").value.trim(),product_name:document.getElementById("productName").value.trim(),slogan:document.getElementById("slogan").value.trim()};try{const {data,error}=await supabase.from("workspaces").update(values).eq("id",currentWorkspace.id).select().single();if(error)throw error;currentWorkspace=data;alert("Pengaturan workspace berhasil disimpan ke Supabase.");}catch(error){showError(error)}};
render();

document.getElementById("authForm").addEventListener("submit",async e=>{e.preventDefault();const email=document.getElementById("authEmail").value.trim();const password=document.getElementById("authPassword").value;if(!email||!password)return;const btn=document.getElementById("authSubmit");btn.disabled=true;showAuthMessage("Memproses...");try{if(authMode==="signup"){const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+window.location.pathname}});if(error)throw error;if(data.session){await activateSession(data.session);}else{showAuthMessage("Pendaftaran berhasil. Periksa email untuk konfirmasi, lalu login kembali.");}}else{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;await activateSession(data.session);}}catch(error){showAuthMessage(error.message,true);}finally{btn.disabled=false;}});
document.getElementById("authSwitch").addEventListener("click",()=>{authMode=authMode==="login"?"signup":"login";document.getElementById("authTitle").textContent=authMode==="login"?"Masuk ke AI Office":"Buat akun pemilik";document.getElementById("authSubmit").textContent=authMode==="login"?"Masuk":"Daftar";document.getElementById("authSwitch").textContent=authMode==="login"?"Belum punya akun? Daftar":"Sudah punya akun? Masuk";showAuthMessage("");});
document.getElementById("logoutBtn").addEventListener("click",async()=>{const {error}=await supabase.auth.signOut();if(error){showError(error);return;}if(realtimeChannel)await supabase.removeChannel(realtimeChannel);currentUser=null;currentWorkspace=null;items=[];document.getElementById("logoutBtn").hidden=true;showAuth(true);render();setConnection("Silakan login untuk mengakses data");});
supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){activateSession(null);return;}if(event==="SIGNED_IN"||event==="INITIAL_SESSION"||event==="TOKEN_REFRESHED"){if(session&&!currentWorkspace)queueMicrotask(()=>activateSession(session));}});
(async()=>{try{const {data,error}=await supabase.auth.getSession();if(error)throw error;if(data.session)await activateSession(data.session);else{showAuth(true);setConnection("Silakan login untuk mengakses data");}}catch(error){showAuth(true);showAuthMessage("Tidak dapat memulai koneksi: "+error.message,true);setConnection("Koneksi Supabase gagal");}})();
