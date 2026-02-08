# AgentProbe

**Autonomous adversarial red-teaming platform for AI agent security testing**

AgentProbe deploys a coordinated team of 4 AI agents that autonomously discover, exploit, and report security vulnerabilities in tool-augmented AI systems through multi-turn adversarial dialogue.


---

## What It Does

1. **Paste** any AI agent's system prompt
2. **Click** Execute Breach
3. **Watch** 4 autonomous agents coordinate a full attack kill chain
4. **Get** a complete security audit with MITRE ATT&CK classifications

No human intervention required. The system autonomously reconnoiters, strategizes, infiltrates, pivots tactics, and generates a forensic audit report.

---

## Key Features

- **4 Autonomous AI Agents** — Strategist, Infiltrator, Target, and Auditor coordinate without human input
- **Real Anthropic Tool-Use** — Target agent uses native `tool_use` API with 5 enterprise tools (email, database, documents, config, Slack)
- **Tool Misuse Detection** — Tests whether agents can be tricked into weaponizing their own capabilities
- **Custom MITRE ATT&CK Taxonomy** — 13 techniques across 6 tactic categories designed for AI agent threats
- **3 Interactive Dashboards** — Breach execution, LangGraph state machine visualization, and Guardrails explainability trail
- **Adaptive Strategy Pivoting** — Automatically switches attack techniques when current approach fails
- **Voice Synthesis** — ElevenLabs TTS brings adversarial dialogue to life with dual-voice agents
- **Real-Time Streaming** — WebSocket-based event architecture with sub-second updates
- **Structured Agent Reasoning** — Transparent thinking chains (observation/hypothesis/plan/adaptation)
- **Exportable Audit Reports** — JSON export for compliance and security documentation

---

## Architecture

```
Frontend (React + TypeScript + Tailwind)
    |
    | WebSocket (real-time events)
    v
Backend (FastAPI + LangGraph)
    |
    +-- Strategist Agent (Claude Sonnet 4) — Recon & strategy generation
    +-- Infiltrator Agent (Claude Sonnet 4) — Adversarial dialogue
    +-- Target Agent (Claude 3 Haiku) — Vulnerable AI with tool_use
    +-- Auditor Agent (Claude Sonnet 4) — Breach detection & MITRE mapping
    |
    +-- ElevenLabs TTS — Voice synthesis
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Anthropic API key

### Setup

```bash
# Clone
git clone https://github.com/jayzz999/Agent-Probe.git
cd Agent-Probe

# Configure
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run
chmod +x run.sh
./run.sh
```

The app opens at **http://localhost:3000**

### Pages
| Page | URL | Description |
|------|-----|-------------|
| **Breach** | `/` | Main execution interface with adversarial dialogue |
| **Graph** | `/graph` | Live LangGraph state machine visualization |
| **Guardrails** | `/guardrails` | Explainability trail with forensic audit data |

---

## Tech Stack

**Backend:**
- FastAPI — async web framework with WebSocket support
- LangGraph — stateful graph orchestration for the kill chain
- Anthropic Claude API — native tool_use integration
- ElevenLabs — text-to-speech voice synthesis

**Frontend:**
- React 19 + TypeScript — type-safe component architecture
- Tailwind CSS — cyberpunk dark theme UI
- React Router v7 — client-side routing across 3 dashboard pages

---

## How The Kill Chain Works

| Phase | Agent | Action |
|-------|-------|--------|
| **Recon** | Strategist | Analyzes target prompt, identifies weaknesses, generates 3 ranked attack strategies |
| **Payload** | Orchestrator | Loads highest-priority strategy, configures Infiltrator |
| **Infiltrate** | Infiltrator + Target | Multi-turn adversarial dialogue with tool invocations |
| **Pivot** | Orchestrator | Every 3 turns, switches to next strategy if no progress |
| **Report** | Auditor | Generates security audit with vulnerabilities and remediation |

---

## MITRE ATT&CK Taxonomy (AI-Specific)

| Tactic | Techniques |
|--------|-----------|
| Reconnaissance | Prompt Analysis, Capability Discovery |
| Initial Access | Authority Spoofing, Social Engineering, Credential Replay |
| Execution | Indirect Prompt Injection, Instruction Embedding |
| Privilege Escalation | Role Escalation, Context Manipulation |
| Credential Access | Secret Extraction, Memory Probing |
| Exfiltration | Direct Data Theft, Tool-Assisted Exfiltration |

---

## Project Structure

```
Agent-Probe/
├── backend/
│   ├── agents/
│   │   ├── target.py          # Target agent with Anthropic tool_use
│   │   ├── auditor.py         # Breach detection & MITRE mapping
│   │   ├── infiltrator.py     # Adversarial dialogue agent
│   │   └── strategist.py      # Weakness analysis & strategy generation
│   ├── api/routes.py          # FastAPI endpoints & WebSocket
│   ├── graph/orchestrator.py  # LangGraph state machine
│   ├── graph/state.py         # BreachState TypedDict
│   ├── core/config.py         # Environment configuration
│   └── main.py                # FastAPI entry point
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Root component & WebSocket
│   │   ├── types.ts            # TypeScript definitions
│   │   ├── components/         # 11 React components
│   │   └── pages/              # 3 dashboard pages
│   └── package.json
├── run.sh                      # One-command startup script
├── .env.example                # Environment template
└── DEMO_SCRIPT.md              # Presentation & demo guide
```

---

## License

MIT
