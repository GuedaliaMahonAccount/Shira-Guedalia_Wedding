"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { submitGift, fetchPublicGifts } from "../actions";

export default function GiftsPage() {
    const [name, setName] = useState("");
    const [gift, setGift] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [giftsList, setGiftsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const loadGifts = async () => {
        setIsLoading(true);
        const res = await fetchPublicGifts();
        if (res.success) {
            setGiftsList(res.gifts);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadGifts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!gift.trim()) return;

        setIsSubmitting(true);
        setMessage(null);

        const res = await submitGift({ name, gift });

        if (res.success) {
            setMessage({ type: "success", text: res.message });
            setName("");
            setGift("");
            await loadGifts();
        } else {
            setMessage({ type: "error", text: res.error || "אירעה שגיאה ברישום המתנה." });
        }
        setIsSubmitting(false);
    };

    const scrollToForm = () => {
        const element = document.getElementById("add-gift-form");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <main className="gifts-page">
            <div className="bg-layer" aria-hidden="true">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="gifts-card">
                {/* Header */}
                <div className="gifts-header">
                    <Link href="/" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        חזרה להזמנה
                    </Link>

                    <button onClick={scrollToForm} className="add-gift-shortcut" aria-label="הוספת מתנה">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <span className="add-gift-shortcut-text">הוספת מתנה</span>
                    </button>

                    <div className="gifts-ornament">
                        <svg viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" y1="10" x2="70" y2="10" stroke="rgba(247,206,80,0.35)" strokeWidth="0.7" />
                            <circle cx="80" cy="10" r="2.5" fill="rgba(247,206,80,0.4)" />
                            <circle cx="90" cy="6" r="1.5" fill="rgba(247,206,80,0.3)" />
                            <circle cx="100" cy="10" r="3.5" fill="rgba(247,206,80,0.5)" />
                            <circle cx="110" cy="6" r="1.5" fill="rgba(247,206,80,0.3)" />
                            <circle cx="120" cy="10" r="2.5" fill="rgba(247,206,80,0.4)" />
                            <line x1="130" y1="10" x2="200" y2="10" stroke="rgba(247,206,80,0.35)" strokeWidth="0.7" />
                        </svg>
                    </div>

                    <h1 className="gifts-title">רשימת מתנות</h1>
                    <p className="gifts-subtitle">
                        כדי למנוע מתנות כפולות, תוכלו לראות מה אחרים קונים ולרשום את מתנתכם.
                    </p>
                </div>

                {/* Status Message */}
                {message && (
                    <div className={`notice-banner ${message.type === 'success' ? 'notice-success' : 'notice-error'}`}>
                        {message.type === 'success' && (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="notice-icon">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        {message.text}
                    </div>
                )}

                {/* LIST SECTION — shown first so users immediately see what's taken */}
                <div className="gifts-list-section">
                    <div className="list-header-row">
                        <h2 className="list-title">מתנות שכבר נרשמו</h2>
                        <div className="list-header-actions">
                            {!isLoading && (
                                <span className="gifts-count-badge">
                                    {giftsList.length > 0 ? `${giftsList.length} מתנות` : "עוד אין מתנות"}
                                </span>
                            )}
                            {!isLoading && giftsList.length > 0 && (
                                <button 
                                    onClick={() => {
                                        setIsSearchOpen(!isSearchOpen);
                                        if (isSearchOpen) setSearchTerm("");
                                    }} 
                                    className={`search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
                                    aria-label="חיפוש מתנה"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {!isLoading && giftsList.length > 0 && isSearchOpen && (
                        <div className="search-container">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                placeholder="חיפוש מתנה..."
                                autoFocus
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="clear-search-btn" aria-label="נקה חיפוש">
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="list-loading">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spin" style={{ width: '2rem', height: '2rem', margin: '1rem auto' }}>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                            </svg>
                            טוען רשימה...
                        </div>
                    ) : giftsList.length === 0 ? (
                        <div className="empty-list">
                            <div className="empty-icon">🎁</div>
                            <p className="empty-text">אף אחד עוד לא רשם מתנה. תהיו הראשונים!</p>
                        </div>
                    ) : (() => {
                        const filteredGifts = giftsList.filter((item) =>
                            item.gift ? item.gift.toLowerCase().includes(searchTerm.toLowerCase()) : false
                        );
                        if (filteredGifts.length === 0) {
                            return (
                                <div className="empty-list">
                                    <p className="empty-text">לא נמצאו מתנות תואמות לחיפוש.</p>
                                </div>
                            );
                        }
                        return (
                            <div className="gifts-grid">
                                {filteredGifts.map((item) => (
                                    <div key={item.id} className="gift-item-card">
                                        <div className="gift-icon">🎁</div>
                                        <div className="gift-details">
                                            <span className="gift-text">{item.gift}</span>
                                            <span className="gift-date">
                                                נרשם ב-{item.created_at ? new Date(item.created_at).toLocaleDateString('he-IL') : "תאריך לא ידוע"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* DIVIDER */}
                <div className="section-divider" id="add-gift-form" />

                {/* FORM SECTION — below the list */}
                <div className="form-intro">
                    <p className="form-intro-title">רשמו את המתנה שלכם</p>
                    <p className="form-intro-sub">כך אורחים אחרים ידעו שהמתנה כבר תפוסה.</p>
                </div>

                <form className="gifts-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="field-group">
                            <label htmlFor="giverName" className="field-label">
                                השם שלכם
                                <span className="field-label-note"> (לא יוצג לאורחים אחרים)</span>
                            </label>
                            <input
                                id="giverName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="field-input"
                                placeholder="לדוגמה: ישראל ישראלי (אופציונלי)"
                            />
                            <p className="field-hint">
                                יוצג רק למארגנים.
                            </p>
                        </div>

                        <div className="field-group">
                            <label htmlFor="giftDescription" className="field-label">
                                המתנה שאתם מביאים
                                <span className="field-required"> *</span>
                            </label>
                            <input
                                id="giftDescription"
                                type="text"
                                value={gift}
                                onChange={(e) => setGift(e.target.value)}
                                className="field-input"
                                placeholder="לדוגמה: סט סירים ומחבתות / מגהץ אדים"
                                required
                            />
                        </div>

                        <button type="submit" disabled={isSubmitting} className="submit-btn">
                            {isSubmitting ? (
                                <span className="submit-loading">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spin">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                                    </svg>
                                    שומר מתנה...
                                </span>
                            ) : (
                                <span className="submit-inner">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    הוספת מתנה לרשימה
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <footer className="gifts-footer">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
                    <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(247,206,80,0.4)" />
                </svg>
                שירה &amp; גדליה · 29 באוקטובר 2026
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
                    <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(247,206,80,0.4)" />
                </svg>
            </footer>

            <style>{pageStyles}</style>
        </main>
    );
}

const pageStyles = `
  .gifts-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 2rem 1.25rem 5rem;
    overflow: hidden;
    position: relative;
    direction: rtl;
    background:
      radial-gradient(ellipse at 80% 0%, rgba(230, 149, 77, 0.25) 0%, transparent 60%),
      radial-gradient(ellipse at 10% 100%, rgba(250, 213, 112, 0.2) 0%, transparent 60%),
      linear-gradient(160deg, #3D261A 0%, #523524 60%, #3D261A 100%);
  }

  .bg-layer {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }

  .blob {
    position: absolute;
    filter: blur(120px);
    opacity: 0.2;
    border-radius: 50%;
    animation: blob-float 20s infinite alternate ease-in-out;
  }

  .blob-1 {
    width: 50vw;
    height: 50vw;
    background: var(--amber, #E6954D);
    top: -10vw;
    right: -10vw;
  }

  .blob-2 {
    width: 60vw;
    height: 60vw;
    background: var(--gold, #FAD570);
    bottom: -15vw;
    left: -15vw;
    animation-delay: -5s;
  }

  @keyframes blob-float {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(5%, 5%) scale(1.1); }
  }

  .gifts-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.55;
    pointer-events: none;
    z-index: 0;
  }

  .gifts-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 540px;
    background: rgba(54, 34, 22, 0.75);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(247, 206, 80, 0.25);
    border-radius: 2.5rem;
    padding: 2.5rem 2rem;
    box-shadow: 
      0 20px 80px rgba(0, 0, 0, 0.45),
      inset 0 1px 1px rgba(255, 255, 255, 0.08);
    animation: content-rise 0.9s cubic-bezier(0.23, 1, 0.32, 1) both;
  }

  .gifts-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
    text-decoration: none;
    margin-bottom: 1.5rem;
    transition: color 0.2s;
    float: right;
  }

  .back-link svg {
    width: 14px;
    height: 14px;
    transform: scaleX(-1);
  }

  .back-link:hover {
    color: var(--gold, #FAD570);
  }

  .gifts-ornament {
    width: 180px;
    height: 14px;
    margin: 0 auto 1.2rem;
    clear: both;
  }

  .gifts-title {
    font-family: var(--font-script, 'Great Vibes', cursive);
    font-size: 2.6rem;
    color: var(--gold-pale, #FFFAF0);
    font-weight: 400;
    margin-bottom: 0.4rem;
    text-shadow: 0 2px 30px rgba(247, 206, 80, 0.5), 0 0 10px rgba(247, 206, 80, 0.2);
  }

  .gifts-subtitle {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--text-mid, rgba(255, 235, 200, 0.8));
    line-height: 1.5;
  }

  /* LIST SECTION */
  .gifts-list-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 0;
  }

  .list-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: row-reverse;
  }

  .list-header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .search-toggle-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid rgba(247, 206, 80, 0.2);
    border-radius: 50%;
    color: var(--gold, #FAD570);
    cursor: pointer;
    transition: all 0.2s;
  }

  .search-toggle-btn:hover, .search-toggle-btn.active {
    background: rgba(247, 206, 80, 0.15);
    border-color: rgba(247, 206, 80, 0.5);
    color: var(--gold-light, #FFF0C0);
  }

  .search-toggle-btn svg {
    width: 14px;
    height: 14px;
  }

  .search-container {
    position: relative;
    width: 100%;
    margin-bottom: 0.5rem;
    animation: slide-down 0.25s cubic-bezier(0.23, 1, 0.32, 1) both;
  }

  @keyframes slide-down {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .search-input {
    width: 100%;
    padding: 0.6rem 2.2rem 0.6rem 1rem;
    background: rgba(255, 240, 200, 0.1);
    border: 1px solid rgba(247, 206, 80, 0.25);
    border-radius: 0.8rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--text-bright, rgba(255, 253, 240, 1));
    outline: none;
    text-align: right;
    transition: all 0.2s;
  }

  .search-input:focus {
    border-color: rgba(247, 206, 80, 0.45);
    background: rgba(255, 240, 200, 0.12);
  }

  .search-container::before {
    content: "🔍";
    position: absolute;
    top: 50%;
    right: 0.8rem;
    transform: translateY(-50%);
    font-size: 0.85rem;
    pointer-events: none;
    opacity: 0.6;
  }

  .clear-search-btn {
    position: absolute;
    top: 50%;
    left: 0.8rem;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .clear-search-btn:hover {
    color: var(--gold, #FAD570);
    background: rgba(247, 206, 80, 0.1);
  }

  .list-title {
    font-family: var(--font-hebrew);
    font-size: 1.05rem;
    color: var(--gold-pale, #FFFAF0);
    font-weight: 500;
    text-align: right;
  }

  .gifts-count-badge {
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(247, 206, 80, 0.15);
    border: 1px solid rgba(247, 206, 80, 0.3);
    color: rgba(247, 206, 80, 0.9);
    padding: 0.2rem 0.65rem;
    border-radius: 20px;
    white-space: nowrap;
  }

  .list-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
    font-size: 0.9rem;
    padding: 2rem 0;
  }

  .empty-list {
    text-align: center;
    padding: 2rem 1rem;
    background: rgba(247, 206, 80, 0.03);
    border: 1px dashed rgba(247, 206, 80, 0.15);
    border-radius: 1.5rem;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
  }

  .empty-icon {
    font-size: 2.2rem;
    margin-bottom: 0.75rem;
  }

  .empty-text {
    font-size: 0.88rem;
  }

  .gifts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.65rem;
    max-height: 300px;
    overflow-y: auto;
    padding-left: 0.2rem;
  }

  .gifts-grid::-webkit-scrollbar {
    width: 6px;
  }
  .gifts-grid::-webkit-scrollbar-track {
    background: rgba(247, 206, 80, 0.05);
    border-radius: 3px;
  }
  .gifts-grid::-webkit-scrollbar-thumb {
    background: rgba(247, 206, 80, 0.25);
    border-radius: 3px;
  }

  .gift-item-card {
    background: rgba(247, 206, 80, 0.045);
    border: 1px solid rgba(247, 206, 80, 0.13);
    border-radius: 1rem;
    padding: 0.9rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s;
  }

  .gift-item-card:hover {
    border-color: rgba(247, 206, 80, 0.27);
    background: rgba(247, 206, 80, 0.07);
  }

  .gift-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .gift-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    text-align: right;
  }

  .gift-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-light, rgba(255, 248, 225, 0.95));
  }

  .gift-date {
    font-size: 0.72rem;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
  }

  /* DIVIDER */
  .section-divider {
    height: 1px;
    background: rgba(247, 206, 80, 0.15);
    margin: 2rem 0;
  }

  /* FORM INTRO */
  .form-intro {
    text-align: right;
    margin-bottom: 1.25rem;
  }

  .form-intro-title {
    font-family: var(--font-hebrew);
    font-size: 1.05rem;
    font-weight: 500;
    color: var(--gold-pale, #FFFAF0);
    margin-bottom: 0.25rem;
  }

  .form-intro-sub {
    font-size: 0.82rem;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
    line-height: 1.4;
  }

  /* FORM */
  .gifts-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    animation: fade-up 0.5s both;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field-label {
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    color: rgba(255, 235, 200, 0.85);
    text-align: right;
  }

  .field-label-note {
    font-weight: 400;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
  }

  .field-required {
    color: rgba(255, 140, 120, 0.9);
    font-weight: 600;
  }

  .field-hint {
    font-size: 0.72rem;
    color: rgba(255, 235, 200, 0.5);
    line-height: 1.4;
    text-align: right;
    margin-top: 0.1rem;
  }

  .field-input {
    width: 100%;
    padding: 0.85rem 1rem;
    background: rgba(255, 240, 200, 0.1);
    border: 1px solid rgba(247, 206, 80, 0.25);
    border-radius: 1.2rem;
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: var(--text-bright, rgba(255, 253, 240, 1));
    transition: all 0.25s;
    outline: none;
    text-align: right;
  }

  .field-input::placeholder {
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
  }

  .field-input:focus {
    border-color: rgba(247, 206, 80, 0.5);
    box-shadow: 0 0 0 3px rgba(247, 206, 80, 0.1);
    background: rgba(255, 240, 200, 0.1);
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--amber, #E6954D) 0%, var(--gold, #FAD570) 60%, var(--gold-light, #FFF0C0) 100%);
    color: #2C1A10;
    border: none;
    border-radius: 1.2rem;
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 4px 22px rgba(240, 160, 48, 0.42);
    position: relative;
    overflow: hidden;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 55%);
    border-radius: inherit;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(240, 160, 48, 0.58);
  }

  .submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .submit-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .submit-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
  }

  .spin {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* NOTICE BANNERS */
  .notice-banner {
    padding: 1rem 1.2rem;
    border-radius: 1rem;
    font-family: var(--font-body);
    font-size: 0.875rem;
    text-align: center;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .notice-success {
    background: rgba(50, 120, 60, 0.15);
    border: 1px solid rgba(80, 170, 90, 0.3);
    color: #A8E8A0;
  }

  .notice-error {
    background: rgba(200, 50, 30, 0.12);
    border: 1px solid rgba(200, 80, 60, 0.3);
    color: #FFAAA0;
  }

  .notice-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  /* FOOTER */
  .gifts-footer {
    margin-top: 1.5rem;
    font-family: var(--font-body);
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    color: var(--text-faint, rgba(255, 225, 180, 0.55));
    opacity: 0.55;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    z-index: 5;
  }

  .heart-icon {
    width: 14px;
    height: 14px;
  }

  @keyframes content-rise {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .add-gift-shortcut {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 600;
    color: #2C1A10;
    background: linear-gradient(135deg, var(--gold, #FAD570) 0%, var(--gold-light, #FFF0C0) 100%);
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.23, 1, 0.32, 1);
    float: left;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(240, 160, 48, 0.2);
  }

  .add-gift-shortcut:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(240, 160, 48, 0.35);
    filter: brightness(1.05);
  }

  .add-gift-shortcut:active {
    transform: translateY(1px);
  }

  .add-gift-shortcut svg {
    width: 14px;
    height: 14px;
    stroke-dasharray: none;
  }

  @media (max-width: 480px) {
    .add-gift-shortcut-text {
      display: none;
    }
    .add-gift-shortcut {
      padding: 0.4rem;
      border-radius: 50%;
      width: 28px;
      height: 28px;
    }
  }

  @media (max-width: 640px) {
    .gifts-card {
      padding: 2rem 1.25rem;
      border-radius: 2rem;
    }
    .back-link {
      margin-bottom: 1rem;
    }
    .add-gift-shortcut {
      margin-bottom: 1rem;
    }
  }
`;