import React from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  DashboardIcon, TaskIcon, DeployIcon, LogoutIcon, LogoIcon, ServerIcon
} from './Icons';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'tasks', label: 'Tasks', icon: TaskIcon },
  { id: 'deployments', label: 'Deployments', icon: DeployIcon },
  { id: 'infrastructure', label: 'Infrastructure', icon: ServerIcon },
];

const Sidebar = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-accent" />
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <LogoIcon size={20} />
          </div>
          <div>
            <div className="logo-text">DeployKit</div>
            <div className="logo-sub">CI/CD Platform</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ marginTop: 8 }}>
          <LogoutIcon />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
