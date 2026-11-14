import React from 'react';

interface StadiumBackgroundProps {
  highlight?: 'neutral' | 'wicket' | 'gold';
}

export default function StadiumBackground({ highlight = 'neutral' }: StadiumBackgroundProps) {
  const glowColor =
    highlight === 'wicket'
      ? 'from-red-500/20 via-red-900/10 to-transparent'
      : highlight === 'gold'
      ? 'from-amber-400/20 via-amber-700/10 to-transparent'
      : 'from-emerald-500/15 via-sky-900/10 to-transparent';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#060d1f]"
      aria-hidden="true"
    >
      {/* Night Stadium Sky Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, #122952 0%, #081228 55%, #040814 100%)',
        }}
      />

      {/* Dynamic Event Atmosphere Glow */}
      <div
        className={`absolute inset-0 bg-radial transition-opacity duration-500 bg-gradient-to-b ${glowColor}`}
      />

      {/* Left Floodlight Tower & Beam */}
      <div className="absolute left-[4%] top-[4%] z-10 w-16 max-sm:left-[2%] max-sm:w-12">
        <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-600 bg-slate-800 p-1.5 shadow-lg">
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
        </div>
        <div
          className="animate-beam-left absolute -left-2 top-7 h-[520px] w-[420px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(186, 230, 253, 0.16), rgba(56, 189, 248, 0.03) 60%, transparent)',
            clipPath: 'polygon(8% 0, 24% 0, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* Right Floodlight Tower & Beam */}
      <div className="absolute right-[4%] top-[4%] z-10 w-16 max-sm:right-[2%] max-sm:w-12">
        <div className="grid grid-cols-2 gap-1 rounded-md border border-slate-600 bg-slate-800 p-1.5 shadow-lg">
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
          <span className="h-2.5 rounded-sm bg-sky-100 shadow-[0_0_12px_#7dd3fc]" />
        </div>
        <div
          className="animate-beam-right absolute -right-2 top-7 h-[520px] w-[420px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(186, 230, 253, 0.16), rgba(56, 189, 248, 0.03) 60%, transparent)',
            clipPath: 'polygon(76% 0, 92% 0, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* Distant Stadium Scoreboard Architecture */}
      <div className="absolute left-1/2 top-20 hidden -translate-x-1/2 items-center gap-3 rounded border border-slate-700/60 bg-slate-900/75 px-4 py-1 text-[11px] font-semibold tracking-[0.22em] text-slate-400/70 sm:flex">
        <span>STADIUM OVAL</span>
        <span aria-hidden="true">·</span>
        <span>FLOODLIT ARENA</span>
      </div>

      {/* Stadium Bowl Crowd Tier */}
      <div
        className="absolute bottom-[22%] -left-[10%] -right-[10%] h-44 rounded-t-[50%] border-t-2 border-sky-400/15"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(30, 41, 59, 0.65), transparent 72%)',
        }}
      />

      {/* Outfield & Central Cricket Pitch */}
      <div
        className="absolute -bottom-[14%] left-1/2 flex h-[450px] w-[min(1150px,125vw)] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white/20"
        style={{
          transform: 'translateX(-50%) perspective(650px) rotateX(58deg)',
          background: 'radial-gradient(circle, #0f5132 0%, #064e3b 55%, #022c22 100%)',
        }}
      >
        <div className="absolute inset-5 rounded-full border-2 border-dashed border-amber-400/45" />
        <div
          className="relative h-64 w-24 rounded-md border border-white/25"
          style={{
            background: 'linear-gradient(180deg, #b0895c 0%, #c49b6c 50%, #a47e53 100%)',
          }}
        >
          {/* Crease Lines & Mini Stumps */}
          <div className="absolute -left-3 -right-3 top-6 h-0.5 bg-white/75" />
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 gap-0.5">
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
          </div>
          <div className="absolute -left-3 -right-3 bottom-6 h-0.5 bg-white/75" />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
            <span className="h-3.5 w-0.5 rounded bg-amber-200" />
          </div>
        </div>
      </div>

      {/* Subtle Floating Stadium Sparks */}
      <div className="absolute inset-0">
        <span className="animate-stadium-drift absolute left-[16%] top-[78%] h-1 w-1 rounded-full bg-amber-300/50" />
        <span
          className="animate-stadium-drift absolute left-[34%] top-[84%] h-1 w-1 rounded-full bg-amber-300/40"
          style={{ animationDelay: '2s' }}
        />
        <span
          className="animate-stadium-drift absolute left-[64%] top-[82%] h-1 w-1 rounded-full bg-sky-300/45"
          style={{ animationDelay: '4s' }}
        />
        <span
          className="animate-stadium-drift absolute left-[84%] top-[76%] h-1 w-1 rounded-full bg-amber-300/45"
          style={{ animationDelay: '1.2s' }}
        />
      </div>
    </div>
  );
}
