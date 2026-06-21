"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const MiniGamesHub = dynamic(() => import("./components/MiniGamesHub"), { ssr: false });
const VaultModal = dynamic(() => import("./components/VaultModal"), { ssr: false });
const EasterEggsPanel = dynamic(() => import("./components/EasterEggsPanel"), { ssr: false });
const HiddenMessageModal = dynamic(() => import("./components/HiddenMessageModal"), { ssr: false });

import pulseLottie from "../../public/assets/lottie_pulse.json";
import sparkleLottie from "../../public/assets/lottie_sparkle.json";
import {
  FiHeadphones,
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
} from "react-icons/fi";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────
interface Track { name: string; artist: string; src: string; duration: string; }
interface Particle {
  x: number; y: number; tx: number; ty: number;
  angle: number; innerOffset: number; size: number; speed: number;
  color: string; alpha: number; vx: number; vy: number;
  friction: number; interactiveStrength: number;
}
interface Star {
  x: number; y: number; size: number; baseAlpha: number;
  alpha: number; twinkleSpeed: number; twinkleDirection: number; color: string;
}
interface ShootingStar {
  x: number; y: number; length: number; speed: number;
  dx: number; dy: number; alpha: number; width: number;
}
interface Ripple { x: number; y: number; radius: number; maxRadius: number; speed: number; strength: number; }
interface FallingStar {
  x: number; y: number; speedY: number; speedX: number;
  size: number; color: string; alpha: number; angle: number; spin: number;
}

// ─────────────────────────────────────────────────────────
// AUDIO SYNTHESIZER
// ─────────────────────────────────────────────────────────
class EmotionalSynthesizer {
  private ctx: AudioContext | null = null;
  private outputGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  private chords = [
    [130.81, 196.00, 261.63, 329.63, 392.00],
    [174.61, 261.63, 349.23, 440.00, 523.25],
    [110.07, 164.81, 220.00, 329.63, 392.00],
    [146.83, 220.00, 293.66, 349.23, 440.00],
  ];
  private activeNodes: OscillatorNode[] = [];
  private synthInterval: ReturnType<typeof setInterval> | null = null;
  public active = false;

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.outputGain = this.ctx.createGain();
    this.outputGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime);
    this.feedbackNode = this.ctx.createGain();
    this.feedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.delayNode.connect(this.feedbackNode);
    this.feedbackNode.connect(this.delayNode);
    this.outputGain.connect(this.ctx.destination);
    this.delayNode.connect(this.outputGain);
  }
  start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (this.outputGain) this.outputGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.5);
    this.active = true;
    this.playChordLoop();
    this.playMelodyLoop();
  }
  stop() {
    if (!this.ctx || !this.outputGain) return;
    this.outputGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 1.0);
    setTimeout(() => {
      if (this.synthInterval) clearInterval(this.synthInterval);
      this.activeNodes.forEach(n => { try { n.stop(); } catch (e) { } });
      this.activeNodes = [];
      this.active = false;
    }, 1100);
  }
  destroy() {
    this.stop();
    setTimeout(() => {
      if (this.ctx) {
        this.ctx.close().catch(() => { });
        this.ctx = null;
      }
    }, 1200);
  }
  playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
    if (!this.ctx || this.ctx.state === "suspended" || !this.active || !this.outputGain || !this.delayNode) return;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration - 0.1);
    osc.connect(gainNode);
    gainNode.connect(this.outputGain);
    gainNode.connect(this.delayNode);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
    this.activeNodes.push(osc);
    setTimeout(() => {
      const idx = this.activeNodes.indexOf(osc);
      if (idx > -1) this.activeNodes.splice(idx, 1);
    }, duration * 1000 + 200);
  }
  playChordLoop() {
    let chordIndex = 0;
    const triggerChord = () => {
      if (!this.active) return;
      this.chords[chordIndex].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 6.0, "triangle", 0.03), idx * 150);
      });
      chordIndex = (chordIndex + 1) % this.chords.length;
    };
    triggerChord();
    this.synthInterval = setInterval(triggerChord, 7000);
  }
  playMelodyLoop() {
    const triggerMelody = () => {
      if (!this.active) return;
      if (Math.random() > 0.35) {
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];
        this.playTone(freq, Math.random() * 2 + 2, "sine", 0.05);
      }
      setTimeout(triggerMelody, Math.random() * 1500 + 1000);
    };
    setTimeout(triggerMelody, 2000);
  }
}

// ─────────────────────────────────────────────────────────
// PLAYLIST
// ─────────────────────────────────────────────────────────
const playlist: Track[] = [
  { name: "Unnai Kaanadhu Naan", artist: "Kamal Haasan & Shankar Mahadevan", src: "https://dl.masswala.com/Kamal/Vishwaroopam/Unnai_Kaanadhu_Naan_[MassWala.Com].mp3", duration: "5:37" },
  { name: "Anu Vidhaiththa Boomiyile", artist: "Kamal Haasan & Nikhil D'Souza", src: "https://dl.masswala.com/Kamal/Vishwaroopam/Anu_Vidhaiththa_Boomiyile_[MassWala.Com].mp3", duration: "4:16" },
  { name: "Procedural Stardust Melodies", artist: "Procedural Synthesizer", src: "synth", duration: "∞" },
];

const finalMessages = [
  "Today, we celebrate the day the universe got a little brighter. ✨",
  "Happy Birthday, Suji. 🐭",
  "You are a beautiful constellation of laughter, grace, and kindness.",
  "Every small memory with you is a star that shines forever.",
  "Even on the quietest days, your presence makes the world warmer.",
  "No matter how far the paths lead...",
  "May your heart always find reasons to smile. ❤️",
  "May this new year bring you infinite peace,",
  "Gentle days, and endless warmth.",
  "This space was crafted to remind you of how special you are.",
  "Happy Birthday, Suji. 🐭 ✨",
  "With gratitude, kindness, and love."
];

const introTexts = [
  "Before you enter, please make sure your sound is turned on. 🎧",
  "This is not a normal website. It is an interactive birthday movie.",
  "Every animation, every scene was handcrafted for one special person.",
  "A story made of stardust, laughter, and sweet memories.",
  "Are you ready to open your gift, Suji? 🐭"
];

