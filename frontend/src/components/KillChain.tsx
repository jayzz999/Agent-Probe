import React from "react";
import { KillChainPhase } from "../types";

const PHASES: { key: KillChainPhase; label: string; icon: string }[] = [
  { key: "recon", label: "RECON", icon: "01" },
  { key: "payload", label: "PAYLOAD", icon: "02" },
  { key: "infiltration", label: "INFILTRATE", icon: "03" },
  { key: "breach_confirmed", label: "BREACH", icon: "04" },
  { key: "report", label: "REPORT", icon: "05" },
];

function phaseIndex(phase: KillChainPhase): number {
  const idx = PHASES.findIndex((p) => p.key === phase);
  return idx === -1 ? -1 : idx;
}

interface Props {
  currentPhase: KillChainPhase;
}

export default function KillChain({ currentPhase }: Props) {
  const activeIdx = phaseIndex(currentPhase);

  return (
    <div className="flex items-center gap-1 w-full">
      {PHASES.map((phase, i) => {
        const isActive = i === activeIdx;
        const isComplete = i < activeIdx;
        const isBreach = phase.key === "breach_confirmed" && isActive;

        let bg = "bg-gray-800/50 border-gray-700";
        let text = "text-gray-500";
        let dot = "bg-gray-600";

        if (isComplete) {
          bg = "bg-violet-900/30 border-violet-700/50";
          text = "text-violet-400";
          dot = "bg-violet-500";
        } else if (isActive) {
          bg = isBreach
            ? "bg-red-900/40 border-red-500/60"
            : "bg-violet-900/50 border-violet-500/60";
          text = isBreach ? "text-red-400" : "text-violet-300";
          dot = isBreach ? "bg-red-500 animate-pulse" : "bg-violet-400 animate-pulse";
        }

        return (
          <React.Fragment key={phase.key}>
            <div
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${bg} transition-all duration-500`}
            >
              <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
              <div className="min-w-0">
                <div className={`text-[10px] font-bold tracking-widest ${text}`}>
                  {phase.icon}
                </div>
                <div className={`text-xs font-semibold ${text}`}>
                  {phase.label}
                </div>
              </div>
            </div>
            {i < PHASES.length - 1 && (
              <div
                className={`w-4 h-[2px] shrink-0 ${
                  i < activeIdx ? "bg-violet-500" : "bg-gray-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
