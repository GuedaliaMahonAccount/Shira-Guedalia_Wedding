"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { fetchStats, exportGuestsData, deleteRsvp, updateRsvp, updateGuestTable } from "./actions";
import { TABLES } from "../../lib/tables";

const MAX_PER_TABLE = 12;
const isGroom = (s) => s === "חתן";
const isBride = (s) => s === "כלה";
const noSide = (s) => !isGroom(s) && !isBride(s);
const tableLabel = (t) => `${t.number} ${t.section === "גברים" ? "♂" : "♀"}`;

// ── Hooks ────────────────────────────────────────────────────────
function useInView(threshold = 0.3) {
    const [seen, setSeen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, seen];
}

function useCountUp(target, started, duration = 1000) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!started || target === 0) { setValue(target); return; }
        const start = performance.now();
        let raf;
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, started, duration]);
    return value;
}

// ── Small components ─────────────────────────────────────────────
function HBar({ label, value, max, color }) {
    const [ref, seen] = useInView();
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div ref={ref} className="hbar-row">
            <div className="hbar-meta">
                <span className="hbar-label">{label}</span>
                <span className="hbar-count">{value}</span>
            </div>
            <div className="hbar-track">
                <div className="hbar-fill" style={{ width: seen ? `${pct}%` : "0%", background: color }} />
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, accent }) {
    const [ref, seen] = useInView();
    const count = useCountUp(value, seen);
    return (
        <div ref={ref} className="stat-card">
            <div className="stat-icon-wrap" style={{ background: accent + "1F", color: accent }}>{icon}</div>
            <div className="stat-body">
                <span className="stat-value" style={{ color: accent }}>{count.toLocaleString("he-IL")}</span>
                <span className="stat-label">{label}</span>
            </div>
        </div>
    );
}

