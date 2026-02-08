import React, { useMemo } from "react";
import { BreachEvent } from "../types";

// ── MITRE ATT&CK-Style Taxonomy Definition ──
const TAXONOMY = [
  {
    tactic: "reconnaissance",
    label: "RECON",
    color: "from-blue-500 to-blue-600",
    techniques: [
      { id: "T1001", name: "Prompt Analysis" },
      { id: "T1002", name: "Capability Discovery" },
    ],
  },
  {
    tactic: "initial_access",
    label: "INITIAL ACCESS",
    color: "from-amber-500 to-amber-600",
    techniques: [
      { id: "T1003", name: "Authority Spoofing" },
      { id: "T1004", name: "Social Engineering" },
      { id: "T1005", name: "Credential Replay" },
    ],
  },
  {
    tactic: "execution",
    label: "EXECUTION",
    color: "from-orange-500 to-orange-600",
    techniques: [
      { id: "T1006", name: "Indirect Injection" },
      { id: "T1007", name: "Instruction Embedding" },
    ],
  },
  {
    tactic: "privilege_escalation",
    label: "PRIV ESC",
    color: "from-red-400 to-red-500",
    techniques: [
      { id: "T1008", name: "Role Escalation" },
      { id: "T1009", name: "Context Manipulation" },
    ],
  },
  {
    tactic: "credential_access",
    label: "CRED ACCESS",
    color: "from-red-500 to-red-600",
    techniques: [
      { id: "T1010", name: "Secret Extraction" },
      { id: "T1011", name: "Memory Probing" },
    ],
  },
  {
    tactic: "exfiltration",
    label: "EXFIL",
    color: "from-red-600 to-red-700",
    techniques: [
      { id: "T1012", name: "Direct Data Theft" },
      { id: "T1013", name: "Tool-Assisted Exfil" },
    ],
  },
];

interface TechniqueHit {
  confidence: number;
  turns: number[];
  breachTurn: boolean;
}

interface AttackMatrixProps {
  events: BreachEvent[];
}

export default function AttackMatrix({ events }: AttackMatrixProps) {
  // Aggregate technique hits from all infiltration events
  const techniqueHits = useMemo(() => {
    const hits: Record<string, TechniqueHit> = {};

    for (const event of events) {
      if (event.type !== "infiltration_turn") continue;
      const techniques = event.infiltrator.techniques_observed || [];
      const isBreach = event.breach_detected;

      for (const tech of techniques) {
        if (!hits[tech.id]) {
          hits[tech.id] = { confidence: 0, turns: [], breachTurn: false };
        }
        hits[tech.id].confidence = Math.max(hits[tech.id].confidence, tech.confidence);
        hits[tech.id].turns.push(event.turn);
        if (isBreach) hits[tech.id].breachTurn = true;
      }
    }

    return hits;
  }, [events]);

  const hasAnyHits = Object.keys(techniqueHits).length > 0;

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl px-4 py-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <h3 className="text-[9px] font-black tracking-[0.25em] text-gray-400">
            ATTACK SURFACE MATRIX
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[8px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-gray-700" /> UNUSED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-500/60" /> ATTEMPTED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500" /> BREACH
          </span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex gap-1">
        {TAXONOMY.map((tactic) => (
          <div key={tactic.tactic} className="flex-1 min-w-0">
            {/* Tactic header */}
            <div
              className={`text-[7px] font-black tracking-[0.15em] text-center py-1 rounded-t-md bg-gradient-to-r ${tactic.color} text-white/90 truncate px-1`}
            >
              {tactic.label}
            </div>

            {/* Technique cells */}
            <div className="flex flex-col gap-[2px] mt-[2px]">
              {tactic.techniques.map((tech) => {
                const hit = techniqueHits[tech.id];
                const isHit = !!hit;
                const isBreach = hit?.breachTurn || false;
                const confidence = hit?.confidence || 0;

                return (
                  <div
                    key={tech.id}
                    className={`group relative rounded-sm transition-all duration-700 cursor-default ${
                      isBreach
                        ? "bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        : isHit
                        ? "shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                        : "bg-gray-800/60"
                    }`}
                    style={{
                      backgroundColor: isHit && !isBreach
                        ? `rgba(245, 158, 11, ${0.15 + confidence * 0.55})`
                        : undefined,
                    }}
                  >
                    <div className="text-[7px] font-mono text-center py-[3px] px-1 truncate">
                      <span
                        className={`${
                          isBreach
                            ? "text-white font-bold"
                            : isHit
                            ? "text-amber-200"
                            : "text-gray-600"
                        }`}
                      >
                        {tech.id}
                      </span>
                    </div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                        <div className="text-[9px] font-bold text-white">
                          {tech.id}: {tech.name}
                        </div>
                        {hit && (
                          <>
                            <div className="text-[8px] text-gray-400 mt-0.5">
                              Confidence: {Math.round(confidence * 100)}%
                            </div>
                            <div className="text-[8px] text-gray-400">
                              Turns: {hit.turns.join(", ")}
                            </div>
                            {isBreach && (
                              <div className="text-[8px] text-red-400 font-bold mt-0.5">
                                BREACH VECTOR
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pulse animation for active hits */}
                    {isHit && hasAnyHits && (
                      <div
                        className={`absolute inset-0 rounded-sm animate-pulse opacity-20 ${
                          isBreach ? "bg-red-400" : "bg-amber-400"
                        }`}
                        style={{ animationDuration: "2s" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
