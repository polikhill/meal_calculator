import { t, N } from './i18n.js';
import { PRODUCTS } from './products.js';

export { PRODUCTS };

export const MEALS=[
  {id:'breakfast',share:.24,pLo:.23},
  {id:'lunch',share:.315,pLo:.32,pHi:.41},
  {id:'snack',share:.12,drink:true},
  {id:'dinner',share:.325,pLo:.32,pHi:.37},
];

export const r10=n=>Math.round(n/10)*10;

export function mealGuide(m, target){
  const k=r10(target.k*m.share),p=target.p;
  const g=t('g'),prot=m.pHi?`${Math.round(p*m.pLo)}\u2013${Math.round(p*m.pHi)} ${g}`:m.pLo?`${t('from')} ${Math.round(p*m.pLo)} ${g}`:`${Math.round(p*.05)}\u2013${Math.round(p*.09)} ${g}`;
  return {k,prot};
}

export function mealHint(m, hasGoal, target){
  if(m.custom)return t('hint_custom');
  if(!hasGoal)return '';
  const g=mealGuide(m, target);
  return m.drink?t('hint_snack',{k:g.k}):t('hint_meal',{k:g.k,p:g.prot});
}
