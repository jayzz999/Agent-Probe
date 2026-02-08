import React from "react";
import { AuditReport as AuditReportType } from "../types";

interface Props {
  report: AuditReportType | null;
}

function exportReport(report: AuditReportType) {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sovereign-breach-report-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditReport({ report }: Props) {
  if (!report) return null;

  const riskColor =
    report.overall_risk_rating === "CRITICAL"
      ? "text-red-500 bg-red-500/10 border-red-500/30"
      : report.overall_risk_rating === "HIGH"
      ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
      : report.overall_risk_rating === "MEDIUM"
      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  return (
    <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Security Audit Report</h2>
          <p className="text-xs text-gray-500 mt-1">{report.platform}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-lg border font-bold text-sm ${riskColor}`}>
            {report.overall_risk_rating} RISK
          </div>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={() => exportReport(report)}
        className="w-full flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg px-4 py-2.5 text-xs font-bold text-violet-300 tracking-wider transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        EXPORT JSON REPORT
      </button>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Trust Score", value: `${report.target_analysis.final_trust_score}%`, color: "text-violet-400" },
          { label: "Turns", value: report.target_analysis.total_turns, color: "text-cyan-400" },
          { label: "Breaches", value: report.target_analysis.breaches_detected, color: "text-red-400" },
          { label: "Breach", value: report.target_analysis.breach_confirmed ? "YES" : "NO", color: report.target_analysis.breach_confirmed ? "text-red-500" : "text-emerald-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-gray-500 font-bold tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Vulnerabilities */}
      {report.vulnerabilities.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-3 tracking-wider">
            VULNERABILITIES FOUND
          </h3>
          <div className="space-y-3">
            {report.vulnerabilities.map((v) => {
              const sevColor =
                v.severity === "CRITICAL"
                  ? "border-red-500/50 bg-red-500/5"
                  : v.severity === "HIGH"
                  ? "border-orange-500/50 bg-orange-500/5"
                  : "border-yellow-500/50 bg-yellow-500/5";
              const badge =
                v.severity === "CRITICAL"
                  ? "bg-red-500/20 text-red-400"
                  : v.severity === "HIGH"
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-yellow-500/20 text-yellow-400";

              return (
                <div key={v.id} className={`border rounded-lg p-4 ${sevColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge}`}>
                      {v.severity}
                    </span>
                    <span className="text-sm font-semibold text-gray-200">
                      {v.vulnerability}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{v.description}</p>
                  <div className="bg-gray-800/50 rounded-md p-2">
                    <span className="text-[10px] text-emerald-400 font-bold tracking-wider">
                      RECOMMENDATION:
                    </span>
                    <p className="text-xs text-gray-300 mt-1">{v.recommendation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remediation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-bold text-red-400 mb-2 tracking-wider">
            IMMEDIATE ACTIONS
          </h3>
          <ul className="space-y-1">
            {report.remediation_summary.immediate_actions.map((a, i) => (
              <li key={i} className="text-xs text-gray-400 flex gap-2">
                <span className="text-red-500 shrink-0">!</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-emerald-400 mb-2 tracking-wider">
            LONG-TERM FIXES
          </h3>
          <ul className="space-y-1">
            {report.remediation_summary.long_term_fixes.map((f, i) => (
              <li key={i} className="text-xs text-gray-400 flex gap-2">
                <span className="text-emerald-500 shrink-0">+</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
