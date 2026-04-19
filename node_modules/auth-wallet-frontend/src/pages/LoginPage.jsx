import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialState = { email: '', password: '' };

function LoginPage() {
  const [form, setForm] = useState(initialState);
  const [role, setRole] = useState('user');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || '';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.data?.message || 'Unable to log in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="auth-screen" className="active">
      <div className="auth-container">
        <div className="auth-logo">FUTURE<span>X</span></div>
        <div className="auth-sub">TERMINAL ACCESS</div>
        
        <div className="auth-tabs">
          <div className={`auth-tab ${role === 'user' ? 'active' : ''}`} onClick={() => setRole('user')}>👤 USER</div>
          <div className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>🛡️ ADMIN</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="email" 
            className="auth-input" 
            placeholder="EMAIL ADDRESS" 
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            className="auth-input" 
            placeholder="PASSWORD" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            required
            minLength={8}
          />
          <input 
            type="password" 
            className={`auth-input admin-key ${role === 'admin' ? 'active' : ''}`}
            placeholder="ADMIN SECRET KEY" 
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            required={role === 'admin'}
          />

          {successMessage && <div style={{ color: 'var(--green)', fontSize: '0.8rem', textAlign: 'center' }}>{successMessage}</div>}
          {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}

          <button type="submit" className="btn-neon" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'CONNECTING...' : 'INITIALIZE CONNECTION'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          NEW TO FUTURE? <Link to="/signup" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>REGISTER WALLET</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
