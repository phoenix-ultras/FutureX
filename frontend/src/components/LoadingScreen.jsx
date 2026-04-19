import React, { useEffect, useRef, useState } from 'react';

function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('INITIALIZING NEURAL MATRIX...');
  const [statsShown, setStatsShown] = useState(false);
  const [metrics, setMetrics] = useState({ markets: '—', traders: '—', btc: '—', live: '—' });
  const [isExiting, setIsExiting] = useState(false);
  const [glitchLines, setGlitchLines] = useState([]);

  useEffect(() => {
    // Canvas Background
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.6 + 0.1,
        color: Math.random() > 0.5 ? '0,245,255' : '139,92,246'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,245,255,0.025)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.a})`; ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.forEach((b, j) => {
          if (i >= j) return;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 100) {
            ctx.strokeStyle = `rgba(0,245,255,${(1 - d / 100) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    // Glitch lines interval
    const glitchInt = setInterval(() => {
      const newLine = {
        id: Date.now(),
        top: Math.random() * 100,
        height: Math.random() * 2 + 0.5,
        opacity1: Math.random() * 0.3 + 0.05,
        opacity2: Math.random() * 0.2,
        dur: Math.random() * 0.8 + 0.2
      };
      setGlitchLines(prev => [...prev, newLine]);
      setTimeout(() => {
        setGlitchLines(prev => prev.filter(l => l.id !== newLine.id));
      }, 1000);
    }, 180);

    return () => clearInterval(glitchInt);
  }, []);

  useEffect(() => {
    // Progress logic
    const messages = [
      { pct: 5, msg: 'INITIALIZING NEURAL MATRIX...' },
      { pct: 18, msg: 'SYNCING CRYPTO PRICE FEEDS...' },
      { pct: 32, msg: 'CALIBRATING ODDS ENGINE...' },
      { pct: 48, msg: 'LOADING FRAUD DETECTION AI...' },
      { pct: 61, msg: 'ESTABLISHING LIVE CONNECTIONS...' },
      { pct: 74, msg: 'VERIFYING ADMIN CREDENTIALS...' },
      { pct: 86, msg: 'DEPLOYING FRAUD SHIELD...' },
      { pct: 95, msg: 'LAUNCHING COMMAND TERMINAL...' },
      { pct: 100, msg: 'SYSTEM READY. WELCOME, TRADER.' }
    ];

    let currentProgress = 0;
    let msgIdx = 0;
    let localStatsShown = false;

    const countUp = (key, target, suffix = '', decimals = 0) => {
      let cur = 0;
      const steps = 40;
      const inc = target / steps;
      const iv = setInterval(() => {
        cur += inc;
        if (cur >= target) {
          cur = target;
          clearInterval(iv);
        }
        setMetrics(prev => ({ ...prev, [key]: (decimals ? cur.toFixed(decimals) : Math.floor(cur)) + suffix }));
      }, 30);
    };

    const tick = () => {
      currentProgress = Math.min(100, currentProgress + (Math.random() * 2.5 + 0.5));
      setProgress(currentProgress);

      while (msgIdx < messages.length && currentProgress >= messages[msgIdx].pct) {
        setMsg(messages[msgIdx].msg);
        msgIdx++;
      }

      if (currentProgress >= 50 && !localStatsShown) {
        localStatsShown = true;
        setStatsShown(true);
        countUp('markets', 18, ' active', 0);
        setTimeout(() => countUp('traders', 2847, '+', 0), 200);
        setTimeout(() => countUp('btc', 94820, '', 0), 400);
        setTimeout(() => countUp('live', 9, ' live', 0), 600);
      }

      if (currentProgress < 100) {
        setTimeout(tick, Math.random() * 60 + 20);
      } else {
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 900);
        }, 900);
      }
    };

    setTimeout(tick, 300);
  }, [onComplete]);

  return (
    <div id="loading-screen" className={isExiting ? 'load-exit' : ''}>
      <canvas id="load-canvas" ref={canvasRef}></canvas>
      <div className="load-vignette"></div>
      <div className="glitch-lines">
        {glitchLines.map(l => (
          <div
            key={l.id}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${l.top}%`,
              height: `${l.height}px`,
              background: `linear-gradient(90deg, transparent, rgba(0,245,255,${l.opacity1}), rgba(139,92,246,${l.opacity2}), transparent)`,
              animation: `glitchLine ${l.dur}s linear forwards`,
              pointerEvents: 'none'
            }}
          ></div>
        ))}
      </div>
      <div className="load-center">
        <div className="holo-rig">
          <div className="holo-ring ring-1"></div>
          <div className="holo-ring ring-2"></div>
          <div className="holo-ring ring-3"></div>
          <div className="holo-ring ring-4"></div>
          <div className="holo-core">
            <div className="holo-core-inner"></div>
            <div className="core-pulse"></div>
          </div>
          <div className="orbit-node node-a"></div>
          <div className="orbit-node node-b"></div>
          <div className="orbit-node node-c"></div>
        </div>
        <div className="load-logo">
          <div className="load-logo-text">
            <span className="lt">P</span>
            <span className="lt">R</span>
            <span className="lt">E</span>
            <span className="lt">D</span>
            <span className="lt">I</span>
            <span className="lt">C</span>
            <span className="lt">T</span>
            <span className="lt lt-gap">X</span>
          </div>
          <div className="load-tagline">SOCIAL TRADING ON FUTURE · NIT JAMSHEDPUR</div>
        </div>
        <div className="load-status">
          <div className="load-bar-wrap">
            <div className="load-bar" style={{ width: `${progress}%` }}></div>
            <div className="load-bar-glow" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="load-msg" key={msg} style={{ animation: 'msgFlash 0.4s ease' }}>{msg}</div>
          <div className="load-pct">{Math.floor(progress)}%</div>
        </div>
        <div className="load-tickers">
          <div className="ltick"><span className="ltick-label">MARKETS</span><span className="ltick-val">{metrics.markets}</span></div>
          <div className="ltick"><span className="ltick-label">TRADERS</span><span className="ltick-val">{metrics.traders}</span></div>
          <div className="ltick"><span className="ltick-label">BTC</span><span className="ltick-val">{metrics.btc}</span></div>
          <div className="ltick"><span className="ltick-label">LIVE NOW</span><span className="ltick-val">{metrics.live}</span></div>
        </div>
      </div>
      <div className="corner-deco top-left"></div>
      <div className="corner-deco top-right"></div>
      <div className="corner-deco bot-left"></div>
      <div className="corner-deco bot-right"></div>
      <div className="scan-line" style={{ animation: 'scanAnim 4s linear infinite' }}></div>
      <style>{`
        @keyframes scanAnim {
          from { top: 0%; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
