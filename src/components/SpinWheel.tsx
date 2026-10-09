// src/components/SpinWheel.tsx
"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Prize } from '../types';
import { Play } from 'lucide-react';

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
  
  // Ukuran gambar diperbesar karena sekarang punya ruang kosong di tengah
  const imageSizeClass = 
    itemCount > 8 ? 'w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16' : 
    itemCount > 5 ? 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24' : 
    'w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32';

  // Ukuran teks sedikit diperbesar karena melingkar di luar
  const textSizeClass = 
    itemCount > 8 ? 'text-[8px] sm:text-[10px] md:text-xs lg:text-sm' : 
    itemCount > 5 ? 'text-[10px] sm:text-xs md:text-sm lg:text-base' : 
    'text-xs sm:text-sm md:text-lg lg:text-xl';

  // Lebar kontainer dibuat lebih besar agar teks melingkar tidak terpotong
  const containerWidthClass = 
    itemCount > 8 ? 'w-20 sm:w-28 md:w-36' : 
    itemCount > 5 ? 'w-28 sm:w-40 md:w-48' : 
    'w-40 sm:w-56 md:w-72';

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
        
        {/* 3D Outer Rim dgn Lampu Titik */}
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

          {/* Render Slot/Hadiah (Teks di Pinggir, Gambar di Tengah) */}
          {items.map((item, index) => {
            const sliceCenterAngle = (360 / items.length) * index + (360 / items.length) / 2;
            
            return (
              <div 
                key={item.id} 
                className={`absolute top-0 left-1/2 ${containerWidthClass} h-1/2 origin-bottom z-10`}
                style={{ transform: `translateX(-50%) rotate(${sliceCenterAngle}deg)` }}
              >
                {/* 
                  Perubahan Utama: 
                  - Padding atas (pt) dikurangi agar teks mepet ke pinggir luar.
                  - Jarak (mt) antara teks dan gambar diperbesar agar gambar jatuh di area tengah segitiga.
                */}
                <div className="w-full h-full flex flex-col items-center justify-start pt-2 sm:pt-3 md:pt-4 px-1">
                  
                  {/* Teks Hadiah (Melengkung di pinggir) */}
                  <div className="text-center w-full mb-2 sm:mb-4 lg:mb-6 px-2">
                    <h3 className={`text-white font-black ${textSizeClass} leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wider line-clamp-2`}
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5)' }}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Gambar (Di tengah segitiga) */}
                  {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className={`${imageSizeClass} object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.9)]`} />
                  ) : (
                      <div className={`${imageSizeClass} bg-white/10 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/20`}>
                        <span className="text-white/40 font-bold text-[8px] sm:text-xs">No img</span>
                      </div>
                  )}

                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Lubang Poros Tengah & Tombol Putar (Diperkecil menjadi bulat) */}
        <div className="absolute z-30 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] bg-gradient-to-br from-[#2a0505] to-[#000000] rounded-full shadow-[inset_0_15px_30px_rgba(255,255,255,0.05),inset_0_-10px_30px_rgba(0,0,0,0.9),0_10px_30px_rgba(0,0,0,0.8)] border-[3px] sm:border-[5px] md:border-[6px] border-[#3a0505] flex flex-col items-center justify-center p-2">
           
           <button 
              onClick={onSpinClick}
              disabled={isSpinning}
              className="w-full h-full rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-900 text-white font-black flex flex-col items-center justify-center gap-0.5 sm:gap-1 shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),0_10px_20px_rgba(225,29,72,0.6)] hover:shadow-[inset_0_2px_5px_rgba(255,255,255,0.6),0_12px_25px_rgba(225,29,72,0.8)] hover:scale-105 active:scale-95 active:shadow-[inset_0_5px_10px_rgba(0,0,0,0.5),0_0_0_rgba(225,29,72,0)] transition-all disabled:opacity-50 border sm:border-2 border-red-400/80"
            >
              <Play fill="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 ml-1" />
              <span className="text-[9px] sm:text-[11px] md:text-sm tracking-widest drop-shadow-md">SPIN</span>
            </button>
            
        </div>
      </div>
    </div>
  );
});

SpinWheel.displayName = "SpinWheel";
export default SpinWheel;