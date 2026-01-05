import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

// Get initial mobile state safely for SSR
function getInitialMobileState(): boolean | undefined {
  if (globalThis.window === undefined) return undefined;
  return globalThis.window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(getInitialMobileState);

  useEffect(() => {
    const mql = globalThis.window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, []); // Empty dependency array - only runs once on mount

  return isMobile ?? false;
}
