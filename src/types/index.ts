// src/types/index.ts

export interface Prize {
  id: string;
  name: string;
  imageUrl?: string; 
  color: string;
  quantity: number;
  winRate: number;
  programId: string; // PENAMBAHAN: Hadiah ini milik program mana
}

export interface SpinProgram {
  id: string;
  name: string;      
  isActive: boolean; // Jika true, ini yang tampil di halaman depan
  createdAt: string;
}

export interface Player {
  name: string;
  whatsapp: string;
}

export interface SpinHistory {
  id?: string;
  programId: string; 
  programName: string;
  prizeId: string;
  prizeName: string;
  player: Player;    // Menyimpan data siapa yang menang
  spinDate: string;
}