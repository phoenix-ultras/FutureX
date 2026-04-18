import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MarketCard from '../components/MarketCard';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import { getMarkets, getUserTrades, getWallet } from '../lib/api';
import { formatCoins } from '../lib/marketUtils';
import { buildUserStats } from '../lib/statHelpers';
import BackgroundOverlay from '../components/BackgroundOverlay';
import { connectMarketSocket } from '../lib/socket';

function Dashboard() {
  const { user, withAccessToken, clearSession } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');

      try {
        const [walletData, marketData, tradeData] = await Promise.all([
          withAccessToken((token) => getWallet(token)).catch((err) => { console.error('Dashboard: Wallet fetch failed', err); return null; }),
          getMarkets({ sort: 'latest' }).catch((err) => { console.error('Dashboard: Markets fetch failed', err); return { data: [] }; }),
          getUserTrades(user.id).catch((err) => { console.error('Dashboard: Trades fetch failed', err); return { data: [] }; })
        ]);

        console.log('[DEBUG] Dashboard API Data:', { walletData, marketData, tradeData });

        if (!isMounted) {
          return;
        }

        setWallet(walletData);
        setMarkets(marketData.data || []);
        setTrades(tradeData.data || []);
      } catch (loadError) {
        if (loadError.status === 401) {
          clearSession();
          return;
        }

        if (isMounted) {
          setError(loadError.data?.message || 'Unable to load dashboard.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (user?.id) {
      loadDashboard();
    }

    // Set up realtime instant market updates
    const socket = connectMarketSocket();
    socket.on('market:update', (data) => {
      console.log('[DEBUG] Instant Socket Update:', data);
      setMarkets((prev) =>
        prev.map((m) => (String(m.id) === String(data.marketId) ? { ...m, ...data.market } : m))
      );
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [clearSession, user?.id, withAccessToken]);

  const stats = useMemo(() => buildUserStats(trades, markets), [trades, markets]);
  const trendingMarkets = useMemo(
    () =>
      [...markets]
        .sort((left, right) => (right.yesPool + right.noPool) - (left.yesPool + left.noPool))
        .slice(0, 3),
    [markets]
  );

  return (
    <div className="relative min-h-screen text-light-text">
      {/* Background Overlay */}
      <BackgroundOverlay withChart={true} showBaseGradient={false} opacity="opacity-40" />

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
                  Trade Predictions <span className="text-neon-green">Like a Pro</span>
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Master the art of prediction trading with real-time market insights, 
                  secure transactions, and smart analytics to maximize your profits.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  className="bg-neon-green hover:bg-green-400 text-black font-semibold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-neon-green/50"
                  to="/markets"
                >
                  Start Trading Now
                </Link>
                <Link 
                  className="border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-semibold px-8 py-4 rounded-lg transition-all duration-300"
                  to="/profile"
                >
                  View Portfolio
                </Link>
              </div>
            </div>

            {/* Right Side */}
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-cyan-500/20 shadow-[0_0_30px_rgba(0,245,255,0.15)] transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,245,255,0.3)]">
                <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-gray-400">Trading Dashboard Preview</p>
                  </div>
                </div>
                
                {/* Floating Stat Cards */}
                <div className="absolute -top-4 -left-4 bg-neon-green text-black px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <div className="font-bold">4.9</div>
                      <div className="text-xs">Rating</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-cyan-500 text-black px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">👥</span>
                    <div>
                      <div className="font-bold">80K+</div>
                      <div className="text-xs">Users</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Platform?</h2>
            <p className="text-gray-400">Advanced tools and features for professional prediction traders</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Trading</h3>
              <p className="text-gray-400">Live market updates and instant trade execution with zero latency</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure System</h3>
              <p className="text-gray-400">Bank-level security with encrypted transactions and protected funds</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Predictions</h3>
              <p className="text-gray-400">AI-powered insights and analytics to guide your trading decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Protect your investments with precision</h2>
            <p className="text-gray-400">Track your performance and optimize your strategy</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart-style card */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(138,43,226,0.25)] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">Market Performance</h3>
              <div className="h-32 bg-gradient-to-r from-neon-green/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">📊 Chart Placeholder</span>
              </div>
            </div>
            
            {/* Circular progress */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(138,43,226,0.25)] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">Win Rate</h3>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="75, 100"
                    className="text-gray-600"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${stats.winRate}, 100`}
                    className="text-neon-green"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-neon-green">{stats.winRate.toFixed(0)}%</span>
                </div>
              </div>
              <p className="text-center text-gray-400">Success Rate</p>
            </div>
            
            {/* Earnings card */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(138,43,226,0.25)] hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-lg font-semibold text-white mb-4">Total Earnings</h3>
              <div className="text-3xl font-bold text-neon-green mb-2">
                {formatCoins(stats.realizedPnl)}
              </div>
              <p className="text-gray-400">Realized P&L</p>
            </div>
          </div>
        </div>
      </section>

      {/* Existing Dashboard Content */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          {error ? <div className="bg-red-900/50 text-red-400 p-4 rounded-lg mb-8">{error}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsCard label="Open positions" value={stats.openTrades} helper="Still live in market" />
            <StatsCard label="Settled win rate" value={`${stats.winRate.toFixed(1)}%`} accent="purple" />
            <StatsCard label="Realized PnL" value={formatCoins(stats.realizedPnl)} accent="pink" />
            <StatsCard label="Longest streak" value={stats.longestWinStreak} helper="Winning trades" />
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 shadow-lg border border-transparent hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.2)] transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-neon-green text-sm font-semibold">Trending now</span>
                <h2 className="text-2xl font-bold text-white">High-activity markets</h2>
              </div>
              <Link className="text-neon-green hover:text-green-400 transition-colors" to="/markets">
                See all markets →
              </Link>
            </div>

            {isLoading ? <div className="text-center py-8 text-gray-400">Loading market pulse...</div> : null}
            {!isLoading && !trendingMarkets.length ? (
              <div className="text-center py-8 text-gray-400">No live markets yet. Create or wait for new order flow.</div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingMarkets.map((market) => (
                <MarketCard key={market.id} compact market={market} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