function RadialRing({ value, max, label, color }) {
    const [ref, seen] = useInView();
    const r = 28, c = 36;
    const circ = 2 * Math.PI * r;
    const pct = max > 0 ? value / max : 0;
    return (
        <div ref={ref} className="radial-ring-item">
            <svg viewBox="0 0 72 72" className="radial-svg">
                <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(212,184,150,0.22)" strokeWidth="7" />
                <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${seen ? circ * pct : 0} ${circ}`}
                    transform={`rotate(-90 ${c} ${c})`}
                    style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.23,1,0.32,1)" }} />
                <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="#3D2B1F" fontFamily="Assistant">{value}</text>
            </svg>
            <span className="radial-label">{label}</span>
        </div>
    );
}

function SortIndicator({ active, direction }) {
    return <span className={`sort-indicator ${active ? "active" : ""}`} aria-hidden="true">{active ? (direction === "asc" ? "▲" : "▼") : "↕"}</span>;
}

function SortTh({ label, k, sortConfig, onSort }) {
    return (
        <th className="th-sortable" onClick={() => onSort(k)} title={`מיון לפי ${label}`}>
            <div className="th-content"><span>{label}</span><SortIndicator active={sortConfig.key === k} direction={sortConfig.direction} /></div>
        </th>
    );
}

const Icon = {
    mail: <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1zM3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.5" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    logout: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
    chevron: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M20 20L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
    reset: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

// ── Main ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [passcode, setPasscode] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [totalInvitations, setTotalInvitations] = useState(0);
    const [showTable, setShowTable] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [sideFilter, setSideFilter] = useState("all");
    const [attendanceFilter, setAttendanceFilter] = useState("all");
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const handleSort = (key) => {
        setSortConfig((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { key, direction: key === "names" || key === "side" ? "asc" : "desc" }
        );
    };

    const sideCounts = useMemo(() => {
        const rsvps = data?.rsvps || [];
        const sumGuests = (fn) => rsvps.filter((r) => r.is_attending === 1 && (!fn || fn(r))).reduce((s, r) => s + (r.guest_count || 0), 0);
        const allGuests = sumGuests();
        return {
            allGuests,
            groomGuests: sumGuests((r) => isGroom(r.side)),
            brideGuests: sumGuests((r) => isBride(r.side)),
            noneGuests: sumGuests((r) => noSide(r.side)),
            attendingGuests: allGuests,
            notAttendingCount: rsvps.filter((r) => r.is_attending === 0).length,
        };
    }, [data?.rsvps]);

    const hasActiveFilters = searchTerm.trim() !== "" || sideFilter !== "all" || attendanceFilter !== "all";
    const resetFilters = () => { setSearchTerm(""); setSideFilter("all"); setAttendanceFilter("all"); };

    const filteredAndSortedRsvps = useMemo(() => {
        if (!data?.rsvps) return [];
        let list = [...data.rsvps];

        if (sideFilter === "חתן") list = list.filter((r) => isGroom(r.side));
        else if (sideFilter === "כלה") list = list.filter((r) => isBride(r.side));
        else if (sideFilter === "none") list = list.filter((r) => noSide(r.side));

        if (attendanceFilter === "yes") list = list.filter((r) => r.is_attending === 1);
        else if (attendanceFilter === "no") list = list.filter((r) => r.is_attending === 0);

        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            list = list.filter((r) =>
                (r.names || "").toLowerCase().includes(q) ||
                (r.phone || "").toLowerCase().includes(q) ||
                (r.admin_notes || "").toLowerCase().includes(q) ||
                (r.side || "").toLowerCase().includes(q) ||
                (Array.isArray(r.guests) && r.guests.some((g) => (g.name || "").toLowerCase().includes(q)))
            );
        }

        list.sort((a, b) => {
            let res = 0;
            switch (sortConfig.key) {
                case "names": res = (a.names || "").trim().localeCompare((b.names || "").trim(), "he"); break;
                case "is_attending": res = (a.is_attending || 0) - (b.is_attending || 0); break;
                case "side": res = (a.side || "").localeCompare(b.side || "", "he"); break;
                case "guest_count":
                    res = (a.is_attending === 1 ? a.guest_count || 0 : 0) - (b.is_attending === 1 ? b.guest_count || 0 : 0); break;
                case "created_at":
                    res = (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0); break;
                default: break;
            }
            return sortConfig.direction === "asc" ? res : -res;
        });
        return list;
    }, [data?.rsvps, sideFilter, attendanceFilter, searchTerm, sortConfig]);

    const filteredStats = useMemo(() => ({
        totalCount: filteredAndSortedRsvps.length,
        totalGuests: filteredAndSortedRsvps.reduce((acc, r) => acc + (r.is_attending === 1 ? r.guest_count || 0 : 0), 0),
    }), [filteredAndSortedRsvps]);

    // ── Handlers ──
    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setError(null);
        const res = await fetchStats(passcode);
        if (res.error) setError(res.error);
        else { setData(res); setIsAuthenticated(true); }
    };

    const handleExport = async (type) => {
        setIsExporting(true);
        const res = await exportGuestsData(passcode, type);
        setIsExporting(false);
        if (res.error) { alert(res.error); return; }
        const bin = window.atob(res.base64Excel);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `guests_export_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        handleLogin();
        alert("הייצוא בוצע בהצלחה!");
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הרשומה של ${name}?`)) return;
        const res = await deleteRsvp(passcode, id);
        if (res.error) alert(res.error); else handleLogin();
    };

    const handleEdit = (rsvp) => {
        setEditingId(rsvp.id);
        setEditForm({
            names: rsvp.names || "",
            side: rsvp.side || "",
            guest_count: rsvp.guest_count || 0,
            phone: rsvp.phone || "",
            admin_notes: rsvp.admin_notes || "",
        });
    };
    const handleEditChange = (field, value) => setEditForm((p) => ({ ...p, [field]: value }));
    const handleEditCancel = () => { setEditingId(null); setEditForm({}); };
    const handleEditSave = async () => {
        setIsSaving(true);
        const res = await updateRsvp(passcode, editingId, editForm);
        setIsSaving(false);
        if (res.error) alert(res.error);
        else { handleEditCancel(); handleLogin(); }
    };

    const handleGuestTableChange = async (rsvpId, guestIndex, tableNumber) => {
        const res = await updateGuestTable(passcode, rsvpId, guestIndex, tableNumber || null);
        if (res.error) alert(res.error); else handleLogin();
    };

    // ── Seating ──
    const { tableGroups, unassignedGuests, totalAssignedGuests } = useMemo(() => {
        const groups = {};
        TABLES.forEach((t) => { groups[t.number] = { ...t, guests: [] }; });
        const unassigned = [];
        let assigned = 0;
        (data?.rsvps || []).forEach((rsvp) => {
            if (rsvp.is_attending !== 1 || !Array.isArray(rsvp.guests)) return;
            rsvp.guests.forEach((g, gi) => {
                const tNum = g.tableNumber ? parseInt(g.tableNumber, 10) : null;
                const guest = {
                    rsvpId: rsvp.id, guestIndex: gi,
                    name: (g.name || "").trim() || `אורח ${gi + 1}`,
                    side: rsvp.side, phone: rsvp.phone, tableNumber: tNum,
                };
                if (tNum && groups[tNum]) { groups[tNum].guests.push(guest); assigned++; }
                else unassigned.push(guest);
            });
        });
        return { tableGroups: groups, unassignedGuests: unassigned, totalAssignedGuests: assigned };
    }, [data?.rsvps]);

    // ── Login ──
    if (!isAuthenticated) {
        return (
            <main className="admin-login-page">
                <div className="admin-bg-blob b1" />
                <div className="admin-bg-blob b2" />
                <div className="login-card">
                    <div className="login-header">
                        <svg viewBox="0 0 40 40" fill="none" className="login-logo">
                            <circle cx="20" cy="20" r="18" stroke="rgba(180,140,100,0.5)" strokeWidth="1.2" fill="rgba(180,140,100,0.06)" />
                            <path d="M20 10 Q26 14 26 20 Q26 26 20 30 Q14 26 14 20 Q14 14 20 10Z" stroke="rgba(180,140,100,0.7)" strokeWidth="1" fill="rgba(180,140,100,0.12)" />
                            <circle cx="20" cy="20" r="3" fill="rgba(180,140,100,0.6)" />
                        </svg>
                        <h1 className="login-title">כניסת מנהל</h1>
                        <p className="login-sub">שירה & גדליה · לוח בקרה</p>
                    </div>
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="login-field">
                            <label className="login-label" htmlFor="admin-pass">סיסמה</label>
                            <input id="admin-pass" type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)}
                                className="login-input" required placeholder="••••••••" autoComplete="current-password" />
                        </div>
                        {error && <p className="login-error" role="alert">{error}</p>}
                        <button type="submit" className="login-btn">
                            <span>כניסה</span>
                            <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        </button>
                    </form>
                </div>
                <style>{adminStyles}</style>
            </main>
        );
    }

    // ── Dashboard ──
    const stats = data?.stats || {};
    const totalResponses = stats.totalResponses || 0;
    const totalGuests = stats.totalGuests || 0;
    const totalChuppah = stats.totalChuppah || 0;
    const totalEat = stats.totalEat || 0;
    const guestsGroomSide = stats.guestsGroomSide || 0;
    const guestsBrideSide = stats.guestsBrideSide || 0;
    const guestsNoSide = stats.guestsNoSide || 0;
    const attendingGroomSide = stats.attendingGroomSide || 0;
    const attendingBrideSide = stats.attendingBrideSide || 0;

    const pending = totalInvitations > 0 ? Math.max(0, totalInvitations - totalResponses) : null;
    const responseRate = totalInvitations > 0 ? Math.min(Math.round((totalResponses / totalInvitations) * 100), 100) : 0;
    const ringC = 2 * Math.PI * 42;

    return (
        <main className="admin-dashboard">
            <div className="admin-bg-blob b1" />
            <div className="admin-bg-blob b2" />

            <div className="dash-content">
                {/* Header */}
                <header className="dash-header">
                    <div className="dash-header-left">
                        <div className="dash-logo">
                            <svg viewBox="0 0 32 32" fill="none">
                                <path d="M16 4 Q22 8 22 16 Q22 24 16 28 Q10 24 10 16 Q10 8 16 4Z" stroke="rgba(180,140,100,0.7)" strokeWidth="1" fill="rgba(180,140,100,0.12)" />
                                <circle cx="16" cy="16" r="3" fill="rgba(180,140,100,0.6)" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="dash-title">לוח בקרה</h1>
                            <p className="dash-sub">שירה &amp; גדליה · 29 באוקטובר 2026</p>
                        </div>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="logout-btn">{Icon.logout}<span>התנתקות</span></button>
                </header>

                {/* KPI */}
                <section className="kpi-grid">
                    <StatCard label="תגובות שהתקבלו" value={totalResponses} accent="#B48C64" icon={Icon.mail} />
                    <StatCard label="אורחים מאושרים" value={totalGuests} accent="#4A8B5C" icon={Icon.users} />
                </section>

                {/* Charts */}
                <section className="charts-grid">
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2 className="chart-card-title">פילוח לפי צד</h2>
                            <span className="chart-card-badge">{totalGuests} אורחים</span>
                        </div>
                        <div className="radials-wrap">
                            <RadialRing value={guestsGroomSide} max={totalGuests} label="צד חתן" color="#5B8A72" />
                            <RadialRing value={guestsBrideSide} max={totalGuests} label="צד כלה" color="#C9806A" />
                            {guestsNoSide > 0 && <RadialRing value={guestsNoSide} max={totalGuests} label="לא צוין" color="#A89080" />}
                        </div>
                        <div className="event-bars">
                            <HBar label={`צד חתן (${attendingGroomSide} משפחות)`} value={guestsGroomSide} max={totalGuests} color="linear-gradient(90deg,#5B8A72,#8AB8A0)" />
                            <HBar label={`צד כלה (${attendingBrideSide} משפחות)`} value={guestsBrideSide} max={totalGuests} color="linear-gradient(90deg,#C9806A,#E8B8A8)" />
                            {guestsNoSide > 0 && <HBar label="לא צוין צד" value={guestsNoSide} max={totalGuests} color="linear-gradient(90deg,#A89080,#C9BEB5)" />}
                        </div>
                    </div>

                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h2 className="chart-card-title">פילוח לפי אירוע</h2>
                            <span className="chart-card-badge">{totalGuests} אורחים</span>
                        </div>
                        <div className="radials-wrap">
                            <RadialRing value={totalChuppah} max={totalGuests} label="חופה" color="#C9A87C" />
                            <RadialRing value={totalEat} max={totalGuests} label="אוכל" color="#B48C64" />
                        </div>
                        <div className="event-bars">
                            <HBar label="חופה" value={totalChuppah} max={totalGuests} color="linear-gradient(90deg,#C9A87C,#E8D5BC)" />
                            <HBar label="אוכל" value={totalEat} max={totalGuests} color="linear-gradient(90deg,#B48C64,#D4B896)" />
                        </div>
                    </div>

                    <div className="chart-card calculator-card">
                        <div className="chart-card-header"><h2 className="chart-card-title">מחשבון מוזמנים</h2></div>
                        <div className="calc-wrap">
                            <label className="calc-label" htmlFor="calc-inv">סה״כ הזמנות שנשלחו</label>
                            <input id="calc-inv" type="number" min="0" inputMode="numeric" value={totalInvitations || ""}
                                onChange={(e) => setTotalInvitations(parseInt(e.target.value) || 0)}
                                className="calc-input" placeholder="לדוגמה: 200" />
                            {totalInvitations > 0 && (
                                <div className="calc-results">
                                    <svg viewBox="0 0 100 100" className="calc-ring">
                                        <defs>
                                            <linearGradient id="calc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#B48C64" /><stop offset="100%" stopColor="#D4B896" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(212,184,150,0.22)" strokeWidth="10" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#calc-grad)" strokeWidth="10" strokeLinecap="round"
                                            strokeDasharray={`${ringC * (responseRate / 100)} ${ringC}`} transform="rotate(-90 50 50)"
                                            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.23,1,0.32,1)" }} />
                                        <text x="50" y="47" textAnchor="middle" fontSize="18" fontWeight="700" fill="#3D2B1F" fontFamily="Assistant">{responseRate}%</text>
                                        <text x="50" y="62" textAnchor="middle" fontSize="9" fill="#A89080" fontFamily="Assistant">שיעור תגובה</text>
                                    </svg>
                                    <div className="calc-stats">
                                        <div className="calc-stat">
                                            <span className="calc-stat-num" style={{ color: "#B48C64" }}>{totalResponses}</span>
                                            <span className="calc-stat-label">ענו</span>
                                        </div>
                                        <div className="calc-divider" />
                                        <div className="calc-stat">
                                            <span className="calc-stat-num" style={{ color: pending > 0 ? "#C9806A" : "#8A9E8C" }}>{pending}</span>
                                            <span className="calc-stat-label">טרם ענו</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RSVP table */}
                <section className="table-section">
                    <div className="table-header">
                        <div className="table-header-text">
                            <h2 className="table-title">רשימת משיבים</h2>
                            <p className="table-sub">
                                {hasActiveFilters
                                    ? `${filteredStats.totalGuests} אורחים מגיעים (${filteredStats.totalCount} רשומות מסוננות)`
                                    : `${totalGuests} אורחים מגיעים בסה״כ (${data.rsvps.length} רשומות)`}
                            </p>
                        </div>
                        <div className="table-actions">
                            <button className="table-toggle" onClick={() => handleExport("all")} disabled={isExporting}>
                                {isExporting ? "מייצא..." : "יצוא הכל (Excel)"}
                            </button>
                            <button className="table-toggle toggle-green" onClick={() => handleExport("new")} disabled={isExporting}>
                                {isExporting ? "מייצא..." : "יצוא חדשים (Excel)"}
                            </button>
                            <button className="table-toggle" onClick={() => setShowTable((t) => !t)} aria-expanded={showTable}>
                                <span>{showTable ? "הסתר טבלה" : "הצג טבלה"}</span>
                                <span style={{ display: "flex", transform: showTable ? "rotate(180deg)" : "none", transition: "transform .3s" }}>{Icon.chevron}</span>
                            </button>
                        </div>
                    </div>

                    {showTable && (
                        <div className="table-wrap">
                            <div className="table-filters-container">
                                <div className="filters-row">
                                    <div className="search-box">
                                        <span className="search-icon">{Icon.search}</span>
                                        <input type="text" placeholder="חיפוש לפי שם, טלפון, הערה..." value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                                        {searchTerm && <button className="search-clear-btn" onClick={() => setSearchTerm("")} title="נקה חיפוש" aria-label="נקה חיפוש">✕</button>}
                                    </div>

                                    <div className="filter-group">
                                        <span className="filter-group-title">צד</span>
                                        <div className="filter-pills">
                                            {[
                                                ["all", "הכל", sideCounts.allGuests, ""],
                                                ["חתן", "חתן", sideCounts.groomGuests, "pill-groom"],
                                                ["כלה", "כלה", sideCounts.brideGuests, "pill-bride"],
                                                ["none", "לא צוין", sideCounts.noneGuests, ""],
                                            ].map(([val, text, n, cls]) => (
                                                <button key={val} type="button" className={`filter-pill ${cls} ${sideFilter === val ? "active" : ""}`} onClick={() => setSideFilter(val)}>
                                                    {text} <span className="pill-count">{n}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="filter-group">
                                        <span className="filter-group-title">הגעה</span>
                                        <div className="filter-pills">
                                            {[
                                                ["all", "הכל", null, ""],
                                                ["yes", "מגיעים", sideCounts.attendingGuests, "pill-yes"],
                                                ["no", "לא מגיעים", sideCounts.notAttendingCount, "pill-no"],
                                            ].map(([val, text, n, cls]) => (
                                                <button key={val} type="button" className={`filter-pill ${cls} ${attendanceFilter === val ? "active" : ""}`} onClick={() => setAttendanceFilter(val)}>
                                                    {text} {n !== null && <span className="pill-count">{n}</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="filters-status-bar">
                                    <div className="filters-summary">
                                        <div className="summary-highlight-pill">
                                            <span className="summary-big-num">{filteredStats.totalGuests}</span>
                                            <span className="summary-big-label">אורחים מגיעים</span>
                                        </div>
                                        <span className="summary-meta">
                                            מתוך <strong>{filteredStats.totalCount}</strong> משפחות / רשומות (מתוך {data.rsvps.length})
                                        </span>
                                    </div>
                                    {hasActiveFilters && (
                                        <button type="button" className="reset-filters-btn" onClick={resetFilters}>{Icon.reset} איפוס מסננים</button>
                                    )}
                                </div>
                            </div>

                            <div className="table-scroll">
                                <table className="rsvp-table">
                                    <thead>
                                        <tr>
                                            <SortTh label="שם" k="names" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortTh label="מגיע?" k="is_attending" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortTh label="צד" k="side" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortTh label="אורחים" k="guest_count" sortConfig={sortConfig} onSort={handleSort} />
                                            <th>אירועים</th>
                                            <th>טלפון</th>
                                            <th>הערות מנהל</th>
                                            <th>שולחן</th>
                                            <SortTh label="תאריך" k="created_at" sortConfig={sortConfig} onSort={handleSort} />
                                            <th>פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedRsvps.map((rsvp) => {
                                            const isEditing = editingId === rsvp.id;
                                            const attending = rsvp.is_attending === 1;
                                            return (
                                                <tr key={rsvp.id} className={isEditing ? "editing-row" : ""}>
                                                    <td data-label="שם" className="td-name">
                                                        {isEditing
                                                            ? <input className="edit-input" value={editForm.names} onChange={(e) => handleEditChange("names", e.target.value)} />
                                                            : rsvp.names}
                                                    </td>
                                                    <td data-label="מגיע?">
                                                        {attending ? <span className="badge badge-yes">כן ✓</span> : <span className="badge badge-no">לא</span>}
                                                    </td>
                                                    <td data-label="צד">
                                                        {isEditing ? (
                                                            <select className="edit-select" value={editForm.side} onChange={(e) => handleEditChange("side", e.target.value)}>
                                                                <option value="">לא צוין</option>
                                                                <option value="חתן">חתן</option>
                                                                <option value="כלה">כלה</option>
                                                            </select>
                                                        ) : isGroom(rsvp.side) ? <span className="badge badge-groom">חתן</span>
                                                            : isBride(rsvp.side) ? <span className="badge badge-bride">כלה</span>
                                                                : <span className="td-muted">—</span>}
                                                    </td>
                                                    <td data-label="אורחים" className="td-muted">
                                                        {isEditing
                                                            ? <input className="edit-input edit-input-sm" type="number" min="0" value={editForm.guest_count}
                                                                onChange={(e) => handleEditChange("guest_count", parseInt(e.target.value) || 0)} />
                                                            : attending ? rsvp.guest_count : "—"}
                                                    </td>
                                                    <td data-label="אירועים" className="td-muted td-events">
                                                        {attending
                                                            ? (rsvp.guests?.length > 0
                                                                ? rsvp.guests.map((g) => {
                                                                    const t = [];
                                                                    if (g.chuppah) t.push("חופה");
                                                                    if (g.eat !== false) t.push("אוכל");
                                                                    return t.join("+");
                                                                }).join(", ")
                                                                : rsvp.attendance_type)
                                                            : "—"}
                                                    </td>
                                                    <td data-label="טלפון" className="td-phone">
                                                        {isEditing
                                                            ? <input className="edit-input edit-input-sm" value={editForm.phone} dir="ltr" onChange={(e) => handleEditChange("phone", e.target.value)} />
                                                            : <bdi dir="ltr">{rsvp.phone || "—"}</bdi>}
                                                    </td>
                                                    <td data-label="הערות מנהל" className="td-muted">
                                                        {isEditing
                                                            ? <input className="edit-input" value={editForm.admin_notes} placeholder="הערות..." onChange={(e) => handleEditChange("admin_notes", e.target.value)} />
                                                            : rsvp.admin_notes || "—"}
                                                    </td>
                                                    <td data-label="שולחן" className="td-muted td-tables">
                                                        {attending && rsvp.guests?.length > 0 ? (
                                                            <div className="guest-table-list">
                                                                {rsvp.guests.map((g, gi) => {
                                                                    const gName = g.name || `אורח ${gi + 1}`;
                                                                    return (
                                                                        <div key={gi} className="guest-table-row">
                                                                            <span className="guest-table-name" title={gName}>{gName}</span>
                                                                            <select className="edit-select select-mini" value={g.tableNumber || ""}
                                                                                onChange={(e) => handleGuestTableChange(rsvp.id, gi, e.target.value)}>
                                                                                <option value="">—</option>
                                                                                {TABLES.map((t) => <option key={t.number} value={t.number}>{tableLabel(t)}</option>)}
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : "—"}
                                                    </td>
                                                    <td data-label="תאריך" className="td-date">{new Date(rsvp.created_at).toLocaleDateString("he-IL")}</td>
                                                    <td data-label="פעולות" className="td-actions">
                                                        <div className="edit-actions">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={handleEditSave} className="save-btn" disabled={isSaving}>{isSaving ? "שומר..." : "שמור"}</button>
                                                                    <button onClick={handleEditCancel} className="cancel-btn" disabled={isSaving}>ביטול</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleEdit(rsvp)} className="edit-btn">עריכה</button>
                                                                    <button onClick={() => handleDelete(rsvp.id, rsvp.names)} className="delete-btn">מחיקה</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAndSortedRsvps.length === 0 && (
                                            <tr className="empty-row">
                                                <td colSpan="10" className="td-empty">
                                                    {data.rsvps.length === 0 ? "אין עדיין תגובות..." : (
                                                        <div className="empty-box">
                                                            <span>לא נמצאו רשומות התואמות את הסינון הנוכחי.</span>
                                                            <button type="button" onClick={resetFilters} className="reset-filters-btn">איפוס מסננים</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* Seating */}
                <section className="admin-seating-section">
                    <div className="admin-seating-header">
                        <div>
                            <h2 className="admin-seating-title">סידורי שולחנות וניהול הושבה</h2>
                            <p className="admin-seating-sub">סקירת {TABLES.length} השולחנות (עד {MAX_PER_TABLE} איש לשולחן), זיהוי חריגות והעברת אורחים בקליק אחד</p>
                        </div>
                        <div className="admin-seating-stats-pills">
                            <span className="seating-stat-pill">משובצים: <strong>{totalAssignedGuests}</strong></span>
                            <span className={`seating-stat-pill ${unassignedGuests.length > 0 ? "warning" : "success"}`}>
                                לא משובצים: <strong>{unassignedGuests.length}</strong>
                            </span>
                        </div>
                    </div>

                    {unassignedGuests.length > 0 && (
                        <div className="unassigned-drawer">
                            <div className="unassigned-header">
                                <span className="unassigned-badge">⚠️ דורש שיבוץ ({unassignedGuests.length})</span>
                                <span className="unassigned-hint">אורחים שאישרו הגעה אך טרם שובצו לשולחן</span>
                            </div>
                            <div className="unassigned-list">
                                {unassignedGuests.map((g, idx) => (
                                    <div key={`${g.rsvpId}_${g.guestIndex}_${idx}`} className="unassigned-guest-item">
                                        <div className="unassigned-guest-info">
                                            <span className="unassigned-guest-name" title={g.name}>{g.name}</span>
                                            {g.side && <span className="unassigned-guest-side">{g.side}</span>}
                                        </div>
                                        <select className="table-assign-select" value="" aria-label={`שבץ את ${g.name} לשולחן`}
                                            onChange={(e) => handleGuestTableChange(g.rsvpId, g.guestIndex, e.target.value)}>
                                            <option value="" disabled>שבץ לשולחן...</option>
                                            {TABLES.map((t) => {
                                                const count = tableGroups[t.number]?.guests?.length || 0;
                                                return (
                                                    <option key={t.number} value={t.number} disabled={count >= MAX_PER_TABLE}>
                                                        שולחן {t.number} ({t.category}) [{count}/{MAX_PER_TABLE}]
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="admin-tables-grid">
                        {TABLES.map((table) => {
                            const guests = tableGroups[table.number]?.guests || [];
                            const count = guests.length;
                            const isOver = count > MAX_PER_TABLE;
                            const isFull = count === MAX_PER_TABLE;
                            const isNear = count >= MAX_PER_TABLE - 2 && count < MAX_PER_TABLE;
                            const state = isOver ? "over" : isFull ? "full" : isNear ? "near" : "";

                            return (
                                <div key={table.number} className={`admin-table-card ${isOver ? "overloaded" : isFull ? "full" : ""}`}>
                                    <div className="admin-table-card-header">
                                        <div className="admin-table-id-group">
                                            <div className="admin-table-circle-badge">{table.number}</div>
                                            <div className="admin-table-id-text">
                                                <div className="admin-table-title-row">
                                                    <span className="admin-table-number-text">שולחן {table.number}</span>
                                                    <span className={`admin-table-gender-tag ${table.section === "גברים" ? "men" : "women"}`}>{table.section}</span>
                                                </div>
                                                <div className="admin-table-category-text" title={table.category}>{table.category}</div>
                                            </div>
                                        </div>
                                        <div className={`capacity-gauge gauge-${state}`}>
                                            <span className="capacity-numbers"><strong>{count}</strong> / {MAX_PER_TABLE}</span>
                                            {isOver && <span className="over-alert-badge">חריגה! (+{count - MAX_PER_TABLE})</span>}
                                        </div>
                                    </div>

                                    <div className="capacity-bar-track">
                                        <div className={`capacity-bar-fill bar-${state}`} style={{ width: `${Math.min((count / MAX_PER_TABLE) * 100, 100)}%` }} />
                                    </div>

                                    <div className="admin-table-guests-box">
                                        {count === 0 ? (
                                            <div className="admin-table-empty">שולחן ריק ({MAX_PER_TABLE} מקומות פנויים)</div>
                                        ) : (
                                            <div className="admin-table-guests-list">
                                                {guests.map((g, gi) => (
                                                    <div key={`${g.rsvpId}_${g.guestIndex}_${gi}`} className="admin-table-guest-row">
                                                        <div className="guest-row-left">
                                                            <span className="guest-seat-num">{gi + 1}.</span>
                                                            <span className="guest-row-name" title={g.name}>{g.name}</span>
                                                            {g.side && <span className="guest-row-side-badge">{g.side}</span>}
                                                        </div>
                                                        <select className="quick-move-select" value={table.number} title="העבר לשולחן אחר" aria-label={`העבר את ${g.name} לשולחן אחר`}
                                                            onChange={(e) => handleGuestTableChange(g.rsvpId, g.guestIndex, e.target.value)}>
                                                            <option value="">הסר שיבוץ</option>
                                                            {TABLES.map((o) => {
                                                                const oc = tableGroups[o.number]?.guests?.length || 0;
                                                                return (
                                                                    <option key={o.number} value={o.number}>
                                                                        {o.number === table.number ? `✓ שולחן ${o.number}` : `← שולחן ${o.number} (${oc}/${MAX_PER_TABLE})`}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            <style>{adminStyles}</style>
        </main>
    );
}

// ── Styles ───────────────────────────────────────────────────────
const adminStyles = `
  :root {
    --gold: #B48C64; --gold-light: #C9A87C; --gold-deep: #8B6943;
    --terracotta: #C9806A; --sage: #8A9E8C;
    --text-dark: #3D2B1F; --text-mid: #7A6055; --text-light: #A89080;
    --line: rgba(180,140,100,0.16);
    --card: rgba(255,252,246,0.86);
    --font-serif: 'Noto Serif Hebrew', Georgia, serif;
    --font-body: 'Assistant', system-ui, sans-serif;
  }

  .admin-login-page *, .admin-dashboard * { box-sizing: border-box; }
  .admin-login-page, .admin-dashboard { margin: 0; }

  .admin-login-page, .admin-dashboard {
    min-height: 100vh; min-height: 100dvh;
    font-family: var(--font-body);
    color: var(--text-dark);
    position: relative;
    overflow-x: hidden;
    direction: rtl;
    background:
      radial-gradient(ellipse at 70% 10%, #F5EBD8 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, #EDE0D0 0%, transparent 50%),
      linear-gradient(160deg, #FAF7F2 0%, #F4ECE0 100%);
  }
  .admin-dashboard button, .admin-dashboard input, .admin-dashboard select,
  .admin-login-page button, .admin-login-page input { font-family: var(--font-body); }
  .admin-dashboard button:focus-visible, .admin-dashboard input:focus-visible, .admin-dashboard select:focus-visible,
  .admin-login-page button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

  .admin-bg-blob { position: fixed; border-radius: 50%; filter: blur(70px); opacity: .45; mix-blend-mode: multiply; pointer-events: none; z-index: 0; }
  .admin-bg-blob.b1 { width: 55vw; height: 55vw; top: -15%; right: -10%; background: radial-gradient(circle, #E8D5BC 0%, #F5C8B0 70%, transparent 100%); animation: bdrift 20s ease-in-out infinite alternate; }
  .admin-bg-blob.b2 { width: 45vw; height: 45vw; bottom: -10%; left: -5%; background: radial-gradient(circle, #D5E0D0 0%, transparent 70%); animation: bdrift 26s ease-in-out infinite alternate-reverse; }
  @keyframes bdrift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(3%,4%) scale(1.07); } }
  @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) {
    .admin-bg-blob, .login-card, .dash-header, .table-wrap, .calc-results { animation: none !important; }
    .hbar-fill, .capacity-bar-fill { transition: none !important; }
  }

  /* Login */
  .admin-login-page { display: flex; align-items: center; justify-content: center; padding: 1.5rem 1rem; }
  .login-card { position: relative; z-index: 10; width: 100%; max-width: 380px; background: var(--card); backdrop-filter: blur(20px); border: 1px solid rgba(200,170,130,.25); border-radius: 2rem; padding: clamp(1.75rem, 6vw, 2.75rem) clamp(1.25rem, 5vw, 2rem); box-shadow: 0 8px 60px rgba(90,60,30,.12); animation: cardIn .7s cubic-bezier(.23,1,.32,1) both; }
  .login-header { text-align: center; margin-bottom: 1.75rem; }
  .login-logo { width: 48px; height: 48px; margin: 0 auto .75rem; display: block; }
  .login-title { font-family: var(--font-serif); font-size: 1.6rem; font-weight: 400; margin: 0 0 .25rem; }
  .login-sub { font-size: .8rem; color: var(--text-light); margin: 0; }
  .login-form { display: flex; flex-direction: column; gap: 1rem; }
  .login-field { display: flex; flex-direction: column; gap: .35rem; }
  .login-label { font-size: .82rem; color: var(--text-mid); font-weight: 500; }
  .login-input { width: 100%; padding: .8rem 1rem; background: rgba(255,252,246,.9); border: 1px solid rgba(180,140,100,.25); border-radius: .9rem; font-size: 1rem; color: var(--text-dark); text-align: center; letter-spacing: .15em; outline: none; transition: all .2s; }
  .login-input:focus { border-color: var(--gold-light); box-shadow: 0 0 0 3px rgba(180,140,100,.12); }
  .login-error { font-size: .82rem; color: #B94A3A; text-align: center; margin: 0; }
  .login-btn { display: flex; align-items: center; justify-content: center; gap: .6rem; padding: .9rem 1.5rem; background: linear-gradient(135deg, var(--gold-deep), var(--gold) 60%, var(--gold-light)); color: #FAF5EE; border: none; border-radius: .9rem; font-size: 1rem; font-weight: 500; cursor: pointer; box-shadow: 0 4px 20px rgba(140,100,60,.28); transition: transform .25s, box-shadow .25s; }
  .login-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(140,100,60,.38); }

  /* Layout */
  .dash-content { position: relative; z-index: 10; width: 100%; max-width: 1180px; margin: 0 auto; padding: clamp(1rem, 3vw, 2rem) clamp(.75rem, 3vw, 1.5rem) 4rem; display: flex; flex-direction: column; gap: clamp(1rem, 2.5vw, 1.75rem); }

  .dash-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; padding-bottom: 1.1rem; border-bottom: 1px solid var(--line); animation: cardIn .6s both; }
  .dash-header-left { display: flex; align-items: center; gap: .85rem; min-width: 0; }
  .dash-logo { width: 40px; height: 40px; flex-shrink: 0; }
  .dash-title { font-family: var(--font-serif); font-size: clamp(1.25rem, 3.5vw, 1.8rem); font-weight: 400; line-height: 1.2; margin: 0; }
  .dash-sub { font-size: .8rem; color: var(--text-light); margin: .1rem 0 0; }
  .logout-btn { display: inline-flex; align-items: center; gap: .4rem; padding: .5rem 1rem; background: rgba(255,252,246,.85); border: 1px solid rgba(180,140,100,.22); border-radius: 2rem; font-size: .82rem; color: var(--text-mid); cursor: pointer; transition: all .2s; }
  .logout-btn:hover { color: var(--gold-deep); border-color: rgba(180,140,100,.45); }

  /* KPI */
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 1rem; }
  .stat-card { background: var(--card); backdrop-filter: blur(16px); border: 1px solid rgba(200,170,130,.2); border-radius: 1.4rem; padding: 1.2rem 1.4rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 24px rgba(90,60,30,.07); }
  .stat-icon-wrap { width: 46px; height: 46px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-body { display: flex; flex-direction: column; min-width: 0; }
  .stat-value { font-size: clamp(1.7rem, 5vw, 2.1rem); font-weight: 700; line-height: 1; }
  .stat-label { font-size: .78rem; color: var(--text-light); margin-top: .25rem; }

  /* Charts */
  .charts-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.1rem; }
  .chart-card { background: var(--card); backdrop-filter: blur(16px); border: 1px solid rgba(200,170,130,.2); border-radius: 1.4rem; padding: clamp(1rem, 3vw, 1.5rem); box-shadow: 0 4px 24px rgba(90,60,30,.07); display: flex; flex-direction: column; gap: 1.1rem; min-width: 0; }
  .calculator-card { grid-column: 1 / -1; }
  @media (max-width: 760px) { .charts-grid { grid-template-columns: minmax(0, 1fr); } }

  .chart-card-header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
  .chart-card-title { font-family: var(--font-serif); font-size: 1rem; font-weight: 500; margin: 0; }
  .chart-card-badge { font-size: .74rem; color: var(--text-mid); background: rgba(212,184,150,.16); border: 1px solid var(--line); padding: .2rem .65rem; border-radius: 2rem; white-space: nowrap; }

  .radials-wrap { display: flex; justify-content: space-around; align-items: flex-end; gap: .5rem; }
  .radial-ring-item { display: flex; flex-direction: column; align-items: center; gap: .35rem; }
  .radial-svg { width: clamp(62px, 18vw, 76px); height: auto; }
  .radial-label { font-size: .72rem; color: var(--text-mid); text-align: center; }

  .event-bars { display: flex; flex-direction: column; gap: .75rem; }
  .hbar-row { display: flex; flex-direction: column; gap: .25rem; }
  .hbar-meta { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
  .hbar-label { font-size: .78rem; color: var(--text-mid); }
  .hbar-count { font-size: .82rem; font-weight: 700; }
  .hbar-track { height: 8px; border-radius: 1rem; background: rgba(212,184,150,.22); overflow: hidden; }
  .hbar-fill { height: 100%; border-radius: 1rem; transition: width 1.2s cubic-bezier(.23,1,.32,1); }

  .calc-wrap { display: flex; flex-direction: column; gap: .9rem; }
  .calc-label { font-size: .82rem; color: var(--text-mid); }
  .calc-input { padding: .75rem 1rem; background: rgba(255,252,246,.95); border: 1px solid rgba(180,140,100,.25); border-radius: .9rem; font-size: 1rem; color: var(--text-dark); outline: none; width: 100%; max-width: 280px; transition: all .2s; }
  .calc-input:focus { border-color: var(--gold-light); box-shadow: 0 0 0 3px rgba(180,140,100,.12); }
  .calc-results { display: flex; align-items: center; gap: clamp(1rem, 4vw, 2.5rem); flex-wrap: wrap; padding: 1.1rem 1.4rem; background: rgba(212,184,150,.09); border: 1px solid var(--line); border-radius: 1.25rem; animation: cardIn .5s both; }
  .calc-ring { width: 100px; height: 100px; flex-shrink: 0; }
  .calc-stats { display: flex; align-items: center; gap: clamp(1rem, 4vw, 2rem); }
  .calc-stat { display: flex; flex-direction: column; align-items: center; gap: .25rem; }
  .calc-stat-num { font-size: clamp(1.7rem, 5vw, 2.2rem); font-weight: 700; line-height: 1; }
  .calc-stat-label { font-size: .75rem; color: var(--text-light); }
  .calc-divider { width: 1px; height: 46px; background: rgba(180,140,100,.25); }

  /* RSVP section */
  .table-section { background: var(--card); backdrop-filter: blur(16px); border: 1px solid rgba(200,170,130,.2); border-radius: 1.4rem; overflow: hidden; box-shadow: 0 4px 24px rgba(90,60,30,.07); }
  .table-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 1.25rem clamp(1rem, 3vw, 1.5rem); border-bottom: 1px solid var(--line); }
  .table-title { font-family: var(--font-serif); font-size: 1.1rem; font-weight: 500; margin: 0; }
  .table-sub { font-size: .78rem; color: var(--text-light); margin: .2rem 0 0; }
  .table-actions { display: flex; gap: .6rem; flex-wrap: wrap; }
  .table-toggle { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .5rem 1rem; background: linear-gradient(135deg, var(--gold-deep), var(--gold)); color: #FAF5EE; border: none; border-radius: 2rem; font-size: .82rem; font-weight: 500; cursor: pointer; box-shadow: 0 2px 12px rgba(140,100,60,.2); transition: transform .2s, box-shadow .2s; white-space: nowrap; }
  .table-toggle.toggle-green { background: linear-gradient(135deg, #4A8B5C, #5C9F6E); }
  .table-toggle:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(140,100,60,.3); }
  .table-toggle:disabled { opacity: .6; cursor: wait; }
  .table-wrap { animation: cardIn .4s both; }

  /* Filters */
  .table-filters-container { padding: 1.1rem clamp(1rem, 3vw, 1.5rem); background: rgba(212,184,150,.06); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: .9rem; }
  .filters-row { display: flex; flex-wrap: wrap; align-items: center; gap: .85rem 1.5rem; }
  .search-box { position: relative; display: flex; align-items: center; flex: 1 1 240px; max-width: 340px; }
  .search-icon { position: absolute; right: .85rem; color: var(--text-light); pointer-events: none; display: flex; }
  .search-input { width: 100%; padding: .55rem 2.4rem .55rem 2rem; background: rgba(255,252,246,.95); border: 1px solid rgba(180,140,100,.25); border-radius: 2rem; font-size: .85rem; color: var(--text-dark); outline: none; transition: all .2s; }
  .search-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(180,140,100,.15); }
  .search-clear-btn { position: absolute; left: .7rem; background: none; border: none; color: var(--text-light); cursor: pointer; font-size: .85rem; padding: .2rem; line-height: 1; }
  .search-clear-btn:hover { color: var(--text-dark); }
  .filter-group { display: flex; align-items: center; gap: .5rem; }
  .filter-group-title { font-size: .8rem; font-weight: 600; color: var(--text-mid); }
  .filter-pills { display: inline-flex; align-items: center; gap: .25rem; background: rgba(180,140,100,.08); padding: .25rem; border-radius: 2rem; border: 1px solid var(--line); }
  .filter-pill { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; padding: .3rem .7rem; border-radius: 1.5rem; border: 1px solid transparent; background: transparent; color: var(--text-mid); font-size: .78rem; font-weight: 500; cursor: pointer; transition: all .2s; white-space: nowrap; }
  .filter-pill:hover { color: var(--text-dark); background: rgba(255,252,246,.6); }
  .filter-pill.active { background: #FAF5EE; color: var(--text-dark); font-weight: 600; border-color: rgba(180,140,100,.28); box-shadow: 0 2px 8px rgba(90,60,30,.08); }
  .filter-pill.pill-groom.active { background: rgba(91,138,114,.16); color: #2F6443; border-color: rgba(91,138,114,.35); }
  .filter-pill.pill-bride.active, .filter-pill.pill-no.active { background: rgba(201,128,106,.16); color: #8D4133; border-color: rgba(201,128,106,.35); }
  .filter-pill.pill-yes.active { background: rgba(74,139,92,.16); color: #2D653E; border-color: rgba(74,139,92,.35); }
  .pill-count { display: inline-flex; align-items: center; justify-content: center; font-size: .68rem; padding: .1rem .38rem; border-radius: 1rem; background: rgba(180,140,100,.16); color: var(--text-mid); line-height: 1; font-weight: 600; }
  .filter-pill.active .pill-count { background: rgba(180,140,100,.26); color: var(--text-dark); }

  .filters-status-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .75rem; padding: .8rem 1.1rem; background: rgba(255,252,246,.92); border: 1px solid rgba(180,140,100,.18); border-radius: 1.1rem; }
  .filters-summary { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .summary-highlight-pill { display: inline-flex; align-items: baseline; gap: .45rem; background: linear-gradient(135deg, rgba(180,140,100,.16), rgba(212,184,150,.22)); border: 1px solid rgba(180,140,100,.3); padding: .3rem .85rem; border-radius: 2rem; }
  .summary-big-num { font-size: 1.4rem; font-weight: 700; line-height: 1; color: var(--gold-deep); }
  .summary-big-label { font-size: .82rem; font-weight: 600; }
  .summary-meta { font-size: .8rem; color: var(--text-mid); }
  .reset-filters-btn { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; background: rgba(180,140,100,.12); border: 1px solid rgba(180,140,100,.25); color: var(--text-dark); border-radius: 1rem; padding: .35rem .85rem; font-size: .78rem; font-weight: 500; cursor: pointer; transition: all .2s; }
  .reset-filters-btn:hover { background: rgba(180,140,100,.22); color: var(--gold-deep); }

  /* Table (desktop) */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .rsvp-table { width: 100%; text-align: right; border-collapse: collapse; }
  .rsvp-table thead { background: rgba(212,184,150,.1); }
  .rsvp-table th { padding: .8rem 1rem; font-size: .78rem; font-weight: 600; color: var(--text-mid); white-space: nowrap; border-bottom: 1px solid var(--line); }
  .th-sortable { cursor: pointer; user-select: none; transition: background .15s; }
  .th-sortable:hover { background: rgba(180,140,100,.12); }
  .th-content { display: flex; align-items: center; gap: .35rem; }
  .sort-indicator { font-size: .7rem; color: var(--text-light); opacity: .45; }
  .sort-indicator.active { opacity: 1; color: var(--gold-deep); }
  .rsvp-table tbody tr { border-bottom: 1px solid rgba(180,140,100,.08); transition: background .15s; }
  .rsvp-table tbody tr:hover { background: rgba(212,184,150,.07); }
  .rsvp-table td { padding: .8rem 1rem; font-size: .875rem; vertical-align: middle; }
  .td-name { font-weight: 600; }
  .td-muted { color: var(--text-mid); }
  .td-events { font-size: .78rem; max-width: 160px; }
  .td-phone { color: var(--text-mid); font-size: .82rem; }
  .td-date { color: var(--text-light); font-size: .78rem; white-space: nowrap; }
  .td-empty { padding: 2.5rem 1rem; text-align: center; color: var(--text-light); }
  .empty-box { display: flex; flex-direction: column; align-items: center; gap: .6rem; }
  .td-actions { text-align: center; }
  .edit-actions { display: flex; gap: .4rem; justify-content: center; align-items: center; }

  .delete-btn, .edit-btn, .save-btn, .cancel-btn { border-radius: .5rem; padding: .38rem .7rem; font-size: .74rem; cursor: pointer; transition: all .2s; border: 1px solid; white-space: nowrap; }
  .delete-btn { background: rgba(201,128,106,.1); color: #9A4030; border-color: rgba(201,128,106,.3); }
  .delete-btn:hover { background: rgba(201,128,106,.2); }
  .edit-btn { background: rgba(180,140,100,.1); color: var(--gold-deep); border-color: rgba(180,140,100,.3); }
  .edit-btn:hover { background: rgba(180,140,100,.2); }
  .save-btn { background: rgba(74,139,92,.12); color: #3A7A50; border-color: rgba(74,139,92,.3); font-weight: 600; }
  .save-btn:hover { background: rgba(74,139,92,.22); }
  .cancel-btn { background: rgba(168,144,128,.1); color: var(--text-mid); border-color: rgba(168,144,128,.25); }
  .cancel-btn:hover { background: rgba(168,144,128,.2); }
  .save-btn:disabled, .cancel-btn:disabled { opacity: .5; cursor: not-allowed; }

  .editing-row { background: rgba(180,140,100,.07) !important; box-shadow: inset 0 0 0 1px rgba(180,140,100,.18); }
  .edit-input, .edit-select { padding: .42rem .6rem; background: rgba(255,252,246,.95); border: 1px solid rgba(180,140,100,.3); border-radius: .5rem; font-size: .82rem; color: var(--text-dark); outline: none; width: 100%; min-width: 80px; transition: border-color .2s, box-shadow .2s; }
  .edit-input:focus, .edit-select:focus { border-color: var(--gold-light); box-shadow: 0 0 0 2px rgba(180,140,100,.14); }
  .edit-input-sm { max-width: 90px; }
  .edit-select { cursor: pointer; -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6055' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left .5rem center; padding-left: 1.6rem; }

  .guest-table-list { display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
  .guest-table-row { display: flex; align-items: center; gap: .4rem; font-size: .8rem; }
  .guest-table-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
  .select-mini { font-size: .75rem; padding: 2px 4px 2px 1.4rem; width: 64px; min-width: 64px; }

  .badge { display: inline-block; padding: .2rem .65rem; border-radius: 2rem; font-size: .72rem; font-weight: 600; white-space: nowrap; }
  .badge-yes { background: rgba(74,139,92,.1); color: #3A7A50; }
  .badge-no { background: rgba(201,128,106,.1); color: #9A4030; }
  .badge-groom { background: rgba(91,138,114,.12); color: #3A7A50; }
  .badge-bride { background: rgba(201,128,106,.12); color: #9A5040; }

  /* Table → cards on tablets / phones */
  @media (max-width: 980px) {
    .rsvp-table th, .rsvp-table td { padding: .7rem .75rem; }
  }
  @media (max-width: 820px) {
    .table-scroll { overflow: visible; padding: .75rem; }
    .rsvp-table, .rsvp-table tbody { display: block; }
    .rsvp-table thead { display: none; }
    .rsvp-table tbody { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: .75rem; }
    .rsvp-table tbody tr { display: flex; flex-direction: column; background: #FFFCF7; border: 1px solid rgba(200,170,130,.3); border-radius: 1rem; padding: .35rem 0; box-shadow: 0 2px 10px rgba(90,60,30,.05); }
    .rsvp-table td { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .5rem 1rem; border: none; text-align: left; font-size: .85rem; }
    .rsvp-table td::before { content: attr(data-label); flex-shrink: 0; font-size: .74rem; font-weight: 600; color: var(--text-light); text-align: right; }
    .rsvp-table td.td-name { font-size: 1rem; padding-top: .7rem; padding-bottom: .7rem; border-bottom: 1px solid var(--line); }
    .rsvp-table td.td-events { max-width: none; }
    .rsvp-table td.td-actions { padding-top: .75rem; border-top: 1px solid var(--line); margin-top: .25rem; }
    .rsvp-table td.td-actions::before { display: none; }
    .rsvp-table td.td-actions .edit-actions { width: 100%; }
    .rsvp-table td.td-actions .edit-actions button { flex: 1; padding: .55rem; }
    .td-tables { align-items: flex-start; }
    .guest-table-list { width: 100%; max-width: 230px; }
    .guest-table-name { max-width: none; }
    .edit-input { max-width: 220px; }
    .rsvp-table tr.empty-row { display: block; border: none; background: none; box-shadow: none; grid-column: 1 / -1; }
    .rsvp-table td.td-empty { display: block; text-align: center; }
    .rsvp-table td.td-empty::before { display: none; }
  }

  @media (max-width: 700px) {
    .table-actions { width: 100%; }
    .table-actions .table-toggle { flex: 1 1 calc(50% - .6rem); }
    .filters-row { flex-direction: column; align-items: stretch; }
    .search-box { max-width: none; flex-basis: auto; }
    .filter-group { flex-direction: column; align-items: stretch; gap: .3rem; }
    .filter-pills { display: flex; border-radius: .9rem; }
    .filter-pill { flex: 1 1 0; min-width: 0; padding: .45rem .25rem; font-size: .74rem; }
    .filters-status-bar { flex-direction: column; align-items: stretch; text-align: center; }
    .filters-summary { flex-direction: column; align-items: center; gap: .4rem; }
    .reset-filters-btn { width: 100%; padding: .55rem; }
  }
  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr 1fr; gap: .6rem; }
    .stat-card { flex-direction: column; align-items: flex-start; gap: .6rem; padding: 1rem; }
    .table-actions .table-toggle { flex-basis: 100%; }
    .logout-btn span { display: none; }
    .logout-btn { padding: .5rem; }
    .calc-results { justify-content: center; }
    .pill-count { font-size: .62rem; padding: .05rem .28rem; }
  }

  /* Seating */
  .admin-seating-section { background: var(--card); backdrop-filter: blur(16px); border: 1px solid rgba(200,170,130,.25); border-radius: 1.4rem; padding: clamp(1rem, 3vw, 1.75rem); box-shadow: 0 4px 24px rgba(90,60,30,.07); }
  .admin-seating-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: .9rem; padding-bottom: 1.1rem; border-bottom: 1px solid var(--line); }
  .admin-seating-title { font-family: var(--font-serif); font-size: clamp(1.05rem, 3vw, 1.25rem); font-weight: 600; margin: 0; }
  .admin-seating-sub { font-size: .82rem; color: var(--text-light); margin: .25rem 0 0; max-width: 56ch; }
  .admin-seating-stats-pills { display: flex; gap: .5rem; flex-wrap: wrap; }
  .seating-stat-pill { padding: .4rem .85rem; border-radius: 2rem; font-size: .82rem; background: rgba(212,184,150,.18); border: 1px solid rgba(180,140,100,.25); }
  .seating-stat-pill.warning { background: rgba(201,128,106,.14); border-color: rgba(201,128,106,.35); color: #A34832; }
  .seating-stat-pill.success { background: rgba(138,158,140,.15); border-color: rgba(138,158,140,.3); color: #436345; }

  .unassigned-drawer { margin-top: 1.1rem; padding: 1rem; background: rgba(201,128,106,.07); border: 1.5px dashed rgba(201,128,106,.38); border-radius: 1rem; }
  .unassigned-header { display: flex; align-items: center; gap: .3rem .75rem; margin-bottom: .75rem; flex-wrap: wrap; }
  .unassigned-badge { font-weight: 700; font-size: .85rem; color: #A34832; }
  .unassigned-hint { font-size: .78rem; color: var(--text-mid); }
  .unassigned-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: .55rem; }
  .unassigned-guest-item { display: flex; justify-content: space-between; align-items: center; gap: .6rem; padding: .5rem .75rem; background: rgba(255,255,255,.9); border: 1px solid rgba(180,140,100,.2); border-radius: .7rem; }
  .unassigned-guest-info { display: flex; align-items: center; gap: .4rem; min-width: 0; flex: 1; }
  .unassigned-guest-name { font-weight: 600; font-size: .85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .unassigned-guest-side { font-size: .68rem; padding: .1rem .4rem; border-radius: .4rem; background: rgba(180,140,100,.12); color: var(--text-mid); flex-shrink: 0; }
  .table-assign-select { padding: .35rem .5rem; font-size: .78rem; border: 1px solid var(--gold); border-radius: .5rem; background: #FFFDF9; color: var(--text-dark); cursor: pointer; outline: none; max-width: 48%; flex-shrink: 0; }

  .admin-tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 1rem; margin-top: 1.25rem; }
  .admin-table-card { background: #FFFCF7; border: 1.5px solid rgba(200,170,130,.3); border-radius: 1.1rem; padding: 1rem; display: flex; flex-direction: column; box-shadow: 0 2px 10px rgba(90,60,30,.04); min-width: 0; }
  .admin-table-card.full { border-color: rgba(138,158,140,.55); }
  .admin-table-card.overloaded { border-color: #E25C3C; background: #FFF8F6; box-shadow: 0 0 0 2px rgba(226,92,60,.2); }
  .admin-table-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .6rem; }
  .admin-table-id-group { display: flex; align-items: center; gap: .65rem; flex: 1; min-width: 0; }
  .admin-table-id-text { min-width: 0; }
  .admin-table-circle-badge { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--gold-deep), var(--gold)); color: #FAF5EE; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-weight: 700; font-size: 1.15rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(139,105,67,.25); }
  .admin-table-title-row { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
  .admin-table-number-text { font-weight: 700; font-size: .95rem; }
  .admin-table-gender-tag { font-size: .65rem; padding: .1rem .45rem; border-radius: 1rem; font-weight: 600; }
  .admin-table-gender-tag.men { background: rgba(100,140,180,.15); color: #355E82; border: 1px solid rgba(100,140,180,.25); }
  .admin-table-gender-tag.women { background: rgba(200,120,150,.15); color: #8C3960; border: 1px solid rgba(200,120,150,.25); }
  .admin-table-category-text { font-size: .74rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .capacity-gauge { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
  .capacity-numbers { font-size: .85rem; color: var(--text-light); }
  .capacity-numbers strong { font-size: 1.1rem; color: var(--text-dark); }
  .gauge-near .capacity-numbers strong { color: #B47C34; }
  .gauge-full .capacity-numbers strong { color: #3A7340; }
  .gauge-over .capacity-numbers strong { color: #D3361E; }
  .over-alert-badge { font-size: .65rem; font-weight: 700; color: #FFF; background: #E25C3C; padding: .1rem .4rem; border-radius: .4rem; margin-top: .15rem; white-space: nowrap; }

  .capacity-bar-track { height: 5px; background: rgba(200,170,130,.22); border-radius: 1rem; overflow: hidden; margin: .8rem 0; }
  .capacity-bar-fill { height: 100%; background: var(--gold); border-radius: 1rem; transition: width .4s ease; }
  .capacity-bar-fill.bar-near { background: #E6A24D; }
  .capacity-bar-fill.bar-full { background: #5A9960; }
  .capacity-bar-fill.bar-over { background: #E25C3C; }

  .admin-table-guests-box { flex: 1; min-height: 110px; max-height: 300px; overflow-y: auto; border: 1px solid rgba(200,170,130,.2); border-radius: .75rem; background: rgba(255,255,255,.75); padding: .4rem; }
  .admin-table-empty { height: 100px; display: flex; align-items: center; justify-content: center; font-size: .78rem; color: var(--text-light); font-style: italic; text-align: center; }
  .admin-table-guests-list { display: flex; flex-direction: column; gap: .3rem; }
  .admin-table-guest-row { display: flex; align-items: center; justify-content: space-between; gap: .4rem; padding: .32rem .45rem; background: #FFF; border: 1px solid rgba(200,170,130,.16); border-radius: .5rem; }
  .admin-table-guest-row:hover { background: #FDF9F3; }
  .guest-row-left { display: flex; align-items: center; gap: .35rem; min-width: 0; flex: 1; }
  .guest-seat-num { font-size: .7rem; color: var(--text-light); width: 18px; flex-shrink: 0; }
  .guest-row-name { font-size: .82rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .guest-row-side-badge { font-size: .65rem; padding: .05rem .35rem; border-radius: .3rem; background: rgba(180,140,100,.1); color: var(--text-mid); flex-shrink: 0; }
  .quick-move-select { font-size: .72rem; padding: .25rem .35rem; border: 1px solid rgba(180,140,100,.3); border-radius: .4rem; background: #FAF7F2; color: var(--text-dark); cursor: pointer; outline: none; width: 92px; flex-shrink: 0; direction: rtl; }
  .quick-move-select:focus { border-color: var(--gold-deep); }

  @media (max-width: 480px) {
    .unassigned-guest-item { flex-wrap: wrap; }
    .table-assign-select { max-width: 100%; width: 100%; padding: .5rem; }
    .quick-move-select { width: 84px; padding: .4rem .3rem; }
    .admin-table-card { padding: .85rem; }
  }
`;