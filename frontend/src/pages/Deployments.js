import React, { useEffect, useState, useCallback } from 'react';
import { deploymentsAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon, XIcon, DeployIcon, RefreshIcon } from '../components/Icons';

const DeployModal = ({ onClose, onDeploy }) => {
  const [form, setForm] = useState({ version: '', environment: 'development', image_tag: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.version.trim()) { setError('Version is required'); return; }
    setLoading(true);
    try {
      await deploymentsAPI.create(form);
      onDeploy();
    } catch (err) {
      setError(err.response?.data?.error || 'Deployment failed to start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">New Deployment</h3>
          <button className="btn btn-ghost" onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Version *</label>
              <input
                className="form-control"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="e.g. v1.2.3"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Environment</label>
              <select
                className="form-control"
                value={form.environment}
                onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Docker Image Tag</label>
              <input
                className="form-control mono"
                value={form.image_tag}
                onChange={e => setForm(f => ({ ...f, image_tag: e.target.value }))}
                placeholder="e.g. registry.example.com/app:1.2.3"
              />
            </div>
            <div className="alert alert-info" style={{ fontSize: 13, marginTop: 8 }}>
              This will trigger a Kubernetes rolling update in the selected environment.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : <DeployIcon size={15} />}
                Deploy
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
    const interval = setInterval(load, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [load]);

  const formatDuration = (start, end) => {
    if (!end) return 'Running...';
    const s = Math.floor((new Date(end) - new Date(start)) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            {deployments.length} deployment{deployments.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshIcon size={14} />
          Refresh
        </button>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <PlusIcon />
            Deploy
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Deployments list */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} />
            </div>
          ) : deployments.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <DeployIcon size={48} />
                <h3>No deployments yet</h3>
                <p>Start your first deployment</p>
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
                      <span className={`badge badge-${d.status}`}>{d.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--gray-500)' }}>
                      <span><span className={`badge badge-${d.environment}`} style={{ fontSize: 11 }}>{d.environment}</span></span>
                      <span>{new Date(d.started_at).toLocaleString()}</span>
                      <span>{formatDuration(d.started_at, d.finished_at)}</span>
                    </div>
                    {d.deployed_by_name && (
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                        by {d.deployed_by_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-header">
                <span className="card-title">Deployment Details</span>
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    ['Version', <code style={{ background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{selected.version}</code>],
                    ['Environment', <span className={`badge badge-${selected.environment}`}>{selected.environment}</span>],
                    ['Started', new Date(selected.started_at).toLocaleString()],
                    ['Duration', formatDuration(selected.started_at, selected.finished_at)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-700)' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {selected.image_tag && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Image</div>
                    <code style={{ fontSize: 12, color: 'var(--gray-700)' }}>{selected.image_tag}</code>
                  </div>
                )}
                {selected.logs && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Deployment Logs</div>
                    <div className="log-box">{selected.logs}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <DeployIcon size={40} />
                <p>Select a deployment to view details</p>
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
