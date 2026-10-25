"use client"
import { motion } from "framer-motion";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { XpEngine } from "@/lib/xp-engine";

interface VictoryModalProps {
    xpGained: number;
    totalXp: number;
    difficulty: string;
    time: string;
    onClose: () => void;
    onPlayAgain: () => void;
}

export default function VictoryModal({ xpGained, totalXp, difficulty, time, onClose, onPlayAgain }: VictoryModalProps) {
    const { level, progress } = XpEngine.getLevelProgress(totalXp);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />

                <div className="flex justify-center mb-6">
                    <div className="bg-emerald-500/10 p-4 rounded-full">
                        <Trophy className="text-emerald-500" size={48} />
                    </div>
                </div>

                <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">Victory</h2>
                <p className="text-zinc-500 text-xs font-bold uppercase mb-8">
                    {difficulty} cleared in {time}
                </p>

                <div className="space-y-4 mb-10 text-left">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Level</p>
                            <p className="text-3xl font-black text-white">{level}</p>
                        </div>
                        <p className="text-emerald-400 font-black text-sm">+{xpGained} XP</p>
                    </div>

                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                        <Home size={18} /> HUB
                    </button>
                    <button onClick={onPlayAgain} className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                        <RotateCcw size={18} /> AGAIN
                    </button>
                </div>
            </motion.div>
        </div>
    );
}