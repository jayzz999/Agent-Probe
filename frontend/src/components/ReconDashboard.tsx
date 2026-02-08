import React, { useMemo } from "react";
import { BreachEvent } from "../types";

interface ReconDashboardProps {
  events: BreachEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/20 border-red-500/40",
  HIGH: "text-orange-400 bg-orange-500/20 border-orange-500/40",
  MEDIUM: "text-yellow-400 bg-yellow-500/20 border-yellow-500/40",
  LOW: "text-blue-400 bg-blue-500/20 border-blue-500/40",
};

export default function ReconDashboard({ events }: ReconDashboardProps) {
  const scanStarted = useMemo(
    () => events.some((e) => e.type === "recon_scan_start"),
    [events]
  );

  const tools = useMemo(() => {
    const ev = events.find((e) => e.type === "recon_tools_found");
    return ev && ev.type === "recon_tools_found" ? ev.tools : [];
  }, [events]);

  const weaknesses = useMemo(() => {
    return events
      .filter((e) => e.type === "recon_weakness_found")
      .map((e) => (e.type === "recon_weakness_found" ? e.weakness : null))
      .filter(Boolean) as Array<{
      id: string;
      type: string;
      description: string;
      severity: string;
    }>;
  }, [events]);

  const strategies = useMemo(() => {
    return events
      .filter((e) => e.type === "recon_strategy_assembled")
      .map((e) =>
        e.type === "recon_strategy_assembled" ? e.strategy : null
      )
      .filter(Boolean) as Array<{ name: string; technique: string }>;
  }, [events]);

  const securityScore = useMemo(() => {
    const ev = events.find((e) => e.type === "recon_complete");
    return ev && ev.type === "recon_complete" ? ev.security_score : null;
  }, [events]);

  if (!scanStarted) return null;

  return (
    <div className="absolute inset-0 z-30 bg-gray-950/95 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden flex flex-col">
      {/* Scan line animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-60"
          style={{
            animation: "reconScan 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800/50 flex items-center gap-3 shrink-0">
        <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
        <h3 className="text-[10px] font-black tracking-[0.25em] text-violet-400">
          RECONNAISSANCE SCAN IN PROGRESS
        </h3>
        <div className="ml-auto">
          {securityScore !== null && (
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-gray-500 tracking-wider font-bold">
                SECURITY POSTURE
              </span>
              <span
                className={`text-lg font-black ${
                  securityScore <= 3
                    ? "text-red-400"
                    : securityScore <= 6
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {securityScore}/10
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Discovered Tools */}
        {tools.length > 0 && (
          <div
            className="animate-fadeIn"
            style={{ animationDelay: "0.1s", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-3.5 h-3.5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-[9px] font-bold tracking-[0.2em] text-blue-400">
                TOOLS DISCOVERED ({tools.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, i) => (
                <span
                  key={tool}
                  className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-md animate-fadeIn"
                  style={{
                    animationDelay: `${0.2 + i * 0.1}s`,
                    animationFillMode: "both",
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {weaknesses.length > 0 && (
          <div
            className="animate-fadeIn"
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-3.5 h-3.5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-[9px] font-bold tracking-[0.2em] text-red-400">
                VULNERABILITIES IDENTIFIED ({weaknesses.length})
              </span>
            </div>
            <div className="space-y-2">
              {weaknesses.map((w, i) => {
                const colors =
                  SEVERITY_COLORS[w.severity] || SEVERITY_COLORS.MEDIUM;
                return (
                  <div
                    key={w.id}
                    className={`border rounded-lg p-3 animate-fadeIn ${colors}`}
                    style={{
                      animationDelay: `${0.6 + i * 0.15}s`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] font-black tracking-wider">
                        {w.severity}
                      </span>
                      <span className="text-[9px] font-mono opacity-60">
                        {w.id}
                      </span>
                      <span className="text-[9px] font-bold ml-auto opacity-80">
                        {w.type}
                      </span>
                    </div>
                    <p className="text-[10px] opacity-80 leading-relaxed">
                      {w.description.length > 120
                        ? w.description.slice(0, 120) + "..."
                        : w.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attack Strategies */}
        {strategies.length > 0 && (
          <div
            className="animate-fadeIn"
            style={{ animationDelay: "1s", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-3.5 h-3.5 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-[9px] font-bold tracking-[0.2em] text-amber-400">
                ATTACK STRATEGIES ASSEMBLED ({strategies.length})
              </span>
            </div>
            <div className="space-y-2">
              {strategies.map((s, i) => (
                <div
                  key={i}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 animate-fadeIn flex items-center gap-3"
                  style={{
                    animationDelay: `${1.1 + i * 0.15}s`,
                    animationFillMode: "both",
                  }}
                >
                  <span className="text-lg font-black text-amber-500/40">
                    S{i + 1}
                  </span>
                  <div>
                    <div className="text-[11px] font-bold text-amber-300">
                      {s.name}
                    </div>
                    <div className="text-[9px] font-mono text-amber-400/60">
                      {s.technique}
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-amber-500/40 ml-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state while waiting for data */}
        {tools.length === 0 && weaknesses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-violet-500/50 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-violet-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-bold tracking-wider animate-pulse">
              SCANNING TARGET PROMPT...
            </p>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes reconScan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
