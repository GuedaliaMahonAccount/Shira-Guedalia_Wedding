"use client";

import { useState, useEffect, useRef } from "react";
import { fetchStats, exportGuestsData, deleteRsvp } from "./actions";

// ── Animated counter hook ────────────────────────────────────────
function useCountUp(target, duration = 1200, started = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!started || target === 0) { setValue(target); return; }
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(ease * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, started, duration]);
    return value;
}

// ── Donut Chart ──────────────────────────────────────────────────
function DonutChart({ attending, notAttending, total }) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const r = 54;
    const cx = 70;
    const cy = 70;
    const circ = 2 * Math.PI * r;
    const attendPct = total > 0 ? attending / total : 0;
    const notPct = total > 0 ? notAttending / total : 0;
    const attendDash = circ * attendPct;
    const notDash = circ * notPct;
    const attendOffset = 0;
    const notOffset = -attendDash;

    return (
        <div ref={ref} className="donut-wrap">
            <svg viewBox="0 0 140 140" className="donut-svg">
                <defs>
                    <linearGradient id="grad-attend" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#B48C64" />
                        <stop offset="100%" stopColor="#D4B896" />
                    </linearGradient>
                    <linearGradient id="grad-no" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C9A87C" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#E8D5BC" stopOpacity="0.4" />
                    </linearGradient>
                    <filter id="donut-shadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(90,60,30,0.15)" />
                    </filter>
                </defs>
                {/* Track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,184,150,0.2)" strokeWidth="14" />
                {/* Not attending arc */}
                {total > 0 && (
                    <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke="url(#grad-no)" strokeWidth="14"
                        strokeDasharray={`${animated ? notDash : 0} ${circ}`}
                        strokeDashoffset={`${animated ? notOffset : 0}`}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.23,1,0.32,1)', filter: 'url(#donut-shadow)' }}
                    />
                )}
                {/* Attending arc */}
                {total > 0 && (
                    <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke="url(#grad-attend)" strokeWidth="14"
                        strokeDasharray={`${animated ? attendDash : 0} ${circ}`}
                        strokeDashoffset={attendOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.23,1,0.32,1) 0.1s', filter: 'url(#donut-shadow)' }}
                    />
                )}
                {/* Center text */}
                <text x={cx} y={cy - 8} textAnchor="middle" className="donut-pct" fontSize="20" fontWeight="600" fill="#3D2B1F">
                    {total > 0 ? Math.round(attendPct * 100) : 0}%
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8.5" fill="#A89080" fontFamily="Assistant, sans-serif">
                    מאשרים הגעה
                </text>
            </svg>

            <div className="donut-legend">
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#B48C64' }}></span>
                    <span className="legend-label">מגיעים</span>
                    <span className="legend-val">{attending}</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot" style={{ background: 'rgba(180,140,100,0.3)' }}></span>
                    <span className="legend-label">לא מגיעים</span>
                    <span className="legend-val">{notAttending}</span>
                </div>
            </div>
        </div>
    );
}

// ── Horizontal Bar ───────────────────────────────────────────────
function HBar({ label, value, max, color }) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div ref={ref} className="hbar-row">
            <div className="hbar-meta">
                <span className="hbar-label">{label}</span>
                <span className="hbar-count">{value}</span>
            </div>
            <div className="hbar-track">
                <div className="hbar-fill" style={{
                    width: animated ? `${pct}%` : '0%',
                    background: color,
                    transition: 'width 1.3s cubic-bezier(0.23,1,0.32,1)'
                }} />
            </div>
        </div>
    );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent, delay = 0 }) {
    const [started, setStarted] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const count = useCountUp(value, 1000, started);

    return (
        <div ref={ref} className="stat-card" style={{ animationDelay: `${delay}ms` }}>
            <div className="stat-icon-wrap" style={{ background: accent + '18', color: accent }}>
                {icon}
            </div>
            <div className="stat-body">
                <span className="stat-value" style={{ color: accent }}>{count.toLocaleString('he-IL')}</span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
}

// ── Mini Radial (Attendance type breakdown) ──────────────────────
function RadialRing({ value, max, label, color, delay = 0 }) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const r = 28, cx = 36, cy = 36;
    const circ = 2 * Math.PI * r;
    const pct = max > 0 ? value / max : 0;
    return (
        <div ref={ref} className="radial-ring-item" style={{ animationDelay: `${delay}ms` }}>
            <svg viewBox="0 0 72 72" width="72" height="72">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,184,150,0.2)" strokeWidth="7" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
                    strokeDasharray={`${animated ? circ * pct : 0} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.23,1,0.32,1) ${delay}ms` }}
                />
                <text x={cx} y={cy + 1} textAnchor="middle" fontSize="13" fontWeight="600" fill="#3D2B1F" fontFamily="Assistant"
                    dominantBaseline="middle">{value}</text>
            </svg>
            <span className="radial-label">{label}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────
