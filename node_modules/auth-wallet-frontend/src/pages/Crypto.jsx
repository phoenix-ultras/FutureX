import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

const MOCK_CRYPTO = [
  { sym: 'BTC', name: 'Bitcoin', price: 94820.50, change: '+2.4%' },
  { sym: 'ETH', name: 'Ethereum', price: 3412.80, change: '+1.8%' },
  { sym: 'SOL', name: 'Solana', price: 142.60, change: '-0.5%' },
  { sym: 'AVAX', name: 'Avalanche', price: 34.20, change: '+5.2%' },
  { sym: 'XRP', name: 'Ripple', price: 0.58, change: '-1.2%' },
  { sym: 'DOGE', name: 'Dogecoin', price: 0.12, change: '+12.4%' }
];

function Crypto() {
  const [cryptoData, setCryptoData] = useState(MOCK_CRYPTO);

  useEffect(() => {
    // Simulate live crypto prices
    const iv = setInterval(() => {
      setCryptoData(prev => prev.map(c => {
        const fluctuate = c.price * (Math.random() * 0.002 - 0.001);
        return { ...c, price: c.price + fluctuate };
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const btcChartData = {
    labels: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', 'Now'],
    datasets: [{
      label: 'BTC Price',
      data: [92000, 91500, 93000, 92800, 94000, 93500, 94500, 94820],
      borderColor: '#ffd700',
      backgroundColor: 'rgba(255,215,0,0.05)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0
    }]
  };

  const btcChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">CRYPTO MARKETS</h1>
          <div className="page-sub">Live price feeds for Future correlation</div>
        </div>
        <div className="live-pulse">
          <span className="pulse-dot"></span> LIVE DATA
        </div>
      </div>

      <div className="crypto-grid">
        {cryptoData.map((coin, idx) => {
          const isUp = coin.change.startsWith('+');
          return (
            <div key={idx} className="crypto-card">
              <div className="c-head">
                <div className="c-sym">{coin.sym}</div>
                <div className="c-name">{coin.name}</div>
              </div>
              <div className={`c-price ${isUp ? 'up' : 'down'}`}>
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`c-change ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {coin.change} (24h)
              </div>
            </div>
          );
        })}
      </div>

      <div className="gcard">
        <div className="section-hdr">
          <div className="section-title">BTC/USD REAL-TIME CHART</div>
        </div>
        <div className="chart-wrap" style={{ height: '300px' }}>
          <Line data={btcChartData} options={btcChartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Crypto;
