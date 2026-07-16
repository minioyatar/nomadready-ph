import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    key: "assets",
    label: "Local Assets",
    path: "/assets",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5"/>
        <path d="M5 9v11h14V9"/>
      </svg>
    ),
  },
  {
    key: "map",
    label: "Map View",
    path: "/map",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    key: "ai",
    label: "AI Advisor",
    path: "/ai-advisor",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.4l-5 2.65.96-5.6L3.9 9.5l5.6-.8z"/>
      </svg>
    ),
  },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const [logoFailed, setLogoFailed] = useState(false);

  const logoRef    = useRef(null);
  const navRefs    = useRef([]);
  const profileRef = useRef(null);
  const timers     = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const activeKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? "dashboard";

  useEffect(() => {
    const refs = [logoRef, ...navRefs.current.map((r) => ({ current: r })), profileRef];
    refs.forEach(({ current: el }) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateX(-10px)";
      el.style.transition = "none";
    });

    const animate = (ref, delay) => {
      later(() => {
        const el = ref?.current ?? ref;
        if (!el) return;
        el.style.transition = "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.3,0.64,1)";
        el.style.opacity = "1";
        el.style.transform = "translateX(0)";
      }, delay);
    };

    animate(logoRef, 60);
    NAV_ITEMS.forEach((_, i) => animate({ current: navRefs.current[i] }, 130 + i * 70));
    animate(profileRef, 130 + NAV_ITEMS.length * 70 + 60);

    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style>{`
        @keyframes sbPip {
          from { height: 0; opacity: 0; }
          to   { height: 20px; opacity: 1; }
        }
        .sb-pip {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          border-radius: 0 99px 99px 0;
          background: #fff;
          animation: sbPip 0.28s cubic-bezier(0.34,1.5,0.64,1) both;
        }
        .sb-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          height: 40px;
          border-radius: 9px;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #475569;
          text-decoration: none;
          transition: background 0.14s ease, color 0.14s ease;
          position: relative;
        }
        .sb-nav-link:hover:not(.sb-active) {
          background: #CCFBF1;
          color: #0F766E;
        }
        .sb-nav-link.sb-active {
          background: #0D9488;
          color: #fff;
          box-shadow: 0 2px 8px rgba(13,148,136,.22);
        }
        .sb-nav-link:active { transform: scale(0.97); }
      `}</style>

      <aside style={{
        width: "228px",
        flexShrink: 0,
        backgroundColor: "#ffffff",
        backgroundImage: `
          linear-gradient(
            to bottom,
            rgba(255,255,255,0.62) 0%,
            rgba(255,255,255,0.48) 35%,
            rgba(255,255,255,0.25) 70%,
            rgba(255,255,255,0.00) 100%
          ),
          url('/sidebar-bg.png')
        `,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
      }}>

        {/* All sidebar content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Logo */}
          <div
            ref={logoRef}
            style={{
              padding: "8px 16px 8px",
              borderBottom: "1px solid #F1F5F9",
              opacity: 0,
              transform: "translateX(-10px)",
            }}
          >
            {!logoFailed ? (
              <img
                src="/nomadready-logo.png"
                alt="NomadReady PH"
                onError={() => setLogoFailed(true)}
                style={{
                  width: 210,
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: "left center",
                  display: "block",
                }}
              />
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", lineHeight: 1.25 }}>
                  NomadReady PH
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, letterSpacing: ".03em", marginTop: 2 }}>
                  Work. Stay. Explore.
                </div>
              </div>
            )}
          </div>

          {/* Destination label */}
          <div style={{ padding: "12px 20px 6px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>
              Destination
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0D9488" }}>
              Carles, Iloilo
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "10px 10px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeKey === item.key;
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  ref={(el) => (navRefs.current[i] = el)}
                  className={`sb-nav-link${isActive ? " sb-active" : ""}`}
                  style={{ opacity: 0, transform: "translateX(-10px)" }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && <span className="sb-pip" />}
                  <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Profile card */}
          <div
            ref={profileRef}
            style={{
              padding: "12px 16px 16px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: 0,
              transform: "translateX(-10px)",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #0D9488, #0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              CJ
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}>
                Carles LGU
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Tourism Office
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  flexShrink: 0,
                  width: 28, height: 28, borderRadius: 7,
                  border: "1px solid #E2E8F0", background: "transparent",
                  cursor: "pointer", color: "#94A3B8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/>
                  <path d="M16 16l4-4-4-4M20 12H9"/>
                </svg>
              </button>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
