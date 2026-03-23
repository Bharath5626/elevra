import { useState, useEffect } from 'react';

export function useWindowWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return width;
}

/** Convenience breakpoint helpers */
export function useIsMobile(): boolean {
  return useWindowWidth() < 640;
}

export function useIsTablet(): boolean {
  const w = useWindowWidth();
  return w >= 640 && w < 1024;
}
