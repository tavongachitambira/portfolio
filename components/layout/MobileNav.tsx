"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AssistTriggers } from "@/components/assist/AssistTriggers";
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
          // Was: "clay clay-sm fixed top-3 right-4 left-4 z-50 flex h-11 items-center overflow-hidden px-5 lg:hidden"
          // Search and Ask now sit at the right end of the pill; pr-1 keeps the last round button concentric with the pill's end.
          className="clay clay-sm fixed top-3 right-4 left-4 z-50 flex h-11 items-center gap-2 overflow-hidden pr-1 pl-5 lg:hidden"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              // min-w-0 + truncate: on a 320px phone the label gives way to the buttons instead of pushing them off
              className="min-w-0 truncate text-[11px] font-bold uppercase tracking-widest text-primary"
            >
              {label}
            </motion.span>
          </AnimatePresence>

          {/* The pill only exists once the hero blocks have scrolled away, so Search/Ask appear then too */}
          <AssistTriggers variant="icons" className="ml-auto shrink-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
