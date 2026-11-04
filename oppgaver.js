/* ==========================================================================
   Dinoparken – oppgavemotor  (oppgaver.js)
   --------------------------------------------------------------------------
   Felles for alle innhegningene. En innhegningsside laster denne fila og
   kaller  DinoOppgaver.open('klokke', { enc:1 })  når eleven trykker på en
   stasjon.

   Fem stasjoner (samme i alle innhegninger, ulik kulisse):
     klokke  – Fôringstavla   (hel og halv time, 24-timers digital)
     penger  – Kiosken        (norske kroner)
     tier    – Rugeriet       (10-er-venner)
     lyder   – Brøleren       (første lyd)
     stavelser – Skiltstien   (lese ord med én og to stavelser)

   Lagring:
     dinoparken-v8          – parkens lagring (mynter, egg, unger). Deles med index.html
     dinoparken-laering-v1  – læringsfremgang (nivå, historikk, repetisjon)

   Juster tallene i LÆRING nedenfor for å endre balansen.
   ========================================================================== */
(function(){
'use strict';

/* ---------- Innstillinger ---------- */
const LÆRING = {
  rundeLengde: 5,        // oppgaver per runde
  maksRunde: 8,          // maks antall oppgaver når feil gir ekstra oppgaver
  mynterFørsteForsøk: 2, // mynter for riktig på første forsøk
  mynterAndreForsøk: 1,  // mynter for riktig på andre forsøk
  repetisjonsGange: 2,   // lysende stasjon (repetisjon) gir så mange ganger mynter
  mestringAv: 10,        // ser på de siste så mange oppgavene på et nivå …
  mestringKrav: 8,       // … og så mange må være riktige for stjerne og nytt nivå
  storeBokstaver: true,  // Skiltstien: true = STORE BOKSTAVER, false = små bokstaver
  repetisjonDager: [1, 3, 7, 14, 30], // når et mestret tema skal repeteres (dager)
  voksenKode: '1234',    // samme som i index.html – bytt begge steder
};
const PARK = { key:'dinoparken-v8', startCoins:20, eggWarm:4, grow:[3,5] };   // må stemme med CONFIG i index.html
const LKEY = 'dinoparken-laering-v1';
const BYGDE_NIVÅ = 2;    // nivåer som er laget så langt

/* ---------- Kulisse per innhegning ---------- */
const KULISSE = {
  1: { dino:'triceratopsene', dinoEn:'triceratopsen', mat:'bregner', matEn:'bregne',
       kiosk:[['Bregneis','🍦'],['Dinoburger','🍔'],['Hornhatt','🎩'],['Eggkjeks','🍪'],['Saft','🧃'],['Dinobamse','🧸'],['Postkort','✉️'],['Ballong','🎈']] },
  2: { dino:'langhalsene', dinoEn:'brachiosaurusen', mat:'tretopper', matEn:'grein', kiosk:[['Bladis','🍦'],['Langhalsbamse','🧸'],['Saft','🧃']] },
  3: { dino:'T-rexen', dinoEn:'T-rexen', mat:'kjøttbiter', matEn:'kjøttbit', kiosk:[['Tannkjeks','🍪'],['T-rex-hatt','🎩'],['Saft','🧃']] },
  4: { dino:'raptorene', dinoEn:'raptoren', mat:'kjøttbiter', matEn:'kjøttbit', kiosk:[['Raptorkjeks','🍪'],['Fjærhatt','🎩'],['Saft','🧃']] },
  5: { dino:'flygeøglene', dinoEn:'pteranodonen', mat:'fisker', matEn:'fisk', kiosk:[['Fiskeis','🍦'],['Vingehatt','🎩'],['Saft','🧃']] },
  6: { dino:'stegosaurusene', dinoEn:'stegosaurusen', mat:'sumpplanter', matEn:'plante', kiosk:[['Sumpis','🍦'],['Piggbamse','🧸'],['Saft','🧃']] },
};

const STASJONER = [
  { id:'klokke',    navn:'Fôringstavla', tema:'Klokka',            ikon:'🕒', farge:'#3f86c9' },
  { id:'penger',    navn:'Kiosken',      tema:'Penger',            ikon:'🪙', farge:'#e0a21f' },
  { id:'tier',      navn:'Rugeriet',     tema:'10-er-venner',      ikon:'🥚', farge:'#e0782f' },
  { id:'lyder',     navn:'Brøleren',     tema:'Lyder i ord',       ikon:'📣', farge:'#c2453a' },
  { id:'stavelser', navn:'Skiltstien',   tema:'Lese ord',          ikon:'🪧', farge:'#7d64c4' },
];
const NIVÅNAVN = {
  klokke:    ['Hele timer', 'Halv', 'Kvart over', 'Kvart på', 'Alt blandet', 'Ettermiddag (24 t)'],
  penger:    ['Kjenn myntene', 'Betal nøyaktig til 50 kr', 'Sedler til 200 kr', 'Vekslebua', 'Opp til 500 kr', 'Penger tilbake'],
  tier:      ['Se mengden', 'Hvor mange mangler?', 'Bare tall', 'Vennepar', '100-venner'],
  lyder:     ['Første lyd (2 valg)', 'Første lyd (4 valg)', 'Siste lyd', 'Lyden i midten', 'Fotsporboksene'],
  stavelser: ['Korte ord', 'To stavelser med buer', 'To stavelser uten buer', 'Hør og finn ordet', 'Små setninger'],
};

/* ---------- Ord (bilder i bilder/ord/, innlest i lyd/ord-<fil>.mp3 – samme som Myntlands Lydverksted) ---------- */
const LYDORD = [ // f = første bokstav/lyd
  ['sol','sol','S'],['mus','mus','M'],['bil','bil','B'],['hus','hus','H'],['tog','tog','T'],['rev','rev','R'],
  ['sag','sag','S'],['lys','lys','L'],['dør','door','D'],['bok','bok','B'],['hatt','hatt','H'],['gutt','gutt','G'],
  ['penn','penn','P'],['kam','kam','K'],['katt','katt','K'],['tann','tann','T'],['buss','buss','B'],['bål','baal','B'],
  ['gås','gaas','G'],['bær','baer','B'],['nøtt','noett','N'],['ring','ring','R'],['fisk','fisk','F'],['eple','eple','E'],
  ['ape','ape','A'],['ugle','ugle','U'],['øye','oeye','Ø'],['kake','kake','K'],['nese','nese','N'],['jakke','jakke','J'],
  ['løve','loeve','L'],['vaffel','vaffel','V'],['is','is','I'],['ost','ost','O'],['egg','egg','E'],['ku','ku','K'],
  ['stol','stol','S'],['sko','sko','S'],['gris','gris','G'],['hund','hund','H'],['fugl','fugl','F'],['måne','maane','M'],
  ['sekk','sekk','S'],['lue','lue','L'],['tre','tre','T'],['klokke','klokke','K'],['due','due','D'],['pose','pose','P'],
  ['ballong','ballong','B'],['sitron','sitron','S'],['banan','banan','B'],['jente','jente','J'],['zebra','zebra','Z'],
].map(([ord,fil,f])=>({ord,fil,f}));
const STAVORD = [
  ['sol','sol',['SOL']],['hus','hus',['HUS']],['mus','mus',['MUS']],['katt','katt',['KATT']],['bil','bil',['BIL']],
  ['tre','tre',['TRE']],['sko','sko',['SKO']],['is','is',['IS']],['gris','gris',['GRIS']],['egg','egg',['EGG']],
  ['fisk','fisk',['FISK']],['ost','ost',['OST']],['bok','bok',['BOK']],['tog','tog',['TOG']],['hund','hund',['HUND']],
  ['ape','ape',['A','PE']],['kake','kake',['KA','KE']],['lue','lue',['LU','E']],['due','due',['DU','E']],
  ['pose','pose',['PO','SE']],['rose','rose',['RO','SE']],['løve','loeve',['LØ','VE']],['måne','maane',['MÅ','NE']],
  ['nese','nese',['NE','SE']],['jente','jente',['JEN','TE']],['ugle','ugle',['UG','LE']],['banan','banan',['BA','NAN']],
  ['sitron','sitron',['SI','TRON']],['agurk','agurk',['A','GURK']],['okse','okse',['OK','SE']],['jakke','jakke',['JAK','KE']],
  ['bakke','bakke',['BAK','KE']],['klokke','klokke',['KLOK','KE']],['eple','eple',['EP','LE']],['sykkel','sykkel',['SYK','KEL']],
  ['zebra','zebra',['ZE','BRA']],['jojo','jojo',['JO','JO']],['øre','oere',['Ø','RE']],['ubåt','ubaat',['U','BÅT']],
].map(([ord,fil,stav])=>({ord,fil,stav}));
const TO_STAV = STAVORD.filter(o=>o.stav.length===2);
/* Korte, lydrette ord til lesing på nivå 1 (ingen stumme bokstaver) */
const ENSTAV = ['sol','mus','bil','hus','rev','sag','lys','hatt','penn','kam','katt','tann','buss','bål','gås','bær','nøtt','sekk','fisk','is','ost','egg','ku','sko','gris','stol','tre','bok']
  .map(ord=>{ const x=LYDORD.find(y=>y.ord===ord); return { ord, fil:x.fil, stav:[ord.toUpperCase()] }; });
const BOKSTAVER = 'ABDEFGHIJKLMNOPRSTUVØ'.split('');
const BOKSTAVFIL = b => ({ 'Æ':'AE','Ø':'OE','Å':'AA' }[b] || b);

/* ---------- Små hjelpere ---------- */
const rnd = n => Math.floor(Math.random()*n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const pad = n => String(n).padStart(2,'0');
const dayStr = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays = n => { const d=new Date(); d.setDate(d.getDate()+n); return dayStr(d); };
const el = (tag, cls, html) => { const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
const imgFor = fil => `<img class="do-pic" src="bilder/ord/${fil}.webp" alt="" onerror="this.onerror=null;this.src='https://myntland.no/bilder/lyd/${fil}.webp'">`;

/* ---------- Lagring ---------- */
function lesLæring(){
  let s=null; try{ s=JSON.parse(localStorage.getItem(LKEY)); }catch(e){}
  s = s || {};
  s.tema = s.tema || {};
  for(const st of STASJONER){
    const t = s.tema[st.id] = s.tema[st.id] || {};
    t.nivå = t.nivå || 1; t.hist = t.hist || {}; t.mestret = t.mestret || [];
    t.rep = t.rep || null; // { steg, neste:'YYYY-MM-DD' }
    t.runder = t.runder || 0;
  }
  return s;
}
function lagreLæring(s){ try{ localStorage.setItem(LKEY, JSON.stringify(s)); }catch(e){} }
function lesPark(){
  let s=null; try{ s=JSON.parse(localStorage.getItem(PARK.key)); }catch(e){}
  if(!s){ const y=new Date(); y.setDate(y.getDate()-1);
    s={ coins:PARK.startCoins, owned:[1], dinos:{}, eggs:{ 1:{ warm:PARK.eggWarm-1, day:dayStr(y) } } }; }
  s.dinos=s.dinos||{}; s.eggs=s.eggs||{};
  return s;
}
function lagrePark(s){ try{ localStorage.setItem(PARK.key, JSON.stringify(s)); }catch(e){} }

/* Én fullført runde = ett «oppdrag» i parken: varmer egget eller får en unge til å vokse (samme regel som index.html) */
function parkFremgang(enc){
  const s=lesPark(), g=s.eggs[enc];
  let msg='';
  if(g && g.warm<PARK.eggWarm){
    g.warm++;
    msg = g.warm>=PARK.eggWarm ? (dayStr()>g.day ? 'Egget er klart til å klekkes! Gå tilbake til parken.' : 'Egget er varmt nok! Nå må det ligge over natten.') : `Egget i rugekassa ble varmere (${g.warm} av ${PARK.eggWarm}).`;
  } else {
    const list=s.dinos[enc]||[]; let idx=-1;
    list.forEach((x,i)=>{ if(x.stage<2 && (idx<0 || x.stage<list[idx].stage)) idx=i; });
    if(idx>=0){
      const x=list[idx], navn=x.name||'Ungen'; x.xp=(x.xp||0)+1;
      if(x.xp>=PARK.grow[x.stage]){ x.stage++; x.xp=0; msg=`${navn} vokste seg større!`; }
      else msg=`${navn} vokser (${x.xp} av ${PARK.grow[x.stage]}).`;
    }
  }
  lagrePark(s);
  return msg;
}
function gimynter(n){ const s=lesPark(); s.coins=(s.coins||0)+n; lagrePark(s); return s.coins; }

/* ---------- Status som innhegningssiden viser på stasjonsskiltene ---------- */
function status(id){
  const t=lesLæring().tema[id];
  const forfall = !!(t.rep && dayStr()>=t.rep.neste);
  return { nivå:t.nivå, stjerner:t.mestret.length, forfall, nivånavn:NIVÅNAVN[id][t.nivå-1] };
}

/* ==========================================================================
   Lyd: innleste filer først, ellers nettleserens norske stemme
   ========================================================================== */
const Lyd = (()=>{
  let kø=[], aktiv=null, stemme=null, tok=0;
  const finnStemme = () => {
    if(!('speechSynthesis' in window)) return null;
    const v=speechSynthesis.getVoices();
    return v.find(x=>/^nb/i.test(x.lang)) || v.find(x=>/^no/i.test(x.lang)) || v.find(x=>/^nn/i.test(x.lang)) || null;
  };
  if('speechSynthesis' in window){ stemme=finnStemme(); speechSynthesis.onvoiceschanged=()=>{ stemme=finnStemme(); }; }
  function stopp(){ tok++; kø=[]; if(aktiv&&aktiv.pause) aktiv.pause(); aktiv=null; if('speechSynthesis' in window) speechSynthesis.cancel(); }
  function neste(t){
    if(t!==tok) return;
    const x=kø.shift(); if(!x){ aktiv=null; return; }
    if(x.pause){ setTimeout(()=>neste(t), x.pause); return; }
    if(x.fil){
      const a=new Audio(x.fil); aktiv=a;
      a.onended=()=>neste(t); a.onerror=()=>{ x.reserve ? (kø.unshift({tts:x.reserve}), neste(t)) : neste(t); };
      a.play().catch(()=>{ x.reserve ? (kø.unshift({tts:x.reserve}), neste(t)) : neste(t); });
      return;
    }
    if(x.tts && 'speechSynthesis' in window){
      const u=new SpeechSynthesisUtterance(x.tts); u.lang='nb-NO'; if(stemme) u.voice=stemme; u.rate=.92;
      u.onend=()=>neste(t); u.onerror=()=>neste(t); aktiv=u; speechSynthesis.speak(u); return;
    }
    neste(t);
  }
  /* spill([...]) – elementer: 'tekst', {ord:'fil'}, {bokstav:'S'}, {klipp:'navn'}, {tall:7}, {pause:300}
     Innlest fil spilles hvis den finnes – ellers leses teksten med nettleserens norske stemme. */
  function tilElement(x){
    if(typeof x==='string') return {tts:x};
    if(x.ord) return {fil:`lyd/ord-${x.ord}.mp3`, reserve:x.reserve};
    if(x.bokstav) return {fil:`lyd/${BOKSTAVFIL(x.bokstav)}.mp3`, reserve:x.bokstav.toLowerCase()};
    if(x.klipp) return {fil:`lyd/dino/${x.klipp}.mp3`, reserve:KLIPP[x.klipp]||''};
    if(x.tall!=null) return {fil:`lyd/tall-${x.tall}.mp3`, reserve:String(x.tall)};
    return x;
  }
  const liste2 = l => (Array.isArray(l)?l:[l]).filter(Boolean).map(tilElement);
  function spill(liste){ stopp(); const t=tok; kø=liste2(liste); neste(t); }
  /* leggTil([...]) – spilles etter det som spilles nå (eller med en gang hvis det er stille) */
  function leggTil(liste){ if(!aktiv && !kø.length){ spill(liste); return; } kø.push(...liste2(liste)); }
  /* Små effektlyder uten filer */
  let ac=null;
  function pip(ok){
    try{
      ac=ac||new (window.AudioContext||window.webkitAudioContext)();
      const n=ok?[523,659,784]:[330,262], t0=ac.currentTime;
      n.forEach((f,i)=>{ const o=ac.createOscillator(), g=ac.createGain(); o.type=ok?'triangle':'sine'; o.frequency.value=f;
        g.gain.setValueAtTime(.0001,t0+i*.09); g.gain.exponentialRampToValueAtTime(.18,t0+i*.09+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+i*.09+.25);
        o.connect(g).connect(ac.destination); o.start(t0+i*.09); o.stop(t0+i*.09+.3); });
    }catch(e){}
  }
  return { spill, stopp, pip, leggTil };
})();

/* ==========================================================================
   Tegnehjelpere: klokke, mynter, eggkasse
   ========================================================================== */
const TIMEORD = ['tolv','ett','to','tre','fire','fem','seks','sju','åtte','ni','ti','elleve'];
const timeOrd = h => TIMEORD[((h%12)+12)%12];
function klokkeOrd(h,m){
  if(m===0)  return `klokka ${timeOrd(h)}`;
  if(m===30) return `halv ${timeOrd(h+1)}`;
  if(m===15) return `kvart over ${timeOrd(h)}`;
  if(m===45) return `kvart på ${timeOrd(h+1)}`;
  return `${pad(h)}:${pad(m)}`;
}
const digital = (h,m) => `${pad(h)}:${pad(m)}`;

function klokkeSVG(h,m,{str=220, id=''}={}){
  const min=m*6, tim=((h%12)+m/60)*30;
  let s=`<svg class="do-klokke" ${id?`id="${id}"`:''} viewBox="-110 -110 220 220" width="${str}" height="${str}" role="img" aria-label="Analog klokke">
    <circle r="104" fill="#fffdf6" stroke="#1f3b2c" stroke-width="7"/>`;
  for(let i=0;i<60;i++){ const a=i*6*Math.PI/180, r1=i%5?92:86; s+=`<line x1="${Math.sin(a)*r1}" y1="${-Math.cos(a)*r1}" x2="${Math.sin(a)*97}" y2="${-Math.cos(a)*97}" stroke="#1f3b2c" stroke-width="${i%5?1.5:3.5}"/>`; }
  for(let i=1;i<=12;i++){ const a=i*30*Math.PI/180; s+=`<text x="${Math.sin(a)*70}" y="${-Math.cos(a)*70+8}" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="24" fill="#1f3b2c">${i}</text>`; }
  s+=`<g class="do-tim" transform="rotate(${tim})"><line y1="10" y2="-46" stroke="#c2453a" stroke-width="11" stroke-linecap="round"/></g>
      <g class="do-min" transform="rotate(${min})"><line y1="12" y2="-82" stroke="#3f86c9" stroke-width="7" stroke-linecap="round"/><circle cy="-82" r="9" fill="#3f86c9" class="do-tak"/></g>
      <circle r="8" fill="#1f3b2c"/></svg>`;
  return s;
}
const MYNT = { 1:{r:25,c1:'#e7e9ec',c2:'#a9afb6',hull:true}, 5:{r:31,c1:'#e7e9ec',c2:'#a9afb6',hull:true}, 10:{r:29,c1:'#f3d57a',c2:'#c29a2e'}, 20:{r:34,c1:'#f3d57a',c2:'#c29a2e'} };
function myntSVG(v){
  const k=MYNT[v], r=k.r, d=r*2+6;
  return `<svg class="do-mynt" width="${d}" height="${d}" viewBox="${-r-3} ${-r-3} ${d} ${d}" aria-label="${v} kroner">
    <circle r="${r}" fill="${k.c1}" stroke="${k.c2}" stroke-width="4"/>
    <circle r="${r-6}" fill="none" stroke="${k.c2}" stroke-width="1.5" stroke-dasharray="2 3"/>
    ${k.hull?`<circle r="${r*.22}" fill="#fffdf6" stroke="${k.c2}" stroke-width="2"/><text y="${-r*.38}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${r*.5}" fill="#4d545b">${v}</text>`
            :`<text y="${r*.28}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${r*.8}" fill="#6b4f10">${v}</text>`}
  </svg>`;
}
function eggkasse(n,{tom=0, ikon='egg', fremhev=false}={}){ // tierramme 2 × 5
  let s='<div class="do-ramme">';
  for(let i=0;i<10;i++){
    const full=i<n;
    s+=`<div class="do-rute${full?' full':''}${(!full&&fremhev)?' mangler':''}" data-i="${i}">${full?(ikon==='egg'?'<span class="do-egg"></span>':'<span class="do-blad">🌿</span>'):''}${(!full&&fremhev)?`<b>${i-n+1}</b>`:''}</div>`;
  }
  return s+'</div>';
}

/* ==========================================================================
   OPPGAVEGENERATORER
   Hver generator lager en oppgave: { tema, nivå, tekst, si, tegn(boks, svar), forklar(boks) }
   svar(true/false) kalles av oppgaven når eleven har svart.
   ========================================================================== */
function valgknapper(boks, valg, riktig, svar, {stor=false, html=null}={}){
  const rad=el('div','do-valg'+(stor?' stor':''));
  shuffle(valg).forEach(v=>{
    const b=el('button','do-knapp', html?html(v):String(v));
    b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(v===riktig?'rett':'feil'); svar(v===riktig, v); };
    rad.appendChild(b);
  });
  boks.appendChild(rad); return rad;
}
function tallknapper(boks, fra, til, riktig, svar){
  const rad=el('div','do-tallpad');
  for(let v=fra; v<=til; v++){
    const b=el('button','do-knapp tall', String(v));
    b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(v===riktig?'rett':'feil'); svar(v===riktig, v); };
    rad.appendChild(b);
  }
  boks.appendChild(rad);
}

/* ---------- KLOKKA ---------- */
function klokkeTid(nivå){
  if(nivå===1) return [8+rnd(5), 0];                   // 08:00–12:00
  return Math.random()<.7 ? [8+rnd(4), 30] : [8+rnd(5), 0];   // mest halve, litt hele som kontrast
}
function andreTider(h,m,nivå,ant){
  const ut=new Set([digital(h,m)]), liste=[];
  const kandidater=[];
  if(nivå>=2 && m===30) kandidater.push([h+1,30],[h,0],[h+1,0]);   // klassiske feil: «halv ni» = 09:30
  for(let i=0;i<20;i++) kandidater.push(klokkeTid(nivå));
  for(const [a,b] of kandidater){ if(a<1||a>23) continue; const d=digital(a,b); if(!ut.has(d)){ ut.add(d); liste.push([a,b]); } if(liste.length>=ant) break; }
  return liste;
}
function forklarKlokke(boks,h,m){
  boks.innerHTML=`<div class="do-forklar">${klokkeSVG(h,m,{str:150})}<div><p class="do-stor">${digital(h,m)}</p><p>Det heter <b>${klokkeOrd(h,m)}</b>.</p>
    ${m===30?`<p>Den lange viseren peker rett ned på 6. Den korte står midt mellom ${h%12||12} og ${(h%12)+1}. Det er en halv time igjen til ${timeOrd(h+1)} – derfor heter det <b>halv ${timeOrd(h+1)}</b>.</p>`
            :`<p>Den lange viseren peker rett opp på 12. Den korte peker på ${h%12||12}.</p>`}</div></div>`;
  Lyd.leggTil([k('det-heter'), tid(h,m)]);
}
const KLOKKE = {
  les(nivå,K){ // analog → velg digital
    const [h,m]=klokkeTid(nivå);
    return { tekst:`Se på fôringsklokka. Når kommer ${K.mat}ne?`, si:[k('klokke-les')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${klokkeSVG(h,m)}</div>`;
        const valg=[[h,m],...andreTider(h,m,nivå,2)].map(([a,b])=>digital(a,b));
        valgknapper(boks,valg,digital(h,m),svar,{html:v=>`<span class="do-digital">${v}</span>`}); },
      forklar(boks){ forklarKlokke(boks,h,m); }, sjekk:[h,m] };
  },
  ord(nivå,K){ // ord → velg analog
    const [h,m]=klokkeTid(nivå), riktig=digital(h,m);
    return { tekst:`${cap(K.dino)} skal få mat <b>${klokkeOrd(h,m)}</b>. Hvilken klokke viser det?`, si:[k(`e${K.id}-faar-mat`), tid(h,m), k('hvilken-klokke')],
      tegn(boks,svar){ const valg=[[h,m],...andreTider(h,m,nivå,2)];
        const rad=el('div','do-valg klokker');
        shuffle(valg).forEach(([a,b])=>{ const k=el('button','do-knapp klokkeknapp',klokkeSVG(a,b,{str:150}));
          k.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); const ok=digital(a,b)===riktig; k.classList.add(ok?'rett':'feil'); svar(ok); };
          rad.appendChild(k); });
        boks.appendChild(rad); },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
  still(nivå,K){ // digital → still analog (viserne henger sammen)
    const [h,m]=klokkeTid(nivå);
    const startH = h===8?11:8;
    return { tekst:`Fôringa er klokka <span class="do-digital liten">${digital(h,m)}</span>. Dra den lange viseren og still klokka.`,
      si:[k('foringa-er'), tid(h,m), k('dra-viseren')],
      tegn(boks,svar){
        let tot=startH*60;
        boks.innerHTML=`<div class="do-midt do-still">${klokkeSVG(startH,0,{str:260,id:'doStill'})}</div>
          <div class="do-valg"><button class="do-knapp liten" data-d="-30">◀ 30 min</button><button class="do-knapp go" data-ok>Ferdig</button><button class="do-knapp liten" data-d="30">30 min ▶</button></div>`;
        const svg=boks.querySelector('#doStill'), tim=svg.querySelector('.do-tim'), min=svg.querySelector('.do-min');
        const vis=()=>{ const mm=((tot%60)+60)%60, hh=Math.floor(tot/60); min.setAttribute('transform',`rotate(${mm*6})`); tim.setAttribute('transform',`rotate(${((hh%12)+mm/60)*30})`); };
        let drar=false, forrige=0;
        const vinkel=ev=>{ const r=svg.getBoundingClientRect(); return Math.atan2(ev.clientX-(r.left+r.width/2), -(ev.clientY-(r.top+r.height/2)))*180/Math.PI; };
        svg.addEventListener('pointerdown',ev=>{ drar=true; forrige=vinkel(ev); svg.setPointerCapture(ev.pointerId); ev.preventDefault(); });
        svg.addEventListener('pointermove',ev=>{ if(!drar) return; const v=vinkel(ev); let d=v-forrige; if(d>180) d-=360; if(d<-180) d+=360; forrige=v; tot+=d/6; vis(); });
        const slipp=()=>{ if(!drar) return; drar=false; tot=Math.round(tot/5)*5; vis(); };
        svg.addEventListener('pointerup',slipp); svg.addEventListener('pointercancel',slipp);
        boks.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{ tot=Math.round(tot/5)*5+Number(b.dataset.d); vis(); });
        boks.querySelector('[data-ok]').onclick=()=>{ const ok=((tot%720)+720)%720===((h*60+m)%720); boks.querySelectorAll('button').forEach(x=>x.disabled=true); svar(ok); };
      },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
  navn(nivå,K){ // analog → hva heter klokka (halv-fella)
    const h=8+rnd(4), m=30;
    const riktig=klokkeOrd(h,m), valg=[riktig, `halv ${timeOrd(h)}`, `klokka ${timeOrd(h)}`];
    return { tekst:`Hva heter klokka på fôringstavla?`, si:[k('hva-heter-klokka')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${klokkeSVG(h,m)}</div>`;
        valgknapper(boks,valg,riktig,svar); },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
};
function lagKlokke(nivå,K){ const typer=nivå===1?['les','ord','still']:['les','ord','still','navn','navn']; return KLOKKE[pick(typer)](nivå,K); }

/* ---------- PENGER ---------- */
function forklarSum(boks,mynter,pris){
  const sum=mynter.reduce((a,b)=>a+b,0);
  boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${mynter.map(myntSVG).join('')||'<i>ingen mynter</i>'}</div>
    <div><p>${mynter.length?mynter.join(' + ')+' = <b>'+sum+' kr</b>':'Du la ikke på noen mynter.'}</p>
    ${pris!=null?`<p>Prisen er <b>${pris} kr</b>. ${sum<pris?`Det mangler <b>${pris-sum} kr</b>.`:sum>pris?`Det er <b>${sum-pris} kr</b> for mye.`:'Det stemmer!'}</p>`:''}</div></div>`;
}
function myntForslag(pris){ const ut=[]; let r=pris; for(const v of [20,10,5,1]) while(r>=v){ ut.push(v); r-=v; } return ut; }
const PENGER = {
  finn(){ // trykk på riktig mynt
    const mål=pick([1,5,10,20]);
    const liste=shuffle([mål, ...shuffle([1,5,10,20,1,5,10,20].filter(v=>v!==mål)).slice(0,4)]);
    return { tekst:`Kiosken trenger en <b>${mål}-krone</b>. Trykk på den.`, si:[k('kiosken-trenger'), k(`mynt-${mål}`), k('trykk-paa-den')],
      tegn(boks,svar){ const rad=el('div','do-valg mynter');
        liste.forEach(v=>{ const b=el('button','do-knapp myntknapp',myntSVG(v)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(v===mål?'rett':'feil'); svar(v===mål); }; rad.appendChild(b); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${myntSVG(mål)}</div><div><p>Dette er en <b>${mål}-krone</b>. ${mål>=10?'10- og 20-kronene er gull.':'1- og 5-kronene er sølv og har hull i midten.'}</p></div></div>`; } };
  },
  verdi(){ // hvor mye er mynten verdt
    const v=pick([1,5,10,20]);
    return { tekst:`Hvor mye er denne mynten verdt?`, si:[k('hvor-mye-mynten')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-stormynt">${myntSVG(v)}</div>`; valgknapper(boks,[1,5,10,20],v,svar,{html:x=>`${x} kr`}); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${myntSVG(v)}</div><div><p>Tallet på mynten viser hva den er verdt: <b>${v} kroner</b>.</p></div></div>`; } };
  },
  betal(nivå,K){ // legg nøyaktig beløp på disken
    const [vare,ikon]=pick(K.kiosk), pris=3+rnd(48);
    let lagt=[];
    return { tekst:`<span class="do-vare">${ikon}</span> ${vare} koster <b>${pris} kr</b>. Legg nøyaktig ${pris} kr på disken.`,
      si:[k(`vare-${slug(vare)}`), k('koster'), {tall:pris}, k('kroner'), k('legg-noyaktig'), {tall:pris}, k('kroner-paa-disken')],
      tegn(boks,svar){
        lagt=[];
        boks.innerHTML=`<div class="do-disk"><div class="do-disktopp">Disken <span class="do-sum">0 kr</span></div><div class="do-myntrad" data-disk></div></div>
          <div class="do-lommebok">${[1,5,10,20].map(v=>`<button class="do-knapp myntknapp" data-v="${v}">${myntSVG(v)}</button>`).join('')}</div>
          <p class="do-tips">Trykk på en mynt for å legge den på disken. Trykk på mynten på disken for å ta den tilbake.</p>
          <div class="do-valg"><button class="do-knapp go" data-ok>Betal</button></div>`;
        const disk=boks.querySelector('[data-disk]'), sum=boks.querySelector('.do-sum');
        const vis=()=>{ disk.innerHTML=lagt.map((v,i)=>`<button class="do-knapp myntknapp liten" data-i="${i}">${myntSVG(v)}</button>`).join(''); sum.textContent=lagt.reduce((a,b)=>a+b,0)+' kr'; };
        boks.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{ if(lagt.length<20){ lagt.push(+b.dataset.v); lagt.sort((a,b)=>b-a); vis(); } });
        disk.onclick=ev=>{ const b=ev.target.closest('[data-i]'); if(b){ lagt.splice(+b.dataset.i,1); vis(); } };
        boks.querySelector('[data-ok]').onclick=()=>{ if(!lagt.length) return; boks.querySelectorAll('button').forEach(x=>x.disabled=true); svar(lagt.reduce((a,b)=>a+b,0)===pris); };
      },
      forklar(boks){ forklarSum(boks,lagt,pris); boks.insertAdjacentHTML('beforeend',`<p class="do-tips">Én måte å betale ${pris} kr på: ${myntForslag(pris).join(' + ')}.</p>`); } };
  },
  tell(){ // hvor mye ligger i kassa
    const n=2+rnd(3); let m=[]; for(let i=0;i<n;i++) m.push(pick([1,5,10,20])); m.sort((a,b)=>b-a);
    while(m.reduce((a,b)=>a+b,0)>50) m.shift();
    const sum=m.reduce((a,b)=>a+b,0);
    const valg=[...new Set([sum, sum+pick([1,5,10]), Math.max(1,sum-pick([1,5,10])), sum+pick([2,4])])].slice(0,3);
    return { tekst:`Hvor mye penger ligger i kassa?`, si:[k('hvor-mye-kassa')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-myntrad stor">${m.map(myntSVG).join('')}</div>`; valgknapper(boks,valg,sum,svar,{html:x=>`${x} kr`}); },
      forklar(boks){ forklarSum(boks,m,null); boks.insertAdjacentHTML('beforeend','<p class="do-tips">Tips: tell de største myntene først.</p>'); } };
  },
};
function lagPenger(nivå,K){ return nivå===1 ? PENGER[pick(['finn','finn','verdi'])](nivå,K) : PENGER[pick(['betal','betal','tell'])](nivå,K); }

/* ---------- 10-ER-VENNER ---------- */
const TIER = {
  hvorMange(){ const n=1+rnd(10);
    const valg=shuffle([...new Set([n, ...shuffle([n-1,n+1,n-2,n+2,10-n].filter(v=>v>=0&&v<=10&&v!==n))])]).slice(0,4);
    if(!valg.includes(n)) valg[0]=n;
    return { tekst:`Hvor mange egg ligger i rugekassa?`, si:[k('hvor-mange-egg')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(n)}</div>`; valgknapper(boks,valg,n,svar,{stor:true}); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n)}<div><p>${n>=5?`Øverste rad er full – det er <b>5</b>. ${n>5?`Pluss ${n-5} nederst blir <b>${n}</b>.`:''}`:`Det ligger <b>${n}</b> egg.`}</p></div></div>`; } };
  },
  legg(nivå,K){ const n=2+rnd(9);
    return { tekst:`Legg <b>${n}</b> egg i rugekassa. Trykk på rutene.`, si:[k('legg'), {tall:n}, k('egg-i-rugekassa')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(0)}</div><div class="do-valg"><button class="do-knapp go" data-ok>Ferdig</button></div>`;
        let fylt=new Set();
        boks.querySelectorAll('.do-rute').forEach(r=>r.onclick=()=>{ const i=+r.dataset.i; if(fylt.has(i)){ fylt.delete(i); r.classList.remove('full'); r.innerHTML=''; } else { fylt.add(i); r.classList.add('full'); r.innerHTML='<span class="do-egg"></span>'; } });
        boks.querySelector('[data-ok]').onclick=()=>{ boks.querySelectorAll('button,.do-rute').forEach(x=>{x.disabled=true; x.onclick=null;}); svar(fylt.size===n); }; },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n)}<div><p>${n} egg ser slik ut. ${n>=5?`En full rad (5) ${n>5?`og ${n-5} til`:''}.`:''}</p></div></div>`; } };
  },
  mangler(nivå,K){ const n=1+rnd(9), ikon=Math.random()<.5?'egg':'blad';
    const tekst = ikon==='egg' ? `Rugekassa har plass til 10 egg. Det ligger ${n} egg. <b>Hvor mange mangler?</b>` : `Fôrbøtta tar 10 ${K.mat}. Det er ${n} oppi. <b>Hvor mange mangler?</b>`;
    const si = ikon==='egg' ? [k('rugekassa-plass'), {tall:n}, k('egg-mangler')] : [k(`e${K.id}-botta`), {tall:n}, k('oppi-mangler')];
    return { tekst, si,
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(n,{ikon})}</div>`; tallknapper(boks,0,10,10-n,svar); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n,{ikon,fremhev:true})}<div><p>Tell de tomme rutene: det mangler <b>${10-n}</b>.</p><p class="do-stor">${n} + ${10-n} = 10</p><p>${n} og ${10-n} er 10-er-venner!</p></div></div>`; } };
  },
  venn(nivå,K){ const n=1+rnd(9);
    return { tekst:`<span class="do-stor">${n} + ? = 10</span><br>Finn 10-er-vennen til ${n}.`, si:[{tall:n}, k('pluss-hva-blir-ti')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(n)}</div>`; tallknapper(boks,0,10,10-n,svar); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n,{fremhev:true})}<div><p class="do-stor">${n} + ${10-n} = 10</p></div></div>`; } };
  },
};
function lagTier(nivå,K){ return nivå===1 ? TIER[pick(['hvorMange','hvorMange','legg'])](nivå,K) : TIER[pick(['mangler','mangler','venn'])](nivå,K); }

