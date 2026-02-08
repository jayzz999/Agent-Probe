import React from "react";
import { KillChainPhase } from "../types";

interface AgentNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  phases: KillChainPhase[];
}

const AGENTS: AgentNode[] = [
  {
    id: "strategist",
    label: "STRATEGIST",
    phases: ["recon"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: "infiltrator",
    label: "INFILTRATOR",
    phases: ["payload", "infiltration", "breach_confirmed"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "target",
    label: "TARGET",
    phases: ["infiltration", "breach_confirmed"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "auditor",
    label: "AUDITOR",
    phases: ["report"],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

interface Props {
  currentPhase: KillChainPhase;
  breachDetected: boolean;
}

export default function AgentFlow({ currentPhase, breachDetected }: Props) {
  const isIdle = currentPhase === "idle";

  const getNodeState = (agent: AgentNode) => {
    if (isIdle) return "idle";
    const phaseOrder: KillChainPhase[] = ["recon", "payload", "infiltration", "breach_confirmed", "report"];
    const currentIdx = phaseOrder.indexOf(currentPhase);
    const agentMaxPhaseIdx = Math.max(...agent.phases.map((p) => phaseOrder.indexOf(p)));
    const agentMinPhaseIdx = Math.min(...agent.phases.map((p) => phaseOrder.indexOf(p)));

    if (agent.phases.includes(currentPhase)) return "active";
    if (agentMaxPhaseIdx < currentIdx) return "done";
    if (agentMinPhaseIdx > currentIdx) return "pending";
    return "pending";
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl px-6 py-3">
      <div className="flex items-center justify-between">
        {AGENTS.map((agent, i) => {
          const state = getNodeState(agent);
          const isBreach = breachDetected && agent.id === "target";

          let nodeClasses = "border-gray-700 bg-gray-800/50 text-gray-600";
          let labelClasses = "text-gray-600";
          let lineClasses = "bg-gray-700";

          if (state === "active") {
            nodeClasses = isBreach
              ? "border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              : "border-violet-500 bg-violet-500/20 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]";
            labelClasses = isBreach ? "text-red-400" : "text-violet-300";
          } else if (state === "done") {
            nodeClasses = "border-violet-600/50 bg-violet-500/10 text-violet-500";
            labelClasses = "text-violet-500/70";
            lineClasses = "bg-violet-500/50";
          }

          return (
            <React.Fragment key={agent.id}>
              <div className="flex flex-col items-center gap-1">
                {/* Node circle */}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${nodeClasses} ${
                    state === "active" ? "animate-pulse" : ""
                  }`}
                >
                  {state === "done" ? (
                    <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    agent.icon
                  )}
                </div>
                {/* Label */}
                <span className={`text-[10px] font-bold tracking-wider ${labelClasses}`}>
                  {agent.label}
                </span>
              </div>

              {/* Connector line */}
              {i < AGENTS.length - 1 && (
                <div className="flex-1 flex items-center px-2 -mt-4">
                  <div className={`h-[2px] w-full rounded transition-all duration-500 ${lineClasses}`}>
                    {/* Animated flow indicator */}
                    {state === "active" && (
                      <div className="h-full w-6 bg-violet-400 rounded animate-[flow_1s_linear_infinite]" />
                    )}
                  </div>
                  {/* Bidirectional arrows for Infiltrator↔Target */}
                  {i === 1 && !isIdle && (currentPhase === "infiltration" || currentPhase === "breach_confirmed") && (
                    <div className="absolute text-violet-400 text-[10px] font-bold -mt-5">⟷</div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
