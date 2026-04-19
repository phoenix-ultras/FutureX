import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getMarkets, SOCKET_URL } from '../lib/api';

function Ticker() {
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMarkets = async () => {
      try {
        const res = await getMarkets();
        if (isMounted) setMarkets(res.data?.slice(0, 8) || []);
      } catch (err) {
        console.error("Failed to load ticker markets", err);
      }
    };
    
    fetchMarkets();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    
    socket.on('market:update', (data) => {
      if (!isMounted) return;
      setMarkets(prev => {
        const newMarkets = [...prev];
        const idx = newMarkets.findIndex(m => String(m.id) === String(data.marketId));
        if (idx !== -1) {
          newMarkets[idx] = { ...newMarkets[idx], ...data.market };
        }
        return newMarkets;
      });
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  if (!markets.length) return null;

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {markets.map(m => {
          const yp = m.yesPool || 1;
          const np = m.noPool || 1;
          const total = yp + np;
          const yo = (total / yp).toFixed(2);
          const no = (total / np).toFixed(2);
          
          return (
            <span key={m.id} className="t-item">
              <span className="name">{m.title?.substring(0, 35)}...</span> 
              YES <span className="up">{yo}x</span> / NO <span className="dn">{no}x</span>
            </span>
          );
        })}
        {/* Duplicate for infinite scroll effect */}
        {markets.map(m => {
          const yp = m.yesPool || 1;
          const np = m.noPool || 1;
          const total = yp + np;
          const yo = (total / yp).toFixed(2);
          const no = (total / np).toFixed(2);
          
          return (
            <span key={`dup-${m.id}`} className="t-item">
              <span className="name">{m.title?.substring(0, 35)}...</span> 
              YES <span className="up">{yo}x</span> / NO <span className="dn">{no}x</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default Ticker;
