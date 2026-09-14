import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const AuthContext = createContext(null);

// ALTERAÇÃO: arquivo novo — antes o app não tinha login nenhum (a chave anon
// dava acesso direto aos dados pra quem tivesse o link). Esse contexto
// controla a sessão do Supabase Auth: quem está logado, o formulário de
// entrar, o de "esqueci minha senha" e o fluxo de definir uma nova senha
// quando a pessoa chega pelo link do e-mail de recuperação.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // ALTERAÇÃO: fica true quando a pessoa chega pelo link de recuperação de
  // senha do e-mail — o Supabase cria uma sessão temporária nesse momento,
  // então "session" já vem preenchida, mas ainda NÃO deve liberar o app:
  // precisa antes forçar a tela de "defina sua nova senha" (ver App.jsx).
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  // ALTERAÇÃO: redirectTo aponta para "/redefinir-senha" no MESMO domínio
  // que está rodando o app (funciona em localhost e em produção sem trocar
  // nada no código). Só o link chega no e-mail; quem preenche a nova senha
  // é a tela ResetPasswordPage.jsx.
  const sendPasswordReset = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error };
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setIsPasswordRecovery(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    authLoading,
    isPasswordRecovery,
    signIn,
    sendPasswordReset,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
