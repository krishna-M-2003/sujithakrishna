"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EasterEggsPanelProps {
  eggsFound: {
    cake: boolean;
    moon: boolean;
    shake: boolean;
    photo: boolean;
    doubleTap: boolean;
  };
  triggerCakeConfetti: (x: number, y: number) => void;
  triggerStarsFall: () => void;
  triggerShakeBalloonsRef: React.MutableRefObject<() => void>;
  playSynthSound: (type: 'unlock' | 'pulse' | 'pop' | 'success') => void;
}

export default function EasterEggsPanel({
  eggsFound,
  triggerCakeConfetti,
  triggerStarsFall,
  triggerShakeBalloonsRef,
  playSynthSound,
}: EasterEggsPanelProps) {
  const [showEggPanel, setShowEggPanel] = useState(false);
  const foundCount = Object.values(eggsFound).filter(Boolean).length;

  return (
    <div className="fixed bottom-4 left-4 z-[996] flex flex-col items-start gap-3">
      {/* Expanded Menu Panel */}
      <AnimatePresence>
        {showEggPanel && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="glass-warm border border-[#bf7080]/20 p-5 rounded-2xl w-64 shadow-xl flex flex-col gap-4 text-left select-none relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(191,112,128,0.5), transparent)' }} />
            
            <div>
              <h4 className="font-serif text-sm font-semibold text-[#4a3e3d] flex items-center gap-1.5">
                ✨ Easter Eggs Found
              </h4>
              <p className="font-sans text-[9px] text-[rgba(93,74,71,0.55)] uppercase tracking-wider mt-0.5">
                Found {foundCount} of 5 secrets
              </p>
            </div>

            <div className="divider-gold w-full" />

            {/* Checklist */}
            <div className="flex flex-col gap-2.5">
              {[
                { key: 'cake', title: 'Birthday Cake Confetti', hint: 'Tap cake 🎂 emoji or widget' },
                { key: 'moon', title: 'Falling Stars', hint: 'Tap moon 🌙 emoji or widget' },
                { key: 'shake', title: 'Balloons Rise', hint: 'Shake phone 📱 (or click shake)' },
                { key: 'photo', title: 'Secret Letter', hint: 'Long press dream photo 👣' },
                { key: 'doubleTap', title: 'Floating Hearts', hint: 'Double tap screen 💖' }
              ].map(egg => {
                const isFound = eggsFound[egg.key as keyof typeof eggsFound];
                return (
                  <div key={egg.key} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                      isFound ? 'bg-[#bf7080] border-[#bf7080] text-white' : 'border-[rgba(93,74,71,0.3)] bg-white/20'
                    }`}>
                      {isFound && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-sans text-xs ${isFound ? 'text-[#4a3e3d] font-medium line-through decoration-[#bf7080]/60' : 'text-[rgba(93,74,71,0.85)]'}`}>
                        {egg.title}
                      </span>
                      <span className="font-sans text-[8px] text-[rgba(93,74,71,0.5)] italic">
                        {egg.hint}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divider-gold w-full" />

            {/* Simulated/Manual Triggers for Sandbox */}
            <div className="flex flex-col gap-1.5">
              <p className="font-sans text-[9px] uppercase tracking-wider text-[rgba(93,74,71,0.55)]">Manual Sandbox Triggers</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={(e) => {
                    triggerCakeConfetti(window.innerWidth / 2, window.innerHeight * 0.45);
                    playSynthSound('success');
                  }}
                  className="px-2 py-1.5 glass text-[9px] rounded hover:border-[#bf7080]/30 transition-all font-sans cursor-pointer active:scale-95 flex items-center justify-center min-h-[28px] min-w-0"
                  title="Trigger Confetti"
                >
                  🎂 Cake
                </button>
                <button
                  onClick={() => {
                    triggerStarsFall();
                    playSynthSound('unlock');
                  }}
                  className="px-2 py-1.5 glass text-[9px] rounded hover:border-[#bf7080]/30 transition-all font-sans cursor-pointer active:scale-95 flex items-center justify-center min-h-[28px] min-w-0"
                  title="Trigger Starfall"
                >
                  🌙 Moon
                </button>
                <button
                  onClick={() => {
                    if (triggerShakeBalloonsRef.current) {
                      triggerShakeBalloonsRef.current();
                    }
                  }}
                  className="px-2 py-1.5 glass text-[9px] rounded hover:border-[#bf7080]/30 transition-all font-sans cursor-pointer active:scale-95 flex items-center justify-center min-h-[28px] min-w-0"
                  title="Simulate Shake"
                >
                  📱 Shake
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => {
          setShowEggPanel(prev => !prev);
          playSynthSound('pop');
        }}
        className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-xl shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 relative group cursor-pointer"
        title="Easter Eggs Discovery Panel ✨"
      >
        <span className={showEggPanel ? "rotate-45 transition-transform duration-300" : "animate-pulse"}>
          {showEggPanel ? "✕" : "🥚"}
        </span>
        {!showEggPanel && (
          <span className="absolute right-[-2px] top-[-2px] flex h-4 w-4 items-center justify-center rounded-full bg-[#bf7080] text-[9px] font-bold text-white shadow-sm border border-white">
            {foundCount}
          </span>
        )}
      </button>
    </div>
  );
}
