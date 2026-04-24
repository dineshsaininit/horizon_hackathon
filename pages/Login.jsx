import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { supabase } from '../supabaseClient.js';
import { encodeData, decodeData, maskAadhar } from '../src/utils/privacy.js';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "../src/firebaseClient.js";

/* ─── Medical 3D Scene (stethoscope ring, pill capsules, heartbeat pulse, molecule) ─── */
function LoginScene({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 22);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const cyan = new THREE.PointLight(0x00f0ff, 120, 60); cyan.position.set(10, 8, 8); scene.add(cyan);
    const purp = new THREE.PointLight(0x8b5cf6, 100, 60); purp.position.set(-10, -6, 6); scene.add(purp);
    const warm = new THREE.PointLight(0x10b981, 80, 50); warm.position.set(0, 12, -4); scene.add(warm);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ── PREMIUM DNA HELIX 3D ────────────────────────────────
    const dnaGroup = new THREE.Group();
    
    // High-fidelity Medical Grade Materials
    const strand1Mat = new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.4,
        metalness: 0.5, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1
    });
    const strand2Mat = new THREE.MeshPhysicalMaterial({
        color: 0x8b5cf6, emissive: 0x8b5cf6, emissiveIntensity: 0.3,
        metalness: 0.5, roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.1
    });
    const bondMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, transparent: true, opacity: 0.3, transmission: 0.9, roughness: 0.2
    });

    const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 16);

    for (let i = -12; i <= 12; i++) {
        const offset = i * 0.8;
        const angle = i * 0.6;
        
        const x1 = Math.cos(angle) * 1.6;
        const z1 = Math.sin(angle) * 1.6;
        
        const x2 = Math.cos(angle + Math.PI) * 1.6;
        const z2 = Math.sin(angle + Math.PI) * 1.6;
        
        // Sphere 1 (Cyan strand)
        const s1 = new THREE.Mesh(sphereGeo, strand1Mat);
        s1.position.set(x1, offset, z1);
        dnaGroup.add(s1);

        // Sphere 2 (Purple strand)
        const s2 = new THREE.Mesh(sphereGeo, strand2Mat);
        s2.position.set(x2, offset, z2);
        dnaGroup.add(s2);
        
        // Connecting Bond
        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.set(0, offset, 0);
        bond.rotation.y = -angle;
        bond.rotation.x = Math.PI / 2;
        dnaGroup.add(bond);
    }
    
    // Ambient Dust/Sparkles encompassing the DNA
    const sparkleGeo = new THREE.BufferGeometry();
    const sparkles = [];
    for(let i=0; i<350; i++) {
        sparkles.push((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 8);
    }
    sparkleGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkles, 3));
    const sparkleMat = new THREE.PointsMaterial({
        color: 0x00f0ff, size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    });
    dnaGroup.add(new THREE.Points(sparkleGeo, sparkleMat));

    dnaGroup.scale.set(0.65, 0.65, 0.65);
    dnaGroup.position.set(-6, 0, 0); // Pull to the left side of the screen
    masterGroup.add(dnaGroup);

    // ── 6. STAR FIELD PARTICLES ───────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 600; i++) {
      starPos.push((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40 - 10);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.25 })));

    // Mouse parallax
    let mouseX = 0, mouseY = 0, tMX = 0, tMY = 0;
    const onMouse = e => {
      tMX = (e.clientX / window.innerWidth - 0.5) * 2;
      tMY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    const clock = new THREE.Clock();
    let hbT = 0;
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mouseX += (tMX - mouseX) * 0.04;
      mouseY += (tMY - mouseY) * 0.04;
      masterGroup.rotation.x = mouseY * 0.04;
      masterGroup.rotation.y = mouseX * 0.06;

      // DNA smooth cinematic animation
      dnaGroup.rotation.y = t * 0.35; // Continuous majestic rotation
      dnaGroup.position.y = Math.sin(t * 1.5) * 0.4; // Floating up and down gently
      dnaGroup.rotation.x = Math.sin(t * 0.4) * 0.08; // Subtle tilt

      const dnaDust = dnaGroup.children[dnaGroup.children.length - 1]; // Dust particles
      if (dnaDust) {
          dnaDust.rotation.y = t * -0.1; // Dust counter-rotation
      }

      renderer.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, []);

  return null;
}

