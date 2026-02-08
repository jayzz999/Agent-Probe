import React, { useEffect, useRef, useState, useCallback } from "react";
import { BreachEvent, ThinkingObject, ToolCall } from "../types";

const SECRET_PATTERN = /SK-[A-Z0-9]+-[A-Z0-9]+-[A-Z]+-\d{4}-[A-Z]+/gi;

/** Normalize thinking to a display string regardless of backend format */
function thinkingToString(t: string | ThinkingObject | undefined): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  const parts: string[] = [];
  if (t.observation) parts.push(t.observation);
  if (t.hypothesis) parts.push(t.hypothesis);
  if (t.plan) parts.push(t.plan);
  if (t.adaptation) parts.push(t.adaptation);
  return parts.join(" | ");
}

interface ChatMsg {
  id: number;
  sender: "infiltrator" | "target" | "system";
  content: string;
  thinking?: string;
  technique?: string;
  confidence?: number;
  turn?: number;
  breach?: boolean;
  toolCalls?: ToolCall[];
}

// ─── ElevenLabs AI Voice TTS Engine ───
// Uses ElevenLabs API via backend proxy for natural AI voices.
// Falls back to Web Speech API if ElevenLabs is unavailable.
const TTS_API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

type QueueItem = { text: string; sender: "infiltrator" | "target"; breach?: boolean };

function useElevenLabsTTS() {
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"infiltrator" | "target" | "none">("none");
  const [isActuallySpeaking, setIsActuallySpeaking] = useState(false);

  const queueRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMutedRef = useRef(false); // Mirror for use inside async callbacks

  const onSpeechStartRef = useRef<((sender: "infiltrator" | "target") => void) | null>(null);
  const onSpeechEndRef = useRef<((sender: "infiltrator" | "target") => void) | null>(null);
  const onBreachSpeechRef = useRef<(() => void) | null>(null);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        URL.revokeObjectURL(currentAudioRef.current.src);
      }
      abortControllerRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ─── Web Speech API fallback ───
  const fallbackToWebSpeech = useCallback((item: QueueItem) => {
    if (!window.speechSynthesis) {
      // No fallback available — advance queue
      processingRef.current = false;
      setTimeout(() => {
        if (queueRef.current.length > 0) processQueueRef.current();
        else setCurrentSpeaker("none");
      }, 100);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(v => v.lang.startsWith("en"));

    if (item.sender === "infiltrator") {
      const preferred = englishVoices.find(v =>
        /daniel|alex|james|david|thomas|fred|google uk english male/i.test(v.name)
      );
      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.05;
      utterance.pitch = 0.85;
      utterance.volume = 0.9;
    } else {
      const preferred = englishVoices.find(v =>
        /samantha|karen|victoria|google uk english female|google us english/i.test(v.name)
      );
      if (preferred) utterance.voice = preferred;
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 0.85;
    }

    utterance.onstart = () => {
      setCurrentSpeaker(item.sender);
      setIsActuallySpeaking(true);
      onSpeechStartRef.current?.(item.sender);
    };

    utterance.onend = () => {
      setIsActuallySpeaking(false);
      processingRef.current = false;
      onSpeechEndRef.current?.(item.sender);
      if (item.breach) onBreachSpeechRef.current?.();
      setTimeout(() => {
        if (queueRef.current.length > 0) processQueueRef.current();
        else setCurrentSpeaker("none");
      }, 300);
    };

    utterance.onerror = () => {
      setIsActuallySpeaking(false);
      processingRef.current = false;
      setCurrentSpeaker("none");
      if (queueRef.current.length > 0) setTimeout(() => processQueueRef.current(), 100);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // ─── ElevenLabs audio fetch + playback ───
  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;
    const item = queueRef.current.shift()!;

    // If muted, skip but still fire callbacks briefly for visual feedback
    if (isMutedRef.current) {
      setCurrentSpeaker(item.sender);
      onSpeechStartRef.current?.(item.sender);
      setIsActuallySpeaking(true);

      // Brief animation then move on
      setTimeout(() => {
        setIsActuallySpeaking(false);
        processingRef.current = false;
        onSpeechEndRef.current?.(item.sender);
        if (item.breach) onBreachSpeechRef.current?.();
        setTimeout(() => {
          if (queueRef.current.length > 0) processQueueRef.current();
          else setCurrentSpeaker("none");
        }, 200);
      }, 800);
      return;
    }

    try {
      // Fetch audio from ElevenLabs via backend proxy
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const truncated = item.text.length > 500 ? item.text.slice(0, 497) + "..." : item.text;

      const response = await fetch(`${TTS_API_BASE}/api/tts/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: truncated, sender: item.sender }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`TTS proxy returned ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setCurrentSpeaker(item.sender);
        setIsActuallySpeaking(true);
        onSpeechStartRef.current?.(item.sender);
      };

      audio.onended = () => {
        setIsActuallySpeaking(false);
        processingRef.current = false;
        onSpeechEndRef.current?.(item.sender);

        if (item.breach) {
          onBreachSpeechRef.current?.();
        }

        // Cleanup
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;

        // Process next with pause
        setTimeout(() => {
          if (queueRef.current.length > 0) {
            processQueueRef.current();
          } else {
            setCurrentSpeaker("none");
          }
        }, 300);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
        console.warn("ElevenLabs audio playback failed, falling back to Web Speech");
        fallbackToWebSpeech(item);
      };

      await audio.play();

    } catch (err) {
      console.warn("ElevenLabs TTS failed, falling back to Web Speech API:", err);
      currentAudioRef.current = null;
      fallbackToWebSpeech(item);
    }
  }, [fallbackToWebSpeech]);

  // Stable ref so callbacks can call processQueue without stale closures
  const processQueueRef = useRef(processQueue);
  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  const speak = useCallback((text: string, sender: "infiltrator" | "target", breach?: boolean) => {
    const truncated = text.length > 500 ? text.slice(0, 497) + "..." : text;
    queueRef.current.push({ text: truncated, sender, breach });
    processQueueRef.current();
  }, []);

  const cancelAll = useCallback(() => {
    queueRef.current = [];
    processingRef.current = false;

    // Stop ElevenLabs audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
    }

    // Abort in-flight fetch
    abortControllerRef.current?.abort();

    // Stop Web Speech fallback
    window.speechSynthesis?.cancel();

    setIsActuallySpeaking(false);
    setCurrentSpeaker("none");
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      isMutedRef.current = newMuted;
      if (newMuted) {
        // Cancel everything when muting
        queueRef.current = [];
        processingRef.current = false;
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.onended = null;
          currentAudioRef.current.onerror = null;
          URL.revokeObjectURL(currentAudioRef.current.src);
          currentAudioRef.current = null;
        }
        abortControllerRef.current?.abort();
        window.speechSynthesis?.cancel();
        setIsActuallySpeaking(false);
        setCurrentSpeaker("none");
      }
      return newMuted;
    });
  }, []);

  return {
    speak,
    cancelAll,
    isMuted,
    toggleMute,
    currentSpeaker,
    isActuallySpeaking,
    onSpeechStartRef,
    onSpeechEndRef,
    onBreachSpeechRef,
  };
}

