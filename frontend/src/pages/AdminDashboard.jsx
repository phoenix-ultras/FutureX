import { useEffect, useMemo, useState } from 'react';
import { closeAdminMarket, getAdminDashboard, settleAdminMarket, triggerAdminPayout, updateAdminMarketCloseTime } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const sidebarItems = ['Markets', 'Users', 'Wallet Control', 'Results'];

function AdminDashboard() {
  const { withAccessToken } = useAuth();
  const [data, setData] = useState({ markets: [], users: [], trades: [] });
  const [activeSection, setActiveSection] = useState('Markets');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyMarketId, setBusyMarketId] = useState(null);
  const [closeTimeInputs, setCloseTimeInputs] = useState({});

  async function loadDashboard() {
    setIsLoading(true);
    setError('');

    try {
      const response = await withAccessToken((token) => getAdminDashboard(token));
      setData(response.data);
      
      const initialCloseTimes = {};
      response.data.markets.forEach((m) => {
        if (m.closingTime) {
          const date = new Date(m.closingTime);
          const localString = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          initialCloseTimes[m.id] = localString;
        }
      });
      setCloseTimeInputs(initialCloseTimes);
    } catch (requestError) {
      setError(requestError.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleCloseTimeChange(marketId, value) {
    setCloseTimeInputs((prev) => ({ ...prev, [marketId]: value }));
  }

  async function handleAdminAction(marketId, action, payload = null) {
    setBusyMarketId(marketId);
    setError('');
    setStatusMessage('');

    try {
      let response;

      if (action === 'close') {
        response = await withAccessToken((token) => closeAdminMarket(marketId, token));
      } else if (action === 'settle') {
        response = await withAccessToken((token) => settleAdminMarket(marketId, payload, token));
      } else if (action === 'updateTime') {
        response = await withAccessToken((token) => updateAdminMarketCloseTime(marketId, payload, token));
      } else {
        response = await withAccessToken((token) => triggerAdminPayout(marketId, token));
      }

      setData((current) => ({
        ...current,
        markets: current.markets.map((market) => (String(market.id) === String(marketId) ? response.market : market))
      }));
      setStatusMessage(response.message || 'Admin action completed.');
    } catch (requestError) {
      setError(requestError.data?.message || requestError.message || 'Admin action failed.');
    } finally {
      setBusyMarketId(null);
    }
  }

  const recentTrades = useMemo(() => data.trades.slice(0, 10), [data.trades]);

  return (
    <section className="page-section">
      <div className="section-hero">
        <div>
          <span className="eyebrow">Admin control</span>
          <h1 className="hero-title">Market operations dashboard</h1>
          <p className="muted">Close markets, settle results, run payouts, and inspect users and trade flow.</p>
        </div>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {statusMessage ? <div className="info-banner">{statusMessage}</div> : null}
      {isLoading ? <div className="panel loading-panel">Loading admin controls...</div> : null}

      {!isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="panel">
            <div className="space-y-3">
              {sidebarItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSection(item)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                    activeSection === item
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                      : 'border-gray-700/50 bg-gray-900/40 text-gray-300 hover:border-cyan-500/50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="panel overflow-x-auto">
              <div className="section-header">
                <div>
                  <span className="eyebrow">Markets</span>
                  <h2>Market table</h2>
                </div>
              </div>
              <table className="w-full min-w-[760px] text-sm text-left">
                <thead className="text-gray-400">
                  <tr>
                    <th className="pb-3">Market</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Outcome</th>
                    <th className="pb-3">Pools</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.markets.map((market) => (
                    <tr key={market.id} className="border-t border-gray-800/70">
                      <td className="py-4">
                        <div className="font-semibold text-white">{market.title}</div>
                        <div className="text-xs text-gray-400">{market.category}</div>
                      </td>
                      <td className="py-4 text-gray-300">{market.status}</td>
                      <td className="py-4 text-gray-300">{market.outcome || 'Pending'}</td>
                      <td className="py-4 text-gray-300">YES {Number(market.yesPool || 0).toFixed(2)} / NO {Number(market.noPool || 0).toFixed(2)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => handleAdminAction(market.id, 'close')}
                            disabled={busyMarketId === market.id || market.status === 'settled'}
                            className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Close Market
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminAction(market.id, 'settle', 'YES')}
                            disabled={busyMarketId === market.id}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            Set Result YES
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminAction(market.id, 'settle', 'NO')}
                            disabled={busyMarketId === market.id}
                            className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            Set Result NO
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminAction(market.id, 'payout')}
                            disabled={busyMarketId === market.id}
                            className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
                          >
                            Trigger Payout
                          </button>
                          
                          {market.status === 'open' && (
                            <div className="flex items-center gap-2 border-l border-gray-700 pl-2 ml-1">
                              <input 
                                type="datetime-local" 
                                className="bg-gray-800 text-gray-300 text-xs rounded border border-gray-700 px-2 py-1.5 focus:border-cyan-500 outline-none"
                                value={closeTimeInputs[market.id] || ''}
                                onChange={(e) => handleCloseTimeChange(market.id, e.target.value)}
                                disabled={busyMarketId === market.id}
                              />
                              <button
                                type="button"
                                onClick={() => handleAdminAction(market.id, 'updateTime', closeTimeInputs[market.id])}
                                disabled={busyMarketId === market.id || !closeTimeInputs[market.id]}
                                className="rounded bg-gray-700 hover:bg-gray-600 px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Update Time
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {(activeSection === 'Users' || activeSection === 'Wallet Control') ? (
              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">{activeSection}</span>
                    <h2>User balances</h2>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.users.map((user) => (
                    <div key={user.id} className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-4">
                      <div className="text-white font-semibold">{user.name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      <div className="mt-3 text-sm text-gray-300">Role: {user.role}</div>
                      <div className="text-sm text-gray-300">Wallet: {Number(user.walletBalance || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {(activeSection === 'Results' || activeSection === 'Users') ? (
              <section className="panel">
                <div className="section-header">
                  <div>
                    <span className="eyebrow">Trades</span>
                    <h2>Recent trade flow</h2>
                  </div>
                </div>
                <div className="space-y-3">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-4 text-sm text-gray-300">
                      User #{trade.userId} placed {trade.side} for {Number(trade.amount).toFixed(2)} on market #{trade.marketId}.
                    </div>
                  ))}
                  {!recentTrades.length ? <div className="panel-note">No trades recorded yet.</div> : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminDashboard;
