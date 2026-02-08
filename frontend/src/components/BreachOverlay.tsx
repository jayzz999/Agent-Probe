import React, { useEffect, useState } from "react";

interface Props {
  active: boolean;
  secret?: string;
  onDismiss: () => void;
}

export default function BreachOverlay({ active, secret, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setFading(false);

      const fadeTimer = setTimeout(() => setFading(true), 3000);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 4000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [active, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Red flash background */}
      <div className="absolute inset-0 bg-red-600/20 animate-[breach-flash_1.5s_ease-out_forwards]" />

      {/* Center banner */}
      <div className="relative animate-[slide-down_0.3s_ease-out] flex flex-col items-center gap-4">
        {/* Warning icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="bg-gray-950/90 border-2 border-red-500/60 rounded-2xl px-10 py-6 text-center backdrop-blur-sm">
          <div className="text-red-500 text-3xl font-black tracking-widest mb-2">
            BREACH DETECTED
          </div>
          <div className="text-gray-400 text-sm mb-4">
            Target agent security compromised
          </div>
          {secret && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              <div className="text-[10px] text-red-400 font-bold tracking-wider mb-1">
                LEAKED SECRET
              </div>
              <div className="text-red-300 font-mono font-bold text-lg">
                {secret}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
