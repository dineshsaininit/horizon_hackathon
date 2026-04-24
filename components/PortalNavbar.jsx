import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PortalNavbar({ user, role, activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const doctorTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'records',   label: 'Med Records', icon: '📋' },
    { id: 'aqi',       label: 'AQI Monitor', icon: '🌡️' },
  ];

  const patientTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'history',   label: 'My Records', icon: '📋' },
  ];

  const govtTabs = [
    { id: 'dashboard', label: 'Outbreak Analytics', icon: '📈' },
    { id: 'map',       label: 'Interactive Map', icon: '🌍' },
  ];

  let tabs = patientTabs;
  if (role === 'doctor') tabs = doctorTabs;
  if (role === 'government') tabs = govtTabs;

  return (
    <nav className="portal-navbar">
      {/* Logo */}
      <div className="portal-nav-logo" onClick={() => navigate('/')}>
        <div className="logo-icon">H</div>
        <span className="gradient-text" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem' }}>
          Horizon
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px', alignSelf: 'flex-end', marginBottom: '3px' }}>
          {role === 'doctor' ? 'Doctor Portal' : role === 'government' ? 'Government Portal' : 'Patient Portal'}
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="portal-nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`portal-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="portal-nav-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'aqi' && <span className="aqi-badge-dot" />}
          </button>
        ))}
      </div>

      {/* User Info + Logout */}
      <div className="portal-nav-user">
        <div className="portal-nav-avatar">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="portal-nav-userinfo">
          <span className="portal-nav-name">{user?.name || 'User'}</span>
          <span className="portal-nav-role">{role === 'doctor' ? '🩺 Doctor' : role === 'government' ? '🏛️ Official' : '👤 Patient'}</span>
        </div>
        <button className="portal-nav-logout" onClick={handleLogout} title="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
