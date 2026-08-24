import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const saved = navigationType === "POP" ? scrollPositions.get(location.key) : undefined;
    window.scrollTo(0, saved ?? 0);

    return () => {
      scrollPositions.set(location.key, window.scrollY);
    };
  }, [location.key, navigationType]);

  return <>{children}</>;
}
