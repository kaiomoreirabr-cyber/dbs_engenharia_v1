import { Palette, Sun, Moon } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";

export default function TemaPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="page">
      <PageHeader icon={Palette} eyebrow="Aparência" title="Tema" />

      <div className="theme-option-list">
        <button
          type="button"
          className={`theme-option${theme === "light" ? " is-selected" : ""}`}
          onClick={() => setTheme("light")}
        >
          <span className="theme-option-icon" aria-hidden="true">
            <Sun size={20} />
          </span>
          <span className="theme-option-text">
            <strong>Claro</strong>
            <span>Fundo claro, ideal para ambientes bem iluminados.</span>
          </span>
        </button>

        <button
          type="button"
          className={`theme-option${theme === "dark" ? " is-selected" : ""}`}
          onClick={() => setTheme("dark")}
        >
          <span className="theme-option-icon" aria-hidden="true">
            <Moon size={20} />
          </span>
          <span className="theme-option-text">
            <strong>Escuro</strong>
            <span>Fundo escuro, cansa menos a vista à noite e economiza bateria.</span>
          </span>
        </button>
      </div>
    </div>
  );
}
