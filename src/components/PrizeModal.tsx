import { motion } from 'framer-motion';
import { Prize } from '../types';

interface PrizeModalProps {
  winner: Prize | null;
  onClose: () => void;
}

export default function PrizeModal({ winner, onClose }: PrizeModalProps) {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="bg-[#0f172a]/95 backdrop-blur-2xl border border-indigo-500/50 text-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.5)] text-center w-full max-w-sm relative overflow-hidden"
      >
        {/* Dekorasi Cahaya di Latar Modal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

        {winner.imageUrl && (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
            <img src={winner.imageUrl} className="relative z-10 w-full h-full object-contain drop-shadow-2xl" alt="Prize" />
          </div>
        )}
        
        <div className="text-[10px] sm:text-xs md:text-sm text-indigo-400 font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-2 relative z-10">
          {winner.name.toLowerCase() === "zonk" ? "Coba Lagi Nanti" : "Item Ditemukan!"}
        </div>
        
        {/* break-words ditambahkan agar teks panjang mematah ke bawah dengan rapi */}
        <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 mb-6 sm:mb-8 leading-tight break-words relative z-10 px-2">
          {winner.name}
        </div>
        
        <button 
          onClick={onClose} 
          className="relative z-10 w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-xs sm:text-sm md:text-base font-bold transition-all shadow-lg active:scale-95 tracking-widest uppercase border border-indigo-400/30"
        >
          Ambil Item
        </button>
      </motion.div>
    </div>
  );
}