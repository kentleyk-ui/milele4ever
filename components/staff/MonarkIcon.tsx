import React from "react";

type MonarkIconProps = {
  size?: number;
  className?: string;
};

export default function MonarkIcon({ size = 20, className }: MonarkIconProps) {
  const uid = `monark-metal-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f8fafc" />
          <stop offset="0.2" stopColor="#dbe4ef" />
          <stop offset="0.45" stopColor="#8ea0b5" />
          <stop offset="0.62" stopColor="#c9d4e2" />
          <stop offset="0.82" stopColor="#6d8097" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(7 6) rotate(35) scale(12)">
          <stop stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="12" cy="12" r="10" fill={`url(#${uid}-metal)`} />
      <circle cx="12" cy="12" r="9.25" stroke="#0f172a" strokeOpacity="0.35" />
      <circle cx="12" cy="12" r="8.6" fill={`url(#${uid}-glow)`} />

      <path
        d="M7.1 16.6V7.4h1.95l2.95 4.35 2.95-4.35h1.95v9.2h-1.95v-5.8l-2.45 3.65h-1l-2.45-3.65v5.8H7.1Z"
        fill="#0b1220"
        fillOpacity="0.9"
      />
      <path
        d="M6.8 6.8 17.2 17.2"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
