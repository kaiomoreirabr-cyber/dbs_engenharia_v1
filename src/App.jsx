import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import PageTransition from "./components/PageTransition";
import ToastStack from "./components/ToastStack";
import { LoadingScreen, ErrorScreen } from "./components/StatusScreen";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ObrasPage from "./pages/ObrasPage";
import ChamadaPage from "./pages/ChamadaPage";
import EquipePage from "./pages/EquipePage";
import RelatoriosPage from "./pages/RelatoriosPage";
import TemaPage from "./pages/TemaPage";

// ALTERAÇÃO: App.jsx agora começa com um "portão" de autenticação. Antes
// disso tudo o app já tinha sido dividido em 5 páginas de verdade (rotas),
// com uma barra de navegação fixa embaixo (BottomNav) — isso continua igual,
// só que agora só é alcançado depois de uma sessão válida do Supabase Auth.
export default function App() {
  const { session, authLoading, isPasswordRecovery } = useAuth();

  // Sem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não tem como autenticar
  // ninguém — mostra o mesmo aviso de configuração de antes, em vez de uma
  // tela de login que nunca vai funcionar.
  if (!isSupabaseConfigured) {
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

  // ALTERAÇÃO: bloco novo — quando a pessoa chega pelo link do e-mail de
  // recuperação, o Supabase já cria uma sessão temporária (então "session"
  // abaixo já viria preenchida), mas ela NÃO deve cair direto no app: precisa
  // primeiro definir a nova senha. Esse "if" força a tela de redefinição
  // mesmo com sessão presente, e tranca qualquer outra rota enquanto isso.
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
          {/* ALTERAÇÃO: qualquer outra URL sem sessão cai no login — inclusive
              um link direto pra "/chamada" copiado de uma aba antiga. */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastStack />
      </div>
    );
  }

  // ALTERAÇÃO: AppProvider só é montado AQUI, depois de confirmar a sessão —
  // ele é quem busca obras/funcionários/frequência no Supabase, e essas
  // tabelas agora exigem estar autenticado (RLS), então não faz sentido
  // buscar antes disso.
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
      {/* ALTERAÇÃO: barra de topo nova, com a logo da DBS Engenharia — ver
          components/AppHeader.jsx. Fica visível em qualquer tela. */}
      <AppHeader />
      <main className="app-main">
        <Routes>
          {/* ALTERAÇÃO: PageTransition é usado como rota "layout" (elemento
              pai) — ela chama useOutlet() por dentro para pegar a página
              filha que casou com a URL e renderizá-la com transição de
              fade/slide, em vez de trocar a tela seca. Ver
              components/PageTransition.jsx. */}
          <Route element={<PageTransition />}>
            {/* ALTERAÇÃO: raiz "/" redireciona para "/chamada", a tela que o
                usuário mais usa no dia a dia (marcar presença). */}
            <Route path="/" element={<Navigate to="/chamada" replace />} />
            <Route path="/obras" element={<ObrasPage />} />
            <Route path="/chamada" element={<ChamadaPage />} />
            <Route path="/equipe" element={<EquipePage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/tema" element={<TemaPage />} />
            {/* ALTERAÇÃO: já logado, "/login" e qualquer rota desconhecida
                caem na Chamada em vez de mostrar a tela de login de novo. */}
            <Route path="/login" element={<Navigate to="/chamada" replace />} />
            <Route path="*" element={<Navigate to="/chamada" replace />} />
          </Route>
        </Routes>
      </main>

      <BottomNav />
      <ToastStack />
    </div>
  );
}
