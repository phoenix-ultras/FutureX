import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

function StatsCard({ label, value, accent = 'cyan', helper }) {
  const accentColors = {
    cyan: 'border-cyan-500 text-cyan-400 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] hover:border-cyan-400',
    purple: 'border-purple-500 text-purple-400 hover:shadow-[0_0_15px_rgba(138,43,226,0.2)] hover:border-purple-400',
    pink: 'border-pink-500 text-pink-400 hover:shadow-[0_0_15px_rgba(255,105,180,0.2)] hover:border-pink-400',
    green: 'border-neon-green text-neon-green hover:shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:border-green-400'
  };

  return (
    <Card className={`!bg-gray-800/50 !backdrop-blur-sm !rounded-xl !shadow-lg !border-l-4 transition-all duration-300 ${accentColors[accent] || accentColors.cyan}`}>
      <CardContent className="!p-6">
        <span className="text-gray-400 text-sm block mb-2">{label}</span>
        <strong className="text-white text-2xl font-bold block mb-1">{value}</strong>
        {helper ? <span className="text-gray-500 text-xs">{helper}</span> : null}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
