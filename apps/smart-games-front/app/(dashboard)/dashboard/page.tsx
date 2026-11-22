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
	History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { StatBox } from "@/components/StatBox";
import { RecentActivityCard } from "@/components/RecentActivityCard";

export default function DashboardPage() {
	const { user, status } = useAuth();
	const [games, setGames] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const router = useRouter();

	useEffect(() => {
		if (status !== "authenticated") return;
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
		const bestTime =
			completed.length > 0
				? Math.min(...completed.map(g => g.timeElapsed))
				: 0;

		return {
			solveCount: completed.length,
			bestTime: bestTime > 0 ? formatTime(bestTime) : "--:--",
			globalRank: "#" + (5000 - (user?.xp || 0) / 10).toFixed(0),
			streak: "1",
		};
	}, [games, user?.xp]);

	if (status === "loading" || !user) return null;

	const { level, progress } = XpEngine.getLevelProgress(user.xp);

	return (
		<div className="mx-auto space-y-4 animate-in fade-in duration-500">
			{/* HERO SECTION */}
			<header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-surface-2/50 border-2 border-line p-8 rounded-xl">
				<div className="space-y-4">
					<div className="space-y-1">
						<h1 className="text-4xl font-black tracking-tight italic uppercase">
							Witaj,{" "}
							<span className="text-primary">{user.login}</span>
						</h1>
						<p className="text-muted font-medium uppercase text-xs tracking-[0.2em]">
							Twój postęp w Smart Games
						</p>
					</div>

					{/* Level Bar */}
					<div className="space-y-2 ">
						<div className="flex justify-between items-end px-1">
							<span className="text-sm font-black text-fg">
								Poziom {level}
							</span>
							<span className="text-[10px] font-black text-primary uppercase tracking-tighter">
								{Math.round(progress)}% do następnego
							</span>
						</div>
						<div className="h-3 w-full bg-surface-3 rounded-2xl p-1 border border-line/30">
							<div
								className="h-full bg-primary rounded-xl shadow-lg shadow-primary/40 transition-all duration-1000"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className="text-[9px] text-muted/70 font-bold uppercase text-right tracking-widest">
							Total XP: {user.xp.toLocaleString()}
						</p>
					</div>
				</div>

				<div className="flex gap-4">
					<Button
						text="GRAJ TERAZ"
						type="primary"
						onClick={() => router.push("/sudoku")}
						icon={
							<Play
								size={20}
								fill="currentColor"
							/>
						}
					/>
				</div>
			</header>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatBox
					label="Ukończone Gry"
					value={calculatedStats.solveCount}
					icon={<Trophy size={18} />}
				/>
				<StatBox
					label="Najlepszy Czas"
					value={calculatedStats.bestTime}
					icon={<Target size={18} />}
				/>
				<StatBox
					label="Ranking"
					value={calculatedStats.globalRank}
					icon={<Zap size={18} />}
				/>
				<StatBox
					label="Dni z rzędu"
					value={calculatedStats.streak}
					icon={<History size={18} />}
				/>
			</div>

			{/* GAMES HUB PREVIEW */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				{/* Sudoku Card */}
				<div className="lg:col-span-2 bg-surface-2 border-2 border-line rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group min-h-75">
					<div className="relative z-10 space-y-4">
						<div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary">
							<Grid3X3 size={28} />
						</div>
						<div>
							<h2 className="text-3xl font-black italic tracking-tighter uppercase">
								Sudoku Classic
							</h2>
							<p className="text-muted font-medium max-w-sm">
								Trenuj swój mózg codziennie rozwiązując logiczne
								łamigłówki na trzech poziomach trudności.
							</p>
						</div>
					</div>

					<div className="relative z-10 flex items-center gap-6">
						<Link
							href="/sudoku"
							className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
						>
							Rozpocznij grę <ChevronRight size={18} />
						</Link>
					</div>

					{/* Decorative Background Icon */}
					<Grid3X3
						size={200}
						className="absolute -right-10 -bottom-10 text-surface-3/20 rotate-12 group-hover:rotate-0 transition-all duration-700"
					/>
				</div>

				<RecentActivityCard
					games={games}
					gameType="Sudoku"
				/>

			</div>
		</div>
	);
}
