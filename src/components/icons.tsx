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

export function CloseIcon() {
  return (
    <Icon width="14" height="14">
      <path d="M6 6l12 12M18 6L6 18" />
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

export function HistoryIcon() {
  return (
    <Icon width="14" height="14" strokeWidth={1.5}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4v3.5H8" />
      <path d="M12 8v4l2.75 1.75" />
    </Icon>
  );
}

/** A grinder's dial: a knob with its mark, inside the arc it turns through. */
export function DialIcon() {
  return (
    <Icon width="14" height="14" strokeWidth={1.5}>
      <path d="M5.6 18.4a9 9 0 1 1 12.8 0" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M13.6 10.1l1.5-1.8" />
    </Icon>
  );
}

export function PencilIcon() {
  return (
    <Icon width="14" height="14" strokeWidth={1.5}>
      <path d="M15.5 4.5l4 4L8 20H4v-4L15.5 4.5Z" />
      <path d="M13 7l4 4" />
    </Icon>
  );
}

export function NewspaperIcon() {
  return (
    <Icon>
      <path d="M4 5h12.5v13.5A1.5 1.5 0 0 0 18 20H6a2 2 0 0 1-2-2V5Z" />
      <path d="M16.5 9H20v9.5a1.5 1.5 0 0 1-3 0" />
      <path d="M7 8.5h6.5M7 12h6.5M7 15.5h4" />
    </Icon>
  );
}

const BOOKMARK = "M6 3.5h12v17l-6-4-6 4v-17Z";

/** The Recipes tab: preferred recipes are bookmarks. */
export function RecipeIcon() {
  return (
    <Icon>
      <path d={BOOKMARK} />
    </Icon>
  );
}

/** Small, for header actions and inline markers. */
export function BookmarkIcon() {
  return (
    <Icon width="14" height="14" strokeWidth={1.5}>
      <path d={BOOKMARK} />
    </Icon>
  );
}

export function TrashIcon() {
  return (
    <Icon width="14" height="14" strokeWidth={1.5}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7" />
      <path d="M6.5 7l1 13h9l1-13M10.5 11v5M13.5 11v5" />
    </Icon>
  );
}
