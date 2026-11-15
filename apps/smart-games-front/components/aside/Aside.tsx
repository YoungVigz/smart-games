import { useAuth } from "@/context/AuthContext";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";

export interface AsideMenuItem {
	name: string;
	href: string;
	icon: ReactNode;
}

interface AsideProps {
	menuItems: AsideMenuItem[];
}

export const Aside = ({ menuItems }: AsideProps) => {

	const [isCollapsed, setIsCollapsed] = useState(true);
	const pathname = usePathname();
	const { logout } = useAuth();

	return (
		<aside
			className={`dashboard-sidebar relative flex flex-col bg-surface-2 border-r border-line transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
		>
			<div className="p-3 border-b border-line flex justify-center items-center gap-3">
				<div className="bg-primary min-w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
					<span className="text-xl font-black text-surface uppercase">
						S
					</span>
				</div>
				{!isCollapsed && (
					<span className="text-xl font-black italic tracking-tighter">
						SMART<span className="text-primary">GAMES</span>
					</span>
				)}
			</div>

			<nav className="flex-1 p-3 space-y-1 relative">
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="absolute -right-3.5 -top-3.5 bg-surface-3 border border-line rounded-full p-1 text-muted hover:text-fg cursor-pointer z-20"
				>
					{isCollapsed ? (
						<ChevronRight className="text-primary" size={16} />
					) : (
						<ChevronLeft className="text-primary" size={16} />
					)}
				</button>

				{menuItems.map(item => (
					<Link
						key={item.href}
						href={item.href}
						className={`flex items-center ${isCollapsed ? "justify-center" : ""}  gap-3 p-3 rounded-lg font-medium transition-all ${pathname === item.href
							? "bg-primary/10 text-accent"
							: "text-muted hover:text-fg hover:bg-surface-3"
							}`}
					>
						{item.icon}
						{!isCollapsed && <span>{item.name}</span>}
					</Link>
				))}
			</nav>

			<div className="p-3 border-t border-line space-y-1">
				<button
					onClick={logout}
					className="w-full flex justify-center items-center gap-3 p-3 rounded-lg text-danger hover:bg-danger/10 transition-all cursor-pointer"
				>
					<LogOut size={24} />
					{!isCollapsed && (
						<span className="font-bold text-sm">
							Wyloguj się
						</span>
					)}
				</button>
			</div>
		</aside>
	)
}
