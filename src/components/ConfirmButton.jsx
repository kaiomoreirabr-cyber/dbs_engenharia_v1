import { useEffect, useRef, useState } from "react";

/**
 * Botão de exclusão com confirmação em dois passos: o primeiro clique pede
 * confirmação, o segundo executa a ação. Cancela a confirmação automaticamente
 * após alguns segundos ou ao clicar fora.
 */
export default function ConfirmButton({ label, confirmLabel = "Confirmar?", onConfirm, ariaLabel }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 3500);
      return;
    }

    clearTimeout(timeoutRef.current);
    setBusy(true);
    await onConfirm();
    setBusy(false);
    setConfirming(false);
  };

  return (
    <button
      type="button"
      className={`mini-action${confirming ? " is-confirm" : ""}`}
      onClick={handleClick}
      disabled={busy}
      aria-label={ariaLabel}
    >
      {busy ? "Excluindo…" : confirming ? confirmLabel : label}
    </button>
  );
}
