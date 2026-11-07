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

    if (loading) return <div className="text-primary font-bold">ŁADOWANIE STATYSTYK...</div>;

    return (
        <div className="mx-auto space-y-3">
            <header>
                <h1 className="text-4xl font-black tracking-tight italic uppercase">
                    Statystyki <span className="text-primary">Gier</span>
                </h1>
                <p className="text-muted font-medium mt-1">Twoja historia i postępy w Sudoku.</p>
            </header>

            {/* OGÓLNE PODSUMOWANIE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Rozegrane" value={stats.summary.total} icon={<Gamepad2 className="text-primary" size={20}/>} />
                <StatCard label="Skuteczność" value={`${stats.summary.winRate}%`} icon={<Trophy className="text-warning" size={20}/>} />
                <StatCard label="Śr. Błędów" value={stats.summary.avgErrors} icon={<AlertCircle className="text-danger" size={20}/>} />
                <StatCard label="Czas w grze" value={formatTime(stats.summary.totalTime)} icon={<Clock className="text-info" size={20}/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* POZIOMY TRUDNOŚCI */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" /> Poziomy
                    </h2>
                    {stats.byDifficulty.map((d) => (
                        <div key={d.name} className="bg-surface-2 border border-line p-5 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black text-muted uppercase">{d.name}</span>
                                <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">
                                    {d.count} UKOŃCZONYCH
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-muted font-bold uppercase">Best Time</p>
                                    <p className="text-lg font-black text-fg">{formatTime(d.bestTime!)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted font-bold uppercase">Avg Time</p>
                                    <p className="text-lg font-black text-fg/80">{formatTime(d.avgTime!)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* HISTORIA GIER */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={20} className="text-primary" /> Ostatnie gry
                    </h2>
                    <div className="bg-surface-2 border border-line rounded-3xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface-3/50 text-muted text-[10px] font-black uppercase">
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
                                        <tr key={game.id || i} className="border-t border-line hover:bg-surface-3/30 transition-colors">
                                            <td className="px-6 py-4 text-muted font-medium">
                                                {new Date(game.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-fg">{game.difficulty}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                                    game.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                                                }`}>
                                                    {game.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-fg/80">
                                                {formatTime(game.timeElapsed)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-muted">
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
        <div className="bg-surface-2 border border-line p-6 rounded-3xl shadow-sm hover:border-muted transition-colors">
            <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-muted uppercase">{label}</p>
                {icon}
            </div>
            <p className="text-2xl font-black text-fg">{value}</p>
        </div>
    );
}