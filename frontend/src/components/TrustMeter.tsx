import React from "react";

interface Props {
  score: number;
  delta?: number;
  breachDetected?: boolean;
}

export default function TrustMeter({ score, delta, breachDetected }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score));

  let color = "from-emerald-500 to-emerald-400";
  let label = "SECURE";
  let ringColor = "ring-emerald-500/30";
  let textColor = "text-emerald-400";

  if (clampedScore <= 20) {
    color = "from-red-600 to-red-500";
    label = "CRITICAL";
    ringColor = "ring-red-500/50";
    textColor = "text-red-400";
  } else if (clampedScore <= 40) {
    color = "from-red-500 to-orange-500";
    label = "COMPROMISED";
    ringColor = "ring-red-500/30";
    textColor = "text-red-400";
  } else if (clampedScore <= 60) {
    color = "from-orange-500 to-yellow-500";
    label = "VULNERABLE";
    ringColor = "ring-orange-500/30";
    textColor = "text-orange-400";
  } else if (clampedScore <= 80) {
    color = "from-yellow-500 to-emerald-500";
    label = "GUARDED";
    ringColor = "ring-yellow-500/30";
    textColor = "text-yellow-400";
  }

  // Override for breach
  if (breachDetected) {
    label = "BREACHED";
    ringColor = "ring-red-500/80";
    textColor = "text-red-500";
    color = "from-red-700 to-red-500";
  }

  return (
    <div
      className={`bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 ring-2 ${ringColor} transition-all duration-700 ${
        breachDetected ? "animate-breach-pulse" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-widest text-gray-400">
          TRUST INTEGRITY
        </span>
        <span className={`text-xs font-bold tracking-wider ${textColor} ${breachDetected ? "animate-pulse" : ""}`}>
          {label}
        </span>
      </div>

      {/* Score display */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-black tabular-nums ${textColor}`}>
          {Math.round(clampedScore)}
        </span>
        <span className="text-gray-500 text-sm mb-1">/ 100</span>
        {delta !== undefined && delta !== 0 && (
          <span
            className={`text-sm font-bold mb-1 ${
              delta > 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      {/* Breach warning bar */}
      {breachDetected && (
        <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-[10px] font-bold text-red-400 tracking-wider">
            SECRET COMPROMISED
          </span>
        </div>
      )}
    </div>
  );
}
