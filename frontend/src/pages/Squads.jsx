import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSquads, createSquad } from '../lib/api';

function Squads() {
  const { accessToken, withAccessToken } = useAuth();
  const navigate = useNavigate();
  const [squads, setSquads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSquads = async () => {
    setIsLoading(true);
    try {
      const res = await getSquads();
      setSquads(res.squads || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load squads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSquads();
  }, []);

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const payload = { name: newSquadName, description: newSquadDesc };
      const res = await withAccessToken((token) => createSquad(payload, token));
      setIsCreateModalOpen(false);
      setNewSquadName('');
      setNewSquadDesc('');
      navigate(`/squads/${res.squadId}`);
    } catch (err) {
      setError(err.message || 'Failed to create squad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <h1 className="page-title">SQUAD MODE</h1>
          <div className="page-sub">Team up, combine your P&L, and dominate the leaderboards</div>
        </div>
        <button className="btn-neon" style={{ padding: '0.6rem 1.2rem', width: 'auto' }} onClick={() => setIsCreateModalOpen(true)}>
          + CREATE SQUAD
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="gcard">
        <div className="section-hdr">
          <div className="section-title">🛡️ TOP SQUADS</div>
        </div>

        {isLoading ? (
          <div className="empty">Loading squads...</div>
        ) : squads.length === 0 ? (
          <div className="empty">
            <div className="empty-txt">No squads exist yet. Be the first to create one!</div>
          </div>
        ) : (
          <div className="markets-grid">
            {squads.map(squad => (
              <div key={squad.id} className="mcard" onClick={() => navigate(`/squads/${squad.id}`)}>
                <div className="mcard-cat cat-creator" style={{ marginBottom: '0.5rem' }}>{squad.member_count} MEMBERS</div>
                <div className="mcard-title" style={{ fontSize: '1.2rem' }}>{squad.name}</div>
                <div className="mcard-desc" style={{ marginBottom: '1rem' }}>
                  {squad.description || 'No description provided.'}
                </div>
                <div className="mcard-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', marginTop: 'auto' }}>
                  <span style={{ color: Number(squad.total_profit) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {Number(squad.total_profit) >= 0 ? '📈 P&L: +' : '📉 P&L: '}
                    {Number(squad.total_profit).toLocaleString()} 🪙
                  </span>
                  <span>👑 {squad.leader_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="trade-modal">
            <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            <div className="modal-title">CREATE SQUAD</div>
            <div className="modal-sub">Found a new trading team</div>
            
            <form onSubmit={handleCreateSquad} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>SQUAD NAME</label>
                <input 
                  type="text" 
                  className="amount-field" 
                  style={{ marginBottom: 0, fontFamily: 'Rajdhani', fontSize: '1rem' }} 
                  value={newSquadName}
                  onChange={e => setNewSquadName(e.target.value)}
                  placeholder="e.g. Cyber Knights"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>DESCRIPTION</label>
                <input 
                  type="text" 
                  className="amount-field" 
                  style={{ marginBottom: 0, fontFamily: 'Rajdhani', fontSize: '1rem' }} 
                  value={newSquadDesc}
                  onChange={e => setNewSquadDesc(e.target.value)}
                  placeholder="What is your squad about?"
                  disabled={isSubmitting}
                />
              </div>
              <button type="submit" className="btn-neon" disabled={isSubmitting || !newSquadName.trim()}>
                {isSubmitting ? 'CREATING...' : 'CONFIRM'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Squads;