const vaultCards = [
  {
    id: "nickname",
    emoji: "🐭",
    title: "The Nicknames",
    tag: "A Cosmic Connection",
    story: "From 'Sujitha' to 'Suji', each name carries a story of laughter, a tiny mouse emoji 🐭, and a connection that is uniquely ours. It's the small words that hold the greatest warmth."
  },
  {
    id: "fights",
    emoji: "🤜",
    title: "Epic Disputes",
    tag: "Storms & Silences",
    story: "Remembering our silly disputes and dramatic silence phases that always ended in laughter. Those arguments only proved how deeply we care, turning every storm into a quiet, comforting breeze."
  },
  {
    id: "calls",
    emoji: "📞🌙",
    title: "Midnight Hours",
    tag: "Whispers in the Dark",
    story: "Endless hours talking under the moon 🌙, sharing secrets, hopes, and silent comforts. The comfort of knowing someone is listening, sharing laughter in the dark, under the exact same sky."
  },
  {
    id: "silly",
    emoji: "🤪",
    title: "Silly Moments",
    tag: "Pure Happiness",
    story: "Being completely weird and silly together without any judgments. True comfort is when you can laugh at the most ridiculous jokes and know you're completely understood."
  },
  {
    id: "angry",
    emoji: "😡",
    title: "Cute Angry Face",
    tag: "The Pout",
    story: "The way your face looks when you get angry, pouting with endless cuteness. It is impossible to stay serious when you look that adorable!"
  },
  {
    id: "dreams",
    emoji: "☁️",
    title: "Future Hopes",
    tag: "Quiet Aspirations",
    story: "A list of beautiful aspirations and quiet dreams. Like stars in the sky, we hope to reach them step by step, with patience, kindness, and relentless faith."
  }
];

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function Home() {
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("5:37");
  const [progressBarWidth, setProgressBarWidth] = useState("0%");
  const [isCandleExtinguished, setIsCandleExtinguished] = useState(false);
  const [candleSubheader, setCandleSubheader] = useState("A virtual candle, made only for you. Tap the flame to blow it out.");
  const [candleInteractText, setCandleInteractText] = useState("Tap the flame to blow it out");
  const [isMobile, setIsMobile] = useState(false);

  // ─── NEW INTERACTIVE NARRATIVE STATES ───
  const [storyStage, setStoryStage] = useState<'gift-intro' | 'gift-open' | 'experience' | 'grand-celebration' | 'ending-screen'>('gift-intro');
  const [introStep, setIntroStep] = useState(0);
  const [isGiftOpened, setIsGiftOpened] = useState(false);
  const [balloons, setBalloons] = useState<{ id: number; x: number; color: string; speed: number; delay: number; popped: boolean }[]>([]);
  const [popSplashes, setPopSplashes] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [acceptedRules, setAcceptedRules] = useState<boolean[]>([false, false, false, false]);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{ id: string; title: string; emoji: string; story: string; tag: string } | null>(null);
  const [smileLevel, setSmileLevel] = useState(1);

  // Game 1 score (shared with Chapter I welcome panel)
  const [popScore, setPopScore] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Final message state
  const [messageIndex, setMessageIndex] = useState(0);

  // ─── EASTER EGGS STATES & REFS ───
  const [showHiddenMessage, setShowHiddenMessage] = useState(false);
  const [eggsFound, setEggsFound] = useState({
    cake: false,
    moon: false,
    shake: false,
    photo: false,
    doubleTap: false,
  });
  const [shakeToast, setShakeToast] = useState(false);

  const fallingStarsRef = useRef<FallingStar[]>([]);
  const triggerShakeBalloonsRef = useRef<() => void>(() => { });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<EmotionalSynthesizer | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalHeartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement | null>(null);
  const outroRef = useRef<HTMLDivElement | null>(null);
  const candleZoneRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const cursorCoords = useRef({ x: 0, y: 0 });
  const ringCoords = useRef({ x: 0, y: 0 });
  const cursorTrail = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }[]>([]);
  // Gyroscope parallax for mobile
  const gyroOffset = useRef({ x: 0, y: 0 });
  const pointerOnHeart = useRef({ x: -999, y: -999, active: false });
  const pointerOnFinalHeart = useRef({ x: -999, y: -999, active: false });

  // Celebration Ref Pools (Scene 10 Finale)
  const activeFireworks = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; decay: number }[]>([]);
  const activeRosePetals = useRef<{ x: number; y: number; size: number; speedY: number; speedX: number; angle: number; angleSpeed: number; color: string }[]>([]);
  const activeHearts = useRef<{ x: number; y: number; size: number; speedY: number; vx: number; alpha: number; color: string }[]>([]);
  const stageRef = useRef(storyStage);

  useEffect(() => {
    stageRef.current = storyStage;
  }, [storyStage]);

  if (!synthRef.current && typeof window !== "undefined") {
    synthRef.current = new EmotionalSynthesizer();
  }

  // ─── Detect mobile once on mount ───
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024 || ("ontouchstart" in window || navigator.maxTouchPoints > 0));
    check();
  }, []);

  // ─── SYNTH SOUNDS ───
  const playSynthSound = useCallback((type: 'unlock' | 'pulse' | 'pop' | 'success') => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'unlock') {
        [300, 450, 600, 900].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
          }, idx * 100);
        });
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.45);
          }, idx * 120);
        });
      } else if (type === 'pulse') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 220;
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) { }
  }, []);

  // ─── STAGE EFFECTS ───
  useEffect(() => {
    if (storyStage === 'experience') {
      setIsIntroFinished(true);
      setIsMuted(false);
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      playSynthSound('unlock');
      setEggsFound(prev => ({ ...prev, doubleTap: true }));
    } else {
      document.documentElement.classList.add("no-scroll");
      document.body.classList.add("no-scroll");
    }
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        ScrollTrigger.refresh();
      }, 150);
    }
  }, [storyStage, playSynthSound]);



  // Balloons generator for Scene 3
  useEffect(() => {
    if (storyStage === 'experience') {
      const colors = ['#f7b5b5', '#fbcbc9', '#ffd7dd', '#f5b5a7', '#bf7080', '#e8c060'];
      const arr = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 85 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 8 + 8,
        delay: Math.random() * 15,
        popped: false,
      }));
      setBalloons(arr);
    }
  }, [storyStage]);

  // Update triggerShakeBalloonsRef
  useEffect(() => {
    triggerShakeBalloonsRef.current = () => {
      const colors = ['#f7b5b5', '#fbcbc9', '#ffd7dd', '#f5b5a7', '#bf7080', '#e8c060'];
      const newBalloons = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 85 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 5 + 6,
        delay: Math.random() * 1.5,
        popped: false,
      }));
      setBalloons(prev => [...prev, ...newBalloons]);
      playSynthSound('success');
      setEggsFound(prev => ({ ...prev, shake: true }));
      setShakeToast(true);
      setTimeout(() => setShakeToast(false), 2500);
    };
  }, [playSynthSound]);

  // Typewriter effect handler for final messages in Scene 10
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (storyStage === 'grand-celebration') {
      setMessageIndex(0);
      timer = setInterval(() => {
        setMessageIndex(prev => {
          if (prev >= finalMessages.length - 1) { // Final message length
            clearInterval(timer);
            setTimeout(() => setStoryStage('ending-screen'), 4500);
            return prev;
          }
          return prev + 1;
        });
      }, 4200);
    }
    return () => clearInterval(timer);
  }, [storyStage]);

  // Trigger custom confetti bursts at (x,y) coordinates
  const triggerConfettiBlast = useCallback((x: number, y: number) => {
    const colors = ['#bf7080', '#c9a84c', '#ffd7dd', '#ffd54f', '#f5b5a7'];
    for (let p = 0; p < 45; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2.5;
      activeFireworks.current.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1.2, alpha: 1.0,
        decay: Math.random() * 0.012 + 0.008
      });
    }
  }, []);

  // Spawns floating hearts at specific client coordinates
  const spawnHeartsAt = useCallback((x: number, y: number, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 0.4) - Math.PI * 0.7; // direction upwards-ish
      const speed = Math.random() * 2 + 1.5;
      activeHearts.current.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        size: Math.random() * 10 + 8,
        speedY: Math.sin(angle) * speed,
        vx: Math.cos(angle) * speed,
        alpha: 0.95,
        color: ['#fbcbc9', '#ffd7dd', '#bf7080', '#f5b5a7'][Math.floor(Math.random() * 4)]
      });
    }
    setEggsFound(prev => ({ ...prev, doubleTap: true }));
  }, []);

  // Spawns falling stars cascade in the background canvas
  const triggerStarsFall = useCallback(() => {
    const colors = ["#dcae58", "#ffd7dd", "#ffffff", "#f3e5ab"];
    const count = isMobile ? 35 : 75;
    const list: FallingStar[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * window.innerWidth,
        y: -Math.random() * 250 - 20,
        speedY: Math.random() * 2.2 + 1.2,
        speedX: Math.random() * 0.8 - 0.4,
        size: Math.random() * 4 + 1.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.4,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.04 - 0.02
      });
    }
    fallingStarsRef.current = [...fallingStarsRef.current, ...list];
    setEggsFound(prev => ({ ...prev, moon: true }));
  }, [isMobile]);

  // Triggers cake confetti blast
  const triggerCakeConfetti = useCallback((x: number, y: number) => {
    triggerConfettiBlast(x, y);
    // Add extra confetti from top/middle for a grander celebration effect
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        triggerConfettiBlast(window.innerWidth * (0.25 + i * 0.25), window.innerHeight * 0.3);
      }, i * 200);
    }
    setEggsFound(prev => ({ ...prev, cake: true }));
  }, [triggerConfettiBlast]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      setShowHiddenMessage(true);
      setEggsFound(prev => ({ ...prev, photo: true }));
      playSynthSound('success');
      triggerConfettiBlast(window.innerWidth / 2, window.innerHeight * 0.45);
    }, 850);
  }, [playSynthSound, triggerConfettiBlast]);

  const endLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // ─── HANDLERS ───
  const handleIntroNext = useCallback(() => {
    if (introStep < introTexts.length - 1) {
      setIntroStep(p => p + 1);
      playSynthSound('pop');
    } else {
      setStoryStage('gift-open');
      setIsIntroFinished(true);
      setIsMuted(false);
      playSynthSound('unlock');
    }
  }, [introStep, playSynthSound]);

  const handleToggleAudio = useCallback(() => setIsMuted(p => !p), []);
  const handleNextTrack = useCallback(() => { setCurrentTrackIndex(p => (p + 1) % playlist.length); setIsMuted(false); }, []);
  const handlePrevTrack = useCallback(() => { setCurrentTrackIndex(p => (p - 1 + playlist.length) % playlist.length); setIsMuted(false); }, []);

  // ─── AUDIO PLAYBACK EFFECT ───
  useEffect(() => {
    if (isMuted || !isIntroFinished) {
      if (audioRef.current) audioRef.current.pause();
      if (synthRef.current) synthRef.current.stop();
      return;
    }
    const currentTrack = playlist[currentTrackIndex];
    if (currentTrack.src === "synth") {
      if (audioRef.current) audioRef.current.pause();
      if (synthRef.current) synthRef.current.start();
      setTotalTime("∞");
    } else {
      if (synthRef.current) synthRef.current.stop();
      if (audioRef.current) {
        audioRef.current.src = currentTrack.src;
        audioRef.current.load();
        audioRef.current.play().catch(() => { });
        setTotalTime(currentTrack.duration);
      }
    }
  }, [currentTrackIndex, isMuted, isIntroFinished]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      if (playlist[currentTrackIndex].src !== "synth") {
        setProgressBarWidth(`${(audio.currentTime / audio.duration) * 100}%`);
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, "0");
        setCurrentTime(`${m}:${s}`);
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [currentTrackIndex]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (playlist[currentTrackIndex].src === "synth" && !isMuted) {
      timer = setInterval(() => {
        setCurrentTime(prev => {
          const parts = prev.split(":");
          let m = parseInt(parts[0]); let s = parseInt(parts[1]) + 1;
          if (s >= 60) { s = 0; m++; }
          setProgressBarWidth(`${(s % 10) * 10}%`);
          return `${m}:${s.toString().padStart(2, "0")}`;
        });
      }, 1000);
    } else { setCurrentTime("0:00"); }
    return () => clearInterval(timer);
  }, [currentTrackIndex, isMuted]);

  // ─── CANDLE EXTINGUISH ───
  const handleExtinguish = useCallback(() => {
    if (isCandleExtinguished || !candleZoneRef.current) return;
    setIsCandleExtinguished(true);
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const audioCtx = new AC();
        const bufferSize = audioCtx.sampleRate * 0.8;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(400, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.6);
        filter.Q.setValueAtTime(3.0, audioCtx.currentTime);
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
        noiseSource.connect(filter); filter.connect(gainNode); gainNode.connect(audioCtx.destination);
        noiseSource.start(); noiseSource.stop(audioCtx.currentTime + 0.8);
      }
    } catch (e) { }

    setCandleSubheader("Your wish is written in the stars. Let's head to the final destination...");
    setCandleInteractText("");

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9995;pointer-events:none;";
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      if (!ctx || !candleZoneRef.current) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      window.addEventListener("resize", onResize);
      const rect = candleZoneRef.current.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2 - 30;
      const colors = ["#d4af37", "#f3e5ab", "#b76e79", "#ffd1dc", "#ffffff"];
      let particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number; decay: number }[] = [];
      for (let i = 0; i < 120; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 3;
        particles.push({ x: startX, y: startY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5, size: Math.random() * 3 + 1, color: colors[Math.floor(Math.random() * colors.length)], alpha: 1.0, decay: Math.random() * 0.015 + 0.01 });
      }
      function animateConfetti() {
        if (particles.length === 0) { canvas.remove(); window.removeEventListener("resize", onResize); return; }
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.vx *= 0.98; p.alpha -= p.decay;
          ctx!.beginPath(); ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = p.color; ctx!.globalAlpha = p.alpha; ctx!.fill();
          if (p.alpha <= 0) particles.splice(i, 1);
        }
        ctx!.globalAlpha = 1.0;
        requestAnimationFrame(animateConfetti);
      }
      animateConfetti();

      setTimeout(() => {
        ScrollTrigger.refresh();
        if (outroRef.current) {
          gsap.to(window, {
            scrollTo: { y: outroRef.current, autoKill: false },
            duration: 2.5, ease: "power2.inOut",
            onComplete: () => {
              gsap.fromTo(".letter-body p", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.4, ease: "power2.out" });
              gsap.fromTo(".letter-signature", { opacity: 0 }, { opacity: 1, duration: 1.5, delay: 1.5 });
              gsap.fromTo(".music-player-card", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.2, delay: 2.0, ease: "power2.out" });
            }
          });
        }
      }, 800);
    }, 200);
  }, [isCandleExtinguished]);

  // ─── PROGRESS BAR TOUCH SCRUBBING ───
  const handleProgressTouch = useCallback((e: React.TouchEvent) => {
    const currentTrack = playlist[currentTrackIndex];
    if (currentTrack.src !== "synth" && audioRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, touchX / rect.width));
      audioRef.current.currentTime = percentage * audioRef.current.duration;
    }
  }, [currentTrackIndex]);

  // ─── MAIN MOUNT EFFECT ───
  useEffect(() => {
    const mobile = window.innerWidth < 1024 || (typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));

    // Register service worker for offline support
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }

    // Declare Lenis and updateRaf references locally for cleanup access
    let lenis: Lenis | null = null;
    let updateRaf: (() => void) | null = null;

    if (!mobile) {
      // Lenis smooth scroll - Desktop only
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        prevent: (node) => node.nodeName === "CANVAS",
      });
      lenis.on("scroll", ScrollTrigger.update);

      // Drive Lenis tick exclusively via GSAP ticker
      updateRaf = () => {
        if (lenis) lenis.raf(performance.now());
      };
      gsap.ticker.add(updateRaf);
    }

    // Dynamic Touch Detection to disable scroll-jacking
    const handleTouchStart = () => {
      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
      if (updateRaf) {
        gsap.ticker.remove(updateRaf);
        updateRaf = null;
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
      if (stageRef.current === 'experience') {
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
      }
      window.removeEventListener("touchstart", handleTouchStart);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
    }

    document.documentElement.classList.add("no-scroll");
    document.body.classList.add("no-scroll");

    // Lift listener definitions to root level of mount useEffect for cleanup access
    const hoverSel = "a, button, .memory-card, #interactive-flame, .audio-controller, .player-btn, #candle-interactive-zone";
    const onOver = (e: any) => { if (e.target.closest(hoverSel)) document.body.classList.add("cursor-hover"); };
    const onOut = (e: any) => { if (e.target.closest(hoverSel)) document.body.classList.remove("cursor-hover"); };

    const onMove = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
        cursorDotRef.current.style.opacity = "1";
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.opacity = "1";
      }
      const lastX = cursorCoords.current.x; const lastY = cursorCoords.current.y;
      cursorCoords.current.x = e.clientX; cursorCoords.current.y = e.clientY;
      if (Math.abs(e.clientX - lastX) > 2 || Math.abs(e.clientY - lastY) > 2) {
        if (cursorTrail.current.length < 50) {
          cursorTrail.current.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 + 0.5, alpha: 1.0, size: Math.random() * 2 + 1, color: Math.random() > 0.4 ? "#d4af37" : "#b76e79" });
        }
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        gyroOffset.current.x = Math.max(-30, Math.min(30, e.gamma)) / 30;
        gyroOffset.current.y = Math.max(-30, Math.min(30, e.beta - 45)) / 30;
      }
    };

    // ── Cursor (desktop only) ──
    let ringFrameId: number;
    if (!mobile) {
      document.addEventListener("mouseover", onOver);
      document.addEventListener("mouseout", onOut);
      document.addEventListener("mousemove", onMove);

      const animateRing = () => {
        ringCoords.current.x += (cursorCoords.current.x - ringCoords.current.x) * 0.15;
        ringCoords.current.y += (cursorCoords.current.y - ringCoords.current.y) * 0.15;
        if (cursorRingRef.current) { cursorRingRef.current.style.left = `${ringCoords.current.x}px`; cursorRingRef.current.style.top = `${ringCoords.current.y}px`; }
        ringFrameId = requestAnimationFrame(animateRing);
      };
      animateRing();
    }

    // ── Gyroscope parallax (mobile) ──
    if (mobile && typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", onOrientation);
    }

    // ── Sky canvas ──
    const skyCanvas = bgCanvasRef.current;
    if (!skyCanvas) return;
    const skyCtx = skyCanvas.getContext("2d");
    if (!skyCtx) return;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    const maxStars = mobile ? 70 : 150;

    // Cache the radial gradient vignette to prevent frame-rate stuttering
    let skyVignette: CanvasGradient;

    const resizeSky = () => {
      skyCanvas.width = window.innerWidth;
      skyCanvas.height = window.innerHeight;

      skyVignette = skyCtx.createRadialGradient(
        skyCanvas.width / 2,
        skyCanvas.height / 2,
        0,
        skyCanvas.width / 2,
        skyCanvas.height / 2,
        Math.max(skyCanvas.width, skyCanvas.height) * 0.75
      );
      skyVignette.addColorStop(0, 'rgba(250, 248, 242, 0)');
      skyVignette.addColorStop(1, 'rgba(250, 248, 242, 0.55)');
    };
    resizeSky();
    window.addEventListener("resize", resizeSky);

    // Pre-allocate coordinate arrays as typed arrays for performance (zero GC overhead)
    const sxArr = new Float32Array(maxStars);
    const syArr = new Float32Array(maxStars);

    for (let i = 0; i < maxStars; i++) {
      stars.push({
        x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        size: Math.random() * 1.2 + 0.3, baseAlpha: Math.random() * 0.7 + 0.1, alpha: 0,
        twinkleSpeed: Math.random() * 0.02 + 0.005, twinkleDirection: 1,
        color: Math.random() > 0.6 ? "#bf7080" : "#dcae58",
      });
    }

    const spawnShootingStar = () => {
      if (shootingStars.length < 2 && Math.random() < 0.003) {
        shootingStars.push({ x: Math.random() * window.innerWidth * 0.8, y: Math.random() * window.innerHeight * 0.4, length: Math.random() * 80 + 40, speed: Math.random() * 5 + 3, dx: Math.random() * 4 + 3, dy: Math.random() * 2 + 1, alpha: 1.0, width: Math.random() * 1.5 + 0.8 });
      }
    };

    // ── Heart canvas ──
    // ── Heart canvases setup ──
    const heartCanvas = heartCanvasRef.current;
    const finalHeartCanvas = finalHeartCanvasRef.current;

    let heartCtx: CanvasRenderingContext2D | null = null;
    let finalHeartCtx: CanvasRenderingContext2D | null = null;

    if (heartCanvas) heartCtx = heartCanvas.getContext("2d");
    if (finalHeartCanvas) finalHeartCtx = finalHeartCanvas.getContext("2d");

    let heartParticles: Particle[] = [];
    let finalHeartParticles: Particle[] = [];

    const numParticles = mobile ? 300 : 550; // optimized for mobile 60fps
    const heartScale = mobile ? 10 : 14;

    let heartBaseX = 0; let heartBaseY = 0;
    let finalHeartBaseX = 0; let finalHeartBaseY = 0;

    let beatTimer = 0;
    const beatState = { scale: 1.0 };
    let ripples: Ripple[] = [];
    let finalRipples: Ripple[] = [];

    const resizeHeart = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (heartCanvas && heartCtx) {
        const rect = heartCanvas.getBoundingClientRect();
        heartCanvas.width = rect.width * dpr;
        heartCanvas.height = rect.height * dpr;
        heartCtx.scale(dpr, dpr);
        heartBaseX = rect.width / 2;
        heartBaseY = rect.height / 2 - 15;
      }
      if (finalHeartCanvas && finalHeartCtx) {
        const rect = finalHeartCanvas.getBoundingClientRect();
        finalHeartCanvas.width = rect.width * dpr;
        finalHeartCanvas.height = rect.height * dpr;
        finalHeartCtx.scale(dpr, dpr);
        finalHeartBaseX = rect.width / 2;
        finalHeartBaseY = rect.height / 2 - 15;
      }
    };
    resizeHeart();
    window.addEventListener("resize", resizeHeart);

    const getHeartPoint = (t: number, scale: number) => {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return { x: x * scale, y: y * scale };
    };

    const initParticles = (arr: Particle[]) => {
      for (let i = 0; i < numParticles; i++) {
        const t = Math.random() * Math.PI * 2;
        const targetPos = getHeartPoint(t, heartScale);
        const innerOffset = Math.random();
        targetPos.x *= innerOffset; targetPos.y *= innerOffset;
        arr.push({
          x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
          tx: targetPos.x, ty: targetPos.y, angle: t, innerOffset,
          size: Math.random() * 1.5 + 0.8, speed: Math.random() * 0.05 + 0.02,
          color: Math.random() > 0.4 ? "#b76e79" : "#d4af37",
          alpha: Math.random() * 0.6 + 0.4, vx: 0, vy: 0, friction: 0.94,
          interactiveStrength: Math.random() * 0.5 + 0.5,
        });
      }
    };

    if (heartCtx) initParticles(heartParticles);
    if (finalHeartCtx) initParticles(finalHeartParticles);

    const triggerHeartPulse = (isFinal: boolean, rect: DOMRect, clientX: number, clientY: number) => {
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      if (isFinal) {
        finalRipples.push({ x: mx, y: my, radius: 0, maxRadius: 200, speed: 5, strength: 12 });
      } else {
        ripples.push({ x: mx, y: my, radius: 0, maxRadius: 200, speed: 5, strength: 12 });
      }
      gsap.to(beatState, { scale: 1.4, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    };

    // Event listeners
    const handleHeartClick = (e: MouseEvent) => {
      if (heartCanvas) triggerHeartPulse(false, heartCanvas.getBoundingClientRect(), e.clientX, e.clientY);
    };
    const handleHeartTouch = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (heartCanvas) triggerHeartPulse(false, heartCanvas.getBoundingClientRect(), t.clientX, t.clientY);
    };
    const handleHeartTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (heartCanvas) {
        const rect = heartCanvas.getBoundingClientRect();
        pointerOnHeart.current = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true };
      }
    };
    const handleHeartTouchEnd = () => { pointerOnHeart.current.active = false; };

    if (heartCanvas && !mobile) {
      heartCanvas.addEventListener("click", handleHeartClick);
      heartCanvas.addEventListener("touchstart", handleHeartTouch, { passive: false });
      heartCanvas.addEventListener("touchmove", handleHeartTouchMove, { passive: false });
      heartCanvas.addEventListener("touchend", handleHeartTouchEnd);
    }

    // Final heart listeners
    const handleFinalHeartClick = (e: MouseEvent) => {
      if (finalHeartCanvas) triggerHeartPulse(true, finalHeartCanvas.getBoundingClientRect(), e.clientX, e.clientY);
    };
    const handleFinalHeartTouch = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (finalHeartCanvas) triggerHeartPulse(true, finalHeartCanvas.getBoundingClientRect(), t.clientX, t.clientY);
    };
    const handleFinalHeartTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (finalHeartCanvas) {
        const rect = finalHeartCanvas.getBoundingClientRect();
        pointerOnFinalHeart.current = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true };
      }
    };
    const handleFinalHeartTouchEnd = () => { pointerOnFinalHeart.current.active = false; };

    if (finalHeartCanvas && !mobile) {
      finalHeartCanvas.addEventListener("click", handleFinalHeartClick);
      finalHeartCanvas.addEventListener("touchstart", handleFinalHeartTouch, { passive: false });
      finalHeartCanvas.addEventListener("touchmove", handleFinalHeartTouchMove, { passive: false });
      finalHeartCanvas.addEventListener("touchend", handleFinalHeartTouchEnd);
    }

    // Constellation pairs: pre-compute once, not every frame (O(n) per frame instead of O(n²))
    const constellationPairs: [number, number][] = [];
    if (!mobile) {
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          if (stars[i].size < 0.8 || stars[j].size < 0.8) continue;
          const dx = stars[i].x - stars[j].x; const dy = stars[i].y - stars[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < 85) constellationPairs.push([i, j]);
        }
      }
    }

    // ── Main render loop ──
    let mainAnimFrameId: number;
    const renderLoop = () => {
      skyCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);

      // Use cached skyVignette gradient (allocated in resizeSky) to save CPU and memory allocation
      skyCtx.fillStyle = skyVignette;
      skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

      // Twinkle
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.alpha += star.twinkleSpeed * star.twinkleDirection;
        if (star.alpha >= star.baseAlpha) { star.alpha = star.baseAlpha; star.twinkleDirection = -1; }
        else if (star.alpha <= 0.05) { star.alpha = 0.05; star.twinkleDirection = 1; }
      }

      // Pre-calculate parallax values directly to prevent allocations in hot path
      let pxX = 0;
      let pxY = 0;
      if (mobile) {
        pxX = gyroOffset.current.x;
        pxY = gyroOffset.current.y;
      } else {
        pxX = (cursorCoords.current.x - window.innerWidth / 2) / window.innerWidth;
        pxY = (cursorCoords.current.y - window.innerHeight / 2) / window.innerHeight;
      }

      skyCtx.lineWidth = 0.5;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const px = pxX * s.size * -18;
        const py = pxY * s.size * -18;
        sxArr[i] = (s.x + px + skyCanvas.width) % skyCanvas.width;
        syArr[i] = (s.y + py + skyCanvas.height) % skyCanvas.height;
        skyCtx.beginPath(); skyCtx.arc(sxArr[i], syArr[i], s.size, 0, Math.PI * 2);
        skyCtx.fillStyle = s.color; skyCtx.globalAlpha = s.alpha; skyCtx.fill();
      }

      // Constellation lines (desktop only, pre-computed pairs)
      if (!mobile) {
        for (let k = 0; k < constellationPairs.length; k++) {
          const [i, j] = constellationPairs[k];
          const s1 = stars[i]; const s2 = stars[j];
          const lineAlpha = 0.12 * Math.min(s1.alpha, s2.alpha);
          skyCtx.beginPath(); skyCtx.moveTo(sxArr[i], syArr[i]); skyCtx.lineTo(sxArr[j], syArr[j]);
          skyCtx.strokeStyle = s1.color === "#bf7080" ? `rgba(191,112,128,${lineAlpha * 1.5})` : `rgba(201,168,76,${lineAlpha * 1.5})`;
          skyCtx.stroke();
        }
      }

      // Shooting stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        const grad = skyCtx.createLinearGradient(ss.x, ss.y, ss.x - ss.dx * 10, ss.y - ss.dy * 10);
        grad.addColorStop(0, `rgba(191,112,128,${ss.alpha * 0.8})`);
        grad.addColorStop(1, "rgba(250,248,242,0)");
        skyCtx.strokeStyle = grad; skyCtx.lineWidth = ss.width; skyCtx.lineCap = "round";
        skyCtx.beginPath(); skyCtx.moveTo(ss.x, ss.y); skyCtx.lineTo(ss.x - ss.dx * 5, ss.y - ss.dy * 5); skyCtx.stroke();
        ss.x += ss.dx; ss.y += ss.dy; ss.alpha -= 0.015;
        if (ss.alpha <= 0 || ss.x > skyCanvas.width || ss.y > skyCanvas.height) shootingStars.splice(i, 1);
      }

      // ─── Easter Egg: Falling Stars ───
      const fallingStarsList = fallingStarsRef.current;
      for (let i = fallingStarsList.length - 1; i >= 0; i--) {
        const fs = fallingStarsList[i];
        fs.y += fs.speedY;
        fs.x += fs.speedX;
        fs.angle += fs.spin;
        skyCtx.save();
        skyCtx.translate(fs.x, fs.y);
        skyCtx.rotate(fs.angle);
        skyCtx.fillStyle = fs.color;
        skyCtx.globalAlpha = fs.alpha;

        // Draw a premium 5-point star shape
        skyCtx.beginPath();
        const spikes = 5;
        const outerRadius = fs.size;
        const innerRadius = fs.size * 0.45;
        let rot = Math.PI / 2 * 3;
        let cx = 0;
        let cy = 0;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        skyCtx.moveTo(cx, cy - outerRadius);
        for (let j = 0; j < spikes; j++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          skyCtx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          skyCtx.lineTo(x, y);
          rot += step;
        }
        skyCtx.lineTo(cx, cy - outerRadius);
        skyCtx.closePath();
        skyCtx.fill();
        skyCtx.restore();

        if (fs.y > skyCanvas.height + 20) {
          fallingStarsList.splice(i, 1);
        }
      }

      // Cursor trail (desktop)
      if (!mobile) {
        skyCtx.globalAlpha = 1.0;
        for (let i = cursorTrail.current.length - 1; i >= 0; i--) {
          const trail = cursorTrail.current[i];
          skyCtx.beginPath(); skyCtx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
          skyCtx.fillStyle = trail.color; skyCtx.globalAlpha = trail.alpha; skyCtx.fill();
          trail.x += trail.vx; trail.y += trail.vy; trail.alpha -= 0.02;
          if (trail.alpha <= 0) cursorTrail.current.splice(i, 1);
        }
      }
      skyCtx.globalAlpha = 1.0;

      // ─── Celebration: Fireworks ───
      for (let i = activeFireworks.current.length - 1; i >= 0; i--) {
        const fw = activeFireworks.current[i];
        skyCtx.beginPath();
        skyCtx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
        skyCtx.fillStyle = fw.color;
        skyCtx.globalAlpha = fw.alpha;
        skyCtx.fill();
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.06; // gravity
        fw.alpha -= fw.decay;
        if (fw.alpha <= 0 || fw.y > skyCanvas.height) {
          activeFireworks.current.splice(i, 1);
        }
      }

      // ─── Celebration: Rose Petals ───
      if (stageRef.current === 'grand-celebration' && Math.random() < 0.06) {
        activeRosePetals.current.push({
          x: Math.random() * skyCanvas.width,
          y: -20,
          size: Math.random() * 8 + 6,
          speedY: Math.random() * 1.8 + 0.8,
          speedX: Math.random() * 1.5 - 0.75,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: Math.random() * 0.03 - 0.015,
          color: ['#fbcbc9', '#ffd7dd', '#f5b5a7', '#bf7080'][Math.floor(Math.random() * 4)]
        });
      }
      for (let i = activeRosePetals.current.length - 1; i >= 0; i--) {
        const rp = activeRosePetals.current[i];
        rp.y += rp.speedY;
        rp.x += rp.speedX + Math.sin(rp.angle) * 0.3;
        rp.angle += rp.angleSpeed;
        skyCtx.save();
        skyCtx.translate(rp.x, rp.y);
        skyCtx.rotate(rp.angle);
        skyCtx.fillStyle = rp.color;
        skyCtx.globalAlpha = 0.8;
        skyCtx.beginPath();
        skyCtx.ellipse(0, 0, rp.size, rp.size * 0.55, 0, 0, Math.PI * 2);
        skyCtx.fill();
        skyCtx.restore();
        if (rp.y > skyCanvas.height + 20) {
          activeRosePetals.current.splice(i, 1);
        }
      }

      // ─── Celebration/Decorative: Rising Hearts ───
      if ((stageRef.current === 'grand-celebration' && Math.random() < 0.04) ||
          (stageRef.current === 'experience' && Math.random() < 0.015)) {
        activeHearts.current.push({
          x: Math.random() * skyCanvas.width,
          y: skyCanvas.height + 20,
          size: Math.random() * 9 + 7,
          speedY: -(Math.random() * 1.8 + 1.2),
          vx: Math.random() * 0.8 - 0.4,
          alpha: 0.85,
          color: ['#fbcbc9', '#ffd7dd', '#bf7080'][Math.floor(Math.random() * 3)]
        });
      }
      for (let i = activeHearts.current.length - 1; i >= 0; i--) {
        const h = activeHearts.current[i];
        h.y += h.speedY;
        h.x += h.vx;
        h.alpha -= 0.0022;
        skyCtx.save();
        skyCtx.translate(h.x, h.y);
        skyCtx.fillStyle = h.color;
        skyCtx.globalAlpha = h.alpha;
        skyCtx.beginPath();
        const hs = h.size / 2;
        skyCtx.moveTo(0, hs / 2);
        skyCtx.bezierCurveTo(0, 0, -hs, 0, -hs, hs / 2);
        skyCtx.bezierCurveTo(-hs, hs, 0, hs * 1.4, 0, hs * 1.7);
        skyCtx.bezierCurveTo(0, hs * 1.4, hs, hs, hs, hs / 2);
        skyCtx.bezierCurveTo(hs, 0, 0, 0, 0, hs / 2);
        skyCtx.fill();
        skyCtx.restore();
        if (h.y < -20 || h.alpha <= 0) {
          activeHearts.current.splice(i, 1);
        }
      }
      skyCtx.globalAlpha = 1.0;

      // ─── Drawing Heart Canvas (Scene 3 / Chapter III) ───
      if (heartCanvas && heartCtx && stageRef.current === 'experience') {
        const heartRect = heartCanvas.getBoundingClientRect();
        if (heartRect.bottom > 0 && heartRect.top < window.innerHeight) {
          heartCtx.clearRect(0, 0, heartCanvas.width, heartCanvas.height);
          const rect = heartRect;

          let mx: number, my: number, mouseInCanvas: boolean;
          if (mobile && pointerOnHeart.current.active) {
            mx = pointerOnHeart.current.x; my = pointerOnHeart.current.y; mouseInCanvas = true;
          } else {
            mx = cursorCoords.current.x - rect.left; my = cursorCoords.current.y - rect.top;
            mouseInCanvas = mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height;
          }

          beatTimer += 0.025;
          const basePulse = Math.sin(beatTimer);
          let heartPulse = 0;
          if (basePulse > 0.5) heartPulse = Math.sin((beatTimer - 0.5) * Math.PI) * 0.08;
          else if (basePulse < -0.5) heartPulse = Math.sin((beatTimer + 0.5) * Math.PI) * 0.04;
          const currentScale = heartScale * (1 + heartPulse) * beatState.scale;

          for (let r = ripples.length - 1; r >= 0; r--) {
            ripples[r].radius += ripples[r].speed;
            if (ripples[r].radius > ripples[r].maxRadius) ripples.splice(r, 1);
          }
          heartCtx.globalAlpha = 1.0;
          ripples.forEach(rip => {
            heartCtx.beginPath(); heartCtx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
            heartCtx.strokeStyle = `rgba(191,112,128,${(1 - rip.radius / rip.maxRadius) * 0.25})`;
            heartCtx.lineWidth = 2; heartCtx.stroke();
          });

          for (let i = 0; i < heartParticles.length; i++) {
            const p = heartParticles[i];
            const targetX = heartBaseX + p.tx * (currentScale / heartScale);
            const targetY = heartBaseY + p.ty * (currentScale / heartScale);

            if (mouseInCanvas) {
              const dx = mx - p.x; const dy = my - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 100) {
                const force = (100 - dist) * 0.03 * p.interactiveStrength;
                p.vx += (dx / dist) * force; p.vy += (dy / dist) * force;
              }
            }
            for (let r = 0; r < ripples.length; r++) {
              const rip = ripples[r];
              const dx = p.x - rip.x; const dy = p.y - rip.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const diff = dist - rip.radius;
              if (Math.abs(diff) < 20) {
                const pushForce = (1 - Math.abs(diff) / 20) * rip.strength;
                p.vx += (dx / (dist || 1)) * pushForce; p.vy += (dy / (dist || 1)) * pushForce;
              }
            }
            p.vx += (targetX - p.x) * p.speed * 0.15;
            p.vy += (targetY - p.y) * p.speed * 0.15;
            p.x += p.vx; p.y += p.vy; p.vx *= p.friction; p.vy *= p.friction;

            heartCtx.beginPath(); heartCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            heartCtx.fillStyle = p.color; heartCtx.globalAlpha = p.alpha;
            if (!mobile) {
              heartCtx.shadowColor = p.color === "#b76e79" ? "rgba(191,112,128,0.5)" : "rgba(201,168,76,0.5)";
              heartCtx.shadowBlur = 4;
            }
            heartCtx.fill();
            if (!mobile) heartCtx.shadowBlur = 0;
          }
        }
      }

      // ─── Drawing Final Heart Canvas (Ending Screen) ───
      if (finalHeartCanvas && finalHeartCtx && stageRef.current === 'ending-screen') {
        finalHeartCtx.clearRect(0, 0, finalHeartCanvas.width, finalHeartCanvas.height);
        const rect = finalHeartCanvas.getBoundingClientRect();

        let mx: number, my: number, mouseInCanvas: boolean;
        if (mobile && pointerOnFinalHeart.current.active) {
          mx = pointerOnFinalHeart.current.x; my = pointerOnFinalHeart.current.y; mouseInCanvas = true;
        } else {
          mx = cursorCoords.current.x - rect.left; my = cursorCoords.current.y - rect.top;
          mouseInCanvas = mx >= 0 && mx <= rect.width && my >= 0 && my <= rect.height;
        }

        beatTimer += 0.025;
        const basePulse = Math.sin(beatTimer);
        let heartPulse = 0;
        if (basePulse > 0.5) heartPulse = Math.sin((beatTimer - 0.5) * Math.PI) * 0.08;
        else if (basePulse < -0.5) heartPulse = Math.sin((beatTimer + 0.5) * Math.PI) * 0.04;
        const currentScale = (heartScale - 2) * (1 + heartPulse) * beatState.scale;

        for (let r = finalRipples.length - 1; r >= 0; r--) {
          finalRipples[r].radius += finalRipples[r].speed;
          if (finalRipples[r].radius > finalRipples[r].maxRadius) finalRipples.splice(r, 1);
        }
        finalHeartCtx.globalAlpha = 1.0;
        finalRipples.forEach(rip => {
          finalHeartCtx.beginPath(); finalHeartCtx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          finalHeartCtx.strokeStyle = `rgba(191,112,128,${(1 - rip.radius / rip.maxRadius) * 0.25})`;
          finalHeartCtx.lineWidth = 2; finalHeartCtx.stroke();
        });

        for (let i = 0; i < finalHeartParticles.length; i++) {
          const p = finalHeartParticles[i];
          const targetX = finalHeartBaseX + p.tx * (currentScale / heartScale);
          const targetY = finalHeartBaseY + p.ty * (currentScale / heartScale);

          if (mouseInCanvas) {
            const dx = mx - p.x; const dy = my - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const force = (100 - dist) * 0.03 * p.interactiveStrength;
              p.vx += (dx / dist) * force; p.vy += (dy / dist) * force;
            }
          }
          for (let r = 0; r < finalRipples.length; r++) {
            const rip = finalRipples[r];
            const dx = p.x - rip.x; const dy = p.y - rip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const diff = dist - rip.radius;
            if (Math.abs(diff) < 20) {
              const pushForce = (1 - Math.abs(diff) / 20) * rip.strength;
              p.vx += (dx / (dist || 1)) * pushForce; p.vy += (dy / (dist || 1)) * pushForce;
            }
          }
          p.vx += (targetX - p.x) * p.speed * 0.15;
          p.vy += (targetY - p.y) * p.speed * 0.15;
          p.x += p.vx; p.y += p.vy; p.vx *= p.friction; p.vy *= p.friction;

          finalHeartCtx.beginPath(); finalHeartCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          finalHeartCtx.fillStyle = p.color; finalHeartCtx.globalAlpha = p.alpha;
          if (!mobile) {
            finalHeartCtx.shadowColor = p.color === "#b76e79" ? "rgba(191,112,128,0.5)" : "rgba(201,168,76,0.5)";
            finalHeartCtx.shadowBlur = 4;
          }
          finalHeartCtx.fill();
          if (!mobile) finalHeartCtx.shadowBlur = 0;
        }
      }

      mainAnimFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // ── Global Double Tap Gesture ──
    let lastGlobalTap = 0;
    const handleGlobalDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, input, select, textarea, a, .memory-card, canvas")) return;
      spawnHeartsAt(e.clientX, e.clientY, 12);
      playSynthSound("pop");
    };

    const handleGlobalTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, input, select, textarea, a, .memory-card, canvas")) return;
      const now = Date.now();
      if (now - lastGlobalTap < 300) {
        const touch = e.touches[0] || e.changedTouches[0];
        spawnHeartsAt(touch.clientX, touch.clientY, 10);
        playSynthSound("pop");
        lastGlobalTap = 0;
      } else {
        lastGlobalTap = now;
      }
    };

    if (typeof window !== "undefined" && !mobile) {
      window.addEventListener("dblclick", handleGlobalDblClick);
      window.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    }

    // ── Phone Shake Gesture ──
    let lastShakeX = null as number | null;
    let lastShakeY = null as number | null;
    let lastShakeZ = null as number | null;
    let lastShakeTimestamp = 0;

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;
      const x = accel.x;
      const y = accel.y;
      const z = accel.z;
      if (x === null || y === null || z === null) return;

      if (lastShakeX !== null && lastShakeY !== null && lastShakeZ !== null) {
        const deltaX = Math.abs(x - lastShakeX);
        const deltaY = Math.abs(y - lastShakeY);
        const deltaZ = Math.abs(z - lastShakeZ);

        const forceThreshold = 14;
        const now = Date.now();
        if ((deltaX > forceThreshold || deltaY > forceThreshold || deltaZ > forceThreshold) && now - lastShakeTimestamp > 1800) {
          lastShakeTimestamp = now;
          if (triggerShakeBalloonsRef.current) {
            triggerShakeBalloonsRef.current();
          }
        }
      }

      lastShakeX = x;
      lastShakeY = y;
      lastShakeZ = z;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("devicemotion", handleDeviceMotion);
    }

    return () => {
      if (!mobile) {
        cancelAnimationFrame(ringFrameId);
        document.removeEventListener("mouseover", onOver);
        document.removeEventListener("mouseout", onOut);
        document.removeEventListener("mousemove", onMove);
      }
      if (mobile) {
        window.removeEventListener("deviceorientation", onOrientation);
      }
      cancelAnimationFrame(mainAnimFrameId);
      window.removeEventListener("resize", resizeSky);
      window.removeEventListener("resize", resizeHeart);
      if (heartCanvas && !mobile) {
        heartCanvas.removeEventListener("click", handleHeartClick);
        heartCanvas.removeEventListener("touchstart", handleHeartTouch);
        heartCanvas.removeEventListener("touchmove", handleHeartTouchMove);
        heartCanvas.removeEventListener("touchend", handleHeartTouchEnd);
      }
      if (finalHeartCanvas && !mobile) {
        finalHeartCanvas.removeEventListener("click", handleFinalHeartClick);
        finalHeartCanvas.removeEventListener("touchstart", handleFinalHeartTouch);
        finalHeartCanvas.removeEventListener("touchmove", handleFinalHeartTouchMove);
        finalHeartCanvas.removeEventListener("touchend", handleFinalHeartTouchEnd);
      }
      if (!mobile) {
        window.removeEventListener("dblclick", handleGlobalDblClick);
        window.removeEventListener("touchstart", handleGlobalTouchStart);
      }
      window.removeEventListener("devicemotion", handleDeviceMotion);

      // Clean up GSAP, window listeners, and synthesizer
      window.removeEventListener("touchstart", handleTouchStart);
      if (updateRaf) {
        gsap.ticker.remove(updateRaf);
      }
      if (synthRef.current) {
        synthRef.current.destroy();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (lenis) {
        lenis.destroy();
      }
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
    };
  }, []);

  // ── SCROLL TRIGGER ANIMATIONS ──
  useEffect(() => {
    if (!isIntroFinished) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("#cosmic-title", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.5, scrollTrigger: { trigger: "#cosmic-screen", start: "top 70%", toggleActions: "play none none reverse" } });
      gsap.fromTo("#cosmic-subtitle", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.5, delay: 0.3, scrollTrigger: { trigger: "#cosmic-screen", start: "top 70%", toggleActions: "play none none reverse" } });

      if (document.querySelectorAll(".memory-card").length > 0) {
        gsap.fromTo(".memory-card", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: "power3.out", scrollTrigger: { trigger: "#memory-screen", start: "top 60%", toggleActions: "play none none reverse" } });
      }

      gsap.fromTo(".heart-content-overlay", { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.5, scrollTrigger: { trigger: "#heart-screen", start: "top 50%", toggleActions: "play none none reverse" } });

      ["cosmic-screen", "memory-screen", "heart-screen"].forEach((id, index) => {
        ScrollTrigger.create({
          trigger: `#${id}`, start: "top 40%", end: "bottom 40%",
          onEnter: () => document.getElementById(`scroll-ind-${index + 1}`)?.classList.add("visible"),
          onLeave: () => document.getElementById(`scroll-ind-${index + 1}`)?.classList.remove("visible"),
          onEnterBack: () => document.getElementById(`scroll-ind-${index + 1}`)?.classList.add("visible"),
          onLeaveBack: () => document.getElementById(`scroll-ind-${index + 1}`)?.classList.remove("visible"),
        });
      });
      ScrollTrigger.refresh();
    });
    return () => ctx.revert();
  }, [isIntroFinished, vaultUnlocked]);

  return (
    <>
      {/* ── Film Grain ── */}
      <div className="film-grain" />

      {/* ── Aurora Background ── */}
      <div className="aurora-container">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      {/* ── Custom cursor — desktop ── */}
      {!isMobile && (
        <>
          <div className="custom-cursor" id="cursor-dot" ref={cursorDotRef} />
          <div className="custom-cursor-ring" id="cursor-ring" ref={cursorRingRef} />
        </>
      )}

      {/* ── Star canvas ── */}
      <canvas id="space-canvas" ref={bgCanvasRef} />

      {/* ── Global Audio Controller ── */}
      <div
        className={`fixed top-4 right-4 sm:top-7 sm:right-7 z-[1000] flex items-center gap-2 sm:gap-3 glass px-4 py-2 rounded-full transition-all duration-1000 cursor-pointer active:scale-95 hover:border-[rgba(191,112,128,0.35)] ${isIntroFinished ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        onClick={handleToggleAudio}
        role="button"
        aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
      >
        <span className="text-[9px] uppercase font-sans tracking-[0.25em] font-medium text-[rgba(191,112,128,0.85)] whitespace-nowrap">
          {isMuted ? "Sound Off" : "Sound On"}
        </span>
        <div className="flex items-end gap-[3px] h-[14px] w-[18px]">
          {[0.1, 0.4, 0.2, 0.5].map((delay, i) => (
            <div key={i} className={`w-[2px] h-[3px] bg-[#bf7080] rounded-[1px] ${!isMuted ? 'animate-visualizer-bar' : ''}`} style={!isMuted ? { animationDelay: `${delay}s` } : undefined} />
          ))}
        </div>
      </div>

      <audio id="bg-audio" ref={audioRef} loop preload="none" />

      {/* ══════════════════════════════════════════════
          SCENE 1: THE GIFT INTRO
          ══════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 bg-[#faf8f2] z-[999] flex flex-col justify-center items-center px-6 transition-all duration-[1.2s] ease-[0.43,0.13,0.23,0.96] ${storyStage === 'gift-intro' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-[-20px]'
          }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[50vw] h-[50vw] rounded-full top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-[#bf7080]/8 to-transparent filter blur-[50px] animate-pulse" />
        </div>

        <div className="relative z-10 text-center w-full max-w-[340px] mx-auto flex flex-col items-center">
          <div className="lottie-orb-wrapper mb-8 w-20 h-20 sm:w-24 sm:h-24">
            <Lottie animationData={pulseLottie} loop autoplay />
            <FiHeadphones className="absolute text-[1.6rem] sm:text-[2rem] text-[#bf7080]" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          </div>

          <div className="w-12 mb-6" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(191,112,128,0.5), transparent)', transformOrigin: 'center' }} />

          <p className="chapter-eyebrow mb-5">A Private Experience for You</p>

          <div className="min-h-[100px] flex items-center justify-center mb-8 w-full">
            <AnimatePresence mode="wait">
              <motion.p
                key={introStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="font-serif text-base sm:text-lg font-light text-[#4a3e3d] leading-relaxed tracking-wide"
              >
                {introTexts[introStep]}
              </motion.p>
            </AnimatePresence>
          </div>

          <button
            className="btn-luxury w-full max-w-[220px]"
            onClick={handleIntroNext}
          >
            {introStep === introTexts.length - 1 ? "Open Gift ✦" : "Continue"}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SCENE 2: OPENING THE GIFT (3D BOX)
          ══════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 bg-[#faf8f2] z-[998] flex flex-col justify-center items-center px-6 overflow-hidden transition-all duration-[1.2s] ease-in-out ${storyStage === 'gift-open' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-[0.98]'
          }`}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />

        <div className="relative z-10 text-center flex flex-col items-center gap-6">
          <p className="chapter-eyebrow">Scene II · The Gift</p>
          <h2 className="display-serif text-2xl sm:text-3xl text-[#4a3e3d]">Your Handcrafted Gift</h2>
          <p className="font-sans text-xs text-[rgba(93,74,71,0.55)] tracking-wider">Tap the box to untie the ribbon and begin the story</p>

          <div
            className="gift-wrapper mt-8 cursor-pointer"
            onClick={() => {
              if (isGiftOpened) return;
              setIsGiftOpened(true);
              playSynthSound('success');
              setTimeout(() => {
                setStoryStage('experience');
              }, 2200);
            }}
          >
            <div className={`gift-box ${isGiftOpened ? 'opened' : ''}`}>
              <div className="gift-bow">
                <div className="gift-bow-left"></div>
                <div className="gift-bow-right"></div>
                <div className="gift-bow-center"></div>
              </div>
              <div className="gift-box-lid"></div>
              <div className="gift-box-body"></div>
              <div className="gift-ribbon-v"></div>
              <div className="gift-ribbon-h"></div>
            </div>
            <div className="gift-burst-light"></div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SCENES 3-8, 10: MAIN EXPERIENCE SCROLLABLE PANELS
          ══════════════════════════════════════════════ */}
      <div
        className={`relative z-[2] w-full transition-all duration-[1s] ${storyStage === 'experience' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute h-[1px] overflow-hidden'
          }`}
        ref={scrollWrapperRef}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 3 — Welcome Panel (Kuttyma Hero) & Balloons
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="cosmic-screen" className="min-h-screen flex flex-col justify-center items-center relative px-5 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />

          <div className="max-w-[740px] z-[5] w-full flex flex-col items-center gap-6 sm:gap-8">
            <p className="chapter-eyebrow">Chapter I · The Welcome</p>
            <div className="divider-gold w-48 sm:w-64" />

            <h1 id="cosmic-title" className="display-serif text-[2.2rem] sm:text-[3.6rem] md:text-[4.8rem] leading-[1.15] tracking-tight text-[#4a3e3d]">
              Happy Birthday, <br />
              <span className="text-[#bf7080] font-normal italic">Kuttyma ❤️</span>
            </h1>

            <p id="cosmic-subtitle" className="font-sans text-xs sm:text-sm font-light text-[rgba(93,74,71,0.6)] tracking-wider uppercase">
              Today, you are the main character
            </p>

            <div className="relative inline-flex items-center justify-center">
              <span className="hidden sm:block absolute -left-14 top-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none opacity-70">
                <Lottie animationData={sparkleLottie} loop autoplay />
              </span>
              <h2 className="gold-shimmer-text display-serif text-[2.8rem] sm:text-[4.2rem] md:text-[5.5rem] font-light tracking-[0.12em] leading-none">
                Sujitha <span className="emoji-normal">🐭</span>
              </h2>
              <span className="hidden sm:block absolute -right-14 top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none opacity-60">
                <Lottie animationData={sparkleLottie} loop autoplay />
              </span>
            </div>

            <div className="divider-gold w-48 sm:w-64" />

            <p className="font-sans text-[10px] sm:text-xs font-light tracking-[0.25em] text-[rgba(93,74,71,0.5)] uppercase">
              Tap the rising balloons to pop them! 🎈
            </p>

            {/* Rising Balloon Container */}
            <div className="relative w-full h-[180px] sm:h-[220px] overflow-hidden mt-4 rounded-2xl glass-warm">
              {balloons.map((balloon) => (
                <div
                  key={balloon.id}
                  className={`floating-balloon absolute ${balloon.popped ? 'pointer-events-none opacity-0 scale-75' : 'opacity-100'}`}
                  style={{
                    left: `${balloon.x}%`,
                    color: balloon.color,
                    backgroundColor: balloon.color,
                    animation: `riseBalloon ${balloon.speed}s linear infinite`,
                    animationDelay: `${balloon.delay}s`,
                    transform: 'translateY(110%)',
                  }}
                  onClick={(e) => {
                    if (balloon.popped) return;
                    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b));
                    playSynthSound('pop');
                    setPopScore(s => s + 1);
                    const rect = e.currentTarget.getBoundingClientRect();
                    triggerConfettiBlast(rect.left + rect.width / 2, rect.top + rect.height / 2);
                  }}
                />
              ))}

              <div className="absolute bottom-3 right-4 z-10 font-sans text-xs text-[rgba(93,74,71,0.65)] font-light">
                Balloons Popped: <span className="font-bold text-[#bf7080]">{popScore}</span>
              </div>
            </div>
          </div>

          <div className="scroll-indicator absolute bottom-6 sm:bottom-8" id="scroll-ind-1">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Scroll Down</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 4 — Birthday Rules Card
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="rules-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          <div className="w-full max-w-lg flex flex-col items-center">
            <div className="text-center mb-8 flex flex-col items-center gap-3">
              <p className="chapter-eyebrow">Chapter II · The Rules</p>
              <h2 className="display-serif text-[2rem] sm:text-[2.8rem] text-[#4a3e3d]">Birthday Guidelines</h2>
              <p className="font-sans text-[10px] sm:text-xs font-light text-[rgba(93,74,71,0.5)] tracking-[0.2em] uppercase">Please check and agree to all rules below</p>
            </div>

            <div className="glass-warm rounded-[28px] p-6 sm:p-10 w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />

              <div className="flex flex-col gap-5">
                {[
                  "Rule #1: You must smile while reading this. No exceptions! 😊",
                  "Rule #2: You are not allowed to feel guilty about anything today. 🌸",
                  "Rule #3: Headphones mode must remain active. 🎧",
                  "Rule #4: Prepare to be pampered and celebrated. 🎉"
                ].map((rule, idx) => (
                  <div
                    key={idx}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={acceptedRules[idx]}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const copy = [...acceptedRules];
                        copy[idx] = !copy[idx];
                        setAcceptedRules(copy);
                        playSynthSound('pop');
                      }
                    }}
                    className={`rule-check-item glass p-4 rounded-xl flex items-center justify-between border-[0.5px] transition-all duration-300 cursor-pointer ${acceptedRules[idx] ? 'border-[#bf7080] bg-white/40' : 'border-black/5 hover:border-[rgba(201,168,76,0.3)]'
                      }`}
                    onClick={() => {
                      const copy = [...acceptedRules];
                      copy[idx] = !copy[idx];
                      setAcceptedRules(copy);
                      playSynthSound('pop');
                    }}
                  >
                    <span className="font-sans text-xs sm:text-sm font-light text-[#4a3e3d] pr-4">{rule}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${acceptedRules[idx] ? 'bg-[#bf7080] border-[#bf7080]' : 'border-[rgba(93,74,71,0.3)]'
                      }`}>
                      {acceptedRules[idx] && <span className="text-[10px] text-white">✓</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  disabled={!acceptedRules.every(Boolean) || rulesAccepted}
                  onClick={() => {
                    setRulesAccepted(true);
                    playSynthSound('success');
                  }}
                  className={`btn-luxury py-3 px-8 text-xs font-semibold rounded-full w-full max-w-[240px] transition-all duration-500 ${acceptedRules.every(Boolean) && !rulesAccepted
                    ? 'opacity-100 hover:scale-105 pointer-events-auto border-[#bf7080] text-[#bf7080]'
                    : 'opacity-50 pointer-events-none grayscale'
                    }`}
                >
                  {rulesAccepted ? "Rules Accepted 😄" : "Accept Rules & Unlock"}
                </button>
              </div>
            </div>
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-2">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Keep Going</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 5 — Confidential Memory Vault
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="memory-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] flex flex-col justify-center items-center text-center p-6 pointer-events-auto">
              <div className="glass-warm p-8 rounded-2xl max-w-sm flex flex-col items-center gap-4 shadow-xl">
                <span className="text-3xl">🔒</span>
                <h3 className="display-serif text-xl text-[#4a3e3d]">Memory Vault Locked</h3>
                <p className="font-sans text-xs text-[rgba(93,74,71,0.6)] leading-relaxed">Please check and agree to all birthday rules above to unlock this vault.</p>
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl flex flex-col items-center">
            <div className="text-center mb-10 flex flex-col items-center gap-3">
              <p className="chapter-eyebrow">Chapter III · The Vault</p>
              <h2 className="display-serif text-[2rem] sm:text-[3rem] text-[#4a3e3d]">Confidential Memories</h2>
              <p className="font-sans text-[10px] sm:text-xs font-light text-[rgba(93,74,71,0.5)] tracking-[0.2em] uppercase">Tread carefully, contains high amounts of happiness</p>
            </div>

            {!vaultUnlocked ? (
              <div className="glass-warm p-8 sm:p-12 rounded-3xl w-full text-center max-w-md flex flex-col items-center gap-6">
                <p className="font-sans text-xs text-[rgba(93,74,71,0.6)] leading-relaxed">
                  This folder holds encrypted files of shared laughs, nicknames, midnight echoes, and silent promises.
                </p>
                <button
                  onClick={() => {
                    setVaultUnlocked(true);
                    playSynthSound('unlock');
                  }}
                  disabled={!rulesAccepted}
                  className="btn-luxury"
                >
                  Open Secret Folder 📂
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full">
                {vaultCards.map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCard(card);
                        playSynthSound('unlock');
                      }
                    }}
                    onClick={() => {
                      setSelectedCard(card);
                      playSynthSound('unlock');
                    }}
                    className="memory-card glass-warm rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] hover:border-[#bf7080]/30 transition-all duration-300"
                  >
                    <span className="text-3xl mb-3 select-none">{card.emoji}</span>
                    <h3 className="display-serif text-base sm:text-lg text-[#4a3e3d] font-semibold">{card.title}</h3>
                    <p className="font-sans text-[9px] uppercase tracking-wider text-[rgba(191,112,128,0.7)] mt-1">{card.tag}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-3">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Next Chapter</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 6 — The Dream Panel (Baby Toes)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="dream-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] pointer-events-auto" />
          )}
          <div className="w-full max-w-2xl flex flex-col items-center text-center gap-6">
            <p className="chapter-eyebrow">Chapter IV · The Dream</p>
            <div className="divider-gold w-32" />

            <h2 className="display-serif text-[2.2rem] sm:text-[3rem] text-[#4a3e3d] leading-snug">
              👣 Our Tiny Little Dream
            </h2>

            <div className="font-sans text-xs sm:text-sm font-light text-[rgba(93,74,71,0.75)] leading-relaxed max-w-md space-y-4">
              <p>
                One day... I noticed something really unique about you.
                Your right foot has the cutest little detail...
                Your 4th toe is actually shorter than your little toe.
              </p>
              <p>
                At first... I couldn't stop teasing you about it. 😂
              </p>
              <p>
                Then one night... I had the funniest dream. In that dream...
                we had a tiny little baby. And do you know the first thing I noticed?
              </p>
              <p>
                Our baby's right foot... had the exact same tiny 4th toe as yours.
                I woke up laughing. Because even in my dreams...
                our baby inherited your cutest little feature. ❤️
              </p>
              <p className="italic font-serif text-[rgba(93,74,71,0.6)]">
                It's such a random memory... but somehow... I never forgot it.
              </p>
            </div>

            {/* Glowing Watercolor frame of baby toes */}
            <div
              className="relative p-2.5 rounded-3xl glass-warm dream-card-glowing w-[280px] sm:w-[320px] aspect-[4/5] overflow-hidden group cursor-pointer select-none active:scale-[0.98] transition-transform duration-300"
              onMouseDown={startLongPress}
              onMouseUp={endLongPress}
              onMouseLeave={endLongPress}
              onTouchStart={startLongPress}
              onTouchEnd={endLongPress}
              title="Long press to reveal a hidden secret message 💌"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#bf7080]/15 to-[#c9a84c]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              {/* Floating golden Lottie sparkles around the frame */}
              <div className="absolute -top-3 -left-3 w-12 h-12 pointer-events-none z-10 opacity-70">
                <Lottie animationData={sparkleLottie} loop autoplay />
              </div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 pointer-events-none z-10 opacity-60">
                <Lottie animationData={sparkleLottie} loop autoplay />
              </div>

              <div className="w-full h-full rounded-2xl overflow-hidden bg-[#faf6ed] paper-texture-bg relative">
                <Image
                  src="/assets/baby_toes.png"
                  alt="Watercolor Baby Toes"
                  fill
                  sizes="(max-width: 768px) 280px, 320px"
                  className="object-cover opacity-95 img-slow-zoom"
                  loading="lazy"
                />
              </div>
              <div className="absolute -inset-1 rounded-3xl border border-white/20 pointer-events-none" />
              <div className="absolute -inset-2.5 rounded-3xl border border-[#c9a84c]/10 pointer-events-none" />
            </div>

            <p className="font-handwritten text-xl sm:text-2xl text-[#bf7080] max-w-xs pulse-ambient">
              "I guess dreams have good memory too. 🤍"
            </p>
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-4">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Next Chapter</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 7 — Smile Challenge Slider
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="smile-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] pointer-events-auto" />
          )}
          <div className="w-full max-w-lg flex flex-col items-center">
            <div className="text-center mb-8 flex flex-col items-center gap-3">
              <p className="chapter-eyebrow">Chapter V · The Challenge</p>
              <h2 className="display-serif text-[2rem] sm:text-[2.8rem] text-[#4a3e3d]">The Smile Challenge</h2>
              <p className="font-sans text-[10px] sm:text-xs font-light text-[rgba(93,74,71,0.5)] tracking-[0.2em] uppercase">Drag to max level to unlock stardust fireworks</p>
            </div>

            <div className="glass-warm rounded-[28px] p-6 sm:p-10 w-full text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)' }} />

              <div className="text-6xl mb-6 select-none animate-bounce h-[80px] flex items-center justify-center">
                {smileLevel < 25 && "😭"}
                {smileLevel >= 25 && smileLevel < 50 && "😐"}
                {smileLevel >= 50 && smileLevel < 75 && "🙂"}
                {smileLevel >= 75 && smileLevel < 100 && "😄"}
                {smileLevel === 100 && "🤣"}
              </div>

              <div className="mb-4">
                <p className="font-sans text-xs text-[rgba(93,74,71,0.65)] font-light leading-relaxed">
                  {smileLevel < 25 && "A bit more... we need to see that beautiful pout shift."}
                  {smileLevel >= 25 && smileLevel < 50 && "Yes, getting warmer! Keep sliding."}
                  {smileLevel >= 50 && smileLevel < 75 && "That is a gorgeous start, Suji!"}
                  {smileLevel >= 75 && smileLevel < 100 && "Almost there! Complete the smile!"}
                  {smileLevel === 100 && "Perfect! Happiness level 100% unlocked!"}
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full mt-6">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={smileLevel}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSmileLevel(val);
                    if (val === 100) {
                      playSynthSound('success');
                      for (let k = 0; k < 4; k++) {
                        setTimeout(() => {
                          triggerConfettiBlast(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5);
                        }, k * 250);
                      }
                    }
                  }}
                  className="w-full h-1 bg-[rgba(93,74,71,0.1)] rounded-lg appearance-none cursor-pointer accent-[#bf7080]"
                />
                <div className="flex justify-between font-sans text-[10px] text-[rgba(93,74,71,0.55)] font-light mt-1">
                  <span>😭 Pout</span>
                  <span>🤣 Level: {smileLevel}%</span>
                </div>
              </div>

              {smileLevel === 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 font-handwritten text-2xl text-[#bf7080] pulse-ambient"
                >
                  "Total happiness achieved! You look beautiful! ✨"
                </motion.div>
              )}
            </div>
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-5">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Next Chapter</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 8 — Mini-Games Hub
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="games-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] pointer-events-auto" />
          )}
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="text-center mb-10 flex flex-col items-center gap-3">
              <p className="chapter-eyebrow">Chapter VI · The Playground</p>
              <h2 className="display-serif text-[2.2rem] sm:text-[3rem] text-[#4a3e3d]">The Mini-Games Hub</h2>
              <p className="font-sans text-[10px] sm:text-xs font-light text-[rgba(93,74,71,0.5)] tracking-[0.2em] uppercase">Play a quick game to unlock birthday surprises</p>
            </div>

            <MiniGamesHub
              key={resetKey}
              balloons={balloons}
              setBalloons={setBalloons}
              popScore={popScore}
              setPopScore={setPopScore}
              playSynthSound={playSynthSound}
              triggerConfettiBlast={triggerConfettiBlast}
              triggerCakeConfetti={triggerCakeConfetti}
            />
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-6">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Next Chapter</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 3 PART B (Chapter VII) — Beating Heart Placeholder
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="heart-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6 overflow-hidden">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] pointer-events-auto" />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 55% at 50% 55%, rgba(191,112,128,0.06) 0%, transparent 70%)' }} />

          <div className="relative w-full max-w-[1000px] flex flex-col justify-center items-center">
            <canvas
              ref={heartCanvasRef}
              className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[620px] md:h-[620px] z-[3] touch-none cursor-pointer max-lg:pointer-events-none"
            />
            <div className="heart-content-overlay absolute z-[5] text-center max-w-[300px] sm:max-w-[480px] pointer-events-none px-4">
              <h2 className="display-serif text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] text-[#4a3e3d] mb-3 drop-shadow-[0_2px_8px_rgba(183,110,121,0.15)]">
                The Rhythm of Living
              </h2>
              <div className="w-12 mx-auto mb-3" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(191,112,128,0.5), transparent)' }} />
              <p className="font-sans text-xs sm:text-sm font-light text-[rgba(93,74,71,0.65)] leading-relaxed">
                A galaxy of stardust — beating softly, waiting for your touch.
              </p>
              <p className="font-handwritten text-lg sm:text-xl md:text-2xl text-[#bf7080] mt-5 pulse-ambient">
                {isMobile ? 'Tap to send a pulse ✨' : 'Move · click to pulse'}
              </p>
            </div>
          </div>

          <div className="scroll-indicator absolute bottom-6" id="scroll-ind-7">
            <span className="text-[8px] uppercase font-sans tracking-[0.25em] text-[rgba(191,112,128,0.6)]">Final Step</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(191,112,128,0.4)] to-transparent animate-pulse" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SCENE 10 — Finale Entrance Trigger
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section id="finale-trigger-screen" className="min-h-screen flex flex-col justify-center items-center relative py-16 px-4 sm:px-6">
          {!rulesAccepted && (
            <div className="absolute inset-0 z-20 bg-[#faf8f2]/65 backdrop-blur-[6px] pointer-events-auto" />
          )}
          <div className="w-full max-w-md text-center flex flex-col items-center gap-6 glass-warm rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />

            <span className="text-5xl animate-pulse">🎁</span>
            <h2 className="display-serif text-2xl sm:text-3xl text-[#4a3e3d]">The Journey Complete</h2>

            <p className="font-sans text-xs sm:text-sm font-light text-[rgba(93,74,71,0.65)] leading-relaxed">
              You have popped the balloons, accepted the rules, unlocked the confidential memories, smiled to 100%, and extinguished the cake candles.
            </p>

            <p className="font-serif italic text-[#bf7080] text-sm">
              There is only one last card left to reveal.
            </p>

            <button
              onClick={() => {
                playSynthSound('success');
                setStoryStage('grand-celebration');
              }}
              className="btn-luxury w-full mt-4"
            >
              ❤️ Open Your Final Gift
            </button>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════
          SCENE 10 FINALE: GRAND CELEBRATION TYPEWRITER OVERLAY
          ══════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 bg-[#faf8f2] z-[997] flex flex-col justify-center items-center px-6 overflow-hidden select-none transition-all duration-[1.5s] ease-in-out ${storyStage === 'grand-celebration' ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-[1.03]'
          }`}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(254,228,180,0.06) 0%, rgba(191,112,128,0.04) 50%, transparent 80%)' }} />

        <div className="relative z-10 text-center w-full max-w-[640px] mx-auto flex flex-col items-center">
          <p className="chapter-eyebrow mb-6">The Final Message</p>
          <div className="divider-gold w-32 mb-10" />

          <div className="min-h-[160px] flex items-center justify-center px-4 w-full">
            <AnimatePresence mode="wait">
              <motion.h1
                key={messageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="display-serif text-2xl sm:text-[2.6rem] text-[#4a3e3d] leading-[1.35] tracking-tight font-light"
              >
                {finalMessages[messageIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="divider-gold w-32 mt-10" />
          <p className="font-handwritten text-3xl text-[#bf7080] mt-6 pulse-ambient">Suji 🐭 ✦ </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ENDING SCREEN: HEARTBEAT BLACKOUT & MUSIC PLAYER
          ══════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 bg-[#07050d] z-[999] flex flex-col justify-center items-center px-6 overflow-hidden select-none transition-all duration-[2s] ease-in-out ${storyStage === 'ending-screen' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-[20px]'
          }`}
      >
        <div className="relative w-full max-w-[400px] flex flex-col items-center mt-4">
          <canvas
            ref={finalHeartCanvasRef}
            className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] z-[3] touch-none cursor-pointer max-lg:pointer-events-none"
          />
        </div>

        <div className="text-center z-10 -mt-2 flex flex-col items-center w-full max-w-sm">
          <h2 className="display-serif text-[2.2rem] sm:text-[2.8rem] text-[#e8c060] font-light leading-none gold-shimmer-text">
            Happy Birthday, Suji <span className="emoji-normal">🐭</span>
          </h2>
          <p className="font-handwritten text-2xl text-[#bf7080]/90 mt-3 animate-pulse">
            "Thank you for existing."
          </p>

          {/* ── Music Player on Ending Screen ── */}
          <div className="music-player-card glass-rose rounded-2xl p-4 sm:p-5 w-full mt-6 flex flex-col items-center gap-3 bg-white/5 border-white/10 shadow-xl max-w-[320px] text-white">
            <div className="text-center">
              <p className="chapter-eyebrow text-[7px] text-[#bf7080] mb-0.5">Now Playing</p>
              <h3 className="display-serif text-sm text-[#faf8f2] leading-tight font-medium font-serif">
                {playlist[currentTrackIndex].name}
              </h3>
              <p className="font-sans text-[8px] text-[rgba(255,255,255,0.45)] mt-0.5 uppercase tracking-widest">
                {playlist[currentTrackIndex].artist}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="player-btn text-[rgba(255,255,255,0.4)] hover:text-[#bf7080] transition-all duration-300 min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95" onClick={handlePrevTrack} aria-label="Previous">
                <FiSkipBack className="w-4 h-4 text-white/70 hover:text-white" />
              </button>
              <button
                className="w-10 h-10 rounded-full flex justify-center items-center transition-all duration-300 active:scale-95 min-w-[40px] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #e8c060)' }}
                onClick={handleToggleAudio} aria-label={isMuted ? 'Play' : 'Pause'}
              >
                {isMuted ? <FiPlay className="w-4 h-4 text-[#040209] translate-x-0.5" /> : <FiPause className="w-4 h-4 text-[#040209]" />}
              </button>
              <button className="player-btn text-[rgba(255,255,255,0.4)] hover:text-[#bf7080] transition-all duration-300 min-w-[32px] min-h-[32px] flex items-center justify-center active:scale-95" onClick={handleNextTrack} aria-label="Next">
                <FiSkipForward className="w-4 h-4 text-white/70 hover:text-white" />
              </button>
            </div>

            <div className="w-full flex flex-col gap-1">
              <div
                ref={progressBarRef}
                role="slider" aria-label="Playback position"
                className="w-full h-[4px] rounded-full cursor-pointer relative touch-none bg-white/10"
                onClick={(e) => {
                  if (playlist[currentTrackIndex].src !== 'synth' && audioRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration;
                  }
                }}
                onTouchMove={handleProgressTouch}
              >
                <div className="h-full rounded-full absolute left-0 top-0 transition-[width] duration-75"
                  style={{ width: progressBarWidth, background: 'linear-gradient(90deg, #bf7080, #c9a84c)' }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 shadow-md"
                  style={{ left: progressBarWidth, background: '#bf7080' }} />
              </div>
              <div className="flex justify-between text-[8px] font-sans text-white/40">
                <span>{currentTime}</span><span>{totalTime}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setStoryStage('gift-intro');
              setIntroStep(0);
              setIsGiftOpened(false);
              setPopScore(0);
              setResetKey(prev => prev + 1);
              setAcceptedRules([false, false, false, false]);
              setRulesAccepted(false);
              setVaultUnlocked(false);
              setSmileLevel(1);
              setMessageIndex(0);
              playSynthSound('unlock');
            }}
            className="btn-luxury mt-6 py-2 px-5 text-[8px] min-h-[36px] min-w-[110px]"
          >
            Replay Story ↺
          </button>
        </div>
      </div>

      {/* ── Vault Details Card Modal Reveal ── */}
      <AnimatePresence>
        {selectedCard && (
          <VaultModal
            selectedCard={selectedCard}
            onClose={() => {
              setSelectedCard(null);
              playSynthSound('pop');
            }}
            triggerStarsFall={triggerStarsFall}
            triggerCakeConfetti={triggerCakeConfetti}
            playSynthSound={playSynthSound}
          />
        )}
      </AnimatePresence>

      {/* ── Easter Eggs Floating Panel & Discoveries ── */}
      {isIntroFinished && (
        <EasterEggsPanel
          eggsFound={eggsFound}
          triggerCakeConfetti={triggerCakeConfetti}
          triggerStarsFall={triggerStarsFall}
          triggerShakeBalloonsRef={triggerShakeBalloonsRef}
          playSynthSound={playSynthSound}
        />
      )}

      {/* ── Shake Toast Notification ── */}
      <AnimatePresence>
        {shakeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[1000] glass border border-[#bf7080]/20 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg"
          >
            <span className="text-base animate-bounce">🎈</span>
            <span className="font-sans text-xs text-[#4a3e3d] font-medium tracking-wide">
              Phone Shake Detected! Spawning balloons! 🎈
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hidden Message Modal (Long Press Easter Egg) ── */}
      <AnimatePresence>
        {showHiddenMessage && (
          <HiddenMessageModal
            showHiddenMessage={showHiddenMessage}
            onClose={() => setShowHiddenMessage(false)}
            playSynthSound={playSynthSound}
          />
        )}
      </AnimatePresence>
    </>
  );
}