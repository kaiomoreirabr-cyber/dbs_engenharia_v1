import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError("Não foi possível salvar a nova senha. Tente novamente.");
    }
  };

  return (
    <div className="auth-shell">
      <form className="form-card auth-card" onSubmit={handleSubmit}>
        <img src="/logo-dbs.png" alt="DBS Engenharia" className="auth-logo" />
        <h1 className="form-title">Defina sua nova senha</h1>
        <p className="form-helper">Escolha uma senha com pelo menos 6 caracteres.</p>

        <label className="field-label" htmlFor="reset-password">
          Nova senha
        </label>
        <input
          id="reset-password"
          className="field"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="reset-password-confirm">
          Confirme a nova senha
        </label>
        <input
          id="reset-password-confirm"
          className="field"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />

        {error && (
          <p className="field-hint auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={submitting}>
          <KeyRound size={16} aria-hidden="true" />
          {submitting ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
