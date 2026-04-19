import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeTrade } from '../lib/api';
import { formatCoins, formatOdds, getMarketMetrics, isMarketTradeable } from '../lib/marketUtils';

function TradePanel({ market, userId, onTradeExecuted }) {
  const { accessToken } = useAuth();
  const location = useLocation();
  const [side, setSide] = useState('YES');
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const metrics = useMemo(() => getMarketMetrics(market), [market]);
  const tradeable = isMarketTradeable(market);

  // Auto-select side if passed in via navigation state
  useEffect(() => {
    if (location.state?.autoOpenTrade) {
      setSide(location.state.autoOpenTrade.toUpperCase());
    }
  }, [location.state]);

  const handleAddAmount = (addVal) => {
    setAmount((prev) => String(Number(prev) + addVal));
  };

  const executeTrade = async () => {
    setError('');
    setSuccess('');
    
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setError('Enter a valid trade amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeTrade({
        accessToken,
        userId,
        marketId: market.id,
        side,
        amount: normalizedAmount
      });
      setSuccess(result.message || `${side} trade confirmed for ${formatCoins(normalizedAmount)}.`);
      onTradeExecuted?.(result);
      setAmount('100');
    } catch (tradeError) {
      setError(tradeError.message || 'Unable to execute trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trade-modal" style={{ position: 'relative', width: '100%', maxWidth: 'none', margin: '0' }}>
      <div className="modal-title">TRADE: {market.title}</div>
      <div className="modal-sub">
        {tradeable ? 'Select your prediction and trade amount' : 'Trading is currently paused'}
      </div>

      <div className="choice-grid">
        <div 
          className={`choice-card yes ${side === 'YES' ? 'sel' : ''}`} 
          onClick={() => tradeable && setSide('YES')}
        >
          YES
          <div className="choice-odds">{formatOdds(metrics.yesOdds)}🪙</div>
        </div>
        <div 
          className={`choice-card no ${side === 'NO' ? 'sel' : ''}`} 
          onClick={() => tradeable && setSide('NO')}
        >
          NO
          <div className="choice-odds">{formatOdds(metrics.noOdds)}🪙</div>
        </div>
      </div>

      <div className="quick-row">
        <button type="button" className="qbtn" onClick={() => handleAddAmount(10)} disabled={!tradeable}>+10</button>
        <button type="button" className="qbtn" onClick={() => handleAddAmount(50)} disabled={!tradeable}>+50</button>
        <button type="button" className="qbtn" onClick={() => handleAddAmount(100)} disabled={!tradeable}>+100</button>
        <button type="button" className="qbtn" onClick={() => handleAddAmount(500)} disabled={!tradeable}>+500</button>
      </div>

      <input 
        type="number" 
        className="amount-field" 
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={!tradeable || isSubmitting}
        min="1"
      />

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="info-banner" style={{ marginBottom: '1rem' }}>{success}</div>}

      <button 
        className="btn-neon" 
        onClick={executeTrade}
        disabled={!tradeable || isSubmitting || !userId}
      >
        {isSubmitting ? 'EXECUTING...' : `CONFIRM TRADE`}
      </button>
    </div>
  );
}

export default TradePanel;
