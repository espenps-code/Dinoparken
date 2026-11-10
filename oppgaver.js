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
const BYGDE = { klokke:6, penger:6, tier:5, lyder:5, stavelser:5 };   // nivåer som er laget per tema

/* ---------- Kulisse per innhegning ---------- */
const KULISSE = {
  1: { dino:'triceratopsene', dinoEn:'triceratopsen', mat:'bregner', matEn:'bregne',
       kiosk:[['Bregneis','🍦'],['Dinoburger','🍔'],['Hornhatt','🎩'],['Eggkjeks','🍪'],['Saft','🧃'],['Dinobamse','🧸'],['Postkort','✉️'],['Ballong','🎈']] },
  2: { dino:'langhalsene', dinoEn:'brachiosaurusen', mat:'tretopper', matEn:'grein',
       kiosk:[['Bladis','🍦'],['Langhalsbamse','🧸'],['Halsskjerf','🧣'],['Eggkjeks','🍪'],['Saft','🧃'],['Kikkert','🔭'],['Postkort','✉️'],['Ballong','🎈']] },
  3: { dino:'T-rexen', dinoEn:'T-rexen', mat:'kjøttbiter', matEn:'kjøttbit',
       kiosk:[['Tannkjeks','🍪'],['T-rex-hatt','🎩'],['Brølefløyte','📯'],['Kjøttboller','🍖'],['Saft','🧃'],['T-rex-bamse','🧸'],['Postkort','✉️'],['Ballong','🎈']] },
  4: { dino:'raptorene', dinoEn:'raptoren', mat:'kjøttbiter', matEn:'kjøttbit',
       kiosk:[['Raptorkjeks','🍪'],['Fjærhatt','🎩'],['Klo-anheng','📿'],['Pølse','🌭'],['Saft','🧃'],['Raptorbamse','🧸'],['Postkort','✉️'],['Ballong','🎈']] },
  5: { dino:'flygeøglene', dinoEn:'pteranodonen', mat:'fisker', matEn:'fisk',
       kiosk:[['Fiskeis','🍦'],['Vingehatt','🎩'],['Papirfly','✈️'],['Fiskekake','🐟'],['Saft','🧃'],['Flygeøglebamse','🧸'],['Postkort','✉️'],['Drage','🪁']] },
  6: { dino:'stegosaurusene', dinoEn:'stegosaurusen', mat:'sumpplanter', matEn:'plante',
       kiosk:[['Sumpis','🍦'],['Piggbamse','🧸'],['Gummistøvler','👢'],['Eggkjeks','🍪'],['Saft','🧃'],['Froskeslikkepinne','🍭'],['Postkort','✉️'],['Ballong','🎈']] },
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
const LYDORD = [ // f = første lyd, s = siste lyd, m = vokalen i midten (null = ikke brukt). Samme ord som i Myntlands Lydverksted.
  ['sol','sol','S','L','O'],['mus','mus','M','S','U'],['bil','bil','B','L','I'],['hus','hus','H','S','U'],['tog','tog','T','G',null],
  ['rev','rev','R','V','E'],['sag','sag','S','G','A'],['lys','lys','L','S','Y'],['dør','door','D','R','Ø'],['bok','bok','B','K','O'],
  ['hatt','hatt','H','T','A'],['gutt','gutt','G','T','U'],['penn','penn','P','N','E'],['kam','kam','K','M','A'],['katt','katt','K','T','A'],
  ['tann','tann','T','N','A'],['buss','buss','B','S','U'],['bål','baal','B','L','Å'],['gås','gaas','G','S','Å'],['bær','baer','B','R','Æ'],
  ['nøtt','noett','N','T','Ø'],['ring','ring','R',null,'I'],['fisk','fisk','F','K',null],['eple','eple','E','E',null],['ape','ape','A','E',null],
  ['ugle','ugle','U','E',null],['øye','oeye','Ø','E',null],['kake','kake','K','E',null],['nese','nese','N','E',null],['jakke','jakke','J','E',null],
  ['løve','loeve','L','E',null],['vaffel','vaffel','V','L',null],['is','is','I','S',null],['ost','ost','O','T',null],['egg','egg','E','G',null],
  ['ku','ku','K','U',null],['stol','stol','S','L',null],['sko','sko','S','O',null],['gris','gris','G','S',null],['hund','hund','H',null,null],
  ['fugl','fugl','F',null,null],['måne','maane','M','E',null],['sekk','sekk','S','K','E'],['lue','lue','L','E','U'],['tre','tre','T','E',null],
  ['klokke','klokke','K','E',null],['due','due','D','E','U'],['pose','pose','P','E',null],['ballong','ballong','B',null,null],
  ['sitron','sitron','S','N',null],['banan','banan','B','N',null],['jente','jente','J','E',null],['zebra','zebra','Z','A',null],
].map(([ord,fil,f,s,m])=>({ord,fil,f,s,m}));
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
  /* Lydfilene spilles gjennom Web Audio. Safari på iPad blokkerer vanlige <audio>-avspillinger som ikke
     starter rett etter et trykk – da ble klipp nr. 2, 3 … i en setning stoppet og iPad-stemmen tok over.
     Web Audio låses opp én gang ved første trykk og kan deretter spille mange klipp etter hverandre. */
  let kø=[], aktiv=null, stemme=null, tok=0, ctx=null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const lydmotor = () => { if(!ctx && AC){ try{ ctx=new AC(); }catch(e){} } return ctx; };
  const lås = () => { const c=lydmotor(); if(c && c.state==='suspended') c.resume(); };
  ['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev, lås, {capture:true, passive:true}));
  const lager = {};   // fil → Promise<AudioBuffer|null>  (null = fila fins ikke)
  function hent(fil){
    if(!(fil in lager)){
      lager[fil] = fetch(fil).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); })
        .then(ab=>new Promise((ok,feil)=>{ const c=lydmotor(); if(!c) return feil(); c.decodeAudioData(ab, ok, feil); }))
        .catch(()=>null);
    }
    return lager[fil];
  }
  const finnStemme = () => {
    if(!('speechSynthesis' in window)) return null;
    const v=speechSynthesis.getVoices();
    return v.find(x=>/^nb/i.test(x.lang)) || v.find(x=>/^no/i.test(x.lang)) || v.find(x=>/^nn/i.test(x.lang)) || null;
  };
  if('speechSynthesis' in window){ stemme=finnStemme(); speechSynthesis.onvoiceschanged=()=>{ stemme=finnStemme(); }; }
  function stopp(){
    tok++; kø=[];
    if(aktiv && aktiv.stop){ try{ aktiv.onended=null; aktiv.stop(); }catch(e){} }
    aktiv=null; if('speechSynthesis' in window) speechSynthesis.cancel();
  }
  function snakk(tekst,t){
    if(!tekst || !('speechSynthesis' in window)){ neste(t); return; }
    const u=new SpeechSynthesisUtterance(tekst); u.lang='nb-NO'; if(stemme) u.voice=stemme; u.rate=.92;
    u.onend=()=>neste(t); u.onerror=()=>neste(t); aktiv=u; speechSynthesis.speak(u);
  }
  function neste(t){
    if(t!==tok) return;
    const x=kø.shift(); if(!x){ aktiv=null; return; }
    if(x.pause){ aktiv={pause:true}; setTimeout(()=>neste(t), x.pause); return; }
    if(x.fil){
      aktiv={laster:true};
      hent(x.fil).then(b=>{
        if(t!==tok) return;
        const c=lydmotor();
        if(!b || !c){ snakk(x.reserve,t); return; }   // fila mangler → iPad-stemmen leser teksten
        if(c.state==='suspended') c.resume();
        const s=c.createBufferSource(); s.buffer=b; s.connect(c.destination);
        s.onended=()=>neste(t); aktiv=s; s.start();
      });
      return;
    }
    if(x.tts){ snakk(x.tts,t); return; }
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
  // alle filene i en setning hentes med en gang, så det blir korte pauser mellom bitene
  const liste2 = l => (Array.isArray(l)?l:[l]).filter(Boolean).map(tilElement).map(x=>{ if(x.fil) hent(x.fil); return x; });
  function spill(liste){ lås(); stopp(); const t=tok; kø=liste2(liste); neste(t); }
  /* leggTil([...]) – spilles etter det som spilles nå (eller med en gang hvis det er stille) */
  function leggTil(liste){ if(!aktiv && !kø.length){ spill(liste); return; } kø.push(...liste2(liste)); }
  /* Små effektlyder uten filer */
  function pip(ok){
    try{
      const ac=lydmotor(); if(!ac) return;
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

/* ---------- KLOKKA (nivå 1–6) ----------
   1 hele timer · 2 halv · 3 kvart over · 4 kvart på · 5 alt blandet · 6 ettermiddag (24 t) */
function klokkeTid(nivå){
  const r=Math.random();
  if(nivå===1) return [8+rnd(5), 0];                                   // 08:00–12:00
  if(nivå===2) return r<.7 ? [8+rnd(4),30] : [8+rnd(5),0];
  if(nivå===3) return r<.6 ? [8+rnd(4),15] : [8+rnd(4),pick([0,30])];
  if(nivå===4) return r<.6 ? [8+rnd(4),45] : [8+rnd(4),pick([0,15,30])];
  if(nivå===5) return [8+rnd(4), pick([0,15,30,45])];
  return [13+rnd(7), pick([0,15,30,45])];                              // 13:00–19:45
}
function andreTider(h,m,nivå,ant){
  const ut=new Set([digital(h,m)]), liste=[], kand=[];
  if(m===30) kand.push([h+1,30],[h,0],[h+1,0]);   // «halv ni» er 08:30, ikke 09:30
  if(m===15) kand.push([h,45],[h+1,15]);          // over/på byttes om
  if(m===45) kand.push([h+1,45],[h,15]);          // «kvart på ni» er 08:45, ikke 09:45
  if(nivå===6) kand.unshift([h-12,m]);            // 14:30 / 02:30
  for(let i=0;i<30;i++) kand.push(klokkeTid(nivå));
  for(const [a,b] of kand){ if(a<0||a>23) continue; const d=digital(a,b); if(!ut.has(d)){ ut.add(d); liste.push([a,b]); } if(liste.length>=ant) break; }
  return liste;
}
const ettermiddag = h => h>12;
function forklarKlokke(boks,h,m){
  const t=h%12||12, neste=(h%12)+1;
  let tekst;
  if(m===0)  tekst=`Den lange viseren peker rett opp på 12. Den korte peker på ${t}.`;
  if(m===30) tekst=`Den lange viseren peker rett ned på 6. Den korte står midt mellom ${t} og ${neste}. Det er en halv time igjen til ${timeOrd(h+1)} – derfor heter det <b>halv ${timeOrd(h+1)}</b>.`;
  if(m===15) tekst=`Den lange viseren peker på 3. Det har gått et kvarter etter ${timeOrd(h)} – derfor heter det <b>kvart over ${timeOrd(h)}</b>.`;
  if(m===45) tekst=`Den lange viseren peker på 9. Det er et kvarter igjen til ${timeOrd(h+1)} – derfor heter det <b>kvart på ${timeOrd(h+1)}</b>.`;
  if(ettermiddag(h)) tekst+=` Etter klokka 12 teller den digitale klokka videre: ${t} om ettermiddagen er <b>${pad(h)}</b>.`;
  boks.innerHTML=`<div class="do-forklar">${klokkeSVG(h,m,{str:150})}<div><p class="do-stor">${digital(h,m)}</p><p>Det heter <b>${klokkeOrd(h,m)}</b>${ettermiddag(h)?' om ettermiddagen':''}.</p><p>${tekst}</p></div></div>`;
  Lyd.leggTil([k('det-heter'), tid(h,m), ettermiddag(h)?k('om-ettermiddagen'):null]);
}
const solmerke = h => ettermiddag(h) ? `<div class="do-solmerke">☀️ Ettermiddag</div>` : '';
const KLOKKE = {
  les(nivå,K){ // analog → velg digital
    const [h,m]=klokkeTid(nivå);
    return { tekst: ettermiddag(h) ? `Det er ettermiddag. Hvilken digital klokke viser det samme som fôringsklokka?` : `Se på fôringsklokka. Når kommer ${K.mat}ne?`,
      si:[k(ettermiddag(h)?'klokke-les-ettermiddag':'klokke-les')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-kolonne">${solmerke(h)}${klokkeSVG(h,m)}</div>`;
        const valg=[[h,m],...andreTider(h,m,nivå,2)].map(([a,b])=>digital(a,b));
        valgknapper(boks,valg,digital(h,m),svar,{html:v=>`<span class="do-digital">${v}</span>`}); },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
  ord(nivå,K){ // ord → velg klokke (analog, eller digital på nivå 6)
    const [h,m]=klokkeTid(nivå), riktig=digital(h,m), em=ettermiddag(h);
    return { tekst:`${cap(K.dino)} skal få mat <b>${klokkeOrd(h,m)}${em?' om ettermiddagen':''}</b>. Hvilken klokke viser det?`,
      si:[k(`e${K.id}-faar-mat`), tid(h,m), em?k('om-ettermiddagen'):null, k('hvilken-klokke')],
      tegn(boks,svar){ const valg=[[h,m],...andreTider(h,m,nivå,2)];
        if(em){ valgknapper(boks,valg.map(([a,b])=>digital(a,b)),riktig,svar,{html:v=>`<span class="do-digital">${v}</span>`}); return; }
        const rad=el('div','do-valg klokker');
        shuffle(valg).forEach(([a,b])=>{ const kn=el('button','do-knapp klokkeknapp',klokkeSVG(a,b,{str:150}));
          kn.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); const ok=digital(a,b)===riktig; kn.classList.add(ok?'rett':'feil'); svar(ok); };
          rad.appendChild(kn); });
        boks.appendChild(rad); },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
  still(nivå,K){ // digital → still analog (viserne henger sammen)
    const [h,m]=klokkeTid(nivå), startH=((h%12)===8)?11:8;
    const steg = nivå>=3 ? 15 : 30;
    return { tekst:`Fôringa er klokka <span class="do-digital liten">${digital(h,m)}</span>. Dra den lange viseren og still klokka.`,
      si:[k('foringa-er'), tid(h,m), ettermiddag(h)?k('om-ettermiddagen'):null, k('dra-viseren')],
      tegn(boks,svar){
        let tot=startH*60;
        boks.innerHTML=`<div class="do-midt do-still">${klokkeSVG(startH,0,{str:260,id:'doStill'})}</div>
          <div class="do-valg"><button class="do-knapp liten" data-d="-${steg}">◀ ${steg} min</button><button class="do-knapp go" data-ok>Ferdig</button><button class="do-knapp liten" data-d="${steg}">${steg} min ▶</button></div>`;
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
  navn(nivå,K){ // analog → hva heter klokka (fellene: halv ni / kvart på)
    let h,m; do { [h,m]=klokkeTid(Math.min(nivå,5)); } while(m===0 && nivå>1 && Math.random()<.7);
    const riktig=klokkeOrd(h,m), kand=[klokkeOrd(h+1,m), klokkeOrd(h,(m+30)%60), klokkeOrd(h-1,m), klokkeOrd(h,0), klokkeOrd(h+1,0)];
    if(m===45) kand.unshift(`kvart på ${timeOrd(h)}`);
    if(m===30) kand.unshift(`halv ${timeOrd(h)}`);
    const valg=[riktig, ...[...new Set(kand)].filter(x=>x!==riktig).slice(0,2)];
    return { tekst:`Hva heter klokka på fôringstavla?`, si:[k('hva-heter-klokka')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${klokkeSVG(h,m)}</div>`; valgknapper(boks,valg,riktig,svar); },
      forklar(boks){ forklarKlokke(boks,h,m); } };
  },
  rekkefølge(nivå,K){ // sorter tre klokker, tidligst først
    const tider=[]; while(tider.length<3){ const t=klokkeTid(5); if(!tider.some(x=>x[0]===t[0]&&x[1]===t[1])) tider.push(t); }
    const sortert=tider.slice().sort((a,b)=>(a[0]*60+a[1])-(b[0]*60+b[1]));
    const hendelser=['Fôring','Bading','Leketid'];
    return { tekst:`Hva skjer først i dag? Trykk på klokkene i riktig rekkefølge – den tidligste først.`, si:[k('rekkefolge')],
      tegn(boks,svar){ const rad=el('div','do-valg klokker'); const valgt=[];
        shuffle(tider).forEach((t,i)=>{ const kn=el('button','do-knapp klokkeknapp do-sorter',`${klokkeSVG(t[0],t[1],{str:140})}<span class="do-sortnr"></span>`);
          kn.onclick=()=>{ if(kn.dataset.n) return; valgt.push(t); kn.dataset.n=valgt.length; kn.querySelector('.do-sortnr').textContent=valgt.length; Lyd.pip(true);
            if(valgt.length===3){ rad.querySelectorAll('button').forEach(x=>x.disabled=true); svar(valgt.every((x,j)=>x===sortert[j])); } };
          rad.appendChild(kn); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${sortert.map((t,i)=>`<div class="do-kolonne"><b>${i+1}. ${hendelser[i]}</b>${klokkeSVG(t[0],t[1],{str:110})}<span>${digital(t[0],t[1])}</span></div>`).join('')}</div><p class="do-tips">Se på den korte viseren først: den viser timen.</p>`; } };
  },
};
const KLOKKETYPER = { 1:['les','ord','still'], 2:['les','ord','still','navn','navn'], 3:['les','ord','still','navn'], 4:['les','ord','still','navn'], 5:['les','ord','still','navn','rekkefølge'], 6:['les','ord','still','les'] };
function lagKlokke(nivå,K){ return KLOKKE[pick(KLOKKETYPER[nivå])](nivå,K); }

/* ---------- PENGER (nivå 1–6) ----------
   1 kjenn myntene · 2 betal til 50 kr · 3 sedler til 200 kr · 4 vekslebua · 5 til 500 kr · 6 penger tilbake
   Fra nivå 3 er alle beløp hele femmere, så tallene kan leses opp med få innleste klipp. */
const SEDDEL = { 50:{lys:'#d3e8c8',mørk:'#3f7a3a'}, 100:{lys:'#f4cdc6',mørk:'#a8352c'}, 200:{lys:'#cddcf1',mørk:'#2f5f9e'}, 500:{lys:'#f1d5bd',mørk:'#9a4f22'} };   // farger: bytt her
function seddelSVG(v){
  const c=SEDDEL[v];
  return `<svg class="do-seddel" width="124" height="66" viewBox="0 0 124 66" aria-label="${v} kroner">
    <rect x="2" y="2" width="120" height="62" rx="8" fill="${c.lys}" stroke="${c.mørk}" stroke-width="4"/>
    <rect x="10" y="10" width="104" height="46" rx="5" fill="none" stroke="${c.mørk}" stroke-width="1.5" stroke-dasharray="3 3"/>
    <circle cx="32" cy="33" r="14" fill="${c.mørk}" opacity=".22"/><path d="M24 38 q8 -12 16 0" stroke="${c.mørk}" stroke-width="2" fill="none" opacity=".5"/>
    <text x="84" y="44" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="30" fill="${c.mørk}">${v}</text></svg>`;
}
const penge = v => v>=50 ? seddelSVG(v) : myntSVG(v);
const VALØRER = [500,200,100,50,20,10,5,1];
function færrest(n){ const ut=[]; for(const v of VALØRER) while(n>=v){ ut.push(v); n-=v; } return ut; }
function myntForslag(pris){ return færrest(pris); }
const sum = a => a.reduce((x,y)=>x+y,0);
/* Kronebeløp som lydklipp: 0–50, femmere til 95, og «to hundre og …» */
function siKr(n){
  if(n<100) return [{tall:n}];
  const h=Math.floor(n/100), r=n%100;
  return r ? [k(`hundre-og-${h}`), {tall:r}] : [k(`hundre-${h}`)];
}
const pengenavn = v => v>=50 ? `${v}-lapp` : `${v}-krone`;
const pengeklipp = v => k(v>=50 ? `seddel-${v}` : `mynt-${v}`);
function forklarSum(boks,biter,pris){
  const s=sum(biter);
  boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${biter.map(penge).join('')||'<i>ingenting</i>'}</div>
    <div><p>${biter.length?biter.join(' + ')+' = <b>'+s+' kr</b>':'Du la ikke på noe.'}</p>
    ${pris!=null?`<p>Prisen er <b>${pris} kr</b>. ${s<pris?`Det mangler <b>${pris-s} kr</b>.`:s>pris?`Det er <b>${s-pris} kr</b> for mye.`:'Det stemmer!'}</p>`:''}</div></div>`;
}
function pris(nivå){
  if(nivå<=2) return 3+rnd(48);                       // 3–50
  if(nivå===3) return 5*(11+rnd(30));                 // 55–200
  return 5*(11+rnd(90));                              // 55–500
}
const LOMMEBOK = { 2:[1,5,10,20], 3:[5,10,20,50,100,200], 5:[5,10,20,50,100,200,500] };
const PENGER = {
  finn(nivå){ // trykk på riktig mynt/seddel
    const utvalg = nivå===1 ? [1,5,10,20] : [10,20,50,100,200,...(nivå>=5?[500]:[])];
    const mål=pick(utvalg), liste=shuffle([mål, ...shuffle(utvalg.filter(v=>v!==mål)).slice(0,4)]);
    return { tekst:`Kiosken trenger en <b>${pengenavn(mål)}</b>. Trykk på den.`, si:[k('kiosken-trenger'), pengeklipp(mål), k('trykk-paa-den')],
      tegn(boks,svar){ const rad=el('div','do-valg mynter');
        liste.forEach(v=>{ const b=el('button','do-knapp myntknapp',penge(v)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(v===mål?'rett':'feil'); svar(v===mål); }; rad.appendChild(b); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${penge(mål)}</div><div><p>Dette er en <b>${pengenavn(mål)}</b>. ${mål>=50?'Sedlene har hver sin farge.':mål>=10?'10- og 20-kronene er gull.':'1- og 5-kronene er sølv og har hull i midten.'}</p></div></div>`; } };
  },
  verdi(){ // hvor mye er mynten verdt
    const v=pick([1,5,10,20]);
    return { tekst:`Hvor mye er denne mynten verdt?`, si:[k('hvor-mye-mynten')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-stormynt">${myntSVG(v)}</div>`; valgknapper(boks,[1,5,10,20],v,svar,{html:x=>`${x} kr`}); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${myntSVG(v)}</div><div><p>Tallet på mynten viser hva den er verdt: <b>${v} kroner</b>.</p></div></div>`; } };
  },
  betal(nivå,K,{fåsteMulig=false}={}){ // legg nøyaktig beløp på disken
    const [vare,ikon]=pick(K.kiosk), p=pris(nivå), lommebok=LOMMEBOK[nivå>=5?5:nivå>=3?3:2];
    let lagt=[];
    const tekst = fåsteMulig ? `<span class="do-vare">${ikon}</span> Betal <b>${p} kr</b> for ${vare.toLowerCase()} med <b>så få mynter og sedler som mulig</b>.`
                             : `<span class="do-vare">${ikon}</span> ${vare} koster <b>${p} kr</b>. Legg nøyaktig ${p} kr på disken.`;
    const si = fåsteMulig ? [k('betal'), ...siKr(p), k('faa-som-mulig')]
                          : [k(`vare-${slug(vare)}`), k('koster'), ...siKr(p), k('kroner'), k('legg-noyaktig'), ...siKr(p), k('kroner-paa-disken')];
    return { tekst, si,
      tegn(boks,svar){
        lagt=[];
        boks.innerHTML=`<div class="do-disk"><div class="do-disktopp">Disken <span class="do-sum">${fåsteMulig?'':'0 kr'}</span></div><div class="do-myntrad" data-disk></div></div>
          <div class="do-lommebok">${lommebok.map(v=>`<button class="do-knapp myntknapp" data-v="${v}">${penge(v)}</button>`).join('')}</div>
          <p class="do-tips">Trykk for å legge på disken. Trykk på disken for å ta tilbake.</p>
          <div class="do-valg"><button class="do-knapp go" data-ok>Betal</button></div>`;
        const disk=boks.querySelector('[data-disk]'), s=boks.querySelector('.do-sum');
        const vis=()=>{ disk.innerHTML=lagt.map((v,i)=>`<button class="do-knapp myntknapp liten" data-i="${i}">${penge(v)}</button>`).join(''); if(!fåsteMulig || lagt.length) s.textContent=sum(lagt)+' kr'; };
        boks.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{ if(lagt.length<20){ lagt.push(+b.dataset.v); lagt.sort((a,b)=>b-a); vis(); } });
        disk.onclick=ev=>{ const b=ev.target.closest('[data-i]'); if(b){ lagt.splice(+b.dataset.i,1); vis(); } };
        boks.querySelector('[data-ok]').onclick=()=>{ if(!lagt.length) return; boks.querySelectorAll('button').forEach(x=>x.disabled=true);
          svar(sum(lagt)===p && (!fåsteMulig || lagt.length===færrest(p).length)); };
      },
      etterRiktig(boks){ // riktig beløp, men med flere biter enn nødvendig → vis en vennlig hint (gir fortsatt full uttelling)
        const f=færrest(p);
        if(fåsteMulig || lagt.length<=f.length) return null;
        const ord = f.some(v=>v>=50) || lagt.some(v=>v>=50) ? 'mynter og sedler' : 'mynter';
        boks.innerHTML=`<div class="do-forklar"><div><p>💡 Visste du at det går med <b>færre ${ord}</b>?</p>
          <div class="do-myntrad">${f.map(penge).join('')}</div>
          <p>${f.join(' + ')} = <b>${p} kr</b> – bare <b>${f.length}</b> i stedet for ${lagt.length}.</p>
          <p class="do-tips">Ta den største først.</p></div></div>`;
        return [k('faerre-tips')];
      },
      forklar(boks){ forklarSum(boks,lagt,p);
        const f=færrest(p);
        boks.insertAdjacentHTML('beforeend', fåsteMulig && sum(lagt)===p
          ? `<p class="do-tips">Riktig beløp – men det går med færre: <b>${f.join(' + ')}</b> (${f.length} stykker). Ta den største først.</p>`
          : `<p class="do-tips">Én måte å betale ${p} kr på: ${f.join(' + ')}. Ta den største først.</p>`); } };
  },
  tell(nivå){ // hvor mye ligger i kassa
    const valører = nivå<=2 ? [1,5,10,20] : nivå<=4 ? [5,10,20,50,100] : [10,20,50,100,200];
    const grense = nivå<=2 ? 50 : nivå<=4 ? 200 : 500;
    let m=[]; const n=nivå<=2?2+rnd(3):3+rnd(3); for(let i=0;i<n;i++) m.push(pick(valører)); m.sort((a,b)=>b-a);
    while(sum(m)>grense) m.shift();
    const s=sum(m), steg=nivå<=2?[1,5,10]:[5,10,50];
    const valg=[...new Set([s, s+pick(steg), Math.max(1,s-pick(steg)), s+pick(steg)*2])].filter(x=>x>0).slice(0,3);
    return { tekst:`Hvor mye penger ligger i kassa?`, si:[k('hvor-mye-kassa')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-myntrad stor">${m.map(penge).join('')}</div>`; valgknapper(boks,valg,s,svar,{html:x=>`${x} kr`}); },
      forklar(boks){ forklarSum(boks,m,null); boks.insertAdjacentHTML('beforeend','<p class="do-tips">Tips: tell de største først.</p>'); } };
  },
  veksle(){ // hvor mange får du for en seddel?
    const par=[[50,10],[50,5],[100,10],[100,20],[100,50],[200,20],[200,50],[200,100],[500,100]], [S,v]=pick(par), n=S/v;
    const flertall={5:'femkroner',10:'tikroner',20:'tjuekroner',50:'femtilapper',100:'hundrelapper'}[v];
    return { tekst:`Vekslebua: Du har en <b>${S}-lapp</b>. Hvor mange <b>${flertall}</b> får du for den?`, si:[k('du-har-en'), k(`seddel-${S}`), k('hvor-mange'), k(`flere-${v}`), k('faar-du-vekslebua')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-myntrad stor">${seddelSVG(S)} <span class="do-pil">→</span> ${penge(v)} <b class="do-stor">?</b></div>`; tallknapper(boks,1,10,n,svar); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div class="do-myntrad">${Array(n).fill(penge(v)).join('')}</div><div><p>${Array(n).fill(v).join(' + ')} = <b>${S} kr</b></p><p>Du får <b>${n}</b> ${flertall}.</p></div></div>`; } };
  },
  haug(){ // hvilken haug er like mye verdt som seddelen?
    const S=pick([50,100,200]), valører=S===50?[5,10,20]:[10,20,50];
    const lagHaug=mål=>{ const h=[]; let r=mål; while(r>0){ const v=pick(valører.filter(x=>x<=r)); h.push(v); r-=v; } return h.sort((a,b)=>b-a); };
    const riktig=lagHaug(S), feil1=lagHaug(S+pick(valører)), feil2=lagHaug(S-pick(valører.filter(x=>x<S)));
    const hauger=shuffle([riktig,feil1,feil2]);
    return { tekst:`Vekslebua: Hvilken haug er like mye verdt som en <b>${S}-lapp</b>?`, si:[k('hvilken-haug'), k(`seddel-${S}`)],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${seddelSVG(S)}</div>`; const rad=el('div','do-valg hauger');
        hauger.forEach(h=>{ const b=el('button','do-knapp haugknapp',`<div class="do-myntrad">${h.map(penge).join('')}</div>`); b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(h===riktig?'rett':'feil'); svar(h===riktig); }; rad.appendChild(b); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${hauger.map(h=>`<div class="do-kolonne"><div class="do-myntrad">${h.map(penge).join('')}</div><b>${h.join(' + ')} = ${sum(h)} kr</b>${h===riktig?' ✓':''}</div>`).join('')}</div>`; } };
  },
  tilbake(nivå,K){ // hvor mye får du tilbake?
    const [vare,ikon]=pick(K.kiosk);
    const S=pick([50,100,200,500]); const p=5*(1+rnd(S/5-1)); const t=S-p;
    const valg=[...new Set([t, t+pick([5,10]), Math.max(5,t-pick([5,10])), t+20])].filter(x=>x>0&&x!==p).slice(0,3);
    if(!valg.includes(t)) valg[0]=t;
    return { tekst:`<span class="do-vare">${ikon}</span> ${vare} koster <b>${p} kr</b>. Du betaler med en <b>${S}-lapp</b>. Hvor mye får du tilbake?`,
      si:[k(`vare-${slug(vare)}`), k('koster'), ...siKr(p), k('kroner'), k('du-betaler-med'), k(`seddel-${S}`), k('hvor-mye-tilbake')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-myntrad stor">${seddelSVG(S)}</div>`; valgknapper(boks,valg,t,svar,{html:x=>`${x} kr`}); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar"><div><p class="do-stor">${S} − ${p} = ${t}</p><p>Tell oppover fra prisen: fra ${p} kr til ${S} kr er det <b>${t} kr</b>.</p><div class="do-myntrad">${færrest(t).map(penge).join('')}</div></div></div>`;
        Lyd.leggTil(siKr(t).concat([k('kroner')])); } };
  },
};
const PENGETYPER = { 1:['finn','finn','verdi'], 2:['betal','betal','tell'], 3:['finn','betal','betal','tell'], 4:['veksle','veksle','haug'], 5:['betal','tell','faa'], 6:['tilbake','tilbake','betal'] };
function lagPenger(nivå,K){ const t=pick(PENGETYPER[nivå]); return t==='faa' ? PENGER.betal(5,K,{fåsteMulig:true}) : PENGER[t](nivå,K); }

/* ---------- 10-ER-VENNER (nivå 1–5) ----------
   1 se mengden · 2 hvor mange mangler · 3 bare tall · 4 vennepar · 5 100-venner */
const TIER = {
  hvorMange(){ const n=1+rnd(10);
    let valg=shuffle([...new Set([n, ...shuffle([n-1,n+1,n-2,n+2,10-n].filter(v=>v>=0&&v<=10&&v!==n))])]).slice(0,4);
    if(!valg.includes(n)) valg[0]=n;
    return { tekst:`Hvor mange egg ligger i rugekassa?`, si:[k('hvor-mange-egg')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(n)}</div>`; valgknapper(boks,valg,n,svar,{stor:true}); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n)}<div><p>${n>=5?`Øverste rad er full – det er <b>5</b>. ${n>5?`Pluss ${n-5} nederst blir <b>${n}</b>.`:''}`:`Det ligger <b>${n}</b> egg.`}</p></div></div>`; } };
  },
  legg(){ const n=2+rnd(9);
    return { tekst:`Legg <b>${n}</b> egg i rugekassa. Trykk på rutene.`, si:[k('legg'), {tall:n}, k('egg-i-rugekassa')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(0)}</div><div class="do-valg"><button class="do-knapp go" data-ok>Ferdig</button></div>`;
        const fylt=new Set();
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
  venn(){ const n=1+rnd(9);
    return { tekst:`<span class="do-stor">${n} + ? = 10</span><br>Finn 10-er-vennen til ${n}.`, si:[{tall:n}, k('pluss-hva-blir-ti')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${eggkasse(n)}</div>`; tallknapper(boks,0,10,10-n,svar); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n,{fremhev:true})}<div><p class="do-stor">${n} + ${10-n} = 10</p></div></div>`; } };
  },
  bareTall(){ // uten tierramme – den kan hentes fram som hjelp
    const n=1+rnd(9), snu=Math.random()<.4;
    return { tekst:`<span class="do-stor">${snu?`? + ${n}`:`${n} + ?`} = 10</span>`, si:[{tall:n}, k('pluss-hva-blir-ti')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt do-kolonne"><div data-hjelp></div><button class="do-knapp liten" data-vis>🥚 Vis rugekassa</button></div>`;
        boks.querySelector('[data-vis]').onclick=e=>{ boks.querySelector('[data-hjelp]').innerHTML=eggkasse(n); e.currentTarget.remove(); };
        tallknapper(boks,0,10,10-n,svar); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(n,{fremhev:true})}<div><p class="do-stor">${n} + ${10-n} = 10</p></div></div>`; } };
  },
  vennepar(){ // finn de to eggene som blir 10 sammen
    const a=1+rnd(9), b=10-a, tall=[a,b];
    while(tall.length<5){ const x=1+rnd(9); if(!tall.includes(x) && !tall.includes(10-x)) tall.push(x); }
    const egg=shuffle(tall);
    return { tekst:`Finn de <b>to</b> eggene som blir <b>10</b> til sammen.`, si:[k('finn-to-ti')],
      tegn(boks,svar){ const rad=el('div','do-valg do-eggrad'); const valgt=[];
        egg.forEach(x=>{ const kn=el('button','do-tallegg',`<span>${x}</span>`);
          kn.onclick=()=>{ if(valgt.includes(kn)){ valgt.splice(valgt.indexOf(kn),1); kn.classList.remove('valgt'); return; }
            valgt.push(kn); kn.classList.add('valgt'); Lyd.pip(true);
            if(valgt.length===2){ rad.querySelectorAll('button').forEach(y=>y.disabled=true); const ok=sum(valgt.map(y=>+y.textContent))===10; valgt.forEach(y=>y.classList.add(ok?'rett':'feil')); svar(ok); } };
          rad.appendChild(kn); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${eggkasse(a,{fremhev:true})}<div><p class="do-stor">${a} + ${b} = 10</p><p>${a} og ${b} er 10-er-venner.</p></div></div>`; } };
  },
  hundre(){ // 100-venner med tiere
    const n=10*(1+rnd(9));
    const kasser=t=>`<div class="do-hundre">${Array.from({length:10},(_,i)=>`<i class="${i<t/10?'full':''}"></i>`).join('')}</div>`;
    return { tekst:`<span class="do-stor">${n} + ? = 100</span><br>Hver stav er en full eggkasse med 10 egg.`, si:[{tall:n}, k('pluss-hva-blir-hundre')],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${kasser(n)}</div>`;
        const rad=el('div','do-tallpad'); for(let v=0;v<=100;v+=10){ const b=el('button','do-knapp tall',String(v)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); b.classList.add(v===100-n?'rett':'feil'); svar(v===100-n); }; rad.appendChild(b); }
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${kasser(n)}<div><p class="do-stor">${n} + ${100-n} = 100</p><p>${n/10} + ${10-n/10} = 10, så ${n} + ${100-n} = 100.</p></div></div>`; } };
  },
};
const TIERTYPER = { 1:['hvorMange','hvorMange','legg'], 2:['mangler','mangler','venn'], 3:['bareTall','bareTall','mangler'], 4:['vennepar','vennepar','bareTall'], 5:['hundre','hundre','vennepar'] };
function lagTier(nivå,K){ return TIER[pick(TIERTYPER[nivå])](nivå,K); }

/* ---------- LYDER (nivå 1–5) ----------
   1 første lyd (2 valg) · 2 første lyd (4 valg) · 3 siste lyd · 4 lyden i midten · 5 fotsporboksene */
const VOKALER = 'AEIOUYÆØÅ'.split('');
const ordLyd = o => ({ord:o.fil, reserve:o.ord});
function forklarLyd(boks,o,pos='f'){
  const b=o[pos], ord=o.ord.toUpperCase();
  const i = pos==='f' ? 0 : pos==='s' ? ord.lastIndexOf(b) : ord.indexOf(b,1);
  const vist = ord.split('').map((c,j)=>j===i?`<b class="do-uthev">${c}</b>`:c).join('');
  const tekst = pos==='f' ? `begynner med lyden <b>${b}</b>` : pos==='s' ? `slutter med lyden <b>${b}</b>` : `har lyden <b>${b}</b> i midten`;
  boks.innerHTML=`<div class="do-forklar">${imgFor(o.fil)}<div><p class="do-stor">${vist}</p><p><b>${cap(o.ord)}</b> ${tekst}.</p>
    <button class="do-knapp liten" data-hør>🔊 Hør igjen</button></div></div>`;
  const lyd=[ordLyd(o),{pause:250},k(pos==='f'?'begynner-med':pos==='s'?'slutter-med':'har-i-midten'),{bokstav:b}];
  boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(lyd);
  Lyd.leggTil(lyd);
}
const LYDER = {
  første(nivå){
    const o=pick(LYDORD), ant=nivå===1?2:4;
    const valg=[o.f, ...shuffle(BOKSTAVER.filter(b=>b!==o.f)).slice(0,ant-1)];
    return { tekst:`Hvilken lyd hører du <b>først</b>?`, si:[k('hvilken-lyd-forst'), ordLyd(o)],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div><div class="do-valg"><button class="do-knapp liten" data-hør>🔊 Hør ordet</button></div>`;
        boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(ordLyd(o));
        valgknapper(boks,valg,o.f,svar,{stor:true}); },
      forklar(boks){ forklarLyd(boks,o,'f'); } };
  },
  kresen(nivå,K){ // tre bilder, ett begynner med lyden
    const o=pick(LYDORD), andre=shuffle(LYDORD.filter(x=>x.f!==o.f)).slice(0,2), alle=shuffle([o,...andre]);
    return { tekst:`${cap(K.dinoEn)} er kresen! Den vil bare spise ting som begynner med <b class="do-uthev">${o.f}</b>.`,
      si:[k(`e${K.id}-kresen`), {bokstav:o.f}, {pause:400}, ...alle.flatMap(x=>[ordLyd(x),{pause:300}])],
      tegn(boks,svar){ const rad=el('div','do-valg bilder');
        alle.forEach(x=>{ const b=el('button','do-knapp bildeknapp',imgFor(x.fil)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(y=>y.disabled=true); b.classList.add(x===o?'rett':'feil'); Lyd.spill(ordLyd(x)); svar(x===o); }; rad.appendChild(b); });
        boks.appendChild(rad);
        const h=el('div','do-valg'); const hb=el('button','do-knapp liten','🔊 Hør lyden'); hb.onclick=()=>Lyd.spill({bokstav:o.f}); h.appendChild(hb); boks.appendChild(h); },
      forklar(boks){ forklarLyd(boks,o,'f'); } };
  },
  siste(){
    const o=pick(LYDORD.filter(x=>x.s && x.s!==x.f));
    const valg=[o.s, ...shuffle(BOKSTAVER.filter(b=>b!==o.s && b!==o.f)).slice(0,2)];
    return { tekst:`Hvilken lyd hører du <b>sist</b>?`, si:[k('hvilken-lyd-sist'), ordLyd(o)],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div><div class="do-valg"><button class="do-knapp liten" data-hør>🔊 Hør ordet</button></div>`;
        boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(ordLyd(o));
        valgknapper(boks,valg,o.s,svar,{stor:true}); },
      forklar(boks){ forklarLyd(boks,o,'s'); } };
  },
  midt(){
    const o=pick(LYDORD.filter(x=>x.m));
    const valg=[o.m, ...shuffle(VOKALER.filter(b=>b!==o.m)).slice(0,2)];
    return { tekst:`Hvilken lyd hører du <b>i midten</b>?`, si:[k('hvilken-lyd-midt'), ordLyd(o)],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div><div class="do-valg"><button class="do-knapp liten" data-hør>🔊 Hør ordet</button></div>`;
        boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(ordLyd(o));
        valgknapper(boks,valg,o.m,svar,{stor:true}); },
      forklar(boks){ forklarLyd(boks,o,'m'); } };
  },
  fotspor(){ // hvor i ordet er lyden? (ord med tre lyder)
    const o=pick(LYDORD.filter(x=>x.m && x.s && new Set([x.f,x.m,x.s]).size===3)), pos=pick(['f','m','s']), b=o[pos];
    const idx={f:0,m:1,s:2}[pos];
    return { tekst:`Hvor i ordet hører du lyden <b class="do-uthev">${b}</b>? Trykk på riktig fotspor.`, si:[k('hvor-i-ordet'), {bokstav:b}, {pause:300}, ordLyd(o)],
      tegn(boks,svar){ boks.innerHTML=`<div class="do-midt">${imgFor(o.fil)}</div><div class="do-valg"><button class="do-knapp liten" data-hør>🔊 Hør ordet</button><button class="do-knapp liten" data-lyd>🔊 Hør lyden</button></div>`;
        boks.querySelector('[data-hør]').onclick=()=>Lyd.spill(ordLyd(o)); boks.querySelector('[data-lyd]').onclick=()=>Lyd.spill({bokstav:b});
        const rad=el('div','do-valg do-fotspor');
        ['først','i midten','sist'].forEach((navn,i)=>{ const kn=el('button','do-fot-knapp',`<span class="do-fotavtrykk">🐾</span><small>${navn}</small>`);
          kn.onclick=()=>{ rad.querySelectorAll('button').forEach(x=>x.disabled=true); kn.classList.add(i===idx?'rett':'feil'); svar(i===idx); }; rad.appendChild(kn); });
        boks.appendChild(rad); },
      forklar(boks){ boks.innerHTML=`<div class="do-forklar">${imgFor(o.fil)}<div><div class="do-fotspor vis">${[o.f,o.m,o.s].map((x,i)=>`<span class="${i===idx?'uthev':''}">${x}</span>`).join('')}</div>
          <p>I <b>${o.ord}</b> hører du <b>${b}</b> ${['først','i midten','sist'][idx]}.</p></div></div>`;
        Lyd.leggTil([ordLyd(o),{pause:300},{bokstav:o.f},{pause:200},{bokstav:o.m},{pause:200},{bokstav:o.s}]); } };
  },
};
const LYDTYPER = { 1:['første'], 2:['første','kresen'], 3:['siste','siste','første'], 4:['midt','midt','siste'], 5:['fotspor','fotspor','midt'] };
function lagLyder(nivå,K){ return LYDER[pick(LYDTYPER[nivå])](nivå,K); }

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
/* Nivå 4: hør ordet og finn riktig skilt. Nivå 5: små setninger (bilder og innlesing fra Myntlands Setningsverksted). */
const SETNINGER = [
  ['katten-sover-godt','Katten sover godt.'],['musa-spiser-osten','Musa spiser osten.'],['hunden-loeper-fort','Hunden løper fort.'],
  ['flyet-flyr-hoeyt','Flyet flyr høyt.'],['bussen-stopper-her','Bussen stopper her.'],['frosken-hopper-langt','Frosken hopper langt.'],
  ['loeven-broeler-hoeyt','Løven brøler høyt.'],['maanen-lyser-sterkt','Månen lyser sterkt.'],['hesten-spiser-gress','Hesten spiser gress.'],
  ['fisken-svoemmer-stille','Fisken svømmer stille.'],['blomsten-lukter-godt','Blomsten lukter godt.'],['sola-skinner-varmt','Sola skinner varmt.'],
  ['bilen-kjoerer-sakte','Bilen kjører sakte.'],['toget-kommer-snart','Toget kommer snart.'],['ugla-sitter-stille','Ugla sitter stille.'],
  ['vi-spiser-eple','Vi spiser eple.'],['gutten-leser-boka','Gutten leser boka.'],['fuglen-sitter-i-treet','Fuglen sitter i treet.'],
  ['hesten-spiser-et-eple','Hesten spiser et eple.'],['katten-sover-paa-stolen','Katten sover på stolen.'],['gutten-leser-om-store-dinosaurer','Gutten leser om store dinosaurer.'],
].map(([fil,tekst])=>({fil,tekst,først:tekst.split(' ')[0]}));
const setnBilde = s => `<img class="do-pic" src="bilder/setninger/setn-${s.fil}.webp" alt="" onerror="this.onerror=null;this.src='https://myntland.no/bilder/setninger/setn-${s.fil}.webp'">`;
LES.hørOrd = function(){ // hør ordet → velg riktig skilt
  const liste=[...ENSTAV,...TO_STAV], o=pick(liste), alle=[o,...lignende(o,liste,2)];
  return { tekst:`Hør ordet. Hvilket skilt er det?`, si:[k('hoer-og-finn'), {pause:200}, {ord:o.fil,reserve:o.ord}],
    tegn(boks,svar){ boks.innerHTML=`<div class="do-valg"><button class="do-knapp" data-hør>🔊 Hør ordet</button></div>`;
      boks.querySelector('[data-hør]').onclick=()=>Lyd.spill({ord:o.fil,reserve:o.ord});
      valgknapper(boks,alle,o,svar,{html:x=>skilt(x,false)}).classList.add('skilt'); },
    forklar(boks){ forklarLes(boks,o,false); } };
};
LES.setning = function(){ // les setningen → velg bildet
  const s=pick(SETNINGER), andre=shuffle(SETNINGER.filter(x=>x.først!==s.først)).slice(0,2), alle=shuffle([s,...andre]);
  return { tekst:`Les setningen. Hvilket bilde passer?`, si:[k('les-setningen')],
    tegn(boks,svar){ boks.innerHTML=`<div class="do-midt"><div class="do-skilt do-setning"><span>${visOrd(s.tekst)}</span></div></div>`;
      const rad=el('div','do-valg bilder');
      alle.forEach(x=>{ const b=el('button','do-knapp bildeknapp',setnBilde(x)); b.onclick=()=>{ rad.querySelectorAll('button').forEach(y=>y.disabled=true); b.classList.add(x===s?'rett':'feil'); svar(x===s); }; rad.appendChild(b); });
      boks.appendChild(rad); },
    forklar(boks){ boks.innerHTML=`<div class="do-forklar">${setnBilde(s)}<div><p class="do-lesord">${visOrd(s.tekst)}</p><button class="do-knapp liten" data-hør>🔊 Hør setningen</button></div></div>`;
      const lyd={fil:`lyd/setn-${s.fil}.mp3`, reserve:s.tekst};
      boks.querySelector('[data-hør]').onclick=()=>Lyd.spill([lyd]); Lyd.leggTil([lyd]); } };
};
const LESTYPER = { 1:['ordTilBilde','ordTilBilde','bildeTilOrd'], 2:['ordTilBilde','ordTilBilde','bildeTilOrd'], 3:['ordTilBilde','bildeTilOrd'], 4:['hørOrd','hørOrd','ordTilBilde'], 5:['setning','setning','hørOrd'] };
function lagStavelser(nivå){ const t=pick(LESTYPER[nivå]); return LES[t](t==='ordTilBilde'||t==='bildeTilOrd' ? Math.min(nivå,3) : nivå); }

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
  const nivå=Math.min(t.nivå,BYGDE[id]);
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
    let ekstraLyd=null;
    if(o.etterRiktig){ const tips=el('div','do-forklarboks'); ekstraLyd=o.etterRiktig(tips); if(ekstraLyd) fot.insertBefore(tips, $d('doNeste')); }
    Lyd.spill([k(`ros-${ROS.indexOf(ros)+1}`), ...(ekstraLyd||[])]);
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
    if(t.nivå<BYGDE[R.id]) t.nivå++;
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
    stjerne = R.nyStjerne<BYGDE[R.id]
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
    const res=Array.from({length:BYGDE[st.id]},(_,i)=>i+1).filter(n=>(t.hist[n]||[]).length||n<=t.nivå).map(n=>{ const a=t.hist[n]||[]; return `Nivå ${n}: ${a.length?`${a.reduce((x,y)=>x+y,0)}/${a.length}`:'–'}${t.mestret.includes(n)?' ⭐':''}`; }).join('<br>');
    h+=`<tr><td>${st.ikon} <b>${st.navn}</b><br><small>${st.tema}</small></td>
      <td><select data-tema="${st.id}" class="do-input">${NIVÅNAVN[st.id].slice(0,BYGDE[st.id]).map((n,i)=>`<option value="${i+1}" ${t.nivå===i+1?'selected':''}>${i+1}: ${n}</option>`).join('')}</select></td>
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
.do-seddel{display:block}.do-valg.mynter .do-seddel,.do-lommebok .do-seddel{zoom:1.15}.do-myntrad.stor .do-seddel{zoom:1.2}
.do-pil{font:700 40px Fredoka;margin:0 6px}
.do-valg.hauger .haugknapp{padding:8px;max-width:340px}.do-valg.hauger .do-myntrad{min-height:0}
.do-kolonne{display:flex;flex-direction:column;align-items:center;gap:6px}
.do-solmerke{background:#fff3cf;border:2px solid #e0a21f;border-radius:999px;padding:2px 14px;font:600 18px Fredoka}
.do-sorter{position:relative}.do-sortnr{position:absolute;top:6px;left:6px;width:38px;height:38px;border-radius:50%;background:#3f86c9;color:#fff;font:700 22px Fredoka;display:grid;place-items:center}
.do-sortnr:empty{display:none}
.do-eggrad{gap:14px}
.do-tallegg{width:96px;height:120px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;border:3px solid #1f3b2c;background:radial-gradient(circle at 35% 30%,#fff,#f6ecd0 55%,#d9c79a);
  font:700 40px Fredoka;color:#1f3b2c;cursor:pointer;box-shadow:0 5px 0 rgba(31,59,44,.2);touch-action:manipulation}
.do-tallegg.valgt{outline:5px solid #f2a33a;outline-offset:2px}.do-tallegg.rett{background:#bfeac4}.do-tallegg.feil{background:#ffd9c2}
.do-hundre{display:flex;gap:6px;background:#9a6a3e;padding:10px;border-radius:14px;border:3px solid #1f3b2c}
.do-hundre i{width:26px;height:130px;border-radius:8px;background:#e9c46a;box-shadow:inset 0 3px 0 rgba(0,0,0,.12)}
.do-hundre i.full{background:repeating-linear-gradient(#fff8e6 0 9px,#d9c79a 9px 13px);border:2px solid #1f3b2c}
.do-fotspor{gap:14px}.do-fot-knapp{width:120px;height:120px;border:3px solid #1f3b2c;border-radius:24px;background:#fbf0de;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 5px 0 rgba(31,59,44,.2);font:600 18px Fredoka;color:#1f3b2c;touch-action:manipulation}
.do-fotavtrykk{font-size:46px}.do-fot-knapp.rett{background:#bfeac4}.do-fot-knapp.feil{background:#ffd9c2}
.do-fotspor.vis{display:flex}.do-fotspor.vis span{width:64px;height:64px;display:grid;place-items:center;border:3px solid #1f3b2c;border-radius:16px;font:700 32px Fredoka;background:#fff}
.do-fotspor.vis span.uthev{background:#fff3cf;color:#c2453a}
.do-setning span{font-size:clamp(26px,4vw,40px)!important;letter-spacing:1px!important}
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
  g=gruppe('Nye oppgavetekster (nivå 3–6)','Til de høyere nivåene: kvart over/på og ettermiddag, sedler og veksling, 100-venner, siste lyd og lyden i midten, og lesing av setninger.');
  [['klokke-les-ettermiddag','Det er ettermiddag. Hvilken digital klokke viser det samme?'],['om-ettermiddagen','om ettermiddagen.'],
   ['rekkefolge','Hva skjer først i dag? Trykk på klokkene i riktig rekkefølge. Den tidligste først.'],
   ['seddel-50','femtilapp'],['seddel-100','hundrelapp'],['seddel-200','tohundrelapp'],['seddel-500','femhundrelapp'],
   ['du-har-en','Du har en'],['hvor-mange','Hvor mange'],['flere-5','femkroner'],['flere-10','tikroner'],['flere-20','tjuekroner'],['flere-50','femtilapper'],['flere-100','hundrelapper'],
   ['faar-du-vekslebua','får du for den i vekslebua?'],['hvilken-haug','Hvilken haug er like mye verdt som en'],
   ['betal','Betal'],['faa-som-mulig','kroner med så få mynter og sedler som mulig.'],['du-betaler-med','Du betaler med en'],['hvor-mye-tilbake','Hvor mye får du tilbake?'],
   ['hundre-1','Hundre.'],['hundre-2','To hundre.'],['hundre-3','Tre hundre.'],['hundre-4','Fire hundre.'],['hundre-5','Fem hundre.'],
   ['hundre-og-1','Hundre og'],['hundre-og-2','To hundre og'],['hundre-og-3','Tre hundre og'],['hundre-og-4','Fire hundre og'],
   ['finn-to-ti','Finn de to eggene som blir ti til sammen.'],['pluss-hva-blir-hundre','pluss hva blir hundre?'],
   ['hvilken-lyd-sist','Hvilken lyd hører du sist i'],['hvilken-lyd-midt','Hvilken lyd hører du i midten av'],['slutter-med','slutter med'],['har-i-midten','har i midten'],
   ['hvor-i-ordet','Hvor i ordet hører du lyden'],['hoer-og-finn','Hør ordet. Hvilket skilt er det?'],['les-setningen','Les setningen. Hvilket bilde passer?'],
  ].forEach(([n,t])=>reg(g,n,t));
  g=gruppe('Ros og tilbakemelding','Spilles når eleven svarer, og når runden er ferdig. Glad og varm stemme.');
  ROS.forEach((t,i)=>reg(g,`ros-${i+1}`,t));
  [['ikke-helt','Ikke helt. Se her.'],['faerre-tips','Visste du at det går med færre? Se her.'],['runden-ferdig','Runden er ferdig! Du fikk'],['mynter','mynter.'],['ny-stjerne','Og en ny stjerne!']].forEach(([n,t])=>reg(g,n,t));
  g=gruppe('Mynter','Brukes i «Kiosken trenger en …».');
  [[1,'enkrone'],[5,'femkrone'],[10,'tikrone'],[20,'tjuekrone']].forEach(([v,t])=>reg(g,`mynt-${v}`,t));
  g=gruppe('Klokkeslett','Alle hele, halve og kvarte timer. Les dem som et svar: «Halv ni.» De samme ordene brukes både om formiddagen og ettermiddagen.');
  for(const m of [0,30,15,45]) for(let h=1;h<=12;h++){ const n='tid-'+slug(klokkeOrd(h,m)); if(!(n in KLIPP)) reg(g,n,cap(klokkeOrd(h,m))+'.'); }
  g=gruppe('Tall','Tallene står skrevet som ord, så stemmen uttaler dem på norsk. 55–95 (i femmere) er nye – de brukes til kronebeløp på de høyere nivåene.');
  const EN=['null','en','to','tre','fire','fem','seks','sju','åtte','ni','ti','elleve','tolv','tretten','fjorten','femten','seksten','sytten','atten','nitten'];
  const TI={20:'tjue',30:'tretti',40:'førti',50:'femti',60:'seksti',70:'sytti',80:'åtti',90:'nitti'};
  const tallOrd = n => n<20 ? EN[n] : TI[n-n%10] + (n%10 ? EN[n%10] : '');   // skrevet som ord, så ElevenLabs leser norsk
  for(let n=0;n<=50;n++) reg(g,`tall-${n}`,cap(tallOrd(n))+'.',`tall-${n}.mp3`);
  for(let n=55;n<=95;n+=5) reg(g,`tall-${n}`,cap(tallOrd(n))+'.',`tall-${n}.mp3`);   // femmere til 95 (kronebeløp på høyere nivåer)
  for(const [id,Ku] of Object.entries(KULISSE)){
    g=gruppe(`Innhegning ${id}: ${['','Triceratops-enga','Langhalsskogen','T-rex-kløfta','Raptorreiret','Flygeøgle-kuppelen','Stegosaurus-sumpen'][id]}`,'Setninger med dinoens navn og maten i innhegningen, og varene i kiosken.');
    reg(g,`e${id}-faar-mat`,`${cap(Ku.dino)} skal få mat`);
    reg(g,`e${id}-botta`,`Fôrbøtta tar ti ${Ku.mat}. Det er`);
    reg(g,`e${id}-kresen`,`${cap(Ku.dinoEn)} er kresen! Den vil bare spise ting som begynner med`);
    Ku.kiosk.forEach(([v])=>{ if(!(`vare-${slug(v)}` in KLIPP)) reg(g,`vare-${slug(v)}`,v); });   // varer som fins fra før, gjenbrukes
  }
  g=gruppe('Stavelser','Brukes når eleven har svart feil i Skiltstien: «ka – ke – kake». Les hver stavelse kort og tydelig, slik den høres ut inne i ordet.');
  [...new Set(TO_STAV.flatMap(o=>o.stav))].forEach(st=>reg(g,'stav-'+slug(st),st.toLowerCase()));
}
function klippListe(){ return KLIPPGRUPPER.map(g=>({navn:g.navn, ingress:g.ingress, klipp:g.klipp.map(x=>({...x, fins:g.fins?g.fins(x.navn):false}))})); }

window.DinoOppgaver = { open, status, voksen, klippListe, STASJONER, NIVÅNAVN, lesPark, KULISSE, _test:{ LAG, KULISSE, klokkeOrd, myntForslag } };
})();
