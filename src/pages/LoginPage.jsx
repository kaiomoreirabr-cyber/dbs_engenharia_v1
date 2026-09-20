import { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente."
      );
    }
  };

  return (
    <div className="auth-shell">
      <form className="form-card auth-card" onSubmit={handleSubmit}>
        <img src="/logo-dbs.png" alt="DBS Engenharia" className="auth-logo" />
        <h1 className="form-title">Entrar</h1>
        <p className="form-helper">Controle de Frequência de Obras — DBS Engenharia</p>

        <label className="field-label" htmlFor="login-email">
          E-mail
        </label>
        <input
          id="login-email"
          className="field"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="login-password">
          Senha
        </label>
        <input
          id="login-password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && (
          <p className="field-hint auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={submitting}>
          <LogIn size={16} aria-hidden="true" />
          {submitting ? "Entrando…" : "Entrar"}
        </button>

        <Link to="/esqueci-senha" className="auth-link">
          Esqueci minha senha
        </Link>
      </form>
    </div>
  );
}
