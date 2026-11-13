let DATA, RAYONS, ING, RECS;
const KEY = "courses-selection-v1";
let sel = {};                                  // nom de recette -> nb de personnes
let done = {};                                 // ingrédient -> coché
let open = {};                                 // fiche dépliée
let F = {type:"", time:"", neuf:false, mine:false, tri:"temps", q:""};

try{ const s = JSON.parse(localStorage.getItem(KEY)||"{}");
     sel = s.sel||{}; done = s.done||{}; }catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify({sel,done})); }catch(e){} }

const nf = new Intl.NumberFormat("fr-FR",{maximumFractionDigits:2});
const byName = {};
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const dotCls = t => t==="Végé"?"v":(t==="Viande"?"m":"p");

function visibles(){
  let out = RECS.filter(r=>{
    if(F.type && r.ty!==F.type) return false;
    if(F.time && r.tt>+F.time) return false;
    if(F.neuf && !r.new) return false;
    if(F.mine && !sel[r.nom]) return false;
    if(F.q){ const q=norm(F.q);
      if(!norm(r.nom).includes(q) && !norm(r.cat).includes(q)
         && !r.ing.some(i=>norm(i.n).includes(q))) return false; }
    return true;
  });
  out.sort((a,b)=> F.tri==="temps" ? (a.tt-b.tt || a.nom.localeCompare(b.nom,"fr"))
                                   : a.nom.localeCompare(b.nom,"fr"));
  return out;
}

function renderGrid(){
  if(!RECS) return;                              // données pas encore chargées
  const v = visibles(), g = document.getElementById("grid");
  document.getElementById("count").textContent =
    v.length + (v.length>1?" recettes correspondent":" recette correspond");
  g.innerHTML = "";
  if(!v.length){ g.innerHTML = '<p class="empty">Aucune recette avec ces critères. Élargissez le temps ou videz la recherche.</p>'; return; }
  v.forEach(r=>{
    const n = sel[r.nom]||0, c = document.createElement("article");
    c.className = "card"+(n?" on":"");
    const ings = r.ing.map(i=>`<li>${i.n} · ${nf.format(i.q)} ${ING[i.n].u}</li>`).join("");
    c.innerHTML =
      `<h3>${r.nom}</h3>
       <div class="meta">
         <span class="pill time">⏱ ${r.tt} min</span>
         <span class="pill">${r.ta} min actif</span>
         <span class="pill"><i class="dot ${dotCls(r.ty)}"></i>${r.ty}</span>
         <span class="pill">${r.d}</span>
         <span class="pill">${r.cat}</span>
         <span class="pill">${r.ing.length} ingrédients</span>
         ${r.new?'<span class="pill new">nouveau</span>':''}
       </div>
       <button class="link" data-o="${r.nom}">${open[r.nom]?"Masquer":"Voir"} les ingrédients</button>
       ${open[r.nom]?`<ul class="ing">${ings}</ul>`:""}
       <div class="row">
         ${n?`<div class="stepper"><button data-m="${r.nom}" aria-label="Enlever une personne">−</button>
              <span>${n} pers.</span>
              <button data-p="${r.nom}" aria-label="Ajouter une personne">+</button></div>
             <button class="add" data-x="${r.nom}">Retirer</button>`
            :`<button class="add" data-a="${r.nom}">Ajouter pour 2</button>`}
       </div>`;
    g.appendChild(c);
  });
}

function ligneCourses(){
  const tot = {};
  Object.entries(sel).forEach(([nom,p])=>{
    (byName[nom]?.ing||[]).forEach(i=>{ tot[i.n] = (tot[i.n]||0) + i.q*p; });
  });
  return tot;
}

function renderListe(){
  if(!RECS) return;
  const tot = ligneCourses(), noms = Object.keys(sel);
  const nb = noms.length, couverts = noms.reduce((s,n)=>s+sel[n],0);
  const mins = noms.reduce((s,n)=>s+(byName[n]?.tt||0),0);
  document.getElementById("nbsel").textContent = nb;
  document.getElementById("k1").textContent = nb;
  document.getElementById("k2").textContent = couverts;
  document.getElementById("k3").textContent = mins;
  document.getElementById("k4").textContent = Object.keys(tot).length;

  const plan = document.getElementById("plan");
  if(!nb){
    plan.innerHTML = '<p class="empty">Aucun repas sélectionné. Passez à l’onglet Recettes et tapez sur les plats de la semaine.</p>';
    document.getElementById("list").innerHTML = "";
    document.getElementById("acts").innerHTML = "";
    return;
  }
  plan.innerHTML = "<h2>Mes repas</h2><div class='plan'>" + noms
    .sort((a,b)=>a.localeCompare(b,"fr"))
    .map(n=>{ const r=byName[n];
      return `<div class="card"><div class="nm"><b>${n}</b>
        <span>⏱ ${r.tt} min · ${r.ty} · ${r.cat}</span></div>
        <div class="stepper"><button data-m="${n}">−</button><span>${sel[n]} pers.</span>
        <button data-p="${n}">+</button></div>
        <button class="btn" data-x="${n}" aria-label="Retirer ${n}">✕</button></div>`;
    }).join("") + "</div>";

  let html = "<h2>Liste de courses</h2>";
  RAYONS.forEach(ray=>{
    const items = Object.keys(tot).filter(i=>ING[i].r===ray)
                  .sort((a,b)=>a.localeCompare(b,"fr"));
    if(!items.length) return;
    html += `<p class="rayon">${ray}</p><div class="items">` + items.map(i=>
      `<div class="item${done[i]?" done":""}" data-c="${i}" role="checkbox" tabindex="0"
            aria-checked="${!!done[i]}"><span class="box">✓</span>
        <span class="nm2">${i}</span>
        <span class="qty">${nf.format(Math.round(tot[i]*100)/100)} ${ING[i].u}</span></div>`
    ).join("") + "</div>";
  });
  document.getElementById("list").innerHTML = html;
  document.getElementById("acts").innerHTML =
    `<button class="btn pri" id="copy">Copier la liste</button>
     <button class="btn" id="uncheck">Tout décocher</button>
     <button class="btn" id="clear">Vider la semaine</button>`;
}

