"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface InvitationProps {
  photoId: string;
}

export default function Invitation({ photoId }: InvitationProps) {
  const invitePanelRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Only auto-scroll on mobile
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Custom slow scroll function
    const slowScroll = () => {
      if (window.scrollY > 100 || !invitePanelRef.current) return;
      
      const targetPosition = invitePanelRef.current.offsetTop;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = 4000; // 4 seconds for a very slow, graceful descent
      let start: number | null = null;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const percentage = Math.min(progress / duration, 1);
        
        // Easing function for a very gentle start and end
        const ease = percentage < 0.5 
          ? 2 * percentage * percentage 
          : 1 - Math.pow(-2 * percentage + 2, 2) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (progress < duration && window.scrollY < targetPosition - 5) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    };

    // Auto-scroll after 2s delay (faster as requested)
    scrollTimerRef.current = setTimeout(() => {
      if (window.scrollY < 100) {
        slowScroll();
      }
    }, 2000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleScrollClick = () => {
    // Cancel auto-scroll timer and scroll smoothly
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    invitePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="wedding-home">

      {/* ── LEFT / TOP: Photo panel ── */}
      <div className="photo-panel">
        <Image
          src={`/${photoId}.png`}
          alt="Wedding Photo"
          fill
          style={{ objectFit: "cover", objectPosition: "center 15%" }}
          priority
        />
        <div className="photo-overlay-right" />
        <div className="photo-overlay-bottom" />
        <div className="photo-overlay-vignette" />

        <div className="photo-bsd">בס״ד</div>
        
        {/* Subtle Invitation Header */}
        <div className="photo-header-label">הזמנה לחתונה</div>

        {/* Stamp - mobile only (sits on photo) */}
        <div className="stamp-ring stamp-on-photo">
          <svg viewBox="0 0 120 120" className="stamp-svg" aria-hidden="true">
            <defs>
              <path id="ctp-m" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"/>
            </defs>
            <text fontSize="10" letterSpacing="3.5" fill="rgba(255,235,190,0.88)" fontFamily="Montserrat,sans-serif" fontWeight="500">
              <textPath href="#ctp-m" startOffset="0%">SAVE · THE · DATE · SAVE · THE · DATE ·</textPath>
            </text>
            <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,220,150,0.25)" strokeWidth="0.6"/>
          </svg>
          <div className="stamp-inner" dir="ltr">
            <span className="stamp-date-num">28</span>
            <span className="stamp-date-dot">.</span>
            <span className="stamp-date-num">12</span>
            <span className="stamp-date-dot">.</span>
            <span className="stamp-date-num">26</span>
          </div>
        </div>

        {/* Scroll indicator — mobile only */}
        <button
          className="scroll-indicator"
          onClick={handleScrollClick}
          aria-label="Scroll down to invitation"
        >
          <span className="scroll-indicator-label">לפרטי האירוע</span>
          <div className="scroll-simple-line" />
        </button>
      </div>

      {/* ── RIGHT / BOTTOM: Invitation card ── */}
      <div className="invite-panel" ref={invitePanelRef}>
        <div className="invite-scroll">

          {/* Stamp - desktop only */}
          <div className="stamp-ring stamp-desktop">
            <svg viewBox="0 0 120 120" className="stamp-svg" aria-hidden="true">
              <defs>
                <path id="ctp-d" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0"/>
              </defs>
              <text fontSize="10" letterSpacing="3.5" fill="rgba(255,235,190,0.88)" fontFamily="Montserrat,sans-serif" fontWeight="500">
                <textPath href="#ctp-d" startOffset="0%">SAVE · THE · DATE · SAVE · THE · DATE ·</textPath>
              </text>
              <circle cx="60" cy="60" r="36" fill="none" stroke="rgba(255,220,150,0.25)" strokeWidth="0.6"/>
            </svg>
            <div className="stamp-inner" dir="ltr">
              <span className="stamp-date-num">28</span>
              <span className="stamp-date-dot">.</span>
              <span className="stamp-date-num">12</span>
              <span className="stamp-date-dot">.</span>
              <span className="stamp-date-num">26</span>
            </div>
          </div>

          {/* Names */}
          <section className="names-section">
            <span className="name name-bride">שירה</span>
            <div className="names-divider" aria-hidden="true">
              <svg viewBox="0 0 44 56" fill="none" className="heart-flourish">
                <path d="M22 46 C22 46 4 32 4 18 a9 9 0 0 1 18 0 a9 9 0 0 1 18 0 C40 32 22 46 22 46Z"
                  fill="rgba(255,210,150,0.55)"/>
                <line x1="22" y1="48" x2="22" y2="56" stroke="rgba(255,220,160,0.35)" strokeWidth="1"/>
                <line x1="9"  y1="16" x2="2"  y2="9"  stroke="rgba(255,220,160,0.25)" strokeWidth="0.8"/>
                <line x1="35" y1="16" x2="42" y2="9"  stroke="rgba(255,220,160,0.25)" strokeWidth="0.8"/>
              </svg>
            </div>
            <span className="name name-groom">גדליה</span>
          </section>

          <p className="with-joy">אני שמחים להזמינכם</p>

          {/* Ornament */}
          <div className="golden-line" aria-hidden="true">
            <svg viewBox="0 0 240 14" fill="none">
              <line x1="0"   y1="7" x2="88"  y2="7" stroke="rgba(255,215,140,0.3)"  strokeWidth="0.7"/>
              <circle cx="96"  cy="7" r="2.5" fill="rgba(255,215,140,0.4)"/>
              <circle cx="106" cy="7" r="4.5" fill="rgba(255,215,140,0.2)" stroke="rgba(255,215,140,0.45)" strokeWidth="0.8"/>
              <circle cx="120" cy="7" r="5.5" fill="none" stroke="rgba(255,215,140,0.55)" strokeWidth="1"/>
              <circle cx="120" cy="7" r="2"   fill="rgba(255,215,140,0.7)"/>
              <circle cx="134" cy="7" r="4.5" fill="rgba(255,215,140,0.2)" stroke="rgba(255,215,140,0.45)" strokeWidth="0.8"/>
              <circle cx="144" cy="7" r="2.5" fill="rgba(255,215,140,0.4)"/>
              <line x1="152" y1="7" x2="240" y2="7" stroke="rgba(255,215,140,0.3)" strokeWidth="0.7"/>
            </svg>
          </div>

          {/* Info tiles */}
          <div className="info-tiles">
            <div className="info-tile">
              <div className="info-tile-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.3"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="info-tile-label">תאריך</span>
              <span className="info-tile-value">י״ח בטבת</span>
              <span className="info-tile-sub">תשפ״ז · 28.12.2026</span>
            </div>

            <div className="info-tile">
              <div className="info-tile-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </div>
              <span className="info-tile-label">מיקום</span>
              <span className="info-tile-value">Vigo, Kiryat Ekron</span>
              <span className="info-tile-sub">Bussy Saint Georges St 9</span>
              <span className="info-tile-sub" style={{ marginTop: '0.2rem', fontWeight: 500 }}>חופה בשעה 18:00</span>
            </div>
          </div>

          {/* Blessing quote */}
          <div className="blessing-box">
            <span className="blessing-mark">❝</span>
            <p className="blessing-text">
              קול ששון וקול שמחה<br/>
              קול חתן וקול כלה
            </p>
            <span className="blessing-mark blessing-mark-end">❞</span>
          </div>

          {/* RSVP */}
          <Link href={`/rsvp?from=${photoId}`} className="rsvp-btn">
            <span className="rsvp-btn-glow"/>
            <svg viewBox="0 0 24 24" fill="none" className="rsvp-icon">
              <path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1z"
                stroke="currentColor" strokeWidth="1.3"/>
              <path d="M3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            אישור הגעה
          </Link>

          <p className="footer-note">נשמח לראותכם ביום שמחתנו ♡</p>
          
          {/* Extra bottom spacing for modern feel */}
          <div className="bottom-spacer" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}