import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InteractiveGlobe from '../components/InteractiveGlobe.jsx';

export default function HealthMap() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#030614' }}>

      {/* Background Interactive Globe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <InteractiveGlobe onMarkerClick={(data) => setSelectedLocation(data)} focusTarget={focusTarget} />
      </div>

      <div className="glass-overlay"></div>

      {/* Basic Navbar for the Map */}
      <nav className="navbar" style={{ zIndex: 10, position: 'absolute', width: '100vw' }}>
        <div className="logo">
          <span className="logo-icon">H</span>orizon Health Map
        </div>
        <div className="auth-buttons">
          <button
            onClick={() => setFocusTarget(focusTarget === 'india' ? null : 'india')}
            className="btn-glow"
            style={{ marginRight: '1rem', background: focusTarget === 'india' ? 'rgba(0, 240, 255, 0.4)' : 'transparent' }}
          >
            {focusTarget === 'india' ? 'Unfocus Map' : 'Isolate India 🇮🇳'}
          </button>
          <Link to="/" className="btn-clean" style={{ color: '#fff' }}>← Back Home</Link>
        </div>
      </nav>

      {/* Floating UI HUD */}
      <div style={{ position: 'absolute', top: '100px', left: '2rem', zIndex: 5, color: '#fff', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Global <span className="gradient-text">Outbreak Radar</span></h1>
        <p style={{ color: '#94a3b8', maxWidth: '400px' }}>Rotate the globe and click on any glowing red hotspot or marker to instantly retrieve real-time epidemiology statistics in that district.</p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff0000', boxShadow: '0 0 10px #ff0000' }}></div>
            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Critical (&gt;40 Cases)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbb00' }}></div>
            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Warning (&lt;40 Cases)</span>
          </div>
        </div>
      </div>

      {/* Dynamic Details Panel Overlay */}
      {selectedLocation && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '5%',
          transform: 'translateY(-50%)',
          width: '350px',
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${selectedLocation.status === 'CRITICAL' ? 'rgba(255,0,0,0.3)' : 'rgba(255,187,0,0.3)'}`,
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: `0 20px 40px rgba(0,0,0,0.5)`,
          color: '#fff',
          animation: 'fadeUp 0.3s ease-out forwards'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <span style={{
                background: selectedLocation.status === 'CRITICAL' ? 'rgba(255,0,0,0.2)' : 'rgba(255,187,0,0.2)',
                color: selectedLocation.status === 'CRITICAL' ? '#ff4444' : '#ffbb00',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}>
                {selectedLocation.status}
              </span>
            </div>
            <button onClick={() => setSelectedLocation(null)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>

          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{selectedLocation.city}</h2>
          <p style={{ color: '#00f0ff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>{selectedLocation.disease} Outbreak</p>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8' }}>Active Cases</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#ff4444' }}>{selectedLocation.cases}</span>
          </div>

          <div>
            <h4 style={{ color: '#ccc', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>AI Recommended Action</h4>
            <p style={{ lineHeight: '1.5', fontSize: '0.95rem', color: '#fff' }}>{selectedLocation.recommendations}</p>
          </div>

          <button className="btn-glow" style={{ width: '100%', marginTop: '2rem' }}>Dispatch Resources</button>
        </div>
      )}

    </div>
  );
}
