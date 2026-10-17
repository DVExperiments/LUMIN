import {clamp,hash,TAU} from './anatomy.js';
import {phenotype,shapeAt} from './metamorphosis.js';
import {anatomyPlan,tissueLayers,pulsePosition} from './biogenesis.js';
const rgba=(v,a)=>`rgba(${v},${clamp(a)})`;
const SMOOTH=(a,b,t)=>a+(b-a)*t;
function strokePath(ctx,pts,close=true){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(close)ctx.closePath();}
function glow(ctx,x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);stops.forEach(([s,v])=>g.addColorStop(s,v));return g;}
function bezier(a,b,c,d,u){const v=1-u;return [v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]];}
function drawTaper(ctx,points,width,col){const n=points.length;for(let i=1;i<n;i++){const k=i/(n-1),p=points[i-1],q=points[i];ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineWidth=Math.max(.35,width*Math.pow(1-k,1.28));ctx.strokeStyle=col;ctx.stroke();}}
export class Renderer{
 constructor(canvas,engine,quality='balanced'){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.engine=engine;this.quality=quality;this.seed=null;
  this.stars=Array.from({length:210},(_,i)=>({x:hash(i*13+1),y:hash(i*31+6),r:.25+hash(i*7+11)*1.05,a:.07+hash(i*19+4)*.24}));
  this.dust=Array.from({length:200},(_,i)=>({u:hash(i*73+5),v:hash(i*21+8),phase:hash(i*99+4)*TAU,r:hash(i*11+4)}));
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.w=innerWidth;this.h=innerHeight;this.dpr=Math.min(devicePixelRatio||1,{eco:1,balanced:1.5,ultra:2}[this.quality]);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 setQuality(q){this.quality=q;this.resize();}
 draw(){
  const c=this.ctx,e=this.engine,w=e.current,a=e.adapt,s=e.state,W=this.w,H=this.h,t=e.time*(e.motion===0?.015:1);
  if(this.seed!==e.seed){this.seed=e.seed;this.ph=phenotype(e.seed,a);this.plan=anatomyPlan(e.seed,a);}const ph=this.ph,plan=this.plan,mem=tissueLayers(a);
  const mobile=W<700,sz=Math.min(W,H)*(mobile?.18:.202)*(1+s.openness*.055);
  const cx=W*(mobile?.50:.55)+Math.sin(t*.092+e.seed)*sz*.065+e.roam.x*sz*.035;
  const cy=H*(mobile?.47:.49)+Math.sin(t*.112)*sz*.06+e.roam.y*sz*.025;
  const focus=e.attention.strength*clamp(s.curiosity),fx=clamp((e.attention.x-cx)/Math.max(sz,1),-2,2)*focus,fy=clamp((e.attention.y-cy)/Math.max(sz,1),-2,2)*focus;
  const morph=(u,scale=1)=>{let p=shapeAt(u,ph,a,s,w,t);return [cx+(p.x+fx*.065)*sz*scale,cy+(p.y+fy*.065)*sz*scale];};
  c.fillStyle='#050a15';c.fillRect(0,0,W,H);
  c.fillStyle=glow(c,cx,cy,Math.max(W,H)*.65,[[0,'#19213c'],[.32,'#101a2c'],[1,'#050a15']]);c.fillRect(0,0,W,H);
  for(const st of this.stars){c.fillStyle=rgba('174,207,228',st.a);c.beginPath();c.arc(st.x*W,st.y*H,st.r,0,TAU);c.fill();}
  c.fillStyle=glow(c,cx,cy,sz*2.6,[[0,'rgba(124,123,214,.21)'],[.44,'rgba(78,111,189,.07)'],[1,'rgba(60,70,120,0)']]);c.beginPath();c.arc(cx,cy,sz*2.6,0,TAU);c.fill();
  const contour=Array.from({length:this.quality==='eco'?90:160},(_,i)=>morph(i/(this.quality==='eco'?90:160)));
  // A fan of individually tapered, articulated appendages rooted at the membrane.
  const limbCount=this.quality==='eco'?Math.min(8,plan.limbs.length):plan.limbs.length;
  for(let i=0;i<limbCount;i++){
   const limb=plan.limbs[i],o=morph(limb.u),angle=limb.u*TAU,dir=[Math.cos(angle),Math.sin(angle)];
   const reach=sz*limb.length*(1+a.wind*.68)*(1+.035*Math.sin(t*.38+limb.phase));
   const drift=Math.sin(t*.41+limb.phase)*sz*.16+limb.flex*sz*.22;
   const tip=[o[0]+dir[0]*reach+drift+fx*sz*.06,o[1]+dir[1]*reach*.94+Math.cos(t*.32+limb.phase)*sz*.16];
   const b=[o[0]+dir[0]*reach*.24-limb.side*sz*.13,o[1]+dir[1]*reach*.22];
   const d=[tip[0]-dir[0]*reach*.20+drift*.2,tip[1]-dir[1]*reach*.23];
   const segments=this.quality==='eco'?18:32;
   const points=Array.from({length:segments+1},(_,j)=>bezier(o,b,d,tip,j/segments));
   drawTaper(c,points,sz*limb.width*2.4,rgba(i%3===0?'101,216,210':'147,152,216',.10));
   drawTaper(c,points,sz*limb.width*.62,rgba(i%3===0?'135,235,220':'201,188,237',.43));
   for(let k=0;k<limb.branch;k++){
    const u=.30+(k+1)/(limb.branch+2)*.45,p=bezier(o,b,d,tip,u),side=(k%2?1:-1)*limb.side;
    const off=reach*(.10+.10*hash(i*13+k+10));
    const branch=[p,[p[0]+side*off*.35,p[1]-off*.28],[p[0]+side*off*.86,p[1]-off*.33],[p[0]+side*off,p[1]-off*(.44+.08*Math.sin(t*.3+k))]];
    const sub=Array.from({length:12},(_,j)=>bezier(...branch,j/11));
    drawTaper(c,sub,1.8,rgba('114,220,216',.27));
   }
   const travelling=pulsePosition(t,limb.phase,.55),light=bezier(o,b,d,tip,travelling);
   c.fillStyle=glow(c,light[0],light[1],sz*.075,[[0,'rgba(194,255,239,.30)'],[1,'rgba(121,222,217,0)']]);c.beginPath();c.arc(light[0],light[1],sz*.075,0,TAU);c.fill();
  }
  // Multiple off-register tissue plates create a non-uniform body, not a flat single polygon.
  c.save();strokePath(c,contour);c.clip();
  const mass=glow(c,cx-sz*.23,cy-sz*.29,sz*1.78,[[0,'rgba(204,172,219,.68)'],[.36,'rgba(116,120,188,.56)'],[.70,'rgba(59,79,141,.49)'],[1,'rgba(35,55,107,.40)']]);
  c.fillStyle=mass;c.fillRect(cx-sz*1.8,cy-sz*1.8,sz*3.6,sz*3.6);
  // Curvilinear sheets: lobes overlap with small moving separations and refraction-like shadows.
  for(let j=plan.folds-1;j>=0;j--){
   const phase=j/plan.folds,off=(phase-.5),offsetX=sz*(off*.54+Math.sin(t*.18+j*1.8)*.032);
   c.beginPath();c.moveTo(cx+offsetX-sz*.25,cy-sz*1.5);
   c.bezierCurveTo(cx+offsetX-sz*(.62+.07*Math.sin(j)),cy-sz*.42,cx+offsetX+sz*.35,cy+sz*.45,cx+offsetX-sz*.16,cy+sz*1.65);
   c.lineWidth=sz*(.17+.025*(j%3));c.strokeStyle=rgba(j%2?'132,155,224':'199,160,223',.025+mem.veil*.13);c.stroke();
   c.lineWidth=1.3;c.strokeStyle=rgba(j%2?'178,215,230':'219,188,232',.085+mem.ridge*.18);c.stroke();
  }
  // Pockets of irregularly distributed specular light imply curved, hydrated tissue.
  for(let j=0;j<plan.ridges;j++){
   const uu=(j+.35)/plan.ridges,off=(hash(e.seed*.13+j*14)-.5)*.48;
   const xx=cx+(uu-.5)*sz*1.55,yy=cy+off*sz*1.2;
   const r=sz*(.22+hash(j*19+e.seed)*.17);
   c.fillStyle=glow(c,xx,yy,r,[[0,rgba('184,194,240',.025+mem.ventral*.05)],[1,'rgba(159,182,236,0)']]);c.beginPath();c.arc(xx,yy,r,0,TAU);c.fill();
  }
  // Named organs communicate through branching vascular loops, with a beating dominant heart.
  const organs=plan.organs.map((k,j)=>{const beat=1+.06*Math.sin(t*(.74+j*.21)+k.phase);return {x:cx+k.x*sz+Math.sin(t*.23+j)*sz*.025,y:cy+k.y*sz,r:k.r*sz*beat};});
  for(let j=0;j<organs.length;j++){
   const g=organs[j];const radius=g.r*3.3;
   c.fillStyle=glow(c,g.x,g.y,radius,[[0,j===0?'rgba(255,245,211,.69)':'rgba(148,235,222,.52)'],[.28,'rgba(185,158,215,.22)'],[1,'rgba(140,155,210,0)']]);c.beginPath();c.arc(g.x,g.y,radius,0,TAU);c.fill();
   c.beginPath();c.ellipse(g.x,g.y,g.r*.66,g.r*(1.03+j*.08),-.22+j*.34,0,TAU);
   c.fillStyle=rgba(j===0?'243,205,225':'125,203,209',.07);c.fill();
   c.strokeStyle=rgba('227,218,238',.20);c.lineWidth=1;c.stroke();
  }
  const root=organs[0];
  for(let i=0;i<34;i++){
   const dest=organs[1+i%2],ang=i*2.39996,frac=.28+.67*hash(i*17+e.seed);
   const end=[cx+Math.cos(ang)*sz*frac,cy+Math.sin(ang)*sz*frac*1.12];
   const a0=[root.x,root.y],b=[root.x+Math.cos(ang)*sz*.26,root.y+Math.sin(ang)*sz*.16],d=[dest.x+Math.sin(i)*sz*.16,dest.y+Math.cos(i)*sz*.22];
   const path=Array.from({length:17},(_,j)=>bezier(a0,b,d,end,j/16));
   drawTaper(c,path,i%5===0?2.5:1.25,rgba(i%3===0?'125,226,215':'206,183,226',.10));
   if(i%3===0){const pp=bezier(a0,b,d,end,pulsePosition(t,i*.38,.46));c.fillStyle=rgba('179,255,230',.34);c.beginPath();c.arc(pp[0],pp[1],1.5,0,TAU);c.fill();}
  }
  const n=this.quality==='eco'?50:this.quality==='ultra'?160:95;
  for(let j=0;j<n;j++){const d=this.dust[j],xx=cx+(d.u-.5)*sz*1.75,yy=cy+(d.v-.5)*sz*2.4+Math.sin(t*.26+d.phase)*sz*.032;c.fillStyle=rgba(j%5===0?'142,230,220':'240,219,233',.07+d.r*.21);c.beginPath();c.arc(xx,yy,.35+d.r*.98,0,TAU);c.fill();}
  c.restore();
  // Tight outer boundary and anisotropic light edging make a rounded volume readable.
  strokePath(c,contour);c.lineWidth=sz*.045;c.strokeStyle=rgba('108,145,214',.064);c.stroke();
  c.lineWidth=1.5;c.strokeStyle=rgba('207,204,250',.43);c.stroke();
  strokePath(c,contour.map(([x,y])=>[SMOOTH(cx,x,.955),SMOOTH(cy,y,.955)]));c.lineWidth=2.5;c.strokeStyle=rgba('115,218,223',.08);c.stroke();
  // Small translucent asymmetric satellite bud, conditional on prolonged moisture.
  if(a.wet>.42){const bud=morph(.06);let r=sz*(.06+(a.wet-.42)*.22);c.fillStyle=glow(c,bud[0],bud[1],r*2,[[0,'rgba(166,240,226,.24)'],[1,'rgba(120,215,220,0)']]);c.beginPath();c.arc(bud[0],bud[1],r*2,0,TAU);c.fill();}
  // Wind-exposed anatomy acquires an elongated ventral streamer.
  const tail=sz*(.28+a.wind*.54),base=morph(.22);c.beginPath();c.moveTo(...base);c.bezierCurveTo(base[0]+sz*.18,base[1]+sz*.28,base[0]-sz*.07,base[1]+tail*1.45,base[0]+sz*.16,base[1]+tail*1.95);c.strokeStyle=rgba('132,218,218',.12+a.wind*.13);c.lineWidth=1.2;c.stroke();
  for(const p of e.pulses){const q=p.t/3.2;c.beginPath();c.arc(p.x,p.y,sz*(.06+q*.53),0,TAU);c.strokeStyle=rgba('143,226,219',(1-q)*.27*p.force);c.lineWidth=1.3;c.stroke();}
  if(W>800){c.strokeStyle='rgba(153,179,213,.08)';for(const side of [-1,1]){const x=cx+side*sz*2.3;c.beginPath();c.moveTo(x-5,cy);c.lineTo(x+5,cy);c.moveTo(x,cy-5);c.lineTo(x,cy+5);c.stroke();}}
 }
}
