// src/components/SpinWheel.tsx
"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Prize } from '../types';
import { Hexagon } from 'lucide-react';

export interface SpinWheelRef {
  startSpin: () => void;
}

interface SpinWheelProps {
  items: Prize[];
  onSpinClick: () => void;
  onWin: (prize: Prize) => void;
}

const SpinWheel = forwardRef<SpinWheelRef, SpinWheelProps>(({ items, onWin, onSpinClick }, ref) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0); 

  useImperativeHandle(ref, () => ({
    startSpin: () => {
      spin();
    }
  }));

  const spin = () => {
    if (isSpinning || items.length === 0) return;
    
    const availableItems = items.filter(item => item.quantity > 0);
    if (availableItems.length === 0) {
      alert("Maaf, semua hadiah sudah habis!");
      return;
    }

    setIsSpinning(true);

    const totalAvailableWinRate = availableItems.reduce((sum, item) => sum + item.winRate, 0);
    
    let randomNum = Math.random() * totalAvailableWinRate; 
    let cumulativeRate = 0;
    let selectedWinnerIndex = 0;

    for (let i = 0; i < items.length; i++) {
      if (items[i].quantity > 0) {
        cumulativeRate += items[i].winRate;
        if (randomNum <= cumulativeRate) {
          selectedWinnerIndex = i; 
          break;
        }
      }
    }

    const sliceAngle = 360 / items.length;
    const spinTo = (360 - (selectedWinnerIndex * sliceAngle + sliceAngle / 2)) + (360 * 10);
    const newRotation = rotation + spinTo - (rotation % 360);

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const winningPrize = items[selectedWinnerIndex];
      
      if (winningPrize.name.toLowerCase() !== "zonk") {
        confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 }, zIndex: 100, colors: ['#ffffff', '#ef4444', '#f43f5e', '#fbbf24'] });
      }

      onWin(winningPrize);
    }, 5500); 
  };

  const wheelGradient = items.map((item, i) => {
    const startAngle = (360 / items.length) * i;
    const endAngle = (360 / items.length) * (i + 1);
    return `${item.color} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  const itemCount = items.length;
  
  const imageSizeClass = 
    itemCount > 8 ? 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12' : 
    itemCount > 5 ? 'w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16' : 
    'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20';

  const textSizeClass = 
    itemCount > 8 ? 'text-[7px] sm:text-[9px] md:text-[11px] lg:text-xs' : 
    itemCount > 5 ? 'text-[9px] sm:text-[11px] md:text-sm lg:text-base' : 
    'text-[11px] sm:text-xs md:text-base lg:text-lg';

  const containerWidthClass = 
    itemCount > 8 ? 'w-14 sm:w-20 md:w-24' : 
    itemCount > 5 ? 'w-20 sm:w-28 md:w-32' : 
    'w-28 sm:w-36 md:w-44';

  if (items.length === 0) {
    return <div className="text-white text-center p-4">Silakan pilih program dan tambahkan hadiah.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto relative mt-8 sm:mt-12 md:mt-16 mb-8 z-10">
      
      {/* 3D Pointer Arrow (Jarum Penunjuk) */}
      <div className="absolute top-[-30px] sm:top-[-45px] md:top-[-55px] z-50 flex flex-col items-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-white via-rose-300 to-red-600 rotate-45 rounded-sm shadow-[inset_0_2px_5px_rgba(255,255,255,1),0_0_20px_rgba(225,29,72,0.9)] border-2 sm:border-[3px] border-red-200 z-10"></div>
        <div className="w-0 h-0 border-l-[12px] sm:border-l-[15px] lg:border-l-[18px] border-l-transparent border-r-[12px] sm:border-r-[15px] lg:border-r-[18px] border-r-transparent border-t-[20px] sm:border-t-[25px] lg:border-t-[30px] border-t-red-700 -mt-2 sm:-mt-3 z-0 drop-shadow-md"></div>
      </div>

      {/* Rangka Utama */}
      <div className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px] flex items-center justify-center">
        
        {/* 3D Outer Rim dgn Lampu Titik (Bagian Pinggir Statis) */}
        <div className="absolute inset-[-16px] sm:inset-[-24px] md:inset-[-30px] rounded-full bg-gradient-to-br from-red-900 via-red-950 to-black border-[4px] sm:border-[6px] border-red-700 shadow-[0_20px_50px_rgba(225,29,72,0.5),inset_0_5px_15px_rgba(255,255,255,0.2),inset_0_-5px_15px_rgba(0,0,0,0.8)] z-0 flex items-center justify-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={`light-${i}`}
              className="absolute top-0 left-1/2 w-2 h-1/2 origin-bottom"
              style={{ transform: `translateX(-50%) rotate(${i * 15}deg)` }}
            >
              <div
                className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4.5 md:h-4.5 rounded-full bg-yellow-100 shadow-[0_0_12px_#fde047,0_0_25px_#fbbf24] -mt-1 sm:-mt-1.5 md:-mt-2 ${i % 2 === 0 ? 'animate-pulse' : ''}`}
                style={{ animationDuration: '0.8s', animationDelay: `${i * 0.1}s` }}
              ></div>
            </div>
          ))}
        </div>

        {/* Roda Berputar */}
        <motion.div 
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] border-[2px] sm:border-[4px] border-white/10 z-10"
          style={{ background: `conic-gradient(${wheelGradient})` }}
          animate={{ rotate: isSpinning ? rotation : rotation + 360 }}
          transition={
            isSpinning 
              ? { duration: 5.5, ease: [0.15, 0.9, 0.2, 1] } 
              : { duration: 15, ease: "linear", repeat: Infinity } 
          }
        >
          {/* Efek Kaca/Lengkung 3D Sphere Overlay */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35)_0%,transparent_50%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-30 mix-blend-overlay"></div>

          {/* Garis Pemisah Slot 3D (Bevels) */}
          {items.map((_, i) => (
            <div
              key={`divider-${i}`}
              className="absolute top-0 left-1/2 w-[2px] sm:w-[3px] h-1/2 origin-bottom bg-gradient-to-b from-white/50 via-black/30 to-black/90 z-20"
              style={{ transform: `translateX(-50%) rotate(${(360 / items.length) * i}deg)` }}
            >
              <div className="absolute inset-0 bg-black/60 blur-[1px] translate-x-[2px]"></div>
            </div>
          ))}

          {/* Render Slot/Hadiah */}
          {items.map((item, index) => {
            const sliceCenterAngle = (360 / items.length) * index + (360 / items.length) / 2;
            
            return (
              <div 
                key={item.id} 
                className={`absolute top-0 left-1/2 ${containerWidthClass} h-1/2 origin-bottom z-10`}
                style={{ transform: `translateX(-50%) rotate(${sliceCenterAngle}deg)` }}
              >
                <div className="w-full h-[80px] sm:h-[105px] md:h-[125px] lg:h-[145px] flex flex-col items-center justify-start pt-2 sm:pt-4 lg:pt-6 px-1">
                  
                  {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className={`${imageSizeClass} object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.9)]`} />
                  ) : (
                      <div className={`${imageSizeClass} bg-white/10 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/20`}>
                        <span className="text-white/40 text-[6px] sm:text-[8px]">No</span>
                      </div>
                  )}

                  <div className="text-center mt-1 sm:mt-2 w-full">
                    <h3 className={`text-white font-black ${textSizeClass} leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-2`}>
                      {item.name}
                    </h3>
                  </div>

                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Lubang Donat Tengah (Glow Merah & 3D Hub) */}
        <div className="absolute z-30 w-[160px] h-[160px] sm:w-[240px] sm:h-[240px] md:w-[300px] md:h-[300px] lg:w-[360px] lg:h-[360px] bg-gradient-to-br from-[#2a0505] to-[#000000] rounded-full shadow-[inset_0_15px_30px_rgba(255,255,255,0.05),inset_0_-10px_30px_rgba(0,0,0,0.9),0_10px_30px_rgba(0,0,0,0.8)] border-[4px] sm:border-[8px] md:border-[10px] lg:border-[12px] border-[#3a0505] flex flex-col items-center justify-center p-2 sm:p-4">
           <div className="flex flex-col items-center justify-center w-full max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[240px] h-full">
             
             <div className="bg-red-950 border border-red-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-6 lg:mb-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_4px_rgba(255,255,255,0.1)]">
                <Hexagon size={10} fill="#ef4444" className="text-red-400 sm:w-[14px] sm:h-[14px]" />
                <span className="text-white font-black text-[7px] sm:text-xs lg:text-sm tracking-widest">MYSEHATI</span>
             </div>
             
             <button 
                onClick={onSpinClick}
                disabled={isSpinning}
                className="w-full py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-rose-900 text-white font-black text-[8px] sm:text-xs lg:text-sm uppercase tracking-widest shadow-[inset_0_2px_2px_rgba(255,255,255,0.4),0_10px_20px_rgba(225,29,72,0.6)] hover:shadow-[inset_0_2px_2px_rgba(255,255,255,0.6),0_12px_25px_rgba(225,29,72,0.8)] hover:scale-105 active:scale-95 active:shadow-[inset_0_5px_10px_rgba(0,0,0,0.5),0_0_0_rgba(225,29,72,0)] transition-all disabled:opacity-50 border sm:border-[3px] border-red-400/80"
              >
                {isSpinning ? 'Membuka...' : 'PUTAR SEKARANG'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
});

SpinWheel.displayName = "SpinWheel";
export default SpinWheel;