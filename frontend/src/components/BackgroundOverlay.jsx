function BackgroundOverlay({ animated = false, withChart = false, opacity = 'opacity-100', showBaseGradient = true }) {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${opacity}`}>
      {showBaseGradient && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #0a0a0a, #001f2f, #0a0a0a)'
          }}
        />
      )}

      {/* Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Candlestick / Graph style lines */}
      <div
        className={`absolute inset-0 ${animated ? 'animate-float-gradient' : ''}`}
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 150px, rgba(255, 0, 255, 0.07) 150px, rgba(255, 0, 255, 0.07) 151px),
            repeating-linear-gradient(0deg, transparent, transparent 120px, rgba(0, 255, 136, 0.06) 120px, rgba(0, 255, 136, 0.06) 121px)
          `,
          backgroundSize: animated ? '200% 200%' : '100% 100%'
        }}
      />

      {/* Optional Chart Lines Overlay */}
      {withChart && (
        <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d="M0,80 Q10,70 20,80 T40,70 T60,60 T80,70 T100,50 L100,100 L0,100 Z" fill="rgba(138,43,226,0.03)" />
          <path d="M0,90 Q15,80 30,90 T60,80 T90,90 T100,70" fill="none" stroke="rgba(0,245,255,0.15)" strokeWidth="0.3" />
          <path d="M0,60 Q20,50 40,70 T80,50 T100,40" fill="none" stroke="rgba(138,43,226,0.15)" strokeWidth="0.3" />
        </svg>
      )}
    </div>
  );
}

export default BackgroundOverlay;
