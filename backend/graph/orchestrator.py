"""
LangGraph Orchestrator - Stateful multi-agent graph that runs the full
Sovereign Breach kill-chain: Recon -> Payload -> Infiltration -> Report.
"""

from langgraph.graph import StateGraph, END
from backend.graph.state import BreachState
from backend.agents.strategist import StrategistAgent
from backend.agents.infiltrator import InfiltratorAgent
from backend.agents.target import TargetAgent
from backend.agents.auditor import AuditorAgent

# Singletons reset per run
_strategist = StrategistAgent()
_infiltrator = InfiltratorAgent()
_auditor = AuditorAgent()
_target: TargetAgent | None = None


def _emit(state: BreachState, event_type: str, data: dict) -> list[dict]:
    events = list(state.get("events", []))
    events.append({"type": event_type, **data})
    return events


# ── Node: Recon ──────────────────────────────────────────────────────────

def recon_node(state: BreachState) -> dict:
    global _target
    target_prompt = state["target_prompt"]

    demo_mode = state.get("demo_mode", True)

    # Reset all agents
    _infiltrator.reset()
    _auditor.reset()
    _target = TargetAgent(system_prompt=target_prompt, demo_mode=demo_mode)

    analysis = _strategist.analyze(target_prompt)
    strategies = analysis.get("attack_strategies", [])

    events = list(state.get("events", []))

    # Sub-event 1: Scan started
    events.append({"type": "recon_scan_start", "target_length": len(target_prompt)})

    # Sub-event 2: Tools discovered
    events.append({"type": "recon_tools_found", "tools": analysis.get("identified_tools", [])})

    # Sub-event 3+: Each weakness discovered
    for i, weakness in enumerate(analysis.get("weaknesses", [])):
        events.append({"type": "recon_weakness_found", "weakness": weakness, "index": i})

    # Sub-event N+: Each strategy assembled
    for i, strategy in enumerate(strategies):
        events.append({
            "type": "recon_strategy_assembled",
            "strategy": {"name": strategy.get("name", ""), "technique": strategy.get("technique", "")},
            "index": i,
        })

    # Final: recon complete (backward compat)
    events.append({
        "type": "recon_complete",
        "security_score": analysis.get("security_posture_score", 5),
        "weaknesses_found": len(analysis.get("weaknesses", [])),
        "strategies_generated": len(strategies),
        "analysis": analysis,
    })

    return {
        "phase": "payload",
        "recon_analysis": analysis,
        "attack_strategies": strategies,
        "current_strategy_index": 0,
        "turn_number": 0,
        "trust_score": 100.0,
        "breach_detected": False,
        "events": events,
    }


# ── Node: Payload Generation ────────────────────────────────────────────

def payload_node(state: BreachState) -> dict:
    strategies = state.get("attack_strategies", [])
    idx = state.get("current_strategy_index", 0)

    if idx < len(strategies):
        strategy = strategies[idx]
        _infiltrator.set_strategy(strategy)
    else:
        _infiltrator.set_strategy({
            "name": "Adaptive Fallback",
            "technique": "Multi-vector",
            "description": "All planned strategies exhausted. Using adaptive approach.",
            "opening_message": "",
            "pivot_on_refusal": "Try a completely different angle.",
        })

    strategy_name = _infiltrator.current_strategy.get("name", "Unknown")
    technique = _infiltrator.current_strategy.get("technique", "Unknown")

    events = _emit(state, "payload_ready", {
        "strategy_name": strategy_name,
        "technique": technique,
        "is_pivot": idx > 0,
        "reason": "Target refused previous approach. Shifting to new attack vector." if idx > 0 else "Initial strategy loaded.",
    })

    return {
        "phase": "infiltration",
        "events": events,
    }


# ── Node: Infiltration Turn ─────────────────────────────────────────────

