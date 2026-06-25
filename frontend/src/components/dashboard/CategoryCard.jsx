import React from "react";
import Card from '../ui/Card';

export default function CategoryCard({
  name  = "",
  score = 0,
  color = "#842B8E",
  delta = null,
}) {
  const pct = Math.max(0, Math.min(100, score));

  const deltaColor =
    delta?.startsWith("+") ? "#2E9E5B"
    : delta?.startsWith("-") ? "#E2571A"
    : "#BCB4A7";

  const size   = 64;
  const stroke = 7;
  const r      = (size - stroke) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const gap    = circ - filled;

  return (
    <Card className="p-4 text-center" style={{ background: "#fff", border: "1px solid #EFE8DD", borderRadius: "18px", padding: "16px 18px", boxShadow: "0 1px 2px rgba(30,20,10,.04), 0 8px 22px rgba(30,20,10,.03)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", fontWeight: 700, letterSpacing: ".06em", color: "#9A9388", textTransform: "uppercase" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
          {name}
        </div>
        {delta && <span style={{ fontSize: "11px", fontWeight: 700, color: deltaColor }}>{delta}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ECE6DB" strokeWidth={stroke} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${filled} ${gap}`} transform={`rotate(-90 ${cx} ${cy})`} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: "15px", fill: "#2C2A28" }}>
            {score}
          </text>
        </svg>

        <div>
          <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "30px", fontWeight: 700, lineHeight: 1, color: "#2C2A28" }}>
            {score}
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#BCB4A7", marginLeft: "2px" }}>/100</span>
          </div>
          <div style={{ marginTop: "6px", height: "6px", width: "80px", background: "#ECE6DB", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export const SimpleCategoryCard = ({ title, score }) => (
  <Card className="p-4 text-center">
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-3xl font-bold mt-2">{score}</p>
  </Card>
);