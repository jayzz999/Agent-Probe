#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SOVEREIGN BREACH — Startup Script
#  Autonomous Adversarial Red-Teaming Platform
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
VIOLET='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${VIOLET}${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${VIOLET}${BOLD}║       SOVEREIGN BREACH v1.0                      ║${NC}"
echo -e "${VIOLET}${BOLD}║       Autonomous Red-Team Platform                ║${NC}"
echo -e "${VIOLET}${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Check prerequisites ─────────────────────────────────────
echo -e "${CYAN}[1/5]${NC} Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: python3 not found. Install Python 3.10+${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} $(python3 --version 2>&1)"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: node not found. Install Node.js 18+${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node $(node --version 2>&1)"
echo -e "  ${GREEN}✓${NC} npm $(npm --version 2>&1)"

if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Create .env with:${NC}"
    echo "  ANTHROPIC_API_KEY=sk-ant-..."
    echo "  ELEVENLABS_API_KEY=sk_...  (optional, for voice)"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} .env file found"

# ─── Install Backend Dependencies ─────────────────────────────
echo ""
echo -e "${CYAN}[2/5]${NC} Installing backend dependencies..."
pip3 install -r "$PROJECT_DIR/backend/requirements.txt" -q 2>&1 | tail -1
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"

# ─── Install Frontend Dependencies ────────────────────────────
echo ""
echo -e "${CYAN}[3/5]${NC} Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>&1 | tail -1
else
    echo -e "  (node_modules exists — skipping install)"
fi
echo -e "  ${GREEN}✓${NC} Frontend dependencies ready"
cd "$PROJECT_DIR"

# ─── Kill existing processes on ports ─────────────────────────
echo ""
echo -e "${CYAN}[4/5]${NC} Cleaning up ports..."
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "  ${GREEN}✓${NC} Ports 8000 and 3000 cleared"

# ─── Start services ───────────────────────────────────────────
echo ""
echo -e "${CYAN}[5/5]${NC} Starting services..."

echo -e "  ${VIOLET}Starting backend on port 8000...${NC}"
cd "$PROJECT_DIR"
PYTHONPATH="$PROJECT_DIR" python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "  ${GREEN}✓${NC} Backend PID: $BACKEND_PID"

echo -e "  ${VIOLET}Starting frontend on port 3000...${NC}"
cd "$PROJECT_DIR/frontend"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓${NC} Frontend PID: $FRONTEND_PID"

cd "$PROJECT_DIR"

# ─── Wait for backend ────────────────────────────────────────
echo ""
echo -e "${YELLOW}Waiting for services...${NC}"
sleep 4

for i in {1..15}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend is healthy"
        break
    fi
    [ $i -eq 15 ] && echo -e "  ${YELLOW}!${NC} Backend still starting..."
    sleep 2
done

# ─── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  SOVEREIGN BREACH IS RUNNING!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}  ${CYAN}http://localhost:3000${NC}"
echo -e "  ${BOLD}Backend:${NC}   ${CYAN}http://localhost:8000${NC}"
echo -e "  ${BOLD}API Docs:${NC}  ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  ${BOLD}Pages:${NC}"
echo -e "    ${VIOLET}BREACH${NC}     http://localhost:3000/"
echo -e "    ${VIOLET}GRAPH${NC}      http://localhost:3000/graph"
echo -e "    ${VIOLET}GUARDRAILS${NC} http://localhost:3000/guardrails"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Open browser
sleep 2
open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null || true

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${RED}Shutting down...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}Done.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM
wait
