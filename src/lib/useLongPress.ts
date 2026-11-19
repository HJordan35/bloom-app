import { type MouseEvent, type PointerEvent, useRef } from "react";

const HOLD_MS = 450;
const SLOP_PX = 10;

/**
 * Handlers that call `onLong` after a press held still for a moment, or on right-click.
 * The click that ends a long press is swallowed, so a link inside doesn't open as well.
 * Pass nothing to get no handlers.
 */
export function useLongPress(onLong?: () => void) {
  const timer = useRef(0);
  const start = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  if (!onLong) return {};

  const cancel = () => window.clearTimeout(timer.current);
  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return;
      fired.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        navigator.vibrate?.(10);
        onLong();
      }, HOLD_MS);
    },
    // Scrolling the thread isn't a press
    onPointerMove: (event: PointerEvent) => {
      const { x, y } = start.current;
      if (Math.hypot(event.clientX - x, event.clientY - y) > SLOP_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    // Right-click, and Android's own long-press (opening twice is harmless)
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      cancel();
      onLong();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
