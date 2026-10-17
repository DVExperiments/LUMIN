// LUMIN v3: optional hardware-accelerated, three-dimensional translucent anatomy.
// This never accesses personal data or the network. If WebGL fails, the 2D organism survives.
import {clamp,hash,posture} from './anatomy.js';
const VS=`#version 300 es
precision highp float;
in vec3 position;
uniform float time, seed, open, wind, wet, cold, energy, startle, motion;
uniform vec2 breeze, attention;
uniform mat4 projection;
out vec3 vNormal;
out vec3 vPosition;
out float vPulse;
float waves(vec3 p){return sin(p.x*8.0+time*.41)*sin(p.y*7.0-time*.28)*.045 + sin(p.z*11.0+p.x*6.0-time*.27)*.033;}
vec3 deform(vec3 p){
  float radial=length(p.xy);
  float asymmetric=1.0+.19*sin(3.0*atan(p.y,p.x)+seed*1.8+time*.11*motion)+.12*sin(5.0*atan(p.y,p.x)-seed*.7-time*.19*motion);
  float fold=sin(8.0*atan(p.y,p.x)+p.z*3.0+time*.3*motion)*(.05+cold*.15);
  float mass=asymmetric+fold+waves(p)*motion;
  vec3 result=vec3(p.x*mass*(.85+open*.32+wind*.36),p.y*mass*(.92+open*.18),p.z*(.53+wet*.16));
  result.xy+=breeze*(.16+.19*max(p.z,0.0))*radial;
  result.xy+=attention*.12*radial;
  result.x+=.18*sin(p.z*2.6+time*.17*motion+seed)*radial;
  result.y+=.11*cos(p.z*2.0-time*.23*motion+seed)*radial;
  result*=1.0-startle*.15;
  return result;
}
void main(){
  vec3 p=deform(position);
  vec3 a=deform(position+vec3(.005,0.,0.));
  vec3 b=deform(position+vec3(0.,.005,0.));
  vNormal=normalize(cross(a-p,b-p)+position*.003);
  vPosition=p;
  vPulse=.5+.5*sin(time*(.9+energy*.7)*motion+position.y*6.0+seed);
  gl_Position=projection*vec4(p,1.0);
}`;
const FS=`#version 300 es
precision highp float;
in vec3 vNormal,vPosition;
in float vPulse;
uniform float cold,wet,light,layer;
out vec4 fragColor;
void main(){
 vec3 n=normalize(vNormal);vec3 view=normalize(vec3(-vPosition.xy,2.9-vPosition.z));
 float facing=abs(dot(n,view));float rim=pow(1.0-facing,2.3);
 float vein=pow(.5+.5*sin(atan(vPosition.y,vPosition.x)*24.0+vPosition.z*13.0),9.0);
 float filament=pow(.5+.5*sin(length(vPosition.xy)*37.0+vPosition.z*8.0),14.0);
 float irradiance=max(dot(n,normalize(vec3(-.6,.8,1.0))),0.0);
 vec3 violet=mix(vec3(.22,.18,.47),vec3(.22,.64,.76),cold);
 vec3 pearl=vec3(1.0,.76,.67);
 vec3 chroma=mix(violet,pearl,clamp(irradiance*.4+vPulse*.12,0.,.65));
 chroma+=vec3(.3,.4,.6)*rim*.65+vec3(.55,.35,.5)*(vein*.12+filament*.16);
 float alpha=(.038+rim*.28+vein*.024+filament*.038+irradiance*.05)*(layer>.5?.64:1.0);
 alpha+=wet*.034+light*.016;
 fragColor=vec4(chroma,clamp(alpha,0.,.67));
}`;
function compile(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
function sphere(rows=52,cols=78){const v=[],idx=[];for(let y=0;y<=rows;y++){const theta=y/rows*Math.PI;for(let x=0;x<=cols;x++){const phi=x/cols*2*Math.PI;v.push(Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),Math.cos(theta));}}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let a=y*(cols+1)+x,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}return {positions:new Float32Array(v),indices:new Uint16Array(idx)};}
export class VolumeRenderer{
 constructor(canvas,engine,quality='balanced'){
  this.canvas=canvas;this.engine=engine;this.quality=quality;this.available=false;
  try{const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL2 unavailable');this.gl=gl;
   const prog=gl.createProgram();gl.attachShader(prog,compile(gl,gl.VERTEX_SHADER,VS));gl.attachShader(prog,compile(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));this.prog=prog;
   this.u={};for(const k of ['time','seed','open','wind','wet','cold','energy','startle','motion','breeze','attention','projection','light','layer'])this.u[k]=gl.getUniformLocation(prog,k);
   const mesh=sphere();this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);const vertex=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,mesh.positions,gl.STATIC_DRAW);const loc=gl.getAttribLocation(prog,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);this.count=mesh.indices.length;gl.bindVertexArray(null);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);this.available=true;
   canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.available=false;canvas.style.opacity='0';});
   this.resize();
  }catch(err){this.error=String(err);canvas.style.display='none';}
 }
 resize(){if(!this.available)return;const scale={eco:.66,balanced:1,ultra:1.35}[this.quality]||1;const pixelRatio=Math.min(devicePixelRatio||1,1.6)*scale;this.canvas.width=Math.max(1,Math.floor(innerWidth*pixelRatio));this.canvas.height=Math.max(1,Math.floor(innerHeight*pixelRatio));this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
 setQuality(q){this.quality=q;this.resize();}
 draw(){if(!this.available)return;const gl=this.gl,e=this.engine,a=e.adapt,w=e.current,s=e.state;const isMobile=innerWidth<700;const dim=Math.min(innerWidth,innerHeight);const scale=dim*(isMobile?.26:.32);
  const cx=innerWidth*(isMobile?.50:.535),cy=innerHeight*(isMobile?.45:.51);const aspect=innerWidth/innerHeight;
  const form=posture(s,a,w,e.attention.strength);
  // Orthographic projection in pixel-like coordinates; world units approximate organism radius.
  const left=-innerWidth/(scale*2),right=innerWidth/(scale*2),bottom=-innerHeight/(scale*2),top=innerHeight/(scale*2);
  const sx=2/(right-left),sy=2/(top-bottom);const tx=-(right+left)/(right-left)+(cx-innerWidth/2)*2/innerWidth,ty=-(top+bottom)/(top-bottom)-(cy-innerHeight/2)*2/innerHeight;
  const projection=new Float32Array([sx,0,0,0,0,sy,0,0,0,0,-.25,0,tx,ty,0,1]);
  gl.useProgram(this.prog);gl.bindVertexArray(this.vao);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  const u=this.u;const f=(key,val)=>gl.uniform1f(u[key],val);
  f('time',e.time);f('seed',e.seed*.001);f('open',form.open);f('wind',a.wind);f('wet',a.wet);f('cold',a.cold);f('light',a.light);f('energy',s.energy);f('startle',e.startle);f('motion',e.motion);
  const radians=(w.direction-90)*Math.PI/180;gl.uniform2f(u.breeze,Math.cos(radians)*clamp(w.wind/90),-Math.sin(radians)*clamp(w.wind/90));gl.uniform2f(u.attention,clamp((e.attention.x-cx)/Math.max(scale,1),-1,1)*e.attention.strength,clamp((cy-e.attention.y)/Math.max(scale,1),-1,1)*e.attention.strength);
  gl.uniformMatrix4fv(u.projection,false,projection);
  // Order-independent approximation: bright additive translucent outer and inner organ membranes.
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE);f('layer',1);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);f('layer',0);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  gl.bindVertexArray(null);
 }
}
