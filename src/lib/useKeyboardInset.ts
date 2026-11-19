import { useEffect, useState } from "react";

/**
 * How much of the screen's bottom the on-screen keyboard covers. Phones don't resize the page
 * for it, so anything pinned to the bottom (a sheet's footer, the Inbox composer) lifts itself
 * by this much.
 */
export function useKeyboardInset(on: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!on || !viewport) return;
    const update = () =>
      setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [on]);
  return inset;
}
