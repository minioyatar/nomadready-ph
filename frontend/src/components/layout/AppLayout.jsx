import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout() {
return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F4EF" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "26px 30px 44px", display: "flex", flexDirection: "column", gap: "22px" }}>
        <Topbar />
               <Outlet />
      </main>
    </div>
  );}