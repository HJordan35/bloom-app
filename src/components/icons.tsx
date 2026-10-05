import type { SVGProps } from "react";

// Thin-line icons, 24px grid, drawn with currentColor.
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function CupIcon() {
  return (
    <Icon>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3.5c-.6.8-.6 1.7 0 2.5M11.5 3.5c-.6.8-.6 1.7 0 2.5" />
    </Icon>
  );
}

export function LibraryIcon() {
  return (
    <Icon>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon width="18" height="18">
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function BrosIcon() {
  return (
    <Icon>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
      <path d="M15.5 4.9a3.25 3.25 0 0 1 0 6.2M17.5 14.8c1.8.6 3.1 2.2 3.5 4.7" />
    </Icon>
  );
}