/* ---------- LYDER (første lyd) ---------- */
function forklarLyd(boks,o){
  boks.innerHTML=`<div class="do-forklar">${imgFor(o.fil)}<div><p class="do-stor"><b class="do-uthev">${o.ord.charAt(0).toUpperCase()}</b>${o.ord.slice(1).toUpperCase()}</p><p><b>${cap(o.ord)}</b> begynner med lyden <b>${o.f}</b>.</p>
    <button class="do-knapp liten" data-hør>🔊 Hør igjen</button></div></div>`;
  boks.querySelector('[data-hør]').onclick=()=>Lyd.spill([{ord:o.fil,reserve:o.ord},{pause:250},k('begynner-med'),{bokstav:o.f}]);
  Lyd.leggTil([{ord:o.fil,reserve:o.ord},{pause:250},k('begynner-med'),{bokstav:o.f}]);
}
const LYDER = {
  første(nivå){
    const o=pick(LYDORD), ant=nivå===1?2:4;
    const valg=[o.f, ...shuffle(BOKSTAVER.filter(b=>b!==o.f)).slice(0,ant-1)];
    return { tekst:`Hvilken lyd hører du <b>først</b>?`, si:[k('hvilken-lyd-forst'), {ord:o.fil,reserve:o.ord}],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div><div class="do-valg"><button class="do-knapp liten" data-hør>🔊 Hør ordet</button></div>`;
        boks.querySelector('[data-hør]').onclick=()=>Lyd.spill({ord:o.fil,reserve:o.ord});
        valgknapper(boks,valg,o.f,svar,{stor:true}); },
      forklar(boks){ forklarLyd(boks,o); } };
  },
  kresen(nivå,K){ // tre bilder, ett begynner med lyden
    const o=pick(LYDORD);
    const andre=shuffle(LYDORD.filter(x=>x.f!==o.f)).slice(0,2), alle=shuffle([o,...andre]);
    return { tekst:`${cap(K.dinoEn)} er kresen! Den vil bare spise ting som begynner med <b class="do-uthev">${o.f}</b>.`,
      si:[k(`e${K.id}-kresen`), {bokstav:o.f}, {pause:400}, ...alle.flatMap(x=>[{ord:x.fil,reserve:x.ord},{pause:300}])],
      tegn(boks,svar){ const rad=el('div','do-valg bilder');
        alle.forEach(x=>{ const b=el('button','do-knapp bildeknapp',imgFor(x.fil)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(y=>y.disabled=true); b.classList.add(x===o?'rett':'feil'); Lyd.spill({ord:x.fil,reserve:x.ord}); svar(x===o); }; rad.appendChild(b); });
        boks.appendChild(rad);
        const h=el('div','do-valg'); const hb=el('button','do-knapp liten','🔊 Hør lyden'); hb.onclick=()=>Lyd.spill({bokstav:o.f}); h.appendChild(hb); boks.appendChild(h); },
      forklar(boks){ forklarLyd(boks,o); } };
  },
};
function lagLyder(nivå,K){ return nivå===1 ? LYDER.første(1,K) : LYDER[pick(['første','kresen'])](2,K); }

/* ---------- LESE ORD (Skiltstien): ord med én og to stavelser ----------
   Ordet leses IKKE opp før eleven har svart – det er lesing, ikke lytting.
   Feilsvarene begynner helst på samme bokstav, så eleven må lese hele ordet. */
const visOrd = s => LÆRING.storeBokstaver ? s.toUpperCase() : s.toLowerCase();
function skilt(o,buer){
  const inn = (buer && o.stav.length>1) ? o.stav.map(x=>`<span class="do-bue">${visOrd(x)}</span>`).join('') : `<span>${visOrd(o.ord)}</span>`;
  return `<div class="do-skilt">${inn}</div>`;
}
function lignende(o,liste,n){
  const samme=shuffle(liste.filter(x=>x!==o && x.ord[0]===o.ord[0]));
  const andre=shuffle(liste.filter(x=>x!==o && x.ord[0]!==o.ord[0]));
  return [...samme,...andre].slice(0,n);
}
function forklarLes(boks,o,buer){
  const deler = o.stav.length>1 ? `<p class="do-stavvis">${o.stav.map(x=>`<span>${visOrd(x)}</span>`).join('+')}</p>` : '';
  boks.innerHTML=`<div class="do-forklar">${imgFor(o.fil)}<div>${deler}<p>Ordet er <b class="do-lesord">${visOrd(o.ord)}</b>.</p>
    <button class="do-knapp liten" data-hør>🔊 Hør ordet</button></div></div>`;
  const lyd=()=>(o.stav.length>1?[stavK(o.stav[0]),{pause:300},stavK(o.stav[1]),{pause:450},{ord:o.fil,reserve:o.ord}]:[{ord:o.fil,reserve:o.ord}]);
  boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(lyd()); Lyd.leggTil(lyd());
}
const LES = {
  ordTilBilde(nivå){ // les skiltet → velg bildet
    const liste = nivå===1 ? ENSTAV : TO_STAV, buer = nivå===2;
    const o=pick(liste), alle=shuffle([o,...lignende(o,liste,2)]);
    return { tekst:`Les ordet på skiltet. Hvilket bilde passer?`, si:[k('les-skiltet')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${skilt(o,buer)}</div>`;
        const rad=el('div','do-valg bilder');
        alle.forEach(x=>{ const b=el('button','do-knapp bildeknapp',imgFor(x.fil)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(y=>y.disabled=true); b.classList.add(x===o?'rett':'feil'); svar(x===o); }; rad.appendChild(b); });
        boks.appendChild(rad); },
      forklar(boks){ forklarLes(boks,o,buer); } };
  },
  bildeTilOrd(nivå){ // se bildet → les og velg riktig ord
    const liste = nivå===1 ? ENSTAV : TO_STAV, buer = nivå===2;
    const o=pick(liste), alle=[o,...lignende(o,liste,2)];
    return { tekst:`Hvilket skilt passer til bildet? Les alle skiltene.`, si:[k('hvilket-skilt')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div>`;
        valgknapper(boks,alle,o,svar,{html:x=>skilt(x,buer)}).classList.add('skilt'); },
      forklar(boks){ forklarLes(boks,o,buer); } };
  },
};
function lagStavelser(nivå){ return LES[pick(['ordTilBilde','ordTilBilde','bildeTilOrd'])](nivå); }

const LAG = { klokke:lagKlokke, penger:lagPenger, tier:lagTier, lyder:lagLyder, stavelser:lagStavelser };

/* ==========================================================================
   RUNDEN
   ========================================================================== */
let R=null;           // aktiv runde
let rot=null;         // overlay-elementet

function lagOverlay(){
  if(rot) return rot;
  rot=el('div','do-overlay');
  rot.innerHTML=`<div class="do-kort" role="dialog" aria-modal="true" aria-labelledby="doTittel">
    <header class="do-hode"><span class="do-ikon" id="doIkon"></span><div class="do-titler"><h2 id="doTittel"></h2><small id="doUnder"></small></div>
      <div class="do-prikker" id="doPrikker"></div><button class="do-lukk" id="doLukk" aria-label="Lukk">✕</button></header>
    <div class="do-oppgave"><div class="do-tekstrad"><button class="do-høyttaler" id="doLes" aria-label="Les opp">🔊</button><p class="do-tekst" id="doTekst"></p></div>
      <div class="do-boks" id="doBoks"></div></div>
    <footer class="do-fot" id="doFot"></footer></div>`;
  document.body.appendChild(rot);
  rot.querySelector('#doLukk').onclick=lukk;
  rot.querySelector('#doLes').onclick=()=>R&&R.oppg&&les(R.oppg);
  return rot;
}
const $d = id => rot.querySelector('#'+id);
function les(o){ Lyd.spill(Array.isArray(o.si)?o.si:[o.si]); }

function open(id, {enc=1, onClose=null}={}){
  lagOverlay();
  const st=STASJONER.find(s=>s.id===id), L=lesLæring(), t=L.tema[id], K={...(KULISSE[enc]||KULISSE[1]), id:KULISSE[enc]?enc:1};
  const forfall=!!(t.rep && dayStr()>=t.rep.neste);
  const nivå=Math.min(t.nivå,BYGDE_NIVÅ);
  // én oppgave fra et tidligere nivå når eleven er på nivå 2 eller høyere
  const nivåer=Array(LÆRING.rundeLengde).fill(nivå);
  if(nivå>1) nivåer[1+rnd(LÆRING.rundeLengde-1)]=1+rnd(nivå-1);
  R={ id, st, enc, K, forfall, onClose, i:0, mynter:0, riktige:0, ko:nivåer.map(n=>({nivå:n})), oppg:null, forsøk:0 };
  rot.style.setProperty('--st',st.farge);
  $d('doIkon').textContent=st.ikon; $d('doTittel').textContent=st.navn;
  $d('doUnder').innerHTML=`${st.tema} · Nivå ${nivå}: ${NIVÅNAVN[id][nivå-1]}${forfall?' · <b class="do-glød">Repetisjon – dobbelt så mange mynter!</b>':''}`;
  rot.classList.add('vis'); document.body.classList.add('do-åpen');
  visOppgave();
}
function prikker(){
  $d('doPrikker').innerHTML=R.ko.map((k,i)=>`<i class="${i<R.i?(k.ok?'ok':'bom'):i===R.i?'nå':''}"></i>`).join('');
}
function visOppgave(){
  const k=R.ko[R.i];
  R.oppg = k.oppg || LAG[R.id](k.nivå,R.K); R.oppg.nivå=k.nivå; k.oppg=R.oppg;
  R.forsøk=0;
  tegnOppgave();
}
function tegnOppgave(){
  const o=R.oppg;
  prikker();
  $d('doTekst').innerHTML=o.tekst;
  const boks=$d('doBoks'); boks.innerHTML=''; boks.className='do-boks';
  $d('doFot').innerHTML='';
  o.tegn(boks, ok=>svar(ok));
  les(o);
}
function svar(ok){
  const kk=R.ko[R.i], o=R.oppg;
  R.forsøk++;
  Lyd.pip(ok);
  if(R.forsøk===1) registrer(o.nivå, ok);
  const fot=$d('doFot');
  if(ok){
    const n=(R.forsøk===1?LÆRING.mynterFørsteForsøk:LÆRING.mynterAndreForsøk)*(R.forfall?LÆRING.repetisjonsGange:1);
    R.mynter+=n; if(R.forsøk===1){ R.riktige++; kk.ok=true; } else kk.ok=false;
    gimynter(n);
    const ros=pick(ROS);
    fot.innerHTML=`<div class="do-melding ok"><b>${ros}</b> <span class="do-mynttekst">+${n} 🪙</span></div><button class="do-knapp go" id="doNeste">Neste ▶</button>`;
    Lyd.spill([k(`ros-${ROS.indexOf(ros)+1}`)]);
    $d('doNeste').onclick=neste;
    if(window.DinoParkHUD) window.DinoParkHUD();
  } else if(R.forsøk===1){
    kk.ok=false;
    // samme type oppgave kommer igjen litt senere i runden
    if(R.ko.length<LÆRING.maksRunde){ const pos=Math.min(R.ko.length, R.i+3); R.ko.splice(pos,0,{nivå:o.nivå, ekstra:true}); }
    fot.innerHTML=`<div class="do-melding bom"><b>Ikke helt.</b> Se her:</div>`;
    Lyd.spill([k('ikke-helt')]);
    const forkl=el('div','do-forklarboks'); fot.appendChild(forkl); o.forklar(forkl);
    const rad=el('div','do-valg'); const b=el('button','do-knapp go','Prøv igjen'); b.onclick=()=>tegnOppgave(); rad.appendChild(b); fot.appendChild(rad);
  } else {
    fot.innerHTML=`<div class="do-melding bom"><b>Ikke denne gangen.</b> Slik er det:</div>`;
    const forkl=el('div','do-forklarboks'); fot.appendChild(forkl); o.forklar(forkl);
    const rad=el('div','do-valg'); const b=el('button','do-knapp go','Neste ▶'); b.onclick=neste; rad.appendChild(b); fot.appendChild(rad);
  }
  prikker();
}
function neste(){ R.i++; if(R.i>=R.ko.length) ferdig(); else visOppgave(); }

function registrer(nivå, ok){
  const L=lesLæring(), t=L.tema[R.id];
  const h=t.hist[nivå]=(t.hist[nivå]||[]); h.push(ok?1:0); while(h.length>LÆRING.mestringAv) h.shift();
  if(nivå===t.nivå && h.length>=LÆRING.mestringAv && h.reduce((a,b)=>a+b,0)>=LÆRING.mestringKrav && !t.mestret.includes(nivå)){
    t.mestret.push(nivå);
    R.nyStjerne=nivå;
    if(t.nivå<BYGDE_NIVÅ) t.nivå++;
    if(!t.rep) t.rep={ steg:0, neste:addDays(LÆRING.repetisjonDager[0]) };
  }
  lagreLæring(L);
}
function ferdig(){
  const L=lesLæring(), t=L.tema[R.id];
  t.runder++;
  if(t.rep){
    if(R.forfall) t.rep.steg=Math.min(t.rep.steg+1, LÆRING.repetisjonDager.length-1);
    t.rep.neste=addDays(LÆRING.repetisjonDager[t.rep.steg]);
  }
  lagreLæring(L);
  const park=parkFremgang(R.enc);
  if(window.DinoParkHUD) window.DinoParkHUD();
  const n=R.ko.length;
  let stjerne='';
  if(R.nyStjerne){
    stjerne = R.nyStjerne<BYGDE_NIVÅ
      ? `<div class="do-stjerne">⭐ Ny stjerne! Du kan <b>${NIVÅNAVN[R.id][R.nyStjerne-1].toLowerCase()}</b>.<br>Neste gang får du nivå ${R.nyStjerne+1}: ${NIVÅNAVN[R.id][R.nyStjerne]}.</div>`
      : `<div class="do-stjerne">⭐ Ny stjerne! Du kan <b>${NIVÅNAVN[R.id][R.nyStjerne-1].toLowerCase()}</b>. Flere nivåer kommer snart!</div>`;
  }
  $d('doPrikker').innerHTML=R.ko.map(k=>`<i class="${k.ok?'ok':'bom'}"></i>`).join('');
  $d('doTekst').innerHTML=`<b>Runden er ferdig!</b>`;
  $d('doBoks').innerHTML=`<div class="do-slutt"><div class="do-stortall">${R.riktige} av ${n}</div><p>riktige på første forsøk</p>
    <p class="do-mynttekst stor">+${R.mynter} 🪙 til parkkassa</p>${park?`<p class="do-park">🥚 ${park}</p>`:''}${stjerne}</div>`;
  $d('doFot').innerHTML=`<div class="do-valg"><button class="do-knapp" id="doTilbake">Tilbake til innhegningen</button><button class="do-knapp go" id="doIgjen">Ny runde ▶</button></div>`;
  $d('doTilbake').onclick=lukk;
  $d('doIgjen').onclick=()=>open(R.id,{enc:R.enc,onClose:R.onClose});
  Lyd.spill([k('runden-ferdig'), {tall:R.mynter}, k('mynter'), R.nyStjerne?k('ny-stjerne'):null]);
  R.ferdig=true;
}
function lukk(){
  Lyd.stopp();
  if(rot){ rot.classList.remove('vis'); document.body.classList.remove('do-åpen'); }
  const cb=R&&R.onClose; R=null; if(cb) cb();
}

/* ==========================================================================
   VOKSENMENY (læringsfremgang)
   ========================================================================== */
function voksen(){
  lagOverlay();
  R=null;   // egen kodeboks (ingen nettleserdialoger)
  rot.style.setProperty('--st','#1f3b2c');
  $d('doIkon').textContent='🔒'; $d('doTittel').textContent='Voksenmeny'; $d('doUnder').textContent='Læringsfremgang i Dinoparken';
  $d('doPrikker').innerHTML=''; $d('doTekst').textContent='Skriv inn koden:';
  $d('doBoks').innerHTML=`<div class="do-valg"><input id="doKode" class="do-input" inputmode="numeric" type="password" autocomplete="off" aria-label="Kode"><button class="do-knapp go" id="doKodeOk">Åpne</button></div>`;
  $d('doFot').innerHTML='';
  rot.classList.add('vis'); document.body.classList.add('do-åpen');
  const sjekk=()=>{ if($d('doKode').value===LÆRING.voksenKode) visVoksen(); else { $d('doKode').value=''; $d('doTekst').textContent='Feil kode – prøv igjen:'; } };
  $d('doKodeOk').onclick=sjekk; $d('doKode').onkeydown=e=>{ if(e.key==='Enter') sjekk(); };
  setTimeout(()=>$d('doKode').focus(),50);
}
function visVoksen(){
  const L=lesLæring();
  $d('doTekst').innerHTML='Velg startnivå for hvert tema og se hvordan det går. Tallene er de siste 10 oppgavene på hvert nivå (første forsøk).';
  let h='<table class="do-tabell"><tr><th>Stasjon</th><th>Nivå nå</th><th>Siste resultater</th><th>Repetisjon</th></tr>';
  for(const st of STASJONER){
    const t=L.tema[st.id];
    const res=[1,2].map(n=>{ const a=t.hist[n]||[]; return `Nivå ${n}: ${a.length?`${a.reduce((x,y)=>x+y,0)}/${a.length}`:'–'}${t.mestret.includes(n)?' ⭐':''}`; }).join('<br>');
    h+=`<tr><td>${st.ikon} <b>${st.navn}</b><br><small>${st.tema}</small></td>
      <td><select data-tema="${st.id}" class="do-input">${NIVÅNAVN[st.id].slice(0,BYGDE_NIVÅ).map((n,i)=>`<option value="${i+1}" ${t.nivå===i+1?'selected':''}>${i+1}: ${n}</option>`).join('')}</select></td>
      <td>${res}<br><small>${t.runder} runder</small></td><td><small>${t.rep?`Neste: ${t.rep.neste}`:'Ikke mestret ennå'}</small></td></tr>`;
  }
  h+='</table>';
  $d('doBoks').innerHTML=h;
  $d('doBoks').querySelectorAll('select').forEach(s=>s.onchange=()=>{ const L2=lesLæring(); L2.tema[s.dataset.tema].nivå=+s.value; lagreLæring(L2); });
  $d('doFot').innerHTML=`<div class="do-valg"><button class="do-knapp" id="doNull">Nullstill læringsfremgang</button><button class="do-knapp go" id="doVLukk">Lukk</button></div>`;
  $d('doVLukk').onclick=()=>{ lukk(); if(window.DinoParkHUD) window.DinoParkHUD(); };
  $d('doNull').onclick=()=>{ const b=$d('doNull'); if(b.dataset.sikker){ try{ localStorage.removeItem(LKEY); }catch(e){} visVoksen(); } else { b.dataset.sikker=1; b.textContent='Trykk igjen for å bekrefte'; } };
}

/* ==========================================================================
   STIL (legges inn automatisk)
   ========================================================================== */
const css=`
.do-overlay{position:fixed;inset:0;z-index:50;background:rgba(31,59,44,.45);display:none;align-items:center;justify-content:center;padding:16px;
  font-family:'Atkinson Hyperlegible',system-ui,sans-serif;color:#1f3b2c;--st:#e0782f}
.do-overlay.vis{display:flex;animation:doInn .25s ease}
@keyframes doInn{from{opacity:0}to{opacity:1}}
.do-kort{background:#fffdf6;border:4px solid #1f3b2c;border-radius:28px;box-shadow:0 10px 0 rgba(31,59,44,.25);width:min(860px,100%);max-height:calc(100dvh - 32px);
  display:flex;flex-direction:column;overflow:hidden}
.do-hode{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--st);color:#fff;border-bottom:4px solid #1f3b2c}
.do-ikon{font-size:32px;width:52px;height:52px;display:grid;place-items:center;background:#fffdf6;border:3px solid #1f3b2c;border-radius:16px}
.do-titler{flex:1;min-width:0}.do-titler h2{margin:0;font:700 26px Fredoka,sans-serif}.do-titler small{font-size:14px;opacity:.95}
.do-glød{background:#fff3cf;color:#1f3b2c;border-radius:8px;padding:0 6px}
.do-prikker{display:flex;gap:6px}.do-prikker i{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.4);border:2px solid #1f3b2c}
.do-prikker i.nå{background:#fff;transform:scale(1.25)}.do-prikker i.ok{background:#5cc46a}.do-prikker i.bom{background:#f2a33a}
.do-lukk{width:48px;height:48px;border-radius:50%;border:3px solid #1f3b2c;background:#fffdf6;font-size:22px;cursor:pointer;color:#1f3b2c}
.do-oppgave{padding:16px 18px 6px;overflow:auto;flex:1}
.do-tekstrad{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.do-høyttaler{flex:none;width:56px;height:56px;border-radius:50%;border:3px solid #1f3b2c;background:#fff3cf;font-size:26px;cursor:pointer}
.do-tekst{margin:0;font-size:clamp(20px,2.6vw,26px);line-height:1.35}
.do-midt{display:flex;justify-content:center;margin:6px 0 12px}
.do-valg{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:10px 0}
.do-knapp{min-width:72px;min-height:64px;padding:10px 18px;border:3px solid #1f3b2c;border-radius:18px;background:#fff;font:600 24px Fredoka,sans-serif;color:#1f3b2c;
  cursor:pointer;box-shadow:0 5px 0 rgba(31,59,44,.22);transition:transform .08s;touch-action:manipulation;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.do-knapp:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(31,59,44,.22)}
.do-knapp:disabled{cursor:default}
.do-knapp.go{background:#f2a33a}.do-knapp.liten{font-size:18px;min-height:52px}
.do-valg.stor .do-knapp{min-width:110px;min-height:96px;font-size:44px;flex-direction:column}
.do-valg.stor .do-knapp small{font-size:15px;font-family:'Atkinson Hyperlegible'}
.do-knapp.rett{background:#bfeac4;border-color:#1d7a35}.do-knapp.feil{background:#ffd9c2;border-color:#c2453a}
.do-digital{font:700 34px 'Courier New',monospace;letter-spacing:2px;background:#1f3b2c;color:#9ff0a8;padding:4px 12px;border-radius:10px}
.do-digital.liten{font-size:24px;padding:2px 8px}
.do-klokke{max-width:100%;height:auto}.do-still .do-klokke{touch-action:none;cursor:grab}
.do-klokke .do-tak{filter:drop-shadow(0 0 4px rgba(63,134,201,.6))}
.do-valg.klokker .klokkeknapp{padding:8px;border-radius:24px}
.do-mynt{display:block}.myntknapp{padding:6px 8px;min-width:0;background:#fffdf6}.myntknapp.liten{min-height:0;padding:2px 4px;box-shadow:none;border-width:2px}
.do-myntrad{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;min-height:64px}
.do-stormynt .do-mynt{width:150px;height:150px}
.do-valg.mynter .do-mynt,.do-lommebok .do-mynt{zoom:1.6}.do-myntrad.stor .do-mynt{zoom:1.5}
.do-disk{border:3px dashed #9a6a3e;border-radius:18px;padding:8px;background:#fbf0de;margin-bottom:10px}
.do-disktopp{display:flex;justify-content:space-between;font:600 18px Fredoka,sans-serif;color:#7a4a2a;margin-bottom:4px}
.do-sum{background:#fff;border:2px solid #7a4a2a;border-radius:10px;padding:0 10px}
.do-lommebok{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.do-vare{font-size:1.3em}
.do-tips{font-size:16px;color:#4a6656;text-align:center;margin:6px 0}
.do-ramme{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;background:#9a6a3e;padding:12px;border-radius:18px;border:3px solid #1f3b2c;width:min(420px,100%)}
.do-rute{aspect-ratio:1;background:#e9c46a;border-radius:12px;display:grid;place-items:center;cursor:pointer;position:relative;box-shadow:inset 0 3px 0 rgba(0,0,0,.12)}
.do-rute.mangler{outline:3px dashed #c2453a;outline-offset:-5px}.do-rute b{font:700 22px Fredoka;color:#c2453a}
.do-egg{width:62%;height:78%;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff,#f6ecd0 55%,#d9c79a);border:2px solid #1f3b2c;
  box-shadow:inset -3px -3px 0 rgba(224,120,47,.35)}
.do-blad{font-size:34px}
.do-tallpad{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;max-width:560px;margin:10px auto}
.do-tallpad .tall{min-width:0;font-size:30px}
.do-pic{width:min(220px,40vw);height:auto;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:20px;border:3px solid #1f3b2c}
.do-valg.bilder .bildeknapp{padding:6px;border-radius:22px}.do-valg.bilder .do-pic{width:min(170px,26vw);border:none}
.do-uthev{color:#c2453a}
.do-klapprad{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
.do-tromme{width:120px;height:120px;border-radius:50%;border:4px solid #1f3b2c;background:radial-gradient(circle at 50% 40%,#fff3cf,#f2a33a);font-size:52px;cursor:pointer;
  box-shadow:0 6px 0 rgba(31,59,44,.25);touch-action:manipulation}
.do-tromme.slag{animation:doSlag .2s}@keyframes doSlag{50%{transform:scale(.9)}}
.do-klapp{display:flex;gap:6px;min-width:80px}.do-klapp i{width:22px;height:22px;border-radius:50%;background:#7d64c4;border:2px solid #1f3b2c}
.do-stavvis{display:flex;gap:6px;font:700 34px Fredoka}.do-stavvis span{background:#fff3cf;border:2px solid #1f3b2c;border-radius:12px;padding:2px 12px;border-bottom:6px solid #7d64c4}
.do-skilt{display:inline-flex;gap:4px;background:#c08a55;border:4px solid #7a4a2a;border-radius:16px;padding:14px 26px;box-shadow:0 6px 0 rgba(31,59,44,.2)}
.do-skilt span{font:700 clamp(40px,6vw,60px) 'Atkinson Hyperlegible',sans-serif;letter-spacing:3px;color:#fffdf6;line-height:1.1}
.do-skilt .do-bue{padding:0 6px 8px;border-bottom:6px solid #fff3cf;border-radius:0 0 50% 50%/0 0 22px 22px}
.do-valg.skilt .do-knapp{padding:6px;background:#fffdf6}.do-valg.skilt .do-skilt{padding:8px 16px}.do-valg.skilt .do-skilt span{font-size:clamp(28px,4vw,40px)}
.do-lesord{font-size:1.3em;letter-spacing:2px}
.do-fot{padding:10px 18px 16px;border-top:3px dashed #d8d2bd;display:flex;flex-direction:column;gap:6px;max-height:55%;overflow:auto}
.do-fot:empty{display:none}
.do-melding{font-size:22px;text-align:center}.do-melding.ok b{color:#1d7a35}.do-melding.bom b{color:#c2453a}
.do-mynttekst{font:700 22px Fredoka;color:#b8740f}.do-mynttekst.stor{font-size:28px}
.do-forklar{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;font-size:19px;line-height:1.4}.do-forklar p{margin:4px 0}
.do-forklar .do-pic{width:120px}.do-forklar .do-ramme{width:260px;gap:5px;padding:8px}
.do-stor{font:700 30px Fredoka,sans-serif}
.do-slutt{text-align:center;font-size:20px}.do-stortall{font:700 64px Fredoka;color:var(--st)}
.do-park{background:#eef7e6;border-radius:14px;padding:8px}
.do-stjerne{background:#fff3cf;border:3px solid #f2a33a;border-radius:16px;padding:10px;font-size:20px;margin-top:10px}
.do-input{font:600 22px Fredoka;padding:10px 14px;border:3px solid #1f3b2c;border-radius:14px;max-width:100%}
.do-tabell{width:100%;border-collapse:collapse;font-size:16px}.do-tabell td,.do-tabell th{border-bottom:2px solid #e6dfc8;padding:8px;text-align:left;vertical-align:top}
.do-tabell select{font-size:16px;padding:6px}
body.do-åpen{overflow:hidden}
@media (max-width:640px){ .do-prikker{display:none} .do-titler h2{font-size:22px} .do-valg.stor .do-knapp{min-width:80px;min-height:80px;font-size:34px} .do-tallpad{grid-template-columns:repeat(4,1fr)} }
@media (prefers-reduced-motion:reduce){ .do-overlay.vis{animation:none} .do-tromme.slag{animation:none} }
`;
const stil=document.createElement('style'); stil.textContent=css; document.head.appendChild(stil);

/* ==========================================================================
   INNLESING – alle lydklipp siden bruker (innlesing.html lager innleseskriptet fra denne lista)
   Filene legges i  lyd/dino/<navn>.mp3   (tall i  lyd/tall-<n>.mp3 ).
   Mangler en fil, leser iPad-stemmen teksten i stedet.
   ========================================================================== */
function slug(s){ return s.toLowerCase().replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
const KLIPP={}, KLIPPGRUPPER=[];
function gruppe(navn, ingress){ const g={navn, ingress, klipp:[]}; KLIPPGRUPPER.push(g); return g; }
function reg(g, navn, tekst, fil){ KLIPP[navn]=tekst; g.klipp.push({navn, tekst, fil:fil||`dino/${navn}.mp3`}); }
const k = navn => ({klipp:navn});
const tid = (h,m) => k('tid-'+slug(klokkeOrd(h,m)));
const stavK = st => k('stav-'+slug(st));
const ROS = ['Riktig!','Kjempebra!','Supert!','Ja, sånn!','Du fikk det til!'];
{
  let g=gruppe('Oppgavetekster','Leses opp når en ny oppgave kommer. Noen setninger er delt i biter fordi et tall, et klokkeslett eller et ord kommer midt i – les dem som om de står alene, med naturlig tonefall.');
  [['klokke-les','Se på klokka. Hvilken digital klokke viser det samme?'],['hvilken-klokke','Hvilken klokke viser det?'],
   ['foringa-er','Fôringa er'],['dra-viseren','Dra den lange, blå viseren og still klokka.'],['hva-heter-klokka','Hva heter klokka?'],['det-heter','Det heter'],
   ['kiosken-trenger','Kiosken trenger en'],['trykk-paa-den','Trykk på den.'],['hvor-mye-mynten','Hvor mye er denne mynten verdt?'],
   ['koster','koster'],['kroner','kroner.'],['legg-noyaktig','Legg nøyaktig'],['kroner-paa-disken','kroner på disken.'],['hvor-mye-kassa','Hvor mye penger ligger i kassa?'],
   ['hvor-mange-egg','Hvor mange egg ligger i rugekassa? Prøv å se det uten å telle.'],['legg','Legg'],['egg-i-rugekassa','egg i rugekassa.'],
   ['rugekassa-plass','Rugekassa har plass til ti egg. Det ligger'],['egg-mangler','egg. Hvor mange mangler?'],['oppi-mangler','oppi. Hvor mange mangler?'],
   ['pluss-hva-blir-ti','pluss hva blir ti?'],
   ['hvilken-lyd-forst','Hvilken lyd hører du først i'],['begynner-med','begynner med'],
   ['les-skiltet','Les ordet på skiltet. Hvilket bilde passer?'],['hvilket-skilt','Hvilket skilt passer til bildet? Les alle skiltene.'],
  ].forEach(([n,t])=>reg(g,n,t));
  g=gruppe('Ros og tilbakemelding','Spilles når eleven svarer, og når runden er ferdig. Glad og varm stemme.');
  ROS.forEach((t,i)=>reg(g,`ros-${i+1}`,t));
  [['ikke-helt','Ikke helt. Se her.'],['runden-ferdig','Runden er ferdig! Du fikk'],['mynter','mynter.'],['ny-stjerne','Og en ny stjerne!']].forEach(([n,t])=>reg(g,n,t));
  g=gruppe('Mynter','Brukes i «Kiosken trenger en …».');
  [[1,'enkrone'],[5,'femkrone'],[10,'tikrone'],[20,'tjuekrone']].forEach(([v,t])=>reg(g,`mynt-${v}`,t));
  g=gruppe('Klokkeslett','Hele og halve timer fra åtte til tolv (nivå 1–2). Les dem som et svar: «Halv ni.»');
  for(let h=8;h<=12;h++) reg(g,'tid-'+slug(klokkeOrd(h,0)),cap(klokkeOrd(h,0))+'.');
  for(let h=8;h<=11;h++) reg(g,'tid-'+slug(klokkeOrd(h,30)),cap(klokkeOrd(h,30))+'.');
  g=gruppe('Tall','Tallene 0–20 fins allerede fra Myntland (samme stemme). Bare 21–50 er nye. Tallene står skrevet som ord, så stemmen uttaler dem på norsk.');
  const EN=['null','en','to','tre','fire','fem','seks','sju','åtte','ni','ti','elleve','tolv','tretten','fjorten','femten','seksten','sytten','atten','nitten'];
  const TI={20:'tjue',30:'tretti',40:'førti',50:'femti'};
  const tallOrd = n => n<20 ? EN[n] : TI[n-n%10] + (n%10 ? EN[n%10] : '');   // skrevet som ord, så ElevenLabs leser norsk
  for(let n=0;n<=50;n++) reg(g,`tall-${n}`,cap(tallOrd(n))+'.',`tall-${n}.mp3`);
  g.fins = n => +n.slice(5)<=20;
  for(const [id,Ku] of Object.entries(KULISSE)){
    if(id!=='1') continue;   // bare innhegninger som har egen side (legg til flere her etter hvert)
    g=gruppe(`Innhegning ${id}: ${['','Triceratops-enga','Langhalsskogen','T-rex-kløfta','Raptorreiret','Flygeøgle-kuppelen','Stegosaurus-sumpen'][id]}`,'Setninger med dinoens navn og maten i innhegningen, og varene i kiosken.');
    reg(g,`e${id}-faar-mat`,`${cap(Ku.dino)} skal få mat`);
    reg(g,`e${id}-botta`,`Fôrbøtta tar ti ${Ku.mat}. Det er`);
    reg(g,`e${id}-kresen`,`${cap(Ku.dinoEn)} er kresen! Den vil bare spise ting som begynner med`);
    Ku.kiosk.forEach(([v])=>reg(g,`vare-${slug(v)}`,v));
  }
  g=gruppe('Stavelser','Brukes når eleven har svart feil i Skiltstien: «ka – ke – kake». Les hver stavelse kort og tydelig, slik den høres ut inne i ordet.');
  [...new Set(TO_STAV.flatMap(o=>o.stav))].forEach(st=>reg(g,'stav-'+slug(st),st.toLowerCase()));
}
function klippListe(){ return KLIPPGRUPPER.map(g=>({navn:g.navn, ingress:g.ingress, klipp:g.klipp.map(x=>({...x, fins:g.fins?g.fins(x.navn):false}))})); }

window.DinoOppgaver = { open, status, voksen, klippListe, STASJONER, NIVÅNAVN, lesPark, KULISSE, _test:{ LAG, KULISSE, klokkeOrd, myntForslag } };
})();
