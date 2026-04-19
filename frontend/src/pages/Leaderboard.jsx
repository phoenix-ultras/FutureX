import { useEffect, useMemo, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getMarkets, getUserTrades } from '../lib/api';
import { buildUserStats } from '../lib/statHelpers';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, BarElement, Filler, RadarController } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, BarElement, Filler, RadarController);

function Leaderboard() {
  const { user, withAccessToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      setIsLoading(true);

      try {
        const response = await getLeaderboard();
        if (isMounted) {
          console.log('[DEBUG] Leaderboard API Fetched:', response.data || response.leaderboard);
          setEntries(response.data || response.leaderboard || []);
          setNotice('');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error.status === 404 && user?.id) {
          const [tradeData, marketData] = await Promise.all([
            withAccessToken((token) => getUserTrades(user.id, token)).catch(() => ({ data: [] })),
            getMarkets({ sort: 'latest' }).catch(() => ({ data: [] }))
          ]);

          const stats = buildUserStats(tradeData.data || [], marketData.data || []);
          setEntries([
            {
              rank: 1,
              userId: user.id,
              username: user.name || user.username,
              earnings: stats.realizedPnl,
              winRate: stats.winRate,
              settledTrades: stats.settledTrades
            }
          ]);
          setNotice('Backend leaderboard endpoint is unavailable in this workspace, so this page is showing your local performance snapshot.');
        } else {
          setNotice(error.data?.message || 'Unable to load leaderboard.');
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.name, user?.username, withAccessToken]);

  const summary = useMemo(() => {
    const topEntry = entries[0];

    return {
      topTrader: topEntry?.username || '--',
      bestWinRate: topEntry?.winRate || 0,
      totalTracked: entries.length
    };
  }, [entries]);

  const topEarnerData = useMemo(() => {
    const top5 = entries.slice(0, 5);
    return {
      labels: top5.map((e) => e.username),
      datasets: [{
        label: 'Earnings',
        data: top5.map((e) => e.earnings),
        backgroundColor: ['rgba(255,215,0,.7)', 'rgba(192,192,192,.7)', 'rgba(205,127,50,.7)', 'rgba(0,245,255,.5)', 'rgba(139,92,246,.5)'],
        borderWidth: 0,
        borderRadius: 4
      }]
    };
  }, [entries]);

  const topEarnerOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#4a6080' }, grid: { color: 'rgba(255,255,255,.03)' } },
      y: { ticks: { color: '#4a6080' }, grid: { display: false } }
    }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">LEADERBOARD</h1>
          <div className="page-sub">See who is extracting the most signal from the market</div>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="scard cyan">
          <div className="scard-glow"></div>
          <div className="scard-label">TOP TRADER</div>
          <div className="scard-val" style={{ fontSize: '1.2rem' }}>{summary.topTrader}</div>
        </div>
        <div className="scard purple">
          <div className="scard-glow"></div>
          <div className="scard-label">BEST WIN RATE</div>
          <div className="scard-val">{Number(summary.bestWinRate).toFixed(1)}%</div>
        </div>
        <div className="scard pink">
          <div className="scard-glow"></div>
          <div className="scard-label">TRACKED USERS</div>
          <div className="scard-val">{summary.totalTracked}</div>
        </div>
      </div>

      {notice && <div className="info-banner" style={{ marginBottom: '1.5rem' }}>{notice}</div>}
      
      {!isLoading && entries.length > 0 && (
        <div className="gcard" style={{ marginBottom: '1.5rem' }}>
          <div className="section-hdr"><div className="section-title">TOP EARNINGS</div></div>
          <div className="chart-wrap" style={{ position: 'relative', height: '260px' }}>
            <Bar data={topEarnerData} options={topEarnerOptions} />
          </div>
        </div>
      )}

      <div className="gcard">
        <div className="section-hdr">
          <div className="section-title">🏆 GLOBAL RANKINGS</div>
        </div>
        
        {isLoading && <div className="empty">Loading leaderboard...</div>}
        
        {!isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {entries.map((entry, idx) => (
              <div key={entry.userId || idx} className="lb-item">
                <div className={`lb-rank ${idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : ''}`}>
                  #{idx + 1}
                </div>
                <div className="lb-avatar" style={{ borderColor: idx === 0 ? 'var(--gold)' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--border)' }}>
                  {entry.username?.charAt(0).toUpperCase()}
                </div>
                <div className="lb-info">
                  <div className="lb-name">
                    {entry.username}
                    {entry.userId === user?.id && <span className="lb-you">YOU</span>}
                  </div>
                  <div className="lb-stats">
                    Win Rate: {Number(entry.winRate || 0).toFixed(1)}% | Settled: {entry.settledTrades || 0}
                  </div>
                </div>
                <div className="lb-bal">
                  {Number(entry.earnings || 0).toLocaleString()} 🪙
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