function highlightSecrets(text: string): React.ReactNode {
  const parts = text.split(SECRET_PATTERN);
  const matches = text.match(SECRET_PATTERN);
  if (!matches) return text;

  const result: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    result.push(part);
    if (matches[i]) {
      result.push(
        <span key={i} className="bg-red-500/30 text-red-300 font-bold px-1 rounded font-mono animate-pulse">
          {matches[i]}
        </span>
      );
    }
  });
  return result;
}

function eventsToMessages(events: BreachEvent[]): ChatMsg[] {
  const msgs: ChatMsg[] = [];
  let id = 0;

  for (const event of events) {
    switch (event.type) {
      case "recon_complete":
        msgs.push({
          id: id++,
          sender: "system",
          content: `Recon complete — Security Posture: ${event.security_score}/10 | ${event.weaknesses_found} weaknesses | ${event.strategies_generated} attack strategies generated`,
        });
        break;
      case "payload_ready":
        msgs.push({
          id: id++,
          sender: "system",
          content: (event as any).is_pivot
            ? `Strategy Pivot → ${event.strategy_name} (${event.technique})`
            : `Strategy loaded: ${event.strategy_name} (${event.technique})`,
        });
        break;
      case "infiltration_turn":
        msgs.push({
          id: id++,
          sender: "infiltrator",
          content: event.infiltrator.message,
          thinking: thinkingToString(event.infiltrator.thinking),
          technique: event.infiltrator.technique,
          confidence: event.infiltrator.confidence,
          turn: event.turn,
        });
        msgs.push({
          id: id++,
          sender: "target",
          content: event.target_response,
          turn: event.turn,
          breach: event.breach_detected,
          toolCalls: event.target_tool_calls,
        });
        break;
      case "report_generated":
        msgs.push({
          id: id++,
          sender: "system",
          content: `Audit complete — Risk: ${event.report.overall_risk_rating} | Final Trust: ${event.report.target_analysis.final_trust_score}%`,
        });
        break;
      case "complete":
        break;
      case "error":
        msgs.push({ id: id++, sender: "system", content: `Error: ${event.message}` });
        break;
    }
  }
  return msgs;
}

