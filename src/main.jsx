import React from "react";
import ReactDOM from "react-dom/client";
// ALTERAÇÃO: importa BrowserRouter — habilita as rotas /obras, /chamada,
// /equipe, /relatorios, /tema usadas em App.jsx. O vercel.json já tem a
// reescrita "/(.*) -> /index.html" configurada, então recarregar a página
// direto numa dessas URLs também funciona em produção.
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./context/ToastContext";
// ALTERAÇÃO: AppProvider saiu daqui — agora é montado dentro de App.jsx, e
// só depois que existir uma sessão logada. Antes ele ficava aqui em cima e
// começava a buscar dados do Supabase assim que o app abria, mesmo antes do
// login existir; com a tabela agora exigindo autenticação (RLS), isso só
// gerava erro de permissão na tela de login.
import { AuthProvider } from "./context/AuthContext";
// ALTERAÇÃO: importa o novo ThemeProvider (tema claro/escuro, aba "Tema").
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ALTERAÇÃO: ThemeProvider fica por fora de tudo, pois só mexe no
        atributo data-theme do <html> e não depende de dados da obra. */}
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
