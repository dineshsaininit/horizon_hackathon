import React from 'react';
import { Link } from 'react-router-dom';
import ThreeScene from '../ThreeScene.jsx';

export default function Home() {
  return (
    <>
      <div className="glass-overlay"></div>

      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">H</span>orizon Health
        </div>
        <div className="nav-links">
          <a href="#features" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            Features
          </a>
          <a href="#about" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            About
          </a>
          <a href="#ai-doctor" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            AI Doctor
          </a>
          <a href="/health-map" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Health Map
          </a>
        </div>
        <div className="auth-buttons">
          <a href="/login" className="btn-glow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
            Login
          </a>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <div className="badge">Next Generation Tracking</div>
          <h1 className="title">Healthcare in a <br /><span className="gradient-text">New Dimension</span></h1>
          <p className="subtitle">Experience unparalleled realism and data accuracy. Horizon tracks health and monitors disease progression with interactive, immersive insights specifically designed for modern clinics.</p>

          <div className="metrics-container">
            <div className="metric-card glass-card">
              <span className="metric-value">Maintaining</span>
              <span className="metric-label">Medical Records</span>
            </div>
            <div className="metric-card glass-card">
              <span className="metric-value">AI</span>
              <span className="metric-label">Doctor</span>
            </div>
            <div className="metric-card glass-card">
              <span className="metric-value">Outbreak</span>
              <span className="metric-label">Map</span>
            </div>
          </div>

          <div className="cta-group">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Watch Demo <span className="play-icon">▶</span></button>
          </div>
        </div>
      </main>

      <div className="h-scroll-container">
        <div className="h-scroll-track" id="h-track">
          <section className="h-panel panel-1" id="panel-1">
            <div className="section-content">
              <h2>Maintaining Medical Records</h2>
              <p>Securely store, organize, and access comprehensive patient health records with seamless integration and state-of-the-art encryption.</p>
            </div>
          </section>

          <section className="h-panel panel-2" id="panel-2">
            <div className="section-content">
              <h2>AI Doctor</h2>
              <p>Consult with our advanced AI assistant for immediate diagnostic insights, personalized treatment plans, and continuous 24/7 care monitoring.</p>
            </div>
          </section>

          <section className="h-panel panel-3" id="panel-3">
            <div className="section-content">
              <h2>Outbreak Map</h2>
              <p>Visualize real-time disease spread and predict future hotspots using advanced machine learning algorithms to respond proactively to threats.</p>
            </div>
          </section>
        </div>
      </div>

      <section className="hero end-section">
        <div className="hero-content">
          <h1 className="title">Join the <span className="gradient-text">Future</span></h1>
          <div className="cta-group">
            <a href="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Login</a>
          </div>
        </div>
      </section>

      <ThreeScene />
    </>
  );
}
