import React, { useEffect, useState } from 'react';
import { tasksAPI, deploymentsAPI, healthAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { tStatus, tEnvironment } from '../utils/i18n';
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
        const h = await healthAPI.check();
        setHealth(h.data);
      } catch {
        setHealth({ status: 'unreachable', database: 'error' });
      }

      try {
        const [statsRes, deplRes] = await Promise.all([
          tasksAPI.getStats(),
          deploymentsAPI.getAll(),
        ]);
        setStats(statsRes.data.stats);
        setDeployments(deplRes.data.deployments.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = stats ? [
    { name: tStatus('pending'), value: parseInt(stats.pending) || 0 },
    { name: tStatus('in_progress'), value: parseInt(stats.in_progress) || 0 },
    { name: tStatus('done'), value: parseInt(stats.done) || 0 },
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
          С возвращением, {user?.name?.split(' ')[0]}
        </h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
          Обзор вашего пайплайна развёртывания на сегодня.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TaskIcon />
          </div>
          <div>
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Всего задач</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <ClockIcon />
          </div>
          <div>
            <div className="stat-value">{stats?.in_progress || 0}</div>
            <div className="stat-label">В работе</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F4EA' }}>
            <CheckIcon style={{ stroke: '#1B7E34' }} />
          </div>
          <div>
            <div className="stat-value">{stats?.done || 0}</div>
            <div className="stat-label">Завершено</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <DeployIcon />
          </div>
          <div>
            <div className="stat-value">{deployments.length}</div>
            <div className="stat-label">Развёртывания</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Обзор задач</span>
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
                Задач пока нет
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Состояние системы</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'API-сервер', status: health?.status === 'ok', icon: ServerIcon },
                { label: 'База данных', status: health?.database === 'ok', icon: ContainerIcon },
                { label: 'CI/CD пайплайн', status: health?.status === 'ok', icon: ActivityIcon },
              ].map(({ label, status, icon: Icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ stroke: 'var(--gray-500)' }} />
                    </div>
                    <span style={{ fontSize: 14, color: 'var(--gray-700)', fontWeight: 500 }}>{label}</span>
                  </div>
                  <span className={`badge badge-${status ? 'success' : 'failed'}`}>
                    {status ? 'Работает' : 'Недоступно'}
                  </span>
                </div>
              ))}
            </div>
            {health?.uptime && (
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
                Аптайм: {Math.floor(health.uptime / 60)}м {Math.floor(health.uptime % 60)}с · v{health.version}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Последние развёртывания</span>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('deployments')}>
            Смотреть все
          </button>
        </div>
        {deployments.length > 0 ? (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Версия</th>
                  <th>Окружение</th>
                  <th>Статус</th>
                  <th>Начало</th>
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
                    <td><span className={`badge badge-${d.environment}`}>{tEnvironment(d.environment)}</span></td>
                    <td><span className={`badge badge-${d.status}`}>{tStatus(d.status)}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                      {new Date(d.started_at).toLocaleDateString('ru-RU')}
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
              <p>Развёртываний пока нет</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
