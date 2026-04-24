import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Portal3DBackground from '../components/Portal3DBackground.jsx';
import PortalNavbar from '../components/PortalNavbar.jsx';
import { supabase } from '../supabaseClient.js';
import { decodeData, maskAadhar } from '../src/utils/privacy.js';

const AI_BACKEND_URL = 'http://localhost:5000';

export default function PatientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activePrescriptions, setActivePrescriptions] = useState([]); // grouped by record
  const [terminatedIds, setTerminatedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terminated_rx') || '[]'); } catch { return []; }
  });

  // ── AI Chat State ──
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recommendedDocs, setRecommendedDocs] = useState([]);
  const [detectedDiseases, setDetectedDiseases] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('user');
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(loggedIn);
    if (parsed.role !== 'patient') {
      navigate('/doctor-portal');
      return;
    }
    setUser(parsed);
    fetchRecords(parsed.aadhar_no);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchRecords = async (aadhar) => {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_aadhar_no', aadhar)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRecords(data);
      computeActiveMedicines(data);
    }
    setLoadingRecords(false);
  };

  const computeActiveMedicines = (history, terminated = terminatedIds) => {
    const groups = [];
    const now = new Date().setHours(0, 0, 0, 0);

    history.forEach(record => {
      // Skip if patient already terminated this prescription
      if (terminated.includes(record.id)) return;

      if (record.prescription && record.prescription.startsWith('[')) {
        try {
          const parsedRx = JSON.parse(record.prescription);
          const activeMeds = [];

          parsedRx.forEach(med => {
            const startDate = new Date(med.startDate || record.created_at);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (med.durationDays || 1));

            if (endDate.getTime() >= now) {
              const diffTime = endDate.getTime() - new Date().getTime();
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              activeMeds.push({ ...med, daysLeft: daysLeft > 0 ? daysLeft : 0 });
            }
          });

          if (activeMeds.length > 0) {
            groups.push({
              recordId: record.id,
              doctorName: record.doctor_name || 'Unknown Doctor',
              hospitalName: record.hospital_name || 'Horizon Healthcare',
              date: record.created_at,
              medicines: activeMeds
            });
          }
        } catch (e) {}
      }
    });
    setActivePrescriptions(groups);
  };

  const handleTerminate = (recordId) => {
    if (!window.confirm('Are you sure you want to remove this prescription from your Dosage Tracker? Your medical history will remain unchanged.')) return;
    const updated = [...terminatedIds, recordId];
    setTerminatedIds(updated);
    localStorage.setItem('terminated_rx', JSON.stringify(updated));
    // Re-compute with new terminated list
    computeActiveMedicines(records, updated);
  };

  const handlePrint = (id) => {
    const el = document.getElementById(`record-${id}`);
    if (el) {
      document.body.classList.add('is-printing');
      el.classList.add('print-focus');
      window.print();
      el.classList.remove('print-focus');
      document.body.classList.remove('is-printing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // ── AI Chat Logic ──
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = { role: 'user', content: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`${AI_BACKEND_URL}/api/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhar_no: user.aadhar_no,
          question: userMsg.content
        })
      });

      if (!res.ok) throw new Error('Backend error');

      const data = await res.json();
      const aiMsg = { role: 'ai', content: data.ai_response };
      setMessages(prev => [...prev, aiMsg]);

      if (data.recommended_doctors?.length) {
        setRecommendedDocs(data.recommended_doctors);
      }
      if (data.diseases_detected?.length) {
        setDetectedDiseases(data.diseases_detected);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '⚠️ Unable to connect to the AI assistant. Please make sure the backend server is running on port 5000 and try again.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen && messages.length === 0) {
      // Welcome message
      setMessages([{
        role: 'ai',
        content: `👋 Hello ${user?.name || 'there'}! I'm your Horizon AI Health Assistant.\n\nI have access to your complete medical history and can help you with:\n• **Temporary remedies** for your symptoms\n• **Health advice** based on your past records\n• **Doctor recommendations** near your location\n\n⚕️ _Please note: My advice is for temporary relief only. Always consult a qualified doctor for proper diagnosis and treatment._\n\nHow can I help you today?`
      }]);
    }
  };

  // ── Format AI text with markdown-like rendering ──
  const formatAIText = (text) => {
    // Split by lines
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold markers **text**
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic markers _text_ or *text*
      formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
      // Bullet points
      if (formatted.trim().startsWith('•') || formatted.trim().startsWith('-') || formatted.trim().startsWith('*')) {
        return <div key={i} className="ai-bullet" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (formatted.trim() === '') return <br key={i} />;
      return <p key={i} className="ai-paragraph" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  if (!user) return <div style={{color:'white'}}>Loading...</div>;

  return (
    <div style={{minHeight: '100vh', position: 'relative'}}>
      <Portal3DBackground type="patient" />
      <div className="glass-overlay" />

      {/* Shared Navbar */}
      <PortalNavbar user={user} role="patient" activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="portal-page-content">

        {/* ══════════ DASHBOARD TAB ══════════ */}
        {activeTab === 'dashboard' && (
        <div style={{color: '#fff'}}>
          <div className="portal-page-header">
            <div>
              <h1 className="title" style={{fontSize: '2.5rem', marginBottom: '0.4rem'}}>
                Welcome, <span className="gradient-text">{user.name}</span>
              </h1>
              <p style={{color: 'var(--text-secondary)'}}>Your personal health dashboard</p>
            </div>
          </div>

          <div className="glass-card" style={{padding: '2rem', marginBottom: '2rem'}}>
          <h2>Your Profile</h2>
          <hr style={{opacity: 0.2, margin: '1rem 0'}} />
            <div className="portal-profile-grid">
              <div className="portal-profile-item">
                <span className="portal-profile-label">Aadhar No.</span>
                <span className="portal-profile-value">{maskAadhar(decodeData(user.aadhar_no) || user.aadhar_no)}</span>
              </div>
              <div className="portal-profile-item">
                <span className="portal-profile-label">Mobile</span>
                <span className="portal-profile-value">{decodeData(user.mobile_no) || user.mobile_no}</span>
              </div>
              <div className="portal-profile-item">
                <span className="portal-profile-label">Location</span>
                <span className="portal-profile-value">{user.city}, {user.district}, {user.state}</span>
              </div>
            </div>
          </div>

          {/* ACTIVE DOSAGE TRACKER */}
          <div className="glass-card" style={{padding: '2rem', marginBottom: '2rem'}}>
            <h2><span style={{fontSize: '1.4rem', marginRight: '0.5rem'}}>⏱️</span>Active Dosage Tracker</h2>
            <hr style={{opacity: 0.2, margin: '1rem 0 1.5rem'}} />

            {loadingRecords ? (
              <p style={{color: 'rgba(255,255,255,0.5)'}}>Checking active medications...</p>
            ) : activePrescriptions.length === 0 ? (
              <div style={{background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '8px', textAlign: 'center'}}>
                <p style={{color: 'rgba(255,255,255,0.5)', margin: 0}}>You have no active medications in your tracker.</p>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {activePrescriptions.map((rx) => (
                  <div key={rx.recordId} style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>

                    {/* Prescription Header — Doctor Info */}
                    <div style={{
                      background: 'linear-gradient(90deg, rgba(0,240,255,0.1), rgba(139,92,246,0.08))',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      padding: '1rem 1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', flexShrink: 0
                        }}>🩺</div>
                        <div>
                          <div style={{color: '#00f0ff', fontWeight: 700, fontSize: '1rem'}}>Dr. {rx.doctorName}</div>
                          <div style={{color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem'}}>{rx.hospitalName} · {new Date(rx.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTerminate(rx.recordId)}
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: '#f87171',
                          padding: '0.4rem 1rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                      >
                        ✕ Terminate Prescription
                      </button>
                    </div>

                    {/* Medicines List */}
                    <div style={{padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                      {rx.medicines.map((med, mi) => (
                        <div key={mi} style={{
                          background: 'rgba(255,255,255,0.04)',
                          borderLeft: '3px solid #10b981',
                          padding: '0.9rem 1rem',
                          borderRadius: '0 8px 8px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <div>
                            <div style={{color: '#10b981', fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem'}}>💊 {med.name}</div>
                            <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.4rem'}}>{med.instruction}</div>
                            <div style={{display: 'flex', gap: '0.4rem', flexWrap: 'wrap'}}>
                              {med.timings?.morning && <span style={{background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.2)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600}}>🌅 Morning</span>}
                              {med.timings?.afternoon && <span style={{background: 'rgba(255,200,0,0.1)', border: '1px solid rgba(255,200,0,0.2)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600}}>☀️ Afternoon</span>}
                              {med.timings?.night && <span style={{background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600}}>🌙 Night</span>}
                              {!med.timings?.morning && !med.timings?.afternoon && !med.timings?.night && (
                                <span style={{background: 'rgba(255,255,255,0.07)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600}}>As Required</span>
                              )}
                            </div>
                          </div>
                          <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#10b981',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '20px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>
                            {med.daysLeft} Day{med.daysLeft !== 1 ? 's' : ''} Left
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick action */}
          <div className="portal-quick-actions">
            <button className="portal-quick-btn" onClick={() => setActiveTab('history')}>
              <span className="pqa-icon">📋</span>
              <span className="pqa-label">View My Records</span>
              <span className="pqa-arrow">→</span>
            </button>
          </div>
        </div>
        )}

        {/* ══════════ HISTORY TAB ══════════ */}
        {activeTab === 'history' && (
        <div style={{color: '#fff'}}>
          <div className="portal-page-header">
            <h1 className="title" style={{fontSize: '2.2rem'}}>My Medical <span className="gradient-text">History</span></h1>
          </div>

          <div className="glass-card" style={{padding: '2rem'}}>
            <h2>Your Medical Records</h2>
            <hr style={{opacity: 0.2, margin: '1rem 0'}} />
            
            {loadingRecords ? (
               <p>Loading records...</p>
            ) : records.length === 0 ? (
               <p>No medical records found on your profile.</p>
            ) : (
               <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                 {records.map(r => (
                   <div key={r.id} id={`record-${r.id}`} className="record-card" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px'}}>
                     <div className="print-header" style={{display: 'none'}}> Horizon Health - Official Prescription </div>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}} className="record-meta">
                       <div>
                         <span style={{color: '#00f0ff', fontWeight: 'bold', display: 'block', fontSize: '1.1rem'}}>Dr. {r.doctor_name || 'Unknown'}</span>
                         <span style={{color: '#ccc', fontSize: '0.85rem'}}>{r.hospital_name || 'Horizon Healthcare'}</span>
                       </div>
                       <div style={{textAlign: 'right'}}>
                         <span style={{color: '#ccc', fontSize: '0.9rem', display: 'block'}}>{new Date(r.created_at).toLocaleDateString()}</span>
                         <button onClick={() => handlePrint(r.id)} className="btn-glow print-btn" style={{marginTop: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem'}}>Print Prescription</button>
                       </div>
                     </div>
                     <div className="record-content">
                       <h4 style={{color: '#8b5cf6', marginBottom: '0.5rem', fontSize: '1rem'}}>Clinical Notes</h4>
                       <p style={{lineHeight: '1.6', marginBottom: '1rem', whiteSpace: 'pre-wrap'}}>{r.past_medical_record}</p>
                       
                       {(() => {
                         if (!r.prescription) return null;
                         
                         let parsedRx = null;
                         if (r.prescription.startsWith('[')) {
                           try { parsedRx = JSON.parse(r.prescription); } catch(e){}
                         }

                         if (parsedRx) {
                           return (
                             <>
                               <h4 style={{color: '#10b981', marginBottom: '0.5rem', fontSize: '1rem'}}>Structured Prescription</h4>
                               <div style={{background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', padding: '1rem', borderRadius: '0 8px 8px 0'}}>
                                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                    {parsedRx.map((m, i) => {
                                      const timings = Object.keys(m.timings || {}).filter(k=>m.timings[k]).join(', ');
                                      return (
                                        <li key={i} style={{ color: '#cbd5e1', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                          <strong style={{ color: '#00f0ff' }}>{m.name}</strong> <br/>
                                          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                            [{timings || 'As required'}] — {m.instruction} ({m.durationDays || 5} Days)
                                          </span>
                                        </li>
                                      )
                                    })}
                                  </ul>
                               </div>
                             </>
                           );
                         }

                         return (
                           <>
                             <h4 style={{color: '#10b981', marginBottom: '0.5rem', fontSize: '1rem'}}>Prescription</h4>
                             <div style={{background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', padding: '1rem', borderRadius: '0 8px 8px 0'}}>
                               <p style={{lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{r.prescription}</p>
                             </div>
                           </>
                         );
                       })()}
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
        )}

      </div>{/* end portal-page-content */}

      {/* ═══════════ AI CHAT WIDGET ═══════════ */}

      {/* Floating Chat Button */}
      <button
        id="ai-chat-toggle"
        className={`ai-chat-fab ${chatOpen ? 'active' : ''}`}
        onClick={toggleChat}
        title="AI Health Assistant"
      >
        {chatOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h.01" opacity="0.7"/>
            <path d="M12 10h.01" opacity="0.7"/>
            <path d="M16 10h.01" opacity="0.7"/>
          </svg>
        )}
        {!chatOpen && <span className="fab-pulse"></span>}
      </button>

      {/* Chat Panel */}
      <div className={`ai-chat-panel ${chatOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <div className="ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M16 14H8a6 6 0 0 0-6 6v2h20v-2a6 6 0 0 0-6-6z"/></svg>
            </div>
            <div>
              <h3 style={{margin: 0, fontSize: '0.95rem', fontWeight: 700}}>Horizon AI Assistant</h3>
              <span className="ai-status-dot">● Online</span>
            </div>
          </div>
          <button className="ai-chat-close" onClick={() => setChatOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="ai-disclaimer-banner">
          ⚕️ AI advice is for <strong>temporary relief only</strong>. Always consult a qualified doctor.
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="ai-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </div>
              )}
              <div className={`ai-msg-bubble ${msg.role}`}>
                {msg.role === 'ai' ? formatAIText(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="ai-msg ai">
              <div className="ai-msg-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <div className="ai-msg-bubble ai typing-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Doctors Card */}
          {recommendedDocs.length > 0 && !isTyping && messages.length > 1 && (
            <div className="ai-doctors-card">
              <div className="ai-doctors-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <span>Recommended Specialists Near You</span>
              </div>
              {detectedDiseases.length > 0 && (
                <div className="ai-disease-tags">
                  {detectedDiseases.map((d, i) => (
                    <span key={i} className="ai-disease-tag">{d}</span>
                  ))}
                </div>
              )}
              <div className="ai-doctors-list">
                {recommendedDocs.map((doc, i) => (
                  <div key={i} className="ai-doctor-item">
                    <div className="ai-doctor-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="ai-doctor-details">
                      <strong>{doc.name}</strong>
                      <span className="ai-doctor-spec">{doc.specialization}</span>
                      <span className="ai-doctor-hospital">{doc.hospital_name}</span>
                      <span className="ai-doctor-location">📍 {doc.city}, {doc.state}</span>
                      {doc.mobile_no && <span className="ai-doctor-phone">📞 {doc.mobile_no}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form className="ai-chat-input-area" onSubmit={handleSendMessage}>
          <input
            id="ai-chat-input"
            type="text"
            placeholder="Describe your symptoms or ask a question..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            autoComplete="off"
          />
          <button type="submit" className="ai-send-btn" disabled={isTyping || !inputText.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>

    </div>
  );
}
