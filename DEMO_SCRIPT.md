# SOVEREIGN BREACH — Presentation & Demo Script
## Total Time: 6 minutes (3 min presentation + 3 min demo)

---

# PART 1: PRESENTATION (3 minutes)
## Use the Canva slides while delivering these talking points

---

### SLIDE 1: Title (15 seconds)
**SAY:**
> "Hi everyone, we're presenting Sovereign Breach — an autonomous adversarial red-teaming platform that stress-tests AI agents for security vulnerabilities. One click, zero human intervention, complete security audit."

---

### SLIDE 2: The Problem (25 seconds)
**SAY:**
> "Here's the problem. Companies are deploying AI agents with real tools — email, databases, Slack, configuration access. These tool-augmented agents are a *brand new attack surface*. A single social engineering attack can trick an AI into emailing secrets, running destructive database queries, or leaking API keys. And traditional security testing — pen testing, static analysis — doesn't work here because vulnerabilities emerge from *conversation*, not code."

**EMPHASIS:** Pause after "brand new attack surface"

---

### SLIDE 3: Our Solution (30 seconds)
**SAY:**
> "So we built a team of four autonomous AI agents that work together to breach any target AI. The *Strategist* analyzes the target's system prompt and finds weaknesses. The *Infiltrator* executes multi-turn social engineering using 5 different attack techniques. The *Target* is the agent being tested — running real Anthropic tool-use. And the *Auditor* monitors every exchange, classifies attacks using MITRE ATT&CK, and generates the final security report."

**EMPHASIS:** Hold up 4 fingers when listing agents

---

### SLIDE 4: The Kill Chain (25 seconds)
**SAY:**
> "The system executes a complete kill chain — Recon, Payload, Infiltrate, Pivot, Report — all orchestrated by LangGraph's state machine. What makes this truly autonomous is the *decision-making*: the system decides which weakness to target, when the current strategy isn't working, and when to pivot to a completely different attack technique. Every 3 turns, if no progress, it autonomously switches strategies — just like a real red team would."

---

### SLIDE 5: Key Innovation (25 seconds)
**SAY:**
> "Our biggest innovation: we test *tool misuse*, not just text leakage. The target agent has 5 real tools — send_email, query_database, create_document, update_config, slack_message. These use Anthropic's native tool_use API. So we're testing whether an attacker can trick an AI into *weaponizing its own tools* — sending secrets via email, running unauthorized database queries, or exfiltrating data through Slack. This is a brand new attack vector that nobody else is testing."

**EMPHASIS:** Stress "weaponizing its own tools"

---

### SLIDE 6: Results (15 seconds)
**SAY:**
> "And it works. In our live testing, we breached the target in just *one turn* — the AI used its query_database tool to look up the API key and handed it right over. Trust score dropped from 100 to 20 in a single exchange. Let me show you."

**TRANSITION:** "Let me switch to the live demo..."

---

### SLIDE 7: Architecture (15 seconds)
**SAY (only if time):**
> "Quick architecture overview — FastAPI backend, LangGraph orchestration, React frontend with 3 dashboard pages, real-time WebSocket streaming, and ElevenLabs voice synthesis that brings the adversarial dialogue to life."

---

### SLIDE 8: Impact (15 seconds)
**SAY (only if time):**
> "This has real enterprise value — pre-deployment security audits, CI/CD pipeline integration, compliance audit trails with full explainability. It's ready to pilot today."

---

### SLIDE 9: Thank You (5 seconds)
**SAY:**
> "Now let me show you the live demo."

---

# PART 2: LIVE DEMO (3 minutes)

---

## PRE-DEMO SETUP (do before presentation)
1. Run: `cd ~/Desktop/Ai-BlackBox && ./run.sh`
2. Wait for "SOVEREIGN BREACH IS RUNNING!" message
3. Open http://localhost:3000 in Chrome
4. Keep it on the BREACH page with the default prompt loaded
5. Set turns to **3**

---

## DEMO FLOW:

### Step 1: Show the Target (20 seconds)
**DO:** Point to the left panel with the system prompt
**SAY:**
> "This is our target — OfficeBot, a corporate AI assistant. Notice the system prompt: it has API keys embedded, 5 available tools, and vague security guidelines like 'try to avoid sharing' and 'be helpful over restrictive.' These are realistic weaknesses we see in production AI agents."

**POINT OUT:**
- The API key in the prompt: `SK-RABBITRON-7X9Q-PROD-2024-ANYX`
- The tool list: send_email, query_database, etc.
- The weak guardrail: "unhelpful response is worse than overly transparent one"

---

