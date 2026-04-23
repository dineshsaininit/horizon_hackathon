import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Portal3DBackground from '../components/Portal3DBackground.jsx';
import PortalNavbar from '../components/PortalNavbar.jsx';
import { supabase } from '../supabaseClient.js';

const AI_BACKEND_URL = 'http://localhost:5000';

export default function PatientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

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
    }
    setLoadingRecords(false);
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
                       
                       {r.prescription && (
                         <>
                           <h4 style={{color: '#10b981', marginBottom: '0.5rem', fontSize: '1rem'}}>Prescription</h4>
                           <div style={{background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', padding: '1rem', borderRadius: '0 8px 8px 0'}}>
                             <p style={{lineHeight: '1.6', whiteSpace: 'pre-wrap'}}>{r.prescription}</p>
                           </div>
                         </>
                       )}
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
