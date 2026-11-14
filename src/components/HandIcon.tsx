import React from 'react';

interface HandIconProps {
  number: number;
  size?: number;
  className?: string;
}

export default function HandIcon({ number, size = 54, className = '' }: HandIconProps) {
  const renderGesture = () => {
    switch (number) {
      case 1:
        return (
          <>
            <rect x="30" y="50" width="38" height="34" rx="12" fill="#e2e8f0" />
            <rect x="31" y="14" width="9" height="40" rx="4.5" fill="#10b981" />
            <rect x="42" y="42" width="8" height="16" rx="4" fill="#64748b" />
            <rect x="52" y="43" width="8" height="15" rx="4" fill="#64748b" />
            <rect x="61" y="45" width="7" height="13" rx="3.5" fill="#64748b" />
            <rect
              x="27"
              y="57"
              width="24"
              height="9"
              rx="4.5"
              transform="rotate(-10 27 57)"
              fill="#64748b"
            />
          </>
        );
      case 2:
        return (
          <>
            <rect x="30" y="50" width="38" height="34" rx="12" fill="#e2e8f0" />
            <rect x="31" y="14" width="9" height="40" rx="4.5" fill="#10b981" />
            <rect x="43" y="11" width="9" height="43" rx="4.5" fill="#10b981" />
            <rect x="54" y="43" width="8" height="15" rx="4" fill="#64748b" />
            <rect x="63" y="45" width="7" height="13" rx="3.5" fill="#64748b" />
            <rect
              x="27"
              y="57"
              width="24"
              height="9"
              rx="4.5"
              transform="rotate(-10 27 57)"
              fill="#64748b"
            />
          </>
        );
      case 3:
        return (
          <>
            <rect x="29" y="50" width="40" height="34" rx="12" fill="#e2e8f0" />
            <rect x="30" y="15" width="8.5" height="39" rx="4.2" fill="#10b981" />
            <rect x="41" y="11" width="8.5" height="43" rx="4.2" fill="#10b981" />
            <rect x="52" y="15" width="8.5" height="39" rx="4.2" fill="#10b981" />
            <rect x="62" y="45" width="7" height="13" rx="3.5" fill="#64748b" />
            <rect
              x="26"
              y="57"
              width="25"
              height="9"
              rx="4.5"
              transform="rotate(-10 26 57)"
              fill="#64748b"
            />
          </>
        );
      case 4:
        return (
          <>
            <rect x="29" y="50" width="41" height="34" rx="12" fill="#e2e8f0" />
            <rect x="30" y="16" width="8.5" height="38" rx="4.2" fill="#10b981" />
            <rect x="40.5" y="10" width="8.5" height="44" rx="4.2" fill="#10b981" />
            <rect x="51" y="14" width="8.5" height="40" rx="4.2" fill="#10b981" />
            <rect x="61.5" y="22" width="8" height="32" rx="4" fill="#10b981" />
            <rect
              x="26"
              y="57"
              width="25"
              height="9"
              rx="4.5"
              transform="rotate(-10 26 57)"
              fill="#64748b"
            />
          </>
        );
      case 5:
        return (
          <>
            <rect x="32" y="50" width="40" height="34" rx="12" fill="#e2e8f0" />
            <rect
              x="13"
              y="46"
              width="23"
              height="9.5"
              rx="4.7"
              transform="rotate(-38 24 52)"
              fill="#10b981"
            />
            <rect x="33" y="16" width="8.5" height="38" rx="4.2" fill="#10b981" />
            <rect x="43.5" y="10" width="8.5" height="44" rx="4.2" fill="#10b981" />
            <rect x="54" y="14" width="8.5" height="40" rx="4.2" fill="#10b981" />
            <rect x="64" y="22" width="8" height="32" rx="4" fill="#10b981" />
          </>
        );
      case 6:
        return (
          <>
            <rect x="34" y="44" width="38" height="36" rx="11" fill="#e2e8f0" />
            <rect x="34" y="12" width="12" height="36" rx="6" fill="#10b981" />
            <line x1="48" y1="53" x2="71" y2="53" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="62" x2="71" y2="62" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="71" x2="71" y2="71" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M22 30 L22 14 M17 19 L22 14 L27 19"
              stroke="#fbbf24"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      case 7:
        return (
          <>
            <rect x="34" y="20" width="38" height="36" rx="11" fill="#e2e8f0" />
            <rect x="34" y="52" width="12" height="36" rx="6" fill="#10b981" />
            <line x1="48" y1="29" x2="71" y2="29" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="38" x2="71" y2="38" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="48" y1="47" x2="71" y2="47" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M22 70 L22 86 M17 81 L22 86 L27 81"
              stroke="#fbbf24"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      case 8:
        return (
          <>
            <rect x="34" y="48" width="36" height="34" rx="12" fill="#e2e8f0" />
            <rect
              x="13"
              y="47"
              width="25"
              height="9.5"
              rx="4.7"
              transform="rotate(-32 25 53)"
              fill="#10b981"
            />
            <rect x="36" y="13" width="9.5" height="39" rx="4.7" fill="#10b981" />
            <rect x="48" y="42" width="7.5" height="14" rx="3.7" fill="#64748b" />
            <rect x="57" y="44" width="7.5" height="13" rx="3.7" fill="#64748b" />
            <rect x="65" y="46" width="6.5" height="11" rx="3.2" fill="#64748b" />
          </>
        );
      case 9:
        return (
          <>
            <rect x="34" y="48" width="37" height="34" rx="12" fill="#e2e8f0" />
            <rect
              x="13"
              y="47"
              width="25"
              height="9.5"
              rx="4.7"
              transform="rotate(-32 25 53)"
              fill="#10b981"
            />
            <rect x="37" y="13" width="9" height="39" rx="4.5" fill="#10b981" />
            <rect x="46.5" y="11" width="9" height="41" rx="4.5" fill="#10b981" />
            <circle cx="46.2" cy="19" r="5.5" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
            <rect x="57" y="44" width="7.5" height="13" rx="3.7" fill="#64748b" />
            <rect x="65" y="46" width="6.5" height="11" rx="3.2" fill="#64748b" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label={`Gesture ${number}`}
    >
      {renderGesture()}
    </svg>
  );
}