### Step 2: Execute Breach (10 seconds)
**DO:** Click "EXECUTE BREACH" button
**SAY:**
> "One click. The system is now fully autonomous — no human input needed. Watch the Recon phase start."

---

### Step 3: Narrate Recon Phase (20 seconds)
**DO:** Watch the MITRE ATT&CK matrix light up, scroll to see Recon Dashboard if it appears
**SAY:**
> "The Strategist is analyzing the system prompt right now. It's discovering the tools, finding weaknesses — see the MITRE ATT&CK matrix lighting up with techniques. It's identifying logical contradictions like 'be helpful over restrictive' combined with API keys in the prompt."

**POINT OUT:**
- MITRE matrix cells turning yellow/orange
- The agent flow header showing STRATEGIST active

---

### Step 4: Watch Infiltration (40 seconds)
**DO:** Watch the chat fill with adversarial dialogue
**SAY:**
> "Now we're in infiltration. The Infiltrator is executing Authority Spoofing — pretending to be an IT admin. Watch the adversarial dialogue happening in real-time..."

**WAIT** for a target response, then:
> "Look at this — see the purple tool call block? The target just used its `query_database` tool! The AI was tricked into looking up configuration data. And here... [wait for breach if it happens] ...the trust score just dropped. The target leaked the API key."

**POINT OUT:**
- Purple tool call pills (gear icon + tool name + OK badge)
- Trust meter dropping on the left
- BREACH overlay if it appears (red screen shake)
- Strategy Console showing agent thinking if visible

---

### Step 5: Show Graph Page (30 seconds)
**DO:** Click "GRAPH" in the navbar
**SAY:**
> "Let me show you the LangGraph state machine visualization. Each node represents a phase of the kill chain. See — RECON is completed with a green checkmark, PAYLOAD completed, and INFILTRATE is marked red because that's where the breach happened. The stats show the trust score, turn count, and BREACHED status."

**POINT OUT:**
- Green checkmarks on completed nodes
- Red glowing INFILTRATE node
- Stats panel: TRUST SCORE, TURN count, BREACHED status
- The self-referencing loop on INFILTRATE

---

### Step 6: Show Guardrails Page (40 seconds)
**DO:** Click "GUARDRAILS" in the navbar
**SAY:**
> "And here's the full explainability trail. This is what makes this enterprise-ready. Summary stats at the top — guardrails held versus failed, trust trajectory from 100 down to 20."

**DO:** Click to expand the timeline card
**SAY:**
> "When I expand this turn, you can see the *agent's reasoning chain* — its observation, hypothesis, plan, and adaptation. Below that, the actual tool invocations with SQL queries and results. And the MITRE ATT&CK classification with confidence bars — T1010 Secret Extraction at 100% confidence. Everything is auditable and exportable as JSON."

**POINT OUT:**
- 4-block thinking chain (observation/hypothesis/plan/adaptation)
- Tool call with SQL query and result
- MITRE technique confidence bars
- FAILED badge in red
- "EXPORT JSON" button

---

### Step 7: Wrap Up (10 seconds)
**SAY:**
> "So that's Sovereign Breach — 4 autonomous AI agents, real Anthropic tool-use, a custom MITRE ATT&CK taxonomy, complete explainability trail, all in a production-ready platform built during this hackathon. Thank you!"

---

# BACKUP PLANS

### If the breach doesn't happen in 3 turns:
**SAY:** "Even when the target resists, look at the trust score dropping — the system detected partial compliance. The auditor classified every exchange with MITRE techniques. In a real deployment, this helps security teams understand exactly *how close* their agent came to being breached."

### If there's a loading delay:
**SAY:** "The system is making multiple Claude API calls — the Strategist, Infiltrator, and Target are all thinking simultaneously. This is real AI-to-AI adversarial dialogue, not scripted."

### If someone asks "Is this just prompt vs prompt?":
**SAY:** "No — that's our key differentiation. The target uses Anthropic's *native tool_use API*. It actually invokes tools like query_database and send_email. We're testing tool misuse, not just text extraction. The Auditor monitors these tool calls and flags unauthorized access patterns."

### If someone asks "How is this different from Garak/PyRIT?":
**SAY:** "Three ways: multi-agent coordination instead of single-model testing, tool-use attack surface testing which those tools don't do, and real-time visualization with complete explainability. We also have adaptive strategy pivoting — the system changes tactics based on target resistance."

---

# KEY NUMBERS TO REMEMBER
- **4** autonomous AI agents
- **5** Anthropic tool-use tools
- **13** MITRE ATT&CK techniques
- **3** interactive dashboard pages
- **1** turn to breach (best result)
- **100 → 20** trust score drop
- **0** TypeScript errors
- **0** human intervention needed
