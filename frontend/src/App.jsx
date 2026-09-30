import { Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Interviews from "./pages/Interviews";

function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Main application */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/interviews" element={<Interviews />} />
      </Route>
    </Routes>
  );
}

export default App;
