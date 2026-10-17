import {clamp,hash,TAU} from './anatomy.js';
import {phenotype,shapeAt} from './metamorphosis.js';
const RG=(r,g,b,a)=>`rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${clamp(a)})`;
const C={ivory:[245,225,207],lavender:[158,139,220],aqua:[112,220,218],rose:[230,137,182],deep:[50,60,125]};
function pathPoints(c,pts,close=true){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();}
function gradient(c,x,y,r,stops){const g=c.createRadialGradient(x,y,0,x,y,r);stops.forEach(([pos,col])=>g.addColorStop(pos,col));return g;}
export class Renderer{
 constructor(canvas,engine,quality='balanced'){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.engine=engine;this.quality=quality;this.seed=null;
  this.stars=Array.from({length:230},(_,i)=>({x:hash(i*13+1),y:hash(i*31+6),r:.3+hash(i*7+11)*1.2,a:.08+hash(i*19+4)*.3}));
  this.dust=Array.from({length:170},(_,i)=>({u:hash(i*73+5),v:hash(i*21+8),phase:hash(i*99+4)*TAU,r:hash(i*11+4)}));
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.w=innerWidth;this.h=innerHeight;this.dpr=Math.min(devicePixelRatio||1,{eco:1,balanced:1.5,ultra:2}[this.quality]);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);this.canvas.style.width=this.w+'px';this.canvas.style.height=this.h+'px';this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
 setQuality(q){this.quality=q;this.resize();}
 draw(){const c=this.ctx,e=this.engine,w=e.current,a=e.adapt,s=e.state,W=this.w,H=this.h,t=e.time*(e.motion===0?.012:1);
  if(this.seed!==e.seed){this.seed=e.seed;this.ph=phenotype(e.seed,a);}const ph=this.ph;
  const mobile=W<700,sz=Math.min(W,H)*(mobile?.215:.265)*(1+s.openness*.12);
  const cx=W*(mobile?.50:.544)+Math.sin(t*.085+e.seed)*sz*.09+e.roam.x*sz*.02;
  const cy=H*(mobile?.47:.50)+Math.sin(t*.13)*sz*.045;
  const focus=e.attention.strength*clamp(s.curiosity);
  const atX=clamp((e.attention.x-cx)/Math.max(sz,1),-1.4,1.4)*focus;
  const atY=clamp((e.attention.y-cy)/Math.max(sz,1),-1.4,1.4)*focus;
  const morph=(u,scale=1)=>{const v=shapeAt(u,ph,a,s,w,t);return [cx+(v.x+atX*.05)*sz*scale,cy+(v.y+atY*.05)*sz*scale];};
  c.fillStyle='#050a15';c.fillRect(0,0,W,H);
  const atmosphere=gradient(c,cx,cy,Math.max(W,H)*.63,[[0,'#162139'],[.36,'#0b1426'],[1,'#050a15']]);c.fillStyle=atmosphere;c.fillRect(0,0,W,H);
  for(const st of this.stars){c.fillStyle=RG(181,211,235,st.a);c.beginPath();c.arc(st.x*W,st.y*H,st.r,0,TAU);c.fill();}
  c.save();c.translate(cx,cy);c.scale(1,.83);let halo=gradient(c,0,0,sz*2.6,[[0,'rgba(111,117,213,.11)'],[.5,'rgba(70,110,190,.055)'],[1,'rgba(0,0,0,0)']]);c.fillStyle=halo;c.beginPath();c.arc(0,0,sz*2.6,0,TAU);c.fill();c.restore();
  const pts=Array.from({length:140},(_,i)=>morph(i/140));
  // Appendages live behind the mantle; every one joins a specific point on its contour.
  const appendCount=this.quality==='eco'?8:11;
  for(let i=0;i<appendCount;i++){
   const limb=ph.appendages[i],u=limb.u,origin=morph(u),ang=u*TAU;
   const axis=[Math.cos(ang),Math.sin(ang)];const max=sz*limb.reach*(.9+a.wind*.5)*(1+Math.sin(t*.22+limb.phase)*.07);
   const bend=Math.sin(t*.40+limb.phase)*sz*.15+limb.curve*sz*.3;
   const ex=origin[0]+axis[0]*max+bend+atX*sz*.16,ey=origin[1]+axis[1]*max*.83+Math.sin(t*.35+limb.phase)*sz*.17;
   const cp1=[origin[0]+axis[0]*max*.38-limb.side*sz*.11,origin[1]+axis[1]*max*.2];
   const cp2=[ex-axis[0]*max*.23+bend*.15,ey-axis[1]*max*.22];
   c.beginPath();c.moveTo(...origin);c.bezierCurveTo(...cp1,...cp2,ex,ey);
   c.lineCap='round';c.strokeStyle=RG(...(i%3===0?C.aqua:C.lavender),.065);c.lineWidth=(i%3===0?12:7)*limb.root;c.stroke();
   c.strokeStyle=RG(...(i%3===0?C.aqua:C.ivory),.28);c.lineWidth=(i%3===0?1.9:1.2)*limb.root;c.stroke();
   if(i%2===0){const bx=origin[0]*.35+ex*.65,by=origin[1]*.35+ey*.65;
    c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+limb.side*sz*.24,by-sz*.16,bx+limb.side*sz*.36,by-sz*.23);
    c.strokeStyle=RG(...C.aqua,.18);c.lineWidth=.8;c.stroke();}
   c.fillStyle=RG(...C.aqua,.44);c.beginPath();c.arc(ex,ey,1.4,0,TAU);c.fill();
  }
  // Opaque-enough internal mantle mass: layered, lit volume rather than only outlines.
  c.save();pathPoints(c,pts);c.clip();
  const tissue=gradient(c,cx-sz*.19,cy-sz*.3,sz*1.85,[[0,'rgba(215,176,220,.59)'],[.27,'rgba(127,125,204,.51)'],[.62,'rgba(74,94,166,.39)'],[1,'rgba(42,65,130,.3)']]);
  c.fillStyle=tissue;c.fillRect(cx-sz*1.7,cy-sz*1.8,sz*3.4,sz*3.6);
  // Mantle's internal folds are offset across its long axis, not concentric rosettes.
  for(let j=0;j<10;j++){
   const x=cx+sz*(-.48+j*.105),sway=Math.sin(j*.85+t*.36)*sz*.04;
   c.beginPath();c.moveTo(x,cy-sz*1.6);c.bezierCurveTo(x-sz*.26+sway,cy-sz*.64,x+sz*.17,cy+sz*.22,x+sz*.07+sway,cy+sz*1.6);
   c.strokeStyle=RG(...(j%3===0?C.aqua:C.lavender),.10+j%3*.02);c.lineWidth=1.5;c.stroke();
  }
  // Distributed luminescent organs with asynchronous circulatory rhythms.
  for(let j=0;j<ph.chambers.length;j++){
   const k=ph.chambers[j],x=cx+k.x*sz+Math.sin(t*.4+j)*sz*.04,y=cy+k.y*sz;
   const rr=sz*k.r*(1+.06*Math.sin(t*(.6+j*.11)+j));
   c.fillStyle=gradient(c,x,y,rr*2.8,[[0,j===0?'rgba(255,245,219,.78)':'rgba(169,237,231,.56)'],[.29,'rgba(190,177,231,.4)'],[1,'rgba(133,135,210,0)']]);c.beginPath();c.arc(x,y,rr*2.8,0,TAU);c.fill();
   c.beginPath();c.ellipse(x,y,rr*(.59+.04*j),rr*(1.12-j*.13),j*.34,0,TAU);
   c.strokeStyle=RG(...C.ivory,.40);c.lineWidth=1.2;c.stroke();
  }
  // Fine inner capillaries connect organs and create a visible anatomical flow.
  for(let j=0;j<24;j++){
   const f=j/24,x=cx+Math.sin(j*2.41)*sz*.45,y=cy+(f-.5)*sz*2.2;
   c.beginPath();c.moveTo(cx-sz*.1,cy-sz*.2);c.bezierCurveTo(x*.4+cx*.6,y,x,cy+sz*.3,x+sz*.07*Math.sin(t*.28+j),y);
   c.strokeStyle=RG(...(j%4===0?C.aqua:C.ivory),.09);c.lineWidth=.6;c.stroke();
  }
  const dustCount=this.quality==='eco'?65:this.quality==='ultra'?170:110;
  for(let j=0;j<dustCount;j++){
   const d=this.dust[j],xx=cx+(d.u-.5)*sz*1.85,yy=cy+(d.v-.5)*sz*2.55+Math.sin(t*.35+d.phase)*sz*.06;
   c.fillStyle=RG(...(j%4===0?C.aqua:C.ivory),.10+d.r*.32);c.beginPath();c.arc(xx,yy,.35+d.r*1.15,0,TAU);c.fill();
  }
  c.restore();
  // Rim illumination reveals a solid contour and readable body shape.
  pathPoints(c,pts);c.fillStyle='rgba(130,139,207,.08)';c.fill();
  c.strokeStyle='rgba(197,202,243,.39)';c.lineWidth=1.7;c.stroke();
  pathPoints(c,pts.map(([x,y])=>[cx+(x-cx)*.94,cy+(y-cy)*.94]));c.strokeStyle='rgba(129,220,227,.11)';c.lineWidth=4;c.stroke();
  const core=ph.chambers[0];const hx=cx+core.x*sz,hy=cy+core.y*sz;
  c.fillStyle=gradient(c,hx,hy,sz*.62,[[0,'rgba(255,247,224,.52)'],[.20,'rgba(232,204,234,.19)'],[1,'rgba(180,144,222,0)']]);c.beginPath();c.arc(hx,hy,sz*.62,0,TAU);c.fill();
  // The lower trailing vascular streamer grows with accumulated wind exposure.
  const tail=sz*(.65+ph.tail*.5+a.wind*.75);const x0=cx+sz*.20,y0=cy+sz*.9;
  c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(x0+sz*.38,cy+sz*1.28,x0+sz*.19+Math.sin(t*.24)*sz*.27,cy+tail*1.7,x0+sz*.16,cy+tail*2.05);
  c.strokeStyle=RG(...C.aqua,.23);c.lineWidth=1.6;c.stroke();
  for(const p of e.pulses){const q=p.t/3.2;c.beginPath();c.ellipse(p.x,p.y,sz*(.04+q*.66),sz*(.04+q*.66),0,0,TAU);c.strokeStyle=RG(...C.aqua,(1-q)*.26*p.force);c.lineWidth=1.5;c.stroke();}
  if(W>800){c.strokeStyle='rgba(153,179,213,.09)';for(const side of [-1,1]){const x=cx+side*sz*1.9;c.beginPath();c.moveTo(x-5,cy);c.lineTo(x+5,cy);c.moveTo(x,cy-5);c.lineTo(x,cy+5);c.stroke();}}
 }
}
