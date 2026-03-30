import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import EquipmentPage from "./pages/EquipmentPage";
import EquipmentProfilePage from "./pages/EquipmentProfilePage";
import HomePage from "./pages/HomePage";
import SquadsPage from "./pages/SquadsPage";
import MySquadPage from "./pages/MySquadPage";
import SquadProfilePage from "./pages/SquadProfilePage";
import MissionsPage from "./pages/MissionsPage";
import MyMissionsPage from "./pages/MyMissionsPage";
import MyProfilePage from "./pages/MyProfilePage";
import { RequireAuth } from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import RegisterPage from "./pages/RegisterPage";
import UserManagementPage from "./pages/UserManagementPage";
import UserProfilePage from "./pages/UserProfilePage";

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
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<Authed><HomePage /></Authed>} />
        <Route path="/squads" element={<Authed><SquadsPage /></Authed>} />
        <Route path="/my-squad" element={<Authed><MySquadPage /></Authed>} />
        <Route path="/squads/:id" element={<Authed><SquadProfilePage /></Authed>} />
        <Route path="/missions" element={<Authed><MissionsPage /></Authed>} />
        <Route path="/equipment" element={<Authed><EquipmentPage /></Authed>} />
        <Route path="/equipment/:id" element={<Authed><EquipmentProfilePage /></Authed>} />
        <Route path="/myprofile" element={<Authed><MyProfilePage /></Authed>} />
        <Route path="/users/:id" element={<Authed><UserProfilePage /></Authed>} />
 
        <Route path="/users" element={<Authed><UserManagementPage /></Authed>} />
        <Route path="/my-missions" element={<Authed><MyMissionsPage /></Authed>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}