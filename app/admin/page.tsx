// app/admin/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Prize, SpinProgram } from "../../src/types";
import { db, storage } from "../../src/lib/firebase"; 
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, writeBatch } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Image as ImageIcon, Settings, AlertCircle, Save, FolderPlus, CheckCircle, Loader2, Info } from "lucide-react";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State Program
  const [programs, setPrograms] = useState<SpinProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [newProgramName, setNewProgramName] = useState("");

  // State Items
  const [items, setItems] = useState<Prize[]>([]);
  
  // State Form Input Item
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [quantity, setQuantity] = useState<number | string>(""); // Diubah biar bisa kosong tanpa "0"
  const [winRate, setWinRate] = useState<number | string>(""); // Diubah biar bisa kosong tanpa "0"
  
  // State Upload Gambar
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. LOAD DATA DARI FIREBASE ---
  useEffect(() => {
    setMounted(true);
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "spin_programs"));
      const programList: SpinProgram[] = [];
      querySnapshot.forEach((doc) => {
        programList.push({ id: doc.id, ...doc.data() } as SpinProgram);
      });
      
      // Urutkan dari yang terbaru dibuat (opsional, biar rapi)
      programList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPrograms(programList);
      
      if (programList.length > 0) {
        // Kalau selectedProgramId kosong atau program yang dipilih udah dihapus, pilih yang pertama
        if (!selectedProgramId || !programList.find(p => p.id === selectedProgramId)) {
          setSelectedProgramId(programList[0].id);
          fetchItemsByProgram(programList[0].id);
        } else {
          fetchItemsByProgram(selectedProgramId);
        }
      } else {
        setSelectedProgramId("");
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      alert("Gagal memuat program dari Firebase.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItemsByProgram = async (programId: string) => {
    if (!programId) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, "spin_prizes"), where("programId", "==", programId));
      const querySnapshot = await getDocs(q);
      const itemList: Prize[] = [];
      querySnapshot.forEach((doc) => {
        itemList.push({ id: doc.id, ...doc.data() } as Prize);
      });
      setItems(itemList);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProgramId) {
      fetchItemsByProgram(selectedProgramId);
    }
  }, [selectedProgramId]);


  // --- 2. LOGIKA PROGRAM ---
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramName.trim()) return;

    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, "spin_programs"), {
        name: newProgramName,
        isActive: false, 
        createdAt: new Date().toISOString()
      });
      
      setNewProgramName("");
      alert("Program berhasil dibuat!");
      setSelectedProgramId(docRef.id);
      await fetchPrograms(); 
    } catch (error) {
      console.error("Error creating program:", error);
      alert("Gagal membuat program.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActiveProgram = async (programId: string) => {
    if (items.length < 3) {
      alert("Gagal! Program harus memiliki minimal 3 item hadiah untuk bisa diaktifkan.");
      return;
    }

    setIsLoading(true);
    try {
      for (const prog of programs) {
        await updateDoc(doc(db, "spin_programs", prog.id), { isActive: false });
      }
      await updateDoc(doc(db, "spin_programs", programId), { isActive: true });
      alert("Program ini sekarang aktif di halaman depan!");
      fetchPrograms();
    } catch (error) {
      console.error("Error setting active program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIKA BARU: Hapus Program dan SEMUA Item di dalamnya
  const handleDeleteProgram = async (programId: string, programName: string, isActive: boolean) => {
    if (isActive) {
      alert("Gagal! Program yang sedang Aktif (Live) tidak boleh dihapus. Ganti dulu program aktif ke yang lain.");
      return;
    }

    if (confirm(`PERINGATAN!\n\nApakah Anda yakin ingin menghapus program "${programName}"?\n\nSemua hadiah di dalamnya juga akan ikut TERHAPUS PERMANEN.`)) {
      setIsLoading(true);
      try {
        // 1. Cari semua item yang terkait dengan program ini
        const q = query(collection(db, "spin_prizes"), where("programId", "==", programId));
        const querySnapshot = await getDocs(q);
        
        // 2. Gunakan batch untuk menghapus banyak dokumen sekaligus agar efisien
        const batch = writeBatch(db);
        
        // Tambahkan perintah hapus setiap item ke dalam batch
        querySnapshot.forEach((document) => {
          batch.delete(doc(db, "spin_prizes", document.id));
        });
        
        // Tambahkan perintah hapus program utamanya ke dalam batch
        batch.delete(doc(db, "spin_programs", programId));
        
        // 3. Eksekusi semua perintah hapus sekaligus
        await batch.commit();
        
        alert("Program dan seluruh hadiah di dalamnya berhasil dihapus.");
        
        // Refresh halaman
        await fetchPrograms();
      } catch (error) {
        console.error("Error deleting program:", error);
        alert("Gagal menghapus program.");
      } finally {
        setIsLoading(false);
      }
    }
  };


  // --- 3. LOGIKA UPLOAD & TAMBAH ITEM ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // LOGIKA BARU: Handle Input Angka Tanpa Nol di Depan
  const handleNumberInput = (setter: React.Dispatch<React.SetStateAction<number | string>>, value: string) => {
    if (value === "") {
      setter(""); // Biarkan kosong kalau dihapus semua
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) setter(parsed); // Parse ke number supaya nol di depan hilang
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProgramId) {
      alert("Pilih program dan isi nama hadiah!");
      return;
    }
    
    if (quantity === "" || winRate === "") {
      alert("Jumlah stok dan peluang keluar harus diisi!");
      return;
    }

    if (items.length >= 10) {
      alert("Batas Maksimal! Satu program hanya boleh memiliki maksimal 10 slot hadiah.");
      return;
    }

    setIsLoading(true);
    let finalImageUrl = "";

    try {
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, `spin_images/${fileName}`);
        
        const uploadTask = await uploadBytesResumable(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(uploadTask.ref);
      }

      const newItemData = {
        name,
        color,
        quantity: Number(quantity),
        winRate: Number(winRate),
        imageUrl: finalImageUrl,
        programId: selectedProgramId 
      };

      await addDoc(collection(db, "spin_prizes"), newItemData);

      setName("");
      setQuantity("");
      setWinRate("");
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      alert("Hadiah berhasil ditambahkan!");
      fetchItemsByProgram(selectedProgramId); 
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (confirm("Yakin ingin menghapus hadiah ini?")) {
      setIsLoading(true);
      try {
        await deleteDoc(doc(db, "spin_prizes", id));
        fetchItemsByProgram(selectedProgramId);
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const totalWinRate = items.reduce((sum, item) => sum + item.winRate, 0);
  const activeProgram = programs.find(p => p.isActive);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 font-sans relative overflow-x-hidden p-3 sm:p-4 md:p-8">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] sm:h-[500px] bg-indigo-600/10 blur-[100px] sm:blur-[150px] rounded-full z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER ADMIN */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-2xl mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-40"></div>
              <img src="/logo.png" alt="Logo" className="relative h-10 w-10 sm:h-12 sm:w-12 bg-slate-900 rounded-xl p-1.5 border border-slate-700 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 flex items-center gap-2">
                <Settings size={20} className="text-indigo-400 sm:w-[22px] sm:h-[22px]" /> Admin Panel
              </h1>
              <p className="text-indigo-400/80 text-[10px] sm:text-xs md:text-sm tracking-wider font-medium mt-0.5 sm:mt-1 uppercase">
                Status Live: <span className="text-emerald-400 font-bold break-all">{activeProgram ? activeProgram.name : 'Belum Ada'}</span>
              </p>
            </div>
          </div>
          <Link href="/" className="w-full sm:w-auto justify-center text-white hover:text-indigo-300 flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-indigo-500/30 transition-all shadow-lg active:scale-95 text-sm sm:text-base font-semibold">
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> <span>Ke Halaman Depan</span>
          </Link>
        </div>

        {/* LOADING OVERLAY */}
        {isLoading && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center shadow-2xl">
              <Loader2 size={32} className="text-indigo-500 animate-spin mb-4 sm:w-10 sm:h-10" />
              <p className="text-slate-300 font-bold text-sm sm:text-base text-center">Memproses Data ke Cloud...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* --- SIDEBAR KIRI: MANAJEMEN PROGRAM --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Buat Program Baru */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <FolderPlus size={18} className="text-emerald-400 sm:w-5 sm:h-5" /> Buat Program Spin
              </h2>
              <form onSubmit={handleCreateProgram} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={newProgramName} 
                  onChange={(e) => setNewProgramName(e.target.value)} 
                  placeholder="Misal: Promo Akhir Tahun" 
                  required
                  className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 sm:py-3 rounded-xl transition-all shadow-lg text-sm sm:text-base">
                  Tambah Program
                </button>
              </form>
            </div>

            {/* Daftar Program */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl max-h-[450px] overflow-y-auto">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 border-b border-slate-700 pb-2">Pilih Program</h2>
              {programs.length === 0 ? (
                <p className="text-slate-500 text-xs sm:text-sm">Belum ada program. Buat di atas.</p>
              ) : (
                <div className="space-y-3">
                  {programs.map(prog => (
                    <div 
                      key={prog.id} 
                      onClick={() => setSelectedProgramId(prog.id)}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer border transition-all ${selectedProgramId === prog.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base break-all pr-2">{prog.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5 flex-shrink-0">
                          {prog.isActive && (
                            <span title="Aktif di Halaman Depan">
                              <CheckCircle size={14} className="text-emerald-400 sm:w-4 sm:h-4" />
                            </span>
                          )}
                          {/* TOMBOL HAPUS PROGRAM */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteProgram(prog.id, prog.name, prog.isActive); }}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus Program"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {!prog.isActive && selectedProgramId === prog.id && (
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                           {items.length < 3 && (
                             <div className="flex items-start gap-1 mb-2 text-rose-400">
                               <Info size={12} className="mt-0.5 flex-shrink-0" />
                               <p className="text-[9px] sm:text-[10px] leading-tight">Minimal tambah 3 item hadiah untuk mengaktifkan program ini.</p>
                             </div>
                           )}
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleSetActiveProgram(prog.id); }}
                              disabled={items.length < 3}
                              className={`text-[10px] sm:text-xs px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all w-full font-medium tracking-wide ${items.length < 3 ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-emerald-600 border border-slate-600 hover:border-emerald-500 text-slate-300 hover:text-white shadow-lg'}`}
                            >
                              Set Jadikan Aktif (Live)
                           </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- KONTEN KANAN: MANAJEMEN HADIAH --- */}
          <div className="lg:col-span-8">
            
            {/* Peringatan Win Rate */}
            <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between border backdrop-blur-sm shadow-lg gap-2 sm:gap-0 ${totalWinRate === 100 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium tracking-wide text-xs sm:text-sm flex flex-wrap items-center">
                  Total Drop Rate: 
                  <strong className="text-base sm:text-xl ml-1 sm:ml-2 text-white">{totalWinRate}%</strong>
                </span>
              </div>
              {totalWinRate !== 100 && (
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rose-500/20 px-2 py-1 sm:px-3 sm:py-1 rounded-lg">
                  Harus 100%
                </span>
              )}
            </div>

            {/* Form Tambah Hadiah */}
            <div className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl relative overflow-hidden ${!selectedProgramId ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <Plus size={18} className="text-indigo-400 sm:w-5 sm:h-5" /> 
                {selectedProgramId ? "Tambah Hadiah" : "Pilih Program!"}
                {/* Indikator Jumlah Item */}
                {selectedProgramId && (
                  <span className={`text-xs sm:text-sm font-medium ml-auto px-2 py-1 rounded-lg ${items.length >= 10 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    ({items.length}/10 Slot)
                  </span>
                )}
              </h2>

              <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Bagian Upload Gambar Asli (Local File) */}
                <div className="md:col-span-2 p-3 sm:p-4 border-2 border-dashed border-slate-600 rounded-xl sm:rounded-2xl bg-slate-800/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon size={24} className="text-slate-600 sm:w-8 sm:h-8" />
                      )}
                   </div>
                   <div className="flex-1 w-full text-center sm:text-left">
                      <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-2">Upload Gambar (Opsional)</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        disabled={items.length >= 10}
                        className="block w-full text-xs sm:text-sm text-slate-400 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/40 cursor-pointer disabled:opacity-50"
                      />
                      <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">Disarankan PNG transparan.</p>
                   </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Nama Hadiah</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={items.length >= 10} className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50" />
                </div>
                
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Warna Slot</label>
                  <div className="relative w-full h-[42px] sm:h-[46px] rounded-xl overflow-hidden border border-slate-600">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={items.length >= 10} className="absolute -top-2 -left-2 w-[120%] h-[120%] cursor-pointer disabled:opacity-50" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Jumlah Stok</label>
                  <input type="number" value={quantity} onChange={(e) => handleNumberInput(setQuantity, e.target.value)} required min="0" disabled={items.length >= 10} className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50" />
                </div>
                
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Peluang Keluar (%)</label>
                  <input type="number" value={winRate} onChange={(e) => handleNumberInput(setWinRate, e.target.value)} required min="0" max="100" disabled={items.length >= 10} className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50" />
                </div>

                <div className="md:col-span-2 flex justify-end mt-2 sm:mt-4">
                  <button 
                    type="submit" 
                    disabled={items.length >= 10} 
                    className={`w-full sm:w-auto text-white px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg text-sm sm:text-base transition-all ${items.length >= 10 ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                  >
                    <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                    {items.length >= 10 ? 'Slot Maksimal (10/10)' : 'Simpan ke Cloud'}
                  </button>
                </div>
              </form>
            </div>

            {/* Inventory Roda */}
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              Isi Roda <span className={`text-xs sm:text-sm font-medium ${items.length < 3 ? 'text-rose-400' : 'text-slate-400'}`}>({items.length}/10 Item)</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-900/40 border border-slate-700/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-12 sm:w-16 h-full opacity-20 blur-xl" style={{ backgroundColor: item.color }}></div>

                  <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full overflow-hidden pr-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center bg-slate-900 border-2 flex-shrink-0" style={{ borderColor: item.color + '80' }}>
                       {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" /> : <ImageIcon className="text-slate-500 w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm sm:text-base leading-tight mb-1 truncate">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold">
                         <span className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md whitespace-nowrap">Stok: {item.quantity}</span>
                         <span className="bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 px-1.5 py-0.5 rounded-md whitespace-nowrap">Drop: {item.winRate}%</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} className="relative z-10 text-slate-500 hover:text-rose-400 p-1.5 sm:p-2 rounded-xl transition-all flex-shrink-0"><Trash2 size={18} className="sm:w-5 sm:h-5" /></button>
                </div>
              ))}
              
              {items.length === 0 && (
                 <div className="col-span-full py-6 sm:py-8 text-center text-slate-500 text-xs sm:text-sm bg-slate-900/20 rounded-xl sm:rounded-2xl border border-dashed border-slate-700">
                   Pilih program dan tambahkan minimal 3 item untuk mengaktifkan roda.
                 </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}