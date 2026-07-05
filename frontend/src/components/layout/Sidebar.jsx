import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Home",
    path: "/dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    key: "assets",
    label: "Assets",
    path: "/assets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5"/>
        <path d="M5 9v11h14V9"/>
      </svg>
    ),
  },
  {
    key: "map",
    label: "Map",
    path: "/map",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    key: "ai",
    label: "AI",
    path: "/ai-advisor",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.4l-5 2.65.96-5.6L3.9 9.5l5.6-.8z"/>
      </svg>
    ),
  },
];

export default function Sidebar({ userInitials = "CJ", onLogout }) {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);

  const logoRef   = useRef(null);
  const navRefs   = useRef([]);
  const logoutRef = useRef(null);
  const avatarRef = useRef(null);
  const timers    = useRef([]);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  // Derive active key from current URL path
  const activeKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))?.key ?? "dashboard";

  useEffect(() => {
    const els = [logoRef, ...navRefs.current.map((r) => ({ current: r })), logoutRef, avatarRef];
    els.forEach(({ current: el }) => {
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
    animate(logoutRef, 130 + NAV_ITEMS.length * 70 + 40);
    animate(avatarRef, 130 + NAV_ITEMS.length * 70 + 80);

    return () => timers.current.forEach(clearTimeout);
  }, []);

  const getItemStyle = (key) => {
    const isActive  = activeKey === key;
    const isHovered = hovered === key && !isActive;
    return {
      width: "52px",
      height: "52px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      cursor: "pointer",
      position: "relative",
      color: isActive ? "#fff" : isHovered ? "#fff" : "rgba(255,255,255,0.55)",
      background: isActive
        ? "rgba(255,255,255,0.18)"
        : isHovered
        ? "rgba(255,255,255,0.13)"
        : "transparent",
      transform: isHovered && !isActive ? "scale(1.04)" : "scale(1)",
      transition: "background 0.15s ease, color 0.15s ease, transform 0.15s cubic-bezier(0.34,1.5,0.64,1)",
      userSelect: "none",
    };
  };

  return (
    <>
      <style>{`
        @keyframes sbPip {
          from { height: 0; opacity: 0; }
          to   { height: 18px; opacity: 1; }
        }
        .sb-pip {
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          border-radius: 99px;
          background: #fff;
          animation: sbPip 0.3s cubic-bezier(0.34,1.5,0.64,1) both;
        }
        .sb-nav-item:active { transform: scale(0.94) !important; }
        .sb-logout:hover { background: rgba(0,0,0,0.15) !important; color: #fff !important; }
        .sb-logout:active { transform: scale(0.96); }
      `}</style>

      <aside style={{
        width: "72px",
        flexShrink: 0,
        background: "linear-gradient(180deg, #D4751A 0%, #B85E10 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>

        {/* Logo */}
        <div
          ref={logoRef}
          style={{
            width: "72px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "0.5px solid rgba(255,255,255,0.12)",
            marginBottom: "8px",
            opacity: 0,
            transform: "translateX(-10px)",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          </div>
        </div>

        {/* Nav */}
        <nav style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: "2px",
          width: "100%", padding: "0 10px", flex: 1,
        }}>
          {NAV_ITEMS.map((item, i) => (
            <NavLink
              key={item.key}
              to={item.path}
              ref={(el) => (navRefs.current[i] = el)}
              className="sb-nav-item"
              style={{ ...getItemStyle(item.key), opacity: 0, transform: "translateX(-10px)" }}
              onMouseEnter={() => setHovered(item.key)}
              onMouseLeave={() => setHovered(null)}
              title={item.label}
              aria-current={activeKey === item.key ? "page" : undefined}
            >
              {activeKey === item.key && <span className="sb-pip" />}
              {item.icon}
              <span style={{
                fontSize: "9px", fontWeight: 700,
                letterSpacing: ".06em", textTransform: "uppercase",
              }}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: "0 10px 16px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}>
          {/* Logout */}
          {onLogout && (
            <button
              ref={logoutRef}
              className="sb-logout"
              onClick={onLogout}
              title="Logout"
              style={{
                width: "52px", height: "44px",
                borderRadius: "10px",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "4px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                background: "transparent",
                border: "none",
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s",
                opacity: 0,
                transform: "translateX(-10px)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/>
                <path d="M16 16l4-4-4-4M20 12H9"/>
              </svg>
              <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                Out
              </span>
            </button>
          )}

          {/* Avatar */}
          <div
            ref={avatarRef}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700, color: "#fff",
              opacity: 0, transform: "translateX(-10px)",
            }}
          >
            {userInitials}
          </div>
        </div>

      </aside>
    </>
  );
}