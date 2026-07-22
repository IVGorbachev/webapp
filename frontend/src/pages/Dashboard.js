import React, { useEffect, useState } from 'react';
import { tasksAPI, deploymentsAPI, healthAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import {
  TaskIcon, DeployIcon, ActivityIcon, ServerIcon,
  CheckIcon, ClockIcon, ContainerIcon
} from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, deplRes] = await Promise.all([
          tasksAPI.getStats(),
          deploymentsAPI.getAll(),
        ]);
        setStats(statsRes.data.stats);
        setDeployments(deplRes.data.deployments.slice(0, 5));

        try {
          const h = await healthAPI.check();
          setHealth(h.data);
        } catch { setHealth({ status: 'unreachable' }); }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = stats ? [
    { name: 'Pending', value: parseInt(stats.pending) || 0 },
    { name: 'In Progress', value: parseInt(stats.in_progress) || 0 },
    { name: 'Done', value: parseInt(stats.done) || 0 },
  ] : [];

  const CHART_COLORS = ['#9CA3AF', '#1A3A6B', '#34A853'];

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
          Here's what's happening with your deployment pipeline today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TaskIcon />
          </div>
          <div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <ClockIcon />
          </div>
          <div>
            <div className="stat-value">{stats?.in_progress || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F4EA' }}>
            <CheckIcon style={{ stroke: '#1B7E34' }} />
          </div>
          <div>
            <div className="stat-value">{stats?.done || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <DeployIcon />
          </div>
          <div>
            <div className="stat-value">{deployments.length}</div>
            <div className="stat-label">Deployments</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Task chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Task Overview</span>
          </div>
          <div className="card-body">
            {chartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid var(--gray-200)',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)', fontSize: 14 }}>
                No tasks yet
              </div>
            )}
          </div>
        </div>

        {/* Health status */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">System Health</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'API Server', status: health?.status === 'ok', icon: ServerIcon },
                { label: 'Database', status: health?.status === 'ok', icon: ContainerIcon },
                { label: 'CI/CD Pipeline', status: deployments.some(d => d.status === 'success'), icon: ActivityIcon },
              ].map(({ label, status, icon: Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ stroke: 'var(--gray-500)' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--gray-700)', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span className={`badge badge-${status ? 'success' : 'failed'}`}>
                    {status ? 'Operational' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
            {health?.uptime && (
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
                Uptime: {Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s · v{health.version}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent deployments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Deployments</span>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('deployments')}>
            View All
          </button>
        </div>
        {deployments.length > 0 ? (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map(d => (
                  <tr key={d.id}>
                    <td>
                      <code style={{ fontSize: 13, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                        {d.version}
                      </code>
                    </td>
                    <td><span className={`badge badge-${d.environment}`}>{d.environment}</span></td>
                    <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                      {new Date(d.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card-body">
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <DeployIcon size={40} />
              <p>No deployments yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
