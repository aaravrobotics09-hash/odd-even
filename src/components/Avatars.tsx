import React from 'react';
import { BotExpression, DifficultyLevel } from '../types/game';

interface PlayerAvatarProps {
  isBatting?: boolean | null;
  statusText?: string;
}

export function PlayerAvatar({ isBatting = null, statusText }: PlayerAvatarProps) {
  const roleLabel =
    isBatting === true ? 'BATTING' : isBatting === false ? 'BOWLING' : 'CHALLENGER';

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border bg-[#0d1930]/90 p-4 transition-colors ${
        isBatting === true
          ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.14)]'
          : 'border-slate-700/70'
      }`}
    >
      <div className="h-16 w-16 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          <path d="M22 48 C22 22, 78 22, 78 48 L78 58 L22 58 Z" fill="#0ea5e9" />
          <path d="M20 46 L82 46 L86 52 L20 52 Z" fill="#0284c7" />
          <circle cx="50" cy="58" r="21" fill="#f3c6a5" />
          <path
            d="M28 58 L72 58 M31 66 L69 66 M36 74 L64 74"
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="42" cy="54" r="2.6" fill="#0f172a" />
          <circle cx="58" cy="54" r="2.6" fill="#0f172a" />
          <path d="M24 98 C24 80, 76 80, 76 98 Z" fill="#0284c7" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-wide text-white">YOU</span>
          <span className="text-xs font-semibold text-emerald-400">· {roleLabel}</span>
        </div>
        {statusText && (
          <p className="mt-0.5 truncate text-sm text-slate-300 tabular-nums">{statusText}</p>
        )}
      </div>
    </div>
  );
}

interface BotAvatarProps {
  expression?: BotExpression;
  isBatting?: boolean | null;
  quip?: string;
  difficulty?: DifficultyLevel;
}

export function BotAvatar({
  expression = 'neutral',
  isBatting = null,
  quip,
  difficulty = 'medium',
}: BotAvatarProps) {
  const roleLabel =
    isBatting === true
      ? 'BATTING'
      : isBatting === false
      ? 'BOWLING'
      : `${difficulty.toUpperCase()} AI`;

  const renderFace = () => {
    switch (expression) {
      case 'happy':
        return (
          <>
            <path
              d="M35 50 Q40 43 45 50"
              stroke="#34d399"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M55 50 Q60 43 65 50"
              stroke="#34d399"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M40 62 Q50 71 60 62"
              stroke="#34d399"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'surprised':
        return (
          <>
            <circle cx="40" cy="48" r="5" fill="#fbbf24" />
            <circle cx="60" cy="48" r="5" fill="#fbbf24" />
            <circle cx="50" cy="64" r="4.5" stroke="#fbbf24" strokeWidth="3" fill="none" />
          </>
        );
      case 'confident':
        return (
          <>
            <path d="M34 45 L46 49" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M66 45 L54 49" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="40" cy="51" r="2.5" fill="#38bdf8" />
            <circle cx="60" cy="51" r="2.5" fill="#38bdf8" />
            <path
              d="M41 63 Q52 67 61 60"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'disappointed':
        return (
          <>
            <path
              d="M35 48 L45 52 M45 48 L35 52"
              stroke="#f87171"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M55 48 L65 52 M65 48 L55 52"
              stroke="#f87171"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M40 67 Q50 59 60 67"
              stroke="#f87171"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
      case 'thinking':
        return (
          <>
            <circle cx="40" cy="49" r="3.2" fill="#a78bfa" />
            <circle cx="60" cy="49" r="3.2" fill="#a78bfa" />
            <line
              x1="42"
              y1="63"
              x2="58"
              y2="63"
              stroke="#a78bfa"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        );
      default:
        return (
          <>
            <circle cx="40" cy="49" r="3.5" fill="#38bdf8" />
            <circle cx="60" cy="49" r="3.5" fill="#38bdf8" />
            <path
              d="M42 63 Q50 67 58 63"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </>
        );
    }
  };

  return (
    <div
      className={`rounded-xl border bg-[#0d1930]/90 p-4 transition-colors ${
        isBatting === true
          ? 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.14)]'
          : 'border-slate-700/70'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <line x1="50" y1="8" x2="50" y2="20" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="50" cy="7" r="4" fill="#fbbf24" />
            <path d="M24 34 C24 18, 76 18, 76 34 Z" fill="#f59e0b" />
            <path d="M20 33 L80 33 L76 38 L24 38 Z" fill="#d97706" />
            <rect
              x="24"
              y="34"
              width="52"
              height="42"
              rx="12"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2.5"
            />
            <rect x="29" y="39" width="42" height="31" rx="8" fill="#090f1d" />
            {renderFace()}
            <path d="M24 98 C24 80, 76 80, 76 98 Z" fill="#d97706" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-wide text-white">
              CRICKO-BOT
            </span>
            <span className="text-xs font-semibold text-amber-400">· {roleLabel}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Mood: <span className="capitalize text-slate-200">{expression}</span>
          </p>
        </div>
      </div>
      {quip && (
        <div className="mt-3 border-t border-slate-700/60 pt-2.5 text-sm leading-snug text-slate-200">
          “{quip}”
        </div>
      )}
    </div>
  );
}
