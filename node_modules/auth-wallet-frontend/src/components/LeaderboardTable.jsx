import { formatCoins, formatPercentage } from '../lib/marketUtils';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function LeaderboardTable({ entries, title = 'Leaderboard', subtitle }) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <span className="eyebrow">Competitive edge</span>
          <h2>{title}</h2>
        </div>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>

      <div className="table-wrap">
        <TableContainer component={Paper} className="!bg-transparent !shadow-none">
          <Table className="leaderboard-table" sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell className="!text-gray-400 !border-gray-700/50">Rank</TableCell>
                <TableCell className="!text-gray-400 !border-gray-700/50">User</TableCell>
                <TableCell className="!text-gray-400 !border-gray-700/50">Earnings</TableCell>
                <TableCell className="!text-gray-400 !border-gray-700/50">Win rate</TableCell>
                <TableCell className="!text-gray-400 !border-gray-700/50">Settled trades</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length ? (
                entries.map((entry, index) => (
                  <TableRow 
                    key={`${entry.userId || entry.username}-${index}`} 
                    className="hover:!bg-cyan-500/10 hover:!shadow-[inset_0_0_10px_rgba(0,245,255,0.1)] transition-all duration-300"
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell className="!text-white !border-gray-700/50">#{entry.rank || index + 1}</TableCell>
                    <TableCell className="!text-white !border-gray-700/50">{entry.username || 'Unknown trader'}</TableCell>
                    <TableCell className="!text-neon-green !border-gray-700/50">{formatCoins(entry.earnings || entry.realizedPnl || 0)}</TableCell>
                    <TableCell className="!text-white !border-gray-700/50">{formatPercentage(entry.winRate || 0)}</TableCell>
                    <TableCell className="!text-white !border-gray-700/50">{entry.settledTrades || entry.totalTrades || 0}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="!text-gray-400 !text-center !border-gray-700/50 !py-8">
                    No leaderboard data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </section>
  );
}

export default LeaderboardTable;
