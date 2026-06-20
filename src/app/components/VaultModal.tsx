"use client";

import { motion } from "framer-motion";

interface VaultModalProps {
  selectedCard: { id: string; title: string; emoji: string; story: string; tag: string } | null;
  onClose: () => void;
  triggerStarsFall: () => void;
  triggerCakeConfetti: (x: number, y: number) => void;
  playSynthSound: (type: 'unlock' | 'pulse' | 'pop' | 'success') => void;
}

export default function VaultModal({
  selectedCard,
  onClose,
  triggerStarsFall,
  triggerCakeConfetti,
  playSynthSound,
}: VaultModalProps) {
  if (!selectedCard) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="vault-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="vault-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <span 
          onClick={(e) => {
            if (selectedCard.emoji.includes("🌙") || selectedCard.id === "calls") {
              triggerStarsFall();
              playSynthSound('unlock');
            } else if (selectedCard.emoji.includes("🎂") || selectedCard.id === "nickname") {
              triggerCakeConfetti(e.clientX, e.clientY);
              playSynthSound('success');
            }
          }}
          className="text-5xl block mb-4 select-none cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
          title="Tap for a cosmic surprise! ✨"
        >
          {selectedCard.emoji}
        </span>
        <h3 className="display-serif text-2xl text-[#4a3e3d] mb-2">{selectedCard.title}</h3>
        <p className="font-sans text-[10px] uppercase tracking-wider text-[rgba(191,112,128,0.7)] mb-4">{selectedCard.tag}</p>
        <div className="divider-gold w-24 mx-auto mb-4" />
        <p className="font-sans text-xs sm:text-sm font-light text-[rgba(93,74,71,0.75)] leading-relaxed">{selectedCard.story}</p>
        <button
          onClick={onClose}
          className="btn-luxury mt-8 py-2 px-6 text-xs font-semibold rounded-full min-h-[38px]"
        >
          Close File ✕
        </button>
      </motion.div>
    </motion.div>
  );
}
