// LUMIN v4: coherent asymmetric anatomical parameters. Pure and reproducible.
import {clamp,hash,TAU} from './anatomy.js';
export function phenotype(seed,adapt){
 const f=i=>hash(seed*.0037+i*21.73);
 return {lean:(f(2)-.5)*.48,belly:.83+f(4)*.29,crest:.7+f(6)*.33,tail:.8+f(8)*.46,
  chambers:[{x:-.23+f(10)*.10,y:-.18,r:.24},{x:.20,y:.12,r:.17},{x:-.13,y:.35,r:.125}],
  appendages:Array.from({length:11},(_,i)=>({u:(i+.35+f(i+31)*.4)/11,reach:.55+f(i+43)*.95,curve:(f(i+61)-.5)*1.3,phase:f(i+81)*TAU,root:.6+f(i+92)*.4,side:i%2?1:-1})),
  identityHue:f(14),windMemory:clamp(adapt.wind),coldMemory:clamp(adapt.cold),wetMemory:clamp(adapt.wet)};
}
export function shapeAt(u,ph,adapt,state,weather,time=0){
 const t=u*TAU,tw=Math.sin(t*2.0+1.2)*.065+Math.sin(t*3.0+ph.crest)*.037;
 const breathe=1+.045*Math.sin(time*.58+u*TAU*2)+.018*Math.sin(time*1.1+u*TAU*3);
 const wind=Math.min(1,weather.wind/75),cold=adapt.cold;
 const r=(1+tw+Math.sin(t*5.0+ph.lean*9)*.025)*breathe*(1-state.tension*.08);
 // Tall, asymmetric, slightly hooked mantle, not a radial flower.
 let x=Math.cos(t)*r*(.76+adapt.wet*.12)+.14*Math.sin(t*2.0+.8)+ph.lean*.40;
 let y=Math.sin(t)*r*(1.14+cold*.16)+.16*Math.cos(t+1.1);
 const lean=ph.lean+adapt.wind*.22+wind*.13;
 x+=lean*(-y*.48)+.07*Math.sin(y*2.9+time*.17);
 x+=Math.cos((weather.direction-90)*Math.PI/180)*wind*.16*(y+.5);
 y+=.05*Math.sin(time*.22+x*3);
 return {x,y};
}
export function anatomyMetrics(ph,adapt,w){return {aspect:1.14+adapt.cold*.16,tailLength:ph.tail*(1+adapt.wind*.65),mantleWidth:.76+adapt.wet*.12,windLean:ph.lean+adapt.wind*.22+Math.min(1,w.wind/75)*.13};}
