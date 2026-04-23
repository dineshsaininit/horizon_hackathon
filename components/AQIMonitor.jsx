import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── AQI Helpers ──────────────────────────────────────────────────────────────
const AQI_CATEGORIES = [
  { max: 50,  label: 'Good',                          color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    icon: '😊', desc: 'Air quality is satisfactory and poses little or no risk.' },
  { max: 100, label: 'Moderate',                      color: '#eab308', bg: 'rgba(234,179,8,0.12)',    icon: '😐', desc: 'Acceptable quality. Unusually sensitive people may be affected.' },
  { max: 150, label: 'Unhealthy for Sensitive Groups',color: '#f97316', bg: 'rgba(249,115,22,0.12)',   icon: '😷', desc: 'Sensitive groups may experience health effects.' },
  { max: 200, label: 'Unhealthy',                     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: '🤢', desc: 'Everyone may begin to experience health effects.' },
  { max: 300, label: 'Very Unhealthy',                color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   icon: '🤮', desc: 'Health alert: everyone may experience more serious effects.' },
  { max: 500, label: 'Hazardous',                     color: '#dc2626', bg: 'rgba(220,38,38,0.15)',    icon: '☠️', desc: 'Emergency conditions. The entire population is affected.' },
];

function getCategory(aqi) {
  return AQI_CATEGORIES.find(c => aqi <= c.max) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

// Derive an AQI-like index from raw PM2.5 (USEPA simple scale)
function pm25ToAQI(pm) {
  const bps = [
    [0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500],
  ];
  for (const [cL, cH, iL, iH] of bps) {
    if (pm >= cL && pm <= cH) return Math.round(((iH - iL) / (cH - cL)) * (pm - cL) + iL);
  }
  return pm > 500 ? 500 : 0;
}

const HEALTH_ADVICE = {
  Good: { groups: ['👨‍👩‍👧 General Public', '🏃 Athletes'], tips: ['Enjoy outdoor activities freely.', 'Good time to air out your home.'] },
  Moderate: { groups: ['🫁 Asthma patients', '❤️ Heart disease'], tips: ['Sensitive individuals consider reducing prolonged outdoor exertion.', 'Keep rescue inhalers accessible.'] },
  'Unhealthy for Sensitive Groups': { groups: ['🫁 Lung disease', '❤️ Heart disease', '👵 Elderly', '🧒 Children'], tips: ['Reduce heavy outdoor exertion.', 'Keep windows closed during high pollution periods.'] },
  Unhealthy: { groups: ['👨‍👩‍👧 Everyone'], tips: ['Avoid prolonged outdoor exertion.', 'Wear an N95 mask outdoors.', 'Use air purifiers indoors.'] },
  'Very Unhealthy': { groups: ['👨‍👩‍👧 Everyone'], tips: ['Avoid all outdoor activities.', 'Run air purifiers on high.', 'Consult a doctor if experiencing symptoms.'] },
  Hazardous: { groups: ['👨‍👩‍👧 Everyone'], tips: ['STAY INDOORS.', 'Keep all windows and doors shut.', 'Seek immediate medical attention if symptomatic.'] },
};

const SENSOR_META = [
  { key: 'PM_1.0', label: 'PM 1.0',  unit: 'µg/m³', color: '#60a5fa', desc: 'Ultra-fine particles < 1µm' },
  { key: 'PM_2.5', label: 'PM 2.5',  unit: 'µg/m³', color: '#34d399', desc: 'Fine particulate < 2.5µm' },
  { key: 'PM_10',  label: 'PM 10',   unit: 'µg/m³', color: '#fbbf24', desc: 'Coarse particles < 10µm' },
  { key: 'CO2',    label: 'CO₂',     unit: 'ppm',    color: '#c084fc', desc: 'Carbon Dioxide' },
  { key: 'TVOC',   label: 'TVOC',    unit: 'raw',    color: '#fb923c', desc: 'Total Volatile Organic Compounds' },
  { key: 'CH2O',   label: 'CH₂O',    unit: 'mg/m³',  color: '#f472b6', desc: 'Formaldehyde' },
];

const BACKEND = 'http://localhost:5000';
const POLL_MS  = 2000;

// ─── Chart drawing utilities ──────────────────────────────────────────────────
function drawLineChart(canvas, forecast) {
  if (!canvas || !forecast?.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 24, right: 16, bottom: 48, left: 44 };
  ctx.clearRect(0, 0, W, H);

  const labels = forecast.map(d => d.date.split(',')[0]);
  const aqiVals = forecast.map(d => d.aqi);
  const tempVals = forecast.map(d => d.temp);
  const maxAQI = Math.max(...aqiVals, 50);
  const minAQI = Math.min(...aqiVals, 0);
  const maxTemp = Math.max(...tempVals);
  const minTemp = Math.min(...tempVals);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = labels.length;

  const xOf = i => PAD.left + (i / (n - 1)) * plotW;
  const yOfAQI = v => PAD.top + plotH - ((v - minAQI) / (maxAQI - minAQI || 1)) * plotH;
  const yOfTemp = v => PAD.top + plotH - ((v - minTemp) / (maxTemp - minTemp || 1)) * plotH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
  }

  // AQI gradient fill
  const gradAQI = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + plotH);
  gradAQI.addColorStop(0, 'rgba(52,211,153,0.35)');
  gradAQI.addColorStop(1, 'rgba(52,211,153,0.00)');
  ctx.beginPath();
  ctx.moveTo(xOf(0), yOfAQI(aqiVals[0]));
  aqiVals.forEach((v, i) => ctx.lineTo(xOf(i), yOfAQI(v)));
  ctx.lineTo(xOf(n - 1), PAD.top + plotH);
  ctx.lineTo(xOf(0), PAD.top + plotH);
  ctx.closePath();
  ctx.fillStyle = gradAQI;
  ctx.fill();

  // AQI line
  ctx.beginPath();
  aqiVals.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(0), yOfAQI(v)) : ctx.lineTo(xOf(i), yOfAQI(v)));
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Temperature line
  ctx.beginPath();
  tempVals.forEach((v, i) => i === 0 ? ctx.moveTo(xOf(0), yOfTemp(v)) : ctx.lineTo(xOf(i), yOfTemp(v)));
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.setLineDash([6, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // X labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    ctx.fillText(lbl, xOf(i), H - 8);
  });

  // Y labels (AQI)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  for (let i = 0; i <= 4; i++) {
    const val = Math.round(minAQI + (i / 4) * (maxAQI - minAQI));
    ctx.fillText(val, PAD.left - 6, PAD.top + plotH - (i / 4) * plotH + 4);
  }

  // Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = '#34d399';
  ctx.fillRect(PAD.left, 6, 14, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('AQI Forecast', PAD.left + 18, 12);
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(PAD.left + 110, 6, 14, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Temp (°C)', PAD.left + 128, 12);
}

function drawBarChart(canvas, forecast) {
  if (!canvas || !forecast?.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = { top: 24, right: 16, bottom: 48, left: 44 };
  ctx.clearRect(0, 0, W, H);

  const labels = forecast.map(d => d.date.split(',')[0]);
  const vals = forecast.map(d => d.aqi);
  const maxV = Math.max(...vals, 50);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const barW = (plotW / n) * 0.6;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
  }

  vals.forEach((v, i) => {
    const x = PAD.left + (i / n) * plotW + (plotW / n - barW) / 2;
    const barH = (v / maxV) * plotH;
    const y = PAD.top + plotH - barH;
    const color = v > 200 ? '#ef4444' : v > 100 ? '#fbbf24' : '#34d399';

    const grad = ctx.createLinearGradient(0, y, 0, PAD.top + plotH);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '44');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Value label above bar
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(v, x + barW / 2, y - 5);
  });

  // X labels
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    const x = PAD.left + (i / n) * plotW + plotW / (2 * n);
    ctx.fillText(lbl, x, H - 8);
  });

  // Y labels
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i <= 4; i++) {
    const val = Math.round((i / 4) * maxV);
    ctx.fillText(val, PAD.left - 6, PAD.top + plotH - (i / 4) * plotH + 4);
  }

  // Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = '#34d399';
  ctx.fillRect(PAD.left, 6, 14, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText('AQI Level', PAD.left + 18, 15);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AQIMonitor() {
  const [iotState, setIotState] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [chartsDrawn, setChartsDrawn] = useState(false);
  const lineCanvasRef = useRef(null);
  const barCanvasRef  = useRef(null);
  const timerRef      = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/iot-status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIotState(data);
      setFetchError(null);
    } catch (err) {
      setFetchError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    timerRef.current = setInterval(fetchStatus, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchStatus]);

  // Draw charts when forecast arrives
  useEffect(() => {
    if (!iotState?.weekly_forecast) return;
    if (lineCanvasRef.current) drawLineChart(lineCanvasRef.current, iotState.weekly_forecast);
    if (barCanvasRef.current)  drawBarChart(barCanvasRef.current,  iotState.weekly_forecast);
    setChartsDrawn(true);
  }, [iotState?.weekly_forecast]);

  const raw       = iotState?.current_raw ?? {};
  const count     = iotState?.count ?? 0;
  const total     = 22;
  const pct       = Math.min(Math.round((count / total) * 100), 100);
  const calibrated = iotState?.is_calibrated ?? false;
  const forecast  = iotState?.weekly_forecast ?? null;

  // Derive live AQI from PM2.5 for the gauge
  const liveAQI      = raw['PM_2.5'] ? pm25ToAQI(raw['PM_2.5']) : null;
  const liveCategory = liveAQI !== null ? getCategory(liveAQI) : null;
  const advice       = liveCategory ? (HEALTH_ADVICE[liveCategory.label] || HEALTH_ADVICE['Unhealthy']) : null;

  return (
    <div className="aqi-root">
      {/* ── Header ── */}
      <div className="aqi-header">
        <div>
          <h2 className="aqi-title">
            <span>🌡️</span>
            <span>IoT AQI <span className="gradient-text">Monitor</span></span>
          </h2>
          <p className="aqi-subtitle">Real-time Sensor Calibration · XGBoost 7-Day AI Forecast</p>
        </div>
        <div className="aqi-device-badge">
          <span className={`aqi-status-led ${calibrated ? 'connected' : fetchError ? '' : 'connecting'}`} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>IoT DEVICE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', color: '#00f0ff' }}>
              {calibrated ? '✅ CALIBRATED' : fetchError ? '❌ OFFLINE' : `Reading ${count}/${total}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Backend Error ── */}
      {fetchError && (
        <div className="glass-card" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.2rem' }}>Backend Not Reachable</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Start the Flask backend (<code style={{ background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: 4 }}>python backend/app.py</code>) to enable live IoT data. Make sure <strong>COM5</strong> sensor is connected.
            </div>
          </div>
        </div>
      )}

      {/* ── Calibration Progress ── */}
      {!calibrated && !fetchError && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
            🔬 Sensor Calibration in Progress
          </h3>
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 10, marginBottom: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00f0ff, #22c55e)',
              borderRadius: 999,
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px #22c55e88'
            }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Reading <strong style={{ color: '#fff' }}>{count}</strong> / {total} — Averaging 3 calibration samples at reads 20-22
          </p>
        </div>
      )}

      {/* ── Calibrated Success Banner ── */}
      {calibrated && (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '3px solid #22c55e' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#22c55e' }}>Sensor Calibrated &amp; Averaged</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Live sensor data feed active · XGBoost forecast running</div>
          </div>
        </div>
      )}

      {/* ── Live Sensor Grid (PM1, PM2.5, PM10, CO2, TVOC, CH2O) ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="aqi-section-title" style={{ marginBottom: '1rem' }}>📡 Live Sensor Readings</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
          {SENSOR_META.map(m => {
            const val = raw[m.key] ?? 0;
            return (
              <div key={m.key} className="glass-card" style={{ padding: '1.2rem', textAlign: 'center', borderTop: `2px solid ${m.color}44`, transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{m.label}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color, lineHeight: 1, marginBottom: '0.25rem' }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{m.unit}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.4rem' }}>{m.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live AQI Gauge from PM2.5 ── */}
      {liveAQI !== null && liveCategory && (
        <div className="aqi-dashboard" style={{ marginBottom: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          <div className="aqi-gauge-card" style={{ borderColor: liveCategory.color + '55', background: liveCategory.bg }}>
            <div className="aqi-gauge-value" style={{ color: liveCategory.color }}>{liveAQI}</div>
            <div className="aqi-gauge-icon">{liveCategory.icon}</div>
            <div className="aqi-gauge-label" style={{ color: liveCategory.color }}>{liveCategory.label}</div>
            <div className="aqi-gauge-bar-wrap">
              <div className="aqi-gauge-bar">
                <div className="aqi-gauge-fill" style={{ width: `${Math.min((liveAQI / 500) * 100, 100)}%`, background: 'linear-gradient(90deg, #22c55e, #eab308, #f97316, #ef4444, #a855f7, #7f1d1d)' }} />
                <div className="aqi-gauge-needle" style={{ left: `${Math.min((liveAQI / 500) * 100, 100)}%` }} />
              </div>
              <div className="aqi-gauge-scale"><span>0</span><span>100</span><span>200</span><span>300</span><span>500</span></div>
            </div>
            <p className="aqi-gauge-desc">{liveCategory.desc}</p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Derived from PM2.5 via USEPA breakpoints</div>
          </div>

          {/* Health Advice */}
          {advice && (
            <div className="aqi-advice-card" style={{ borderColor: liveCategory.color + '44' }}>
              <div className="aqi-section-title" style={{ marginBottom: '1rem' }}>🏥 Health Advisory — <span style={{ color: liveCategory.color }}>{liveCategory.label}</span></div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {advice.groups.map((g, i) => (
                  <span key={i} className="aqi-group-tag" style={{ borderColor: liveCategory.color + '55', color: liveCategory.color }}>{g}</span>
                ))}
              </div>
              <div className="aqi-advice-tips">
                {advice.tips.map((tip, i) => (
                  <div key={i} className="aqi-tip" style={{ borderLeftColor: liveCategory.color }}>
                    <span className="aqi-tip-num" style={{ background: liveCategory.color + '22', color: liveCategory.color }}>{i + 1}</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 7-Day XGBoost AI Forecast ── */}
      {forecast ? (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="aqi-section-title" style={{ marginBottom: '1rem' }}>🤖 7-Day XGBoost AI Prediction</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {forecast.map((day, i) => {
              const cat = getCategory(day.aqi);
              return (
                <div key={i} className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderTop: `2px solid ${cat.color}55`, transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{day.date}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: cat.color, lineHeight: 1 }}>{day.aqi}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>AQI</div>
                  <div style={{ fontSize: '1rem' }}>{cat.icon}</div>
                  <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '0.4rem' }}>{day.temp}°C Max</div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📈 AQI Forecast Curve
              </div>
              <canvas ref={lineCanvasRef} width={460} height={180} style={{ width: '100%', height: 180 }} />
            </div>
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📊 AQI Level Histogram
              </div>
              <canvas ref={barCanvasRef} width={460} height={180} style={{ width: '100%', height: 180 }} />
            </div>
          </div>
        </div>
      ) : (
        calibrated && (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Generating 7-Day Forecast</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fetching weather data from Open-Meteo · Running XGBoost model…</div>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <span className="aqi-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
            </div>
          </div>
        )
      )}

      {/* ── AQI Reference Scale ── */}
      <div className="aqi-scale-ref">
        <div className="aqi-section-title" style={{ marginBottom: '0.75rem' }}>📌 AQI Reference Scale</div>
        <div className="aqi-scale-list">
          {AQI_CATEGORIES.map((c, i) => (
            <div key={i} className="aqi-scale-row" style={{ borderLeftColor: c.color }}>
              <span style={{ color: c.color, fontWeight: 700, minWidth: 28 }}>{c.icon}</span>
              <span style={{ color: c.color, fontWeight: 600, fontSize: '0.8rem', minWidth: 90 }}>{c.label}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>0–{c.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
