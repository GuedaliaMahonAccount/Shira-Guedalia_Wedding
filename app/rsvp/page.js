"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitRSVP } from "../actions";

export default function RSVPPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [isAttending, setIsAttending] = useState(null);
    const [hasAlreadyResponded, setHasAlreadyResponded] = useState(false);
    const [existingRsvpToConfirm, setExistingRsvpToConfirm] = useState(null);
    const [forceUpdateId, setForceUpdateId] = useState(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const responded = localStorage.getItem('rsvp_submitted');
            if (responded === 'true') setHasAlreadyResponded(true);
        }
    }, []);

    const [guestCount, setGuestCount] = useState(1);
    const [guests, setGuests] = useState([{ name: "", chuppah: true, dance: true }]);
    const [phone, setPhone] = useState("");
    const [noGuests, setNoGuests] = useState([{ name: "" }]);
    const [noGuestCount, setNoGuestCount] = useState(1);
    const [noReason, setNoReason] = useState("");
    const [side, setSide] = useState("");

    const handleGuestCountChange = (e) => {
        let count = parseInt(e.target.value) || 1;
        if (count < 1) count = 1;
        if (count > 20) count = 20;
        setGuestCount(count);
        setGuests(prev => {
            const next = [...prev];
            if (count > prev.length) {
                for (let i = prev.length; i < count; i++) next.push({ name: "", chuppah: true, dance: true });
            } else {
                next.splice(count);
            }
            return next;
        });
    };

    const handlePlusClick = () => handleGuestCountChange({ target: { value: guestCount + 1 } });
    const handleMinusClick = () => { if (guestCount > 1) handleGuestCountChange({ target: { value: guestCount - 1 } }); };
    const handleGuestChange = (index, field, value) => {
        setGuests(prev => { const n = [...prev]; n[index][field] = value; return n; });
    };

    const handleNoGuestCountChange = (e) => {
        let count = parseInt(e.target.value) || 1;
        if (count < 1) count = 1;
        if (count > 20) count = 20;
        setNoGuestCount(count);
        setNoGuests(prev => {
            const next = [...prev];
            if (count > prev.length) {
                for (let i = prev.length; i < count; i++) next.push({ name: "" });
            } else {
                next.splice(count);
            }
            return next;
        });
    };

    const handleNoPlusClick = () => handleNoGuestCountChange({ target: { value: noGuestCount + 1 } });
    const handleNoMinusClick = () => { if (noGuestCount > 1) handleNoGuestCountChange({ target: { value: noGuestCount - 1 } }); };
    const handleNoGuestChange = (index, value) => {
        setNoGuests(prev => { const n = [...prev]; n[index].name = value; return n; });
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setResult(null);
        const data = {
            isAttending, phone,
            guestCount: isAttending === 'yes' ? guestCount : noGuestCount,
            guests: isAttending === 'yes' ? guests : noGuests,
            names: isAttending === 'no' ? noGuests.map(g => g.name).filter(Boolean).join(", ") : "",
            reason: isAttending === 'no' ? noReason : "",
            side: isAttending === 'yes' ? side : "",
            forceUpdateId
        };
        const response = await submitRSVP(data);
        if (response?.requiresConfirmation) {
            setExistingRsvpToConfirm(response.existingRsvp);
        } else if (response?.error) {
            setResult({ type: "error", message: response.error });
        } else {
            setResult({ type: "success", message: response?.message || "תודה רבה! אישור ההגעה נשמר בהצלחה." });
            setIsAttending(null);
            setForceUpdateId(null);
            if (typeof window !== "undefined") {
                localStorage.setItem('rsvp_submitted', 'true');
                setHasAlreadyResponded(true);
            }
        }
        setIsSubmitting(false);
    }

    return (
        <main className="rsvp-page">
            {/* Background */}
            <div className="bg-layer" aria-hidden="true">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="rsvp-card">
                {/* Header */}
                <div className="rsvp-header">
                    <Link href="/" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        חזרה להזמנה
                    </Link>

                    <div className="rsvp-ornament">
                        <svg viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" y1="10" x2="70" y2="10" stroke="rgba(180,140,100,0.35)" strokeWidth="0.7" />
                            <circle cx="80" cy="10" r="2.5" fill="rgba(180,140,100,0.4)" />
                            <circle cx="90" cy="6" r="1.5" fill="rgba(180,140,100,0.3)" />
                            <circle cx="100" cy="10" r="3.5" fill="rgba(180,140,100,0.5)" />
                            <circle cx="110" cy="6" r="1.5" fill="rgba(180,140,100,0.3)" />
                            <circle cx="120" cy="10" r="2.5" fill="rgba(180,140,100,0.4)" />
                            <line x1="130" y1="10" x2="200" y2="10" stroke="rgba(180,140,100,0.35)" strokeWidth="0.7" />
                        </svg>
                    </div>

                    <h1 className="rsvp-title">אישור הגעה</h1>
                    <p className="rsvp-subtitle">
                        {isAttending === null ? "נשמח לדעת אם תוכלו להגיע לשמחתינו!" : "אנא מלאו את הפרטים מטה."}
                    </p>
                </div>

                {/* Already responded notice */}
                {hasAlreadyResponded && isAttending === null && !result && (
                    <div className="notice-banner notice-warm">
                        <p className="notice-title">ראינו שכבר עדכנתם אותנו, תודה!</p>
                        <p className="notice-body">אם יש שינוי, ניתן לעדכן את אישור ההגעה מחדש למטה.</p>
                    </div>
                )}

                {/* Result message */}
                {result && (
                    <div className={`notice-banner ${result.type === 'success' ? 'notice-success' : 'notice-error'}`}>
                        {result.type === 'success' && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="notice-icon">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        {result.message}
                    </div>
                )}

                {/* Attending choice buttons */}
                {result?.type !== 'success' && isAttending === null && !existingRsvpToConfirm && (
                    <div className="attend-choice">
                        <button onClick={() => setIsAttending('yes')} className="attend-btn attend-yes">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="attend-icon">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>כן, מגיע/ה בשמחה!</span>
                        </button>
                        <button onClick={() => setIsAttending('no')} className="attend-btn attend-no">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="attend-icon">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            <span>לצערי לא אוכל להגיע</span>
                        </button>
                    </div>
                )}

                {/* Existing RSVP confirmation */}
                {existingRsvpToConfirm && (
                    <div className="existing-rsvp-box">
                        <div className="existing-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="rgba(180,140,100,0.6)" strokeWidth="1.3" />
                                <path d="M12 8v4M12 16h.01" stroke="rgba(180,140,100,0.8)" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3 className="existing-title">היי, מצאנו אישור קודם!</h3>
                        <p className="existing-body">
                            נראה שכבר עניתם בעבר על שם <strong>{existingRsvpToConfirm.names}</strong> שהחליטו {existingRsvpToConfirm.is_attending ? "להגיע" : "לא להגיע"}.
                        </p>
                        <p className="existing-body" style={{ marginTop: "0.5rem" }}>
                            אם תבחרו לעדכן, נטען את כלל המשתתפים שהיו רשומים בפעם הקודמת.
                        </p>
                        <div className="existing-actions">
                            <button
                                onClick={() => {
                                    setForceUpdateId(existingRsvpToConfirm._id);
                                    setIsAttending(existingRsvpToConfirm.is_attending === 1 ? 'yes' : 'no');
                                    if (existingRsvpToConfirm.is_attending === 1) {
                                        setGuestCount(existingRsvpToConfirm.guest_count);
                                        setGuests(existingRsvpToConfirm.guests?.length > 0 ? existingRsvpToConfirm.guests : [{ name: "", chuppah: true, dance: true }]);
                                    } else {
                                        setNoGuestCount(existingRsvpToConfirm.guest_count);
                                        if (existingRsvpToConfirm.guests?.length > 0) {
                                            setNoGuests(existingRsvpToConfirm.guests);
                                        } else if (existingRsvpToConfirm.names) {
                                            const parts = existingRsvpToConfirm.names.split(/[, ו]+/).map(n => n.trim()).filter(Boolean);
                                            const fallbackGuests = Array(existingRsvpToConfirm.guest_count).fill({}).map((_, i) => ({ name: parts[i] || "" }));
                                            setNoGuests(fallbackGuests);
                                        } else {
                                            setNoGuests(Array(existingRsvpToConfirm.guest_count).fill({ name: "" }));
                                        }
                                        setNoReason(existingRsvpToConfirm.reason);
                                    }
                                    if (existingRsvpToConfirm.side) setSide(existingRsvpToConfirm.side);
                                    if (existingRsvpToConfirm.phone) setPhone(existingRsvpToConfirm.phone);
                                    setExistingRsvpToConfirm(null);
                                    setResult(null);
                                }}
                                className="btn-primary"
                            >
                                כן, אני רוצה לשנות
                            </button>
                            <button
                                onClick={() => {
                                    setExistingRsvpToConfirm(null);
                                    setIsAttending(null);
                                    setResult({ type: "success", message: "מעולה, ההזמנה המקורית נשמרה. תודה רבה!" });
                                    setForceUpdateId(null);
                                }}
                                className="btn-secondary"
                            >
                                לא, הכל בסדר
                            </button>
                        </div>
                    </div>
                )}

                {/* Form */}
                {result?.type !== 'success' && isAttending !== null && !existingRsvpToConfirm && (
                    <form className="rsvp-form" onSubmit={handleSubmit}>
                        {isAttending === 'yes' && (
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-emoji">🎉</div>
                                    <h3 className="form-section-title">איזה כיף שאתם באים!</h3>
                                    <button type="button" onClick={() => { setIsAttending(null); setForceUpdateId(null); }} className="change-mind-link">
                                        שנייה, התחרטתי / טעות
                                    </button>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">כמה אתם מגיעים?</label>
                                    <div className="counter-wrap">
                                        <button type="button" onClick={handleMinusClick} className="counter-btn">−</button>
                                        <input type="number" value={guestCount} onChange={handleGuestCountChange} min="1" max="20" className="counter-input" required />
                                        <button type="button" onClick={handlePlusClick} className="counter-btn">+</button>
                                    </div>
                                </div>

                                <div className="guests-list">
                                    <p className="guests-hint">שמות המגיעים ובחירת אירועים (לא חובה):</p>
                                    {guests.map((guest, idx) => (
                                        <div key={idx} className="guest-card">
                                            <div className="guest-row">
                                                <span className="guest-num">{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={guest.name}
                                                    onChange={(e) => handleGuestChange(idx, "name", e.target.value)}
                                                    className="guest-name-input"
                                                    placeholder="שם האורח/ת"
                                                />
                                            </div>
                                            <div className="guest-events">
                                                <label className="event-check">
                                                    <input type="checkbox" checked={guest.chuppah} onChange={(e) => handleGuestChange(idx, "chuppah", e.target.checked)} className="checkbox" />
                                                    <span className="checkmark"></span>
                                                    <span>חופה</span>
                                                </label>
                                                <label className="event-check">
                                                    <input type="checkbox" checked={guest.dance} onChange={(e) => handleGuestChange(idx, "dance", e.target.checked)} className="checkbox" />
                                                    <span className="checkmark"></span>
                                                    <span>ריקודים</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="field-group">
                                    <label className="field-label">מאיזה צד אתם מגיעים? (לא חובה)</label>
                                    <div className="side-choice" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                            <input type="radio" value="חתן" name="sideChoice" checked={side === 'חתן'} onChange={(e) => setSide(e.target.value)} />
                                            <span>החתן</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                                            <input type="radio" value="כלה" name="sideChoice" checked={side === 'כלה'} onChange={(e) => setSide(e.target.value)} />
                                            <span>הכלה</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="field-group" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="phone" className="field-label">מספר טלפון (לא חובה)</label>
                                    <input
                                        id="phone" type="tel" dir="ltr" value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="field-input" placeholder="050-0000000"
                                    />
                                </div>
                            </div>
                        )}

                        {isAttending === 'no' && (
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-emoji">🌸</div>
                                    <h3 className="form-section-title">חבל... אולי בפעם הבאה</h3>
                                    <button type="button" onClick={() => { setIsAttending(null); setForceUpdateId(null); }} className="change-mind-link">
                                        שנייה, התחרטתי / טעות
                                    </button>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">כמה מוזמנים לא יגיעו?</label>
                                    <div className="counter-wrap">
                                        <button type="button" onClick={handleNoMinusClick} className="counter-btn">−</button>
                                        <input type="number" value={noGuestCount} onChange={handleNoGuestCountChange} min="1" max="20" className="counter-input" required />
                                        <button type="button" onClick={handleNoPlusClick} className="counter-btn">+</button>
                                    </div>
                                </div>

                                <div className="guests-list">
                                    <p className="guests-hint">שמות (לא חובה):</p>
                                    {noGuests.map((guest, idx) => (
                                        <div key={idx} className="guest-card">
                                            <div className="guest-row">
                                                <span className="guest-num">{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={guest.name}
                                                    onChange={(e) => handleNoGuestChange(idx, e.target.value)}
                                                    className="guest-name-input"
                                                    placeholder="שם (לא חובה)"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="field-group">
                                    <label className="field-label">קצת באסה, אבל נשמח לדעת למה (לא חובה)</label>
                                    <textarea value={noReason} onChange={(e) => setNoReason(e.target.value)} rows={3} className="field-textarea" placeholder="שתפו אותנו פה..." />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting} className="submit-btn">
                            {isSubmitting ? (
                                <span className="submit-loading">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spin">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                                    </svg>
                                    שולח...
                                </span>
                            ) : "שליחת עדכון"}
                        </button>
                    </form>
                )}
            </div>

            <footer className="rsvp-footer">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
                    <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(180,140,100,0.4)" />
                </svg>
                שירה &amp; גדליה · 3 בספטמבר 2026
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
                    <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(180,140,100,0.4)" />
                </svg>
            </footer>
        </main>
    );
}