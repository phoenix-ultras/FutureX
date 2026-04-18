import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../lib/api';

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
};

function SignupPage() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validationMessage = useMemo(() => {
    if (!form.name) {
      return '';
    }

    if (form.name.trim().length < 2) {
      return 'Name must be at least 2 characters.';
    }

    if (form.password && form.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      return 'Passwords do not match.';
    }

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

    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password
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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-gray-900 to-dark-bg text-light-text flex items-center justify-center px-4">
      <form className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl w-full max-w-md" onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          <span className="text-neon-green text-sm font-semibold">Initialize account</span>
          <h1 className="text-3xl font-bold text-white mt-2">Create Account</h1>
          <p className="text-gray-400 mt-2">New traders start with 1000 starter coins.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">Name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 outline-none transition-all"
              placeholder="Enter your full name"
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 outline-none transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 outline-none transition-all"
              placeholder="Create a password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 outline-none transition-all"
              placeholder="Confirm your password"
              required
              minLength={8}
            />
          </div>
        </div>

        {error || validationMessage ? (
          <div className="bg-red-900/50 text-red-400 p-3 rounded-lg mt-4">{error || validationMessage}</div>
        ) : null}

        <button 
          className="w-full bg-neon-green hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-all duration-300 mt-6 shadow-lg hover:shadow-neon-green/50"
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Provisioning...' : 'Open account'}
        </button>

        <p className="text-center text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-neon-green hover:text-green-400 transition-colors">Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default SignupPage;
