import { useEffect, useMemo, useState } from 'react';
import MarketCard from '../components/MarketCard';
import { getMarkets } from '../lib/api';

const categories = ['all', 'sports', 'creator', 'meme', 'product', 'trend'];

function Markets() {
  const [markets, setMarkets] = useState([]);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadMarkets() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getMarkets({
          category,
          sort: sort === 'soon' ? 'closingSoon' : 'latest'
        });

        if (isMounted) {
          setMarkets(data.data || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.data?.message || 'Unable to load markets.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMarkets();

    return () => {
      isMounted = false;
    };
  }, [category, sort]);

  const summary = useMemo(() => {
    const totalVolume = markets.reduce((sum, market) => sum + Number(market.yesPool || 0) + Number(market.noPool || 0), 0);
    return {
      marketCount: markets.length,
      totalVolume
    };
  }, [markets]);

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">MARKETS</h1>
          <div className="page-sub">Track every live narrative on one grid</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>MARKETS</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.2rem', color: 'var(--cyan)' }}>{summary.marketCount}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.1em' }}>VOLUME</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.2rem', color: 'var(--green)' }}>{summary.totalVolume.toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div className="filter-row">
        {categories.map((value) => (
          <button
            key={value}
            className={`fpill ${category === value ? 'active' : ''}`}
            onClick={() => setCategory(value)}
          >
            {value.toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button
            className={`fpill ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => setSort('latest')}
          >
            LATEST
          </button>
          <button
            className={`fpill ${sort === 'soon' ? 'active' : ''}`}
            onClick={() => setSort('soon')}
          >
            CLOSING SOON
          </button>
        </div>
      </div>

      {error ? <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div> : null}
      
      <div className="markets-grid">
        {isLoading && <div className="empty-panel">Loading markets...</div>}
        {!isLoading && !markets.length && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">🏜️</div>
            <div className="empty-txt">No markets found for this filter.</div>
          </div>
        )}
        {!isLoading && markets.map(market => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}

export default Markets;
