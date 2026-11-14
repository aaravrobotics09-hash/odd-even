import React from 'react';
import { BallRecord, Participant } from '../types/game';

interface ScoreboardProps {
  playerScore: number;
  playerWickets: number;
  botScore: number;
  botWickets: number;
  innings: 1 | 2;
  target: number | null;
  ballsPlayed: number;
  lastBall: { player: number; bot: number } | null;
  lastResult: string;
  battingSide: Participant | null;
  ballHistory: BallRecord[];
  scorePulseKey: number;
}

export default function Scoreboard({
  playerScore,
  playerWickets,
  botScore,
  botWickets,
  innings,
  target,
  ballsPlayed,
  lastBall,
  lastResult,
  battingSide,
  ballHistory,
  scorePulseKey,
}: ScoreboardProps) {
  return (
    <section
      className="relative z-10 mx-auto mt-3 w-[min(1200px,95vw)] rounded-xl border border-slate-700/80 bg-[#0b172e]/95 px-5 py-3.5 shadow-xl backdrop-blur-md"
      aria-label="Live Cricket Scoreboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Team Scores */}
        <div className="flex flex-wrap items-center gap-5">
          <div
            className={`flex items-baseline gap-2.5 rounded-lg px-3 py-1.5 ${
              battingSide === 'PLAYER' ? 'bg-emerald-500/15 ring-1 ring-emerald-500/50' : 'bg-slate-900/70'
            }`}
          >
            <span className="text-xs font-bold tracking-wider text-slate-300">PLAYER:</span>
            <span
              key={`p-${scorePulseKey}`}
              className="animate-score-pop font-mono text-xl font-bold text-white tabular-nums"
            >
              {playerScore}/{playerWickets}
            </span>
          </div>

          <div
            className={`flex items-baseline gap-2.5 rounded-lg px-3 py-1.5 ${
              battingSide === 'BOT' ? 'bg-amber-500/15 ring-1 ring-amber-500/50' : 'bg-slate-900/70'
            }`}
          >
            <span className="text-xs font-bold tracking-wider text-slate-300">BOT:</span>
            <span
              key={`b-${scorePulseKey}`}
              className="animate-score-pop font-mono text-xl font-bold text-white tabular-nums"
            >
              {botScore}/{botWickets}
            </span>
          </div>
        </div>

        {/* Innings / Target / Balls */}
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-300 tabular-nums">
          <span>
            INNINGS: <strong className="font-mono text-white">{innings}</strong>
          </span>
          {target !== null && (
            <>
              <span className="text-slate-600" aria-hidden="true">|</span>
              <span>
                TARGET: <strong className="font-mono text-amber-400">{target}</strong>
              </span>
            </>
          )}
          <span className="text-slate-600" aria-hidden="true">|</span>
          <span>
            BALLS: <strong className="font-mono text-white">{ballsPlayed}</strong>
          </span>
        </div>

        {/* Last Ball & Result */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-300">
            LAST BALL:{' '}
            <strong className="font-mono text-white tabular-nums">
              {lastBall ? `YOU: ${lastBall.player} | BOT: ${lastBall.bot}` : 'READY'}
            </strong>
          </span>
          {lastResult && (
            <span
              key={`res-${scorePulseKey}`}
              className={`animate-score-pop font-mono text-sm font-bold ${
                lastResult === 'OUT!' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              RESULT: {lastResult}
            </span>
          )}
        </div>
      </div>

      {/* Ball-by-Ball Timeline */}
      {ballHistory.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-400">THIS INNINGS:</span>
          <div className="flex flex-wrap items-center gap-1.5 font-mono tabular-nums">
            {ballHistory.slice(-12).map((b, idx) => (
              <span
                key={idx}
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 font-bold ${
                  b.isOut
                    ? 'bg-red-500/20 text-red-300'
                    : b.runs >= 6
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {b.isOut ? 'W' : b.runs}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
