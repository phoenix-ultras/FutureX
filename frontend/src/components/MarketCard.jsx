import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatClosingTime, formatCoins, formatOdds, getMarketMetrics } from '../lib/marketUtils';

function MarketCard({ market, compact = false }) {
  const navigate = useNavigate();
  const metrics = getMarketMetrics(market);

  // Map categories to CSS classes
  const getCategoryClass = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('sport')) return 'cat-sports';
    if (c.includes('tech')) return 'cat-tech';
    if (c.includes('trend')) return 'cat-trend';
    if (c.includes('meme')) return 'cat-meme';
    return 'cat-creator';
  };

  const getCategoryEmoji = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('sport')) return '🏀';
    if (c.includes('tech')) return '💻';
    if (c.includes('trend')) return '📈';
    if (c.includes('meme')) return '🐸';
    return '🎯';
  };

  const yesPercent = metrics.totalPool > 0 ? Math.round((metrics.yesPool / metrics.totalPool) * 100) : 50;
  const noPercent = metrics.totalPool > 0 ? Math.round((metrics.noPool / metrics.totalPool) * 100) : 50;

  const handleCardClick = () => {
    navigate(`/market/${market.id}`);
  };

  const handleTrade = (e, side) => {
    e.stopPropagation();
    navigate(`/market/${market.id}`, { state: { autoOpenTrade: side } });
  };

  return (
    <div className="mcard" onClick={handleCardClick}>
      <div className={`mcard-cat ${getCategoryClass(market.category)}`}>
        {getCategoryEmoji(market.category)} {market.category || 'GENERAL'}
      </div>
      
      {market.status === 'open' && <div className="mcard-status status-live">LIVE</div>}
      {market.status === 'closed' && <div className="mcard-status status-closed">CLOSED</div>}
      {market.status === 'settled' && <div className="mcard-status" style={{color: 'var(--purple)'}}>SETTLED</div>}

      <div className="mcard-title">{market.title}</div>
      {!compact && <div className="mcard-desc">{market.description || 'Predict the outcome of this market.'}</div>}
      
      <div className="bar-label">
        <span className="yes-l">YES ({yesPercent}%)</span>
        <span className="no-l">NO ({noPercent}%)</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${yesPercent}%` }}></div>
      </div>
      
      <div className="odds-row">
        <div className="odd-btn odd-yes" onClick={(e) => handleTrade(e, 'yes')}>
          BUY YES {formatOdds(metrics.yesOdds)}🪙
        </div>
        <div className="odd-btn odd-no" onClick={(e) => handleTrade(e, 'no')}>
          BUY NO {formatOdds(metrics.noOdds)}🪙
        </div>
      </div>
      
      {!compact && (
        <div className="mcard-footer">
          <span>💰 Vol: {formatCoins(metrics.totalPool)}</span>
          <span>⏰ Closes: {formatClosingTime(market.closingTime)}</span>
        </div>
      )}
    </div>
  );
}

export default MarketCard;
