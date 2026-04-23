import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function Login() {
  const navigate = useNavigate();
  const [isDoctor, setIsDoctor] = useState(false);
  const [aadhar, setAadhar] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const table = isDoctor ? 'doctors' : 'patients';

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('aadhar_no', aadhar)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError('Invalid Aadhar details or password');
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify({ ...data, role: isDoctor ? 'doctor' : 'patient' }));
      
      if (isDoctor) {
        navigate('/doctor-portal');
      } else {
        navigate('/patient-portal');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
      <div className="glass-overlay"></div>
      
      <Link to="/" style={{position: 'absolute', top: '2rem', left: '2rem', zIndex: 2, color: 'white', textDecoration: 'none'}}>← Back Home</Link>

      <div className="glass-card" style={{padding: '3rem', width: '100%', maxWidth: '400px', zIndex: 1}}>
        <h2 style={{textAlign: 'center', marginBottom: '2rem', color: '#fff'}}>{isDoctor ? 'Doctor ' : 'Patient '}<span className="gradient-text">Login</span></h2>
        
        {error && <div style={{background: 'rgba(255, 0, 0, 0.2)', padding: '1rem', borderRadius: '8px', color: '#ff4444', marginBottom: '1.5rem'}}>{error}</div>}

        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: '#fff'}}>Aadhar No</label>
            <input 
              type="text" 
              value={aadhar}
              onChange={(e) => setAadhar(e.target.value)}
              required
              style={{width: '90%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff'}}
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: '0.5rem', color: '#fff'}}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{width: '90%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff'}}
            />
          </div>
          <button type="submit" className="btn-glow" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{textAlign: 'center', marginTop: '2rem', color: '#ccc', cursor: 'pointer'}} onClick={() => setIsDoctor(!isDoctor)}>
          {isDoctor ? 'Are you a patient? Login here.' : 'Are you a doctor? Login here.'}
        </p>
      </div>
    </div>
  );
}
