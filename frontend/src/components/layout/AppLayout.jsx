import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "20px 28px 44px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <Topbar />
        <Outlet />
      </main>
    </div>
  );
}
