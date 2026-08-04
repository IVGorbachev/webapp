import React from 'react';
import { ServerIcon, ContainerIcon, ActivityIcon } from '../components/Icons';

const InfoBlock = ({ label, value, mono }) => (
  <div style={{ marginBottom: 8 }}>
    <span style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    <div style={{ fontSize: 13, color: 'var(--gray-800)', marginTop: 2, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{value}</div>
  </div>
);

const K8S_PODS = [
  { name: 'webapp-frontend-6d9b8f-xkp2r', status: 'Running', ready: '1/1', restarts: 0, age: '2 дн.' },
  { name: 'webapp-backend-7c4d9a-mnz8q', status: 'Running', ready: '1/1', restarts: 0, age: '2 дн.' },
  { name: 'webapp-postgres-0', status: 'Running', ready: '1/1', restarts: 0, age: '5 дн.' },
  { name: 'webapp-redis-5f7d8c-plq9w', status: 'Running', ready: '1/1', restarts: 1, age: '3 дн.' },
];

const DOCKER_IMAGES = [
  { name: 'webapp-frontend', tag: 'v1.0.0', size: '142 МБ', created: '2 дня назад' },
  { name: 'webapp-backend', tag: 'v1.0.0', size: '198 МБ', created: '2 дня назад' },
  { name: 'postgres', tag: '15-alpine', size: '89 МБ', created: '5 дней назад' },
  { name: 'redis', tag: '7-alpine', size: '41 МБ', created: '3 дня назад' },
];

const Infrastructure = () => {
  return (
    <div className="page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ContainerIcon size={16} style={{ stroke: 'var(--gray-500)' }} />
              Кластер Kubernetes
            </span>
            <span className="badge badge-success">Активен</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <InfoBlock label="Кластер" value="webapp-k8s-cluster" />
              <InfoBlock label="Версия" value="v1.28.4" />
              <InfoBlock label="Namespace" value="production" mono />
              <InfoBlock label="Узлы" value="3 готовы" />
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Поды</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {K8S_PODS.map(pod => (
                <div key={pod.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-100)'
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--gray-700)', fontWeight: 500 }}>
                      {pod.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                      Готовность: {pod.ready} · Перезапуски: {pod.restarts} · Возраст: {pod.age}
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 11 }}>Работает</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ServerIcon size={16} style={{ stroke: 'var(--gray-500)' }} />
              Docker-образы
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DOCKER_IMAGES.map(img => (
                <div key={img.name} style={{
                  padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gray-100)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <code style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>{img.name}</code>
                      <code style={{ fontSize: 12, color: 'var(--gray-500)', marginLeft: 6 }}>:{img.tag}</code>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', background: 'var(--gray-200)', padding: '2px 8px', borderRadius: 20 }}>{img.size}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Создан {img.created}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ActivityIcon size={16} style={{ stroke: 'var(--gray-500)' }} />
            Архитектура системы
          </span>
        </div>
        <div className="card-body">
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            lineHeight: 1.8,
            color: 'var(--gray-700)',
            background: 'var(--gray-50)',
            padding: 20,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gray-200)',
            whiteSpace: 'pre'
          }}>
{`  Разработчик
      │
      │  git push
      ▼
  GitHub Actions CI/CD
      │
      ├── docker build & push ──► Container Registry
      │
      └── kubectl apply ──────────────────────────────┐
                                                       │
  ┌──────────────── Кластер Kubernetes ────────────── ▼ ───────────────┐
  │                                                                     │
  │  ┌─────────────────┐   ┌──────────────────┐   ┌───────────────┐    │
  │  │  Ingress / LB   │──►│  React Frontend  │   │  PostgreSQL   │    │
  │  │  (nginx)        │   │  Pod (×2)        │   │  StatefulSet  │    │
  │  └─────────────────┘   └────────┬─────────┘   └───────┬───────┘    │
  │                                 │                       │           │
  │                        ┌────────▼──────────────────────┘           │
  │                        │   Node.js Backend Pod (×3)                 │
  │                        │   /api/*  ─►  :5000                        │
  │                        └───────────────────────────────────────────►│
  │                                                                     │
  └─────────────────────────────────────────────────────────────────────┘`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
            {[
              { label: 'Реплики (FE)', value: '2' },
              { label: 'Реплики (BE)', value: '3' },
              { label: 'Лимит CPU', value: '500m' },
              { label: 'Лимит RAM', value: '512Mi' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Infrastructure;
