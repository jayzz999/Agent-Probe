import React, { useMemo } from "react";
import { BreachEvent, ThinkingObject, InfiltrationEvent } from "../types";

interface StrategyConsoleProps {
  events: BreachEvent[];
}

interface TurnEntry {
  turn: number;
  technique: string;
  confidence: number;
  confidenceReason: string;
  thinking: ThinkingObject;
  breachDetected: boolean;
  trustDelta: number;
}

function parseThinking(raw: string | ThinkingObject): ThinkingObject {
  if (typeof raw === "object" && raw !== null) return raw;
  return {
    observation: typeof raw === "string" ? raw : "Analyzing target...",
    hypothesis: "",
    plan: "",
    adaptation: "",
  };
}

export default function StrategyConsole({ events }: StrategyConsoleProps) {
  // Extract infiltration turns
  const turns = useMemo<TurnEntry[]>(() => {
    return events
      .filter((e): e is InfiltrationEvent => e.type === "infiltration_turn")
      .map((e) => ({
        turn: e.turn,
        technique: e.infiltrator.technique,
        confidence: e.infiltrator.confidence,
        confidenceReason: e.infiltrator.confidence_reason || "",
        thinking: parseThinking(e.infiltrator.thinking),
        breachDetected: e.breach_detected,
        trustDelta: e.trust_delta,
      }));
  }, [events]);

  // Get current strategy from payload events
  const currentStrategy = useMemo(() => {
    const payloads = events.filter((e) => e.type === "payload_ready");
    if (payloads.length === 0) return null;
    const last = payloads[payloads.length - 1];
    if (last.type === "payload_ready") return last;
    return null;
  }, [events]);

  const latestTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/50 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-400">
          STRATEGY CONSOLE
        </h3>
        {latestTurn && (
          <span className="ml-auto text-[9px] font-mono text-gray-500">
            TURN {latestTurn.turn}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Strategy Badge */}
        {currentStrategy && (
          <div className="bg-gray-800/60 border border-gray-700/40 rounded-lg p-3">
            <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-1">
              ACTIVE STRATEGY
            </div>
            <div className="text-xs font-bold text-violet-300">
              {currentStrategy.strategy_name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-mono">
                {currentStrategy.technique}
              </span>
              {currentStrategy.is_pivot && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  PIVOT
                </span>
              )}
            </div>
          </div>
        )}

        {/* Latest Thinking Block */}
        {latestTurn && (
          <div className="space-y-2">
            <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500">
              AGENT REASONING
            </div>

            {/* Observation */}
            {latestTurn.thinking.observation && (
              <div className="bg-gray-800/40 border-l-2 border-blue-500/60 rounded-r-lg p-2.5">
                <div className="text-[8px] font-bold text-blue-400 mb-0.5 tracking-wider">
                  OBSERVATION
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {latestTurn.thinking.observation}
                </p>
              </div>
            )}

            {/* Hypothesis */}
            {latestTurn.thinking.hypothesis && (
              <div className="bg-gray-800/40 border-l-2 border-amber-500/60 rounded-r-lg p-2.5">
                <div className="text-[8px] font-bold text-amber-400 mb-0.5 tracking-wider">
                  HYPOTHESIS
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {latestTurn.thinking.hypothesis}
                </p>
              </div>
            )}

            {/* Plan */}
            {latestTurn.thinking.plan && (
              <div className="bg-gray-800/40 border-l-2 border-violet-500/60 rounded-r-lg p-2.5">
                <div className="text-[8px] font-bold text-violet-400 mb-0.5 tracking-wider">
                  PLAN
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {latestTurn.thinking.plan}
                </p>
              </div>
            )}

            {/* Adaptation */}
            {latestTurn.thinking.adaptation && (
              <div className="bg-gray-800/40 border-l-2 border-emerald-500/60 rounded-r-lg p-2.5">
                <div className="text-[8px] font-bold text-emerald-400 mb-0.5 tracking-wider">
                  ADAPTATION
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {latestTurn.thinking.adaptation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Confidence Gauge */}
        {latestTurn && (
          <div className="bg-gray-800/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-bold tracking-[0.2em] text-gray-500">
                CONFIDENCE
              </span>
              <span
                className={`text-sm font-black ${
                  latestTurn.confidence >= 0.7
                    ? "text-red-400"
                    : latestTurn.confidence >= 0.4
                    ? "text-amber-400"
                    : "text-gray-400"
                }`}
              >
                {Math.round(latestTurn.confidence * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  latestTurn.confidence >= 0.7
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : latestTurn.confidence >= 0.4
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-gray-500 to-gray-400"
                }`}
                style={{ width: `${latestTurn.confidence * 100}%` }}
              />
            </div>
            {latestTurn.confidenceReason && (
              <p className="text-[9px] text-gray-500 mt-1.5 italic">
                {latestTurn.confidenceReason}
              </p>
            )}
          </div>
        )}

        {/* Adaptation Timeline */}
        {turns.length > 0 && (
          <div>
            <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">
              ADAPTATION TIMELINE
            </div>
            <div className="space-y-1">
              {turns.map((turn) => {
                const resultLabel = turn.breachDetected
                  ? "BREACH"
                  : turn.trustDelta <= -20
                  ? "COMPLIANCE"
                  : turn.trustDelta >= 0
                  ? "REFUSED"
                  : "PROBING";

                const resultColor = turn.breachDetected
                  ? "text-red-400"
                  : turn.trustDelta <= -20
                  ? "text-amber-400"
                  : turn.trustDelta >= 0
                  ? "text-gray-500"
                  : "text-yellow-500";

                return (
                  <div
                    key={turn.turn}
                    className={`flex items-center gap-2 text-[9px] font-mono py-1 px-2 rounded ${
                      turn === latestTurn
                        ? "bg-gray-800/60 border border-gray-700/40"
                        : ""
                    }`}
                  >
                    <span className="text-gray-600 w-5">T{turn.turn}</span>
                    <span className="text-gray-400 flex-1 truncate">
                      {turn.technique}
                    </span>
                    <span className="text-gray-500">
                      ({Math.round(turn.confidence * 100)}%)
                    </span>
                    <span className="text-gray-600 mx-1">&rarr;</span>
                    <span className={`font-bold ${resultColor}`}>
                      {resultLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {turns.length === 0 && !currentStrategy && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-3 animate-pulse">
              <svg
                className="w-6 h-6 text-violet-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-gray-500 mb-1">
              INITIALIZING
            </h3>
            <p className="text-[10px] text-gray-600">
              Agent reasoning will appear here during infiltration...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
