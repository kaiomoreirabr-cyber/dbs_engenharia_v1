import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const useMockData = String(import.meta.env.VITE_USE_MOCK_DATA ?? "false").toLowerCase() === "true";

export const isSupabaseConfigured = !useMockData && Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && !useMockData) {
  // Não lança erro para permitir que a UI mostre um aviso amigável em vez de tela branca.
  // eslint-disable-next-line no-console
  console.error(
    "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
