import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ALTERAÇÃO: arquivo novo. Controla o tema claro/escuro do app inteiro.
// Diferente dos artifacts de exemplo do Claude, este é um projeto Vite/React
// de verdade que roda no navegador do usuário — então usar localStorage aqui
// é normal e correto (não é o ambiente de preview do Claude).
const THEME_STORAGE_KEY = "obra-frequencia:theme";
const ThemeContext = createContext(null);

function getSystemPreference() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage pode falhar em modo privado/restrito — ignora e usa o
    // preferido do sistema operacional como fallback.
  }
  return getSystemPreference();
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Aplica o atributo data-theme no <html> (usado pelas variáveis CSS em
  // index.css) e atualiza a cor da barra do sistema (status bar / navegador)
  // para combinar com o tema, deixando a sensação de app nativo completa.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#1d6dd6" : "#0d4ea2");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignora falha de storage
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
