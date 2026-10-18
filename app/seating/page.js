"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { searchGuestSeating, getTableGuests } from "./actions";
import { MEN_TABLES, WOMEN_TABLES } from "../../lib/tables";
import "./seating.css";

const SEATS = 12; // 3 places par côté

/* ── Table carrée : 3 places sur chaque côté ── */
function SquareTable({ table, guests = [], myName }) {
    const seats = Array.from({ length: SEATS }, (_, i) => guests[i] ?? null);
    const extra = guests.slice(SEATS);

    const seat = (i) => {
        const name = seats[i];
        const isMe = name && myName && name === myName;
        return (
            <li
                key={i}
                className={`sq-seat ${name ? "" : "is-empty"} ${isMe ? "is-me" : ""}`}
                title={name || undefined}
            >
                {name ? <span className="sq-seat-name">{name}</span> : null}
            </li>
        );
    };

    return (
        <div className="sq">
            <ul className="sq-side sq-top">{[0, 1, 2].map(seat)}</ul>
            <ul className="sq-side sq-left">{[11, 10, 9].map(seat)}</ul>
            <div className="sq-table">
                <span className="sq-table-label">שולחן</span>
                <span className="sq-table-number">{table.number}</span>
            </div>
            <ul className="sq-side sq-right">{[3, 4, 5].map(seat)}</ul>
            <ul className="sq-side sq-bottom">{[8, 7, 6].map(seat)}</ul>

            {extra.length > 0 && (
                <ul className="sq-extra">
                    {extra.map((n, i) => (
                        <li key={i} className={`sq-seat ${n === myName ? "is-me" : ""}`}>
                            <span className="sq-seat-name">{n}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SeatingPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [tableGuests, setTableGuests] = useState({});
    const [browseOpen, setBrowseOpen] = useState(true);
    const [tab, setTab] = useState("men");
    const [openTable, setOpenTable] = useState(null);
    const debounceRef = useRef(null);
    const inputRef = useRef(null);
    const resultRef = useRef(null);

    const allTables = useMemo(() => [...MEN_TABLES, ...WOMEN_TABLES], []);

    useEffect(() => {
        (async () => {
            const res = await getTableGuests();
            if (res?.tableGuests) setTableGuests(res.tableGuests);
        })();
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, []);

    const resetResults = () => {
        setResults(null);
        setSelectedGuest(null);
        setError(null);
    };

    const scrollToResult = () => {
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
    };

    const doSearch = useCallback(async (q) => {
        const cleaned = q.trim().replace(/\s+/g, " ");
        if (!cleaned) {
            resetResults();
            return;
        }
        setLoading(true);
        setError(null);
        setSelectedGuest(null);
        try {
            const res = await searchGuestSeating(cleaned);
            if (res.error) {
                setError(res.error);
                setResults(null);
            } else {
                setResults(res.results);
                if (res.results?.length === 1) scrollToResult();
            }
        } catch {
            setError("שגיאה בחיפוש. אנא נסו שוב.");
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 400);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        doSearch(query);
    };

    const handleClear = () => {
        setQuery("");
        resetResults();
        inputRef.current?.focus();
    };

    const handleSelectGuest = (guest) => {
        setSelectedGuest(guest);
        scrollToResult();
    };

    /* ── Fiche d'un invité + son schéma de table ── */
    const renderGuest = (guest, canGoBack) => {
        const back = canGoBack ? (
            <button type="button" className="seating-back-list" onClick={() => setSelectedGuest(null)}>
                → חזרה לרשימה
            </button>
        ) : null;

        if (!guest.tableNumber) {
            return (
                <div className="seating-card seating-not-assigned">
                    <p className="seating-result-name">{guest.name}</p>
                    <p className="seating-not-assigned-text">
                        מידע על המושב שלכם עדיין לא זמין.
                        <br />
                        אנא פנו לסדרן המושבים לעזרה.
                    </p>
                    {back}
                </div>
            );
        }

        const table = allTables.find((t) => t.number === guest.tableNumber) || {
            number: guest.tableNumber,
            category: guest.category,
            section: guest.section,
        };

        return (
            <div className="seating-found">
                <div className="seating-card seating-result-card">
                    <p className="seating-result-name">{guest.name}</p>
                    <p className="seating-result-lead">השולחן שלכם</p>
                    <p className="seating-result-table-number">{guest.tableNumber}</p>
                    <p className="seating-result-category">{guest.category}</p>
                    {guest.section && <span className="seating-result-section">{guest.section}</span>}
                    {back}
                </div>

                <div className="seating-card seating-diagram-card">
                    <p className="seating-diagram-title">מי יושב איתכם</p>
                    <SquareTable table={table} guests={tableGuests[guest.tableNumber]} myName={guest.name} />
                </div>
            </div>
        );
    };

    const renderResults = () => {
        if (loading) {
            return (
                <div className="seating-loading" role="status">
                    <div className="seating-spinner" aria-hidden="true" />
                    <p className="seating-loading-text">מחפשים...</p>
                </div>
            );
        }
        if (error) return <div className="seating-error" role="alert">{error}</div>;
        if (results === null) return null;
        if (selectedGuest) return renderGuest(selectedGuest, results.length > 1);

        if (results.length === 0) {
            return (
                <div className="seating-no-results" role="status">
                    <p className="seating-no-results-text">לא מצאנו את השם הזה.</p>
                    <p className="seating-no-results-hint">
                        נסו לכתוב רק שם פרטי או רק שם משפחה, או פנו לסדרן המושבים.
                    </p>
                </div>
            );
        }
        if (results.length === 1) return renderGuest(results[0], false);

        return (
            <div className="seating-multi-results">
                <p className="seating-multi-title">נמצאו {results.length} תוצאות. לחצו על השם שלכם:</p>
                <div className="seating-multi-list">
                    {results.map((guest, idx) => (
                        <button
                            key={`${guest.id}_${idx}`}
                            type="button"
                            className="seating-multi-item"
                            onClick={() => handleSelectGuest(guest)}
                        >
                            <span className="seating-multi-item-name">{guest.name}</span>
                            <span className="seating-multi-item-arrow" aria-hidden="true">←</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    /* ── Parcourir toutes les tables ── */
    const list = tab === "men" ? MEN_TABLES : WOMEN_TABLES;
    const current = openTable ? allTables.find((t) => t.number === openTable) : null;

    return (
        <div className="seating-page">
            <div className="seating-topbar">
                <Link href="/" className="seating-back-link" aria-label="חזרה להזמנה">
                    <span aria-hidden="true">→</span> חזרה
                </Link>
            </div>

            <main className="seating-container">
                <header className="seating-header">
                    <p className="seating-couple-names">שירה &amp; גדליה</p>
                    <h1 className="seating-title">איפה אני יושב?</h1>
                </header>

                <section className="seating-search-section" aria-label="חיפוש שולחן">
                    <form
                        className={`seating-search-form ${query ? "has-value" : "is-idle"}`}
                        onSubmit={handleSubmit}
                        role="search"
                    >
                        <label htmlFor="guest-name" className="seating-search-label">
                            הקלידו את השם שלכם
                        </label>
                        <div className="seating-search-row">
                            <div className="seating-input-wrap">
                                <svg className="seating-input-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                                    <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                                <input
                                    id="guest-name"
                                    ref={inputRef}
                                    type="text"
                                    className="seating-search-input"
                                    placeholder="שם פרטי ושם משפחה"
                                    value={query}
                                    onChange={handleInputChange}
                                    autoComplete="off"
                                    enterKeyHint="search"
                                    dir="rtl"
                                />
                                {query && (
                                    <button type="button" className="seating-clear-btn" onClick={handleClear} aria-label="נקה חיפוש">
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="seating-search-btn">חיפוש</button>
                        </div>
                    </form>
                    {!query && <p className="seating-hint">נראה לכם את מספר השולחן ואת מי שיושב לידכם</p>}
                </section>

                <div ref={resultRef} className="seating-results" aria-live="polite">
                    {renderResults()}
                </div>

                <section className="seating-browse">
                    {/* <button
                        type="button"
                        className="seating-browse-toggle"
                        aria-expanded={browseOpen}
                        onClick={() => setBrowseOpen((v) => !v)}
                    >
                        {browseOpen ? "הסתר את כל השולחנות" : "או עיינו בכל השולחנות"}
                        <span className={`seating-browse-arrow ${browseOpen ? "is-open" : ""}`} aria-hidden="true">▾</span>
                    </button> */}

                    {browseOpen && (
                        <div className="seating-browse-body">
                            <div className="seating-tabs" role="tablist">
                                {[
                                    ["men", "גברים"],
                                    ["women", "נשים"],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === key}
                                        className={`seating-tab ${tab === key ? "is-active" : ""}`}
                                        onClick={() => {
                                            setTab(key);
                                            setOpenTable(null);
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="seating-mini-grid">
                                {list.map((t) => (
                                    <button
                                        key={t.number}
                                        type="button"
                                        className={`seating-mini ${openTable === t.number ? "is-active" : ""}`}
                                        aria-pressed={openTable === t.number}
                                        onClick={() => setOpenTable(openTable === t.number ? null : t.number)}
                                    >
                                        <span className="seating-mini-number">{t.number}</span>
                                        <span className="seating-mini-category">{t.category}</span>
                                    </button>
                                ))}
                            </div>

                            {current && (
                                <div className="seating-card seating-diagram-card seating-browse-diagram">
                                    <p className="seating-diagram-title">{current.category}</p>
                                    <SquareTable table={current} guests={tableGuests[current.number]} />
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <footer className="seating-footer">
                    <p className="seating-footer-text">נשמח לראותכם ביום שמחתנו ♡</p>
                </footer>
            </main>
        </div>
    );
}