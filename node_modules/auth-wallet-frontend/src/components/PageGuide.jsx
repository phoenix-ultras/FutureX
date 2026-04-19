import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GUIDE_DATA = {
  '/': {
    title: 'DASHBOARD',
    icon: '📊',
    content: <>Welcome to your <strong>Command Center</strong>. Here you can track your active positions, view your all-time win rate, and monitor global market trends in real-time.</>
  },
  '/markets': {
    title: 'FUTURE MARKETS',
    icon: '🎯',
    content: <>Browse active markets. <strong>Trade YES or NO</strong> based on your conviction. Prices update live based on global liquidity pools.</>
  },
  '/leaderboard': {
    title: 'GLOBAL LEADERBOARD',
    icon: '🏆',
    content: <>See where you rank against the top traders. Climb the ladder by making accurate predictions and maximizing your realized P&L.</>
  },
  '/squads': {
    title: 'SQUAD SYNDICATES',
    icon: '🛡️',
    content: <>Join a squad to pool resources. <strong>Syndicate trading</strong> allows you to leverage collective intelligence and earn squad-level rewards.</>
  },
  '/crypto': {
    title: 'CRYPTO MARKETS',
    icon: '⚡',
    content: <>Live price feeds for major cryptocurrencies. Use these real-time metrics to inform your trades in crypto-related Future markets.</>
  },
  '/fraud': {
    title: 'FRAUD SHIELD AI',
    icon: '👁️',
    content: <>The platform is protected by a neural network that detects <strong>Sybil attacks, wash trading, and market manipulation</strong>. Your Trust Score determines your withdrawal limits.</>
  },
  '/admin': {
    title: 'ADMIN CONTROL',
    icon: '⚙️',
    content: <><strong>AUTHORIZED PERSONNEL ONLY.</strong> Close markets, settle outcomes, manage users, and monitor global platform analytics.</>
  }
};

function PageGuide() {
  const location = useLocation();
  const { user } = useAuth();
  const [guideData, setGuideData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [closedPaths, setClosedPaths] = useState(() => {
    try { return JSON.parse(localStorage.getItem('closed_guides')) || []; }
    catch { return []; }
  });

  useEffect(() => {
    let path = location.pathname;
    if (path.startsWith('/market/')) path = '/markets';
    if (path.startsWith('/squads/')) path = '/squads';

    const data = GUIDE_DATA[path];
    if (data) {
      setGuideData(data);
      if (!closedPaths.includes(path)) {
        setTimeout(() => setIsVisible(true), 1000);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [location.pathname, closedPaths]);

  const handleClose = () => {
    setIsVisible(false);
    let path = location.pathname;
    if (path.startsWith('/market/')) path = '/markets';
    if (path.startsWith('/squads/')) path = '/squads';
    
    const newClosed = [...closedPaths, path];
    setClosedPaths(newClosed);
    localStorage.setItem('closed_guides', JSON.stringify(newClosed));
  };

  if (!user || !guideData) return null;

  return (
    <div className={`page-guide ${isVisible ? 'active' : ''}`}>
      <div className="pg-header">
        <div className="pg-icon">{guideData.icon}</div>
        <div className="pg-title">{guideData.title} GUIDE</div>
        <button className="pg-close" onClick={handleClose}>×</button>
      </div>
      <div className="pg-content">
        {guideData.content}
      </div>
    </div>
  );
}

export default PageGuide;
