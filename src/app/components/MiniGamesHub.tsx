"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import sparkleLottie from "../../../public/assets/lottie_sparkle.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface MiniGamesHubProps {
  balloons: { id: number; x: number; color: string; speed: number; delay: number; popped: boolean }[];
  setBalloons: React.Dispatch<React.SetStateAction<{ id: number; x: number; color: string; speed: number; delay: number; popped: boolean }[]>>;
  popScore: number;
  setPopScore: React.Dispatch<React.SetStateAction<number>>;
  playSynthSound: (type: 'unlock' | 'pulse' | 'pop' | 'success') => void;
  triggerConfettiBlast: (x: number, y: number) => void;
  triggerCakeConfetti: (x: number, y: number) => void;
}

export default function MiniGamesHub({
  balloons,
  setBalloons,
  popScore,
  setPopScore,
  playSynthSound,
  triggerConfettiBlast,
  triggerCakeConfetti,
}: MiniGamesHubProps) {
  const [activeGame, setActiveGame] = useState<'pop' | 'teddy' | 'candles' | null>(null);

  // Game 2 (Teddy Finder) state
  const [teddyIndex, setTeddyIndex] = useState(-1);
  const [revealedTeddyGrid, setRevealedTeddyGrid] = useState<boolean[]>(Array(16).fill(false));
  const [teddyFound, setTeddyFound] = useState(false);

  // Game 3 (Cake Candles) state
  const [candlesBlown, setCandlesBlown] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    setTeddyIndex(Math.floor(Math.random() * 16));
  }, []);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="flex gap-2 sm:gap-4 mb-8">
        {[
          { id: 'pop', title: 'Balloon Pop 🎈' },
          { id: 'teddy', title: 'Teddy Finder 🧸' },
          { id: 'candles', title: 'Cake Candle 🎂' }
        ].map(g => (
          <button
            key={g.id}
            onClick={(e) => {
              setActiveGame(g.id as any);
              playSynthSound('pop');
              if (g.id === 'candles') {
                triggerCakeConfetti(e.clientX, e.clientY);
              }
            }}
            className={`px-4 py-2 text-xs uppercase font-semibold rounded-full tracking-wider transition-all duration-300 border ${activeGame === g.id
                ? 'border-[#bf7080] bg-[#bf7080] text-white shadow-md'
                : 'border-[rgba(191,112,128,0.2)] bg-white/40 text-[rgba(93,74,71,0.7)] hover:border-[#bf7080]/40'
              }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="glass-warm rounded-[28px] p-6 sm:p-10 w-full text-center relative overflow-hidden min-h-[340px] flex items-center justify-center">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(191,112,128,0.3), transparent)' }} />

        {activeGame === null && (
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <span className="text-5xl animate-bounce mb-2">🎮</span>
            <h3 className="display-serif text-xl text-[#4a3e3d]">Select a game to start</h3>
            <p className="font-sans text-xs text-[rgba(93,74,71,0.6)] leading-relaxed">Let's double the fun with interactive tests specifically created for Suji! 🐭</p>
          </div>
        )}

        {/* Balloon Pop Game */}
        {activeGame === 'pop' && (
          <div className="w-full flex flex-col items-center gap-4">
            <h3 className="display-serif text-xl text-[#bf7080]">Balloon Popping Game</h3>
            <p className="font-sans text-xs text-[rgba(93,74,71,0.6)]">Pop 10 balloons to win! Current score: <span className="font-bold text-[#bf7080]">{popScore}</span></p>

            {popScore >= 10 ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="mt-4 p-4 rounded-xl bg-white/50 border border-[#bf7080]/30 max-w-sm">
                <span className="text-2xl">🏆</span>
                <h4 className="font-serif text-lg text-[#4a3e3d] mt-2 font-semibold">Victory!</h4>
                <p className="font-sans text-xs text-[rgba(93,74,71,0.65)] mt-1 leading-relaxed">"You have unmatched reflex skills, Suji! You deserve all the good things today! 🐭"</p>
              </motion.div>
            ) : (
              <div className="relative w-full h-[220px] bg-white/20 rounded-xl overflow-hidden mt-2 border border-black/5">
                {balloons.map((balloon) => (
                  <div
                    key={balloon.id}
                    className={`floating-balloon absolute ${balloon.popped ? 'pointer-events-none opacity-0 scale-75' : 'opacity-100'}`}
                    style={{
                      left: `${balloon.x}%`,
                      color: balloon.color,
                      backgroundColor: balloon.color,
                      animation: `riseBalloon ${balloon.speed * 0.7}s linear infinite`,
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
              </div>
            )}
          </div>
        )}

        {/* Teddy Finder Game */}
        {activeGame === 'teddy' && (
          <div className="w-full flex flex-col items-center gap-4">
            <h3 className="display-serif text-xl text-[#bf7080]">Find the Hidden Teddy 🧸</h3>
            <p className="font-sans text-xs text-[rgba(93,74,71,0.6)]">One of the tiles below hides a warm, fuzzy teddy bear. Tap to find him!</p>

            {teddyFound ? (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="p-4 rounded-xl bg-white/50 border border-[#bf7080]/30 max-w-sm flex flex-col items-center gap-2">
                <span className="text-4xl animate-bounce">🧸</span>
                <h4 className="font-serif text-lg text-[#4a3e3d] font-semibold">You Found Teddy!</h4>
                <p className="font-sans text-xs text-[rgba(93,74,71,0.65)] leading-relaxed">Teddy gives you a huge virtual hug and says: "Happy Birthday, Suji! You're doing wonderful, keep smiling! 🧸"</p>
                <button
                  onClick={() => {
                    setTeddyFound(false);
                    setRevealedTeddyGrid(Array(16).fill(false));
                    setTeddyIndex(Math.floor(Math.random() * 16));
                    playSynthSound('pop');
                  }}
                  className="text-[9px] uppercase tracking-widest text-[#bf7080] font-semibold hover:underline mt-2"
                >
                  Play Again ↺
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-4 gap-2.5 max-w-[240px] mx-auto mt-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    tabIndex={0}
                    role="button"
                    aria-label={`Tile ${i + 1}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (revealedTeddyGrid[i] || teddyFound) return;
                        const copy = [...revealedTeddyGrid];
                        copy[i] = true;
                        setRevealedTeddyGrid(copy);
                        if (i === teddyIndex) {
                          setTeddyFound(true);
                          playSynthSound('success');
                          triggerConfettiBlast(window.innerWidth / 2, window.innerHeight / 2);
                        } else {
                          playSynthSound('pop');
                        }
                      }
                    }}
                    onClick={() => {
                      if (revealedTeddyGrid[i] || teddyFound) return;
                      const copy = [...revealedTeddyGrid];
                      copy[i] = true;
                      setRevealedTeddyGrid(copy);
                      if (i === teddyIndex) {
                        setTeddyFound(true);
                        playSynthSound('success');
                        triggerConfettiBlast(window.innerWidth / 2, window.innerHeight / 2);
                      } else {
                        playSynthSound('pop');
                      }
                    }}
                    className={`aspect-square w-12 sm:w-14 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 font-sans text-lg border ${revealedTeddyGrid[i]
                        ? (i === teddyIndex ? 'bg-[#ffd7dd]/60 border-[#bf7080] scale-95 shadow-inner' : 'bg-white/10 border-black/5 scale-95 opacity-50')
                        : 'bg-white/60 border-black/5 hover:border-[rgba(201,168,76,0.3)] shadow-sm'
                      }`}
                  >
                    {revealedTeddyGrid[i] ? (i === teddyIndex ? "🧸" : "❌") : "❓"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cake Candle Blowing */}
        {activeGame === 'candles' && (
          <div className="w-full flex flex-col items-center gap-4">
            <h3 className="display-serif text-xl text-[#bf7080]">Blow the Cake Candles</h3>
            <p className="font-sans text-xs text-[rgba(93,74,71,0.6)]">A virtual cake made for you. Tap the candle flames to blow them out!</p>

            <div className="flex flex-col items-center gap-6 mt-4">
              <div className="relative flex flex-col items-center">
                <div className="flex gap-6 z-10 -mb-2">
                  {[0, 1, 2].map(idx => (
                    <div
                      key={idx}
                      tabIndex={0}
                      role="button"
                      aria-label={`Candle ${idx + 1}`}
                      aria-checked={candlesBlown[idx]}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (candlesBlown[idx]) return;
                          const copy = [...candlesBlown];
                          copy[idx] = true;
                          setCandlesBlown(copy);
                          playSynthSound('pop');
                          if (copy.every(Boolean)) {
                            playSynthSound('success');
                            triggerConfettiBlast(window.innerWidth / 2, window.innerHeight * 0.45);
                          }
                        }
                      }}
                      onClick={() => {
                        if (candlesBlown[idx]) return;
                        const copy = [...candlesBlown];
                        copy[idx] = true;
                        setCandlesBlown(copy);
                        playSynthSound('pop');
                        if (copy.every(Boolean)) {
                          playSynthSound('success');
                          triggerConfettiBlast(window.innerWidth / 2, window.innerHeight * 0.45);
                        }
                      }}
                      className="relative flex flex-col items-center cursor-pointer group"
                      style={{ width: 14 }}
                    >
                      <div style={{ width: 1.5, height: 8, background: '#222', borderRadius: '1px 1px 0 0' }} />
                      {!candlesBlown[idx] && (
                        <div
                          className="flame-flicker absolute"
                          style={{
                            width: 10, height: 18, top: -20, left: '50%', transform: 'translateX(-50%)',
                            borderRadius: '50% 50% 28% 28%', transformOrigin: '50% 100%',
                            background: 'radial-gradient(ellipse at 50% 100%, #fff 0%, #ffd54f 50%, #ffb74d 100%)',
                            boxShadow: '0 -4px 10px rgba(255,150,0,0.5)', zIndex: 12
                          }}
                        />
                      )}
                      <div className="w-2.5 h-12 bg-gradient-to-r from-red-300 via-pink-100 to-red-300 border-[0.5px] border-red-400 rounded-t" />
                    </div>
                  ))}
                </div>

                <div className="w-36 h-12 bg-gradient-to-b from-[#ffd7dd] to-[#fbcbc9] border border-white/40 rounded-xl shadow-lg flex items-center justify-center relative">
                  <div className="absolute inset-x-0 top-3 h-2.5 bg-yellow-600/10" />
                  <div className="absolute inset-x-0 bottom-2 h-1 bg-[#bf7080]/30" />
                  <span
                    onClick={(e) => {
                      triggerCakeConfetti(e.clientX, e.clientY);
                      playSynthSound('success');
                    }}
                    className="font-handwritten text-sm text-[#bf7080]/90 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 select-none"
                    title="Tap the cake for confetti! 🎂"
                  >
                    🎂 Suji 🐭
                  </span>
                </div>
              </div>

              {candlesBlown.every(Boolean) ? (
                <div className="font-handwritten text-2xl text-[#bf7080] mt-2">
                  "Make a silent wish... your stars are listening! 🌌"
                </div>
              ) : (
                <p className="font-handwritten text-base text-[rgba(93,74,71,0.55)] animate-pulse">Tap each flame to extinguish it</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
