import { useEffect, useRef, useState } from "react";

/**
 * Observes an element and flips `inView` once it nears the viewport.
 * Used to defer heavy dashboard API calls until the section is visible.
 */
export function useInView<T extends Element = HTMLDivElement>(options?: {
  rootMargin?: string;
  /** Disconnect after first intersect (default true). */
  once?: boolean;
}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once !== false;
  const rootMargin = options?.rootMargin ?? "240px 0px";

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        if (once) observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, once, rootMargin]);

  return { ref, inView };
}
