import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSquad, joinSquad, leaveSquad } from '../lib/api';

function SquadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  
  const [squad, setSquad] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchSquadDetails = async () => {
    setIsLoading(true);
    try {
      const res = await getSquad(id);
      setSquad(res.squad);
      setMembers(res.members || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load squad details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSquadDetails();
  }, [id]);

  const isMember = members.some(m => m.user_id === user?.id);

  const handleJoinLeave = async () => {
    if (!user) return navigate('/login');
    setIsActionLoading(true);
    setError('');
    try {
      if (isMember) {
        await leaveSquad(id, accessToken);
      } else {
        await joinSquad(id, accessToken);
      }
      await fetchSquadDetails();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) return <div className="page"><div className="empty">Loading squad data...</div></div>;
  if (!squad) return <div className="page"><div className="form-error">Squad not found</div></div>;

  return (
    <div className="page">
      <div className="page-hdr" style={{ alignItems: 'flex-start' }}>
        <div>
          <button className="see-all" style={{ marginBottom: '1rem', display: 'inline-block' }} onClick={() => navigate('/squads')}>
            ← Back to Squads
          </button>
          <h1 className="page-title">{squad.name}</h1>
          <div className="page-sub">{squad.description || 'No description provided.'}</div>
        </div>
        <button 
          className="btn-neon" 
          style={{ 
            padding: '0.6rem 1.2rem', 
            width: 'auto', 
            background: isMember ? 'linear-gradient(135deg, var(--red), #cc0033)' : 'linear-gradient(135deg, var(--green), #00cc66)',
            boxShadow: isMember ? '0 0 30px rgba(255,51,102,0.3)' : '0 0 30px rgba(0,255,136,0.3)'
          }} 
          onClick={handleJoinLeave}
          disabled={isActionLoading}
        >
          {isActionLoading ? 'WAIT...' : isMember ? 'LEAVE SQUAD' : 'JOIN SQUAD'}
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="scard cyan">
          <div className="scard-glow"></div>
          <div className="scard-label">MEMBERS</div>
          <div className="scard-val" style={{ fontSize: '1.5rem' }}>{squad.member_count}</div>
        </div>
        <div className="scard purple">
          <div className="scard-glow"></div>
          <div className="scard-label">SQUAD P&L</div>
          <div className="scard-val" style={{ color: Number(squad.total_profit) >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {Number(squad.total_profit) >= 0 ? '+' : ''}{Number(squad.total_profit).toLocaleString()}
          </div>
        </div>
        <div className="scard pink">
          <div className="scard-glow"></div>
          <div className="scard-label">LEADER</div>
          <div className="scard-val" style={{ fontSize: '1.2rem' }}>{squad.leader_name}</div>
        </div>
      </div>

      <div className="gcard">
        <div className="section-hdr">
          <div className="section-title">👥 SQUAD ROSTER</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m, idx) => (
            <div key={m.user_id} className="lb-item" style={{ border: m.user_id === user?.id ? '1px solid var(--cyan)' : '' }}>
              <div className="lb-rank r1" style={{ color: m.role === 'leader' ? 'var(--gold)' : 'var(--muted)', fontSize: '0.8rem', width: '50px' }}>
                {m.role.toUpperCase()}
              </div>
              <div className="lb-info">
                <div className="lb-name">
                  {m.name}
                  {m.user_id === user?.id && <span className="lb-you">YOU</span>}
                </div>
                <div className="lb-stats">
                  Joined: {new Date(m.joined_at).toLocaleDateString()}
                </div>
              </div>
              <div className="lb-bal" style={{ color: Number(m.profit) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {Number(m.profit) >= 0 ? '+' : ''}{Number(m.profit).toLocaleString()} 🪙
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SquadDetail;
