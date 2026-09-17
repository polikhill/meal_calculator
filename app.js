import { LANGS, detectLang, getLang, setLang, t, N, GNAME, GROUPS, HELP_T, CALC_HELP } from './i18n.js';
import { PRODUCTS, MEALS, r10, mealGuide, mealHint } from './data.js';

const DEFAULT_TARGET={k:0,p:0,f:0,c:0};
const hasGoal=()=>T().k>0;
const T=()=>state.target;
const pf=v=>{const n=parseFloat(String(v??'').trim().replace(',','.'));return isFinite(n)?n:0;};
const syncC=()=>{const t=state.target;t.c=Math.max(0,(t.k-t.p*4-t.f*9)/4);};

const KEY='raciony-v2',OLDKEY='raciony-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const Z=()=>({k:0,p:0,f:0,c:0});
const fmt=(n,d=0)=>(+n||0).toLocaleString(t('locale'),{maximumFractionDigits:d});
const potDefault=()=>[{pid:'sushi',g:200},{pid:'chk_mince',g:500},{pid:'cabbage',g:400},{pid:'veg_oil',g:15},{pid:'sesame_oil',g:10},{pid:'soy',g:30},{pid:'gochu',g:20},{pid:'chili_oil',g:10}];
const pad=n=>String(n).padStart(2,'0');
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const isISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
const shiftISO=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number);const dt=new Date(y,m-1,d+n);return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;};
const fmtDate=iso=>{const [y,m,d]=iso.split('-'),sp=t('datesep');return `${d}${sp}${m}${sp}${y}`;};
const wd=(iso,long)=>{const [y,m,d]=iso.split('-').map(Number);return t(long?'wdl':'wd').split(',')[new Date(y,m-1,d).getDay()];};
const emptyDay=()=>({meals:{breakfast:[],lunch:[],snack:[],dinner:[]},extra:[]});

function defaultState(){return {view:'day',lang:detectLang(),calc:{sex:'f',w:'',h:'',a:'',act:'1.375'},date:todayISO(),days:{},target:{...DEFAULT_TARGET},mine:[],pot:{rows:potDefault(),tare:0,gross:1310,portion:350,to:'dinner'}};}
function normDay(d){const b=emptyDay();if(!d||typeof d!=='object')return b;
  const o=Object.assign(b,d,{meals:Object.assign(b.meals,d.meals||{}),extra:Array.isArray(d.extra)?d.extra.filter(e=>e&&e.id&&e.name):[]});
  if(o.drink&&o.drink!=='none'){o.meals.snack.push({pid:(o.drink==='matcha'?'mat':'cap')+(o.milk==='milk35'?'35':'16'),g:100});}
  delete o.drink;delete o.milk;
  for(const e of o.extra)if(!Array.isArray(o.meals[e.id]))o.meals[e.id]=[];
  return o;}
function merge(s){
  const d=defaultState();
  const st=Object.assign(d,s,{pot:Object.assign(d.pot,s.pot||{}),mine:s.mine||[],target:Object.assign(d.target,s.target||{}),calc:Object.assign(d.calc,s.calc||{}),days:{}});
  for(const k of Object.keys(s.days||{}))if(isISO(k))st.days[k]=normDay(s.days[k]);
  if(!isISO(st.date))st.date=todayISO();
  if(!LANGS.includes(st.lang))st.lang=detectLang();
  return st;
}
function load(){
  try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.target)return merge(s);}catch(e){}
  try{const o=JSON.parse(localStorage.getItem(OLDKEY)||'null');
    if(o&&o.target){const st=defaultState();st.mine=o.mine||[];st.pot=Object.assign(st.pot,o.pot||{});return st;}
  }catch(e){}
  return defaultState();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
let state=load();
setLang(state.lang);
const cur=()=>state.days[state.date]||(state.days[state.date]=emptyDay());
const peek=iso=>state.days[iso]||emptyDay();

const allP=()=>PRODUCTS.concat(state.mine||[]);
const byId=id=>allP().find(x=>x.id===id);
const groups=()=>[...new Set(allP().map(x=>x.g))];
function info(r){const i=r.custom||byId(r.pid)||{n:'?',k:0,p:0,f:0,c:0};return r.custom&&r.custom.pot?Object.assign({},i,{n:t('pot_custom')}):i;}
function scaled(r){const i=info(r),m=(+r.g||0)/100;return {k:i.k*m,p:i.p*m,f:i.f*m,c:i.c*m};}
const addT=(a,b)=>({k:a.k+b.k,p:a.p+b.p,f:a.f+b.f,c:a.c+b.c});
const scale=(t,x)=>({k:t.k*x,p:t.p*x,f:t.f*x,c:t.c*x});
const sum=rows=>rows.reduce((t,r)=>addT(t,scaled(r)),Z());
const allMeals=d=>MEALS.concat((d.extra||[]).map(e=>({id:e.id,name:e.name,custom:true})));
const mealName=m=>m.custom?m.name:t('m_'+m.id);
const mealRowsOf=(d,id)=>d.meals[id]||[];
const dayTotal=d=>allMeals(d).reduce((t,m)=>addT(t,sum(mealRowsOf(d,m.id))),Z());
const hasData=d=>allMeals(d).some(m=>mealRowsOf(d,m.id).length);
const listOf=el=>el.dataset.scope==='pot'?state.pot.rows:cur().meals[el.dataset.meal];
const getRow=el=>{const r=el.closest('.row');return listOf(r)[+r.dataset.i];};

