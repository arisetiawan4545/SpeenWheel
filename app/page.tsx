// app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import SpinWheel, { SpinWheelRef } from "../src/components/SpinWheel";
import PrizeModal from "../src/components/PrizeModal";
import { Prize, SpinProgram, SpinHistory, Player } from "../src/types";
import { db } from "../src/lib/firebase"; 
import { collection, getDocs, addDoc, doc, updateDoc, increment, query, where, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Settings, History, Gift, Sparkles, Zap, User, Phone, ChevronDown, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter(); // Tambahan untuk navigasi
  
  // Data State
  const [programs, setPrograms] = useState<SpinProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [items, setItems] = useState<Prize[]>([]);
  const [history, setHistory] = useState<SpinHistory[]>([]);
  
  // Modal & Player State
  const [winnerPrize, setWinnerPrize] = useState<Prize | null>(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [player, setPlayer] = useState<Player>({ name: "", whatsapp: "" });
  
  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Referensi ke Komponen Roda
  const wheelRef = useRef<SpinWheelRef>(null);

  useEffect(() => {
    setMounted(true);
    const loadInitialData = async () => {
      try {
        const progSnap = await getDocs(collection(db, "spin_programs"));
        const progList = progSnap.docs.map(d => ({id: d.id, ...d.data()} as SpinProgram));
        setPrograms(progList);
        
        if(progList.length > 0) setSelectedProgramId(progList[0].id);

        const histQuery = query(collection(db, "spin_history"), orderBy("spinDate", "desc"), limit(10));
        const histSnap = await getDocs(histQuery);
        setHistory(histSnap.docs.map(d => ({id: d.id, ...d.data()} as SpinHistory)));
      } catch (error) {
        console.error("Gagal memuat data dari Firebase:", error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedProgramId) return;
    const loadItems = async () => {
      try {
        const q = query(collection(db, "spin_prizes"), where("programId", "==", selectedProgramId));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({id: d.id, ...d.data()} as Prize)));
      } catch (error) {
         console.error("Gagal memuat hadiah:", error);
      }
    };
    loadItems();
  }, [selectedProgramId]);

  const handleSpinRequest = () => {
    if(items.length === 0) return alert("Belum ada hadiah di program ini!");
    setShowPlayerForm(true);
  };

  const submitPlayerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.name || !player.whatsapp) return;
    
    setShowPlayerForm(false); 
    wheelRef.current?.startSpin(); 
  };

  const handleWin = async (prize: Prize) => {
    const prog = programs.find(p => p.id === selectedProgramId);
    
    const newHistory: SpinHistory = {
      programId: selectedProgramId,
      programName: prog?.name || "Program Spesial",
      prizeId: prize.id,
      prizeName: prize.name,
      player: player,
      spinDate: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "spin_history"), newHistory);
      const prizeRef = doc(db, "spin_prizes", prize.id);
      await updateDoc(prizeRef, { quantity: increment(-1) });
      
      setHistory([ { ...newHistory, id: docRef.id }, ...history ].slice(0, 10));
      setItems(items.map(item => item.id === prize.id ? { ...item, quantity: item.quantity - 1 } : item));
    } catch (e) {
      console.error("Gagal menyimpan riwayat:", e);
    }

    setWinnerPrize(prize); 
    setPlayer({ name: "", whatsapp: "" }); 
  };

  // FUNGSI LOGIN ADMIN
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const q = query(collection(db, "adminspeenwheel"), where("nama", "==", adminName), where("password", "==", adminPassword));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Berhasil login
        sessionStorage.setItem("isAdmin", "true"); // Simpan sesi di browser
        router.push("/admin"); // Pindah ke halaman admin
      } else {
        setLoginError("Nama atau Password salah!");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Koneksi gagal, coba lagi.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans relative overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] sm:h-[500px] bg-indigo-600/10 blur-[100px] sm:blur-[150px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>

      {/* HEADER */}
      <header className="w-full px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 z-50 sticky top-0 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
             <img src="/logo.png" alt="Logo" className="relative h-9 w-9 sm:h-11 sm:w-11 bg-slate-900 rounded-full p-1.5 border border-slate-700 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white flex items-center gap-1 sm:gap-2">MySehati Spin Wheel</h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
              </span> 
              <span className="hidden sm:inline">Database Online</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>
        </div>
        
        {/* TOMBOL ADMIN DIUBAH MENJADI TOMBOL POP-UP */}
        <button onClick={() => setShowAdminLogin(true)} className="text-slate-300 hover:text-white flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-700 transition-all shadow-sm">
          <Settings size={14} className="sm:w-[16px] sm:h-[16px]" /> <span className="text-xs sm:text-sm font-medium">Admin</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center z-10 w-full max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
        
        {/* DROPDOWN PILIHAN PROGRAM */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center z-20 relative w-full px-4">
           <label className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
             <Sparkles size={12} className="text-indigo-400 sm:w-[14px] sm:h-[14px]" /> Pilih Kategori Event
           </label>
           <div className="relative w-full max-w-[280px] sm:max-w-[320px]">
             <select 
               value={selectedProgramId} 
               onChange={(e) => setSelectedProgramId(e.target.value)}
               className="bg-slate-800/80 backdrop-blur-md border border-indigo-500/50 rounded-xl w-full px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-center appearance-none cursor-pointer truncate pr-10"
             >
               {programs.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
               {programs.length === 0 && <option value="">Belum ada program...</option>}
             </select>
             <ChevronDown size={18} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none sm:w-[20px] sm:h-[20px]" />
           </div>
        </div>

        {/* RODA SPIN */}
        <div className="mb-10 sm:mb-16 relative w-full flex justify-center mt-4">
          <SpinWheel ref={wheelRef} items={items} onSpinClick={handleSpinRequest} onWin={handleWin} />
        </div>

        {/* POPUP LOGIN ADMIN */}
        {showAdminLogin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-rose-500/50 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.2)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-rose-500/10 blur-2xl sm:blur-3xl rounded-full"></div>
              
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2 relative z-10 flex items-center gap-2">
                <Lock size={24} className="text-rose-500" /> Area Terlarang
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-5 sm:mb-6 relative z-10 leading-tight">Hanya admin yang memiliki akses ke halaman ini.</p>
              
              {loginError && (
                <div className="mb-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs p-3 rounded-lg text-center font-bold">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminAuth} className="relative z-10">
                <div className="mb-3 sm:mb-4">
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Nama Admin</label>
                  <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white w-full text-xs sm:text-sm placeholder-slate-500 font-medium focus:border-rose-500 transition-colors" placeholder="Masukkan nama" />
                </div>
                <div className="mb-6 sm:mb-8">
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
                  <input type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white w-full text-xs sm:text-sm placeholder-slate-500 font-medium focus:border-rose-500 transition-colors" placeholder="••••••••" />
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                   <button type="button" onClick={() => {setShowAdminLogin(false); setLoginError("");}} className="flex-1 py-2.5 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-xs sm:text-sm transition-all border border-slate-700">Batal</button>
                   <button type="submit" disabled={isLoggingIn} className="flex-1 py-2.5 sm:py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 uppercase tracking-wider disabled:opacity-50">
                     {isLoggingIn ? "Cek..." : "Masuk"}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL REGISTRASI NAMA & WA */}
        {showPlayerForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-slate-900 border border-indigo-500/50 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(99,102,241,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/10 blur-2xl sm:blur-3xl rounded-full"></div>
              
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2 relative z-10">Isi Data Dulu Yuk!</h3>
              <p className="text-slate-400 text-[10px] sm:text-xs md:text-sm mb-5 sm:mb-6 relative z-10 leading-tight">Masukkan nama dan No. WhatsApp untuk klaim hadiahmu nanti.</p>
              
              <form onSubmit={submitPlayerForm} className="relative z-10">
                <div className="mb-3 sm:mb-4">
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Nama Lengkap</label>
                  <div className="flex items-center bg-slate-800/80 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-700 focus-within:border-indigo-500 transition-colors shadow-inner">
                    <User size={14} className="text-indigo-400 mr-2 sm:mr-3 sm:w-[16px] sm:h-[16px]" />
                    <input type="text" required value={player.name} onChange={e => setPlayer({...player, name: e.target.value})} className="bg-transparent border-none outline-none text-white w-full text-xs sm:text-sm placeholder-slate-500 font-medium" placeholder="Misal: Budi Santoso" />
                  </div>
                </div>
                <div className="mb-6 sm:mb-8">
                  <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">No. WhatsApp</label>
                  <div className="flex items-center bg-slate-800/80 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 border border-slate-700 focus-within:border-indigo-500 transition-colors shadow-inner">
                    <Phone size={14} className="text-emerald-400 mr-2 sm:mr-3 sm:w-[16px] sm:h-[16px]" />
                    <input type="tel" required value={player.whatsapp} onChange={e => setPlayer({...player, whatsapp: e.target.value})} className="bg-transparent border-none outline-none text-white w-full text-xs sm:text-sm placeholder-slate-500 font-medium" placeholder="Misal: 081234567890" />
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                   <button type="button" onClick={() => setShowPlayerForm(false)} className="flex-1 py-2.5 sm:py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-xs sm:text-sm transition-all border border-slate-700">Batal</button>
                   <button type="submit" className="flex-1 py-2.5 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 uppercase tracking-wider">Mulai Putar!</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        <PrizeModal winner={winnerPrize} onClose={() => setWinnerPrize(null)} />

        {/* KATALOG HADIAH */}
        <div className="w-full mb-10 sm:mb-12 mt-8 sm:mt-12 px-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-700 flex-1 max-w-[80px] sm:max-w-[100px]"></div>
            <Gift size={16} className="text-slate-400 sm:w-[18px] sm:h-[18px]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300">Daftar Hadiah</h2>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-700 flex-1 max-w-[80px] sm:max-w-[100px]"></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {items.map((item) => (
              <div key={item.id} className="w-[105px] sm:w-[140px] md:w-[160px] lg:w-[180px] bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col items-center hover:bg-slate-800 hover:border-slate-600 transition-all group shadow-lg">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-3 flex items-center justify-center">
                   <div className="absolute inset-0 bg-white/5 rounded-full blur-md group-hover:bg-white/10 transition-colors" style={{ backgroundColor: item.color + '40' }}></div>
                   {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="relative z-10 w-8 h-8 sm:w-12 sm:h-12 object-contain drop-shadow-xl group-hover:scale-110 transition-transform" /> : <Gift className="relative z-10 text-slate-500 w-6 h-6 sm:w-8 sm:h-8" />}
                </div>
                <h3 className="text-[10px] sm:text-sm font-bold text-center text-slate-200 leading-tight mb-2 truncate w-full">{item.name}</h3>
                
                <div className="flex flex-col items-center w-full mt-auto mb-1">
                   <div className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-indigo-200 bg-indigo-900/60 px-3 py-1 rounded-md border border-indigo-500/40 shadow-sm">
                     🎁 REWARD
                   </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="w-full text-center text-xs sm:text-sm text-slate-500 py-4">Belum ada item untuk program ini.</div>}
          </div>
        </div>

        {/* LIVE FEED PEMENANG */}
        <div className="w-full mt-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-700 flex-1 max-w-[80px] sm:max-w-[100px]"></div>
            <Zap size={16} className="text-amber-400 sm:w-[18px] sm:h-[18px]" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300">Live Feed Pemenang</h2>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-700 flex-1 max-w-[80px] sm:max-w-[100px]"></div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pb-6 pt-2 px-1">
            {history.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl px-6 py-5 sm:px-8 sm:py-6 text-center w-full max-w-sm mx-auto">
                 <History size={20} className="mx-auto text-slate-600 mb-2 sm:w-6 sm:h-6" />
                 <p className="text-slate-400 text-xs sm:text-sm font-medium">Belum ada pemenang di database.</p>
              </div>
            ) : (
              history.map((h, i) => (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={h.id || i} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 hover:border-slate-500 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4 w-full max-w-[280px] sm:max-w-[320px] shadow-lg group transition-colors">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-1.5 sm:p-2 relative overflow-hidden flex-shrink-0">
                       <Gift className="relative z-10 text-indigo-400 w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0 text-left">
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold mb-0.5 uppercase tracking-widest truncate">{h.player?.name || 'Seseorang'}</p>
                      <p className="text-white font-bold text-xs sm:text-sm truncate leading-tight">{h.prizeName}</p>
                      <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5 sm:mt-1 truncate">di {h.programName}</p>
                    </div>
                  </motion.div>
                )
              )
            )}
          </div>
        </div>

      </div>
    </main>
  );
}