const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function HammerIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M14 6l4 4-2.5 2.5L11.5 8.5 14 6z" />
      <path d="M3 21l7-7" />
      <path d="M9 12l3 3" />
    </svg>
  );
}

export function CodeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M8 8l-4 4 4 4" />
      <path d="M16 8l4 4-4 4" />
      <path d="M13 5l-2 14" />
    </svg>
  );
}

export function DiscordIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M20.3 5.4A17.6 17.6 0 0 0 15.9 4a.07.07 0 0 0-.07.03c-.2.36-.42.82-.57 1.19a16.3 16.3 0 0 0-4.9 0A9.6 9.6 0 0 0 9.77 4 .07.07 0 0 0 9.7 4a17.6 17.6 0 0 0-4.4 1.4.06.06 0 0 0-.03.02C2.4 9.4 1.7 13.3 2 17.15a.08.08 0 0 0 .03.05 17.7 17.7 0 0 0 5.35 2.72.07.07 0 0 0 .08-.03c.4-.57.78-1.16 1.1-1.79a.07.07 0 0 0-.04-.1 11.6 11.6 0 0 1-1.68-.81.07.07 0 0 1-.01-.12l.33-.26a.07.07 0 0 1 .07 0c3.53 1.62 7.35 1.62 10.85 0a.07.07 0 0 1 .07 0l.33.26a.07.07 0 0 1 0 .12c-.53.31-1.1.58-1.69.8a.07.07 0 0 0-.04.11c.33.63.7 1.22 1.1 1.79a.07.07 0 0 0 .08.03A17.6 17.6 0 0 0 22 17.2a.07.07 0 0 0 .03-.05c.36-4.45-.6-8.3-2.7-11.72a.06.06 0 0 0-.03-.03ZM8.68 14.8c-1.06 0-1.94-.98-1.94-2.17 0-1.2.86-2.17 1.94-2.17 1.09 0 1.96.99 1.94 2.17 0 1.2-.86 2.17-1.94 2.17Zm6.65 0c-1.07 0-1.94-.98-1.94-2.17 0-1.2.86-2.17 1.94-2.17 1.09 0 1.96.99 1.94 2.17 0 1.2-.85 2.17-1.94 2.17Z" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" />
      <path d="M14 8l5 4-5 4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export const iconByName = {
  hammer: HammerIcon,
  code: CodeIcon,
};
