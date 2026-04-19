import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { closeAdminMarket, getAdminDashboard, settleAdminMarket, triggerAdminPayout, updateAdminMarketCloseTime } from '../lib/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AdminDashboard() {
  const { withAccessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ markets: [], users: [], trades: [] });
  const [activeSection, setActiveSection] = useState('Markets');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyMarketId, setBusyMarketId] = useState(null);

  async function loadDashboard() {
    setIsLoading(true);
    setError('');

    try {
      const response = await withAccessToken((token) => getAdminDashboard(token));
      setData(response.data);
    } catch (requestError) {
      setError(requestError.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

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
      } else if (action === 'payout') {
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

  const categoryCounts = useMemo(() => {
    const counts = {};
    data.markets.forEach(m => {
      const cat = m.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [data.markets]);

  const barData = useMemo(() => {
    return {
      labels: Object.keys(categoryCounts),
      datasets: [{
        label: 'Active Markets',
        data: Object.values(categoryCounts),
        backgroundColor: 'rgba(0, 245, 255, 0.5)',
        borderColor: '#00f5ff',
        borderWidth: 1,
        borderRadius: 4
      }]
    };
  }, [categoryCounts]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4a6080', font: { family: "'Share Tech Mono', monospace" } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4a6080', font: { family: "'Share Tech Mono', monospace" } } }
    }
  };

  const totalVolume = useMemo(() => {
    return data.markets.reduce((acc, m) => acc + (Number(m.yesPool) || 0) + (Number(m.noPool) || 0), 0);
  }, [data.markets]);

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">ADMIN CONTROL CENTER</h1>
          <div className="page-sub">Global platform management and settlement overrides</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="live-pulse">
            <span className="pulse-dot" style={{ background: 'var(--red)' }}></span> GOD MODE
          </div>
          <button className="admin-btn danger" onClick={async () => {
            await logout();
            navigate('/login');
          }}>
            LOGOUT
          </button>
        </div>
      </div>

      {error ? <div className="form-error mb-4">{error}</div> : null}
      {statusMessage ? <div className="info-banner mb-4" style={{ color: 'var(--green)', border: '1px solid var(--green)', padding: '1rem', background: 'rgba(0,255,136,0.1)' }}>{statusMessage}</div> : null}

      <div className="dash-grid" style={{ marginBottom: '2rem' }}>
        <div className="gcard">
          <div className="section-hdr">
            <div className="section-title">PLATFORM ANALYTICS</div>
          </div>
          <div className="chart-wrap" style={{ height: '250px' }}>
             <Bar data={barData} options={barOptions} />
          </div>
        </div>
        <div className="gcard" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
          <div className="admin-stat">
            <div className="astat-label">TOTAL VOLUME</div>
            <div className="astat-val">${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="admin-stat">
            <div className="astat-label">ACTIVE MARKETS</div>
            <div className="astat-val">{data.markets.filter(m => m.status === 'open').length}</div>
          </div>
          <div className="admin-stat">
            <div className="astat-label">REGISTERED USERS</div>
            <div className="astat-val">{data.users.length}</div>
          </div>
          <div className="admin-stat">
            <div className="astat-label">SYSTEM STATUS</div>
            <div className="astat-val" style={{ color: 'var(--green)' }}>NOMINAL</div>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel" style={{ alignSelf: 'start' }}>
          <div style={{ fontFamily: "'Orbitron', monospace", color: 'var(--cyan)', marginBottom: '1.5rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>NAVIGATION</span>
            <button 
                className="admin-btn danger" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                LOGOUT
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Markets', 'Users', 'Wallet Control'].map(item => (
              <button 
                key={item} 
                onClick={() => setActiveSection(item)}
                className="admin-btn" 
                style={{ 
                  textAlign: 'left', 
                  border: activeSection === item ? '1px solid var(--cyan)' : '1px solid transparent',
                  background: activeSection === item ? 'rgba(0,245,255,0.1)' : 'transparent',
                  color: activeSection === item ? 'var(--cyan)' : 'var(--muted)'
                }}
              >
                {item.toUpperCase()}
              </button>
            ))}
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                className="admin-btn danger" 
                style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <span>LOGOUT</span>
                <span>🚪</span>
              </button>
            </div>
          </div>
        </div>

        <div className="admin-panel" style={{ overflowX: 'auto' }}>
          <div style={{ fontFamily: "'Orbitron', monospace", color: 'var(--cyan)', marginBottom: '1.5rem', fontWeight: 700 }}>
            {activeSection === 'Markets' && 'MARKET MANAGEMENT'}
            {activeSection === 'Users' && 'USER MANAGEMENT'}
            {activeSection === 'Wallet Control' && 'WALLET AUDIT'}
          </div>

          {activeSection === 'Markets' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TITLE</th>
                  <th>STATUS</th>
                  <th>POOL (Y/N)</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {data.markets.map(market => (
                  <tr key={market.id}>
                    <td style={{ color: 'var(--cyan)' }}>#{market.id}</td>
                    <td>{market.title}</td>
                    <td>
                      <span style={{ color: market.status === 'open' ? 'var(--green)' : market.status === 'settled' ? 'var(--muted)' : 'var(--orange)' }}>
                        {market.status.toUpperCase()}
                      </span>
                    </td>
                    <td>${Number(market.yesPool || 0).toFixed(0)} / ${Number(market.noPool || 0).toFixed(0)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {market.status === 'open' && (
                          <button 
                            className="admin-btn danger" 
                            disabled={busyMarketId === market.id}
                            onClick={() => handleAdminAction(market.id, 'close')}
                          >
                            CLOSE
                          </button>
                        )}
                        {market.status === 'closed' && (
                          <>
                            <button 
                              className="admin-btn" 
                              disabled={busyMarketId === market.id}
                              onClick={() => handleAdminAction(market.id, 'settle', 'YES')}
                            >
                              SET YES
                            </button>
                            <button 
                              className="admin-btn danger" 
                              disabled={busyMarketId === market.id}
                              onClick={() => handleAdminAction(market.id, 'settle', 'NO')}
                            >
                              SET NO
                            </button>
                          </>
                        )}
                        {market.status === 'settled' && (
                           <button 
                             className="admin-btn" 
                             disabled={busyMarketId === market.id}
                             onClick={() => handleAdminAction(market.id, 'payout')}
                           >
                             PAYOUT
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.markets.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--muted)' }}>No markets found</td></tr>}
              </tbody>
            </table>
          )}

          {activeSection === 'Users' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--cyan)' }}>#{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span style={{ color: user.role === 'admin' ? 'var(--purple)' : 'var(--text)' }}>{user.role.toUpperCase()}</span></td>
                    <td>
                      <button className="admin-btn danger">BAN WALLET</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSection === 'Wallet Control' && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>BALANCE</th>
                  <th>LOCKED</th>
                  <th>TRUST SCORE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td style={{ color: 'var(--cyan)' }}>${Number(user.walletBalance || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--orange)' }}>$0.00</td>
                    <td style={{ color: 'var(--green)' }}>95+</td>
                    <td>
                      <button className="admin-btn">AUDIT TXs</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
