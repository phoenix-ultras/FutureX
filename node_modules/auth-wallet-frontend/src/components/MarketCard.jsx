import { Link } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { formatClosingTime, formatCoins, formatOdds, getMarketMetrics } from '../lib/marketUtils';

function MarketCard({ market, compact = false }) {
  const metrics = getMarketMetrics(market);

  return (
    <Card className="!bg-gray-800/50 !backdrop-blur-sm !rounded-2xl !shadow-lg hover:!shadow-[0_0_15px_rgba(0,245,255,0.2)] !border !border-gray-700/50 hover:!border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 overflow-visible">
      <CardContent className={`!p-6 ${compact ? '!p-4' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <span className="inline-block bg-neon-green/20 text-neon-green text-xs font-semibold px-2 py-1 rounded-full mb-2">
              {market.category}
            </span>
            <h3 className={`text-white font-semibold ${compact ? 'text-lg' : 'text-xl'} mb-2`}>{market.title}</h3>
          </div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            market.status === 'open' ? 'bg-green-500/20 text-green-400' :
            market.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {market.status === "open" && "🟢 OPEN"}
            {market.status === "closed" && "🟡 CLOSED"}
            {market.status === "settled" && "🔴 SETTLED"}
            {!['open', 'closed', 'settled'].includes(market.status) && market.status}
          </span>
        </div>

        {market.description && !compact ? (
          <p className="text-gray-400 text-sm mb-4">{market.description}</p>
        ) : null}

        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2'} gap-4 mb-4`}>
          <div className="text-center">
            <span className="text-gray-400 text-xs block">YES</span>
            <strong className="text-neon-green text-lg">{formatOdds(metrics.yesOdds)}</strong>
          </div>
          <div className="text-center">
            <span className="text-gray-400 text-xs block">NO</span>
            <strong className="text-cyan-400 text-lg">{formatOdds(metrics.noOdds)}</strong>
          </div>
          {!compact && (
            <>
              <div className="text-center">
                <span className="text-gray-400 text-xs block">Volume</span>
                <strong className="text-white text-lg">{formatCoins(metrics.totalPool)}</strong>
              </div>
              <div className="text-center">
                <span className="text-gray-400 text-xs block">Closing</span>
                <strong className="text-white text-sm">{formatClosingTime(market.closingTime)}</strong>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          {!compact && (
            <span className="text-gray-500 text-xs">{market.settlementRule || 'Manual settlement rule'}</span>
          )}
          <Button 
            component={Link}
            to={`/market/${market.id}`}
            variant="contained"
            className="!bg-neon-green hover:!bg-green-400 !text-black !transition-colors"
            sx={{
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              padding: "8px 20px",
              minHeight: 40
            }}
          >
            View Market
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default MarketCard;
