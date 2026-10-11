import { useEffect, useState, type RefObject } from "react";

export function useActiveSection(
  ids: readonly string[],
  containerRef: RefObject<HTMLElement | null>,
  isMobile: boolean,
) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const container = isMobile ? null : containerRef.current;
    const target: EventTarget = container ?? window;

    const onScroll = () => {
      const top = container ? container.getBoundingClientRect().top : 0;
      const height = container ? container.clientHeight : window.innerHeight;
      const activationLine = isMobile ? 56 : 64;
      const footer = document.getElementById("connect");
      if (footer && footer.getBoundingClientRect().top - top < height) {
        setActive("");
        return;
      }
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(`${id}-title`) ?? document.getElementById(id);
        if (el && el.getBoundingClientRect().top - top <= activationLine) current = id;
      }
      setActive(current);
    };

    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [ids, containerRef, isMobile]);

  return active;
}
