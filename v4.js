(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('scene'),gl=canvas.getContext('webgl',{antialias:true,alpha:false});
if(!gl){$('error').hidden=false;$('error').textContent='WebGL is niet beschikbaar. Controleer de hardwareversnelling van je browser. De fotosimulator en theorie werken via de knoppen bovenaan.';return;}
const vs=`attribute vec3 position;attribute vec3 normal;attribute vec3 color;uniform mat4 vp;varying vec3 c;varying float l;void main(){gl_Position=vp*vec4(position,1.0);c=color;l=0.48+0.52*max(dot(normalize(normal),normalize(vec3(.35,.85,.45))),0.);}`;
const fs=`precision mediump float;varying vec3 c;varying float l;void main(){gl_FragColor=vec4(c*l,1.);}`;
function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);const ap=gl.getAttribLocation(program,'position'),an=gl.getAttribLocation(program,'normal'),ac=gl.getAttribLocation(program,'color'),uvp=gl.getUniformLocation(program,'vp');let buf=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.clearColor(.51,.72,.85,1);
function sub(a,b){return a.map((v,i)=>v-b[i])}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function norm(a){let l=Math.hypot(...a)||1;return a.map(v=>v/l)}function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0)}
function look(eye,target,up){let z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]}
function perspective(fov,aspect,n,f){let q=1/Math.tan(fov/2);return[q/aspect,0,0,0,0,q,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]}
function mul(a,b){let c=Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c}
let v=[];function tri(a,b,c,col){let normal=norm(cross(sub(b,a),sub(c,a)));for(let p of [a,b,c])v.push(...p,...normal,...col)}
function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
function cube(x,y,z,w,h,d,col){let X=x-w/2,Y=y,Z=z-d/2;let a=[X,Y,Z],b=[X+w,Y,Z],c=[X+w,Y,Z+d],dd=[X,Y,Z+d],e=[X,Y+h,Z],f=[X+w,Y+h,Z],g=[X+w,Y+h,Z+d],hh=[X,Y+h,Z+d];quad(a,dd,c,b,col.map(q=>q*.72));quad(e,f,g,hh,col);quad(a,b,f,e,col.map(q=>q*.82));quad(b,c,g,f,col.map(q=>q*.65));quad(c,dd,hh,g,col.map(q=>q*.78));quad(dd,a,e,hh,col.map(q=>q*.92))}
function cylinder(x,y,z,r,h,col,n=9){for(let i=0;i<n;i++){let a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;let p=[x+r*Math.cos(a),y,z+r*Math.sin(a)],q=[x+r*Math.cos(b),y,z+r*Math.sin(b)],p2=[p[0],y+h,p[2]],q2=[q[0],y+h,q[2]];quad(p,q,q2,p2,col);tri([x,y+h,z],p2,q2,col)}}
function beam(a,b,r,col){let d=sub(b,a),len=Math.hypot(...d),mid=a.map((k,i)=>(k+b[i])/2); // solid beam aligned predominantly in x/y/z
 if(Math.abs(d[1])>Math.abs(d[0])&&Math.abs(d[1])>Math.abs(d[2]))cube(mid[0],Math.min(a[1],b[1]),mid[2],r,len,r,col);else if(Math.abs(d[0])>Math.abs(d[2]))cube(mid[0],mid[1]-r/2,mid[2],len,r,r,col);else cube(mid[0],mid[1]-r/2,mid[2],r,r,len,col)}
