import { useState, useEffect } from 'react';

export function useAnimatedNumber(target: number, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const startVal = 0;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.floor(startVal + (target - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return value;
}
