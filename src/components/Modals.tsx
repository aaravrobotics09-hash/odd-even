import React from 'react';
import { DifficultyLevel, GameSettings } from '../types/game';
import { GESTURE_DESCRIPTIONS } from '../utils/gestureRecognizer';
import HandIcon from './HandIcon';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1930] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 id="howto-title" className="font-display text-3xl font-bold tracking-wide text-white">
            How to Play Odd Even Hand Cricket
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-700 bg-slate-800 text-sm font-bold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
            aria-label="Close How to Play"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
              1
            </span>
            <div>
              <h3 className="font-bold text-white">The Odd-Even Toss</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                Choose <strong>ODD</strong> or <strong>EVEN</strong>. Show a gesture (1–9) while
                Cricko-Bot locks its hidden number. Both reveal simultaneously—if the sum matches
                your choice, you win the toss and choose to <strong>BAT</strong> or{' '}
                <strong>BOWL</strong>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
              2
            </span>
            <div>
              <h3 className="font-bold text-white">Batting &amp; Bowling</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                Each delivery, both sides reveal 1–9 at the same time.{' '}
                <strong>Different numbers</strong> add the batter&apos;s number to their score.{' '}
                <strong>Same number = OUT!</strong> That ends the innings immediately.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
              3
            </span>
            <div>
              <h3 className="font-bold text-white">Second Innings Chase</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                After the first innings, roles switch. The chasing side needs{' '}
                <strong>1st Innings Score + 1</strong> to win. Getting out below the target loses;
                finishing on the exact same score ends in a <strong>MATCH TIED!</strong>
              </p>
            </div>
          </div>
        </div>

        <h3 className="mt-6 mb-3 font-display text-xl font-bold tracking-wide text-amber-400">
          Custom Hand Gesture Guide (Numbers 1–9)
        </h3>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div
              key={num}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3"
            >
              <HandIcon number={num} size={46} className="shrink-0" />
              <div className="min-w-0">
                <div className="font-mono text-sm font-bold text-emerald-400">Number {num}</div>
                <p className="text-xs leading-snug text-slate-300">{GESTURE_DESCRIPTIONS[num]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] whitespace-nowrap rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onRestartMatch: () => void;
  onReturnHome: () => void;
  inMatch: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRestartMatch,
  onReturnHome,
  inMatch,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1930] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 id="settings-title" className="font-display text-3xl font-bold tracking-wide text-white">
            Match Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-700 bg-slate-800 text-sm font-bold text-slate-200 transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
            aria-label="Close Settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <div>
              <span className="block text-sm font-bold text-white">Sound Effects</span>
              <span className="text-xs text-slate-400">Bat hits, wickets, toss &amp; victory SFX</span>
            </div>
            <input
              type="checkbox"
              checked={settings.sfxEnabled}
              onChange={(e) => onUpdateSettings({ sfxEnabled: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <div>
              <span className="block text-sm font-bold text-white">Voice Commentary</span>
              <span className="text-xs text-slate-400">Spoken match calls and wicket announcements</span>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => onUpdateSettings({ voiceEnabled: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <div>
              <span className="block text-sm font-bold text-white">Webcam Hand Recognition</span>
              <span className="text-xs text-slate-400">Turn off to use the on-screen 1–9 pad</span>
            </div>
            <input
              type="checkbox"
              checked={settings.webcamEnabled}
              onChange={(e) => onUpdateSettings({ webcamEnabled: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
            <span className="block text-sm font-bold text-white">Bot Difficulty</span>
            <span className="mb-3 block text-xs text-slate-400">
              Adjusts Bot strategy fairly from completed balls only
            </span>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateSettings({ difficulty: lvl })}
                  className={`min-h-[40px] rounded-lg border text-xs font-bold uppercase tracking-wider transition ${
                    settings.difficulty === lvl
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {inMatch && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onRestartMatch();
                  onClose();
                }}
                className="min-h-[44px] whitespace-nowrap rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
              >
                Restart Match
              </button>
              <button
                type="button"
                onClick={() => {
                  onReturnHome();
                  onClose();
                }}
                className="min-h-[44px] whitespace-nowrap rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
              >
                Main Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
