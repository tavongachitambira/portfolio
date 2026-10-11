"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { navLinks } from "@/lib/data/nav";

export function MobileNav({
  isMobile,
  activeSection,
}: {
  isMobile: boolean;
  activeSection: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => {
      const el = document.getElementById("profile-title");
      const footer = document.getElementById("connect");
      const footerIsVisible = Boolean(footer && footer.getBoundingClientRect().top < window.innerHeight);
      if (el) setVisible(el.getBoundingClientRect().top <= 56 && !footerIsVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const label = navLinks.find((l) => l.id === activeSection)?.label;

  return (
    <AnimatePresence>
      {isMobile && visible && label && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="clay clay-sm fixed top-3 right-4 left-4 z-50 flex h-11 items-center overflow-hidden px-5 lg:hidden"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[11px] font-bold uppercase tracking-widest text-primary"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
