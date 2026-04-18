import { useEffect, useMemo, useState } from 'react';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getMarkets, getUserStats, getUserTrades, getWallet } from '../lib/api';
import { formatClosingTime, formatCoins, formatPercentage } from '../lib/marketUtils';
import { buildUserStats } from '../lib/statHelpers';

function Profile() {
  const { user, withAccessToken, clearSession } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [trades, setTrades] = useState([]);
  const [statsResponse, setStatsResponse] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError('');

      try {
        const [walletData, tradeData, marketData, statsData] = await Promise.all([
          withAccessToken((token) => getWallet(token)).catch((err) => { console.error('Profile: Wallet fetch failed', err); return null; }),
          getUserTrades(user.id).catch((err) => { console.error('Profile: Trades fetch failed', err); return { data: [] }; }),
          getMarkets({ sort: 'latest' }).catch((err) => { console.error('Profile: Markets fetch failed', err); return { data: [] }; }),
          getUserStats(user.id).catch((err) => { console.error('Profile: Stats fetch failed', err); return null; })
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

  return (
    <section className="page-section">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Trader profile</span>
          <h1 className="hero-title">{user?.username}&apos;s performance cockpit</h1>
          <p className="muted">Wallet state, trade history, and settled performance all in one view.</p>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {isLoading ? <div className="panel loading-panel">Loading profile telemetry...</div> : null}

      {!isLoading ? (
        <>
          <div className="stats-grid">
            <StatsCard label="Wallet balance" value={formatCoins(wallet?.balance || 0)} />
            <StatsCard label="Locked balance" value={formatCoins(wallet?.lockedBalance || 0)} accent="purple" />
            <StatsCard label="Win rate" value={formatPercentage(stats.winRate || 0)} accent="pink" />
            <StatsCard label="Current streak" value={stats.currentStreak || 0} helper="Settled wins in a row" />
          </div>

          <div className="profile-grid">
            <section className="panel">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Performance summary</span>
                  <h2>Signal quality</h2>
                </div>
              </div>

              <div className="profile-list">
                <div>
                  <span>Wins</span>
                  <strong>{stats.wins}</strong>
                </div>
                <div>
                  <span>Losses</span>
                  <strong>{stats.losses}</strong>
                </div>
                <div>
                  <span>Open trades</span>
                  <strong>{stats.openTrades}</strong>
                </div>
                <div>
                  <span>Total volume</span>
                  <strong>{formatCoins(stats.totalVolume)}</strong>
                </div>
                <div>
                  <span>Realized PnL</span>
                  <strong>{formatCoins(stats.realizedPnl)}</strong>
                </div>
                <div>
                  <span>Longest win streak</span>
                  <strong>{stats.longestWinStreak}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Trade history</span>
                  <h2>Recent executions</h2>
                </div>
              </div>

              <div className="trade-history">
                {settledMarkets.length ? (
                  settledMarkets.map((trade) => (
                    <div className="trade-history-item" key={trade.id}>
                      <div>
                        <strong>{trade.market?.title || `Market #${trade.marketId}`}</strong>
                        <span>
                          {trade.side} | {formatCoins(trade.amount)} | {trade.market ? formatClosingTime(trade.market.closingTime) : 'Unknown close'}
                        </span>
                      </div>
                      <div className="trade-history-meta">
                        <strong className={
                          trade.market?.status?.toLowerCase() === 'settled' 
                            ? (trade.side === trade.market?.result ? '!text-neon-green' : '!text-red-400') 
                            : '!text-gray-300'
                        }>
                          {trade.market?.status?.toLowerCase() === 'settled' 
                            ? (trade.side === trade.market?.result ? 'WIN' : 'LOSS')
                            : (trade.market?.status?.toLowerCase() === 'closed' ? 'Waiting Result' : 'Active Trade')}
                        </strong>
                        <span>Odds {Number(trade.oddsAtTrade).toFixed(2)}x</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="panel-note">No trades yet. Your executions will appear here.</div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default Profile;
