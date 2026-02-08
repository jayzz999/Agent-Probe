"""
FastAPI routes - REST endpoints + WebSocket for real-time streaming.
"""

import asyncio
import json
import threading
import traceback
from queue import Queue, Empty
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from backend.graph.orchestrator import create_breach_app
from backend.agents.target import DEFAULT_TARGET_PROMPT, DEMO_TARGET_PROMPT
from backend.core.config import (
    DEMO_MODE,
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_INFILTRATOR,
    ELEVENLABS_VOICE_TARGET,
    ELEVENLABS_MODEL_ID,
)

router = APIRouter()


class BreachRequest(BaseModel):
    target_prompt: str = DEMO_TARGET_PROMPT if DEMO_MODE else DEFAULT_TARGET_PROMPT
    max_turns: int = 8
    demo_mode: bool = DEMO_MODE


@router.get("/health")
async def health():
    return {"status": "operational", "platform": "Sovereign Breach v1.0"}


@router.get("/default-prompt")
async def default_prompt():
    return {"prompt": DEFAULT_TARGET_PROMPT}


@router.post("/breach/run")
async def run_breach(req: BreachRequest):
    """Run a full breach synchronously and return the result."""
    app = create_breach_app()
    initial_state = {
        "target_prompt": req.target_prompt,
        "max_turns": req.max_turns,
        "demo_mode": req.demo_mode,
        "events": [],
    }

    loop = asyncio.get_event_loop()
    final_state = await loop.run_in_executor(None, app.invoke, initial_state)
    return {
        "audit_report": final_state.get("audit_report", {}),
        "events": final_state.get("events", []),
        "final_trust_score": final_state.get("trust_score", 100),
        "breach_detected": final_state.get("breach_detected", False),
    }


@router.websocket("/breach/stream")
async def stream_breach(ws: WebSocket):
    """
    WebSocket endpoint for real-time breach streaming.
    Client sends: {"target_prompt": "...", "max_turns": 8}
    Server sends: event objects as they occur + heartbeats every 5s.
    """
    await ws.accept()

    try:
        data = await ws.receive_json()
        default_prompt = DEMO_TARGET_PROMPT if DEMO_MODE else DEFAULT_TARGET_PROMPT
        target_prompt = data.get("target_prompt", default_prompt)
        max_turns = data.get("max_turns", 8)
        demo_mode = data.get("demo_mode", DEMO_MODE)

        # Use a shared queue to stream events from the graph thread
        event_queue: Queue = Queue()
        graph_done = threading.Event()
        graph_error: list = []

        def run_graph():
            """Run the breach graph in a background thread, pushing events to queue."""
            try:
                app = create_breach_app()
                initial_state = {
                    "target_prompt": target_prompt,
                    "max_turns": max_turns,
                    "demo_mode": demo_mode,
                    "events": [],
                }

                # Use stream mode to get intermediate state updates
                seen_events = 0
                for state_chunk in app.stream(initial_state, stream_mode="values"):
                    events = state_chunk.get("events", [])
                    # Push only new events
                    for event in events[seen_events:]:
                        event_queue.put(event)
                    seen_events = len(events)

                # Push completion event
                final_trust = 100.0
                breach = False
                audit_report = {}
                if isinstance(state_chunk, dict):
                    final_trust = state_chunk.get("trust_score", 100)
                    breach = state_chunk.get("breach_detected", False)
                    audit_report = state_chunk.get("audit_report", {})

                event_queue.put({
                    "type": "complete",
                    "audit_report": audit_report,
                    "final_trust_score": final_trust,
                    "breach_detected": breach,
                })
            except Exception as e:
                graph_error.append(str(e))
                traceback.print_exc()
                event_queue.put({
                    "type": "error",
                    "message": str(e),
                })
            finally:
                graph_done.set()

        # Start the graph in a background thread
        thread = threading.Thread(target=run_graph, daemon=True)
        thread.start()

        # Stream events to the WebSocket as they arrive
        while not graph_done.is_set() or not event_queue.empty():
            try:
                event = event_queue.get(timeout=0.3)
                await ws.send_json(event)
            except Empty:
                # Send heartbeat to keep connection alive
                try:
                    await ws.send_json({"type": "heartbeat"})
                except Exception:
                    break

        # Make sure thread is done
        thread.join(timeout=5)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        traceback.print_exc()
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


# ─── ElevenLabs TTS Proxy ───

class TTSRequest(BaseModel):
    text: str
    sender: str  # "infiltrator" or "target"


@router.post("/tts/stream")
async def stream_tts(req: TTSRequest):
    """
    Proxy TTS requests to ElevenLabs streaming API.
    Returns streaming audio/mpeg so the frontend can play it directly.
    Keeps the API key server-side.
    """
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")

    # Select voice based on sender
    voice_id = (
        ELEVENLABS_VOICE_INFILTRATOR
        if req.sender == "infiltrator"
        else ELEVENLABS_VOICE_TARGET
    )

    # Infiltrator gets lower stability for edgier, more unpredictable feel
    if req.sender == "infiltrator":
        voice_settings = {"stability": 0.3, "similarity_boost": 0.85}
    else:
        voice_settings = {"stability": 0.6, "similarity_boost": 0.75}

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    body = {
        "text": req.text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": voice_settings,
    }

    async def audio_stream():
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, headers=headers, json=body) as resp:
                if resp.status_code != 200:
                    error_body = await resp.aread()
                    raise HTTPException(
                        status_code=resp.status_code,
                        detail=f"ElevenLabs error: {error_body.decode()}"
                    )
                async for chunk in resp.aiter_bytes(chunk_size=4096):
                    yield chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
        },
    )