function render(){ renderGrid(); renderListe(); save(); }

document.addEventListener("click", e=>{
  const t = e.target.closest("button, .item"); if(!t) return;
  const d = t.dataset;
  if(d.a){ sel[d.a]=2; render(); }
  else if(d.p){ sel[d.p]=Math.min(20,(sel[d.p]||0)+1); render(); }
  else if(d.m){ sel[d.m]=(sel[d.m]||0)-1; if(sel[d.m]<1) delete sel[d.m]; render(); }
  else if(d.x){ delete sel[d.x]; render(); }
  else if(d.o){ open[d.o]=!open[d.o]; renderGrid(); }
  else if(d.c){ done[d.c]=!done[d.c]; renderListe(); save(); }
  else if(t.id==="copy"){
    const tot=ligneCourses(); let txt="Liste de courses\n";
    RAYONS.forEach(r=>{ const it=Object.keys(tot).filter(i=>ING[i].r===r).sort((a,b)=>a.localeCompare(b,"fr"));
      if(it.length){ txt+="\n"+r+"\n"+it.map(i=>"- "+i+" : "+nf.format(Math.round(tot[i]*100)/100)+" "+ING[i].u).join("\n")+"\n"; }});
    navigator.clipboard.writeText(txt).then(()=>{ t.textContent="Copié ✓";
      setTimeout(()=>t.textContent="Copier la liste",1800); })
      .catch(()=>{ t.textContent="Copie refusée par le navigateur"; });
  }
  else if(t.id==="uncheck"){ done={}; renderListe(); save(); }
  else if(t.id==="clear"){ sel={}; done={}; open={}; render(); }
  else if(t.id==="f-new"){ F.neuf=!F.neuf; t.setAttribute("aria-pressed",F.neuf); renderGrid(); }
  else if(t.id==="f-sel"){ F.mine=!F.mine; t.setAttribute("aria-pressed",F.mine); renderGrid(); }
  else if(t.id==="f-sort"){ F.tri = F.tri==="temps"?"nom":"temps";
    t.setAttribute("aria-pressed", F.tri==="temps");
    t.textContent = F.tri==="temps"?"Trier par temps":"Trier par nom"; renderGrid(); }
  else if(t.id==="t-r"||t.id==="t-l"){ const r = t.id==="t-r";
    document.getElementById("t-r").setAttribute("aria-selected",r);
    document.getElementById("t-l").setAttribute("aria-selected",!r);
    document.getElementById("v-r").classList.toggle("hide",!r);
    document.getElementById("v-l").classList.toggle("hide",r);
    window.scrollTo({top:0}); }
  else if(t.closest("#f-type")){ F.type=d.v;
    [...t.parentElement.children].forEach(c=>c.setAttribute("aria-pressed",c===t)); renderGrid(); }
  else if(t.closest("#f-time")){ F.time=d.v;
    [...t.parentElement.children].forEach(c=>c.setAttribute("aria-pressed",c===t)); renderGrid(); }
});
document.addEventListener("keydown", e=>{
  if((e.key===" "||e.key==="Enter") && e.target.classList?.contains("item")){
    e.preventDefault(); e.target.click(); }
});
document.getElementById("q").addEventListener("input", e=>{ F.q=e.target.value; renderGrid(); });

async function boot(){
  try{
    const res = await fetch("./data/recettes.json", {cache:"no-cache"});
    if(!res.ok) throw new Error("HTTP "+res.status);
    DATA = await res.json();
  }catch(err){
    document.getElementById("grid").innerHTML =
      '<p class="empty">Impossible de charger <code>data/recettes.json</code> ('+err.message+
      '). En local, ouvrez le site avec <code>python3 -m http.server</code> plutôt qu\'en '+
      'double-cliquant sur le fichier : le navigateur bloque la lecture de fichiers en file://.</p>';
    return;
  }
  RAYONS = DATA.rayons; ING = DATA.ingredients; RECS = DATA.recettes;
  RECS.forEach(r=>byName[r.nom]=r);
  document.querySelector(".sub").textContent =
    RECS.length+" recettes · quantités par personne · liste groupée par rayon";
  render();
}
boot();

if("serviceWorker" in navigator){
  window.addEventListener("load", ()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
