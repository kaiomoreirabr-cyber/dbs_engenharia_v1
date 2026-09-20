import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

const SCROLL_PROGRESS_THRESHOLD = 0.9;

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const releaseReturnLock = useRef(null);
  const isReturningToTop = useRef(false);

  useEffect(() => {
    const handleScroll = (event) => {
      if (isReturningToTop.current) return;

      const target = event.target === document
        ? document.documentElement
        : event.target;
      const scrollTop = target === document.documentElement
        ? Math.max(window.scrollY || 0, target.scrollTop || 0)
        : target.scrollTop || 0;
      const viewportHeight = target === document.documentElement
        ? window.innerHeight
        : target.clientHeight;
      const contentHeight = target.scrollHeight;
      const scrollableDistance = Math.max(contentHeight - viewportHeight, 0);
      const scrollProgress = scrollableDistance === 0
        ? 1
        : scrollTop / scrollableDistance;

      setIsVisible(scrollProgress >= SCROLL_PROGRESS_THRESHOLD);
    };

    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
      if (releaseReturnLock.current) {
        clearTimeout(releaseReturnLock.current);
      }
    };
  }, []);

  const scrollToTop = () => {
    setIsVisible(false);
    isReturningToTop.current = true;

    if (releaseReturnLock.current) {
      clearTimeout(releaseReturnLock.current);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });

    const scrollContainers = document.querySelectorAll("main, .content, #root, body");
    scrollContainers.forEach((container) => {
      if (container.scrollTop > 0) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    releaseReturnLock.current = window.setTimeout(() => {
      isReturningToTop.current = false;
      releaseReturnLock.current = null;
    }, 900);
  };

  return (
    <button
      type="button"
      className={`back-to-top${isVisible ? " is-visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      tabIndex={isVisible ? 0 : -1}
    >
      <ArrowUp size={19} strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
