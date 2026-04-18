import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TradePanel from '../components/TradePanel';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getMarket, getMarketOdds, getMarkets } from '../lib/api';
import { connectMarketSocket } from '../lib/socket';
import { formatClosingTime, formatCoins, formatOdds, getMarketMetrics } from '../lib/marketUtils';

function MarketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [market, setMarket] = useState(null);
  const [odds, setOdds] = useState(null);
  const [relatedMarkets, setRelatedMarkets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [socketState, setSocketState] = useState('Connecting');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadMarketData({ silent = false } = {}) {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [marketData, oddsData, relatedData] = await Promise.all([
        getMarket(id),
        getMarketOdds(id).catch(() => null),
        getMarkets({ sort: 'latest' }).catch(() => ({ data: [] }))
      ]);

      setMarket(marketData.data);
      setOdds(oddsData || null);
      setRelatedMarkets((relatedData.data || []).filter((entry) => String(entry.id) !== String(id)).slice(0, 3));
      setError('');
    } catch (loadError) {
      setError(loadError.data?.message || 'Unable to load market.');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    loadMarketData();
  }, [id]);

  useEffect(() => {
    const socket = connectMarketSocket();
    let pollingTimer = null;

    socket.on('connect', () => {
      setSocketState('Live');
      socket.emit('market:subscribe', { marketId: Number(id) });
      socket.emit('joinMarket', { marketId: Number(id) });
    });

    socket.on('connect_error', () => {
      setSocketState('Polling');
    });

    const handleRefresh = (payload) => {
      if (!payload || String(payload.marketId || payload.id) !== String(id)) {
        return;
      }

      setActivity((current) => [
        {
          id: `${Date.now()}-${current.length}`,
          label: payload.type || 'Market update',
          time: new Date().toLocaleTimeString()
        },
        ...current
      ].slice(0, 6));

      loadMarketData({ silent: true });
    };

    socket.on('market:update', handleRefresh);
    socket.on('market:odds', handleRefresh);
    socket.on('trade:placed', handleRefresh);

    pollingTimer = window.setInterval(() => {
      loadMarketData({ silent: true });
    }, 12000);

    return () => {
      if (pollingTimer) {
        window.clearInterval(pollingTimer);
      }

      socket.emit('market:unsubscribe', { marketId: Number(id) });
      socket.disconnect();
    };
  }, [id]);

  const metrics = useMemo(() => getMarketMetrics(market), [market]);
  const displayedOdds = odds || metrics;

  function handleTradeExecuted(result) {
    setMarket(result.market);
    setActivity((current) => [
      {
        id: `${Date.now()}-trade`,
        label: result.message || 'Trade executed',
        time: new Date().toLocaleTimeString()
      },
      ...current
    ].slice(0, 6));
    loadMarketData({ silent: true });
  }

  if (isLoading) {
    return <div className="panel loading-panel">Loading market stream...</div>;
  }

  if (error || !market) {
    return <div className="form-error">{error || 'Market not found.'}</div>;
  }

  return (
    <section className="page-section">
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel detail-hero">
            <div className="market-card-header">
              <div>
                <span className="category-pill">{market.category}</span>
                <h1>{market.title}</h1>
              </div>
              <span className={`socket-badge ${socketState === 'Live' ? 'socket-live' : 'socket-offline'}`}>
                {socketState}
              </span>
            </div>

            {market.description ? <p className="hero-copy">{market.description}</p> : null}

            <div className="detail-meta">
              <div>
                <span>Outcome type</span>
                <strong>{market.outcomeType}</strong>
              </div>
              <div>
                <span>Closing time</span>
                <strong>{formatClosingTime(market.closingTime)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>
                  {market.status === "open" && "🟢 OPEN"}
                  {market.status === "closed" && "🟡 CLOSED"}
                  {market.status === "settled" && "🔴 SETTLED"}
                  {!['open', 'closed', 'settled'].includes(market.status) && market.status}
                </strong>
              </div>
              <div>
                <span>Settlement</span>
                <strong>{market.settlementRule || 'Manual rule'}</strong>
              </div>
            </div>
          </section>

          <div className="stats-grid">
            <StatsCard label="YES odds" value={formatOdds(displayedOdds.yesOdds)} />
            <StatsCard label="NO odds" value={formatOdds(displayedOdds.noOdds)} accent="purple" />
            <StatsCard label="Total volume" value={formatCoins(displayedOdds.totalPool || metrics.totalPool)} accent="pink" />
            <StatsCard label="Result" value={market.result || 'Pending'} />
          </div>

          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Live activity</span>
                <h2>Realtime feed</h2>
              </div>
            </div>

            <div className="activity-list">
              {activity.length ? (
                activity.map((event) => (
                  <div className="activity-item" key={event.id}>
                    <strong>{event.label}</strong>
                    <span>{event.time}</span>
                  </div>
                ))
              ) : (
                <div className="panel-note">Waiting for the next order flow event...</div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">You may also like</span>
                <h2>Related markets</h2>
              </div>
            </div>

            <div className="related-links">
              {relatedMarkets.length ? (
                relatedMarkets.map((entry) => (
                  <Link className="related-link" key={entry.id} to={`/market/${entry.id}`}>
                    <strong>{entry.title}</strong>
                    <span>{entry.category}</span>
                  </Link>
                ))
              ) : (
                <div className="panel-note">No related markets available yet.</div>
              )}
            </div>
          </section>
        </div>

        <TradePanel market={market} onTradeExecuted={handleTradeExecuted} userId={user?.id} />
      </div>
    </section>
  );
}

export default MarketDetail;
