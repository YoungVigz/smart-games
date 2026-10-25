"use client";
import Link from "next/link";
import { MoveLeft, Ghost } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center space-y-6"
      >
        <div className="relative">
          <Ghost size={80} className="text-zinc-800 animate-bounce" />
          <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-8xl font-black italic tracking-tighter text-zinc-800">404</h1>
          <h2 className="text-2xl font-black uppercase tracking-tight">Ups! Ta strona nie istnieje</h2>
          <p className="text-zinc-500 max-w-xs mx-auto text-sm font-medium">
            Wygląda na to, że ta ścieżka prowadzi do ślepego zaułka. Wróćmy do bazy.
          </p>
        </div>

        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 group"
        >
          <MoveLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          POWRÓT DO PANELU
        </Link>
      </motion.div>
    </div>
  );
}