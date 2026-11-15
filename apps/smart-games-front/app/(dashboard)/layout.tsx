"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
	LayoutDashboard,
	Grid3X3,
	BarChart3,
	User,
	ChartLine,
} from "lucide-react";
import ThemeSwitcher from "@/components/ThemeButton";
import { ConsolePanel } from "@/components/console/ConsolePanel";
import { Aside, AsideMenuItem } from "@/components/aside/Aside";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user, status } = useAuth();
	const router = useRouter();

	const menuItems: AsideMenuItem[] = [
		{ name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard /> },
		{ name: "Sudoku", href: "/sudoku", icon: <Grid3X3 /> },
		{ name: "Statystyki", href: "/statistics", icon: <BarChart3 /> },
		{ name: "Ranking", href: "/ranking", icon: <ChartLine /> },
		{ name: "Profil", href: "/profile/" + user?.login, icon: <User /> },
	];

	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace("/login");
		}
	}, [status, router]);

	if (status === "loading") {
		return (
			<div className="h-screen w-screen bg-surface flex flex-col items-center justify-center gap-4">
				<div className="relative">
					<div className="bg-primary w-12 h-12 rounded-xl animate-bounce shadow-lg shadow-primary/20 flex items-center justify-center">
						<span className="text-xl font-black text-surface">
							S
						</span>
					</div>
					<div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse" />
				</div>
				<p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
					Smart Games
				</p>
			</div>
		);
	}

	if (!user) return null;

	return (
		<div className="dashboard-shell flex min-h-screen max-h-screen bg-surface text-fg">
			<ConsolePanel />
			<Aside menuItems={menuItems} />
			<div className="flex-1 flex flex-col min-w-0">
				<main className="flex-1 overflow-y-auto px-12 py-8 relative">
					{children}
				</main>

				<footer className="dashboard-footer shrink-0 border-t border-line bg-surface-2 px-8 py-3 flex items-center justify-between text-xs text-muted">
					<span>
						© {new Date().getFullYear()}{" "}
						<span className="font-bold text-fg">
							SMART<span className="text-primary">GAMES</span>
						</span>
					</span>
					<div className="flex items-center gap-4">
						<ThemeSwitcher></ThemeSwitcher>
						<Link
							href="/privacy"
							className="hover:text-fg transition-colors"
						>
							Prywatność
						</Link>
						<Link
							href="/contact"
							className="hover:text-fg transition-colors"
						>
							Kontakt
						</Link>
					</div>
				</footer>
			</div>
		</div>
	);
}
