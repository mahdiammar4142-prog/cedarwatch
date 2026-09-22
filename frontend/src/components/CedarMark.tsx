export function CedarMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" fill="#d4a017" r="22" />
      <path
        d="M24 8 16 18h5l-8 8h6l-7 8h26l-7-8h6l-8-8h5Z"
        fill="#10261a"
      />
      <rect fill="#10261a" height="8" rx="1" width="4" x="22" y="32" />
    </svg>
  );
}
