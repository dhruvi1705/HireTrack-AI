import { Routes, Route, Navigate } from "react-router-dom";

import LaunchPage from "./pages/LaunchPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Interviews from "./pages/Interviews";
import FollowUps from "./pages/FollowUps";
import Companies from "./pages/Companies";
import Analytics from "./pages/Analytics";
import AiTools from "./pages/AiTools";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LaunchPage />} />
      <Route path="/login" element={<Login key="login" />} />
      <Route path="/signup" element={<Login key="signup" isSignUpMode={true} />} />

      {/* Main application (Protected by DashboardLayout) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-tools" element={<AiTools />} />
      </Route>


      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
