import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { isSupabaseConfigured, useMockData } from "./lib/supabaseClient";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import PageTransition from "./components/PageTransition";
import ToastStack from "./components/ToastStack";
import BackToTop from "./components/BackToTop";
import { LoadingScreen, ErrorScreen } from "./components/StatusScreen";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ObrasPage from "./pages/ObrasPage";
import ChamadaPage from "./pages/ChamadaPage";
import EquipePage from "./pages/EquipePage";
import GastosPage from "./pages/GastosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import TemaPage from "./pages/TemaPage";

export default function App() {
  const { session, authLoading, isPasswordRecovery } = useAuth();

  if (!isSupabaseConfigured && !useMockData) {
    return (
      <div className="app-shell">
        <ErrorScreen message="Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o app." />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="app-shell">
        <LoadingScreen />
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <div className="app-shell auth-shell-wrapper">
        <Routes>
          <Route path="*" element={<ResetPasswordPage />} />
        </Routes>
        <ToastStack />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell auth-shell-wrapper">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastStack />
      </div>
    );
  }

  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  );
}

function AuthenticatedApp() {
  const { initialLoading, loadError } = useApp();

  if (initialLoading) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingScreen />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <AppHeader />
        <ErrorScreen message={loadError} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <div className="scroll-top-sentinel" aria-hidden="true" />
        <Routes>
          <Route element={<PageTransition />}>
            <Route path="/" element={<Navigate to="/obras" replace />} />
            <Route path="/obras" element={<ObrasPage />} />
            <Route path="/chamada" element={<ChamadaPage />} />
            <Route path="/equipe" element={<EquipePage />} />
            <Route path="/gastos" element={<GastosPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/tema" element={<TemaPage />} />
            <Route path="/login" element={<Navigate to="/obras" replace />} />
            <Route path="*" element={<Navigate to="/obras" replace />} />
          </Route>
        </Routes>
      </main>

      <BottomNav />
      <BackToTop />
      <ToastStack />
    </div>
  );
}
