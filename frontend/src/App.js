import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Deployments from './pages/Deployments';
import Infrastructure from './pages/Infrastructure';
import { LoginPage, RegisterPage } from './pages/Auth';
import './index.css';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  deployments: 'Deployments',
  infrastructure: 'Infrastructure',
};

const AppContent = () => {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [authView, setAuthView] = useState('login');

  if (!user) {
    return authView === 'login'
      ? <LoginPage onSwitch={setAuthView} />
      : <RegisterPage onSwitch={setAuthView} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'tasks': return <Tasks />;
      case 'deployments': return <Deployments />;
      case 'infrastructure': return <Infrastructure />;
      default: return <Dashboard onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{PAGE_TITLES[activePage]}</h1>
          <div className="topbar-actions">
            <div style={{
              fontSize: 12,
              color: 'var(--gray-400)',
              background: 'var(--gray-100)',
              padding: '4px 10px',
              borderRadius: 20,
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              v1.0.0
            </div>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
