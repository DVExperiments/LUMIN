// Reproducible, identity-dependent anatomical blueprint. No frame-dependent randomness.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const hash=n=>{const s=Math.sin(n*127.1+78.233)*43758.5453123;return s-Math.floor(s);};
export const TAU=Math.PI*2;
export function blueprint(seed,adapt){
 const roots=11+Math.floor(hash(seed+11)*5);const arms=[];
 for(let i=0;i<roots;i++){
  const r=hash(seed*.031+i*39.4),g=hash(seed*.037+i*8.33);
  arms.push({angle:i/roots*TAU+(r-.5)*.20,length:.74+g*.48,curve:(hash(seed+i*17)-.5)*.42,phase:hash(seed+i*71)*TAU,branches:2+Math.floor(hash(seed+i*93)*3),width:.053+hash(seed+i*21)*.037});
 }
 return {arms,folds:7+Math.floor(hash(seed+1)*4),ribCount:27+Math.floor(hash(seed+3)*12),lobes:5+Math.floor(hash(seed+5)*3),elongation:1+adapt.wind*.55,crystal:adapt.cold,hydration:adapt.wet,light:adapt.light};
}
export function posture(state,adapt,weather,attention=0){
 const wind=clamp(weather.wind/75),cold=adapt.cold,heat=clamp((weather.temperature-5)/38),rain=clamp(weather.rain/8);
 return {open:clamp(.46+state.openness*.48-cold*.23-state.tension*.14+attention*.08),stretch:1+adapt.wind*.45+wind*.2,fold:.12+cold*.35+state.tension*.17,flutter:.18+wind*.65+rain*.32,flow:.22+heat*.43+state.energy*.38,bracing:clamp(state.tension*.6+wind*.4),thickness:.75+adapt.wet*.65};
}
