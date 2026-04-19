import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TradePanel from '../components/TradePanel';
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
    if (!silent) setIsLoading(true);
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
      if (!silent) setIsLoading(false);
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

    socket.on('connect_error', () => setSocketState('Polling'));

    const handleRefresh = (payload) => {
      if (!payload || String(payload.marketId || payload.id) !== String(id)) return;
      setActivity((current) => [
        { id: `${Date.now()}-${current.length}`, label: payload.type || 'Market update', time: new Date().toLocaleTimeString() },
        ...current
      ].slice(0, 6));
      loadMarketData({ silent: true });
    };

    socket.on('market:update', handleRefresh);
    socket.on('market:odds', handleRefresh);
    socket.on('trade:placed', handleRefresh);

    pollingTimer = window.setInterval(() => loadMarketData({ silent: true }), 12000);

    return () => {
      if (pollingTimer) window.clearInterval(pollingTimer);
      socket.emit('market:unsubscribe', { marketId: Number(id) });
      socket.disconnect();
    };
  }, [id]);

  const metrics = useMemo(() => getMarketMetrics(market), [market]);
  const displayedOdds = odds || metrics;

  function handleTradeExecuted(result) {
    setMarket(result.market);
    setActivity((current) => [
      { id: `${Date.now()}-trade`, label: result.message || 'Trade executed', time: new Date().toLocaleTimeString() },
      ...current
    ].slice(0, 6));
    loadMarketData({ silent: true });
  }

  if (isLoading) return <div className="page"><div className="empty">Loading market stream...</div></div>;
  if (error || !market) return <div className="page"><div className="form-error">{error || 'Market not found.'}</div></div>;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">MARKET DETAIL</h1>
          <div className="page-sub">Trade on real-world events</div>
        </div>
        <div className={`live-tag ${socketState === 'Live' ? '' : 'offline'}`}>{socketState}</div>
      </div>

      <div className="dash-grid-3">
        {/* Main Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="gcard">
            <div className="section-hdr" style={{ marginBottom: '0.5rem' }}>
              <div className="mcard-cat cat-trend">{market.category || 'MARKET'}</div>
              <div className={`mcard-status ${market.status === 'open' ? 'status-live' : 'status-closed'}`}>
                 {market.status === "open" && "🟢 OPEN"}
                 {market.status === "closed" && "🟡 CLOSED"}
                 {market.status === "settled" && "🔴 SETTLED"}
              </div>
            </div>
            <h2 className="page-title" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{market.title}</h2>
            <p className="mcard-desc" style={{ fontSize: '1rem', color: 'var(--text)' }}>
              {market.description || 'Predict the outcome of this market.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div className="scard" style={{ flex: 1, padding: '1rem' }}>
                <div className="scard-label">POOL VOLUME</div>
                <div className="scard-val" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>{formatCoins(displayedOdds.totalPool || metrics.totalPool)}</div>
              </div>
              <div className="scard" style={{ flex: 1, padding: '1rem' }}>
                <div className="scard-label">CLOSES IN</div>
                <div className="scard-val" style={{ fontSize: '1.2rem', color: 'var(--purple)' }}>{formatClosingTime(market.closingTime)}</div>
              </div>
            </div>
          </div>

          <div className="gcard">
            <div className="section-hdr">
              <div className="section-title">⚡ REALTIME FEED</div>
            </div>
            {activity.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activity.map((event) => (
                  <div key={event.id} className="trow" style={{ padding: '0.5rem 0' }}>
                    <div className="trow-info">
                      <div className="trow-market">{event.label}</div>
                      <div className="trow-meta">{event.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-txt">Waiting for the next order flow event...</div>
            )}
          </div>

        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <TradePanel market={market} onTradeExecuted={handleTradeExecuted} userId={user?.id} />

          <div className="gcard">
            <div className="section-hdr">
              <div className="section-title">🔗 RELATED MARKETS</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {relatedMarkets.length ? (
                relatedMarkets.map((entry) => (
                  <Link key={entry.id} to={`/market/${entry.id}`} style={{ textDecoration: 'none' }}>
                    <div className="trow" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="trow-info">
                        <div className="trow-market" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</div>
                        <div className="trow-meta">{entry.category}</div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="empty-txt">No related markets.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MarketDetail;
