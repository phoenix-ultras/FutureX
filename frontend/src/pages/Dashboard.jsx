import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketCard from '../components/MarketCard';
import HeroCanvas from '../components/HeroCanvas';
import HexGrid from '../components/HexGrid';
import { useAuth } from '../context/AuthContext';
import { getMarkets, getUserTrades, getWallet, getMySquads } from '../lib/api';
import { formatCoins } from '../lib/marketUtils';
import { buildUserStats } from '../lib/statHelpers';
import { connectMarketSocket } from '../lib/socket';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

function Dashboard() {
  const { user, withAccessToken, clearSession } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [trades, setTrades] = useState([]);
  const [mySquad, setMySquad] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      setIsLoading(true);
      setError('');
      try {
        const [walletData, marketData, tradeData, squadData] = await Promise.all([
          withAccessToken((token) => getWallet(token)).catch(() => null),
          getMarkets({ sort: 'latest' }).catch(() => ({ data: [] })),
          withAccessToken((token) => getUserTrades(user.id, token)).catch(() => ({ data: [] })),
          withAccessToken((token) => getMySquads(token)).catch(() => ({ squads: [] }))
        ]);

        if (!isMounted) return;
        setWallet(walletData);
        setMarkets(marketData.data || []);
        setTrades(tradeData.data || []);
        setMySquad(squadData.squads?.[0] || null);
      } catch (err) {
        if (err.status === 401) {
          clearSession();
          return;
        }
        if (isMounted) setError('Unable to load dashboard.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (user?.id) loadDashboard();

    const socket = connectMarketSocket();
    socket.on('market:update', (data) => {
      setMarkets((prev) => prev.map((m) => String(m.id) === String(data.marketId) ? { ...m, ...data.market } : m));
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [clearSession, user?.id, withAccessToken]);

  const stats = useMemo(() => buildUserStats(trades, markets), [trades, markets]);
  const trendingMarkets = useMemo(() => 
    [...markets].sort((a, b) => (b.yesPool + b.noPool) - (a.yesPool + a.noPool)).slice(0, 4),
  [markets]);

  const lineData = useMemo(() => {
    let b = 1000;
    const labs = ['Start'];
    const vals = [b];
    
    const recentTrades = [...trades].reverse().slice(0, 8).reverse();
    recentTrades.forEach((t, i) => {
      let pnl = 0;
      if (t.status === 'WIN') pnl = (t.payout || 0) - (t.amount || 0);
      else if (t.status === 'LOSS') pnl = -(t.amount || 0);
      
      b += pnl;
      labs.push('T' + (i + 1));
      vals.push(Math.max(0, b));
    });
    
    if (vals.length === 1 && wallet) {
      labs.push('Now');
      vals.push(wallet.availableBalance);
    }
    
    return {
      labels: labs,
      datasets: [{
        data: vals,
        borderColor: '#00f5ff',
        backgroundColor: 'rgba(0,245,255,.07)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#00f5ff',
        pointBorderColor: 'rgba(0,245,255,.3)',
        pointBorderWidth: 2
      }]
    };
  }, [trades, wallet]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#4a6080', font: { size: 10, family: "'Share Tech Mono', monospace" } }, grid: { color: 'rgba(255,255,255,.03)' } },
      y: { ticks: { color: '#4a6080', font: { size: 10, family: "'Share Tech Mono', monospace" } }, grid: { color: 'rgba(255,255,255,.03)' } }
    }
  };

  const mixData = useMemo(() => {
    const cats = {};
    markets.forEach(m => {
       const cat = m.category || 'Other';
       cats[cat] = (cats[cat] || 0) + 1;
    });
    const labels = Object.keys(cats);
    const data = labels.map(k => cats[k]);
    
    return {
      labels: labels.length ? labels : ['None'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: ['rgba(0,255,136,.7)', 'rgba(139,92,246,.7)', 'rgba(0,245,255,.7)', 'rgba(255,107,53,.7)', 'rgba(255,215,0,.7)'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  }, [markets]);

  const mixOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#4a6080', font: { size: 11, family: "'Rajdhani', sans-serif" }, padding: 10 }, position: 'right' }
    },
    cutout: '60%'
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">DASHBOARD</h1>
          <div className="page-sub">Overview of your Future portfolio</div>
        </div>
      </div>

      {error && <div className="form-error mb-4">{error}</div>}

      <div className="hero-3d">
        <HeroCanvas />
        <HexGrid />
        <div className="hero-overlay">
          <div className="hero-greeting" style={{ textTransform: 'uppercase' }}>WELCOME BACK, {user?.name || user?.username || 'TRADER'}</div>
          <div className="hero-sub">The future of social trading on Future</div>
        </div>
      </div>

      <div className="stats-row">
        <div className="scard cyan">
          <div className="scard-glow"></div>
          <div className="scard-label">WALLET BALANCE</div>
          <div className="scard-val">{wallet ? formatCoins(wallet.availableBalance) : '...'}</div>
          <div className="scard-sub">Available coins</div>
        </div>
        <div className="scard purple">
          <div className="scard-glow"></div>
          <div className="scard-label">OPEN TRADES</div>
          <div className="scard-val">{stats.openTrades}</div>
          <div className="scard-sub">Active positions</div>
        </div>
        <div className="scard green">
          <div className="scard-glow"></div>
          <div className="scard-label">WIN RATE</div>
          <div className="scard-val">{stats.winRate.toFixed(1)}%</div>
          <div className="scard-sub">All-time</div>
        </div>
        <div className="scard gold">
          <div className="scard-glow"></div>
          <div className="scard-label">REALIZED P&L</div>
          <div className="scard-val">{formatCoins(stats.realizedPnl)}</div>
          <div className="scard-sub">Total profit/loss</div>
        </div>
      </div>

      <div className="dash-grid-3">
        <div className="gcard">
          <div className="section-hdr"><div className="section-title">WALLET GROWTH</div><span className="live-tag">LIVE</span></div>
          <div className="chart-wrap" style={{ position: 'relative', height: '220px' }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
        <div className="gcard">
          <div className="section-hdr"><div className="section-title">MARKET MIX</div></div>
          <div className="chart-wrap" style={{ position: 'relative', height: '220px' }}>
            <Doughnut data={mixData} options={mixOptions} />
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ marginBottom: '2rem' }}>
        <div className="gcard" style={{ flex: 1 }}>
          <div className="section-hdr">
            <div className="section-title">🛡️ MY SQUAD</div>
          </div>
          {mySquad ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>{mySquad.name}</div>
              <div style={{ color: 'var(--muted)' }}>{mySquad.description || 'No description'}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div><span style={{color: 'var(--muted)'}}>Role:</span> {mySquad.role.toUpperCase()}</div>
                <div><span style={{color: 'var(--muted)'}}>Members:</span> {mySquad.member_count}</div>
              </div>
              <Link to={`/squads/${mySquad.id}`}><button className="btn-neon" style={{ padding: '0.5rem', marginTop: '1rem' }}>GO TO SQUAD</button></Link>
            </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem' }}>
               <div style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Not in a squad yet?</div>
               <div style={{ color: 'var(--muted)' }}>Join a squad to pool resources, compete with other groups, and climb the leaderboard!</div>
               <Link to="/squads"><button className="btn-neon">BROWSE SQUADS</button></Link>
             </div>
          )}
        </div>
        
        <div className="gcard" style={{ flex: 1 }}>
          <div className="section-hdr">
            <div className="section-title">⚡ QUICK STATS</div>
          </div>
          <div className="profile-list">
            <div><span>Total Volume</span><strong>{formatCoins(stats.totalVolume)}</strong></div>
            <div><span>Total Trades</span><strong>{trades.length}</strong></div>
            <div><span>Longest Streak</span><strong>{stats.longestWinStreak}</strong></div>
          </div>
        </div>
      </div>

      <div className="gcard">
        <div className="section-hdr">
          <div className="section-title">🔥 TRENDING MARKETS</div>
          <Link to="/markets"><button className="see-all">See All Markets →</button></Link>
        </div>
        <div className="markets-grid">
          {isLoading && <div className="empty-panel">Loading markets...</div>}
          {!isLoading && trendingMarkets.length === 0 && <div className="empty-panel">No markets available.</div>}
          {trendingMarkets.map(market => (
             <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
