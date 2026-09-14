import { Palette, Sun, Moon } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";

// ALTERAÇÃO: arquivo novo. É a aba "Tema" que aparecia nas suas capturas de
// tela — alterna entre claro e escuro. Fica numa página própria (em vez de
// um botão escondido em algum canto) porque, no celular, é mais fácil achar
// e tocar numa aba fixa do que caçar um ícone pequeno.
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
