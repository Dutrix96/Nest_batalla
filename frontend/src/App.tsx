import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthPage } from "./pages/auth_page";
import { DashboardPage } from "./pages/dashboard_page";
import { PveSetupPage } from "./pages/pve_setup_page";
import { PvpSetupPage } from "./pages/pvp_setup_page";
import { BattlePage } from "./pages/battle_page";
import { NotFound } from "./pages/not_found";
import { ProtectedRoute } from "./auth/protected_route";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/pve"
          element={
            <ProtectedRoute>
              <PveSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/pvp"
          element={
            <ProtectedRoute>
              <PvpSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/battle/:id"
          element={
            <ProtectedRoute>
              <BattlePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}