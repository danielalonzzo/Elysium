import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export function IconArrowUpRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M12.05 2A9.94 9.94 0 0 0 2.1 11.95a9.8 9.8 0 0 0 1.36 4.99L2 22l5.2-1.36a9.94 9.94 0 0 0 4.85 1.24h.01A9.94 9.94 0 0 0 22 11.95 9.94 9.94 0 0 0 12.05 2Zm5.82 14.06c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.11a15.9 15.9 0 0 1-1.65-.61 12.9 12.9 0 0 1-4.94-4.37c-.35-.47-.9-1.28-.9-2.44 0-1.16.6-1.73.82-1.97.22-.24.48-.3.64-.3l.46.01c.15 0 .35-.06.54.41l.66 1.6c.05.11.09.24.02.38l-.28.44c-.13.16-.27.35-.12.6.15.24.66 1.08 1.42 1.75.97.86 1.79 1.13 2.04 1.26.25.12.4.1.54-.06l.78-.9c.18-.24.36-.2.6-.11l1.54.73c.24.11.4.17.46.27.06.1.06.58-.18 1.26Z" />
    </svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconYouTube(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSpotify(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.44a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.35.22.46.68.25 1.03Zm1.23-2.74a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.55-1.8c4.37-1.33 9.79-.68 13.5 1.6.44.27.58.85.31 1.29Zm.11-2.85C15.17 8.6 8.98 8.4 5.4 9.49a1.12 1.12 0 1 1-.65-2.15c4.11-1.25 10.95-1.01 15.27 1.55a1.12 1.12 0 1 1-1.15 1.92Z" />
    </svg>
  );
}

export function IconCards(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="11" height="15" rx="2" />
      <path d="M8 6V5a2 2 0 0 1 2.4-1.96l7 1.4A2 2 0 0 1 21 6.4l-2 12" />
    </svg>
  );
}

export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
