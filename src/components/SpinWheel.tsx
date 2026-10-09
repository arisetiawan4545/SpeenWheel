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
    
    // Cek apakah masih ada barang yang bisa dimenangkan
    const availableItems = items.filter(item => item.quantity > 0);
    if (availableItems.length === 0) {
      alert("Maaf, semua hadiah sudah habis!");
      return;
    }

    setIsSpinning(true);

    // LOGIKA AUTO-REROUTE: Hanya menghitung peluang dari item yang stoknya > 0
    const totalAvailableWinRate = availableItems.reduce((sum, item) => sum + item.winRate, 0);
    
    let randomNum = Math.random() * totalAvailableWinRate; 
    let cumulativeRate = 0;
    let selectedWinnerIndex = 0;

    for (let i = 0; i < items.length; i++) {
      // Lewati (skip) item kalau stoknya sudah 0
      if (items[i].quantity > 0) {
        cumulativeRate += items[i].winRate;
        if (randomNum <= cumulativeRate) {
          selectedWinnerIndex = i; // Index ini tetap sinkron dengan urutan visual roda
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

  const itemCount = items.length;
  
  // Ukuran gambar diperbesar
  const imageSizeClass = 
    itemCount > 8 ? 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12' : 
    itemCount > 5 ? 'w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16' : 
    'w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20';

  // Ukuran teks diperbesar
  const textSizeClass = 
    itemCount > 8 ? 'text-[7px] sm:text-[9px] md:text-[11px] lg:text-xs' : 
    itemCount > 5 ? 'text-[9px] sm:text-[11px] md:text-sm lg:text-base' : 
    'text-[11px] sm:text-xs md:text-base lg:text-lg';

  // Kontainer teks & gambar diperlebar agar tidak terpotong
  const containerWidthClass = 
    itemCount > 8 ? 'w-14 sm:w-20 md:w-24' : 
    itemCount > 5 ? 'w-20 sm:w-28 md:w-32' : 
    'w-28 sm:w-36 md:w-44';

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
      
      {/* Container Roda */}
      <div className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[550px] md:h-[550px] lg:w-[650px] lg:h-[650px] rounded-full shadow-[0_0_60px_rgba(0,0,0,0.6)] flex items-center justify-center bg-[#1e293b] ring-[8px] sm:ring-[12px] ring-slate-800/80">
        
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
                <div className="w-full h-[80px] sm:h-[105px] md:h-[125px] lg:h-[145px] flex flex-col items-center justify-start pt-2 sm:pt-4 lg:pt-6 px-1">
                  
                  {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className={`${imageSizeClass} object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]`} />
                  ) : (
                      <div className={`${imageSizeClass} bg-white/10 rounded-xl shadow-inner flex items-center justify-center border border-white/20`}>
                        <span className="text-white/40 text-[6px] sm:text-[8px]">No</span>
                      </div>
                  )}

                  {/* Teks Hadiah */}
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

        {/* Lubang Donat Tengah */}
        <div className="absolute z-20 w-[160px] h-[160px] sm:w-[240px] sm:h-[240px] md:w-[300px] md:h-[300px] lg:w-[360px] lg:h-[360px] bg-[#0f172a] rounded-full shadow-[inset_0_10px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.8)] border-[6px] sm:border-[8px] md:border-[10px] lg:border-[12px] border-[#1e293b] flex flex-col items-center justify-center p-2 sm:p-4">
           <div className="flex flex-col items-center justify-center w-full max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[240px] h-full">
             
             {/* Label MYSEHATI dengan margin bawah yang disesuaikan */}
             <div className="bg-slate-800/80 border border-slate-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 mb-4 sm:mb-6 lg:mb-8 shadow-inner">
                <Hexagon size={10} fill="#fbbf24" className="text-amber-500 sm:w-[14px] sm:h-[14px]" />
                <span className="text-amber-400 font-black text-[7px] sm:text-xs lg:text-sm tracking-widest">MYSEHATI</span>
             </div>
             
             {/* Tombol Putar */}
             <button 
                onClick={onSpinClick}
                disabled={isSpinning}
                className="w-full py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-black text-[8px] sm:text-xs lg:text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border sm:border-2 border-indigo-400/30"
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