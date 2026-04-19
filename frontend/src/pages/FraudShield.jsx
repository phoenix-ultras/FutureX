import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function FraudShield() {
  const radarData = {
    labels: ['Sybil Resistance', 'Volume Legitimacy', 'IP Uniqueness', 'Time Variance', 'Wallet Age'],
    datasets: [{
      label: 'Platform Security Score',
      data: [98, 85, 92, 78, 88],
      backgroundColor: 'rgba(0, 255, 136, 0.2)',
      borderColor: '#00ff88',
      pointBackgroundColor: '#00f5ff',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#00ff88'
    }]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#4a6080', font: { family: "'Share Tech Mono', monospace", size: 10 } },
        ticks: { display: false, min: 0, max: 100 }
      }
    },
    plugins: { legend: { display: false } }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">FRAUD SHIELD AI</h1>
          <div className="page-sub">Real-time platform security and sybil detection matrix</div>
        </div>
        <div className="live-pulse">
          <span className="pulse-dot"></span> NEURAL NET ONLINE
        </div>
      </div>

      <div className="dash-grid">
        <div className="gcard">
          <div className="section-hdr">
            <div className="section-title">YOUR TRUST SCORE</div>
          </div>
          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
            <div className="trust-ring">94</div>
            <div style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              High trust. No withdrawal limits.<br/>
              <span style={{ color: 'var(--green)' }}>Account verified by neural consensus.</span>
            </div>
          </div>
        </div>
        <div className="gcard">
          <div className="section-hdr">
            <div className="section-title">SECURITY RADAR</div>
          </div>
          <div className="chart-wrap" style={{ height: '260px' }}>
             <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ marginTop: '2rem' }}>
        <div className="gcard">
          <div className="section-hdr">
            <div className="section-title">PLATFORM FRAUD LOG</div>
            <span className="live-tag">LIVE</span>
          </div>
          <div>
            <div className="shield-alert">
              <div>
                <div className="alert-title">SYBIL ATTACK BLOCKED</div>
                <div className="alert-time">Attempted wash trading on "Solana $200" market.</div>
              </div>
              <div style={{ color: 'var(--red)' }}>12 mins ago</div>
            </div>
            <div className="shield-alert" style={{ background: 'rgba(0, 245, 255, 0.05)', borderLeftColor: 'var(--cyan)' }}>
              <div>
                <div className="alert-title" style={{ color: 'var(--cyan)' }}>ROUTINE PURGE</div>
                <div className="alert-time">Cleared 42 inactive bot accounts.</div>
              </div>
              <div style={{ color: 'var(--muted)' }}>1 hr ago</div>
            </div>
            <div className="shield-alert" style={{ background: 'rgba(0, 245, 255, 0.05)', borderLeftColor: 'var(--cyan)' }}>
              <div>
                <div className="alert-title" style={{ color: 'var(--cyan)' }}>IP ANOMALY DETECTED</div>
                <div className="alert-time">14 accounts created from same subnet. Flagged for review.</div>
              </div>
              <div style={{ color: 'var(--muted)' }}>3 hrs ago</div>
            </div>
          </div>
        </div>
        <div className="gcard">
          <div className="section-hdr">
            <div className="section-title">PROTECTION FEATURES</div>
          </div>
          <div className="protection-list">
            <div className="prot-item">
              <div className="prot-icon">🧠</div>
              <div className="prot-text">
                <h4>AI BEHAVIOR MODEL</h4>
                <p>Detects non-human trading patterns.</p>
              </div>
            </div>
            <div className="prot-item">
              <div className="prot-icon">🔗</div>
              <div className="prot-text">
                <h4>WALLET GRAPHING</h4>
                <p>Maps fund flows between connected accounts.</p>
              </div>
            </div>
            <div className="prot-item">
              <div className="prot-icon">⏱️</div>
              <div className="prot-text">
                <h4>VELOCITY LIMITS</h4>
                <p>Caps trade volume during volatile swings.</p>
              </div>
            </div>
            <div className="prot-item">
              <div className="prot-icon">🛡️</div>
              <div className="prot-text">
                <h4>AUTO-FREEZE</h4>
                <p>Instantly locks compromised wallets.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FraudShield;
