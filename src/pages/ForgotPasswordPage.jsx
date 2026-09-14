import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ALTERAÇÃO: página nova — "esqueci minha senha". Só pede o e-mail e chama
// sendPasswordReset (ver AuthContext.jsx), que dispara o e-mail de
// recuperação do Supabase. Por segurança, mostra a mesma mensagem de sucesso
// mesmo se o e-mail não existir na base — assim ninguém consegue usar essa
// tela pra descobrir quais e-mails têm cadastro.
export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: resetError } = await sendPasswordReset(email.trim());
    setSubmitting(false);

    // ALTERAÇÃO: só trata erro de rede/limite de envio como erro de verdade;
    // "e-mail não encontrado" o Supabase nem informa por padrão, então
    // qualquer outro caso vira a mesma tela de sucesso.
    if (resetError && resetError.status && resetError.status >= 500) {
      setError("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="auth-shell">
        <div className="form-card auth-card">
          <MailCheck size={32} className="auth-success-icon" aria-hidden="true" />
          <h1 className="form-title">Verifique seu e-mail</h1>
          <p className="form-helper">
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link para você criar uma
            nova senha. Confira também a caixa de spam.
          </p>
          <Link to="/login" className="primary-button auth-button-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <form className="form-card auth-card" onSubmit={handleSubmit}>
        <img src="/logo-dbs.png" alt="DBS Engenharia" className="auth-logo" />
        <h1 className="form-title">Esqueci minha senha</h1>
        <p className="form-helper">
          Informe o e-mail da sua conta. Vamos enviar um link para você definir uma nova senha.
        </p>

        <label className="field-label" htmlFor="forgot-email">
          E-mail
        </label>
        <input
          id="forgot-email"
          className="field"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {error && (
          <p className="field-hint auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={submitting}>
          <Send size={16} aria-hidden="true" />
          {submitting ? "Enviando…" : "Enviar link de recuperação"}
        </button>

        <Link to="/login" className="auth-link">
          <ArrowLeft size={13} aria-hidden="true" />
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
