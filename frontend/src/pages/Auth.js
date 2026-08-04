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
          <h2>Автоматизируйте<br />развёртывания</h2>
          <p>CI/CD-пайплайн на базе Docker и Kubernetes. Развёртывайте уверенно, масштабируйтесь без ограничений.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h1>Вход</h1>
          <p className="subtitle">
            Нет аккаунта?{' '}
            <a href="#register" onClick={e => { e.preventDefault(); onSwitch('register'); }}>
              Создать
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
                placeholder="my@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Ваш пароль"
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
              {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Войти'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
            Демо: любой email + пароль (мин. 6 символов)
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
          <h2>Быстрее релизы,<br />меньше сбоев</h2>
          <p>Контейнерные развёртывания с автоматическим откатом, проверками здоровья и обновлениями без простоя.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-box">
          <h1>Регистрация</h1>
          <p className="subtitle">
            Уже есть аккаунт?{' '}
            <a href="#login" onClick={e => { e.preventDefault(); onSwitch('login'); }}>
              Войти
            </a>
          </p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Полное имя</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Иван Иванов"
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
              <label className="form-label">Пароль</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Минимум 6 символов"
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
              {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
