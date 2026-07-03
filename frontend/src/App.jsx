/* eslint-disable no-unused-vars */
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./routes/Dashboard";
import Assets from "./routes/Assets";
import MapView from "./routes/MapView";
import AIAdvisor from "./routes/AIAdvisor";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/ai-advisor" element={<AIAdvisor />} />
      </Route>
    </Routes>
  );
}
