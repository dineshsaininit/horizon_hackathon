import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { supabase } from '../supabaseClient.js';

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

    // ── 1. STETHOSCOPE RING (torus + tube arc) ────────────────────────────────
    const stethGroup = new THREE.Group();
    stethGroup.position.set(-7, 3, -2);
    masterGroup.add(stethGroup);

    // Chest piece (disk)
    const chestGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 32);
    const chestMat = new THREE.MeshPhysicalMaterial({
      color: 0xc0c8d8, metalness: 0.95, roughness: 0.05, clearcoat: 1.0
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.rotation.x = Math.PI / 2;
    stethGroup.add(chest);

    // Glowing ring around chest piece
    const chestRingGeo = new THREE.TorusGeometry(0.95, 0.06, 16, 64);
    const chestRingMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.0, metalness: 0.9, roughness: 0.1
    });
    stethGroup.add(new THREE.Mesh(chestRingGeo, chestRingMat));

    // Tubing arc (CatmullRom tube)
    const arcPoints = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const angle = t * Math.PI;
      arcPoints.push(new THREE.Vector3(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5 + 1, 0));
    }
    arcPoints.push(new THREE.Vector3(-2.5, 1, 0), new THREE.Vector3(-2.5, -1.5, 0.5));
    arcPoints.push(new THREE.Vector3(2.5, 1, 0), new THREE.Vector3(2.5, -1.5, 0.5));

    const arcCurve = new THREE.CatmullRomCurve3(arcPoints.slice(0, 41));
    const tubeGeo = new THREE.TubeGeometry(arcCurve, 80, 0.08, 12, false);
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2e, metalness: 0.4, roughness: 0.3, clearcoat: 0.8
    });
    stethGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

    // Earpieces (small spheres)
    const earMat = new THREE.MeshPhysicalMaterial({ color: 0xc0c8d8, metalness: 0.9, roughness: 0.1 });
    const earGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const ear1 = new THREE.Mesh(earGeo, earMat); ear1.position.set(-2.5, -1.5, 0.5);
    const ear2 = new THREE.Mesh(earGeo, earMat); ear2.position.set(2.5, -1.5, 0.5);
    stethGroup.add(ear1, ear2);

    // ── 2. PILL CAPSULE (2 hemisphere + cylinder) ─────────────────────────────
    const pillGroup = new THREE.Group();
    pillGroup.position.set(7, 4, -1);
    pillGroup.rotation.z = Math.PI / 5;
    masterGroup.add(pillGroup);

    const capMat1 = new THREE.MeshPhysicalMaterial({
      color: 0xff6b6b, metalness: 0.2, roughness: 0.3, clearcoat: 1.0, transmission: 0.3, transparent: true, opacity: 0.9
    });
    const capMat2 = new THREE.MeshPhysicalMaterial({
      color: 0xf0f0ff, metalness: 0.1, roughness: 0.2, clearcoat: 1.0, transmission: 0.4, transparent: true, opacity: 0.95
    });

    const cap1Geo = new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap2Geo = new THREE.SphereGeometry(0.7, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.0, 32);

    const cap1 = new THREE.Mesh(cap1Geo, capMat1); cap1.position.y = 1.0;
    const body = new THREE.Mesh(bodyGeo, capMat2);
    const cap2 = new THREE.Mesh(cap2Geo, capMat2); cap2.position.y = -1.0;

    pillGroup.add(cap1, body, cap2);

    // Glowing edge seam
    const seamGeo = new THREE.TorusGeometry(0.71, 0.03, 8, 48);
    const seamMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 3 });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.rotation.x = Math.PI / 2;
    pillGroup.add(seam);

    // Small floating pills (scattered)
    for (let i = 0; i < 6; i++) {
      const miniG = new THREE.Group();
      miniG.position.set(
        7 + (Math.random() - 0.5) * 6,
        4 + (Math.random() - 0.5) * 5,
        -3 + Math.random() * 2
      );
      miniG.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      masterGroup.add(miniG);

      const col = [0x00f0ff, 0x8b5cf6, 0xff6b6b, 0x10b981][i % 4];
      const mc1 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: col, clearcoat: 1, roughness: 0.2, metalness: 0.1 }));
      mc1.position.y = 0.35;
      const mc2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 16),
        new THREE.MeshPhysicalMaterial({ color: 0xf0f0ff, transmission: 0.5, transparent: true, opacity: 0.9, clearcoat: 1 }));
      const mc3 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, clearcoat: 1, roughness: 0.1 }));
      mc3.position.y = -0.35;
      miniG.add(mc1, mc2, mc3);
    }

    // ── 3. HEARTBEAT MONITOR (line + glowing pulse bead) ─────────────────────
    const hbGroup = new THREE.Group();
    hbGroup.position.set(0, -5, 0);
    masterGroup.add(hbGroup);

    const hbPoints = [
      [-8, 0, 0], [-5, 0, 0], [-4, 0, 0], [-3.5, 1.5, 0], [-3, 0, 0], [-2.8, -2.5, 0],
      [-2.5, 4, 0], [-2, -1, 0], [-1.5, 0, 0], [0, 0, 0], [8, 0, 0]
    ].map(p => new THREE.Vector3(...p));

    const hbCurve = new THREE.CatmullRomCurve3(hbPoints);
    const hbGeo = new THREE.TubeGeometry(hbCurve, 200, 0.04, 8, false);
    const hbMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    hbGroup.add(new THREE.Mesh(hbGeo, hbMat));

    // Glow bead that travels along the heartbeat line
    const beadGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const beadMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 5, roughness: 0, metalness: 0
    });
    const bead = new THREE.Mesh(beadGeo, beadMat);
    hbGroup.add(bead);

    // Flat grid plane behind heartbeat
    const gridGeo = new THREE.PlaneGeometry(18, 4, 18, 4);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, wireframe: true, transparent: true, opacity: 0.08
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    hbGroup.add(grid);

    // ── 4. MOLECULE (carbon-like with atom spheres + bonds) ───────────────────
    const molGroup = new THREE.Group();
    molGroup.position.set(-7, -4, 1);
    masterGroup.add(molGroup);

    const atomPositions = [
      [0, 0, 0], [1.8, 0.8, 0.5], [-1.8, 0.6, -0.5],
      [0.6, -1.8, 0.8], [-0.8, -1.5, -1], [2.4, -0.6, -0.8]
    ];
    const atomColors = [0x00f0ff, 0xff6b6b, 0x8b5cf6, 0x10b981, 0xfbbf24, 0x00f0ff];
    const atomMeshes = [];

    atomPositions.forEach(([x, y, z], i) => {
      const atomGeo = new THREE.SphereGeometry(i === 0 ? 0.45 : 0.3, 24, 24);
      const atomMat = new THREE.MeshPhysicalMaterial({
        color: atomColors[i], emissive: atomColors[i], emissiveIntensity: 0.6,
        metalness: 0.3, roughness: 0.2, clearcoat: 1.0
      });
      const atom = new THREE.Mesh(atomGeo, atomMat);
      atom.position.set(x, y, z);
      molGroup.add(atom);
      atomMeshes.push(atom);
    });

    // Bonds (cylinders between atoms)
    const bondMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.5 });
    [[0, 1], [0, 2], [0, 3], [1, 5], [2, 4], [3, 4]].forEach(([a, b]) => {
      const p1 = new THREE.Vector3(...atomPositions[a]);
      const p2 = new THREE.Vector3(...atomPositions[b]);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, len, 8);
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.copy(p1).lerp(p2, 0.5);
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      molGroup.add(bond);
    });

    // Electron orbits
    [1.2, 1.8].forEach((r, idx) => {
      const orbitGeo = new THREE.TorusGeometry(r, 0.02, 8, 64);
      const orbitMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x00f0ff : 0x8b5cf6, transparent: true, opacity: 0.4 });
      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = Math.PI / 2 + idx * 0.8;
      orbit.rotation.y = idx * 0.6;
      molGroup.add(orbit);
    });

    // ── 5. FLOATING MEDICAL CROSS (RED CROSS) ────────────────────────────────
    const crossGroup = new THREE.Group();
    crossGroup.position.set(6, -3, 1);
    masterGroup.add(crossGroup);

    const crossMat = new THREE.MeshPhysicalMaterial({
      color: 0xff4444, emissive: 0xff2222, emissiveIntensity: 1.0, metalness: 0.5, roughness: 0.15, clearcoat: 1
    });
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 0.25), crossMat);
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.2, 0.25), crossMat);
    crossGroup.add(hBar, vBar);

    // Glowing back-plane circle
    const haloGeo = new THREE.CircleGeometry(1.4, 48);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    crossGroup.add(new THREE.Mesh(haloGeo, haloMat));

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

      // Stethoscope float + pulse
      stethGroup.rotation.z = Math.sin(t * 0.6) * 0.08;
      stethGroup.position.y = 3 + Math.sin(t * 0.8) * 0.4;

      // Pill tumble
      pillGroup.rotation.x = t * 0.5;
      pillGroup.rotation.y = t * 0.3;
      pillGroup.position.y = 4 + Math.sin(t * 1.1) * 0.5;

      // Heartbeat bead travel
      hbT = (hbT + 0.003) % 1;
      const beadPos = hbCurve.getPoint(hbT);
      bead.position.copy(beadPos);
      bead.material.emissiveIntensity = 4 + Math.sin(t * 8) * 2;

      // Molecule spin
      molGroup.rotation.y = t * 0.4;
      molGroup.rotation.x = t * 0.15;
      molGroup.position.y = -4 + Math.sin(t * 0.9) * 0.5;

      // Cross wobble
      crossGroup.rotation.z = Math.sin(t * 0.7) * 0.1;
      crossGroup.position.y = -3 + Math.sin(t * 1.2) * 0.4;
      crossGroup.position.x = 6 + Math.sin(t * 0.5) * 0.3;

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
  const requestedIsDoctor = location.state?.isDoctor ?? requestedRole === 'doctor';

  const [isDoctor, setIsDoctor] = useState(requestedIsDoctor);
  const [aadhar, setAadhar] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fade-in on mount — avoids flash of old page content
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setIsDoctor(requestedIsDoctor);
    setError('');
  }, [requestedIsDoctor]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const table = isDoctor ? 'doctors' : 'patients';
    try {
      const { data, error: dbErr } = await supabase
        .from(table)
        .select('*')
        .eq('aadhar_no', aadhar)
        .eq('password', password)
        .single();
      if (dbErr || !data) {
        setError('Invalid Aadhar number or password. Please try again.');
        setLoading(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify({ ...data, role: isDoctor ? 'doctor' : 'patient' }));
      navigate(isDoctor ? '/doctor-portal' : '/patient-portal');
    } catch {
      setError('Connection error. Please check your network and try again.');
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
              { label: '👤 Patient', value: false },
              { label: '🩺 Doctor', value: true },
            ].map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => { setIsDoctor(opt.value); setError(''); }}
                style={{
                  flex: 1, padding: '0.65rem',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.88rem',
                  transition: 'all 0.25s ease',
                  background: isDoctor === opt.value
                    ? 'linear-gradient(135deg, rgba(0,240,255,0.18), rgba(139,92,246,0.18))'
                    : 'transparent',
                  color: isDoctor === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: isDoctor === opt.value ? '0 0 20px rgba(0,240,255,0.15)' : 'none',
                  borderColor: isDoctor === opt.value ? 'rgba(0,240,255,0.3)' : 'transparent',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.8rem', textAlign: 'center' }}>
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
              {isDoctor ? 'Doctor' : 'Patient'}{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Login</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', marginTop: '0.4rem' }}>
              {isDoctor
                ? 'Access your clinical dashboard and patient records'
                : 'View your health records and AI insights'}
            </p>
          </div>

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
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                AADHAR NUMBER
              </label>
              <input
                type="text"
                value={aadhar}
                onChange={e => setAadhar(e.target.value)}
                placeholder="Enter your Aadhar no."
                required
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', fontWeight: 600, letterSpacing: '0.3px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
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
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In to {isDoctor ? 'Doctor Portal' : 'Patient Portal'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Switch role hint */}
          <p
            style={{ textAlign: 'center', marginTop: '1.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
            onClick={() => { setIsDoctor(!isDoctor); setError(''); }}
          >
            {isDoctor
              ? <>Are you a patient? <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Switch to Patient Login →</span></>
              : <>Are you a doctor? <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Switch to Doctor Login →</span></>
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
