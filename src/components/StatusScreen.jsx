import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="status-screen">
      <Loader2 className="spin" size={28} aria-hidden="true" />
      <p>Carregando dados da obra…</p>
    </div>
  );
}

export function ErrorScreen({ message }) {
  return (
    <div className="status-screen status-screen-error">
      <AlertTriangle size={28} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