function macroLine(m,withK=true){
  return (withK?`<b>${fmt(m.k)} ${t('kcal')}</b>`:'')+
  `<span class="m"><i style="background:var(--p)"></i>${t('P')} ${fmt(m.p,1)}</span>`+
  `<span class="m"><i style="background:var(--f)"></i>${t('F')} ${fmt(m.f,1)}</span>`+
  `<span class="m"><i style="background:var(--c)"></i>${t('C')} ${fmt(m.c,1)}</span>`;
}
function productOptions(sel){
  return groups().map(g=>`<optgroup label="${esc(GNAME(g))}">`+allP().filter(x=>x.g===g).map(x=>`<option value="${x.id}"${x.id===sel?' selected':''}>${esc(N(x.n))}</option>`).join('')+'</optgroup>').join('');
}
function rowHTML(scope,meal,i,r){
  const name=r.custom?`<div class="custom-name">${esc(info(r).n)}<small>${fmt(r.custom.k)} ${t('kcal100')}</small></div>`
    :`<button class="pick" data-act="pick" type="button">${esc(N(info(r).n))}</button>`;
  return `<div class="row" data-scope="${scope}" data-meal="${meal}" data-i="${i}">${name}
    <label class="g"><input type="text" inputmode="decimal" value="${r.g===''||r.g==null?'':r.g}" placeholder="0" data-act="g" aria-label="${t('grams')}"><span>${t('g')}</span></label>
    <button class="x" data-act="del" aria-label="${t('delete')}">×</button>
    <div class="rm" data-role="rm">${macroLine(scaled(r))}</div></div>`;
}
function _mealHint(m){return mealHint(m, hasGoal(), T());}
function mealHTML(m){
  const rows=mealRowsOf(cur(),m.id);
  return `<section class="card meal" data-meal="${m.id}">
    <header><div><h2>${esc(mealName(m))}${m.custom?` <button class="x sm" data-act="renmeal" data-meal="${m.id}" aria-label="${t('rename')}" title="${t('rename')}">✎</button>`:''}</h2>${_mealHint(m)?`<p class="hint">${_mealHint(m)}</p>`:''}</div><div class="mt" data-role="mt-${m.id}"></div></header>
    <div>${rows.map((r,i)=>rowHTML('meal',m.id,i,r)).join('')}</div>
    <div class="actions">
      <button class="btn" data-act="add" data-meal="${m.id}">${t('add_food')}</button>
      ${rows.length?`<button class="btn ghost" data-act="clear" data-meal="${m.id}">${t('clear')}</button>`:''}
      ${m.custom?`<button class="btn ghost" data-act="delmeal" data-meal="${m.id}">${t('del_meal')}</button>`:''}
    </div></section>`;
}
function dateTitle(iso){const td=todayISO();if(iso===td)return `${t('today_')}, ${wd(iso,true)}`;if(iso===shiftISO(td,-1))return `${t('yesterday')}, ${wd(iso,true)}`;if(iso===shiftISO(td,1))return `${t('tomorrow')}, ${wd(iso,true)}`;return wd(iso,true);}
function dayHTML(){
  return `<div class="datebar">
    <button class="nav" data-act="dprev" aria-label="${t('prev_day')}">‹</button>
    <div class="dl"><div class="dt" id="dtitle">${dateTitle(state.date)}</div><input type="date" data-act="date" value="${state.date}" aria-label="${t('date')}"></div>
    <button class="nav" data-act="dnext" aria-label="${t('next_day')}">›</button></div>`+
    allMeals(cur()).map(mealHTML).join('')+
    `<button class="btn wide" data-act="addmeal">${t('add_meal')}</button>`+
    (hasData(cur())?`<button class="btn ghost wide" data-act="cleardaybtn">${t('clear_day')}</button>`:'')+
    `<button class="btn ghost wide" data-act="today">${t('go_today')}</button>`;
}
function daysHTML(){
  const keys=Object.keys(state.days).filter(k=>hasData(state.days[k])).sort().reverse();
  const rows=keys.map(k=>{const tt=dayTotal(state.days[k]);
    return `<div class="dayrow${k===state.date?' cur':''}" data-act="open" data-d="${k}" role="button" tabindex="0">
      <div><div class="dd">${fmtDate(k)}<small>${wd(k)}</small></div>
      <div class="ds"><b>${fmt(tt.k)} ${t('kcal')}</b> · ${t('P')} ${fmt(tt.p)} · ${t('F')} ${fmt(tt.f)} · ${t('C')} ${fmt(tt.c)}</div></div>
      <button class="x" data-act="deld" data-d="${k}" aria-label="${t('del_day')}">×</button></div>`;}).join('');
  const n=keys.length,avg=n?scale(keys.reduce((a,k)=>addT(a,dayTotal(state.days[k])),Z()),1/n):null;
  return `<section class="card"><h2>${t('all_days')}</h2>
    <p class="hint">${n?t('days_stat',{n,k:fmt(avg.k),p:fmt(avg.p),f:fmt(avg.f),c:fmt(avg.c),P:t('P'),F:t('F'),C:t('C')}):t('days_empty')}</p>
    <div class="daylist">${rows}</div>
    <div class="actions"><button class="btn solid" data-act="today">${t('open_today')}</button><button class="btn" data-act="newday">${t('other_date')}</button></div>
    <div id="newdaybox" style="display:none;margin-top:10px"><input type="date" id="newdate" value="${state.date}" aria-label="${t('date')}"><button class="btn wide" data-act="opennew">${t('open_day')}</button></div>
  </section>`;
}
function potHTML(){
  const p=state.pot;
  return `<section class="card">
    <h2>${t('pot_h')}</h2>
    <p class="hint">${t('pot_hint')}</p>
    <div style="margin-top:8px">${p.rows.map((r,i)=>rowHTML('pot','',i,r)).join('')||`<p class="empty">${t('pot_empty')}</p>`}</div>
    <div class="actions">
      <button class="btn" data-act="add" data-scope="pot">${t('add_ingr')}</button>
      <button class="btn ghost" data-act="pottpl">${t('pot_example')}</button>
      <button class="btn ghost" data-act="clear" data-scope="pot">${t('clear')}</button>
    </div>
    <div class="potin">
      <label>${t('tare')}<input type="text" inputmode="decimal" data-act="tare" value="${p.tare||''}" placeholder="0"></label>
      <label>${t('gross')}<input type="text" inputmode="decimal" data-act="gross" value="${p.gross||''}"></label>
      <label>${t('portion')}<input type="text" inputmode="decimal" data-act="portion" value="${p.portion||''}"></label>
      <label>${t('add_to')}<select data-act="potto">${allMeals(cur()).map(m=>`<option value="${m.id}"${p.to===m.id?' selected':''}>${esc(mealName(m))}</option>`).join('')}</select></label>
    </div>
    <div class="out" id="potout"></div>
    <button class="btn solid wide" data-act="potadd">${t('pot_add',{d:fmtDate(state.date)})}</button>
  </section>
  <section class="card help"><h3>${t('noweigh_h')}</h3>
    <p>${t('noweigh_p')}</p></section>`;
}
function potOut(){
  const p=state.pot,tt=sum(p.rows),net=Math.max(0,(+p.gross||0)-(+p.tare||0));
  let h=`<div>${t('pot_whole')} ${macroLine(tt)}</div>`;
  if(!net) return h+`<p class="hint">${t('pot_enter')}</p>`;
  const per=scale(tt,100/net),por=scale(tt,(+p.portion||0)/net);
  h+=`<div style="margin-top:6px">${t('pot_ready',{n:fmt(net)})} ${macroLine(per)}</div>`;
  h+=`<div class="big">${t('pot_portion',{n:fmt(p.portion||0),k:fmt(por.k)})}</div><div>${macroLine(por,false)}</div>`;
  return h;
}
function prodHTML(){
  const rows=groups().map(g=>`<tr class="grp"><td colspan="5">${esc(GNAME(g))}</td></tr>`+allP().filter(x=>x.g===g).map(x=>
    `<tr><td>${esc(N(x.n))}${x.mine?` <button class="x sm" data-act="delmine" data-id="${x.id}" aria-label="${t('del_food')}">×</button>`:''}</td><td>${fmt(x.k)}</td><td>${fmt(x.p,1)}</td><td>${fmt(x.f,1)}</td><td>${fmt(x.c,1)}</td></tr>`).join('')).join('');
  const g=t('g');
  return `<section class="card">
    <h2>${t('my_food_h')}</h2>
    <p class="hint">${t('my_food_hint')}</p>
    <div class="potin">
      <label style="grid-column:1/-1">${t('name')}<input id="mn" placeholder="${t('name_ph')}"></label>
      <label style="grid-column:1/-1">${t('food_type')}<select id="mg">${groupOptions('g0')}</select></label>
      <label>${t('kcal_l')}<input id="mk" type="text" inputmode="decimal"></label>
      <label>${t('protein')}, ${g}<input id="mp" type="text" inputmode="decimal"></label>
      <label>${t('fat')}, ${g}<input id="mf" type="text" inputmode="decimal"></label>
      <label>${t('carbs')}, ${g}<input id="mc" type="text" inputmode="decimal"></label>
    </div>
    <button class="btn solid wide" data-act="addmine">${t('add_my')}</button>
    <p class="hint" id="mmsg"></p>
  </section>
  <section class="card"><h2>${t('table_h')}</h2>
    <div class="tbl"><table><thead><tr><th>${t('food')}</th><th>${t('kcal_l')}</th><th>${t('P')}</th><th>${t('F')}</th><th>${t('C')}</th></tr></thead><tbody>${rows}</tbody></table></div>
  </section>`;
}
function helpHTML(){
  const L=getLang;
  const rows=!hasGoal()?`<tr><td colspan="3">${t('guide_none')}</td></tr>`:MEALS.map(m=>{const g=mealGuide(m,T());return `<tr><td>${m.drink?t('snack_drink'):t('m_'+m.id)}</td><td>≈ ${fmt(g.k)}</td><td>${g.prot}</td></tr>`;}).join('');
  return HELP_T[L()].replace('@@GUIDE@@',rows).replace(/@@(\w+)@@/g,(m,k)=>t(k));
}
function goalUI(){
  syncC();const tg=T(),left=tg.k-tg.p*4-tg.f*9;
  const gc=$('#gc'),n=$('#gnote');
  $('#h1').textContent=t('title');document.title=t('title');$('#foot').textContent=t('foot');
  for(const [id,k] of [['gl-k','goal_k'],['gl-p','goal_p'],['gl-f','goal_f'],['gl-c','goal_c']])$('#'+id).firstChild.textContent=t(k);
  $('#gk').placeholder=t('eg')+' 2000';$('#gp').placeholder=t('eg')+' 110';$('#gf').placeholder=t('eg')+' 70';
  $('[data-act="goalreset"]').textContent=t('goal_clear');$('#calcsum').textContent=t('calc_open');
  if(!$('#calcbody').dataset.lang||$('#calcbody').dataset.lang!==getLang()){$('#calcbody').dataset.lang=getLang();renderCalc(true);}
  document.querySelectorAll('.tab').forEach(b=>b.textContent=t('tab_'+b.dataset.view));
  document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===getLang()));
  document.documentElement.lang=getLang();
  if(!hasGoal()){
    $('#sub').textContent=t('goal_none');
    $('#goalsum').textContent=t('goal_set');if(!goalAutoOpened){goalAutoOpened=true;$('#goal').open=true;}
    if(gc)gc.value='';
    n.textContent=t('goal_none_note');n.classList.remove('o');
    return;
  }
  $('#goalsum').textContent=t('goal_change');
  $('#sub').textContent=t('goal_line',{k:fmt(tg.k),p:fmt(tg.p),f:fmt(tg.f),c:fmt(tg.c),ck:fmt(tg.c*4)});
  if(gc)gc.value=`${fmt(tg.c*4)} ${t('kcal')} \u2248 ${fmt(tg.c)} ${t('g')}`;
  n.textContent=left>=0?t('goal_calc',{k:fmt(tg.k),p:fmt(tg.p),f:fmt(tg.f),left:fmt(left)}):t('goal_over',{n:fmt(tg.p*4+tg.f*9)});
  n.classList.toggle('o',left<0);
}
function bmr(c){
  const w=pf(c.w),h=pf(c.h),a=pf(c.a),f=c.sex==='f';
  if(!(w>0&&h>0&&a>0))return null;
  const hb=f?655.1+9.6*w+1.85*h-4.68*a:66.47+13.75*w+5.0*h-6.74*a;
  const msj=9.99*w+6.25*h-4.92*a+(f?-161:5);
  const hb2=f?447.6+9.2*w+3.1*h-4.3*a:88.36+13.4*w+4.8*h-5.68*a;
  const avg=(hb+msj+hb2)/3;
  return {hb,msj,hb2,avg,tdee:avg*pf(c.act||1.2)};
}
function calcHTML(){
  const c=state.calc,r=bmr(c);
  const acts=[['1.2','act1'],['1.375','act2'],['1.55','act3'],['1.725','act4'],['1.9','act5']];
  let res=`<p class="hint">${t('calc_fill')}</p>`;
  if(r)res=`<div class="cres">
    <div class="cl"><span>${t('f_hb')}</span><span>${fmt(r.hb)} ${t('kcal')}</span></div>
    <div class="cl"><span>${t('f_msj')}</span><span>${fmt(r.msj)} ${t('kcal')}</span></div>
    <div class="cl"><span>${t('f_hb2')}</span><span>${fmt(r.hb2)} ${t('kcal')}</span></div>
    <div class="cl cavg"><span>${t('calc_avg')} (${t('calc_bmr')})</span><span>${fmt(r.avg)} ${t('kcal')}</span></div>
    <div class="ctd">${t('calc_tdee')}: ${fmt(r10(r.tdee))} ${t('kcal')}</div>
    <p class="hint">${t('calc_note')}</p>
    <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-top:8px">${[[1,'calc_maint'],[0.9,'\u221210%'],[0.8,'\u221220%']].map(([m,l])=>`<button data-act="cdef" data-m="${m}" class="${(state.calc.def||1)==m?'on':''}">${l.startsWith('calc')?t(l):l}<br><small>${fmt(r10(r.tdee*m))}</small></button>`).join('')}</div>
    ${(()=>{const c=state.calc,W=pf(c.w),k=r10(r.tdee*(c.def||1));
      const pkAuto={'1.2':0.8,'1.375':1.2,'1.55':1.4,'1.725':1.6,'1.9':2}[c.act]||1.2;
      const pk=c.pk||pkAuto,fk=c.fk||1;
      const P=Math.round(W*pk),F=Math.round(W*fk),C=Math.max(0,Math.round((k-P*4-F*9)/4));
      return `<div class="sl"><div class="slh"><b>${t('calc_prot')}</b><span id="pkval">${pk.toFixed(1).replace(".",getLang()==="en"?".":",")} \u2192 ${P} ${t('g')}</span></div>
        <input type="range" min="0.8" max="2" step="0.1" value="${pk}" data-act="cpk" aria-label="${t('calc_prot')}">
        <div class="scale"><span>0,8<br><small>${t('pk08')}</small></span><span>1,2\u20131,6<br><small>${t('pk12')}</small></span><span>2,0<br><small>${t('pk20')}</small></span></div></div>
      <div class="sl"><div class="slh"><b>${t('calc_fat')}</b><span id="fkval">${fk.toFixed(1).replace(".",getLang()==="en"?".":",")} \u2192 ${F} ${t('g')}</span></div>
        <input type="range" min="0.6" max="2" step="0.1" value="${fk}" data-act="cfk" aria-label="${t('calc_fat')}">
        <div class="scale"><span>0,6\u20130,8<br><small>${t('fk07')}</small></span><span>1,0<br><small>${t('fk10')}</small></span><span>2,0<br><small>${t('fk20')}</small></span></div></div>
      <p class="hint">${t('calc_fat_hint')} ${t('omega')}</p>
      <div class="ctd" id="macros" style="font-size:15px">${t('calc_macros',{p:P,f:F,c:C,ck:fmt(C*4)})}</div>
      <button class="btn solid wide" data-act="calcapply" data-k="${k}" data-p="${P}" data-f="${F}">${t('calc_apply2',{k:fmt(k),p:P,f:F})}</button>`;})()}</div>`;
  return `<div style="display:flex;align-items:center;justify-content:flex-end;margin-bottom:4px"><span class="hint">${t('how_calc')}</span><button class="qbtn${state.calcHelp?' on':''}" data-act="calchelp" type="button" aria-label="${t('how_calc')}" aria-expanded="${!!state.calcHelp}">?</button></div>
    <div class="calchelp${state.calcHelp?' on':''}" id="calchelp">${CALC_HELP[getLang()]}</div>
    <div class="seg" style="grid-template-columns:1fr 1fr"><button data-act="csex" data-v="f" class="${c.sex==='f'?'on':''}">${t('calc_f')}</button><button data-act="csex" data-v="m" class="${c.sex!=='f'?'on':''}">${t('calc_m')}</button></div>
    <div class="potin">
      <label>${t('calc_w')}<input type="text" inputmode="decimal" data-act="calc" data-k="w" value="${esc(c.w)}"></label>
      <label>${t('calc_h')}<input type="text" inputmode="decimal" data-act="calc" data-k="h" value="${esc(c.h)}"></label>
      <label>${t('calc_a')}<input type="text" inputmode="decimal" data-act="calc" data-k="a" value="${esc(c.a)}"></label>
      <label>${t('calc_act')}<select data-act="cact">${acts.map(([v,k])=>`<option value="${v}"${c.act===v?' selected':''}>${t(k)}</option>`).join('')}</select></label>
    </div><div id="cres">${res}</div>`;
}
function macroLive(){
  const c=state.calc,r=bmr(c);if(!r)return;const W=pf(c.w),k=r10(r.tdee*(c.def||1));
  const pkAuto={'1.2':0.8,'1.375':1.2,'1.55':1.4,'1.725':1.6,'1.9':2}[c.act]||1.2;const pk=c.pk||pkAuto,fk=c.fk||1;
  const P=Math.round(W*pk),F=Math.round(W*fk),C=Math.max(0,Math.round((k-P*4-F*9)/4));
  const pv=$('#pkval'),fv=$('#fkval'),m=$('#macros'),b=$('[data-act="calcapply"]');
  if(pv)pv.textContent=`${pk.toFixed(1).replace(".",getLang()==="en"?".":",")} \u2192 ${P} ${t('g')}`;if(fv)fv.textContent=`${fk.toFixed(1).replace(".",getLang()==="en"?".":",")} \u2192 ${F} ${t('g')}`;
  if(m)m.textContent=t('calc_macros',{p:P,f:F,c:C,ck:fmt(C*4)});
  if(b){b.dataset.k=k;b.dataset.p=P;b.dataset.f=F;b.textContent=t('calc_apply2',{k:fmt(k),p:P,f:F});}
}
function renderCalc(full){
  if(full){$('#calcbody').innerHTML=calcHTML();return;}
  const c=state.calc,r=bmr(c);const cr=$('#cres');if(!cr)return;
  cr.innerHTML=calcHTML().split('<div id="cres">')[1].replace(/<\/div>$/,'');
}
function fillGoalInputs(){for(const k of ['k','p','f']){const el=$('#g'+k);if(el&&document.activeElement!==el)el.value=T()[k]||'';}}
function bar(label,val,target,unit,color,extra=''){
  target=target||0;const diff=val-target,over=target>0&&diff>target*0.05;
  const txt=diff<0?t('still',{n:fmt(-diff),u:unit}):t('over',{n:fmt(diff),u:unit});
  return `<div class="bar"><div class="bl"><b>${label}</b><span>${fmt(val)} / ${fmt(target)}</span></div>
    <div class="track"><div class="fill" style="width:${target>0?Math.min(val/target*100,100):0}%;background:${over?'var(--over)':color}"></div></div>
    <div class="rem${over?' o':''}">${txt}${extra}</div></div>`;
}
function updateTotals(){
  syncC();let day=Z();const d=peek(state.date);
  for(const m of allMeals(d)){
    const tt=sum(mealRowsOf(d,m.id));day=addT(day,tt);
    const el=document.querySelector(`[data-role="mt-${m.id}"]`);
    if(el) el.innerHTML=`<b>${fmt(tt.k)} ${t('kcal')}</b>${t('P')} ${fmt(tt.p)}  ${t('F')} ${fmt(tt.f)}  ${t('C')} ${fmt(tt.c)}`;
  }
  $('#bars').innerHTML=!hasGoal()?`<div class="nogoal">${t('nogoal_bar',{k:`<b>${fmt(day.k)}</b>`,p:fmt(day.p),f:fmt(day.f),c:fmt(day.c),P:t('P'),F:t('F'),C:t('C')})}<span>${t('nogoal_bar2')}</span></div>`:
    bar(t('calories'),day.k,T().k,t('kcal'),'var(--k)')+
    bar(t('protein'),day.p,T().p,t('g'),'var(--p)')+
    bar(t('fat'),day.f,T().f,t('g'),'var(--f)')+
    bar(t('carbs'),day.c,T().c,t('g'),'var(--c)',t('of_kcal',{a:fmt(day.c*4),b:fmt(T().c*4)}));
  goalUI();
  const po=$('#potout');if(po) po.innerHTML=potOut();
}
function refreshHints(){
  document.querySelectorAll('.meal').forEach(sec=>{const m=allMeals(cur()).find(x=>x.id===sec.dataset.meal);const h=sec.querySelector('header .hint');if(m&&h)h.textContent=_mealHint(m);else if(m&&_mealHint(m)){const hd=sec.querySelector('header h2');if(hd)hd.insertAdjacentHTML('afterend',`<p class="hint">${_mealHint(m)}</p>`);}});
  if(state.view==='help')$('#view').innerHTML=helpHTML();
}
function render(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.view===state.view));
  const v=$('#view');
  if(state.view==='pot') v.innerHTML=potHTML();
  else if(state.view==='prod') v.innerHTML=prodHTML();
  else if(state.view==='help') v.innerHTML=helpHTML();
  else if(state.view==='days') v.innerHTML=daysHTML();
  else v.innerHTML=dayHTML();
  updateTotals();
}
let picker=null,goalAutoOpened=false;
const norm=x=>String(x).toLowerCase().replace(/['\u2019\u02BC`]/g,'').replace(/\u0451/g,'\u0435');
function openPicker(pk){
  picker=pk;let el=$('#sheet');
  if(!el){el=document.createElement('div');el.id='sheet';el.className='sheet';document.body.appendChild(el);}
  el.innerHTML=`<div class="panel" role="dialog" aria-label="${t('choose_food')}"><div class="plist" id="plist"></div><div class="ph"><input id="psearch" type="search" placeholder="${t('search_ph')}" autocomplete="off" autocapitalize="off" enterkeyhint="done"><button class="x" data-act="pclose" aria-label="${t('close')}">×</button></div></div>`;
  lockedY=window.scrollY||0;document.body.classList.add('noscroll');document.body.style.top=(-lockedY)+'px';
  el.style.display='flex';fitSheet();renderPList('');
  const vv=window.visualViewport;if(vv){vv.addEventListener('resize',fitSheet);vv.addEventListener('scroll',fitSheet);}
  setTimeout(()=>{const i=$('#psearch');if(i)i.focus({preventScroll:true});},60);
}
let lockedY=0;
function fitSheet(){const el=$('#sheet');if(!el||el.style.display==='none')return;const vv=window.visualViewport;
  el.style.height=(vv?vv.height:window.innerHeight)+'px';el.style.top=(vv?vv.offsetTop:0)+'px';}
function renderPList(q){
  q=norm(q).trim();const curId=picker&&picker.mode==='set'?(listOf({dataset:picker})[picker.i]||{}).pid:null;
  const match=x=>!q||(Array.isArray(x.n)?x.n:[x.n]).some(v=>norm(v).includes(q));
  const items=allP().filter(match);
  const html=groups().map(g=>{const xs=items.filter(x=>x.g===g);if(!xs.length)return '';
    return `<div class="pg">${esc(GNAME(g))}</div>`+xs.map(x=>`<button class="pi${x.id===curId?' on':''}" data-act="pchoose" data-id="${x.id}" type="button"><span>${esc(N(x.n))}</span><small>${fmt(x.k)} ${t('kcal')}</small></button>`).join('');}).join('');
  const addBtn=`<button class="btn wide" data-act="qnew" type="button" style="margin:12px 0 4px">${q?t('add_new_q',{q:esc(($('#psearch')||{}).value||'').trim()}):t('add_new')}</button>`;
  $('#plist').innerHTML=(html||`<p class="pempty">${t('nothing_found')}</p>`)+addBtn;
}
function groupOptions(sel){
  return Object.keys(GROUPS).filter(g=>g!=='mine').map(g=>`<option value="${g}"${g===sel?' selected':''}>${esc(GNAME(g))}</option>`).join('');
}
function addMine(n,k,pp,ff,cc,grp){
  n=String(n||'').trim();k=pf(k);pp=pf(pp);ff=pf(ff);cc=pf(cc);
  grp=grp||'mine';
  if(!n)return {err:t('err_name')};
  if(!k)k=pp*4+ff*9+cc*4;
  if(!k)return {err:t('err_vals')};
  const id='u'+Date.now();state.mine.push({id,g:grp,n,k,p:pp,f:ff,c:cc,mine:true});save();return {id};
}
function showNewForm(q){
  const g=t('g');
  $('#plist').innerHTML=`<div class="pg">${t('my_food_h')}</div><p class="hint">${t('my_food_hint')}</p>
    <div class="potin">
      <label style="grid-column:1/-1">${t('name')}<input id="qn" value="${esc(q)}" placeholder="${t('name_ph')}"></label>
      <label style="grid-column:1/-1">${t('food_type')}<select id="qg">${groupOptions('g0')}</select></label>
      <label>${t('kcal_l')}<input id="qk" type="text" inputmode="decimal"></label>
      <label>${t('protein')}, ${g}<input id="qp" type="text" inputmode="decimal"></label>
      <label>${t('fat')}, ${g}<input id="qf" type="text" inputmode="decimal"></label>
      <label>${t('carbs')}, ${g}<input id="qc" type="text" inputmode="decimal"></label>
    </div>
    <p class="hint" id="qmsg"></p>
    <div class="actions"><button class="btn solid" data-act="qsave" type="button">${t('save_use')}</button><button class="btn ghost" data-act="qback" type="button">${t('back')}</button></div>`;
  setTimeout(()=>{const i=$(q?'#qk':'#qn');if(i)i.focus({preventScroll:true});},60);
}
function closePicker(){picker=null;const el=$('#sheet');if(el)el.style.display='none';
  const vv=window.visualViewport;if(vv){vv.removeEventListener('resize',fitSheet);vv.removeEventListener('scroll',fitSheet);}
  if(document.body.classList.contains('noscroll')){document.body.classList.remove('noscroll');document.body.style.top='';try{window.scrollTo(0,lockedY);}catch(e){}}}
function choose(id){
  if(!picker)return;const pk=picker;closePicker();
  if(pk.mode==='set'){const rows=listOf({dataset:pk});const r=rows[pk.i];if(r){delete r.custom;r.pid=id;}}
  else{const rows=pk.scope==='pot'?state.pot.rows:cur().meals[pk.meal];rows.push({pid:id,g:''});}
  save();render();
  if(pk.mode!=='set'){const rows=document.querySelectorAll(`.row[data-scope="${pk.scope}"][data-meal="${pk.meal||''}"]`);const last=rows[rows.length-1];const inp=last&&last.querySelector('input[data-act="g"]');if(inp){inp.focus();if(inp.scrollIntoView)inp.scrollIntoView({block:'center'});}}
}
function goTo(iso){if(!isISO(iso))return;state.date=iso;state.view='day';save();render();try{window.scrollTo({top:0});}catch(e){}}

document.addEventListener('input',e=>{
  const el=e.target,act=el.dataset&&el.dataset.act;if(!act&&el.id!=='psearch')return;
  if(act==='g'){const r=getRow(el);r.g=el.value.trim()===''?'':Math.max(0,pf(el.value));el.closest('.row').querySelector('[data-role="rm"]').innerHTML=macroLine(scaled(r));}
  else if(act==='tare'||act==='gross'||act==='portion'){state.pot[act]=Math.max(0,pf(el.value));}
  else if(el.id==='psearch'){renderPList(el.value);return;}
  else if(act==='calc'){state.calc[el.dataset.k]=el.value;save();renderCalc(false);return;}
  else if(act==='cpk'){state.calc.pk=pf(el.value);save();macroLive();return;}
  else if(act==='cfk'){state.calc.fk=pf(el.value);save();macroLive();return;}
  else if(act==='goal'){state.target[el.dataset.k]=Math.max(0,pf(el.value));save();updateTotals();refreshHints();return;}
  else return;
  save();updateTotals();
});
document.addEventListener('change',e=>{
  const el=e.target,act=el.dataset&&el.dataset.act;if(!act)return;
  if(act==='potto'){state.pot.to=el.value;}
  else if(act==='cact'){state.calc.act=el.value;state.calc.pk=null;save();renderCalc(false);return;}
  else if(act==='date'){goTo(el.value);return;}
  else return;
  save();updateTotals();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&picker){closePicker();return;}if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('dayrow'))e.target.click();});
