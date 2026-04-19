import { useMemo, useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { signup } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const initialState = { name: '', email: '', password: '', confirmPassword: '' };

function SignupPage() {
  const [form, setForm] = useState(initialState);
  const [role, setRole] = useState('user');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validationMessage = useMemo(() => {
    if (!form.name) return '';
    if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (form.password && form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.confirmPassword && form.password !== form.confirmPassword) return 'Passwords do not match.';
    return '';
  }, [form]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError('');
    setIsSubmitting(true);

    // If we wanted to actually support signup with role admin,
    // we would pass it to the backend here. For the prototype we just use the API.
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password
        // role, adminKey
      });
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Please log in.' }
      });
    } catch (submitError) {
      setError(submitError.data?.message || 'Unable to create account');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="auth-screen" className="active">
      <div className="auth-container">
        <div className="auth-logo">FUTURE<span>X</span></div>
        <div className="auth-sub">INITIALIZE WALLET</div>
        
        <div className="auth-tabs">
          <div className={`auth-tab ${role === 'user' ? 'active' : ''}`} onClick={() => setRole('user')}>👤 USER</div>
          <div className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>🛡️ ADMIN</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="auth-input" 
            placeholder="FULL NAME" 
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            required
          />
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
            className="auth-input" 
            placeholder="CONFIRM PASSWORD" 
            value={form.confirmPassword}
            onChange={e => setForm({...form, confirmPassword: e.target.value})}
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

          {(error || validationMessage) && <div style={{ color: 'var(--red)', fontSize: '0.8rem', textAlign: 'center' }}>{error || validationMessage}</div>}

          <button type="submit" className="btn-neon" style={{ marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'PROVISIONING...' : 'REGISTER ACCOUNT'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          ALREADY CONNECTED? <Link to="/login" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>LOG IN</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
