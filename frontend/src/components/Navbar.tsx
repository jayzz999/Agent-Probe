import React from "react";
import { NavLink } from "react-router-dom";
import { KillChainPhase } from "../types";

interface NavbarProps {
  isRunning: boolean;
  phase: KillChainPhase;
}

const NAV_ITEMS = [
  { to: "/", label: "BREACH" },
  { to: "/graph", label: "GRAPH" },
  { to: "/guardrails", label: "GUARDRAILS" },
];

export default function Navbar({ isRunning, phase }: NavbarProps) {
  return (
    <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-red-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider gradient-text">
              SOVEREIGN BREACH
            </h1>
            <p className="text-[10px] text-gray-500 tracking-[0.2em]">
              AUTONOMOUS RED-TEAM PLATFORM
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `px-4 py-2 text-[10px] font-black tracking-[0.2em] rounded-lg transition-all ${
                  isActive
                    ? "text-violet-300 bg-violet-500/15 border border-violet-500/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-red-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
          <span className="text-[10px] text-gray-500 font-bold tracking-wider">
            {isRunning ? "ACTIVE" : "STANDBY"}
          </span>
          {isRunning && (
            <span className="text-[9px] text-violet-400/60 font-mono ml-1">
              [{phase.toUpperCase()}]
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
