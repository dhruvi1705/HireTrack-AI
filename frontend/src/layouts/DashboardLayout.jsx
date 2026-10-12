import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import authService from "../services/authService";

export default function DashboardLayout() {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app">
      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}