import React, { useEffect, useRef } from "react";
import { BreachEvent } from "../types";

interface Props {
  events: BreachEvent[];
}

function formatEvent(event: BreachEvent): React.ReactNode[] {
  const lines: React.ReactNode[] = [];

  switch (event.type) {
    case "recon_complete":
      lines.push(
        <div key="r1" className="text-violet-400 font-bold">
          [RECON] Analysis complete
        </div>
      );
      lines.push(
        <div key="r2" className="text-gray-400 ml-4">
          Security Posture: <span className="text-yellow-400">{event.security_score}/10</span>
          {" | "}Weaknesses: <span className="text-red-400">{event.weaknesses_found}</span>
          {" | "}Strategies: <span className="text-violet-400">{event.strategies_generated}</span>
        </div>
      );
      if (event.analysis?.weaknesses) {
        event.analysis.weaknesses.forEach((w, i) => {
          const sevColor =
            w.severity === "CRITICAL"
              ? "text-red-500"
              : w.severity === "HIGH"
              ? "text-orange-400"
              : "text-yellow-400";
          lines.push(
            <div key={`w${i}`} className="ml-4 text-gray-500">
              <span className={sevColor}>[{w.severity}]</span> {w.type}: {w.description.slice(0, 120)}
            </div>
          );
        });
      }
      break;

    case "payload_ready":
      lines.push(
        <div key="p1" className="text-amber-400 font-bold">
          [PAYLOAD] Strategy loaded: {event.strategy_name}
        </div>
      );
      lines.push(
        <div key="p2" className="text-gray-400 ml-4">
          Technique: <span className="text-amber-300">{event.technique}</span>
        </div>
      );
      break;

    case "infiltration_turn":
      lines.push(
        <div key="it1" className="text-cyan-400 font-bold mt-2">
          [TURN {event.turn}] {event.infiltrator.technique}
          <span className="text-gray-500 font-normal ml-2">
            confidence: {(event.infiltrator.confidence * 100).toFixed(0)}%
          </span>
        </div>
      );
      lines.push(
        <div key="it2" className="text-gray-500 ml-4 italic text-xs">
          thinking: {(typeof event.infiltrator.thinking === "string" ? event.infiltrator.thinking : JSON.stringify(event.infiltrator.thinking)).slice(0, 200)}
        </div>
      );
      lines.push(
        <div key="it3" className="ml-4 mt-1">
          <span className="text-red-400 font-semibold">INFILTRATOR &gt; </span>
          <span className="text-gray-300">{event.infiltrator.message}</span>
        </div>
      );
      lines.push(
        <div key="it4" className="ml-4 mt-1">
          <span className="text-blue-400 font-semibold">TARGET &gt; </span>
          <span className="text-gray-300">{event.target_response}</span>
        </div>
      );
      if (event.breach_detected) {
        lines.push(
          <div key="it5" className="text-red-500 font-bold ml-4 mt-1 animate-pulse">
            *** BREACH DETECTED ***
          </div>
        );
      }
      break;

    case "report_generated":
      lines.push(
        <div key="rp1" className="text-emerald-400 font-bold mt-2">
          [REPORT] Audit report generated
        </div>
      );
      lines.push(
        <div key="rp2" className="text-gray-400 ml-4">
          Risk Rating:{" "}
          <span
            className={
              event.report.overall_risk_rating === "CRITICAL"
                ? "text-red-500 font-bold"
                : event.report.overall_risk_rating === "HIGH"
                ? "text-orange-400 font-bold"
                : "text-yellow-400 font-bold"
            }
          >
            {event.report.overall_risk_rating}
          </span>
        </div>
      );
      break;

    case "complete":
      lines.push(
        <div key="c1" className="text-gray-400 font-bold mt-2">
          [COMPLETE] Session ended. Final trust: {event.final_trust_score.toFixed(1)}%
        </div>
      );
      break;

    case "error":
      lines.push(
        <div key="e1" className="text-red-500 font-bold">
          [ERROR] {event.message}
        </div>
      );
      break;
  }

  return lines;
}

export default function Terminal({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="bg-gray-950/90 border border-gray-700/50 rounded-xl flex flex-col h-full">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-gray-500 font-mono ml-2">
          sovereign-breach ~ inquisitor-terminal
        </span>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 min-h-0">
        {events.length === 0 && (
          <div className="text-gray-600 italic">
            Awaiting breach execution...
          </div>
        )}
        {events.map((event, i) => (
          <div key={i} className="terminal-line">
            {formatEvent(event)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
