import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/Icons';

export const LoginPage = ({ onSwitch }) => {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <LogoIcon size={24} />
          </div>
          <span className="auth-brand-text">DeployKit</span>
        </div>
        <div className="auth-hero-text">
          <h2>Automate your<br />deployments</h2>
          <p>Docker and Kubernetes-powered CI/CD pipeline. Deploy with confidence, scale without limits.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h1>Sign in</h1>
          <p className="subtitle">
            Don't have an account?{' '}
            <a href="#register" onClick={e => { e.preventDefault(); onSwitch('register'); }}>
              Create one
            </a>
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Sign in'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
            Demo: use any email + password (min 6 chars)
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = ({ onSwitch }) => {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <LogoIcon size={24} />
          </div>
          <span className="auth-brand-text">DeployKit</span>
        </div>
        <div className="auth-hero-text">
          <h2>Ship faster,<br />break nothing</h2>
          <p>Containerized deployments with automatic rollbacks, health checks, and zero-downtime updates.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h1>Create account</h1>
          <p className="subtitle">
            Already have an account?{' '}
            <a href="#login" onClick={e => { e.preventDefault(); onSwitch('login'); }}>
              Sign in
            </a>
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