/* ─── Main Login Component ─── */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const requestedRole = new URLSearchParams(location.search).get('role');
  const [role, setRole] = useState(requestedRole || 'patient');
  const [step, setStep] = useState('aadhar'); // 'aadhar' or 'otp'
  const [aadhar, setAadhar] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSentTo, setOtpSentTo] = useState('');
  const [userData, setUserData] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fade-in on mount — avoids flash of old page content
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  }, []);

  useEffect(() => {
    if (requestedRole) setRole(requestedRole);
    setError('');
    setStep('aadhar');
    setAadhar('');
  }, [requestedRole]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (aadhar.length !== 12) {
      setError('Aadhar Number must be exactly 12 digits long.');
      return;
    }
    setError('');
    setLoading(true);
    let table = 'patients';
    if (role === 'doctor') table = 'doctors';
    if (role === 'government') table = 'governments';
    
    try {
      const encodedAadhar = encodeData(aadhar);

      const { data, error: dbErr } = await supabase
        .from(table)
        .select('*')
        .eq('aadhar_no', encodedAadhar)
        .single();

      if (dbErr || !data) {
        setError('No account found with this Aadhar number.');
        setLoading(false);
        return;
      }

      setUserData(data);
      const decodedMobile = decodeData(data.mobile_no) || data.mobile_no;
      if (!decodedMobile || decodedMobile.length < 10) {
        setError('Recorded mobile number is invalid.');
        setLoading(false);
        return;
      }

      const formattedPhone = '+91' + decodedMobile.slice(-10); // Standardize to India for demo
      setOtpSentTo(decodedMobile.slice(-4));

      const confirmation = await signInWithPhoneNumber(firebaseAuth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Firebase Auth Error: ' + (err.message || 'Trial failed. Try later.'));
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await confirmationResult.confirm(enteredOtp);
      // Success!
      localStorage.setItem('user', JSON.stringify({ ...userData, role }));
      if (role === 'government') navigate('/government-portal');
      else if (role === 'doctor') navigate('/doctor-portal');
      else navigate('/patient-portal');
    } catch (err) {
      console.error(err);
      setError('Invalid OTP code. Please check and try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      overflow: 'hidden', background: 'var(--bg-color)',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease'
    }}>
      {/* 3D medical canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      />
      <LoginScene canvasRef={canvasRef} />

      {/* Radial vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(3,6,20,0.75) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Back link */}
      <Link to="/" style={{
        position: 'absolute', top: '1.8rem', left: '2rem', zIndex: 10,
        color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600,
        transition: 'color 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      {/* Logo */}
      <div style={{
        position: 'absolute', top: '1.6rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.55rem'
      }}>
        <div style={{
          background: 'var(--accent-cyan)', color: 'var(--bg-color)',
          width: 30, height: 30, borderRadius: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem'
        }}>H</div>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>
          Horizon Health
        </span>
      </div>

      {/* Card */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(6, 10, 28, 0.78)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 24,
          padding: '2.8rem 2.4rem',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 60px rgba(0,240,255,0.07), inset 0 1px 0 rgba(255,255,255,0.06)'
        }}>
          {/* Role toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            borderRadius: 12, padding: 4, marginBottom: '2rem',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            {[
              { label: '👤 Patient', value: 'patient' },
              { label: '🩺 Doctor', value: 'doctor' },
              { label: '🏛️ Govt.', value: 'government' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setRole(opt.value); setError(''); }}
                style={{
                  flex: 1, padding: '0.65rem',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.88rem',
                  transition: 'all 0.25s ease',
                  background: role === opt.value
                    ? 'linear-gradient(135deg, rgba(0,240,255,0.18), rgba(139,92,246,0.18))'
                    : 'transparent',
                  color: role === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: role === opt.value ? '0 0 20px rgba(0,240,255,0.15)' : 'none',
                  borderColor: role === opt.value ? 'rgba(0,240,255,0.3)' : 'transparent',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.8rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Custom Branding Injection */}
            <img 
               src="/logo.png" 
               alt="Horizon Identity" 
               style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem', dropShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }} 
            />

            <div style={{
              fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase',
              color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.5rem'
            }}>
              Horizon Health Portal
            </div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.9rem',
              color: '#fff', lineHeight: 1.2
            }}>
              {role === 'doctor' ? 'Doctor' : role === 'government' ? 'Government' : 'Patient'}{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Login</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginTop: '0.4rem' }}>
              {step === 'aadhar' 
                ? (role === 'doctor' ? 'Access your clinical dashboard and patient records' : role === 'government' ? 'Access predictive disease outbreak analytics' : 'View your health records and AI insights')
                : `Enter the 6-digit code sent to ******${otpSentTo}`
              }
            </p>
          </div>

          <div id="recaptcha-container"></div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '0.85rem 1rem', color: '#fca5a5',
              fontSize: '0.84rem', marginBottom: '1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={step === 'aadhar' ? handleRequestOtp : handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {step === 'aadhar' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                  AADHAR NUMBER
                </label>
                <input
                  type="text"
                  value={aadhar}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, ''); // Only digits
                    if (val.length <= 12) setAadhar(val);
                  }}
                  placeholder="Enter 12-digit Aadhar no."
                  required
                  maxLength="12"
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff', fontSize: '0.95rem',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', fontWeight: 600, letterSpacing: '0.3px', textAlign: 'center' }}>
                  6-DIGIT OTP
                </label>
                <input
                  type="text"
                  value={enteredOtp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setEnteredOtp(val);
                  }}
                  placeholder="• • • • • •"
                  required
                  maxLength="6"
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff', fontSize: '1.4rem', letterSpacing: '0.8rem', textAlign: 'center',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.95rem',
                marginTop: '0.4rem',
                borderRadius: 12, border: '1px solid rgba(0,240,255,0.35)',
                background: loading
                  ? 'rgba(0,240,255,0.05)'
                  : 'linear-gradient(135deg, rgba(0,240,255,0.18) 0%, rgba(139,92,246,0.18) 100%)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 30px rgba(0,240,255,0.2)',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.3),rgba(139,92,246,0.3))'; e.target.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if (!loading) { e.target.style.background = 'linear-gradient(135deg, rgba(0,240,255,0.18),rgba(139,92,246,0.18))'; e.target.style.transform = 'none'; } }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {step === 'aadhar' ? 'Sending SMS...' : 'Verifying...'}
                </>
              ) : (
                <>
                  {step === 'aadhar' ? 'Request OTP via SMS' : `Sign In to Portal`}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
            {step === 'otp' && !loading && (
               <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                 Didn't receive it? <span onClick={() => { setStep('aadhar'); setEnteredOtp(''); }} style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>Change Aadhar / Retry</span>
               </div>
            )}
          </form>

          {/* Switch role hint */}
          <p
            style={{ textAlign: 'center', marginTop: '1.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
            onClick={() => { setRole(role === 'patient' ? 'doctor' : 'patient'); setError(''); }}
          >
            {role === 'patient'
              ? <>Are you a doctor? <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Switch to Doctor Login →</span></>
              : <>Are you a patient? <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Switch to Patient Login →</span></>
            }
          </p>

          {/* Trust indicators */}
          <div style={{
            marginTop: '1.6rem', paddingTop: '1.2rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'center', gap: '1.5rem'
          }}>
            {[
              { icon: '🔒', label: 'End-to-End Encrypted' },
              { icon: '🏥', label: 'HIPAA Compliant' },
              { icon: '⚡', label: 'Instant Access' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{icon}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.3px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
