import { useEffect, useMemo, useState } from 'react';
import StatsCard from '../components/StatsCard';
import BuyCoinsModal from '../components/BuyCoinsModal';
import { useAuth } from '../context/AuthContext';
import { getMarkets, getUserStats, getUserTrades, getWallet } from '../lib/api';
import { formatClosingTime, formatCoins, formatPercentage } from '../lib/marketUtils';
import { buildUserStats } from '../lib/statHelpers';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, BarElement, Filler, RadarController } from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, BarElement, Filler, RadarController);

function Profile() {
  const { user, withAccessToken, clearSession } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [trades, setTrades] = useState([]);
  const [statsResponse, setStatsResponse] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const fetchWallet = async () => {
    try {
      const walletData = await withAccessToken((token) => getWallet(token));
      if (walletData) setWallet(walletData);
    } catch (err) {
      console.error('Failed to refresh wallet', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError('');

      try {
        const [walletData, tradeData, marketData, statsData] = await Promise.all([
          withAccessToken((token) => getWallet(token)).catch((err) => { console.error('Profile: Wallet fetch failed', err); return null; }),
          withAccessToken((token) => getUserTrades(user.id, token)).catch((err) => { console.error('Profile: Trades fetch failed', err); return { data: [] }; }),
          getMarkets({ sort: 'latest' }).catch((err) => { console.error('Profile: Markets fetch failed', err); return { data: [] }; }),
          withAccessToken((token) => getUserStats(user.id, token)).catch((err) => { console.error('Profile: Stats fetch failed', err); return null; })
        ]);

        console.log('[DEBUG] Profile API Fetched:', { walletData, tradeData, marketData, statsData });

        if (!isMounted) {
          return;
        }

        setWallet(walletData);
        setTrades(tradeData.data || []);
        setMarkets(marketData.data || []);
        setStatsResponse(statsData?.data || statsData || null);
      } catch (loadError) {
        if (loadError.status === 401) {
          clearSession();
          return;
        }

        if (isMounted) {
          setError(loadError.data?.message || 'Unable to load profile.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (user?.id) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [clearSession, user?.id, withAccessToken]);

  const derivedStats = useMemo(() => buildUserStats(trades, markets), [trades, markets]);
  const stats = statsResponse
    ? {
        ...derivedStats,
        ...statsResponse
      }
    : derivedStats;

  const settledMarkets = useMemo(() => {
    const marketMap = new Map(markets.map((market) => [String(market.id), market]));
    return trades
      .map((trade) => ({
        ...trade,
        market: marketMap.get(String(trade.marketId))
      }))
      .filter((trade) => trade.market)
      .slice(0, 8);
  }, [markets, trades]);

  const lineData = useMemo(() => {
    let b = 1000;
    const labs = ['Start'];
    const vals = [b];
    
    const recentTrades = [...trades].reverse().slice(0, 10).reverse();
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
      vals.push(wallet.balance || wallet.availableBalance);
    }
    
    return {
      labels: labs,
      datasets: [{
        data: vals,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#8b5cf6'
      }]
    };
  }, [trades, wallet]);

  const barData = useMemo(() => {
    return {
      labels: ['Wins', 'Losses', 'Pending'],
      datasets: [{
        data: [stats.wins, stats.losses, stats.openTrades],
        backgroundColor: ['rgba(0,255,136,.5)', 'rgba(255,51,102,.5)', 'rgba(139,92,246,.5)'],
        borderColor: ['#00ff88', '#ff3366', '#8b5cf6'],
        borderWidth: 1,
        borderRadius: 6
      }]
    };
  }, [stats]);

  const radarData = useMemo(() => {
    return {
      labels: ['Win Rate', 'Volume', 'Profit', 'Streak', 'Activity'],
      datasets: [{
        data: [
          Math.round(stats.winRate),
          Math.min(100, Math.round(stats.totalVolume / 100)),
          Math.min(100, Math.max(0, stats.realizedPnl) / 20),
          Math.min(100, (stats.longestWinStreak || 0) * 15),
          Math.min(100, trades.length * 5)
        ],
        backgroundColor: 'rgba(0,245,255,.08)',
        borderColor: 'rgba(0,245,255,.6)',
        borderWidth: 2,
        pointBackgroundColor: '#00f5ff',
        pointRadius: 4
      }]
    };
  }, [stats, trades.length]);

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
  const lineOptions = { ...chartOptions, scales: { x: { ticks: { color: '#4a6080' }, grid: { color: 'rgba(255,255,255,.03)' } }, y: { ticks: { color: '#4a6080' }, grid: { color: 'rgba(255,255,255,.03)' } } } };
  const barOptions = { ...chartOptions, scales: { x: { ticks: { color: '#4a6080' }, grid: { display: false } }, y: { ticks: { color: '#4a6080' }, grid: { color: 'rgba(255,255,255,.03)' } } } };
  const radarOptions = { ...chartOptions, scales: { r: { ticks: { display: false, stepSize: 25 }, grid: { color: 'rgba(255,255,255,.06)' }, angleLines: { color: 'rgba(255,255,255,.06)' }, pointLabels: { color: '#4a6080', font: { size: 11 } } } } };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">WALLET & PROFILE</h1>
          <div className="page-sub">Performance cockpit for {user?.name || user?.username}</div>
        </div>
      </div>

      {error && <div className="form-error mb-4">{error}</div>}

      <BuyCoinsModal 
        isOpen={isBuyModalOpen} 
        onClose={() => setIsBuyModalOpen(false)} 
        onSuccess={fetchWallet} 
      />

      {!isLoading && (
        <>
          <div className="stats-row">
            <div className="scard cyan relative group">
              <div className="scard-glow"></div>
              <div className="flex justify-between items-start">
                <div className="scard-label">WALLET BALANCE</div>
                <button 
                  onClick={() => setIsBuyModalOpen(true)}
                  className="bg-neon-green/20 hover:bg-neon-green/40 text-neon-green p-1.5 rounded-lg transition-colors border border-neon-green/30 text-xs font-bold flex items-center gap-1"
                >
                  <span>+</span> BUY
                </button>
              </div>
              <div className="scard-val mt-2">{formatCoins(wallet?.balance || 0)}</div>
            </div>
            <div className="scard purple">
              <div className="scard-glow"></div>
              <div className="scard-label">LOCKED FUNDS</div>
              <div className="scard-val">{formatCoins(wallet?.lockedBalance || 0)}</div>
            </div>
            <div className="scard green">
              <div className="scard-glow"></div>
              <div className="scard-label">WIN RATE</div>
              <div className="scard-val">{formatPercentage(stats.winRate || 0)}</div>
            </div>
            <div className="scard pink">
              <div className="scard-glow"></div>
              <div className="scard-label">CURRENT STREAK</div>
              <div className="scard-val">{stats.currentStreak || 0}</div>
            </div>
          </div>

          <div className="g2" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="gcard">
              <div className="section-hdr"><div className="section-title">BALANCE CURVE</div></div>
              <div className="chart-wrap" style={{ position: 'relative', height: '220px' }}>
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
            <div className="gcard">
              <div className="section-hdr"><div className="section-title">WIN/LOSS RATIO</div></div>
              <div className="chart-wrap" style={{ position: 'relative', height: '220px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          <div className="gcard" style={{ marginBottom: '1.5rem' }}>
            <div className="section-hdr"><div className="section-title">PERFORMANCE RADAR</div></div>
            <div className="chart-wrap" style={{ position: 'relative', height: '300px' }}>
               <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="dash-grid">
            <div className="gcard">
              <div className="section-hdr">
                <div className="section-title">📊 SIGNAL QUALITY</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="prof-row"><span className="prof-key">Wins</span> <span className="prof-val">{stats.wins}</span></div>
                <div className="prof-row"><span className="prof-key">Losses</span> <span className="prof-val">{stats.losses}</span></div>
                <div className="prof-row"><span className="prof-key">Open Trades</span> <span className="prof-val">{stats.openTrades}</span></div>
                <div className="prof-row"><span className="prof-key">Total Volume</span> <span className="prof-val" style={{color: 'var(--cyan)'}}>{formatCoins(stats.totalVolume)}</span></div>
                <div className="prof-row"><span className="prof-key">Realized PnL</span> <span className="prof-val" style={{color: stats.realizedPnl >= 0 ? 'var(--green)' : 'var(--red)'}}>{formatCoins(stats.realizedPnl)}</span></div>
                <div className="prof-row"><span className="prof-key">Longest Streak</span> <span className="prof-val">{stats.longestWinStreak}</span></div>
              </div>
            </div>

            <div className="gcard">
              <div className="section-hdr">
                <div className="section-title">⚡ RECENT EXECUTIONS</div>
              </div>
              
              <div className="trade-list">
                {settledMarkets.length ? settledMarkets.map((trade) => {
                  const isSettled = trade.market?.status?.toLowerCase() === 'settled';
                  const isClosed = trade.market?.status?.toLowerCase() === 'closed';
                  const isWin = isSettled && trade.side === trade.market?.result;
                  const iconCls = isWin ? 'win' : isSettled ? 'loss' : 'pending';
                  const iconChar = isWin ? '📈' : isSettled ? '📉' : '⏳';
                  const textCls = isWin ? 'win' : isSettled ? 'loss' : 'pending';
                  const amtSign = isWin ? '+' : isSettled ? '-' : '';

                  return (
                    <div className="trow" key={trade.id}>
                      <div className={`trow-icon ${iconCls}`}>{iconChar}</div>
                      <div className="trow-info">
                        <div className="trow-market" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {trade.market?.title || `Market #${trade.marketId}`}
                        </div>
                        <div className="trow-meta">
                          {trade.side} | Odds {Number(trade.oddsAtTrade).toFixed(2)}x | {isWin ? 'WIN' : isSettled ? 'LOSS' : isClosed ? 'WAITING' : 'ACTIVE'}
                        </div>
                      </div>
                      <div className={`trow-amt ${textCls}`}>
                        {amtSign}{formatCoins(trade.amount)}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="empty">
                    <div className="empty-txt">No trades found.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
