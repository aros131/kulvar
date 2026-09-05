"use client";
import { useEffect, useRef } from "react";

export default function TreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W: number, H: number;
    let MAX_DEPTH = 10;
    let GROWTH_SPEED_BASE = 0.006;
    const HOLD_DURATION = 400;
    const FADE_DURATION = 180;
    const WAIT_DURATION = 80;

    // Brand palette: deep indigo → muted purple → terracotta tips
    const PALETTE = [
      { r: 49,  g: 44,  b: 143 }, // indigo trunk
      { r: 74,  g: 69,  b: 128 }, // muted purple
      { r: 110, g: 105, b: 181 }, // light purple
      { r: 180, g: 100, b: 75  }, // transition
      { r: 218, g: 100, b: 56  }, // terracotta
      { r: 230, g: 140, b: 105 }, // soft terracotta tips
    ];

    let particleSprite: HTMLCanvasElement;
    function initParticleSprite() {
      particleSprite = document.createElement("canvas");
      particleSprite.width = 32; particleSprite.height = 32;
      const pctx = particleSprite.getContext("2d")!;
      const g = pctx.createRadialGradient(16,16,0,16,16,16);
      g.addColorStop(0,   "rgba(228,87,46,1)");
      g.addColorStop(0.3, "rgba(228,87,46,0.4)");
      g.addColorStop(1,   "rgba(228,87,46,0)");
      pctx.fillStyle = g; pctx.fillRect(0,0,32,32);
    }

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      initParticleSprite();
    }
    resize();
    window.addEventListener("resize", resize);

    const lerp  = (a:number,b:number,t:number) => a+(b-a)*t;
    const rand  = (lo:number,hi:number) => Math.random()*(hi-lo)+lo;
    const easeOut = (t:number) => 1-Math.pow(1-t,3);
    const smoothstep = (a:number,b:number,t:number) => { t=Math.max(0,Math.min(1,(t-a)/(b-a))); return t*t*(3-2*t); };

    function colorForDepth(depth:number, hueShift:number) {
      const t = depth/MAX_DEPTH;
      const idx = t*(PALETTE.length-1);
      const i0 = Math.floor(idx), i1 = Math.min(PALETTE.length-1,i0+1);
      const f = idx-i0;
      let r=lerp(PALETTE[i0].r,PALETTE[i1].r,f);
      let g=lerp(PALETTE[i0].g,PALETTE[i1].g,f);
      let b=lerp(PALETTE[i0].b,PALETTE[i1].b,f);
      const str = t*t*18;
      r+=hueShift*str*0.8; g+=hueShift*str*-0.4; b+=hueShift*str*-0.1;
      return {r,g,b};
    }

    // Particles
    const PARTICLE_COUNT = 45;
    let particles: any[] = [];
    function createParticle(full:boolean) {
      return {
        x:rand(W*0.15,W*0.85), y:full?rand(H*0.1,H*0.9):rand(H*0.5,H),
        vx:rand(-0.12,0.12), vy:rand(-0.35,-0.06),
        size:rand(0.6,2.2), alpha:rand(0.04,0.18),
        phase:rand(0,Math.PI*2), freq:rand(0.0004,0.0015),
        life:full?rand(0,1):0, lifeSpeed:rand(0.0006,0.0025),
      };
    }
    function initParticles() { particles=[]; for(let i=0;i<PARTICLE_COUNT;i++) particles.push(createParticle(true)); }
    function updateParticles(time:number) {
      for(let i=0;i<particles.length;i++) {
        const p=particles[i];
        p.x+=p.vx+Math.sin(time*p.freq+p.phase)*0.25; p.y+=p.vy; p.life+=p.lifeSpeed;
        if(p.life>1||p.y<-10||p.x<-10||p.x>W+10) particles[i]=createParticle(false);
      }
    }
    function drawParticles(alpha:number) {
      for(const p of particles) {
        const lf=p.life<0.15?p.life/0.15:p.life>0.8?(1-p.life)/0.2:1;
        const a=p.alpha*lf*alpha; if(a<0.004) continue;
        const s=p.size*3; ctx.globalAlpha=a;
        ctx.drawImage(particleSprite,p.x-s,p.y-s,s*2,s*2);
      }
      ctx.globalAlpha=1;
    }

    // Branches
    let allBranches: any[] = [];
    let treeAlpha=1, treeState="growing", holdTimer=0, fadeTimer=0, waitTimer=0;
    let mouseActive=false, windForce=0, shakeAmount=0;

    function getSwayAngle(branch:any,time:number) {
      let total=0, b=branch, depth=0;
      while(b) {
        const a=b.swayAmp;
        total+=Math.sin(time*0.0005+b.swayPhase)*a;
        total+=Math.sin(time*0.0003+b.swayPhase*1.7)*a*0.6;
        total+=Math.sin(time*0.00012+b.swayPhase*0.4)*a*0.35;
        depth++; b=b.parent;
      }
      if(mouseActive) total+=windForce*0.04*depth;
      if(shakeAmount>0.01) total+=Math.sin(time*0.015+branch.swayPhase*3)*shakeAmount*0.06*depth;
      return total;
    }
    function getBranchEnd(branch:any,progress:number,time:number) {
      const sway=getSwayAngle(branch,time), angle=branch.angle+sway, len=branch.length*progress;
      const pX=-Math.sin(angle), pY=Math.cos(angle), cOff=branch.curvature*len;
      return { x:branch.x0+Math.cos(angle)*len+pX*cOff, y:branch.y0+Math.sin(angle)*len+pY*cOff };
    }
    function recalcPositions(time:number) {
      for(const b of allBranches) if(b.parent) { const pe=getBranchEnd(b.parent,1,time); b.x0=pe.x; b.y0=pe.y; }
    }
    function spawnChildren(parent:any) {
      if(parent.depth>=MAX_DEPTH) return;
      let num=parent.depth<1?2+(Math.random()<0.35?1:0):parent.depth<3?2+(Math.random()<0.4?1:0):Math.random()<0.25?3:2;
      const prune=parent.depth<=3?0:parent.depth<=5?0.1:parent.depth<=7?0.22:0.35;
      if(Math.random()<prune) num=Math.max(1,num-1);
      const spread=parent.depth<2?rand(0.32,0.48):rand(0.38,0.6);
      for(let i=0;i<num;i++) {
        let ao=num===1?rand(-0.25,0.25):num===2?(i===0?-1:1)*rand(0.18,spread):(i-1)*spread+rand(-0.1,0.1);
        const ep=getBranchEnd(parent,1,0);
        const cd=parent.depth+1;
        const tipDots:any[]=[];
        if(cd>=MAX_DEPTH) { const c=Math.random()<0.4?2:1; for(let d=0;d<c;d++) tipDots.push({ox:rand(-2,2),oy:rand(-2,2),size:rand(0.8,1.6),alpha:rand(0.08,0.2)}); }
        const child={
          x0:ep.x, y0:ep.y, angle:parent.angle+ao,
          length:parent.length*rand(0.58,0.76), thickness:Math.max(0.4,parent.thickness*rand(0.48,0.67)),
          depth:cd, growthProgress:0, growthSpeed:GROWTH_SPEED_BASE*rand(1.0,1.5)*(1+parent.depth*0.1),
          children:[], spawned:false, swayPhase:rand(0,Math.PI*2), swayAmp:0.0018*(parent.depth+1)*rand(0.7,1.3),
          curvature:rand(-0.04,0.04)*(1+parent.depth*0.12), colorShift:rand(-12,12),
          hueShift:Math.max(-1,Math.min(1,parent.hueShift+rand(-0.35,0.35))),
          parent, strokeSeeds:[rand(-1,1),rand(-1,1),rand(-1,1),rand(-1,1),rand(-1,1)], tipDots,
        };
        parent.children.push(child); allBranches.push(child);
      }
    }
    function updateBranches(time:number) {
      let allDone=true;
      for(const b of allBranches) {
        if(b.growthProgress<1) { b.growthProgress=Math.min(1,b.growthProgress+b.growthSpeed); allDone=false; }
        if(b.growthProgress>=0.65&&!b.spawned) { b.spawned=true; spawnChildren(b); }
      }
      return allDone;
    }
    function drawBranch(b:any,time:number) {
      if(b.growthProgress<=0) return;
      const sway=getSwayAngle(b,time), angle=b.angle+sway;
      const progress=easeOut(b.growthProgress), len=b.length*progress;
      const x1=b.x0, y1=b.y0, pX=-Math.sin(angle), pY=Math.cos(angle), cOff=b.curvature*len*1.4;
      const cpx1=x1+Math.cos(angle)*len*0.33+pX*cOff*0.4, cpy1=y1+Math.sin(angle)*len*0.33+pY*cOff*0.4;
      const cpx2=x1+Math.cos(angle)*len*0.66+pX*cOff*0.85, cpy2=y1+Math.sin(angle)*len*0.66+pY*cOff*0.85;
      const x2=x1+Math.cos(angle)*len+pX*cOff*0.7, y2=y1+Math.sin(angle)*len+pY*cOff*0.7;
      const col=colorForDepth(b.depth,b.hueShift);
      const dT=b.depth/MAX_DEPTH;
      const baseAlpha=b.depth<=1?0.92:b.depth<=5?lerp(0.90,0.68,dT):lerp(0.68,0.32,(dT-0.5)*2);
      const sc=b.depth<3?5:b.depth<6?3:2;
      const tBase=b.thickness, tTaper=lerp(tBase,tBase*0.3,progress);
      for(let s=0;s<sc;s++) {
        const seed=b.strokeSeeds[s]||0, nS=sc>1?(s/(sc-1)-0.5):0;
        const oAmt=nS*tBase*0.35+seed*tBase*0.08, ox=pX*oAmt, oy=pY*oAmt;
        const shift=nS*22+b.colorShift*0.3;
        const r=Math.max(0,Math.min(255,col.r+shift)), g=Math.max(0,Math.min(255,col.g+shift*0.65)), bb=Math.max(0,Math.min(255,col.b+shift*0.4));
        const isCore=s===Math.floor(sc/2);
        const alpha=baseAlpha*(isCore?1.0:0.5), thick=tTaper*(isCore?1.0:lerp(0.65,0.45,Math.abs(nS)));
        ctx.beginPath(); ctx.moveTo(x1+ox,y1+oy);
        ctx.bezierCurveTo(cpx1+ox,cpy1+oy,cpx2+ox,cpy2+oy,x2+ox,y2+oy);
        ctx.strokeStyle=`rgba(${r|0},${g|0},${bb|0},${alpha})`; ctx.lineWidth=thick; ctx.lineCap="round"; ctx.stroke();
      }
      if(b.depth>=4&&b.depth<MAX_DEPTH-1&&b.growthProgress>0.8) {
        const gA=smoothstep(0.8,1.0,b.growthProgress)*0.05*(b.depth/MAX_DEPTH), gR=Math.max(4,tBase*2);
        const grd=ctx.createRadialGradient(x2,y2,0,x2,y2,gR);
        grd.addColorStop(0,`rgba(${Math.min(255,col.r+30)|0},${Math.min(255,col.g+20)|0},${Math.min(255,col.b+15)|0},${gA})`);
        grd.addColorStop(1,`rgba(${col.r|0},${col.g|0},${col.b|0},0)`);
        ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x2,y2,gR,0,Math.PI*2); ctx.fill();
      }
      if(b.tipDots.length>0&&b.growthProgress>0.92) {
        const tf=smoothstep(0.92,1.0,b.growthProgress);
        const tr=Math.min(255,col.r*1.3+30), tg2=Math.min(255,col.g*1.3+25), tb=Math.min(255,col.b*1.2+20);
        for(const dot of b.tipDots) {
          const dx=x2+dot.ox, dy=y2+dot.oy, da=tf*dot.alpha, ds=dot.size;
          const tg=ctx.createRadialGradient(dx,dy,0,dx,dy,ds*2);
          tg.addColorStop(0,`rgba(${tr|0},${tg2|0},${tb|0},${da*0.6})`);
          tg.addColorStop(1,`rgba(${col.r|0},${col.g|0},${col.b|0},0)`);
          ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(dx,dy,ds*2,0,Math.PI*2); ctx.fill();
        }
      }
    }

    function createTree() {
      allBranches=[];
      const tLen=H*rand(0.23,0.28), tThick=Math.max(8,W*0.015), tAngle=-Math.PI/2+rand(-0.05,0.05);
      const baseY=H+tThick*0.5;
      allBranches.push({
        x0:W/2+rand(-W*0.03,W*0.03), y0:baseY, angle:tAngle, length:tLen, thickness:tThick,
        depth:0, growthProgress:0, growthSpeed:GROWTH_SPEED_BASE*rand(0.9,1.1),
        children:[], spawned:false, swayPhase:rand(0,Math.PI*2), swayAmp:0.0008,
        curvature:rand(-0.015,0.015), colorShift:rand(-8,8), hueShift:0, parent:null,
        strokeSeeds:[rand(-1,1),rand(-1,1),rand(-1,1),rand(-1,1),rand(-1,1)], tipDots:[],
      });
      treeState="growing"; holdTimer=fadeTimer=waitTimer=0; treeAlpha=1;
      initParticles();
    }

    function drawScene(time:number) {
      ctx.clearRect(0,0,W,H);
      // bej background
      ctx.fillStyle="#F5EEDD"; ctx.fillRect(0,0,W,H);
      // canopy glow (indigo tint)
      if(treeAlpha>0.05) {
        const cx=W/2, cy=H*0.38;
        const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,H*0.42);
        cg.addColorStop(0,`rgba(49,44,143,${0.06*treeAlpha})`);
        cg.addColorStop(1,"rgba(245,238,221,0)");
        ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      }
      recalcPositions(time);
      ctx.save(); ctx.globalAlpha=treeAlpha;
      for(const b of allBranches) drawBranch(b,time);
      ctx.restore();
      updateParticles(time);
      ctx.save(); drawParticles(treeAlpha); ctx.restore();
      // subtle vignette
      const vg=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.78);
      vg.addColorStop(0,"rgba(245,238,221,0)"); vg.addColorStop(1,"rgba(232,228,210,0.25)");
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }

    let running=true;
    let raf: number;
    function frame(time:number) {
      if(shakeAmount>0.01) shakeAmount*=0.95; else shakeAmount=0;
      switch(treeState) {
        case "growing": { const done=updateBranches(time); drawScene(time); if(done){treeState="holding";holdTimer=0;} break; }
        case "holding": { drawScene(time); holdTimer++; if(holdTimer>=HOLD_DURATION){treeState="fading";fadeTimer=0;} break; }
        case "fading":  { fadeTimer++; treeAlpha=Math.max(0,1-fadeTimer/FADE_DURATION); drawScene(time); if(fadeTimer>=FADE_DURATION){treeState="waiting";waitTimer=0;} break; }
        case "waiting": { ctx.clearRect(0,0,W,H); ctx.fillStyle="#F5EEDD"; ctx.fillRect(0,0,W,H); waitTimer++; if(waitTimer>=WAIT_DURATION) createTree(); break; }
      }
      if(running) raf=requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange",()=>{ if(document.hidden){running=false;}else{if(!running){running=true;requestAnimationFrame(frame);}} });

    canvas.addEventListener("mousemove",(e)=>{ const r=canvas.getBoundingClientRect(); mouseActive=true; windForce=(e.clientX-r.left-W/2)/(W/2); });
    canvas.addEventListener("mouseleave",()=>{ mouseActive=false; windForce=0; });
    canvas.addEventListener("click",()=>{ shakeAmount=1.0; });

    createTree();
    raf=requestAnimationFrame(frame);

    return ()=>{ running=false; cancelAnimationFrame(raf); window.removeEventListener("resize",resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full -z-10 pointer-events-auto"
      aria-hidden="true"
    />
  );
}
