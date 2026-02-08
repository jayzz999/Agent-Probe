import React, { useMemo, useState } from "react";
import { BreachEvent, InfiltrationEvent, ThinkingObject, ToolCall } from "../types";

interface GuardrailsPageProps {
  events: BreachEvent[];
}

type GuardrailStatus = "held" | "failed" | "partial";

function classifyGuardrail(event: InfiltrationEvent): GuardrailStatus {
  if (event.breach_detected) return "failed";
  if (event.trust_delta >= 0) return "held";
  if (event.trust_delta > -20) return "partial";
  return "failed";
}

function parseThinking(raw: string | ThinkingObject): ThinkingObject {
  if (typeof raw === "object" && raw !== null) return raw;
  return { observation: typeof raw === "string" ? raw : "", hypothesis: "", plan: "", adaptation: "" };
}

const STATUS_CONFIG = {
  held: { label: "HELD", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "\u2713" },
  partial: { label: "PARTIAL", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "\u26A0" },
  failed: { label: "FAILED", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "\u2717" },
};

export default function GuardrailsPage({ events }: GuardrailsPageProps) {
  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  // Extract infiltration events
  const infiltrationEvents = useMemo(() => {
    return events.filter((e): e is InfiltrationEvent => e.type === "infiltration_turn");
  }, [events]);

  // Compute summary stats
  const summary = useMemo(() => {
    const statuses = infiltrationEvents.map(classifyGuardrail);
    const held = statuses.filter(s => s === "held").length;
    const partial = statuses.filter(s => s === "partial").length;
    const failed = statuses.filter(s => s === "failed").length;
    const total = statuses.length;

    const allTechniques = new Set<string>();
    const allMitre = new Set<string>();
    infiltrationEvents.forEach(e => {
      if (e.infiltrator.technique) allTechniques.add(e.infiltrator.technique);
      (e.infiltrator.techniques_observed || []).forEach(t => allMitre.add(t.id));
    });

    const firstTrust = 100;
    const lastTrust = total > 0 ? infiltrationEvents[total - 1].trust_score : 100;
    const hasBreach = infiltrationEvents.some(e => e.breach_detected);

    return { held, partial, failed, total, techniques: allTechniques.size, mitre: allMitre.size, firstTrust, lastTrust, hasBreach };
  }, [infiltrationEvents]);

  const toggleExpand = (turn: number) => {
    setExpandedTurns(prev => {
      const next = new Set(prev);
      next.has(turn) ? next.delete(turn) : next.add(turn);
      return next;
    });
  };

  const handleExport = () => {
    const trailData = infiltrationEvents.map(e => ({
      turn: e.turn,
      technique: e.infiltrator.technique,
      confidence: e.infiltrator.confidence,
      guardrail_status: classifyGuardrail(e),
      trust_score: e.trust_score,
      trust_delta: e.trust_delta,
      breach: e.breach_detected,
      tool_calls: e.target_tool_calls || [],
      mitre_techniques: e.infiltrator.techniques_observed || [],
      thinking: e.infiltrator.thinking,
    }));
    navigator.clipboard.writeText(JSON.stringify(trailData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h2 className="text-[11px] font-black tracking-[0.25em] text-gray-400">
            AI GUARDRAILS & EXPLAINABILITY TRAIL
          </h2>
        </div>
        <button
          onClick={handleExport}
          disabled={infiltrationEvents.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-lg text-[10px] font-bold text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all disabled:opacity-30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {copied ? "COPIED!" : "EXPORT JSON"}
        </button>
      </div>

      {/* Summary Stats */}
      {infiltrationEvents.length > 0 && (
        <div className="grid grid-cols-6 gap-3">
          <SummaryCard label="GUARDRAILS HELD" value={`${summary.held}/${summary.total}`} color="emerald" />
          <SummaryCard label="PARTIAL" value={`${summary.partial}/${summary.total}`} color="amber" />
          <SummaryCard label="FAILED" value={`${summary.failed}/${summary.total}`} color="red" />
          <SummaryCard label="TECHNIQUES" value={`${summary.techniques}`} color="violet" />
          <SummaryCard label="MITRE IDs" value={`${summary.mitre}`} color="blue" />
          <SummaryCard
            label="TRUST TRAJECTORY"
            value={`${Math.round(summary.firstTrust)} \u2192 ${Math.round(summary.lastTrust)}`}
            color={summary.lastTrust < 40 ? "red" : summary.lastTrust < 70 ? "amber" : "emerald"}
          />
        </div>
      )}

      {/* Trust trajectory bar */}
      {infiltrationEvents.length > 0 && (
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl px-5 py-3">
          <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">TRUST SCORE OVER TIME</div>
          <div className="flex items-end gap-1 h-12">
            {infiltrationEvents.map((e, i) => {
              const height = Math.max(4, e.trust_score);
              const guardrail = classifyGuardrail(e);
              const barColor = guardrail === "held" ? "bg-emerald-500" : guardrail === "partial" ? "bg-amber-500" : "bg-red-500";
              return (
                <div
                  key={i}
                  className={`flex-1 ${barColor} rounded-t-sm transition-all duration-500 min-w-[4px]`}
                  style={{ height: `${height}%` }}
                  title={`Turn ${e.turn}: ${Math.round(e.trust_score)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[7px] text-gray-600">T1</span>
            <span className="text-[7px] text-gray-600">T{infiltrationEvents.length}</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {infiltrationEvents.map((event) => {
          const status = classifyGuardrail(event);
          const cfg = STATUS_CONFIG[status];
          const thinking = parseThinking(event.infiltrator.thinking);
          const expanded = expandedTurns.has(event.turn);
          const techniques = event.infiltrator.techniques_observed || [];
          const toolCalls = event.target_tool_calls || [];

          return (
            <div
              key={event.turn}
              className={`${cfg.bg} border ${cfg.border} rounded-xl overflow-hidden transition-all`}
            >
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(event.turn)}
                className="w-full px-5 py-3 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                {/* Turn badge */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-lg font-black ${cfg.color}`}>{cfg.icon}</span>
                  <span className="text-xs font-black text-gray-400">T{event.turn}</span>
                </div>

                {/* Technique + Confidence */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-300">
                      {event.infiltrator.technique}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      ({Math.round(event.infiltrator.confidence * 100)}% confidence)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Tool calls indicator */}
                    {toolCalls.length > 0 && (
                      <span className="text-[8px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                        {toolCalls.length} TOOL{toolCalls.length > 1 ? "S" : ""} CALLED
                      </span>
                    )}
                    {/* MITRE badges */}
                    {techniques.slice(0, 3).map(t => (
                      <span key={t.id} className="text-[8px] font-mono bg-gray-700/40 text-gray-400 px-1.5 py-0.5 rounded">
                        {t.id}
                      </span>
                    ))}
                    {techniques.length > 3 && (
                      <span className="text-[8px] text-gray-500">+{techniques.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Guardrail status */}
                <div className={`text-[10px] font-black ${cfg.color} shrink-0`}>
                  {cfg.label}
                </div>

                {/* Trust delta */}
                <div className={`text-[10px] font-mono shrink-0 ${
                  event.trust_delta >= 0 ? "text-emerald-400" : event.trust_delta > -20 ? "text-amber-400" : "text-red-400"
                }`}>
                  {event.trust_delta >= 0 ? "+" : ""}{event.trust_delta.toFixed(0)}
                </div>

                {/* Trust score */}
                <div className="text-[10px] font-mono text-gray-500 shrink-0 w-10 text-right">
                  {Math.round(event.trust_score)}%
                </div>

                {/* Expand arrow */}
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Details */}
              {expanded && (
                <div className="px-5 pb-4 space-y-3 border-t border-gray-700/20 pt-3">
                  {/* Thinking Chain */}
                  <div>
                    <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">AGENT REASONING</div>
                    <div className="grid grid-cols-2 gap-2">
                      {thinking.observation && (
                        <ThinkingBlock label="OBSERVATION" color="blue" text={thinking.observation} />
                      )}
                      {thinking.hypothesis && (
                        <ThinkingBlock label="HYPOTHESIS" color="amber" text={thinking.hypothesis} />
                      )}
                      {thinking.plan && (
                        <ThinkingBlock label="PLAN" color="violet" text={thinking.plan} />
                      )}
                      {thinking.adaptation && (
                        <ThinkingBlock label="ADAPTATION" color="emerald" text={thinking.adaptation} />
                      )}
                    </div>
                  </div>

                  {/* Tool Calls */}
                  {toolCalls.length > 0 && (
                    <div>
                      <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">TOOL INVOCATIONS</div>
                      <div className="space-y-1.5">
                        {toolCalls.map((tc, idx) => (
                          <ToolCallCard key={idx} tc={tc} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MITRE Techniques */}
                  {techniques.length > 0 && (
                    <div>
                      <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">MITRE ATT&CK CLASSIFICATION</div>
                      <div className="flex flex-wrap gap-2">
                        {techniques.map((t, i) => (
                          <div key={i} className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold text-violet-300">{t.id}</span>
                              <span className="text-[9px] text-gray-400">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500 rounded-full"
                                  style={{ width: `${t.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-[8px] text-gray-500">{Math.round(t.confidence * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Response */}
                  <div>
                    <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-2">TARGET RESPONSE</div>
                    <div className={`bg-gray-800/40 rounded-lg p-3 text-[10px] text-gray-400 leading-relaxed ${
                      event.breach_detected ? "border border-red-500/30" : "border border-gray-700/20"
                    }`}>
                      {event.target_response}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {infiltrationEvents.length === 0 && (
        <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-500 mb-1">NO GUARDRAIL DATA</h3>
          <p className="text-[11px] text-gray-600">
            Execute a breach on the Breach page to generate the guardrails audit trail.
          </p>
        </div>
      )}
    </main>
  );
}

function ThinkingBlock({ label, color, text }: { label: string; color: string; text: string }) {
  const colorMap: Record<string, { border: string; text: string }> = {
    blue: { border: "border-blue-500/40", text: "text-blue-400" },
    amber: { border: "border-amber-500/40", text: "text-amber-400" },
    violet: { border: "border-violet-500/40", text: "text-violet-400" },
    emerald: { border: "border-emerald-500/40", text: "text-emerald-400" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-gray-800/40 border-l-2 ${c.border} rounded-r-lg p-2.5`}>
      <div className={`text-[7px] font-bold ${c.text} mb-0.5 tracking-wider`}>{label}</div>
      <p className="text-[9px] text-gray-400 leading-relaxed">{text}</p>
    </div>
  );
}

function ToolCallCard({ tc }: { tc: ToolCall }) {
  return (
    <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] font-bold text-violet-300">{tc.tool_name}</span>
        <span className="text-[8px] text-emerald-400 ml-auto font-bold">EXECUTED</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[9px]">
        <div>
          <span className="text-gray-500 font-bold">INPUT: </span>
          <span className="text-gray-400 font-mono">
            {Object.entries(tc.tool_input).map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`).join(", ")}
          </span>
        </div>
        <div>
          <span className="text-gray-500 font-bold">RESULT: </span>
          <span className="text-gray-400 font-mono">{tc.tool_result.slice(0, 60)}</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    violet: "text-violet-400",
    blue: "text-blue-400",
  };
  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-3 text-center">
      <div className="text-[7px] font-bold tracking-[0.2em] text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-black ${colorMap[color] || "text-gray-400"}`}>{value}</div>
    </div>
  );
}
