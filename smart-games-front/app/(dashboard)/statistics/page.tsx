"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { 
  Trophy, 
  Clock, 
  AlertCircle, 
  Gamepad2, 
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatTime } from "@/utils/time";

export default function StatisticsPage() {
    const { status } = useAuth();
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status !== 'authenticated') return; 

        const getGames = async () => {
            try {
                const response = await apiFetch("/sudoku/statistics");
                const json = await response.json();
                if (json.success) setGames(json.data);
            } catch (err) {
                console.error("Błąd pobierania statystyk:", err);
            } finally {
                setLoading(false);
            }
        };
        getGames();
    }, [status]);

    const stats = useMemo(() => {
        const completedGames = games.filter(g => g.status === "COMPLETED");
        
        const summary = {
            total: games.length,
            completed: completedGames.length,
            winRate: games.length > 0 ? Math.round((completedGames.length / games.length) * 100) : 0,
            avgErrors: completedGames.length > 0 
                ? (completedGames.reduce((acc, curr) => acc + curr.errors, 0) / completedGames.length).toFixed(1) 
                : 0,
            totalTime: games.reduce((acc, curr) => acc + curr.timeElapsed, 0),
        };

        const byDifficulty = ["EASY", "MEDIUM", "HARD"].map(diff => {
            const dGames = completedGames.filter(g => g.difficulty === diff);
            const bestTime = dGames.length > 0 
                ? Math.min(...dGames.map(g => g.timeElapsed)) 
                : null;

            return {
                name: diff,
                count: dGames.length,
                bestTime: bestTime,
                avgTime: dGames.length > 0 
                    ? Math.round(dGames.reduce((acc, curr) => acc + curr.timeElapsed, 0) / dGames.length)
                    : null
            };
        });

        return { summary, byDifficulty };
    }, [games]);

    if (loading) return <div className="text-emerald-500 font-bold">ŁADOWANIE STATYSTYK...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <header>
                <h1 className="text-4xl font-black tracking-tight italic uppercase">
                    Statystyki <span className="text-emerald-500">Gier</span>
                </h1>
                <p className="text-zinc-500 font-medium mt-1">Twoja historia i postępy w Sudoku.</p>
            </header>

            {/* OGÓLNE PODSUMOWANIE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Rozegrane" value={stats.summary.total} icon={<Gamepad2 className="text-emerald-500" size={20}/>} />
                <StatCard label="Skuteczność" value={`${stats.summary.winRate}%`} icon={<Trophy className="text-yellow-500" size={20}/>} />
                <StatCard label="Śr. Błędów" value={stats.summary.avgErrors} icon={<AlertCircle className="text-red-500" size={20}/>} />
                <StatCard label="Czas w grze" value={formatTime(stats.summary.totalTime)} icon={<Clock className="text-blue-400" size={20}/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* POZIOMY TRUDNOŚCI */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-500" /> Poziomy
                    </h2>
                    {stats.byDifficulty.map((d) => (
                        <div key={d.name} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black text-zinc-500 uppercase">{d.name}</span>
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-full font-bold">
                                    {d.count} UKOŃCZONYCH
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Best Time</p>
                                    <p className="text-lg font-black text-white">{formatTime(d.bestTime!)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Avg Time</p>
                                    <p className="text-lg font-black text-zinc-300">{formatTime(d.avgTime!)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* HISTORIA GIER */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={20} className="text-emerald-500" /> Ostatnie gry
                    </h2>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-zinc-800/50 text-zinc-500 text-[10px] font-black uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Poziom</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Czas</th>
                                        <th className="px-6 py-4 text-right">Błędy</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {games
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .slice(0, 10)
                                    .map((game, i) => (
                                        <tr key={game.id || i} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4 text-zinc-400 font-medium">
                                                {new Date(game.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-zinc-200">{game.difficulty}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    game.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {game.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-zinc-300">
                                                {formatTime(game.timeElapsed)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-zinc-400">
                                                {game.errors}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-sm hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-zinc-500 uppercase">{label}</p>
                {icon}
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
    );
}