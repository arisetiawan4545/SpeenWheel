// src/components/SpinWheel.tsx
"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Prize } from '../types';
import { Hexagon, Sparkles } from 'lucide-react';

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

    let randomNum = Math.random() * 100; 
    let cumulativeRate = 0;
    let selectedWinnerIndex = 0;

    for (let i = 0; i < items.length; i++) {
      cumulativeRate += items[i].winRate;
      if (randomNum <= cumulativeRate && items[i].quantity > 0) {
        selectedWinnerIndex = i;
        break;
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
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, zIndex: 100, colors: ['#ffffff', '#818cf8', '#c084fc', '#f472b6'] });
      }

      onWin(winningPrize);
    }, 5500);
  };

  const wheelGradient = items.map((item, i) => {
    const startAngle = (360 / items.length) * i;
    const endAngle = (360 / items.length) * (i + 1);
    return `${item.color} ${startAngle}deg ${endAngle}deg`;
  }).join(', ');

  // Perbaikan Ukuran Adaptif & Mobile: Ekstra Aman untuk Layar Kecil (320px)
  const itemCount = items.length;
  const imageSizeClass = 
    itemCount > 8 ? 'w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-9 lg:h-9' : 
    itemCount > 5 ? 'w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 lg:w-11 lg:h-11' : 
    'w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 lg:w-14 lg:h-14';

  const textSizeClass = 
    itemCount > 8 ? 'text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px]' : 
    itemCount > 5 ? 'text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px]' : 
    'text-[8px] sm:text-[10px] md:text-xs lg:text-sm';

  const containerWidthClass = 
    itemCount > 8 ? 'w-10 sm:w-14 md:w-18 lg:w-20' : 
    itemCount > 5 ? 'w-14 sm:w-20 md:w-24 lg:w-28' : 
    'w-20 sm:w-28 md:w-36 lg:w-44';

  if (items.length === 0) {
    return <div className="text-white text-center p-4">Silakan pilih program dan tambahkan hadiah.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto relative mt-6 sm:mt-8 md:mt-12">
      
      {/* Panah Penunjuk */}
      <div className="absolute top-0 z-30 flex flex-col items-center -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-14">
        <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gradient-to-b from-indigo-300 to-indigo-600 rotate-45 rounded-sm shadow-[0_0_20px_rgba(99,102,241,0.8)] border sm:border-2 border-indigo-200 z-10"></div>
        <div className="w-0 h-0 border-l-[8px] sm:border-l-[10px] lg:border-l-[12px] border-l-transparent border-r-[8px] sm:border-r-[10px] lg:border-r-[12px] border-r-transparent border-t-[16px] sm:border-t-[20px] lg:border-t-[24px] border-t-indigo-500 -mt-1 sm:-mt-2 shadow-xl"></div>
      </div>
      
      {/* Container Roda - Diperkecil jadi 300px untuk layar HP kecil */}
      <div className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px] rounded-full shadow-[0_0_60px_rgba(0,0,0,0.6)] flex items-center justify-center bg-[#1e293b] ring-[8px] sm:ring-[12px] ring-slate-800/80">
        
        <motion.div 
          className="absolute inset-0 w-full h-full rounded-full overflow-hidden opacity-90 border-[4px] border-slate-700/50"
          style={{ background: `conic-gradient(${wheelGradient})` }}
          animate={{ rotate: rotation }}
          transition={{ duration: 5.5, ease: [0.15, 0.9, 0.2, 1] }}
        >
          {items.map((item, index) => {
            const sliceCenterAngle = (360 / items.length) * index + (360 / items.length) / 2;
            
            return (
              <div 
                key={item.id} 
                className={`absolute top-0 left-1/2 ${containerWidthClass} h-1/2 origin-bottom z-10`}
                style={{ transform: `translateX(-50%) rotate(${sliceCenterAngle}deg)` }}
              >
                {/* WRAPPER BARU: Tinggi disesuaikan dengan area cincin (Roda - Donat / 2) secara akurat */}
                {/* 300-180 = 120/2 = 60px | 450-260 = 190/2 = 95px | 550-320 = 230/2 = 115px | 650-380 = 270/2 = 135px */}
                <div className="w-full h-[60px] sm:h-[95px] md:h-[115px] lg:h-[135px] flex flex-col items-center justify-center px-1">
                  
                  {/* Gambar Hadiah */}
                  {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className={`${imageSizeClass} object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]`} />
                  ) : (
                      <div className={`${imageSizeClass} bg-white/10 rounded-xl shadow-inner flex items-center justify-center border border-white/20`}>
                        <span className="text-white/40 text-[6px] sm:text-[8px]">No</span>
                      </div>
                  )}

                  {/* Teks Hadiah */}
                  <div className="text-center mt-0.5 sm:mt-1 w-full">
                    <h3 className={`text-white font-black ${textSizeClass} leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)] line-clamp-2`}>
                      {item.name}
                    </h3>
                    <p className="text-[5px] sm:text-[7px] md:text-[8px] lg:text-[9px] font-bold text-indigo-300 drop-shadow-md tracking-wider mt-0.5 bg-black/40 rounded px-1 py-[2px] inline-block">
                      {item.winRate}%
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Lubang Donat Tengah - Base-nya turun ke 180px supaya seimbang */}
        <div className="absolute z-20 w-[180px] h-[180px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] lg:w-[380px] lg:h-[380px] bg-[#0f172a] rounded-full shadow-[inset_0_10px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.8)] border-[6px] sm:border-[8px] md:border-[10px] lg:border-[12px] border-[#1e293b] flex flex-col items-center justify-center p-2 sm:p-4">
           <div className="flex flex-col items-center w-full max-w-[140px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px]">
             <div className="bg-slate-800/80 border border-slate-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-3 lg:mb-4 shadow-inner">
                <Hexagon size={12} fill="#fbbf24" className="text-amber-500 sm:w-[14px] sm:h-[14px]" />
                <span className="text-amber-400 font-black text-[9px] sm:text-xs lg:text-sm tracking-widest">MYSEHATI</span>
             </div>
             <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-4 w-full text-center shadow-lg mb-2 sm:mb-4 lg:mb-5">
                <h2 className="text-white font-bold text-xs sm:text-sm lg:text-lg flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                  <Sparkles size={14} className="text-indigo-400 sm:w-[16px] sm:h-[16px]" /> Premium Chest
                </h2>
                <p className="text-slate-400 text-[8px] sm:text-[10px] lg:text-xs leading-relaxed px-1">
                  Dapatkan hadiah eksklusif.
                </p>
             </div>
             <button 
                onClick={onSpinClick}
                disabled={isSpinning}
                className="w-full py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-black text-[9px] sm:text-xs lg:text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border sm:border-2 border-indigo-400/30"
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