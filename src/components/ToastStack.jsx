import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => dismiss(toast.id)}
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
