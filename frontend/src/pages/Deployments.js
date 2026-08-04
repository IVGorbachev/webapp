import React, { useEffect, useState, useCallback } from 'react';
import { deploymentsAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { tStatus, tEnvironment, pluralDeployments } from '../utils/i18n';
import { PlusIcon, XIcon, DeployIcon, RefreshIcon } from '../components/Icons';

const DeployModal = ({ onClose, onDeploy }) => {
  const [form, setForm] = useState({ version: '', environment: 'development', image_tag: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.version.trim()) { setError('Версия обязательна'); return; }
    setLoading(true);
    try {
      await deploymentsAPI.create(form);
      onDeploy();
    } catch (err) {
      setError(err.response?.data?.error || 'Не удалось запустить развёртывание');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Новое развёртывание</h3>
          <button className="btn btn-ghost" onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Версия *</label>
              <input
                className="form-control"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="например, v1.2.3"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Окружение</label>
              <select
                className="form-control"
                value={form.environment}
                onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
              >
                <option value="development">Разработка</option>
                <option value="staging">Тестирование</option>
                <option value="production">Продакшн</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Тег Docker-образа</label>
              <input
                className="form-control mono"
                value={form.image_tag}
                onChange={e => setForm(f => ({ ...f, image_tag: e.target.value }))}
                placeholder="например, registry.example.com/app:1.2.3"
              />
            </div>
            <div className="alert alert-info" style={{ fontSize: 13, marginTop: 8 }}>
              Будет запущено rolling update в Kubernetes для выбранного окружения.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : <DeployIcon size={15} />}
                Развернуть
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Deployments = () => {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await deploymentsAPI.getAll();
      setDeployments(res.data.deployments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const formatDuration = (start, end) => {
    if (!end) return 'Выполняется...';
    const s = Math.floor((new Date(end) - new Date(start)) / 1000);
    return s < 60 ? `${s}с` : `${Math.floor(s / 60)}м ${s % 60}с`;
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            {pluralDeployments(deployments.length)}
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshIcon size={14} />
          Обновить
        </button>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon />
            Развернуть
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
            </div>
          ) : deployments.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <DeployIcon size={48} />
                <h3>Развёртываний пока нет</h3>
                <p>Запустите первое развёртывание</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deployments.map(d => (
                <div
                  key={d.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    borderColor: selected?.id === d.id ? 'var(--blue-mid)' : undefined,
                    borderLeft: selected?.id === d.id ? '3px solid var(--blue-mid)' : undefined,
                  }}
                  onClick={() => setSelected(d)}
                >
                  <div className="card-body" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <code style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 4 }}>
                        {d.version}
                      </code>
                      <span className={`badge badge-${d.status}`}>{tStatus(d.status)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-500)' }}>
                      <span><span className={`badge badge-${d.environment}`} style={{ fontSize: 11 }}>{tEnvironment(d.environment)}</span></span>
                      <span>{new Date(d.started_at).toLocaleString('ru-RU')}</span>
                      <span>{formatDuration(d.started_at, d.finished_at)}</span>
                    </div>
                    {d.deployed_by_name && (
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                        автор: {d.deployed_by_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-header">
                <span className="card-title">Детали развёртывания</span>
                <span className={`badge badge-${selected.status}`}>{tStatus(selected.status)}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['Версия', <code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{selected.version}</code>],
                    ['Окружение', <span className={`badge badge-${selected.environment}`}>{tEnvironment(selected.environment)}</span>],
                    ['Начало', new Date(selected.started_at).toLocaleString('ru-RU')],
                    ['Длительность', formatDuration(selected.started_at, selected.finished_at)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {selected.image_tag && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Образ</div>
                    <code style={{ fontSize: 12, color: 'var(--gray-700)' }}>{selected.image_tag}</code>
                  </div>
                )}
                {selected.logs && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Логи развёртывания</div>
                    <div className="log-box">{selected.logs}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <DeployIcon size={40} />
                <p>Выберите развёртывание для просмотра деталей</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <DeployModal
          onClose={() => setModalOpen(false)}
          onDeploy={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
};

export default Deployments;
