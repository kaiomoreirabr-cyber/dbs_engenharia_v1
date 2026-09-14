import { useEffect, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";

// ALTERAÇÃO: arquivo novo. Sem isso, trocar de aba com o React Router troca
// o conteúdo instantaneamente (a tela "pisca" e pula pro topo sem aviso).
// Este componente guarda a página anterior em tela por um instante enquanto
// a nova entra com fade + leve deslocamento, dando a sensação de app nativo
// pedida ("navegar melhor entre uma página e outra").
//
// Não usa nenhuma biblioteca de animação extra (framer-motion etc.) — só
// CSS + a troca de uma classe, para manter o app leve no celular.
export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [displayed, setDisplayed] = useState({ key: location.pathname, node: outlet });
  const [phase, setPhase] = useState("enter"); // "enter" | "leave"
  const containerRef = useRef(null);

  useEffect(() => {
    if (location.pathname === displayed.key) {
      // Mesma rota (ex.: troca de obra dentro da página) — sem transição,
      // só atualiza o conteúdo direto.
      setDisplayed({ key: location.pathname, node: outlet });
      return;
    }

    // Rota mudou: acompanha a saída, troca o conteúdo, entra em seguida.
    setPhase("leave");
    const timeout = setTimeout(() => {
      setDisplayed({ key: location.pathname, node: outlet });
      setPhase("enter");
      // Sobe a rolagem para o topo da nova página, como um app faria.
      containerRef.current?.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 140);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div ref={containerRef} className={`page-transition is-${phase}`}>
      {displayed.node}
    </div>
  );
}
