import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DoctorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const loggedIn = localStorage.getItem('user');
    if (!loggedIn) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(loggedIn);
    if (parsed.role !== 'doctor') {
      navigate('/patient-portal');
      return;
    }
    setUser(parsed);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return <div style={{color:'white'}}>Loading...</div>;

  return (
    <div style={{minHeight: '100vh', padding: '2rem', position: 'relative'}}>
      <div className="glass-overlay"></div>
      <div style={{position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', color: '#fff'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
            <h1 className="title" style={{fontSize: '3rem'}}>Welcome, Dr. <span className="gradient-text">{user.name}</span></h1>
            <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
        
        <div className="glass-card" style={{padding: '2rem', marginBottom: '2rem'}}>
          <h2>Doctor Profile</h2>
          <hr style={{opacity: 0.2, margin: '1rem 0'}} />
          <p><strong>Hospital Name:</strong> {user.hospital_name}</p>
          <p><strong>Aadhar No:</strong> {user.aadhar_no}</p>
          <p><strong>Mobile No:</strong> {user.mobile_no}</p>
          <p><strong>Location:</strong> {user.city}, {user.district}, {user.state}</p>
        </div>

        <div className="glass-card" style={{padding: '2rem'}}>
            <h2>Medical History Manager</h2>
            <hr style={{opacity: 0.2, margin: '1rem 0'}} />
            <p>Ready to look up patients and author medical records. Ensure your connection to Supabase is active to proceed!</p>
        </div>
      </div>
    </div>
  );
}