document.addEventListener('click',e=>{
  if(e.target.id==='sheet'){closePicker();return;}
  const tab=e.target.closest('.tab');
  if(tab){state.view=tab.dataset.view;save();render();return;}
  const el=e.target.closest('[data-act]');if(!el||el.tagName==='SELECT'||el.tagName==='INPUT')return;
  const act=el.dataset.act;let scrollTo=null;
  if(act==='add'){openPicker({mode:'add',scope:el.dataset.scope||'meal',meal:el.dataset.meal||''});return;}
  else if(act==='pick'){const r=el.closest('.row');openPicker({mode:'set',scope:r.dataset.scope,meal:r.dataset.meal,i:+r.dataset.i});return;}
  else if(act==='pchoose'){choose(el.dataset.id);return;}
  else if(act==='pclose'){closePicker();return;}
  else if(act==='del'){const r=el.closest('.row');listOf(r).splice(+r.dataset.i,1);}
  else if(act==='clear'){if(el.dataset.scope==='pot')state.pot.rows=[];else cur().meals[el.dataset.meal]=[];}
  else if(act==='addmeal'){const n=(prompt(t('meal_name_q'),t('meal_default'))||'').trim();if(!n)return;const id='x'+Date.now();const d=cur();d.extra.push({id,name:n});d.meals[id]=[];scrollTo=id;}
  else if(act==='renmeal'){const d=cur(),e=d.extra.find(x=>x.id===el.dataset.meal);if(!e)return;const n=(prompt(t('meal_name_q'),e.name)||'').trim();if(!n)return;e.name=n;}
  else if(act==='delmeal'){const d=cur(),e=d.extra.find(x=>x.id===el.dataset.meal);if(!e)return;if(mealRowsOf(d,e.id).length&&!confirm(t('confirm_del_meal',{n:e.name})))return;d.extra=d.extra.filter(x=>x.id!==e.id);delete d.meals[e.id];}
  else if(act==='pottpl'){state.pot.rows=potDefault();state.pot.tare=0;state.pot.gross=1310;}
  else if(act==='potadd'){
    const p=state.pot,net=Math.max(0,(+p.gross||0)-(+p.tare||0));
    if(!net||!p.rows.length||!p.portion){const o=$('#potout');if(o)o.insertAdjacentHTML('beforeend',`<p class="warn">${t('pot_warn')}</p>`);return;}
    const tt=scale(sum(p.rows),100/net);
    if(!cur().meals[p.to])p.to='dinner';cur().meals[p.to].push({custom:{pot:true,n:'\u0421\u0442\u0440\u0430\u0432\u0430 \u0437 \u043a\u0430\u0441\u0442\u0440\u0443\u043b\u0456',k:tt.k,p:tt.p,f:tt.f,c:tt.c},g:+p.portion});
    state.view='day';scrollTo=p.to;
  }
  else if(act==='addmine'){
    const r=addMine($('#mn').value,$('#mk').value,$('#mp').value,$('#mf').value,$('#mc').value,$('#mg').value);
    if(r.err){$('#mmsg').textContent=r.err;return;}
  }
  else if(act==='qnew'){showNewForm(($('#psearch')||{}).value||'');return;}
  else if(act==='qback'){renderPList(($('#psearch')||{}).value||'');return;}
  else if(act==='qsave'){
    const r=addMine($('#qn').value,$('#qk').value,$('#qp').value,$('#qf').value,$('#qc').value,$('#qg').value);
    if(r.err){$('#qmsg').textContent=r.err;return;}
    choose(r.id);return;
  }
  else if(act==='delmine'){
    const id=el.dataset.id,pr=byId(id);if(!pr)return;
    const conv=rows=>rows.forEach(r=>{if(r.pid===id){r.custom={n:N(pr.n),k:pr.k,p:pr.p,f:pr.f,c:pr.c};delete r.pid;}});
    Object.values(state.days).forEach(d=>Object.values(d.meals).forEach(conv));conv(state.pot.rows);
    state.mine=state.mine.filter(x=>x.id!==id);
  }
  else if(act==='goalreset'){state.target={...DEFAULT_TARGET};}
  else if(act==='calchelp'){state.calcHelp=!state.calcHelp;el.classList.toggle('on',state.calcHelp);el.setAttribute('aria-expanded',String(!!state.calcHelp));$('#calchelp').classList.toggle('on',state.calcHelp);return;}
  else if(act==='cdef'){state.calc.def=pf(el.dataset.m);save();renderCalc(false);return;}
  else if(act==='csex'){state.calc.sex=el.dataset.v;save();renderCalc(true);return;}
  else if(act==='calcapply'){state.target.k=pf(el.dataset.k);state.target.p=pf(el.dataset.p);state.target.f=pf(el.dataset.f);$('#calc').open=false;}
  else if(act==='lang'){state.lang=el.dataset.l;setLang(el.dataset.l);}
  else if(act==='dprev'){goTo(shiftISO(state.date,-1));return;}
  else if(act==='dnext'){goTo(shiftISO(state.date,1));return;}
  else if(act==='today'){goTo(todayISO());return;}
  else if(act==='open'){goTo(el.dataset.d);return;}
  else if(act==='newday'){const b=$('#newdaybox');b.style.display=b.style.display==='none'?'block':'none';return;}
  else if(act==='opennew'){goTo($('#newdate').value);return;}
  else if(act==='deld'){e.stopPropagation();const k=el.dataset.d;if(!confirm(t('confirm_del_day',{d:fmtDate(k)})))return;delete state.days[k];}
  else if(act==='cleardaybtn'){if(!confirm(t('confirm_clear_day',{d:fmtDate(state.date)})))return;delete state.days[state.date];}
  else if(act==='exp'){$('#dataio').value=JSON.stringify(state);$('#datamsg').textContent=t('exp_msg');return;}
  else if(act==='copy'){const ta=$('#dataio');if(!ta.value)ta.value=JSON.stringify(state);ta.select();
    const done=()=>{$('#datamsg').textContent=t('copied');};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(done,()=>{document.execCommand&&document.execCommand('copy');done();});
    else{document.execCommand&&document.execCommand('copy');done();}
    return;}
  else if(act==='imp'){
    let d;try{d=JSON.parse($('#dataio').value);}catch(e){$('#datamsg').textContent=t('imp_err');return;}
    if(!d||typeof d!=='object'||!d.target){$('#datamsg').textContent=t('imp_bad');return;}
    if(!confirm(t('imp_confirm')))return;
    state=merge(d);setLang(state.lang);save();render();fillGoalInputs();$('#datamsg').textContent=t('imp_ok');return;}
  else return;
  save();render();fillGoalInputs();
  if(scrollTo){const s=document.querySelector(`.meal[data-meal="${scrollTo}"]`);if(s&&s.scrollIntoView)s.scrollIntoView({block:"start"});}
});
render();fillGoalInputs();
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
let lastTap=0;document.addEventListener('touchend',e=>{const now=Date.now();const tag=(e.target&&e.target.tagName)||'';if(now-lastTap<300&&!/INPUT|TEXTAREA|SELECT/.test(tag))e.preventDefault();lastTap=now;},{passive:false});
