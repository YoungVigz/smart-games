import { formatTime } from "@/utils/time"
import { Button } from "./Button"
import { useRouter } from "next/navigation";

export interface RecentActivity {
	difficulty: "easy" | "medium" | "hard";
	status: "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "SURRENDERED"
	timeElapsed: number
}

export interface RecentActivityProps {
	games: RecentActivity[]
	gameType: "Sudoku"
}

export const RecentActivityCard = ({ games, gameType }: RecentActivityProps) => {
	const router = useRouter()

	return (
		<div className="bg-surface-2 border-2 border-line rounded-xl p-8 flex flex-col justify-between">
			<div className="space-y-6">
				<h3 className="font-black text-xl italic uppercase tracking-tight">
					Ostatnia Aktywność
				</h3>
				<div className="space-y-4">
					{games.length === 0 ? (
						<p className="text-muted/70 text-sm italic">
							Brak rozegranych gier...
						</p>
					) : (
						games
							.slice(0, 3)
							.reverse()
							.map((g, i) => (
								<div
									key={i}
									className="flex items-center justify-between border-b border-line pb-4 last:border-0"
								>
									<div>
										<p className="text-sm font-bold text-fg/80">
											{g.difficulty} {gameType}
										</p>
										<p className="text-[10px] text-muted uppercase font-black">
											{g.status}
										</p>
									</div>
									<div className="text-right">
										<p className="text-xs font-mono text-muted">
											{formatTime(g.timeElapsed)}
										</p>
									</div>
								</div>
							))
					)}
				</div>
			</div>


			<Button
				text="Pełna Historia"
				type="squash"
				onClick={() => router.push("/statistics")}
			/>
		</div>
	)
}

