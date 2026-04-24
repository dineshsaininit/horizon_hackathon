import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Portal3DBackground from '../components/Portal3DBackground.jsx';
import PortalNavbar from '../components/PortalNavbar.jsx';
import AQIMonitor from '../components/AQIMonitor.jsx';
import { supabase } from '../supabaseClient.js';
import { encodeData, decodeData, maskAadhar } from '../src/utils/privacy.js';

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recordSubTab, setRecordSubTab] = useState('view'); // 'view' | 'create'

  // Patient search state
  const [searchAadhar, setSearchAadhar] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  
  // View Records state
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create Record state
  const [medicalRecord, setMedicalRecord] = useState('');
  const [dbMedicines, setDbMedicines] = useState([]);
  
  // Structured Prescription Builder state
  const [prescriptionList, setPrescriptionList] = useState([]);
  const [medName, setMedName] = useState('');
  const [medTimings, setMedTimings] = useState({ morning: false, afternoon: false, night: false });
  const [medInstruction, setMedInstruction] = useState('After Food');
  const [medDuration, setMedDuration] = useState(5);

  useEffect(() => {
    const loggedIn = localStorage.getItem('user');
    if (!loggedIn) { navigate('/login'); return; }
    const parsed = JSON.parse(loggedIn);
    if (parsed.role !== 'doctor') { navigate('/patient-portal'); return; }
    setUser(parsed);
    fetchDbMedicines();
  }, []);

  const fetchDbMedicines = async () => {
    try {
      const { data } = await supabase.from('medicines').select('*').order('name');
      if (data) setDbMedicines(data);
    } catch (e) {
      console.warn("Could not fetch medicines list. Using empty list.", e);
    }
  };

  const handleSearchPatient = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundPatient(null);
    setSubmitStatus('');
    setPatientHistory([]);
    if (!searchAadhar || searchAadhar.length !== 12) {
      setSearchError('Aadhar Number must be exactly 12 digits long.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_no', encodeData(searchAadhar))
        .single();
      if (error || !data) {
        setSearchError('Patient not found with that Aadhar number.');
      } else {
        setFoundPatient(data);
        fetchPatientHistory(data.aadhar_no);
      }
    } catch { setSearchError('Network error connecting to database.'); }
  };

  const fetchPatientHistory = async (patientAadhar) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_aadhar_no', patientAadhar)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setPatientHistory(data);
      }
    } catch {
      console.error('Failed to fetch patient history');
    }
    setLoadingHistory(false);
  };

  const addMedicineToPrescription = async () => {
    if (!medName.trim()) return;

    // Check if medicine is in DB, if not add it quietly
    const exists = dbMedicines.find(m => m.name.toLowerCase() === medName.trim().toLowerCase());
    if (!exists) {
      try {
        await supabase.from('medicines').insert([{ name: medName.trim() }]);
        fetchDbMedicines(); // Refresh list silently
      } catch (e) {
        console.warn("Could not insert new medicine", e);
      }
    }

    const newMed = {
      name: medName.trim(),
      timings: { ...medTimings },
      instruction: medInstruction,
      durationDays: parseInt(medDuration) || 5,
      startDate: new Date().toISOString()
    };

    setPrescriptionList([...prescriptionList, newMed]);
    
    // Reset builder inputs
    setMedName('');
    setMedTimings({ morning: false, afternoon: false, night: false });
    setMedInstruction('After Food');
    setMedDuration(5);
  };

  const handleMedNameKeyDown = (e) => {
    if (e.key === 'Tab' && medName.trim().length > 0) {
      e.preventDefault();
      const val = medName.toLowerCase();
      // Find the first medicine that starts with what we typed
      const match = dbMedicines.find(m => m.name.toLowerCase().startsWith(val));
      if (match) {
        setMedName(match.name);
      }
    }
  };

  const removeMedicine = (index) => {
    const list = [...prescriptionList];
    list.splice(index, 1);
    setPrescriptionList(list);
  };

  const toggleTiming = (timeKey) => {
    setMedTimings(prev => ({ ...prev, [timeKey]: !prev[timeKey] }));
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setSubmitStatus('');
    if (!medicalRecord || !foundPatient) return;

    // Use JSON to allow patient portal to parse and track active medications
    let formattedPrescription = "";
    if (prescriptionList.length > 0) {
      formattedPrescription = JSON.stringify(prescriptionList);
    }

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
          prescription: formattedPrescription
        }]);
      if (error) setSubmitStatus('Error submitting record.');
      else {
        setSubmitStatus('Record safely secured & documented!');
        setMedicalRecord('');
        setPrescriptionList([]);
        setRecordSubTab('view'); // Switch back to view mode
        fetchPatientHistory(foundPatient.aadhar_no); // Refresh history
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
                  <span className="portal-profile-value">{maskAadhar(decodeData(user.aadhar_no) || user.aadhar_no)}</span>
                </div>
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Specialization</span>
                  <span className="portal-profile-value">{user.specialization || 'Consultant'}</span>
                </div>
                <div className="portal-profile-item">
                  <span className="portal-profile-label">Location</span>
                  <span className="portal-profile-value">{user.city}, {user.state}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ MED RECORDS TAB ══════════ */}
        {activeTab === 'records' && (
          <div style={{ color: '#fff' }}>
            <div className="portal-page-header">
              <h1 className="title" style={{ fontSize: '2.2rem' }}>Medical History <span className="gradient-text">Manager</span></h1>
            </div>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* --- 1. SEARCH SECTION --- */}
              <div>
                <h2 style={{ marginBottom: '1rem' }}>Search Patient</h2>
                <form onSubmit={handleSearchPatient} style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Enter 12-digit Patient Aadhar No."
                    value={searchAadhar}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Digits only
                      if (val.length <= 12) setSearchAadhar(val);
                    }}
                    maxLength="12"
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                  />
                  <button type="submit" className="btn-glow">Search</button>
                </form>
                {searchError && <p style={{ color: '#ff4444', marginTop: '1rem' }}>{searchError}</p>}
              </div>

              {/* --- 2. PATIENT FOUND & TOGGLE --- */}
              {foundPatient && (
                <>
                  <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '1.2rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: 0, color: '#fff' }}>
                      Patient: <span className="gradient-text" style={{ fontSize: '1.4rem' }}>{foundPatient.name}</span>
                    </h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      Aadhar: {maskAadhar(decodeData(foundPatient.aadhar_no) || foundPatient.aadhar_no)} | Tel: {decodeData(foundPatient.mobile_no) || foundPatient.mobile_no} | {foundPatient.city}, {foundPatient.state}
                    </p>
                  </div>

                  {/* Sub-Tab Toggle */}
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
                    <button 
                      onClick={() => setRecordSubTab('view')}
                      style={{ 
                        flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                        background: recordSubTab === 'view' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                        color: recordSubTab === 'view' ? '#fff' : 'rgba(255,255,255,0.5)',
                        border: recordSubTab === 'view' ? '1px solid rgba(0,240,255,0.4)' : '1px solid transparent'
                      }}
                    >
                      👁️ View History
                    </button>
                    <button 
                      onClick={() => setRecordSubTab('create')}
                      style={{ 
                        flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                        background: recordSubTab === 'create' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: recordSubTab === 'create' ? '#fff' : 'rgba(255,255,255,0.5)',
                        border: recordSubTab === 'create' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent'
                      }}
                    >
                      ✍️ Create New Record
                    </button>
                  </div>

                  {/* --- 3A. VIEW HISTORY MODE --- */}
                  {recordSubTab === 'view' && (
                    <div>
                      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Past Medical Records</h3>
                      {loadingHistory ? (
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading history...</p>
                      ) : patientHistory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {patientHistory.map(record => {
                            // Privacy Logic: Hide other doctor names
                            const isMyRecord = record.doctor_aadhar_no === user.aadhar_no;
                            const displayDoctorName = isMyRecord ? record.doctor_name : 'Classified (Other Doctor)';
                            const displayHospital = isMyRecord ? record.hospital_name : 'Classified Hospital';
                            
                            // Try parsing json
                            let parsedRx = null;
                            let rawRxStr = record.prescription || '';
                            if (rawRxStr.startsWith('[')) {
                              try { parsedRx = JSON.parse(rawRxStr); } catch(e){}
                            }
                            
                            return (
                              <div key={record.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                                      {new Date(record.created_at).toLocaleDateString()}
                                    </span>
                                    <span style={{ color: isMyRecord ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                      ⚕️ Treated by: {displayDoctorName} ({displayHospital})
                                    </span>
                                  </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                  <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Notes / Diagnosis</h4>
                                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.6, fontSize: '0.95rem' }}>{record.past_medical_record}</p>
                                </div>
                                {record.prescription && parsedRx ? (
                                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
                                    <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Prescription</h4>
                                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                      {parsedRx.map((med, idx) => {
                                        const timings = Object.keys(med.timings || {}).filter(k=>med.timings[k]).join(', ');
                                        return (
                                          <li key={idx} style={{ color: '#cbd5e1', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{med.name}</span> — [{timings || 'As required'}] — {med.instruction} <em>({med.durationDays} Days)</em>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                ) : record.prescription ? (
                                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
                                    <h4 style={{ color: 'var(--accent-purple)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Prescription</h4>
                                    <pre style={{ margin: 0, color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                      {record.prescription}
                                    </pre>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          No previous medical records found for this patient.
                        </p>
                      )}
                    </div>
                  )}

                  {/* --- 3B. CREATE RECORD MODE --- */}
                  {recordSubTab === 'create' && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-cyan)' }}>New Consultation Record</h3>
                      
                      {/* Clinical Notes */}
                      <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Diagnosis & Clinical Notes *</label>
                        <textarea
                          placeholder="Detailed symptoms, diagnosis, and medical notes..."
                          value={medicalRecord}
                          onChange={(e) => setMedicalRecord(e.target.value)}
                          required
                          rows={4}
                          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                        />
                      </div>

                      {/* Structured Prescription Builder */}
                      <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--accent-purple)' }}>💊 Digital Prescription Builder</h4>
                        
                        {/* Medicine Input Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Medicine Name (Press Tab to Auto-complete)</label>
                            <input
                              type="text"
                              list="medicines-list"
                              placeholder="e.g. Paracetamol 500mg"
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                              onKeyDown={handleMedNameKeyDown}
                              style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                            />
                            <datalist id="medicines-list">
                              {dbMedicines.map(m => <option key={m.id} value={m.name} />)}
                            </datalist>
                          </div>
                          <div>
                            <button 
                              type="button" 
                              onClick={addMedicineToPrescription}
                              disabled={!medName.trim()}
                              style={{ padding: '0.7rem 1.5rem', borderRadius: '6px', border: 'none', background: 'var(--accent-cyan)', color: '#000', fontWeight: 600, cursor: medName.trim() ? 'pointer' : 'not-allowed', opacity: medName.trim() ? 1 : 0.5 }}
                            >
                              + Add
                            </button>
                          </div>
                        </div>

                        {/* Timing & Duration Series */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Dosage Timings</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {['morning', 'afternoon', 'night'].map(timing => (
                                <button
                                  type="button"
                                  key={timing}
                                  onClick={() => toggleTiming(timing)}
                                  style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                    background: medTimings[timing] ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)',
                                    color: medTimings[timing] ? '#fff' : 'rgba(255,255,255,0.4)',
                                    border: medTimings[timing] ? '1px solid var(--accent-purple)' : '1px solid transparent'
                                  }}
                                >
                                  {timing === 'morning' ? '🌅 Morning' : timing === 'afternoon' ? '☀️ Afternoon' : '🌙 Night'}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Duration (Days)</label>
                            <input 
                              type="number"
                              min="1" max="365"
                              value={medDuration}
                              onChange={(e) => setMedDuration(e.target.value)}
                              style={{ width: '80px', padding: '0.45rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Instructions</label>
                            <select 
                              value={medInstruction} 
                              onChange={(e) => setMedInstruction(e.target.value)}
                              style={{ padding: '0.45rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                            >
                              <option value="After Food">After Food</option>
                              <option value="Before Food (Empty Stomach)">Before Food (Empty Stomach)</option>
                              <option value="Do not eat after">Do not eat after</option>
                              <option value="With Water">With Water</option>
                            </select>
                          </div>
                        </div>

                        {/* Staged Prescription List */}
                        {prescriptionList.length > 0 && (
                          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '1rem' }}>
                            <h5 style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.7)' }}>Current Prescription List</h5>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {prescriptionList.map((med, idx) => {
                                const activeTimings = Object.keys(med.timings).filter(k => med.timings[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1));
                                return (
                                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '6px' }}>
                                    <div>
                                      <strong style={{ color: '#00f0ff', fontSize: '1.05rem', marginRight: '0.5rem' }}>{med.name}</strong> 
                                      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                        — {activeTimings.length > 0 ? activeTimings.join(', ') : 'As required'} ({med.instruction}) for {med.durationDays} Days
                                      </span>
                                    </div>
                                    <button onClick={() => removeMedicine(idx)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button onClick={handleAddRecord} className="btn-glow" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={!medicalRecord.trim()}>
                        Lock & Submit Medical Record
                      </button>

                      {submitStatus && (
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold', color: submitStatus.includes('Error') ? '#ff4444' : '#22c55e' }}>
                          {submitStatus}
                        </p>
                      )}
                    </div>
                  )}

                </>
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
