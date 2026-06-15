"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { submitRSVP } from "../actions";

function RSVPContent() {
    const searchParams = useSearchParams();
    const fromId = searchParams.get("from");
    const backHref = fromId ? (fromId === "1" ? "/" : `/${fromId}`) : "/";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [isAttending, setIsAttending] = useState(null);
    const [hasAlreadyResponded, setHasAlreadyResponded] = useState(false);
    const [existingRsvpToConfirm, setExistingRsvpToConfirm] = useState(null);
    const [forceUpdateId, setForceUpdateId] = useState(null);
    const [confirmedAttending, setConfirmedAttending] = useState(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const responded = localStorage.getItem('rsvp_submitted');
            if (responded === 'true') {
                setHasAlreadyResponded(true);
                const attending = localStorage.getItem('rsvp_attending');
                setConfirmedAttending(attending);
            }
        }
    }, []);

    const [guestCount, setGuestCount] = useState(1);
    const [guests, setGuests] = useState([{ name: "", chuppah: true, dance: true, eat: true }]);
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
                for (let i = prev.length; i < count; i++) next.push({ name: "", chuppah: true, dance: true, eat: true });
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
            const attendingChoice = isAttending;
            setIsAttending(null);
            setForceUpdateId(null);
            if (typeof window !== "undefined") {
                localStorage.setItem('rsvp_submitted', 'true');
                localStorage.setItem('rsvp_attending', attendingChoice);
                setHasAlreadyResponded(true);
                setConfirmedAttending(attendingChoice);
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
                    <Link href={backHref} className="back-link">
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

                {/* Success Actions */}
                {confirmedAttending === 'yes' && ((result?.type === 'success') || (hasAlreadyResponded && isAttending === null && !result)) && (
                    <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                        <a href="https://waze.com/ul?q=Leonardo+Hotel+Ashdod&navigate=yes" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '1.4rem', height: '1.4rem' }}>
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            ניווט לאולם ב-Waze
                        </a>
                        <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=החתונה+של+שירה+וגדליה&dates=20261029T163000Z/20261029T210000Z&details=קבלת+פנים+בשעה+18:30,+חופה+בשעה+19:30&location=Leonardo+Hotel,+HaYam+HaTichon+Blvd+1,+Ashdod" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '1.4rem', height: '1.4rem' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            הוספה ליומן Google
                        </a>
                        <a href="https://chat.whatsapp.com/CNRFr7HKzaj32qflvXsI7J?s=cl&p=i&mlu=2&ilr=0&amv=0" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.4rem', height: '1.4rem', color: '#25D366' }}>
                                <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.48 1.332 5.004L2 22l5.166-1.356c1.47.8 3.12 1.224 4.842 1.224 5.508 0 9.99-4.482 9.99-9.988C22 6.482 17.52 2 12.012 2zm6.246 14.376c-.258.726-1.296 1.326-1.788 1.386-.48.06-1.074.108-3.036-.702-2.508-1.032-4.122-3.576-4.248-3.744-.12-.168-1.014-1.344-1.014-2.568 0-1.224.636-1.83.864-2.076.228-.246.504-.306.672-.306.168 0 .342 0 .492.006.156.006.366-.06.57.45.21.516.714 1.74.774 1.866.06.126.102.27.018.438-.084.168-.168.27-.336.468-.168.198-.354.444-.504.594-.168.168-.342.348-.15.684.198.336.876 1.44 1.878 2.334 1.29 1.152 2.376 1.512 2.712 1.68.336.168.534.126.732-.102.198-.228.864-1.008 1.092-1.356.228-.348.456-.288.768-.174.312.114 1.974.93 2.31 1.098.336.168.558.252.642.396.084.144.084.828-.174 1.554z"/>
                            </svg>
                            קבוצת טרמפים ב-WhatsApp
                        </a>
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
                                        setGuests(existingRsvpToConfirm.guests?.length > 0 ? existingRsvpToConfirm.guests : [{ name: "", chuppah: true, dance: true, eat: true }]);
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
                                    const attendingChoice = existingRsvpToConfirm.is_attending === 1 ? 'yes' : 'no';
                                    setResult({ type: "success", message: "מעולה, ההזמנה המקורית נשמרה. תודה רבה!" });
                                    setForceUpdateId(null);
                                    if (typeof window !== "undefined") {
                                        localStorage.setItem('rsvp_submitted', 'true');
                                        localStorage.setItem('rsvp_attending', attendingChoice);
                                        setHasAlreadyResponded(true);
                                        setConfirmedAttending(attendingChoice);
                                    }
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
                                            <div className="guest-events" style={{ flexWrap: 'wrap' }}>
                                                <label className="event-check">
                                                    <input type="checkbox" checked={guest.chuppah} onChange={(e) => handleGuestChange(idx, "chuppah", e.target.checked)} className="checkbox" />
                                                    <span className="checkmark"></span>
                                                    <span>חופה</span>
                                                </label>
                                                <label className="event-check">
                                                    <input type="checkbox" checked={guest.eat !== false} onChange={(e) => handleGuestChange(idx, "eat", e.target.checked)} className="checkbox" />
                                                    <span className="checkmark"></span>
                                                    <span>לשבת לאכול</span>
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
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-mid)' }}>
                                            <input type="radio" value="חתן" name="sideChoice" checked={side === 'חתן'} onChange={(e) => setSide(e.target.value)} />
                                            <span>החתן</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-mid)' }}>
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
                                    <h3 className="form-section-title">חבל...</h3>
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
                שירה &amp; גדליה · 29 באוקטובר 2026
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
                    <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(180,140,100,0.4)" />
                </svg>
            </footer>
        </main>
    );
}

export default function RSVPPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RSVPContent />
        </Suspense>
    );
}