const C={grass:[.28,.53,.29],water:[.12,.43,.68],road:[.27,.32,.37],stone:[.65,.64,.59],brick:[.67,.37,.25],roof:[.31,.26,.24],wood:[.31,.21,.13],leaf:[.12,.43,.18],leaf2:[.21,.55,.21],white:[.85,.9,.88],gold:[.9,.68,.17],cyan:[.17,.96,.84],red:[.85,.22,.17],bridge:[.65,.71,.74]};
let pos={x:0,y:0,z:66},yaw=Math.PI,turnPractice=false,mode=0,camYaw=0,camPitch=0,air=false,landing=false,rth=false,done=false,progress=0,battery=100,score=0,keys=new Set(),last=0,seed=0;
let rings=[{x:0,y:7,z:43,label:'Brug naderen'},{x:0,y:4.1,z:16,label:'Onder de brug'},{x:38,y:11,z:-8,label:'Rond molen'},{x:38,y:12,z:-35,label:'Kerk observeren'},{x:0,y:7,z:-57,label:'Tussen bomen'}];
let blocks=[];function obstacle(x,z,w,d,h,type){blocks.push({x,z,w,d,h,type})}
function makeWorld(time){v=[];cube(0,-.38,0,190,.36,190,C.grass);cube(0,-.18,18,30,.18,150,C.water);cube(42,-.18,-26,8,.12,120,C.road);
 // bridge: horizontal deck at y=6.5; pillars at x+-12, opening underneath the central deck
 cube(0,6.5,17,36,1.1,7,C.bridge);for(let x of [-15.5,15.5]){cube(x,0,17,3.8,6.5,7,C.stone);for(let z of [14,20])cube(x,6.9,z,.22,2.5,.25,C.bridge)}
 for(let x=-17;x<=17;x+=3.4){cube(x,7.5,13.5,.18,1.9,.2,C.bridge);cube(x,7.5,20.5,.18,1.9,.2,C.bridge)}cube(0,9.1,13.5,35,.2,.2,C.bridge);cube(0,9.1,20.5,35,.2,.2,C.bridge);
 // full 3D mill body, roof and rotating four arms; centered at x28,z-8
 cylinder(28,0,-8,5,16,C.wood,12);cylinder(28,16,-8,5.7,3,C.roof,12);cube(28,3,-2.9,2.3,4,.2,C.white);let a=time*.4;for(let i=0;i<4;i++){let t=a+i*Math.PI/2,ex=28+Math.sin(t)*10,ey=14+Math.cos(t)*10;let dx=ex-28,dy=ey-14;let perp=[-dy/Math.hypot(dx,dy)*.9,dx/Math.hypot(dx,dy)*.9];quad([28+perp[0],14+perp[1],-2.5],[ex+perp[0],ey+perp[1],-2.5],[ex-perp[0],ey-perp[1],-2.5],[28-perp[0],14-perp[1],-2.5],C.white)}
 // church, front walls, high tower, roof and windows
 cube(26,0,-35,13,11,20,C.stone);cube(26,11,-35,14,3,21,C.roof);cube(26,0,-43,5,25,5,C.stone);cube(26,25,-43,6,4,6,C.roof);for(let z of [-42,-36,-30])for(let x of [19.4,32.6])cube(x,4,z,.12,3,1,C.white);
 // forest: trunks + varied foliage
 for(let i=0;i<26;i++){let side=i%2?-10:10;let x=side+Math.sin(i*4.1)*3,z=-44-Math.floor(i/2)*4;let h=5+(i%4)*1.2;cylinder(x,0,z,.65,h,C.wood,7);cylinder(x,h*.6,z,2.6,h*.8,i%3?C.leaf:C.leaf2,9)}
 // houses along outer edge
 for(let i=0;i<11;i++){let x=i%2?-45:47,z=39-Math.floor(i/2)*20;cube(x,0,z,10,5+i%3,9,C.brick);cube(x,5+i%3,z,11,1,10,C.roof);for(let j of [-2.5,2.5])cube(x+j,2.1,z+4.6,1.5,1.7,.1,C.white)}
 // H landing pad and bright vertical beacon
 cube(0,-.05,66,10,.12,10,C.cyan);cube(-1.4,.09,66,.45,.02,5,C.white);cube(1.4,.09,66,.45,.02,5,C.white);cube(0,.09,66,3,.02,.48,C.white);cylinder(0,.05,66,.18,11,C.cyan,8);
 // checkpoint rings in vertical x-y plane
 for(let i=progress;i<rings.length;i++){let r=rings[i],col=i===progress?C.gold:C.cyan;for(let j=0;j<28;j++){let a=j/28*Math.PI*2,b=(j+1)/28*Math.PI*2;let aa=[r.x+3*Math.cos(a),r.y+3*Math.sin(a),r.z],bb=[r.x+3*Math.cos(b),r.y+3*Math.sin(b),r.z];beam(aa,bb,.14,col)}}
 // Distinct nose and rotor markers rotate with drone yaw; translation and yaw are independent.
 let {x,y,z}=pos;cube(x,y-.13,z,1.25,.32,.7,C.white);let fx=Math.sin(yaw),fz=Math.cos(yaw),sx=Math.cos(yaw),sz=-Math.sin(yaw);cube(x+fx*.65,y-.20,z+fz*.65,.38,.25,.38,C.roof);cube(x+fx*.89,y-.09,z+fz*.89,.20,.13,.20,C.gold);beam([x+fx*.35,y+.24,z+fz*.35],[x+fx*1.65,y+.24,z+fz*1.65],.10,C.gold);cube(x+fx*1.73,y+.18,z+fz*1.73,.32,.18,.32,C.red);for(let side of [-1,1])for(let fore of [-1,1]){let rx=x+sx*side*.86+fx*fore*.48, rz=z+sz*side*.86+fz*fore*.48;cylinder(rx,y-.05,rz,.30,.10,C.roof,9);cube(rx,y-.22,rz,.12,.2,.12,C.stone)}
}
function upload(){let data=new Float32Array(v);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);for(let [at,off] of [[ap,0],[an,12],[ac,24]]){gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,36,off)}gl.drawArrays(gl.TRIANGLES,0,data.length/9)}
function updateHud(s){$('banner').textContent=s;$('coach').textContent=s}
function reset(){pos={x:0,y:0,z:66};yaw=Math.PI;air=false;landing=false;rth=false;turnPractice=false;done=false;progress=0;battery=100;score=0;seed++;keys.clear();$('flightState').textContent='Gereed · home 0 m';$('progress').textContent='0/5 controlepunten';$('target').textContent='Doel: onder de brug';$('score').textContent='Score: 0';updateHud('Kies OPSTIJGEN. Vlieg door de vijf ringen.');}
function crash(reason){air=false;done=true;landing=false;rth=false;keys.clear();$('flightState').textContent='Vlucht gestopt';updateHud('MISLUKT: '+reason+' · kies Nieuwe vlucht.');}
function touchDown(){let d=Math.hypot(pos.x,pos.z-66);air=false;done=true;landing=false;rth=false;keys.clear();pos.y=0;if(d<=5.1){if(progress===5){score+=100;updateHud('✓ MISSIE GESLAAGD! Veilig op H geland · score '+score);$('flightState').textContent='✓ Veilig geland · missie voltooid';}else{updateHud('✓ VEILIG GELAND OP H. Nog '+(5-progress)+' punten niet gehaald.');$('flightState').textContent='✓ Veilig geland · '+progress+'/5';}}else{updateHud('Landing buiten de H-mat ('+d.toFixed(1)+' m). Gebruik bij de volgende poging RTH of landingscamera.');$('flightState').textContent='Buiten H geland';}$('score').textContent='Score: '+score;}
function tick(dt){if(!air||done)return;battery=Math.max(0,battery-dt*.055);if(!battery){crash('accu leeg');return}
 const f=Number(keys.has('ArrowUp'))-Number(keys.has('ArrowDown'));
 const side=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft'));
 const turn=Number(keys.has('a'))-Number(keys.has('d'));
 const homeD=Math.hypot(pos.x,pos.z-66);
 if(rth){
   // RTH overrides pilot movement. Show progress in absolute distance even with follow camera.
   let dx=-pos.x,dz=66-pos.z,d=Math.hypot(dx,dz);
   if(pos.y<10){pos.y=Math.min(10,pos.y+dt*3);}else if(d>.40){
     let targetYaw=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));yaw+=clamp(delta,-dt*1.65,dt*1.65);
     pos.x+=dx/d*Math.min(d,dt*9);pos.z+=dz/d*Math.min(d,dt*9);
   }else{pos.x=0;pos.z=66;rth=false;landing=true;mode=3;keys.clear();updateHud('RTH: boven H aangekomen. Automatisch landen gestart.');}
 }else{
   yaw+=turn*dt*1.65;
   // Right is physically to the drone's RIGHT, not the reversed cross-vector.
   pos.x+=(Math.sin(yaw)*f-Math.cos(yaw)*side)*dt*8;
   pos.z+=(Math.cos(yaw)*f+Math.sin(yaw)*side)*dt*8;
   pos.y+=(Number(keys.has('w'))-Number(keys.has('s')))*dt*(landing?1.5:5);
 }
 if(landing){pos.y-=dt*1.2;if(pos.y<=.35){touchDown();return}}
 let hd=Math.hypot(pos.x,pos.z-66);$('flightState').textContent=rth?'RTH actief · nog '+hd.toFixed(1)+' m tot H':landing?'LANDEN · '+hd.toFixed(1)+' m tot H':'In vlucht · H '+hd.toFixed(1)+' m';
 // Landing at or near H is not a crash, including pilot-controlled touchdown.
 if(pos.y<=.20){if(hd<=5.1){touchDown();return}if(landing){touchDown();return}crash('grond geraakt buiten landingszone');return}
 if(Math.abs(pos.x)>95||Math.abs(pos.z)>95||pos.y>110){crash('buiten oefengebied');return}
 if(Math.abs(pos.x)<18.6&&Math.abs(pos.z-17)<4.2&&pos.y>6.2&&pos.y<8.05){crash('brugdek geraakt');return}
 for(let x of [-15.5,15.5])if(Math.abs(pos.x-x)<2.4&&Math.abs(pos.z-17)<4.1&&pos.y<7){crash('brugpijler geraakt');return}
 for(let o of [{x:28,z:-8,r:5.5,h:20},{x:26,z:-35,r:9,h:29}])if(Math.hypot(pos.x-o.x,pos.z-o.z)<o.r&&pos.y<o.h){crash('object geraakt');return}
 for(let i=0;i<26;i++){let x=(i%2?-10:10)+Math.sin(i*4.1)*3,z=-44-Math.floor(i/2)*4;if(Math.hypot(pos.x-x,pos.z-z)<2.8&&pos.y<10){crash('boom geraakt');return}}
 for(let i=0;i<11;i++){let x=i%2?-45:47,z=39-Math.floor(i/2)*20;if(Math.abs(pos.x-x)<6&&Math.abs(pos.z-z)<5.5&&pos.y<9){crash('huis geraakt');return}}
 let r=rings[progress];if(r&&Math.hypot(pos.x-r.x,pos.y-r.y,pos.z-r.z)<3.5){progress++;score+=50;$('progress').textContent=progress+'/5 controlepunten';$('score').textContent='Score: '+score;$('target').textContent=progress===5?'Ga terug naar H':rings[progress].label;updateHud(progress===5?'Alle punten gehaald! Gebruik RTH en LANDEN.':'Goed! Punt '+progress+' gehaald. Volgende: '+(rings[progress]?.label||'H'));}
}
function render(t){let dt=Math.min(.045,(t-last)/1000||0);last=t;tick(dt);let dpr=Math.min(devicePixelRatio||1,1.6),w=Math.max(1,canvas.clientWidth*dpr|0),h=Math.max(1,canvas.clientHeight*dpr|0);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);let eye,target;let forward=[Math.sin(yaw),0,Math.cos(yaw)];if(mode===0){eye=[pos.x-forward[0]*12,pos.y+5,pos.z-forward[2]*12];target=[pos.x,pos.y+1.2,pos.z]}else if(mode===1){eye=[pos.x,pos.y+.3,pos.z];target=[pos.x+forward[0]*15,pos.y+.3,pos.z+forward[2]*15]}else if(mode===2){eye=[pos.x+Math.sin(camYaw)*14,pos.y+7+camPitch*7,pos.z+Math.cos(camYaw)*14];target=[pos.x,pos.y,pos.z]}else{eye=[pos.x,pos.y+25,pos.z+.001];target=[pos.x,pos.y,pos.z]}let vp=mul(perspective(Math.PI/3,w/h,.1,600),look(eye,target,mode===3?[0,0,-1]:[0,1,0]));gl.uniformMatrix4fv(uvp,false,new Float32Array(vp));makeWorld(t/1000);upload();$('heading').textContent='Koers '+((yaw*180/Math.PI%360+360)%360|0)+'°';$('alt').textContent='Hoogte '+pos.y.toFixed(1)+' m';$('battery').textContent='Accu '+Math.floor(battery)+'%';requestAnimationFrame(render)}
$('start').onclick=()=>{if(!done){air=true;pos.y=Math.max(2,pos.y);updateHud('Opgestegen. Vlieg naar de eerste ring.')}};$('land').onclick=()=>{if(air&&!done){landing=true;rth=false;mode=3;updateHud('Landing actief: camera recht naar beneden. Stuur naar H.')}};$('rth').onclick=()=>{if(air&&!done){rth=true;landing=false;keys.clear();updateHud('RTH actief: drone vliegt zichtbaar terug naar de H-mat.')}};$('restart').onclick=reset;$('turnMission').onclick=()=>{if(!done){turnPractice=true;air=true;pos.y=Math.max(pos.y,8);rth=false;landing=false;updateHud('Draaiend terugvliegen: houd ↑ en A of D tegelijk ingedrukt. Corrigeer zijwaarts met ←/→. RTH draait de neus automatisch richting H.')}};$('cam').onclick=()=>{mode=(mode+1)%4;$('cameraLabel').textContent=['Camera volgen','Camera FPV','Camera vrij','Camera 90° omlaag'][mode]};
addEventListener('keydown',e=>{if(['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys.add(e.key);e.preventDefault()}if('1234'.includes(e.key)&&e.key.length===1){mode=+e.key-1;$('cameraLabel').textContent=['Camera volgen','Camera FPV','Camera vrij','Camera 90° omlaag'][mode]}});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>keys.clear());document.querySelectorAll('[data-key]').forEach(b=>{let k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(k);b.classList.add('active')};for(let evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,()=>{keys.delete(k);b.classList.remove('active')})});let dragging=null;canvas.onpointerdown=e=>{dragging={x:e.clientX,y:e.clientY};mode=2;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!dragging)return;camYaw+=(e.clientX-dragging.x)*.008;camPitch=clamp(camPitch+(e.clientY-dragging.y)*.008,-.8,.8);dragging={x:e.clientX,y:e.clientY}};canvas.onpointerup=()=>dragging=null;
reset();requestAnimationFrame(render);
})();
