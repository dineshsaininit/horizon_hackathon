import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Portal3DBackground from '../components/Portal3DBackground.jsx';
import PortalNavbar from '../components/PortalNavbar.jsx';
import AQIMonitor from '../components/AQIMonitor.jsx';
import { supabase } from '../supabaseClient.js';

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Patient search state
  const [searchAadhar, setSearchAadhar] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [medicalRecord, setMedicalRecord] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('user');
    if (!loggedIn) { navigate('/login'); return; }
    const parsed = JSON.parse(loggedIn);
    if (parsed.role !== 'doctor') { navigate('/patient-portal'); return; }
    setUser(parsed);
  }, []);

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundPatient(null);
    setSubmitStatus('');
    if (!searchAadhar) return;
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_no', searchAadhar)
        .single();
      if (error || !data) setSearchError('Patient not found with that Aadhar number.');
      else setFoundPatient(data);
    } catch { setSearchError('Network error connecting to database.'); }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setSubmitStatus('');
    if (!medicalRecord || !foundPatient) return;
    try {
      const { error } = await supabase
        .from('medical_history')
        .insert([{
          patient_name: foundPatient.name,
          patient_aadhar_no: foundPatient.aadhar_no,
          doctor_aadhar_no: user.aadhar_no,
          doctor_name: user.name,
          hospital_name: user.hospital_name,
          past_medical_record: medicalRecord,
          prescription: prescriptionText
        }]);
      if (error) setSubmitStatus('Error submitting record.');
      else {
        setSubmitStatus('Record safely secured & documented!');
        setMedicalRecord('');
        setPrescriptionText('');
      }
    } catch { setSubmitStatus('Network error.'); }
  };

  if (!user) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Portal3DBackground type="doctor" />
      <div className="glass-overlay" />

      {/* Shared Navbar */}
      <PortalNavbar user={user} role="doctor" activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Page Content — offset for fixed navbar */}
      <div className="portal-page-content">

        {/* ══════════ DASHBOARD TAB ══════════ */}
        {activeTab === 'dashboard' && (
          <div style={{ color: '#fff' }}>
            <div className="portal-page-header">
              <div>
                <h1 className="title" style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>
                  Welcome, Dr. <span className="gradient-text">{user.name}</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Here's your clinical overview for today</p>
              </div>
              <div className="portal-stat-chips">
                <div className="portal-stat-chip">
                  <span style={{ color: '#00f0ff', fontSize: '1.4rem', fontWeight: 800 }}>⚕️</span>
                  <span>Active</span>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h2>Doctor Profile</h2>
              <hr style={{ opacity: 0.2, margin: '1rem 0' }} />
              <div className="portal-profile-grid">
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Hospital</span>
                  <span className="portal-profile-value">{user.hospital_name}</span>
                </div>
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Aadhar No.</span>
                  <span className="portal-profile-value">{user.aadhar_no}</span>
                </div>
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Mobile</span>
                  <span className="portal-profile-value">{user.mobile_no}</span>
                </div>
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Location</span>
                  <span className="portal-profile-value">{user.city}, {user.district}, {user.state}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="portal-quick-actions">
              <button className="portal-quick-btn" onClick={() => setActiveTab('records')}>
                <span className="pqa-icon">📋</span>
                <span className="pqa-label">Manage Records</span>
                <span className="pqa-arrow">→</span>
              </button>
              <button className="portal-quick-btn aqi-action" onClick={() => setActiveTab('aqi')}>
                <span className="pqa-icon">🌡️</span>
                <span className="pqa-label">AQI Monitor</span>
                <span className="pqa-arrow">→</span>
                <span className="aqi-badge-pill">Live</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════ MED RECORDS TAB ══════════ */}
        {activeTab === 'records' && (
          <div style={{ color: '#fff' }}>
            <div className="portal-page-header">
              <h1 className="title" style={{ fontSize: '2.2rem' }}>Medical History <span className="gradient-text">Manager</span></h1>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2>Search Patient</h2>
              <hr style={{ opacity: 0.2, margin: '1rem 0' }} />

              <form onSubmit={handleSearchPatient} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input
                  type="text"
                  placeholder="Enter Patient Aadhar No."
                  value={searchAadhar}
                  onChange={(e) => setSearchAadhar(e.target.value)}
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                />
                <button type="submit" className="btn-glow">Search</button>
              </form>

              {searchError && <p style={{ color: '#ff4444', marginBottom: '1rem' }}>{searchError}</p>}

              {foundPatient && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>
                    Patient Found: <span className="gradient-text">{foundPatient.name}</span>
                  </h3>
                  <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                    Location: {foundPatient.city}, {foundPatient.state} | Mobile: {foundPatient.mobile_no}
                  </p>

                  <form onSubmit={handleAddRecord}>
                    <textarea
                      placeholder="Detailed symptoms, diagnosis, and medical notes..."
                      value={medicalRecord}
                      onChange={(e) => setMedicalRecord(e.target.value)}
                      required
                      rows={4}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginBottom: '1rem' }}
                    />
                    <textarea
                      placeholder="Prescriptions (Medicines, Dosages, Instructions)..."
                      value={prescriptionText}
                      onChange={(e) => setPrescriptionText(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginBottom: '1rem' }}
                    />
                    <button type="submit" className="btn-glow" style={{ width: '100%' }}>
                      Lock & Submit Medical Record
                    </button>
                  </form>

                  {submitStatus && (
                    <p style={{ marginTop: '1rem', color: submitStatus.includes('Error') ? '#ff4444' : '#22c55e' }}>
                      {submitStatus}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ AQI TAB ══════════ */}
        {activeTab === 'aqi' && <AQIMonitor />}
      </div>
    </div>
  );
}
