import { useEffect, useState } from "react";

type ElementDimension = {
  width: number;
  height: number;
};

/**
 * Observes the size of the first matching element for the provided selector(s).
 */
export function useElementDimension(selectors: string | string[]) {
  const [size, setSize] = useState<ElementDimension | null>(null);

  useEffect(() => {
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    const findElement = () => {
      for (const selector of selectorList) {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          return el;
        }
      }
      return null;
    };

    const updateSize = () => {
      const el = findElement();
      if (!el) {
        setSize(null);
        return;
      }
      const { width, height } = el.getBoundingClientRect();
      setSize({ width, height });
    };

    const target = findElement();
    if (!target) {
      setSize(null);
      return;
    }

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(target);
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [selectors]);

  return size;
}
