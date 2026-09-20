import { useEffect, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";

export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const [displayed, setDisplayed] = useState({ key: location.pathname, node: outlet });
  const [phase, setPhase] = useState("enter");
  const containerRef = useRef(null);

  useEffect(() => {
    if (location.pathname === displayed.key) {
      setDisplayed({ key: location.pathname, node: outlet });
      return;
    }

    setPhase("leave");
    const timeout = setTimeout(() => {
      setDisplayed({ key: location.pathname, node: outlet });
      setPhase("enter");
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
