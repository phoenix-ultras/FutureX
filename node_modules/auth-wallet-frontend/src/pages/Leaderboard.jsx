import { useEffect, useMemo, useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getMarkets, getUserTrades } from '../lib/api';
import { buildUserStats } from '../lib/statHelpers';

function Leaderboard() {
  const { user } = useAuth();
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
            getUserTrades(user.id).catch(() => ({ data: [] })),
            getMarkets({ sort: 'latest' }).catch(() => ({ data: [] }))
          ]);

          const stats = buildUserStats(tradeData.data || [], marketData.data || []);
          setEntries([
            {
              rank: 1,
              userId: user.id,
              username: user.username,
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
  }, [user?.id, user?.username]);

  const summary = useMemo(() => {
    const topEntry = entries[0];

    return {
      topTrader: topEntry?.username || '--',
      bestWinRate: topEntry?.winRate || 0,
      totalTracked: entries.length
    };
  }, [entries]);

  return (
    <section className="page-section">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Competitive board</span>
          <h1 className="hero-title">See who is extracting the most signal from the market.</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard label="Top trader" value={summary.topTrader} />
        <StatsCard label="Best win rate" value={`${Number(summary.bestWinRate).toFixed(1)}%`} accent="purple" />
        <StatsCard label="Tracked users" value={summary.totalTracked} accent="pink" />
      </div>

      {notice ? <div className="info-banner">{notice}</div> : null}
      {isLoading ? <div className="panel loading-panel">Loading leaderboard...</div> : null}
      {!isLoading ? <LeaderboardTable entries={entries} subtitle="Ranked by realized earnings and execution quality." /> : null}
    </section>
  );
}

export default Leaderboard;