export default function AdminDashboard() {
    const [passcode, setPasscode] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [totalInvitations, setTotalInvitations] = useState(0);
    const [showTable, setShowTable] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setError(null);
        const res = await fetchStats(passcode);
        if (res.error) { setError(res.error); }
        else { setData(res); setIsAuthenticated(true); }
    };

    const handleExport = async (type) => {
        setIsExporting(true);
        const res = await exportGuestsData(passcode, type);
        setIsExporting(false);
        if (res.error) {
            alert(res.error);
        } else {
            const binaryString = window.atob(res.base64Excel);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guests_export_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Re-fetch stats to update UI (just in case)
            handleLogin(); 
            alert("הייצוא בוצע בהצלחה!");
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הרשומה של ${name}?`)) return;
        
        const res = await deleteRsvp(passcode, id);
        if (res.error) {
            alert(res.error);
        } else {
            handleLogin(); // refresh table
        }
    };

    // ── Login Screen ─────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <main className="admin-login-page">
                <div className="admin-bg-blob b1" />
                <div className="admin-bg-blob b2" />
                <div className="login-card">
                    <div className="login-header">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-logo">
                            <circle cx="20" cy="20" r="18" stroke="rgba(180,140,100,0.5)" strokeWidth="1.2" fill="rgba(180,140,100,0.06)" />
                            <path d="M20 10 Q26 14 26 20 Q26 26 20 30 Q14 26 14 20 Q14 14 20 10Z" stroke="rgba(180,140,100,0.7)" strokeWidth="1" fill="rgba(180,140,100,0.12)" />
                            <circle cx="20" cy="20" r="3" fill="rgba(180,140,100,0.6)" />
                        </svg>
                        <h1 className="login-title">כניסת מנהל</h1>
                        <p className="login-sub">שירה & גדליה · לוח בקרה</p>
                    </div>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="login-field">
                            <label className="login-label">סיסמה</label>
                            <input
                                type="password"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                className="login-input"
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                        {error && <p className="login-error">{error}</p>}
                        <button type="submit" className="login-btn">
                            <span>כניסה</span>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>
                    </form>
                </div>

                <style>{adminStyles}</style>
            </main>
        );
    }

    // ── Dashboard ────────────────────────────────────────────────
    const stats = data?.stats;
    const totalResponses = stats.totalResponses || 0;
    const totalGuests = stats.totalGuests || 0;
    const attending = stats.attending || 0;
    const notAttending = stats.notAttending || 0;
    const chuppahCount = stats.chuppahCount || 0;
    const mealCount = stats.mealCount || 0;
    const danceCount = stats.danceCount || 0;
    const pending = totalInvitations > 0 ? Math.max(0, totalInvitations - totalResponses) : null;
    const pendingPct = totalInvitations > 0 ? Math.round((pending / totalInvitations) * 100) : 0;

    return (
        <main className="admin-dashboard">
            <div className="admin-bg-blob b1" />
            <div className="admin-bg-blob b2" />

            <div className="dash-content">
                {/* ── Header ── */}
                <header className="dash-header">
                    <div className="dash-header-left">
                        <div className="dash-logo">
                            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 4 Q22 8 22 16 Q22 24 16 28 Q10 24 10 16 Q10 8 16 4Z" stroke="rgba(180,140,100,0.7)" strokeWidth="1" fill="rgba(180,140,100,0.12)" />
                                <circle cx="16" cy="16" r="3" fill="rgba(180,140,100,0.6)" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="dash-title">לוח בקרה</h1>
                            <p className="dash-sub">שירה &amp; גדליה · 28 בדצמבר 2026</p>
                        </div>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="logout-btn">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        התנתקות
                    </button>
                </header>

                {/* ── KPI Cards ── */}
                <section className="kpi-grid">
                    <StatCard label="תגובות שהתקבלו" value={totalResponses} delay={0} accent="#B48C64"
                        icon={<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1zM3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.5" /></svg>}
                    />
                    <StatCard label="אורחים מאושרים" value={totalGuests} delay={80} accent="#4A8B5C"
                        icon={<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                    />
                    <StatCard label="אישרו הגעה" value={attending} delay={160} accent="#B48C64"
                        icon={<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
                    />
                    <StatCard label="לא מגיעים" value={notAttending} delay={240} accent="#C9806A"
                        icon={<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
                    />
                </section>

                {/* ── Charts Row ── */}
                <section className="charts-grid">
                    {/* Donut */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2 className="chart-card-title">התפלגות תגובות</h2>
                            <span className="chart-card-badge">{totalResponses} סה״כ</span>
                        </div>
                        <DonutChart attending={attending} notAttending={notAttending} total={totalResponses} />
                    </div>

                    {/* Attendance type radials */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2 className="chart-card-title">פילוח לפי אירוע</h2>
                            <span className="chart-card-badge">{totalGuests} אורחים</span>
                        </div>
                        <div className="radials-wrap">
                            <RadialRing value={chuppahCount} max={totalGuests} label="חופה" color="#B48C64" delay={0} />
                            <RadialRing value={mealCount} max={totalGuests} label="לשבת לאכול" color="#C9A87C" delay={100} />
                            <RadialRing value={danceCount} max={totalGuests} label="ריקודים" color="#8A9E8C" delay={200} />
                        </div>
                        <div className="event-bars">
                            <HBar label="חופה" value={chuppahCount} max={totalGuests} color="linear-gradient(90deg, #B48C64, #D4B896)" />
                            <HBar label="לשבת לאכול" value={mealCount} max={totalGuests} color="linear-gradient(90deg, #C9A87C, #E8D5BC)" />
                            <HBar label="ריקודים" value={danceCount} max={totalGuests} color="linear-gradient(90deg, #8A9E8C, #B5C8B7)" />
                        </div>
                    </div>

                    {/* Calculator */}
                    <div className="chart-card calculator-card">
                        <div className="chart-card-header">
                            <h2 className="chart-card-title">מחשבון מוזמנים</h2>
                        </div>
                        <div className="calc-wrap">
                            <label className="calc-label">סה״כ הזמנות שנשלחו</label>
                            <input
                                type="number" min="0"
                                value={totalInvitations || ""}
                                onChange={(e) => setTotalInvitations(parseInt(e.target.value) || 0)}
                                className="calc-input"
                                placeholder="לדוגמה: 200"
                            />
                            {totalInvitations > 0 && (
                                <div className="calc-results">
                                    {/* Progress ring for response rate */}
                                    <div className="calc-ring-wrap">
                                        <svg viewBox="0 0 100 100" width="100" height="100">
                                            <defs>
                                                <linearGradient id="calc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#B48C64" />
                                                    <stop offset="100%" stopColor="#D4B896" />
                                                </linearGradient>
                                            </defs>
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(212,184,150,0.2)" strokeWidth="10" />
                                            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#calc-grad)" strokeWidth="10"
                                                strokeDasharray={`${2 * Math.PI * 42 * Math.min(totalResponses / totalInvitations, 1)} ${2 * Math.PI * 42}`}
                                                strokeLinecap="round"
                                                transform="rotate(-90 50 50)"
                                                style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.23,1,0.32,1)' }}
                                            />
                                            <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#3D2B1F" fontFamily="Assistant">
                                                {Math.min(Math.round((totalResponses / totalInvitations) * 100), 100)}%
                                            </text>
                                            <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#A89080" fontFamily="Assistant">
                                                שיעור תגובה
                                            </text>
                                        </svg>
                                    </div>
                                    <div className="calc-stats">
                                        <div className="calc-stat">
                                            <span className="calc-stat-num" style={{ color: '#B48C64' }}>{totalResponses}</span>
                                            <span className="calc-stat-label">ענו</span>
                                        </div>
                                        <div className="calc-divider" />
                                        <div className="calc-stat">
                                            <span className="calc-stat-num" style={{ color: pending > 0 ? '#C9806A' : '#8A9E8C' }}>{pending}</span>
                                            <span className="calc-stat-label">טרם ענו</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── RSVP Table ── */}
                <section className="table-section">
                    <div className="table-header">
                        <div>
                            <h2 className="table-title">רשימת משיבים</h2>
                            <p className="table-sub">{data.rsvps.length} רשומות</p>
                        </div>
                        <div className="table-actions" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="table-toggle" onClick={() => handleExport('all')} disabled={isExporting}>
                                {isExporting ? "מייצא..." : "יצוא הכל (Excel)"}
                            </button>
                            <button className="table-toggle" onClick={() => handleExport('new')} disabled={isExporting} style={{ background: 'linear-gradient(135deg, #4A8B5C, #5C9F6E)' }}>
                                {isExporting ? "מייצא..." : "יצוא חדשים (Excel)"}
                            </button>
                            <button className="table-toggle" onClick={() => setShowTable(t => !t)}>
                                {showTable ? "הסתר טבלה" : "הצג טבלה"}
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    style={{ transform: showTable ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {showTable && (
                        <div className="table-wrap">
                            <div className="table-scroll">
                                <table className="rsvp-table">
                                    <thead>
                                        <tr>
                                            <th>שם</th>
                                            <th>מגיע?</th>
                                            <th>אורחים</th>
                                            <th>אירועים</th>
                                            <th>טלפון</th>
                                            <th>תאריך</th>
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.rsvps.map((rsvp) => (
                                            <tr key={rsvp.id}>
                                                <td className="td-name">{rsvp.names}</td>
                                                <td>
                                                    {rsvp.is_attending === 1
                                                        ? <span className="badge badge-yes">כן ✓</span>
                                                        : <span className="badge badge-no">לא</span>}
                                                </td>
                                                <td className="td-muted">{rsvp.is_attending === 1 ? rsvp.guest_count : "—"}</td>
                                                <td className="td-muted td-events">
                                                    {rsvp.is_attending === 1 ? (
                                                        rsvp.guests?.length > 0
                                                            ? rsvp.guests.map(g => {
                                                                let t = [];
                                                                if (g.chuppah) t.push("חופה");
                                                                if (g.meal) t.push("אוכל");
                                                                if (g.dance) t.push("ריקודים");
                                                                return t.join("+");
                                                            }).join(", ")
                                                            : rsvp.attendance_type
                                                    ) : "—"}
                                                </td>
                                                <td className="td-phone" dir="ltr">{rsvp.phone || "—"}</td>
                                                <td className="td-date">{new Date(rsvp.created_at).toLocaleDateString('he-IL')}</td>
                                                <td className="td-actions">
                                                    <button onClick={() => handleDelete(rsvp.id, rsvp.names)} className="delete-btn">מחיקה</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {data.rsvps.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="td-empty">אין עדיין תגובות...</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <style>{adminStyles}</style>
        </main>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const adminStyles = `
  :root {
    --ivory: #FAF7F2;
    --champagne: #ECD9BE;
    --gold: #B48C64;
    --gold-light: #C9A87C;
    --gold-deep: #8B6943;
    --terracotta: #C9806A;
    --sage: #8A9E8C;
    --warm-brown: #6B5040;
    --text-dark: #3D2B1F;
    --text-mid: #7A6055;
    --text-light: #A89080;
    --font-serif: 'Noto Serif Hebrew', Georgia, serif;
    --font-body: 'Assistant', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .admin-login-page, .admin-dashboard {
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--text-dark);
    position: relative;
    overflow-x: hidden;
    direction: rtl;
    background: radial-gradient(ellipse at 70% 10%, #F5EBD8 0%, transparent 55%),
                radial-gradient(ellipse at 10% 90%, #EDE0D0 0%, transparent 50%),
                linear-gradient(160deg, #FAF7F2 0%, #F4ECE0 100%);
  }

  /* Background blobs */
  .admin-bg-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.45;
    mix-blend-mode: multiply;
    pointer-events: none;
    z-index: 0;
  }
  .admin-bg-blob.b1 {
    width: 55vw; height: 55vw;
    top: -15%; right: -10%;
    background: radial-gradient(circle, #E8D5BC 0%, #F5C8B0 70%, transparent 100%);
    animation: bdrift 20s ease-in-out infinite alternate;
  }
  .admin-bg-blob.b2 {
    width: 45vw; height: 45vw;
    bottom: -10%; left: -5%;
    background: radial-gradient(circle, #D5E0D0 0%, transparent 70%);
    animation: bdrift 26s ease-in-out infinite alternate-reverse;
  }
  @keyframes bdrift {
    0% { transform: translate(0,0) scale(1); }
    100% { transform: translate(3%,4%) scale(1.07); }
  }

  /* ── Login ── */
  .admin-login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }

  .login-card {
    position: relative; z-index: 10;
    width: 100%; max-width: 380px;
    background: rgba(255,252,246,0.82);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(200,170,130,0.25);
    border-radius: 2rem;
    padding: 2.75rem 2rem;
    box-shadow: 0 8px 60px rgba(90,60,30,0.12);
    animation: cardIn 0.8s cubic-bezier(0.23,1,0.32,1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to { opacity: 1; transform: none; }
  }

  .login-header { text-align: center; margin-bottom: 2rem; }
  .login-logo { width: 48px; height: 48px; margin: 0 auto 0.75rem; display: block; }
  .login-title {
    font-family: var(--font-serif);
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--text-dark);
    margin-bottom: 0.25rem;
  }
  .login-sub { font-size: 0.8rem; color: var(--text-light); }

  .login-form { display: flex; flex-direction: column; gap: 1rem; }
  .login-field { display: flex; flex-direction: column; gap: 0.35rem; }
  .login-label { font-size: 0.82rem; color: var(--text-mid); font-weight: 500; }
  .login-input {
    padding: 0.8rem 1rem;
    background: rgba(255,252,246,0.9);
    border: 1px solid rgba(180,140,100,0.25);
    border-radius: 0.9rem;
    font-size: 1rem;
    color: var(--text-dark);
    outline: none;
    text-align: center;
    letter-spacing: 0.15em;
    transition: all 0.2s;
  }
  .login-input:focus { border-color: var(--gold-light); box-shadow: 0 0 0 3px rgba(180,140,100,0.12); }
  .login-error { font-size: 0.82rem; color: #B94A3A; text-align: center; }
  .login-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    padding: 0.9rem 1.5rem;
    background: linear-gradient(135deg, var(--gold-deep), var(--gold) 60%, var(--gold-light));
    color: #FAF5EE;
    border: none; border-radius: 0.9rem;
    font-family: var(--font-body); font-size: 1rem; font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(140,100,60,0.28);
    transition: all 0.3s cubic-bezier(0.23,1,0.32,1);
  }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(140,100,60,0.38); }

  /* ── Dashboard layout ── */
  .dash-content {
    position: relative; z-index: 10;
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    display: flex; flex-direction: column; gap: 2rem;
  }

  /* ── Header ── */
  .dash-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(180,140,100,0.15);
    animation: cardIn 0.7s both;
  }
  .dash-header-left { display: flex; align-items: center; gap: 1rem; }
  .dash-logo { width: 40px; height: 40px; flex-shrink: 0; }
  .dash-title {
    font-family: var(--font-serif);
    font-size: clamp(1.3rem, 3vw, 1.8rem);
    font-weight: 400;
    color: var(--text-dark);
    line-height: 1.2;
  }
  .dash-sub { font-size: 0.8rem; color: var(--text-light); margin-top: 0.1rem; }
  .logout-btn {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: rgba(255,252,246,0.8);
    border: 1px solid rgba(180,140,100,0.2);
    border-radius: 2rem;
    font-family: var(--font-body); font-size: 0.82rem; color: var(--text-mid);
    cursor: pointer; transition: all 0.2s;
  }
  .logout-btn:hover { color: var(--gold-deep); border-color: rgba(180,140,100,0.4); }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .stat-card {
    background: rgba(255,252,246,0.82);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(200,170,130,0.2);
    border-radius: 1.5rem;
    padding: 1.4rem 1.5rem;
    display: flex; align-items: center; gap: 1rem;
    box-shadow: 0 4px 24px rgba(90,60,30,0.07);
    animation: cardIn 0.8s both;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(90,60,30,0.12); }
  .stat-icon-wrap {
    width: 46px; height: 46px; border-radius: 1rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .stat-body { display: flex; flex-direction: column; }
  .stat-value { font-size: 2rem; font-weight: 700; line-height: 1; font-family: var(--font-body); }
  .stat-label { font-size: 0.78rem; color: var(--text-light); margin-top: 0.2rem; }

  /* ── Charts grid ── */
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  @media (max-width: 700px) {
    .charts-grid { grid-template-columns: 1fr; }
  }

  .chart-card {
    background: rgba(255,252,246,0.82);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(200,170,130,0.2);
    border-radius: 1.5rem;
    padding: 1.5rem;
    box-shadow: 0 4px 24px rgba(90,60,30,0.07);
    animation: cardIn 0.9s both;
    display: flex; flex-direction: column; gap: 1.25rem;
  }

  .chart-card-header { display: flex; align-items: center; justify-content: space-between; }
  .chart-card-title {
    font-family: var(--font-serif);
    font-size: 1rem; font-weight: 500; color: var(--text-dark);
  }
  .chart-card-badge {
    font-size: 0.75rem; color: var(--text-light);
    background: rgba(212,184,150,0.15);
    border: 1px solid rgba(180,140,100,0.15);
    padding: 0.2rem 0.6rem; border-radius: 2rem;
  }

  /* Donut */
  .donut-wrap { display: flex; align-items: center; gap: 1.5rem; }
  .donut-svg { width: 140px; height: 140px; flex-shrink: 0; }
  .donut-legend { display: flex; flex-direction: column; gap: 0.75rem; }
  .legend-item { display: flex; align-items: center; gap: 0.6rem; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-label { font-size: 0.82rem; color: var(--text-mid); flex: 1; }
  .legend-val { font-size: 0.95rem; font-weight: 700; color: var(--text-dark); }

  /* Radials */
  .radials-wrap { display: flex; justify-content: space-around; align-items: flex-end; }
  .radial-ring-item { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
  .radial-label { font-size: 0.72rem; color: var(--text-light); text-align: center; max-width: 70px; }

  /* HBars */
  .event-bars { display: flex; flex-direction: column; gap: 0.75rem; }
  .hbar-row { display: flex; flex-direction: column; gap: 0.25rem; }
  .hbar-meta { display: flex; justify-content: space-between; align-items: center; }
  .hbar-label { font-size: 0.78rem; color: var(--text-mid); }
  .hbar-count { font-size: 0.82rem; font-weight: 600; color: var(--text-dark); }
  .hbar-track {
    height: 8px; border-radius: 1rem;
    background: rgba(212,184,150,0.2);
    overflow: hidden;
  }
  .hbar-fill { height: 100%; border-radius: 1rem; }

  /* Calculator */
  .calculator-card { grid-column: span 2; }
  @media (max-width: 700px) { .calculator-card { grid-column: span 1; } }

  .calc-wrap { display: flex; flex-direction: column; gap: 1rem; }
  .calc-label { font-size: 0.82rem; color: var(--text-mid); }
  .calc-input {
    padding: 0.8rem 1rem;
    background: rgba(255,252,246,0.9);
    border: 1px solid rgba(180,140,100,0.25);
    border-radius: 0.9rem;
    font-family: var(--font-body); font-size: 1rem; color: var(--text-dark);
    outline: none; width: 100%; max-width: 260px;
    transition: all 0.2s;
  }
  .calc-input:focus { border-color: var(--gold-light); box-shadow: 0 0 0 3px rgba(180,140,100,0.12); }
  .calc-input::-webkit-inner-spin-button, .calc-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .calc-input[type=number] { -moz-appearance: textfield; }

  .calc-results {
    display: flex; align-items: center; gap: 2.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(212,184,150,0.08);
    border: 1px solid rgba(180,140,100,0.12);
    border-radius: 1.25rem;
    animation: cardIn 0.5s both;
  }
  .calc-ring-wrap { flex-shrink: 0; }
  .calc-stats { display: flex; align-items: center; gap: 2rem; }
  .calc-stat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
  .calc-stat-num { font-size: 2.2rem; font-weight: 700; line-height: 1; }
  .calc-stat-label { font-size: 0.75rem; color: var(--text-light); }
  .calc-divider { width: 1px; height: 50px; background: rgba(180,140,100,0.2); }

  /* ── Table section ── */
  .table-section {
    background: rgba(255,252,246,0.82);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(200,170,130,0.2);
    border-radius: 1.5rem;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(90,60,30,0.07);
    animation: cardIn 1s both;
  }
  .table-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding: 1.5rem 1.5rem 1.25rem;
    border-bottom: 1px solid rgba(180,140,100,0.12);
  }
  .table-title { font-family: var(--font-serif); font-size: 1.05rem; color: var(--text-dark); font-weight: 500; }
  .table-sub { font-size: 0.78rem; color: var(--text-light); margin-top: 0.15rem; }
  .table-toggle {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, var(--gold-deep), var(--gold));
    color: #FAF5EE;
    border: none; border-radius: 2rem;
    font-family: var(--font-body); font-size: 0.82rem; font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(140,100,60,0.2);
    transition: all 0.25s;
  }
  .table-toggle:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(140,100,60,0.3); }

  .table-wrap { animation: cardIn 0.5s both; }
  .table-scroll { overflow-x: auto; }
  .rsvp-table { width: 100%; text-align: right; border-collapse: collapse; }
  .rsvp-table thead { background: rgba(212,184,150,0.08); }
  .rsvp-table th {
    padding: 0.85rem 1.25rem;
    font-size: 0.78rem; font-weight: 600;
    color: var(--text-light); letter-spacing: 0.03em;
    white-space: nowrap;
    border-bottom: 1px solid rgba(180,140,100,0.1);
  }
  .rsvp-table tbody tr {
    border-bottom: 1px solid rgba(180,140,100,0.07);
    transition: background 0.15s;
  }
  .rsvp-table tbody tr:hover { background: rgba(212,184,150,0.06); }
  .rsvp-table td { padding: 0.85rem 1.25rem; font-size: 0.875rem; vertical-align: middle; }
  .td-name { font-weight: 600; color: var(--text-dark); }
  .td-muted { color: var(--text-mid); }
  .td-events { font-size: 0.78rem; max-width: 160px; }
  .td-phone { color: var(--text-light); font-size: 0.82rem; }
  .td-date { color: var(--text-light); font-size: 0.78rem; }
  .td-empty { padding: 2.5rem; text-align: center; color: var(--text-light); }

  .td-actions { text-align: center; }
  .delete-btn {
    background: rgba(201,128,106,0.1);
    color: #9A4030;
    border: 1px solid rgba(201,128,106,0.3);
    border-radius: 0.5rem;
    padding: 0.35rem 0.65rem;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--font-body);
  }
  .delete-btn:hover { background: rgba(201,128,106,0.2); }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.65rem;
    border-radius: 2rem;
    font-size: 0.72rem; font-weight: 600;
  }
  .badge-yes { background: rgba(74,139,92,0.1); color: #3A7A50; }
  .badge-no { background: rgba(201,128,106,0.1); color: #9A4030; }

  @media (max-width: 500px) {
    .dash-content { padding: 1.25rem 0.9rem 3rem; }
    .kpi-grid { grid-template-columns: 1fr 1fr; }
    .donut-wrap { flex-direction: column; }
    .calc-results { flex-direction: column; gap: 1.25rem; }
  }
`;