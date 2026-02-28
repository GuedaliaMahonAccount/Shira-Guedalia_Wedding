import Link from "next/link";

export default function Home() {
  return (
    <main className="wedding-home">
      {/* Petal background decorations */}
      <div className="bg-layer" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <svg className="corner-floral top-left" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,100 Q50,10 100,50 Q150,90 100,150 Q50,190 10,100Z" fill="rgba(180,140,100,0.12)" />
          <path d="M30,80 Q70,30 100,70 Q130,110 90,140 Q50,170 30,80Z" fill="rgba(180,140,100,0.08)" />
          <circle cx="100" cy="100" r="4" fill="rgba(180,140,100,0.3)" />
          <circle cx="60" cy="60" r="2.5" fill="rgba(180,140,100,0.25)" />
          <circle cx="140" cy="130" r="2" fill="rgba(180,140,100,0.2)" />
          {/* Stem */}
          <path d="M100,150 Q90,170 80,190" stroke="rgba(130,110,80,0.2)" strokeWidth="1.5" fill="none" />
          <path d="M90,165 Q75,160 65,150" stroke="rgba(130,110,80,0.15)" strokeWidth="1" fill="none" />
          {/* Small petals */}
          <ellipse cx="55" cy="45" rx="12" ry="7" transform="rotate(-30 55 45)" fill="rgba(210,170,140,0.15)" />
          <ellipse cx="150" cy="75" rx="10" ry="6" transform="rotate(20 150 75)" fill="rgba(210,170,140,0.12)" />
          <ellipse cx="130" cy="145" rx="9" ry="5" transform="rotate(-10 130 145)" fill="rgba(210,170,140,0.12)" />
        </svg>
        <svg className="corner-floral bottom-right" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M190,100 Q150,10 100,50 Q50,90 100,150 Q150,190 190,100Z" fill="rgba(180,140,100,0.12)" />
          <circle cx="100" cy="100" r="4" fill="rgba(180,140,100,0.3)" />
          <ellipse cx="145" cy="55" rx="12" ry="7" transform="rotate(30 145 55)" fill="rgba(210,170,140,0.15)" />
          <ellipse cx="55" cy="125" rx="9" ry="5" transform="rotate(10 55 125)" fill="rgba(210,170,140,0.12)" />
          <path d="M100,150 Q110,170 120,190" stroke="rgba(130,110,80,0.2)" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Card */}
      <div className="invitation-card">
        {/* Top ornament */}
        <div className="ornament-top" aria-hidden="true">
          <svg viewBox="0 0 300 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="110" y2="20" stroke="rgba(180,140,100,0.35)" strokeWidth="0.8" />
            <path d="M110,20 Q130,5 150,20 Q170,35 190,20" stroke="rgba(180,140,100,0.5)" strokeWidth="1" fill="none" />
            <line x1="190" y1="20" x2="300" y2="20" stroke="rgba(180,140,100,0.35)" strokeWidth="0.8" />
            <circle cx="150" cy="20" r="3" fill="rgba(180,140,100,0.5)" />
            <circle cx="125" cy="13" r="2" fill="rgba(180,140,100,0.3)" />
            <circle cx="175" cy="27" r="2" fill="rgba(180,140,100,0.3)" />
            <circle cx="110" cy="20" r="1.5" fill="rgba(180,140,100,0.4)" />
            <circle cx="190" cy="20" r="1.5" fill="rgba(180,140,100,0.4)" />
          </svg>
        </div>

        {/* Header */}
        <header className="card-header">
          <p className="bsd-text">בס״ד</p>
          <p className="with-joy">בשמחה ובטוב לבב</p>
        </header>

        {/* Names */}
        <section className="names-section">
          <span className="name name-bride">שירה</span>
          <div className="ampersand-wrap">
            <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="ampersand-svg">
              <path d="M30,5 Q45,5 45,20 Q45,32 30,38 Q45,44 48,58 Q51,72 38,75 Q25,78 20,68 Q15,58 22,50 L30,38 Q15,32 15,20 Q15,5 30,5Z" 
                    stroke="rgba(180,140,100,0.7)" strokeWidth="1.5" fill="rgba(180,140,100,0.08)" />
              <path d="M28,50 Q18,56 16,66 Q14,76 24,78 Q34,80 40,70 Q46,60 38,52Z" 
                    fill="rgba(180,140,100,0.12)" stroke="rgba(180,140,100,0.5)" strokeWidth="1" />
            </svg>
          </div>
          <span className="name name-groom">גדליה</span>
        </section>

        {/* Divider */}
        <div className="floral-divider" aria-hidden="true">
          <svg viewBox="0 0 280 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="15" x2="90" y2="15" stroke="rgba(180,140,100,0.3)" strokeWidth="0.7" />
            <ellipse cx="105" cy="15" rx="8" ry="5" fill="rgba(180,140,100,0.2)" />
            <ellipse cx="115" cy="10" rx="6" ry="4" transform="rotate(-20 115 10)" fill="rgba(180,140,100,0.15)" />
            <circle cx="125" cy="15" r="3.5" fill="rgba(180,140,100,0.35)" />
            <ellipse cx="135" cy="10" rx="6" ry="4" transform="rotate(20 135 10)" fill="rgba(180,140,100,0.15)" />
            <ellipse cx="145" cy="15" rx="8" ry="5" fill="rgba(180,140,100,0.2)" />
            <circle cx="125" cy="15" r="1.5" fill="rgba(180,140,100,0.6)" />
            <ellipse cx="115" cy="20" rx="6" ry="4" transform="rotate(20 115 20)" fill="rgba(180,140,100,0.12)" />
            <ellipse cx="135" cy="20" rx="6" ry="4" transform="rotate(-20 135 20)" fill="rgba(180,140,100,0.12)" />
            <line x1="155" y1="15" x2="280" y2="15" stroke="rgba(180,140,100,0.3)" strokeWidth="0.7" />
            <circle cx="90" cy="15" r="1.5" fill="rgba(180,140,100,0.4)" />
            <circle cx="155" cy="15" r="1.5" fill="rgba(180,140,100,0.4)" />
          </svg>
        </div>

        {/* Save the date */}
        <section className="date-section">
          <p className="save-date-label">Save the Date</p>
          <div className="date-display">
            <span className="date-num">ג׳</span>
            <span className="date-sep">·</span>
            <span className="date-month">בספטמבר</span>
            <span className="date-sep">·</span>
            <span className="date-year">תשפ״ז</span>
          </div>
          <p className="date-gregorian">3 בספטמבר 2026</p>
        </section>

        {/* Location */}
        <section className="location-section">
          <div className="location-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                    stroke="rgba(180,140,100,0.7)" strokeWidth="1.2" fill="rgba(180,140,100,0.1)"/>
              <circle cx="12" cy="9" r="2.5" stroke="rgba(180,140,100,0.7)" strokeWidth="1" fill="rgba(180,140,100,0.15)"/>
            </svg>
          </div>
          <p className="location-address">רחוב Ino Shaki 6</p>
          <p className="location-time">בשעה 18:00</p>
        </section>

        {/* Bottom ornament */}
        <div className="ornament-bottom" aria-hidden="true">
          <svg viewBox="0 0 300 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="20" x2="110" y2="20" stroke="rgba(180,140,100,0.35)" strokeWidth="0.8" />
            <path d="M110,20 Q130,35 150,20 Q170,5 190,20" stroke="rgba(180,140,100,0.5)" strokeWidth="1" fill="none" />
            <line x1="190" y1="20" x2="300" y2="20" stroke="rgba(180,140,100,0.35)" strokeWidth="0.8" />
            <circle cx="150" cy="20" r="3" fill="rgba(180,140,100,0.5)" />
          </svg>
        </div>

        {/* RSVP Button */}
        <div className="rsvp-wrap">
          <Link href="/rsvp" className="rsvp-btn">
            <span className="rsvp-btn-inner">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rsvp-icon">
                <path d="M21 5H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V6a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              אישור הגעה
            </span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="wedding-footer">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
          <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(180,140,100,0.4)"/>
        </svg>
        נשמח לראותכם ביום שמחתנו
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="heart-icon">
          <path d="M10 17s-8-5-8-10a4 4 0 018 0 4 4 0 018 0c0 5-8 10-8 10z" fill="rgba(180,140,100,0.4)"/>
        </svg>
      </footer>
    </main>
  );
}