import {blueprint,posture,TAU,clamp,mix,hash} from './anatomy.js';
const rgba=(r,g,b,a)=>`rgba(${r|0},${g|0},${b|0},${clamp(a)})`;
export class Renderer{
 constructor(canvas,engine,quality='balanced'){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});this.engine=engine;this.quality=quality;this.w=0;this.h=0;this.dpr=1;this.seed=0;this.blueprint=null;
  this.stars=Array.from({length:210},(_,i)=>({x:hash(i*9+4),y:hash(i*13+11),a:hash(i+17),r:.25+hash(i+81)*1.2}));
  this.sparks=Array.from({length:650},(_,i)=>({theta:hash(i+32)*TAU,r:Math.sqrt(hash(i*6+33)),phase:hash(i*19+7)*TAU,size:hash(i*23+6)}));
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.w=window.innerWidth;this.h=window.innerHeight;this.dpr=Math.min(devicePixelRatio||1,{eco:1,balanced:1.5,ultra:2}[this.quality]||1);this.canvas.width=Math.max(1,Math.round(this.w*this.dpr));this.canvas.height=Math.max(1,Math.round(this.h*this.dpr));this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx?.setTransform(this.dpr,0,0,this.dpr,0,0);}
 setQuality(q){this.quality=q;this.resize();}
 palette(){const e=this.engine,w=e.current,a=e.adapt;const cold=clamp(a.cold*.7+clamp((16-w.temperature)/38)*.3),wet=clamp(a.wet*.6+w.humidity*.004);return {pearl:[mix(255,154,cold),mix(228,235,cold),mix(202,255,cold)],silk:[mix(244,95,cold),mix(165,190,cold),mix(176,240,cold)],iris:[mix(155,95,wet),mix(111,155,cold),mix(216,250,wet)],blue:[105,173,225],warm:[255,236,195]};}
 draw(){const c=this.ctx;if(!c)return;const e=this.engine,w=e.current,s=e.state,a=e.adapt,t=e.time,W=this.w,H=this.h;const eco=this.quality==='eco',ultra=this.quality==='ultra',still=e.motion===0;const motion=still?.045:1;
 if(this.seed!==e.seed){this.seed=e.seed;this.blueprint=blueprint(e.seed,a);}const anatomy=this.blueprint,P=this.palette(),form=posture(s,a,w,e.attention.strength);const small=Math.min(W,H),mobile=W<700;
 // Emphasise a continuous body rather than an isolated stellar core.
 const radius=Math.min(small*(mobile?.27:.34),mobile?220:365);const cx=W*(mobile?.50:.535)+Math.sin(t*.12)*radius*.045*motion,cy=H*(mobile?.45:.51)+Math.cos(t*.093)*radius*.04*motion;
 const wind=clamp(w.wind/85),dir=(w.direction-90)*Math.PI/180,windX=Math.cos(dir)*wind,windY=Math.sin(dir)*wind;
 const focus=e.attention;const fx=(focus.x-cx)/Math.max(radius,1),fy=(focus.y-cy)/Math.max(radius,1);const focusAmount=clamp(focus.strength*s.curiosity*.18);
 const driftX=(focusAmount*clamp(fx,-2,2)+e.roam.x*.035)*motion,driftY=(focusAmount*clamp(fy,-2,2)+e.roam.y*.04)*motion;
 const span=radius*form.open;
 // Map polar tissue coordinates through one continuous deformed body; appendages share the same skeleton.
 const point=(theta,r,phase=0)=>{
  const n=Math.sin(theta*anatomy.lobes+t*.23*motion+e.seed*.001)*.07+Math.sin(theta*(anatomy.lobes+4)-t*.16*motion+phase)*.026;
  const folds=Math.sin(theta*anatomy.folds+t*.32*motion+phase)*form.fold*.19;
  const angle=theta+Math.sin(r*4-t*.19*motion+phase)*.025*r+Math.sin(theta*3+t*.13*motion)*.02*r;
  const breadth=(1+n+folds*(.4+.6*r));let x=Math.cos(angle)*r*span*breadth*form.stretch;let y=Math.sin(angle)*r*span*breadth/(1+a.wind*.12);
  x+=windX*radius*.19*r*r+Math.sin(r*8+t*.51*motion+phase)*radius*.014*r*form.flutter;
  y+=windY*radius*.19*r*r+Math.cos(r*7+t*.44*motion+phase)*radius*.013*r*form.flutter;
  x+=driftX*radius*r*.24;y+=driftY*radius*r*.24;
  const inward=clamp(e.startle)*.13*Math.exp(-r*1.5);return [cx+x*(1-inward),cy+y*(1-inward)];
 };
 const path=(n,fn)=>{c.beginPath();for(let i=0;i<=n;i++){const p=fn(i/n);if(i===0)c.moveTo(...p);else c.lineTo(...p);}};
 c.fillStyle='#040813';c.fillRect(0,0,W,H);const bg=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.8);bg.addColorStop(0,'#11172b');bg.addColorStop(.40,'#090f1d');bg.addColorStop(1,'#040711');c.fillStyle=bg;c.fillRect(0,0,W,H);
 for(const st of this.stars){c.fillStyle=rgba(150,183,223,st.a*.24*(.65+.35*Math.sin(t*.28+st.x*27)));c.beginPath();c.arc(st.x*W,st.y*H,st.r,0,TAU);c.fill();}
 c.save();c.globalCompositeOperation='screen';
 // Atmospheric halo sits behind, never substitutes for actual anatomy.
 const halo=c.createRadialGradient(cx,cy,radius*.12,cx,cy,radius*1.85);halo.addColorStop(0,rgba(...P.iris,.095));halo.addColorStop(.38,rgba(...P.iris,.075));halo.addColorStop(.7,rgba(...P.blue,.021));halo.addColorStop(1,rgba(...P.iris,0));c.fillStyle=halo;c.beginPath();c.arc(cx,cy,radius*1.85,0,TAU);c.fill();
 // Tissue lobes: overlapping folded translucent sheets anchored to the same centre.
 const layers=eco?4:ultra?9:7;for(let layer=layers-1;layer>=0;layer--){const rr=.38+layer/layers*.67;const phase=layer*1.31;path(eco?90:155,u=>point(u*TAU,rr,phase));c.closePath();const grad=c.createRadialGradient(cx-radius*.1,cy-radius*.14,radius*.03,cx,cy,span*1.4);grad.addColorStop(0,rgba(...P.warm,.03));grad.addColorStop(.28,rgba(...P.iris,.043+layer*.004));grad.addColorStop(.65,rgba(...(layer%2?P.silk:P.blue),.016+layer*.002));grad.addColorStop(1,rgba(...P.blue,.002));c.fillStyle=grad;c.fill();c.lineWidth=layer===layers-1?1.6:.8;c.strokeStyle=rgba(...(layer%3?P.iris:P.pearl),.12+(1-layer/layers)*.11);c.stroke();}
 // Radial vasculature embedded in membrane, curving with the deformation field.
 for(let i=0;i<anatomy.ribCount;i++){
  const theta=i/anatomy.ribCount*TAU,phase=hash(i+e.seed)*TAU;
  path(eco?18:35,u=>point(theta+.17*u*u*Math.sin(phase+t*.12*motion),.11+u*.90,phase));
  c.lineWidth=i%5===0?1.5:.6;c.strokeStyle=rgba(...(i%3===0?P.pearl:P.iris),i%5===0?.28:.12);c.stroke();
 }
 // Organ-scale tendrils, tapered, with bifurcations and an articulated silhouette.
 anatomy.arms.forEach((arm,i)=>{
  const theta=arm.angle,phase=arm.phase;const reach=arm.length*(.95+form.open*.26)*(1+wind*.19);const steps=eco?20:36;
  const armPoint=u=>{const turn=arm.curve*u*u+Math.sin(u*5+t*(.35+form.flow*.2)*motion+phase)*(.085+form.flutter*.11)*u*u;
   const pt=point(theta+turn,.31+u*reach,phase);pt[0]+=Math.sin(u*8+t*.21*motion+phase)*radius*.017*u;pt[1]+=Math.cos(u*7+t*.23*motion+phase)*radius*.017*u;return pt;};
  // Draw a tapering translucent web between both edges of an appendage.
  const segments=eco?15:25;c.beginPath();for(let j=0;j<=segments;j++){const u=j/segments,p=armPoint(u),tangent=theta+arm.curve*u,thick=radius*arm.width*(1-u)**1.25*(.5+form.thickness*.65);const px=p[0]-Math.sin(tangent)*thick,py=p[1]+Math.cos(tangent)*thick;if(j===0)c.moveTo(px,py);else c.lineTo(px,py);}for(let j=segments;j>=0;j--){const u=j/segments,p=armPoint(u),tangent=theta+arm.curve*u,thick=radius*arm.width*(1-u)**1.25*(.5+form.thickness*.65);c.lineTo(p[0]+Math.sin(tangent)*thick,p[1]-Math.cos(tangent)*thick);}c.closePath();c.fillStyle=rgba(...(i%3?P.iris:P.blue),.023+form.thickness*.018);c.fill();c.strokeStyle=rgba(...P.silk,.12);c.lineWidth=.55;c.stroke();
  path(steps,armPoint);c.lineWidth=i%3===0?1.65:.88;c.strokeStyle=rgba(...(i%3===0?P.pearl:P.iris),.23+.11*(1-wind));c.stroke();
  if(!eco){for(let b=0;b<arm.branches;b++){const start=.35+b*.17,end=Math.min(.99,start+.22+hash(i*71+b)*.16),side=b%2?-1:1;
    const root=armPoint(start);path(15,u=>{const base=armPoint(mix(start,end,u));const deviation=u*u*radius*(.13+.11*hash(i+b*3))*side;return [mix(root[0],base[0],u)+Math.cos(theta+Math.PI/2)*deviation,mix(root[1],base[1],u)+Math.sin(theta+Math.PI/2)*deviation];});c.strokeStyle=rgba(...P.silk,.12+.13*(1-start));c.lineWidth=.7;c.stroke();}}
  const tip=armPoint(.985);c.fillStyle=rgba(...P.pearl,.31);c.beginPath();c.arc(...tip,1.1,0,TAU);c.fill();
 });
 // Soft luminous inner organ: a large complex multilobed structure, not a pinprick.
 for(let shell=5;shell>=0;shell--){let rad=(.23+shell*.045)*(1+Math.sin(t*.54*motion)*.035);path(145,u=>{let th=u*TAU;let r=rad*(1+.12*Math.sin(th*(anatomy.lobes-1)+t*.4*motion)+.06*Math.cos(th*11-t*.22*motion));return point(th,r,shell*.42)});c.closePath();const g=c.createRadialGradient(cx-radius*.055,cy-radius*.06,0,cx,cy,span*rad*1.5);g.addColorStop(0,rgba(...P.warm,.15));g.addColorStop(.45,rgba(...(shell%2?P.pearl:P.silk),.07));g.addColorStop(1,rgba(...P.iris,.009));c.fillStyle=g;c.fill();c.strokeStyle=rgba(...(shell%2?P.pearl:P.silk),.28-shell*.023);c.lineWidth=shell===0?1.45:.85;c.stroke();}
 // Circulating luminous vesicles follow constrained paths, not a random free-floating cloud.
 const count=eco?160:ultra?620:360;for(let i=0;i<count;i++){const sp=this.sparks[i];const theta=sp.theta+(t*.026*motion*(i%2?1:-1));const r=sp.r*(.79+.07*Math.sin(t*.42*motion+sp.phase));const [x,y]=point(theta,r,sp.phase);const pulse=.55+.45*Math.sin(t*(.4+sp.size)*motion+sp.phase);c.fillStyle=rgba(...(i%7===0?P.pearl:i%5===0?P.blue:P.iris),(.12+sp.size*.4)*pulse);c.beginPath();c.arc(x,y,.35+sp.size*(i%21===0?1.9:1),0,TAU);c.fill();}
 // Cardiovascular pulse: multiple luminous chambers with asynchronous breathing.
 const pulse=1+.08*Math.sin(t*.88*motion)+.035*Math.sin(t*1.43*motion);const nucleus=span*.15*pulse;const glow=c.createRadialGradient(cx,cy,0,cx,cy,nucleus*4.8);glow.addColorStop(0,rgba(...P.warm,.72));glow.addColorStop(.10,rgba(...P.pearl,.37));glow.addColorStop(.28,rgba(...P.iris,.12));glow.addColorStop(1,rgba(...P.iris,0));c.fillStyle=glow;c.beginPath();c.arc(cx,cy,nucleus*4.8,0,TAU);c.fill();
 for(let chamber=0;chamber<3;chamber++){const ax=cx+Math.cos(chamber*TAU/3+t*.13*motion)*nucleus*.3,ay=cy+Math.sin(chamber*TAU/3+t*.13*motion)*nucleus*.3;const g=c.createRadialGradient(ax,ay,0,ax,ay,nucleus*.9);g.addColorStop(0,rgba(...P.warm,.7));g.addColorStop(.4,rgba(...P.pearl,.22));g.addColorStop(1,rgba(...P.iris,0));c.fillStyle=g;c.beginPath();c.arc(ax,ay,nucleus*.9,0,TAU);c.fill();}
 for(const burst of e.pulses){const u=burst.t/3.2;c.beginPath();c.ellipse(cx+(burst.x-cx)*.14,cy+(burst.y-cy)*.14,radius*(.10+u*1.62),radius*(.10+u*1.62),0,0,TAU);c.strokeStyle=rgba(...P.pearl,(1-u)*.33*burst.force);c.lineWidth=1.8*(1-u)+.2;c.stroke();}
 // A searching filament traces the last attention target, fading slowly after mouse exit.
 if(focus.strength>.035){let targetX=focus.x,targetY=focus.y;const d=Math.hypot(targetX-cx,targetY-cy);if(d<radius*2.9){const th=Math.atan2(targetY-cy,targetX-cx);const start=point(th,.47),end=point(th,clamp(d/span*.78,.7,1.55));c.beginPath();c.moveTo(...start);c.quadraticCurveTo(cx+(targetX-cx)*.55,cy+(targetY-cy)*.55,...end);c.strokeStyle=rgba(...P.pearl,.33*focus.strength*s.curiosity);c.lineWidth=1.1;c.stroke();}}
 c.restore();
 if(W>800){c.strokeStyle='rgba(153,179,213,.12)';for(let sign of [-1,1]){const x=cx+sign*radius*1.7;c.beginPath();c.moveTo(x-5,cy);c.lineTo(x+5,cy);c.moveTo(x,cy-5);c.lineTo(x,cy+5);c.stroke();}}
 }
}
