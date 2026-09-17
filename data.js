import { t, N } from './i18n.js';
import { PRODUCTS } from './products.js';

export { PRODUCTS };

export const TPL=[
  {id:'b1',grp:["Сніданки", "Breakfasts", "Pequenos-almoços"],n:["Яйця + тост з авокадо і сиром", "Eggs + avocado & cheese toast", "Ovos + tosta de abacate e queijo"],items:[['egg',100],['bread',60],['avo',40],['aged',15],['carrot',50]]},
  {id:'b2',grp:["Сніданки", "Breakfasts", "Pequenos-almoços"],n:["Яйця + паштет на тості", "Eggs + pâté on toast", "Ovos + patê na tosta"],items:[['egg',100],['pate',60],['bread',50],['cucumber',100]]},
  {id:'b3',grp:["Сніданки", "Breakfasts", "Pequenos-almoços"],n:["Яйця + пармезан + малина", "Eggs + parmesan + raspberries", "Ovos + parmesão + framboesas"],items:[['egg',100],['parm',10],['bread',50],['tomato',100],['rasp',100]]},
  {id:'m1',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Курка + басматі + броколі", "Chicken + basmati + broccoli", "Frango + basmati + brócolos"],items:[['chk_raw',150],['basmati',80],['broccoli',150],['olive_oil',7]]},
  {id:'m2',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Курка в азійському маринаді + рис", "Asian-marinated chicken + rice", "Frango em marinada asiática + arroz"],items:[['chk_raw',150],['basmati',80],['cabbage',150],['soy',15],['honey',7],['sesame_oil',5]]},
  {id:'m3',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Боул з лососем", "Salmon bowl", "Bowl de salmão"],items:[['salmon',130],['sushi',80],['cucumber',100],['avo',40],['soy',15]]},
  {id:'m4',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Тріска з картоплею (аерогриль)", "Cod with potatoes (air fryer)", "Bacalhau com batatas (air fryer)"],items:[['cod',180],['potato',250],['carrot',150],['olive_oil',8]]},
  {id:'m5',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Дорада + булгур з помідорами", "Sea bream + bulgur with tomatoes", "Dourada + bulgur com tomate"],items:[['dorada',170],['bulgur',70],['tomato',150],['olive_oil',5]]},
  {id:'m6',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Креветки + гречка + перці", "Shrimp + buckwheat + peppers", "Camarão + trigo-sarraceno + pimentos"],items:[['shrimp',180],['buck',70],['pepper',150],['olive_oil',7]]},
  {id:'m7',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Стейк з телятини + гречка + рукола", "Veal steak + buckwheat + rocket", "Bife de vitela + trigo-sarraceno + rúcula"],items:[['veal',160],['buck',70],['arugula',30],['olive_oil',7]]},
  {id:'m8',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Сирна паста з куркою", "Cheesy pasta with chicken", "Massa com queijo e frango"],items:[['pasta',75],['chk_raw',130],['ched',20],['blue',15],['milk16',50]]},
  {id:'m9',grp:["Обід або вечеря", "Lunch or dinner", "Almoço ou jantar"],n:["Азійська страва (без зважування)", "Asian dish (no weighing)", "Prato asiático (sem pesar)"],items:[['asian_est',350],['cucumber',100]]},
  {id:'s1',grp:["Перекуси", "Snacks", "Lanches"],n:["Лохина + бразильський горіх", "Blueberries + Brazil nuts", "Mirtilos + castanha-do-brasil"],items:[['bluebr',150],['brazil',10]]},
  {id:'s2',grp:["Перекуси", "Snacks", "Lanches"],n:["Манго + витриманий сир", "Mango + aged cheese", "Manga + queijo curado"],items:[['mango',150],['aged',20]]},
  {id:'s3',grp:["Перекуси", "Snacks", "Lanches"],n:["Сливи + малина", "Plums + raspberries", "Ameixas + framboesas"],items:[['plum',150],['rasp',100]]},
  {id:'s4',grp:["Перекуси", "Snacks", "Lanches"],n:["M&M's з арахісом", "Peanut M&M's", "M&M's de amendoim"],items:[['mm_pea',30]]},
];

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
