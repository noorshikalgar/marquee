import { motion } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    return () => {
      scrollPositions.set(location.key, window.scrollY);
    };
  }, [location.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onAnimationComplete={() => {
        const saved = navigationType === "POP" ? scrollPositions.get(location.key) : undefined;
        window.scrollTo(0, saved ?? 0);
      }}
    >
      {children}
    </motion.div>
  );
}
