import React from "react";
import { BreachEvent, KillChainPhase, AuditReport as AuditReportType } from "../types";
import AgentFlow from "../components/AgentFlow";
import TrustMeter from "../components/TrustMeter";
import ChatView from "../components/ChatView";
import AuditReport from "../components/AuditReport";
import AttackMatrix from "../components/AttackMatrix";
import StrategyConsole from "../components/StrategyConsole";
import ReconDashboard from "../components/ReconDashboard";

interface BreachPageProps {
  events: BreachEvent[];
  phase: KillChainPhase;
  trustScore: number;
  trustDelta: number;
  report: AuditReportType | null;
  isRunning: boolean;
  showReport: boolean;
  breachDetected: boolean;
  targetPrompt: string;
  setTargetPrompt: (v: string) => void;
  maxTurns: number;
  setMaxTurns: (v: number) => void;
  handleExecute: () => void;
  handleStop: () => void;
  defaultPrompt: string;
}

export default function BreachPage({
  events, phase, trustScore, trustDelta, report, isRunning,
  showReport, breachDetected, targetPrompt, setTargetPrompt,
  maxTurns, setMaxTurns, handleExecute, handleStop, defaultPrompt,
}: BreachPageProps) {
  return (
    <main className="max-w-[1600px] mx-auto px-6 py-4 space-y-3">
      {/* Agent Flow Visualization */}
      <AgentFlow currentPhase={phase} breachDetected={breachDetected} />

      {/* Attack Surface Matrix */}
      {phase !== "idle" && <AttackMatrix events={events} />}

      {/* Main Grid */}
      <div
        className="grid grid-cols-12 gap-4"
        style={{ height: "calc(100vh - 280px)" }}
      >
        {/* Left Panel - Target Input + Trust Meter */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-gray-400">
                TARGET SYSTEM PROMPT
              </h2>
              <button
                onClick={() => setTargetPrompt(defaultPrompt)}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold tracking-wider"
              >
                RESET
              </button>
            </div>
            <textarea
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              disabled={isRunning}
              className="flex-1 bg-gray-950/50 border border-gray-700/30 rounded-lg p-3 text-[11px] text-gray-300 font-mono resize-none focus:border-violet-500 focus:outline-none disabled:opacity-50 leading-relaxed"
              placeholder="Paste the target agent's system prompt here..."
            />
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[10px] text-gray-500 font-bold tracking-wider">TURNS</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-14 bg-gray-800/80 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-white text-center focus:border-violet-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <button
                onClick={isRunning ? handleStop : handleExecute}
                disabled={!targetPrompt.trim()}
                className={`flex-1 py-3 rounded-xl font-black text-sm tracking-widest transition-all ${
                  isRunning
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-gradient-to-r from-violet-600 to-red-600 hover:from-violet-500 hover:to-red-500 text-white glow-border shadow-lg shadow-violet-500/20"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {isRunning ? "ABORT" : "EXECUTE BREACH"}
              </button>
            </div>
          </div>

          {/* Trust Meter */}
          <TrustMeter score={trustScore} delta={trustDelta} breachDetected={breachDetected} />
        </div>

        {/* Center - Chat Conversation + Recon Overlay */}
        <div className="col-span-6 flex flex-col min-h-0 relative">
          <ChatView events={events} isRunning={isRunning} />
          {/* Recon Dashboard overlay during recon phase */}
          {isRunning && phase === "recon" && (
            <ReconDashboard events={events} />
          )}
        </div>

        {/* Right Panel - Strategy Console / Report */}
        <div className="col-span-3 overflow-y-auto">
          {showReport && report ? (
            <AuditReport report={report} />
          ) : isRunning ? (
            <StrategyConsole events={events} />
          ) : (
            <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-500 mb-1">
                AUDIT REPORT
              </h3>
              <p className="text-[11px] text-gray-600">
                Report will be generated after the breach session completes.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