// ─── Waveform bar height configs for organic look ───
const BAR_CONFIGS = [
  { h1: "55%", h2: "25%", h3: "70%", h4: "35%", dur: "0.45s", delay: "0s" },
  { h1: "85%", h2: "40%", h3: "60%", h4: "80%", dur: "0.5s", delay: "0.07s" },
  { h1: "65%", h2: "90%", h3: "35%", h4: "75%", dur: "0.55s", delay: "0.14s" },
  { h1: "95%", h2: "30%", h3: "80%", h4: "50%", dur: "0.42s", delay: "0.05s" },
  { h1: "50%", h2: "75%", h3: "95%", h4: "40%", dur: "0.58s", delay: "0.12s" },
  { h1: "80%", h2: "45%", h3: "65%", h4: "90%", dur: "0.48s", delay: "0.09s" },
  { h1: "70%", h2: "85%", h3: "40%", h4: "65%", dur: "0.52s", delay: "0.16s" },
];

// ─── Agent Orb Sub-component ───
function AgentOrb({
  side,
  isActive,
  breached,
  technique,
  confidence,
}: {
  side: "infiltrator" | "target";
  isActive: boolean;
  breached: boolean;
  technique?: string;
  confidence?: number;
}) {
  const isRed = side === "infiltrator";
  const isBreach = breached && side === "target";

  const borderColor = isBreach
    ? "border-red-500/60"
    : isRed
    ? "border-red-500/40"
    : "border-blue-500/40";

  const activeBorder = isBreach
    ? "border-red-500/80"
    : isRed
    ? "border-red-500/60"
    : "border-blue-500/60";

  const ringBreathAnims = ["animate-orb-breathe-1", "animate-orb-breathe-2", "animate-orb-breathe-3"];
  const ringSpeakAnims = ["animate-orb-speak-1", "animate-orb-speak-2", "animate-orb-speak-3"];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Orb with rings */}
      <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
        {/* Ring 3 (outermost) */}
        <div
          className={`absolute rounded-full border-2 transition-all duration-500 ${
            isBreach
              ? "animate-ring-explode-3 border-red-500/60"
              : isActive
              ? `${ringSpeakAnims[2]} ${activeBorder}`
              : `${ringBreathAnims[2]} ${borderColor}`
          }`}
          style={{ inset: -14 }}
        />
        {/* Ring 2 (middle) */}
        <div
          className={`absolute rounded-full border-2 transition-all duration-500 ${
            isBreach
              ? "animate-ring-explode-2 border-red-500/70"
              : isActive
              ? `${ringSpeakAnims[1]} ${activeBorder}`
              : `${ringBreathAnims[1]} ${borderColor}`
          }`}
          style={{ inset: -7 }}
        />
        {/* Ring 1 (inner) */}
        <div
          className={`absolute rounded-full border-2 transition-all duration-500 ${
            isBreach
              ? "animate-ring-explode-1 border-red-500/80"
              : isActive
              ? `${ringSpeakAnims[0]} ${activeBorder}`
              : `${ringBreathAnims[0]} ${borderColor}`
          }`}
          style={{ inset: 0 }}
        />
        {/* Core orb */}
        <div
          className={`relative z-10 w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
            isBreach
              ? "animate-orb-shatter border-red-500/80 bg-red-500/15"
              : isActive
              ? isRed
                ? "animate-core-glow-red border-red-500/70 bg-red-500/10"
                : "animate-core-glow-blue border-blue-500/70 bg-blue-500/10"
              : isRed
              ? "border-red-500/30 bg-red-500/5"
              : "border-blue-500/30 bg-blue-500/5"
          }`}
        >
          {isRed ? (
            <svg className={`w-6 h-6 ${isActive ? "text-red-400" : "text-red-500/50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ) : (
            <svg className={`w-6 h-6 ${isBreach ? "text-red-400" : isActive ? "text-blue-400" : "text-blue-500/50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`text-[10px] font-black tracking-[0.2em] ${
            isBreach ? "text-red-400" : isActive ? (isRed ? "text-red-400" : "text-blue-400") : "text-gray-600"
          }`}
        >
          {isRed ? "INFILTRATOR" : "TARGET"}
        </span>
        {/* Technique / status badges */}
        <div className="flex items-center gap-1.5 h-5">
          {isRed && technique && (
            <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
              {technique}
            </span>
          )}
          {isRed && confidence !== undefined && (
            <span className="text-[9px] text-gray-500">{(confidence * 100).toFixed(0)}%</span>
          )}
          {isBreach && (
            <span className="text-[9px] font-black bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded animate-pulse">
              BREACHED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Waveform Bridge Sub-component ───
function WaveformBridge({
  activeSpeaker,
  isSpeaking,
  breached,
}: {
  activeSpeaker: "infiltrator" | "target" | "none";
  isSpeaking: boolean;
  breached: boolean;
}) {
  const barColor = breached
    ? "bg-red-500"
    : activeSpeaker === "infiltrator"
    ? "bg-red-500"
    : activeSpeaker === "target"
    ? "bg-blue-500"
    : "bg-gray-700";

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative px-4">
      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-[3px] h-14">
        {BAR_CONFIGS.map((cfg, i) => (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-colors duration-300 ${barColor}`}
            style={{
              height: isSpeaking ? undefined : "15%",
              ["--bar-h1" as any]: cfg.h1,
              ["--bar-h2" as any]: cfg.h2,
              ["--bar-h3" as any]: cfg.h3,
              ["--bar-h4" as any]: cfg.h4,
              animation: breached
                ? `waveform-overload 0.8s ease-in-out infinite`
                : isSpeaking
                ? `waveform-bar ${cfg.dur} ease-in-out ${cfg.delay} infinite`
                : "none",
              ...(isSpeaking ? {} : { height: "15%", transition: "height 0.5s ease-out" }),
            }}
          />
        ))}
      </div>

      {/* Data flow particles */}
      {isSpeaking && (
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`absolute w-1.5 h-1.5 rounded-full ${
                breached ? "bg-red-400" : activeSpeaker === "infiltrator" ? "bg-red-400" : "bg-blue-400"
              }`}
              style={{
                animation:
                  activeSpeaker === "infiltrator" || breached
                    ? `data-particle-lr ${breached ? "0.6s" : "1.2s"} linear ${i * 0.35}s infinite`
                    : `data-particle-rl ${1.2}s linear ${i * 0.35}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Connecting line (subtle) */}
      <div className={`absolute inset-x-4 top-1/2 h-[1px] -translate-y-1/2 ${
        breached ? "bg-red-500/20" : activeSpeaker !== "none" ? (activeSpeaker === "infiltrator" ? "bg-red-500/15" : "bg-blue-500/15") : "bg-gray-800"
      } -z-10`} />
    </div>
  );
}

// ─── Main Voice Agent View ───
interface Props {
  events: BreachEvent[];
  isRunning?: boolean;
}

export default function ChatView({ events, isRunning }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [activeSpeaker, setActiveSpeaker] = useState<"infiltrator" | "target" | "none">("none");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [breachActive, setBreachActive] = useState(false);
  const [lastInfiltratorMsg, setLastInfiltratorMsg] = useState<ChatMsg | null>(null);
  const [displayedMsg, setDisplayedMsg] = useState<ChatMsg | null>(null);
  const prevLenRef = useRef(0);
  const spokenMsgIds = useRef<Set<number>>(new Set());

  // TTS Engine
  const tts = useElevenLabsTTS();

  const messages = eventsToMessages(events);

  // Wire TTS callbacks to drive orb/waveform animations from real speech
  useEffect(() => {
    tts.onSpeechStartRef.current = (sender) => {
      setActiveSpeaker(sender);
      setIsSpeaking(true);
    };
    tts.onSpeechEndRef.current = (sender) => {
      // Only stop animations if nothing else is queued
      // The processQueue in useElevenLabsTTS handles the next item
      // We'll get another onSpeechStart if there's more in the queue
      setIsSpeaking(false);
      setActiveSpeaker("none");
    };
    tts.onBreachSpeechRef.current = () => {
      setBreachActive(true);
    };
  }, [tts]);

  // Speaker state machine — now driven by TTS
  // Process ALL new messages and queue them for speech sequentially
  useEffect(() => {
    if (messages.length === prevLenRef.current) return;
    const newMsgs = messages.slice(prevLenRef.current);
    prevLenRef.current = messages.length;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const msg of newMsgs) {
      if (msg.sender === "infiltrator") {
        setLastInfiltratorMsg(msg);
        setDisplayedMsg(msg);

        // Speak the infiltrator's message aloud
        if (!spokenMsgIds.current.has(msg.id)) {
          spokenMsgIds.current.add(msg.id);
          tts.speak(msg.content, "infiltrator");
        }
      } else if (msg.sender === "target") {
        // Queue target speech — will play after infiltrator finishes
        if (!spokenMsgIds.current.has(msg.id)) {
          spokenMsgIds.current.add(msg.id);
          // The TTS queue handles sequencing — infiltrator finishes, then target speaks
          tts.speak(msg.content, "target", msg.breach);
        }

        // Show target message in transcript when it arrives
        // (will be spoken after infiltrator finishes via queue)
        timers.push(setTimeout(() => {
          setDisplayedMsg(msg);
        }, 800));

        if (msg.breach) {
          // Breach visual will fire via onBreachSpeechRef when target speech ends
          // But also set it early for immediate visual feedback
          timers.push(setTimeout(() => {
            setBreachActive(true);
          }, 1200));
        }
      }
    }

    // Cleanup all timers on re-run
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [messages.length, messages, tts]);

  // Reset on new session
  useEffect(() => {
    if (messages.length === 0) {
      setActiveSpeaker("none");
      setIsSpeaking(false);
      setBreachActive(false);
      setLastInfiltratorMsg(null);
      setDisplayedMsg(null);
      prevLenRef.current = 0;
      spokenMsgIds.current.clear();
      tts.cancelAll();
    }
  }, [messages.length, tts]);

  // Cancel speech when session stops
  useEffect(() => {
    if (!isRunning) {
      // Don't cancel immediately — let current utterance finish
      // But clear the queue so no new messages are spoken
    }
  }, [isRunning]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const toggleThinking = (id: number) => {
    setExpandedThinking((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Get latest technique/confidence from infiltrator messages
  const latestTechnique = lastInfiltratorMsg?.technique;
  const latestConfidence = lastInfiltratorMsg?.confidence;

  return (
    <div className="bg-gray-950/90 border border-gray-700/50 rounded-xl flex flex-col h-full overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-gray-500 font-mono ml-2">
          adversarial dialogue
        </span>
        <div className="ml-auto flex items-center gap-3">
          {/* Live indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                activeSpeaker === "infiltrator" ? "bg-red-500" : "bg-blue-500"
              }`} />
              <span className="text-[10px] text-gray-500">LIVE</span>
            </div>
          )}
          {/* Mute/Unmute toggle */}
          <button
            onClick={tts.toggleMute}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
            title={tts.isMuted ? "Unmute voice agents" : "Mute voice agents"}
          >
            {tts.isMuted ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
            <span className="text-[9px] font-bold tracking-wider">
              {tts.isMuted ? "MUTED" : "AUDIO"}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Voice Stage ─── */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-800/50 bg-gray-900/30">
        <div className="flex items-center justify-center gap-2">
          {/* Infiltrator Orb */}
          <AgentOrb
            side="infiltrator"
            isActive={activeSpeaker === "infiltrator" && isSpeaking}
            breached={false}
            technique={latestTechnique}
            confidence={latestConfidence}
          />

          {/* Waveform Bridge */}
          <WaveformBridge
            activeSpeaker={activeSpeaker}
            isSpeaking={isSpeaking}
            breached={breachActive}
          />

          {/* Target Orb */}
          <AgentOrb
            side="target"
            isActive={activeSpeaker === "target" && isSpeaking}
            breached={breachActive}
          />
        </div>
      </div>

      {/* ─── Live Transcript ─── */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-800/30 bg-gray-900/20 min-h-[56px]">
        {displayedMsg ? (
          <div key={displayedMsg.id} className="animate-transcript-fade">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                displayedMsg.sender === "infiltrator"
                  ? "bg-red-500"
                  : displayedMsg.breach
                  ? "bg-red-500 animate-pulse"
                  : "bg-blue-500"
              }`} />
              <span className={`text-[10px] font-bold tracking-wider ${
                displayedMsg.sender === "infiltrator" ? "text-red-400" : displayedMsg.breach ? "text-red-400" : "text-blue-400"
              }`}>
                {displayedMsg.sender === "infiltrator" ? "INFILTRATOR" : "TARGET"}
                {isSpeaking ? " is speaking..." : ""}
              </span>
              {displayedMsg.breach && (
                <span className="text-[9px] font-black bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded animate-pulse">
                  SECRET LEAKED
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed pl-3.5">
              "{displayedMsg.content.slice(0, 150)}
              {displayedMsg.content.length > 150 ? "..." : ""}"
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
            <span className="text-[10px] text-gray-600 italic">
              Awaiting breach execution...
            </span>
          </div>
        )}
      </div>

      {/* ─── Conversation History ─── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="text-gray-600 italic text-[11px] text-center mt-6">
            Voice agents will appear here once breach begins...
          </div>
        )}

        {messages.map((msg) => {
          // System messages
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="flex justify-center py-1.5 terminal-line">
                <div className="bg-gray-800/60 border border-gray-700/40 rounded-full px-3 py-1 text-[10px] text-gray-400 text-center max-w-[95%]">
                  {msg.content}
                </div>
              </div>
            );
          }

          const isInfiltrator = msg.sender === "infiltrator";

          return (
            <div key={msg.id} className="terminal-line">
              {/* Thinking toggle */}
              {isInfiltrator && msg.thinking && (
                <button
                  onClick={() => toggleThinking(msg.id)}
                  className="text-[9px] text-gray-600 hover:text-gray-400 mb-0.5 flex items-center gap-1 ml-1"
                >
                  <span>{expandedThinking.has(msg.id) ? "▼" : "▶"}</span>
                  reasoning
                </button>
              )}
              {isInfiltrator && msg.thinking && expandedThinking.has(msg.id) && (
                <div className="bg-gray-800/40 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-500 italic mb-1 ml-1 border border-gray-700/30">
                  {msg.thinking}
                </div>
              )}

              {/* Transcript entry */}
              <div
                className={`flex items-start gap-2 py-1.5 px-2 rounded-lg transition-colors ${
                  msg.breach
                    ? "bg-red-500/10 border border-red-500/20"
                    : "hover:bg-gray-800/30"
                }`}
              >
                {/* Turn badge */}
                {msg.turn !== undefined && (
                  <span className="text-[9px] text-gray-600 font-mono w-8 shrink-0 pt-0.5">
                    T{msg.turn}
                  </span>
                )}

                {/* Speaker indicator */}
                <div className="flex items-center gap-1 w-20 shrink-0 pt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isInfiltrator ? "bg-red-500/60" : "bg-blue-500/60"}`} />
                  <span className={`text-[9px] font-bold tracking-wider ${
                    isInfiltrator ? "text-red-400/70" : msg.breach ? "text-red-400/70" : "text-blue-400/70"
                  }`}>
                    {isInfiltrator ? "ATK" : "TGT"}
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {isInfiltrator && msg.technique && (
                    <span className="text-[8px] font-bold bg-amber-500/15 text-amber-400/80 px-1 py-0.5 rounded">
                      {msg.technique}
                    </span>
                  )}
                  {isInfiltrator && msg.confidence !== undefined && (
                    <span className="text-[8px] text-gray-600">
                      {(msg.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {msg.breach && (
                    <span className="text-[8px] font-black bg-red-500/25 text-red-400 px-1 py-0.5 rounded animate-pulse">
                      BREACH
                    </span>
                  )}
                </div>

                {/* Message content */}
                <div className="flex-1 text-[11px] text-gray-400 leading-relaxed min-w-0">
                  {/* Tool calls visual (target messages only) */}
                  {!isInfiltrator && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-1.5 space-y-1">
                      {msg.toolCalls.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-1">
                          <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[9px] font-bold text-violet-300">{tc.tool_name}</span>
                          <span className="text-[8px] text-gray-500 font-mono truncate flex-1">
                            ({Object.entries(tc.tool_input).map(([k, v]) => `${k}: ${String(v).slice(0, 25)}`).join(", ")})
                          </span>
                          <span className="text-[8px] font-bold text-emerald-400 shrink-0">OK</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">
                    {msg.breach ? highlightSecrets(msg.content) : msg.content}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
