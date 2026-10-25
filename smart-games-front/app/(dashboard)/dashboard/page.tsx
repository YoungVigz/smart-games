"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { XpEngine } from "@/lib/xp-engine";
import { apiFetch } from "@/lib/api";
import { formatTime } from "@/utils/time";
import { 
  Trophy, 
  Target, 
  Zap, 
  Grid3X3, 
  ChevronRight, 
  Play, 
  History 
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { user, status } = useAuth();
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const fetchStats = async () => {
            try {
                const res = await apiFetch("/sudoku/statistics");
                const json = await res.json();
                if (json.success) setGames(json.data);
            } catch (err) {
                console.error("Błąd ładowania statystyk dashboardu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [status]);

    const calculatedStats = useMemo(() => {
        const completed = games.filter(g => g.status === "COMPLETED");
        const bestTime = completed.length > 0 
            ? Math.min(...completed.map(g => g.timeElapsed)) 
            : 0;

        return {
            solveCount: completed.length,
            bestTime: bestTime > 0 ? formatTime(bestTime) : "--:--",
            globalRank: "#" + (5000 - (user?.xp || 0) / 10).toFixed(0), 
            streak: "1" // placeholder
        };
    }, [games, user?.xp]);

    if (status === "loading" || !user) return null;

    const { level, progress } = XpEngine.getLevelProgress(user.xp);

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            
            {/* HERO SECTION */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-zinc-900/50 border border-zinc-800 p-8 rounded-[40px]">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight italic uppercase">
                            Witaj, <span className="text-emerald-500">{user.login}</span>
                        </h1>
                        <p className="text-zinc-500 font-medium uppercase text-xs tracking-[0.2em]">
                            Twój postęp w Smart Games
                        </p>
                    </div>

                    {/* Level Bar */}
                    <div className="space-y-2 min-w-[300px]">
                        <div className="flex justify-between items-end px-1">
                            <span className="text-sm font-black text-white">Poziom {level}</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                                {Math.round(progress)}% do następnego
                            </span>
                        </div>
                        <div className="h-3 w-full bg-zinc-800 rounded-2xl p-1 border border-zinc-700/30">
                            <div 
                                className="h-full bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1000" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase text-right tracking-widest">
                            Total XP: {user.xp.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Link href="/sudoku" className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-3 group">
                        <Play size={20} fill="currentColor" />
                        GRAJ TERAZ
                    </Link>
                </div>
            </header>

            {/* QUICK STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="Ukończone Gry" value={calculatedStats.solveCount} icon={<Trophy size={18} />} color="text-emerald-500" />
                <StatBox label="Najlepszy Czas" value={calculatedStats.bestTime} icon={<Target size={18} />} color="text-blue-400" />
                <StatBox label="Ranking" value={calculatedStats.globalRank} icon={<Zap size={18} />} color="text-purple-400" />
                <StatBox label="Dni z rzędu" value={calculatedStats.streak} icon={<History size={18} />} color="text-orange-500" />
            </div>

            {/* GAMES HUB PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sudoku Card */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
                    <div className="relative z-10 space-y-4">
                        <div className="bg-emerald-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500">
                            <Grid3X3 size={28} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Sudoku Classic</h2>
                            <p className="text-zinc-500 font-medium max-w-sm">Trenuj swój mózg codziennie rozwiązując logiczne łamigłówki na trzech poziomach trudności.</p>
                        </div>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                        <Link href="/sudoku" className="flex items-center gap-2 text-emerald-500 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all">
                            Rozpocznij grę <ChevronRight size={18} />
                        </Link>
                    </div>

                    {/* Decorative Background Icon */}
                    <Grid3X3 size={200} className="absolute -right-10 -bottom-10 text-zinc-800/20 rotate-12 group-hover:rotate-0 transition-all duration-700" />
                </div>

                {/* Info Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                        <h3 className="font-black text-xl italic uppercase tracking-tight">Ostatnia Aktywność</h3>
                        <div className="space-y-4">
                            {games.length === 0 ? (
                                <p className="text-zinc-600 text-sm italic">Brak rozegranych gier...</p>
                            ) : (
                                games.slice(0, 3).reverse().map((g, i) => (
                                    <div key={i} className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-zinc-300">{g.difficulty} Sudoku</p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-black">{g.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-mono text-zinc-400">{formatTime(g.timeElapsed)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <Link href="/statistics" className="text-center py-3 border-2 border-zinc-800 hover:border-emerald-500/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                        Pełna Historia
                    </Link>
                </div>

            </div>
        </div>
    );
}

function StatBox({ label, value, icon, color }: any) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                <div className={`${color} opacity-40`}>{icon}</div>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        </div>
    );
}