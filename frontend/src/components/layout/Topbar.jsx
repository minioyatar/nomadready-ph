import React, { useEffect, useRef, useState } from "react";

export default function Topbar() {
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef   = useRef(null);
  const appsRef     = useRef(null);
  const favsRef     = useRef(null);
  const notifsRef   = useRef(null);
  const calRef      = useRef(null);
  const timers      = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    const els = [searchRef, appsRef, favsRef, notifsRef, calRef];
    els.forEach((r) => {
      if (!r.current) return;
      r.current.style.opacity = "0";
      r.current.style.transform = "translateY(-6px)";
      r.current.style.transition = "none";
    });

    els.forEach((r, i) => {
      later(() => {
        if (!r.current) return;
        r.current.style.transition = "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.3,0.64,1)";
        r.current.style.opacity = "1";
        r.current.style.transform = "translateY(0)";
      }, 60 + i * 70);
    });

    return () => timers.current.forEach(clearTimeout);
  }, []);


  return (
    <>
      <style>{`
        .tb-search-wrap {
          display: flex;
          align-items: center;
          background: #fff;
          padding: 10px 14px;
          border-radius: 28px;
          border: 1.5px solid #e8e4de;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          gap: 10px;
        }
        .tb-search-wrap.focused {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
        }
        .tb-search-input {
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
          background: transparent;
          color: #1a1a1a;
          font-family: inherit;
        }
        .tb-search-input::placeholder { color: #bbb; }
        .tb-icon-btn {
          width: 44px; height: 44px;
          border-radius: 10px;
          border: 1px solid #ece8e2;
          background: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
          flex-shrink: 0;
        }
        .tb-icon-btn:hover { background: #f5f1eb; border-color: #ddd8d0; }
        .tb-icon-btn:active { transform: scale(0.93); }
        .tb-badge {
          position: absolute;
          top: 7px; right: 7px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #0D9488;
          box-shadow: 0 0 0 2px #fff;
          animation: tbBadgePop 0.4s cubic-bezier(0.34,1.7,0.64,1) both;
        }
        @keyframes tbBadgePop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .tb-cal-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #2d2b25;
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: background 0.15s ease, transform 0.15s ease;
          flex-shrink: 0;
        }
        .tb-cal-btn:hover { background: #3e3b34; }
        .tb-cal-btn:active { transform: scale(0.96); }
      `}</style>

      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", minHeight: 64 }}>

        <div ref={searchRef} style={{ flex: 1, opacity: 0, transform: "translateY(-6px)" }}>
          <div className={`tb-search-wrap${searchFocused ? " focused" : ""}`}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={searchFocused ? "#0D9488" : "#bbb"}
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transition: "stroke 0.2s ease" }}
            >
              <circle cx="11" cy="11" r="6"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="tb-search-input"
              placeholder="Search city, partner or metric"
              aria-label="Search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>

          <div ref={appsRef} style={{ opacity: 0, transform: "translateY(-6px)" }}>
            <button
              className="tb-icon-btn"
              title="Apps"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b665f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
          </div>

          <div ref={favsRef} style={{ position: "relative", opacity: 0, transform: "translateY(-6px)" }}>
            <button
              className="tb-icon-btn"
              title="Favorites"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b665f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span className="tb-badge" style={{ animationDelay: "0.5s" }} />
          </div>

          <div ref={notifsRef} style={{ position: "relative", opacity: 0, transform: "translateY(-6px)" }}>
            <button
              className="tb-icon-btn"
              title="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b665f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 17H9M12 3v2M19 10v4l1 2H4l1-2V10a7 7 0 0 1 14 0z"/>
              </svg>
            </button>
            <span className="tb-badge" style={{ animationDelay: "0.6s" }} />
          </div>

          <div ref={calRef} style={{ opacity: 0, transform: "translateY(-6px)" }}>
            <button className="tb-cal-btn" title="This month">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              This month
            </button>
          </div>

        </div>
      </header>
    </>
  );
}