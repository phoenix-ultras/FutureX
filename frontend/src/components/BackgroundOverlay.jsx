import React, { useEffect, useRef } from 'react';

function BackgroundOverlay() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let pts = [];

    const initBG = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      pts = [];
      for (let i = 0; i < 120; i++) {
        pts.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.3,
          a: Math.random()
        });
      }
    };

    const drawBG = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // grid
      ctx.strokeStyle = 'rgba(0,245,255,0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.a * 0.4})`;
        ctx.fill();
      });
      
      // connections
      pts.forEach((a, i) => {
        pts.forEach((b, j) => {
          if (i >= j) return;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(139,92,246,${(1 - d / 120) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });
      
      animationFrameId = requestAnimationFrame(drawBG);
    };

    initBG();
    drawBG();

    window.addEventListener('resize', initBG);
    return () => {
      window.removeEventListener('resize', initBG);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="bg-canvas"></canvas>
      <div className="scanlines"></div>
      <div className="vignette"></div>
    </>
  );
}

export default BackgroundOverlay;
