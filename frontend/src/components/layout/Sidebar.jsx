// Placeholder — Sidebar will be implemented in feature/dashboard-overview
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assets", label: "Local Assets" },
  { to: "/map", label: "Map View" },
  { to: "/ai-advisor", label: "AI Advisor" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-5 font-bold text-lg border-b border-gray-200">NomadReady PH</div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm font-medium ${
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
