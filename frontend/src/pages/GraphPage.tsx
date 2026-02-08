import React, { useMemo } from "react";
import { BreachEvent, KillChainPhase } from "../types";

interface GraphPageProps {
  events: BreachEvent[];
  phase: KillChainPhase;
  breachDetected: boolean;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  description: string;
  phases: KillChainPhase[];
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type: "normal" | "conditional" | "loop";
}

const NODES: GraphNode[] = [
  { id: "recon", label: "RECON", x: 140, y: 200, description: "Analyze target prompt, discover tools & weaknesses", phases: ["recon"] },
  { id: "payload", label: "PAYLOAD", x: 340, y: 200, description: "Generate attack strategy & message", phases: ["payload"] },
  { id: "infiltrate", label: "INFILTRATE", x: 540, y: 200, description: "Execute adversarial dialogue turn", phases: ["infiltration", "breach_confirmed"] },
  { id: "pivot", label: "PIVOT", x: 440, y: 360, description: "Switch to next attack strategy", phases: [] },
  { id: "report", label: "REPORT", x: 740, y: 200, description: "Generate security audit report", phases: ["report"] },
];

const EDGES: GraphEdge[] = [
  { from: "recon", to: "payload", type: "normal" },
  { from: "payload", to: "infiltrate", type: "normal" },
  { from: "infiltrate", to: "infiltrate", label: "continue", type: "loop" },
  { from: "infiltrate", to: "pivot", label: "every 3 turns", type: "conditional" },
  { from: "pivot", to: "payload", type: "normal" },
  { from: "infiltrate", to: "report", label: "breach or max turns", type: "conditional" },
];

