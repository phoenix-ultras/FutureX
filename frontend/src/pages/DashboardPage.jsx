import { useEffect, useState } from 'react';
import { getWallet, refreshAccessToken } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const { accessToken, user, logout, setAccessToken, clearSession } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWallet() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getWallet(accessToken);
        setWallet(data);
      } catch (requestError) {
        if (requestError.status === 401) {
          try {
            const refreshed = await refreshAccessToken();
            setAccessToken(refreshed.accessToken);
            const retryData = await getWallet(refreshed.accessToken);
            setWallet(retryData);
            return;
          } catch (refreshError) {
            clearSession();
            return;
          }
        }

        setError(requestError.data?.message || 'Unable to load wallet');
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      loadWallet();
    }
  }, [accessToken, clearSession, setAccessToken]);

  return (
    <div className="page-shell">
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="muted">Welcome back, {wallet?.name || user?.name || user?.username}.</p>
          </div>
          <button className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>

        {isLoading ? <div className="card-panel">Loading wallet...</div> : null}
        {error ? <div className="form-error">{error}</div> : null}

        {!isLoading && wallet ? (
          <div className="stats-grid">
            <div className="card-panel">
              <span className="stat-label">Name</span>
              <strong>{wallet.name || user?.name || wallet.username}</strong>
            </div>
            <div className="card-panel">
              <span className="stat-label">Available balance</span>
              <strong>{wallet.balance.toFixed(2)} coins</strong>
            </div>
            <div className="card-panel">
              <span className="stat-label">Locked balance</span>
              <strong>{wallet.lockedBalance.toFixed(2)} coins</strong>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DashboardPage;
