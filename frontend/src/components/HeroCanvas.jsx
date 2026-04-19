import React, { useEffect, useRef } from 'react';

function HeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let heroAngle = 0;
    let animationFrameId;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(8,13,26,0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,245,255,0.15)';
      ctx.lineWidth = 1;
      const cy = canvas.height / 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 10) {
        const y = cy + Math.sin(x * 0.02 + heroAngle) * 20 + Math.cos(x * 0.01 - heroAngle * 1.5) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      heroAngle += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} id="hero-canvas" style={{ position: 'absolute', inset: 0, borderRadius: '18px' }}></canvas>;
}

export default HeroCanvas;