export default function GraphPage({ events, phase, breachDetected }: GraphPageProps) {
  // Derive visited nodes from events
  const visitedNodes = useMemo(() => {
    const visited = new Set<string>();
    for (const e of events) {
      if (e.type === "recon_scan_start" || e.type === "recon_complete") visited.add("recon");
      if (e.type === "payload_ready") {
        visited.add("payload");
        if (e.is_pivot) visited.add("pivot");
      }
      if (e.type === "infiltration_turn") visited.add("infiltrate");
      if (e.type === "report_generated") visited.add("report");
    }
    return visited;
  }, [events]);

  // Current active node
  const activeNode = useMemo(() => {
    for (const node of NODES) {
      if (node.phases.includes(phase)) return node.id;
    }
    return null;
  }, [phase]);

  // Stats
  const stats = useMemo(() => {
    let turns = 0;
    let pivots = 0;
    let trustScore = 100;
    for (const e of events) {
      if (e.type === "infiltration_turn") {
        turns = e.turn;
        trustScore = e.trust_score;
      }
      if (e.type === "payload_ready" && e.is_pivot) pivots++;
    }
    return { turns, pivots, trustScore };
  }, [events]);

  // Get node state
  const getNodeState = (nodeId: string): "idle" | "active" | "completed" | "breach" => {
    if (breachDetected && nodeId === "infiltrate") return "breach";
    if (activeNode === nodeId) return "active";
    if (visitedNodes.has(nodeId)) return "completed";
    return "idle";
  };

  // Get edge path
  const getEdgePath = (edge: GraphEdge): string => {
    const from = NODES.find(n => n.id === edge.from)!;
    const to = NODES.find(n => n.id === edge.to)!;

    if (edge.type === "loop") {
      // Self-referencing loop on infiltrate
      return `M ${from.x + 30} ${from.y - 35} C ${from.x + 80} ${from.y - 100} ${from.x - 80} ${from.y - 100} ${from.x - 30} ${from.y - 35}`;
    }

    // Curved path for conditional edges going down
    if (from.y !== to.y) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      return `M ${from.x} ${from.y + 35} Q ${midX} ${midY + 30} ${to.x} ${to.y - 35}`;
    }

    // Straight horizontal path
    return `M ${from.x + 40} ${from.y} L ${to.x - 40} ${to.y}`;
  };

  // Check if edge is active
  const isEdgeActive = (edge: GraphEdge): boolean => {
    if (!activeNode) return false;
    return edge.from === activeNode;
  };

  const isEdgeVisited = (edge: GraphEdge): boolean => {
    return visitedNodes.has(edge.from) && visitedNodes.has(edge.to);
  };

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-6">
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
            <h2 className="text-[11px] font-black tracking-[0.25em] text-gray-400">
              LANGGRAPH STATE MACHINE
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            {phase === "idle" ? "AWAITING EXECUTION" : `PHASE: ${phase.toUpperCase()}`}
          </div>
        </div>

        {/* SVG Graph */}
        <div className="relative" style={{ height: "420px" }}>
          <svg width="100%" height="100%" viewBox="0 0 900 420" className="overflow-visible">
            <defs>
              {/* Arrow marker */}
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
              </marker>
              <marker id="arrowhead-breach" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>

              {/* Glow filters */}
              <filter id="glow-violet">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-red">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const active = isEdgeActive(edge);
              const visited = isEdgeVisited(edge);
              const path = getEdgePath(edge);

              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={active ? "#8b5cf6" : visited ? "#8b5cf680" : "#374151"}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeDasharray={edge.type === "conditional" ? "6 4" : edge.type === "loop" ? "4 3" : "none"}
                    markerEnd={`url(#arrowhead${active ? "-active" : ""})`}
                    className={active ? "transition-all duration-500" : ""}
                    style={active ? {
                      animation: "edge-flow 1.5s linear infinite",
                      strokeDasharray: "10 5",
                      strokeDashoffset: 0,
                    } : {}}
                  />
                  {/* Edge label */}
                  {edge.label && (
                    <text
                      x={edge.type === "loop"
                        ? NODES.find(n => n.id === edge.from)!.x
                        : (NODES.find(n => n.id === edge.from)!.x + NODES.find(n => n.id === edge.to)!.x) / 2
                      }
                      y={edge.type === "loop"
                        ? NODES.find(n => n.id === edge.from)!.y - 105
                        : edge.from === "infiltrate" && edge.to === "pivot"
                        ? (NODES.find(n => n.id === edge.from)!.y + NODES.find(n => n.id === edge.to)!.y) / 2 + 15
                        : NODES.find(n => n.id === edge.from)!.y - 15
                      }
                      textAnchor="middle"
                      className="text-[8px] fill-gray-500 font-mono"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const state = getNodeState(node.id);
              const isActive = state === "active";
              const isCompleted = state === "completed";
              const isBreach = state === "breach";

              return (
                <g key={node.id}>
                  {/* Outer glow ring for active/breach */}
                  {(isActive || isBreach) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={42}
                      fill="none"
                      stroke={isBreach ? "#ef4444" : "#8b5cf6"}
                      strokeWidth={2}
                      opacity={0.4}
                      filter={isBreach ? "url(#glow-red)" : "url(#glow-violet)"}
                      className={isBreach ? "animate-ping" : ""}
                      style={isActive ? { animation: "node-pulse 2s ease-in-out infinite" } : {}}
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={35}
                    fill={
                      isBreach ? "rgba(239,68,68,0.15)"
                      : isActive ? "rgba(139,92,246,0.15)"
                      : isCompleted ? "rgba(139,92,246,0.1)"
                      : "rgba(55,65,81,0.3)"
                    }
                    stroke={
                      isBreach ? "#ef4444"
                      : isActive ? "#8b5cf6"
                      : isCompleted ? "#8b5cf680"
                      : "#374151"
                    }
                    strokeWidth={isActive || isBreach ? 2.5 : 1.5}
                    className="transition-all duration-700"
                  />

                  {/* Node label */}
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[10px] font-black tracking-[0.15em] ${
                      isBreach ? "fill-red-400"
                      : isActive ? "fill-violet-300"
                      : isCompleted ? "fill-violet-400"
                      : "fill-gray-500"
                    }`}
                  >
                    {node.label}
                  </text>

                  {/* Checkmark for completed */}
                  {isCompleted && !isActive && (
                    <text
                      x={node.x + 22}
                      y={node.y - 22}
                      textAnchor="middle"
                      className="text-[12px] fill-emerald-400"
                    >
                      &#10003;
                    </text>
                  )}

                  {/* Description below */}
                  <text
                    x={node.x}
                    y={node.y + 55}
                    textAnchor="middle"
                    className="text-[7px] fill-gray-600"
                  >
                    {node.description.length > 40 ? node.description.slice(0, 38) + "..." : node.description}
                  </text>
                </g>
              );
            })}

            {/* END node */}
            <g>
              <rect x={840} y={185} width={40} height={30} rx={4}
                fill="rgba(55,65,81,0.3)" stroke="#374151" strokeWidth={1.5}
                className={phase === "report" || (events.some(e => e.type === "complete")) ? "fill-gray-700/50 stroke-gray-500" : ""}
              />
              <text x={860} y={204} textAnchor="middle" dominantBaseline="middle"
                className="text-[8px] font-bold fill-gray-500 tracking-wider"
              >
                END
              </text>
              {/* Edge from report to END */}
              <path
                d={`M ${780} ${200} L ${838} ${200}`}
                fill="none"
                stroke={visitedNodes.has("report") ? "#8b5cf680" : "#374151"}
                strokeWidth={1.5}
                markerEnd="url(#arrowhead)"
              />
            </g>
          </svg>
        </div>

        {/* Stats Panel */}
        <div className="px-6 py-4 border-t border-gray-800/50 grid grid-cols-5 gap-4">
          <StatCard label="CURRENT PHASE" value={phase === "idle" ? "---" : phase.toUpperCase()} color="violet" />
          <StatCard label="TURN" value={stats.turns === 0 ? "---" : `${stats.turns}`} color="blue" />
          <StatCard label="TRUST SCORE" value={`${Math.round(stats.trustScore)}%`}
            color={stats.trustScore < 40 ? "red" : stats.trustScore < 70 ? "amber" : "emerald"} />
          <StatCard label="STRATEGY PIVOTS" value={`${stats.pivots}`} color="amber" />
          <StatCard label="STATUS" value={breachDetected ? "BREACHED" : phase === "idle" ? "STANDBY" : "IN PROGRESS"}
            color={breachDetected ? "red" : "emerald"} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-gray-900/60 border border-gray-700/30 rounded-xl px-6 py-3 flex items-center gap-6">
        <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500">LEGEND</span>
        <LegendItem color="gray" label="Idle" />
        <LegendItem color="violet" label="Active" pulse />
        <LegendItem color="violet" label="Completed" filled />
        <LegendItem color="red" label="Breach" pulse />
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-6 h-[1.5px] bg-gray-500" />
            <span className="text-[8px] text-gray-500">Normal Edge</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-6 h-[1.5px] bg-gray-500" style={{ borderTop: "1.5px dashed #6b7280" }} />
            <span className="text-[8px] text-gray-500">Conditional Edge</span>
          </span>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        @keyframes node-pulse {
          0%, 100% { opacity: 0.4; r: 42; }
          50% { opacity: 0.8; r: 48; }
        }
        @keyframes edge-flow {
          to { stroke-dashoffset: -30; }
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-400",
    blue: "text-blue-400",
    red: "text-red-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  };
  return (
    <div className="bg-gray-800/40 rounded-lg p-3 text-center">
      <div className="text-[8px] font-bold tracking-[0.2em] text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-black ${colorMap[color] || "text-gray-400"}`}>{value}</div>
    </div>
  );
}

function LegendItem({ color, label, pulse, filled }: { color: string; label: string; pulse?: boolean; filled?: boolean }) {
  const colorMap: Record<string, string> = {
    gray: "border-gray-500",
    violet: "border-violet-500",
    red: "border-red-500",
  };
  const fillMap: Record<string, string> = {
    violet: "bg-violet-500/30",
    red: "bg-red-500/30",
  };
  return (
    <span className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full border-2 ${colorMap[color]} ${filled ? fillMap[color] : ""} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-[8px] text-gray-500">{label}</span>
    </span>
  );
}
