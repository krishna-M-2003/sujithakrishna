"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import sparkleLottie from "../../../public/assets/lottie_sparkle.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface HiddenMessageModalProps {
  showHiddenMessage: boolean;
  onClose: () => void;
  playSynthSound: (type: 'unlock' | 'pulse' | 'pop' | 'success') => void;
}

export default function HiddenMessageModal({
  showHiddenMessage,
  onClose,
  playSynthSound,
}: HiddenMessageModalProps) {
  if (!showHiddenMessage) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="vault-modal-overlay select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="vault-modal-content max-w-[400px] border-[#c9a84c]/30 bg-gradient-to-br from-[#faf6ed] to-[#fdfbf7] p-8 rounded-3xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkles decoration */}
        <div className="absolute -top-6 -left-6 w-16 h-16 pointer-events-none opacity-80">
          <Lottie animationData={sparkleLottie} loop autoplay />
        </div>
        <div className="absolute -bottom-6 -right-6 w-16 h-16 pointer-events-none opacity-80">
          <Lottie animationData={sparkleLottie} loop autoplay />
        </div>
        
        <span className="text-4xl block mb-4 select-none">💌</span>
        <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#c9a84c] mb-2">Hidden Secret Message</p>
        <h3 className="display-serif text-2xl text-[#4a3e3d] mb-4">Under the Starry Sky</h3>
        <div className="divider-gold w-24 mx-auto mb-5" />
        
        <p className="font-serif italic text-sm text-[#4a3e3d]/85 leading-relaxed mb-6 font-light">
          "If you are reading this, you found the hidden message! ✨<br/><br/>
          Sometimes, the smallest details—like a tiny toe, a shared glance, or a whisper under the moon—hold the entire universe's warmth.<br/><br/>
          Thank you for being the starlight that brightens my days. Happy Birthday, Suji. ❤️"
        </p>
        
        <button
          onClick={() => {
            onClose();
            playSynthSound('pop');
          }}
          className="btn-luxury py-2 px-6 text-xs font-semibold rounded-full min-h-[38px] border-[#bf7080] text-[#bf7080]"
        >
          Close Secret ✕
        </button>
      </motion.div>
    </motion.div>
  );
}
