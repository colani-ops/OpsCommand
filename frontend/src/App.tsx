import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EquipmentPage from "./pages/EquipmentPage";
import HomePage from "./pages/HomePage";
import SquadsPage from "./pages/SquadsPage";
import MissionsPage from "./pages/MissionsPage";
import ProfilePage from "./pages/ProfilePage";
import { RequireAuth } from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import RegisterPage from "./pages/RegisterPage";
import UserManagementPage from "./pages/UserManagementPage";

function Authed({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<Authed><HomePage /></Authed>} />
        <Route path="/squads" element={<Authed><SquadsPage /></Authed>} />
        <Route path="/missions" element={<Authed><MissionsPage /></Authed>} />
        <Route path="/equipment" element={<Authed><EquipmentPage /></Authed>} />
        <Route path="/profile" element={<Authed><ProfilePage /></Authed>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/users" element={<Authed><UserManagementPage /></Authed>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}