// ── Shared Types ──

export interface TechniqueObserved {
  id: string;
  tactic: string;
  name: string;
  confidence: number;
}

export interface ThinkingObject {
  observation: string;
  hypothesis: string;
  plan: string;
  adaptation: string;
}

// ── Recon Sub-Events (Upgrade 3) ──

export interface ReconScanStartEvent {
  type: "recon_scan_start";
  target_length: number;
}

export interface ReconToolsFoundEvent {
  type: "recon_tools_found";
  tools: string[];
}

export interface ReconWeaknessFoundEvent {
  type: "recon_weakness_found";
  weakness: {
    id: string;
    type: string;
    description: string;
    severity: string;
  };
  index: number;
}

export interface ReconStrategyAssembledEvent {
  type: "recon_strategy_assembled";
  strategy: {
    name: string;
    technique: string;
  };
  index: number;
}

// ── Tool Call Types (Upgrade: Anthropic tool_use) ──

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_result: string;
  tool_use_id: string;
}

// ── Main Events ──

export interface ReconEvent {
  type: "recon_complete";
  security_score: number;
  weaknesses_found: number;
  strategies_generated: number;
  analysis: {
    security_posture_score: number;
    identified_tools: string[];
    weaknesses: Array<{
      id: string;
      type: string;
      description: string;
      severity: string;
    }>;
    attack_strategies: Array<{
      id: string;
      name: string;
      technique: string;
      description: string;
    }>;
  };
}

export interface PayloadEvent {
  type: "payload_ready";
  strategy_name: string;
  technique: string;
  is_pivot?: boolean;
  reason?: string;
}

export interface InfiltrationEvent {
  type: "infiltration_turn";
  turn: number;
  infiltrator: {
    thinking: string | ThinkingObject;
    technique: string;
    message: string;
    confidence: number;
    confidence_reason?: string;
    techniques_observed?: TechniqueObserved[];
  };
  target_response: string;
  target_tool_calls?: ToolCall[];
  trust_score: number;
  breach_detected: boolean;
  trust_delta: number;
}

export interface ReportEvent {
  type: "report_generated";
  report: AuditReport;
}

export interface CompleteEvent {
  type: "complete";
  audit_report: AuditReport;
  final_trust_score: number;
  breach_detected: boolean;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface AuditReport {
  platform: string;
  target_analysis: {
    initial_trust_score: number;
    final_trust_score: number;
    total_turns: number;
    breaches_detected: number;
    breach_confirmed: boolean;
  };
  vulnerabilities: Array<{
    id: string;
    vulnerability: string;
    severity: string;
    description: string;
    recommendation: string;
    techniques_used?: string[];
  }>;
  breach_log: Array<{
    turn: number;
    type: string;
    evidence: string | string[];
    technique: string;
  }>;
  remediation_summary: {
    immediate_actions: string[];
    long_term_fixes: string[];
  };
  overall_risk_rating: string;
}

export type BreachEvent =
  | ReconScanStartEvent
  | ReconToolsFoundEvent
  | ReconWeaknessFoundEvent
  | ReconStrategyAssembledEvent
  | ReconEvent
  | PayloadEvent
  | InfiltrationEvent
  | ReportEvent
  | CompleteEvent
  | ErrorEvent;

export type KillChainPhase =
  | "idle"
  | "recon"
  | "payload"
  | "infiltration"
  | "breach_confirmed"
  | "report";
