import React, { useEffect, useState } from 'react';

const colors = [
  'rgba(0,245,255,',
  'rgba(139,92,246,',
  'rgba(0,255,136,',
  'rgba(255,215,0,',
  'rgba(255,107,53,',
  'rgba(255,45,120,'
];

function HexGrid() {
  const [hexes, setHexes] = useState([]);

  useEffect(() => {
    const newHexes = Array.from({ length: 16 }).map((_, i) => {
      const c = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: i,
        background: `${c}${Math.random() * 0.4 + 0.2})`,
        animationDelay: `${Math.random() * 3}s`
      };
    });
    setHexes(newHexes);
  }, []);

  return (
    <div className="cp-hex-grid">
      {hexes.map((hex) => (
        <div
          key={hex.id}
          className="cp-hex"
          style={{
            background: hex.background,
            animationDelay: hex.animationDelay
          }}
        ></div>
      ))}
    </div>
  );
}

export default HexGrid;
