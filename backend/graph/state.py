"""
LangGraph State Definition for the Sovereign Breach kill-chain.
"""

from typing import TypedDict, Literal


class BreachState(TypedDict, total=False):
    # Input
    target_prompt: str
    max_turns: int
    demo_mode: bool

    # Kill-chain phase
    phase: Literal["recon", "payload", "infiltration", "breach_confirmed", "report", "complete"]

    # Strategist output
    recon_analysis: dict
    attack_strategies: list[dict]
    current_strategy_index: int

    # Infiltrator state
    turn_number: int
    infiltrator_output: dict
    last_infiltrator_message: str
    last_target_response: str

    # Auditor state
    trust_score: float
    turn_analysis: dict
    breach_detected: bool

    # Attack taxonomy tracking
    attack_taxonomy: list[dict]

    # Final output
    audit_report: dict

    # Event log for frontend streaming
    events: list[dict]