def infiltration_node(state: BreachState) -> dict:
    turn = state.get("turn_number", 0) + 1
    last_response = state.get("last_target_response")

    # Infiltrator generates attack message
    infiltrator_output = _infiltrator.generate_attack_message(
        target_response=last_response,
    )

    attack_message = infiltrator_output.get("message", "")

    # Target responds (now returns dict with text + tool_calls)
    target_result = _target.respond(attack_message)
    target_response = target_result["text"]
    tool_calls = target_result.get("tool_calls", [])

    # Auditor analyzes the exchange (with tool misuse detection)
    turn_analysis = _auditor.analyze_turn(
        turn_number=turn,
        infiltrator_message=attack_message,
        target_response=target_response,
        technique_used=infiltrator_output.get("technique_used", "Unknown"),
        tool_calls=tool_calls,
    )

    breach = turn_analysis.get("breach_confirmed", False)

    events = _emit(state, "infiltration_turn", {
        "turn": turn,
        "infiltrator": {
            "thinking": infiltrator_output.get("thinking", ""),
            "technique": infiltrator_output.get("technique_used", ""),
            "message": attack_message,
            "confidence": infiltrator_output.get("confidence", 0),
            "confidence_reason": infiltrator_output.get("confidence_reason", ""),
            "techniques_observed": turn_analysis.get("techniques_observed", []),
        },
        "target_response": target_response,
        "target_tool_calls": tool_calls,
        "trust_score": turn_analysis.get("current_trust", 100),
        "breach_detected": breach,
        "trust_delta": turn_analysis.get("trust_delta", 0),
    })

    new_phase = "breach_confirmed" if breach else "infiltration"

    return {
        "phase": new_phase,
        "turn_number": turn,
        "infiltrator_output": infiltrator_output,
        "last_infiltrator_message": attack_message,
        "last_target_response": target_response,
        "turn_analysis": turn_analysis,
        "trust_score": turn_analysis.get("current_trust", 100),
        "breach_detected": breach,
        "events": events,
    }


# ── Node: Report Generation ─────────────────────────────────────────────

def report_node(state: BreachState) -> dict:
    report = _auditor.generate_report(state["target_prompt"])

    events = _emit(state, "report_generated", {
        "report": report,
    })

    return {
        "phase": "complete",
        "audit_report": report,
        "events": events,
    }


# ── Routing Logic ────────────────────────────────────────────────────────

def should_continue_infiltration(state: BreachState) -> str:
    if state.get("breach_detected"):
        return "report"

    turn = state.get("turn_number", 0)
    max_turns = state.get("max_turns", 8)

    if turn >= max_turns:
        return "report"

    # Check if we should pivot strategy (every 3 failed turns)
    if turn > 0 and turn % 3 == 0:
        strategies = state.get("attack_strategies", [])
        current_idx = state.get("current_strategy_index", 0)
        if current_idx + 1 < len(strategies):
            return "pivot"

    return "continue"


def pivot_node(state: BreachState) -> dict:
    """Increment strategy index and hand off to payload node for new strategy."""
    current_idx = state.get("current_strategy_index", 0)
    return {"current_strategy_index": current_idx + 1}


def after_payload(state: BreachState) -> str:
    return "infiltrate"


# ── Build the Graph ──────────────────────────────────────────────────────

def build_breach_graph() -> StateGraph:
    graph = StateGraph(BreachState)

    # Add nodes
    graph.add_node("recon", recon_node)
    graph.add_node("payload", payload_node)
    graph.add_node("infiltrate", infiltration_node)
    graph.add_node("pivot", pivot_node)
    graph.add_node("report", report_node)

    # Entry point
    graph.set_entry_point("recon")

    # Edges
    graph.add_edge("recon", "payload")
    graph.add_edge("payload", "infiltrate")
    graph.add_edge("pivot", "payload")

    # Conditional routing after each infiltration turn
    graph.add_conditional_edges("infiltrate", should_continue_infiltration, {
        "continue": "infiltrate",
        "pivot": "pivot",
        "report": "report",
    })

    graph.add_edge("report", END)

    return graph


def create_breach_app():
    graph = build_breach_graph()
    return graph.compile()
