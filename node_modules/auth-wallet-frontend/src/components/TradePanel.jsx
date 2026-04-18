import { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { formatCoins, formatOdds, getMarketMetrics, isMarketTradeable } from '../lib/marketUtils';

function TradePanel({ market, userId, onTradeExecuted }) {
  const [side, setSide] = useState('YES');
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const metrics = useMemo(() => getMarketMetrics(market), [market]);
  const tradeable = isMarketTradeable(market);

  function handleOpenConfirm(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setError('Enter a valid trade amount.');
      return;
    }
    setIsConfirmOpen(true);
  }

  function handleCloseConfirm() {
    setIsConfirmOpen(false);
  }

  async function executeTrade() {
    setIsConfirmOpen(false);
    setIsSubmitting(true);
    const normalizedAmount = Number(amount);

    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          marketId: market.id,
          side,
          amount: normalizedAmount
        })
      });

      const result = await response.json();
      console.log("Trade response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to execute trade.');
      }

      setSuccess(result.message || `${side} trade confirmed for ${formatCoins(normalizedAmount)}.`);
      onTradeExecuted?.(result);
      setAmount('100');
    } catch (tradeError) {
      setError(tradeError.message || 'Unable to execute trade.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel trade-panel">
      <div className="trade-panel-head">
        <div>
          <span className="eyebrow">Trade ticket</span>
          <h2>Place position</h2>
        </div>
        <span className={`socket-badge ${tradeable ? 'socket-live' : 'socket-offline'}`}>
          {tradeable ? 'Market live' : 'Trading paused'}
        </span>
      </div>

      <div className="odds-grid">
        <button
          className={`odds-option ${side === 'YES' ? 'odds-option-active yes' : ''}`}
          type="button"
          onClick={() => setSide('YES')}
        >
          <span>YES</span>
          <strong>{formatOdds(metrics.yesOdds)}</strong>
        </button>
        <button
          className={`odds-option ${side === 'NO' ? 'odds-option-active no' : ''}`}
          type="button"
          onClick={() => setSide('NO')}
        >
          <span>NO</span>
          <strong>{formatOdds(metrics.noOdds)}</strong>
        </button>
      </div>

      <form className="trade-form" onSubmit={handleOpenConfirm}>
        <TextField
          id="trade-amount"
          label="Amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          disabled={!tradeable || isSubmitting}
          fullWidth
          variant="outlined"
          InputLabelProps={{ shrink: true, className: '!text-gray-400' }}
          inputProps={{ min: 1, step: 1 }}
          className="!mb-4"
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(0, 245, 255, 0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#00f5ff' },
            }
          }}
        />

        <div className="trade-summary">
          <span>Side</span>
          <strong>{side}</strong>
          <span>Potential multiplier</span>
          <strong>{formatOdds(side === 'YES' ? metrics.yesOdds : metrics.noOdds)}</strong>
        </div>

        {error ? <div className="form-error">{error}</div> : null}
        {success ? <div className="info-banner">{success}</div> : null}

        <Button 
          className="!w-full !mt-4 !text-black !bg-cyan-400 hover:!bg-cyan-300"
          disabled={!tradeable || isSubmitting || !userId} 
          type="submit"
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            fontSize: "1.05rem",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            padding: "14px 26px",
            minHeight: 52
          }}
        >
          {isSubmitting ? 'Executing...' : `Buy ${side}`}
        </Button>
      </form>

      <Dialog 
        open={isConfirmOpen} 
        onClose={handleCloseConfirm}
        PaperProps={{
          className: "!bg-gray-900 !text-white !border !border-gray-700/50"
        }}
      >
        <DialogTitle>Confirm Trade</DialogTitle>
        <DialogContent>
          <DialogContentText className="!text-gray-300">
            Are you sure you want to buy {formatCoins(Number(amount))} of {side} on this market?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} className="!text-gray-400">Cancel</Button>
          <Button onClick={executeTrade} variant="contained" className="!bg-cyan-500 !text-black hover:!bg-cyan-400" autoFocus>
            Confirm Trade
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}

export default TradePanel;
