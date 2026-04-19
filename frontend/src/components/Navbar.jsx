import { Link, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Route matching for active tab
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return '/';
    if (path.startsWith('/markets') || path.startsWith('/market/')) return '/markets';
    if (path.startsWith('/leaderboard')) return '/leaderboard';
    if (path.startsWith('/admin')) return '/admin';
    if (path.startsWith('/profile')) return '/profile';
    return false;
  };

  const currentTab = getActiveTab();

  return (
    <header className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-gray-800">
      <nav className="flex items-center justify-between h-20 px-6 max-w-[1440px] mx-auto w-full">
        {/* Left Section (Logo) */}
        <div className="flex items-center">
          <Link className="flex items-center gap-3" to="/dashboard">
            <span className="text-3xl font-bold text-neon-green leading-none">NPX</span>
            <div className="hidden sm:flex flex-col justify-center">
              <div className="text-white font-semibold leading-tight text-base">Future</div>
              <div className="text-sm text-gray-400 leading-tight">Realtime signal desk</div>
            </div>
          </Link>
        </div>

        {/* Center Section (MUI Tabs) */}
        <div className="hidden md:flex items-center">
          <Tabs 
            value={currentTab === '/' ? '/dashboard' : currentTab} 
            onChange={(e, newValue) => navigate(newValue)}
            TabIndicatorProps={{ 
              style: { 
                height: 3, 
                backgroundColor: '#00f5ff',
                borderRadius: '3px 3px 0 0'
              } 
            }}
            sx={{
              minHeight: '40px'
            }}
          >
            <Tab 
              value="/dashboard" 
              label="Dashboard" 
              disableRipple
              sx={{ 
                color: (currentTab === '/' || currentTab === '/dashboard') ? '#00f5ff !important' : '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                letterSpacing: '0.5px',
                padding: '8px 16px',
                minHeight: '40px',
                "&:hover": {
                  color: "#00e5ff",
                  transition: "0.2s ease-in-out"
                }
              }} 
            />
            <Tab 
              value="/markets" 
              label="Markets" 
              disableRipple
              sx={{ 
                color: currentTab === '/markets' ? '#00f5ff !important' : '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                letterSpacing: '0.5px',
                padding: '8px 16px',
                minHeight: '40px',
                "&:hover": {
                  color: "#00e5ff",
                  transition: "0.2s ease-in-out"
                }
              }} 
            />
            <Tab 
              value="/leaderboard" 
              label="Leaderboard" 
              disableRipple
              sx={{ 
                color: currentTab === '/leaderboard' ? '#00f5ff !important' : '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                letterSpacing: '0.5px',
                padding: '8px 16px',
                minHeight: '40px',
                "&:hover": {
                  color: "#00e5ff",
                  transition: "0.2s ease-in-out"
                }
              }} 
            />
            {isAdmin ? (
              <Tab
                value="/admin"
                label="Admin"
                disableRipple
                sx={{
                  color: currentTab === '/admin' ? '#00f5ff !important' : '#9ca3af',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  letterSpacing: '0.5px',
                  padding: '8px 16px',
                  minHeight: '40px',
                  "&:hover": {
                    color: "#00e5ff",
                    transition: "0.2s ease-in-out"
                  }
                }}
              />
            ) : null}
            <Tab 
              value="/profile" 
              label="Profile" 
              disableRipple
              sx={{ 
                color: currentTab === '/profile' ? '#00f5ff !important' : '#9ca3af', 
                fontWeight: 600, 
                textTransform: 'none', 
                fontSize: '0.95rem',
                letterSpacing: '0.5px',
                padding: '8px 16px',
                minHeight: '40px',
                "&:hover": {
                  color: "#00e5ff",
                  transition: "0.2s ease-in-out"
                }
              }} 
            />
          </Tabs>
        </div>

        {/* Right Section (User & Buttons) */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/50">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
            <div className="flex flex-col justify-center">
              <div className="text-white font-semibold text-sm leading-tight">{user?.name || user?.username || 'Trader'}</div>
              <div className="text-xs text-gray-400 leading-tight">{isAdmin ? 'Admin terminal' : 'Online terminal'}</div>
            </div>
          </div>
          <button 
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 h-10 flex items-center justify-center rounded-lg transition-colors text-base font-medium"
            onClick={logout} 
            type="button"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
