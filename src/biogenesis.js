import {hash,clamp,TAU} from './anatomy.js';
// Stable, reproducible structures. Weather changes anatomy without random frame jitter.
export function anatomyPlan(seed,adapt){
 const h=n=>hash(seed*.017+n*19.131);
 const limbs=Array.from({length:9+Math.floor(h(3)*3)},(_,i)=>({u:(i+.18+h(20+i)*.3)/(9+Math.floor(h(3)*3)),length:.47+h(30+i)*.52,side:h(40+i)>.5?1:-1,flex:(h(50+i)-.5)*.65,phase:h(60+i)*TAU,branch:2+Math.floor(h(70+i)*3),width:.017+h(90+i)*.019}));
 const organs=[{x:-.24,y:-.22,r:.215,phase:h(1)*TAU},{x:.14,y:.14,r:.15,phase:h(2)*TAU},{x:-.14,y:.38,r:.115,phase:h(4)*TAU}];
 return {limbs,organs,folds:7+Math.floor(h(5)*4),ridges:8+Math.floor(h(6)*5),scar:h(7),strain:clamp(adapt.wind),frost:clamp(adapt.cold),hydration:clamp(adapt.wet)};
}
export function tissueLayers(adapt){return {veil:clamp(.19+adapt.wet*.15),ridge:clamp(.12+adapt.cold*.20),stretch:1+adapt.wind*.38,ventral:clamp(.5+adapt.wet*.36-adapt.cold*.14)};}
export function pulsePosition(t,phase,speed=1){return ((t*speed*.16+phase/TAU)%1+1)%1;}
