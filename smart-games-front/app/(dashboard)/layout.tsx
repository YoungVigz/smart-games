"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Grid3X3, BarChart3, User, LogOut, ChevronLeft, ChevronRight, ChartLine } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeButton";
import { ConsolePanel } from "@/components/console/ConsolePanel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sudoku", href: "/sudoku", icon: Grid3X3 },
    { name: "Statystyki", href: "/statistics", icon: BarChart3 },
    { name: "Ranking", href: "/ranking", icon: ChartLine },
    { name: "Profil", href: "/profile/" + user?.login, icon: User },
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
            <span className="text-xl font-black text-surface">S</span>
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
    <div className="flex min-h-screen max-h-screen bg-surface text-fg">
      <ConsolePanel />
      <aside className={`relative flex flex-col bg-surface-2 border-r border-line transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        
        <div className="p-3 border-b border-line flex justify-center items-center gap-3">
          <div className="bg-primary min-w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl font-black text-surface uppercase">S</span>
          </div>
          {!isCollapsed && <span className="text-xl font-black italic tracking-tighter">SMART<span className="text-primary">GAMES</span></span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 relative">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 -top-3.5 bg-surface-3 border border-line rounded-full p-1 text-muted hover:text-fg cursor-pointer z-20">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${isCollapsed ? "justify-center": ""}  gap-3 p-3 rounded-lg font-medium transition-all ${
                pathname === item.href ? "bg-primary/10 text-primary" : "text-muted hover:text-fg hover:bg-surface-3"
              }`}
            >
              <item.icon size={24} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-line space-y-1">
          <button onClick={logout} className="w-full flex justify-center items-center gap-3 p-3 rounded-lg text-danger hover:bg-danger/10 transition-all cursor-pointer">
            <LogOut size={24} />
            {!isCollapsed && <span className="font-bold text-sm">Wyloguj się</span>}
          </button>
        </div>

      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto px-12 py-8 relative">
          {children}
        </main>

        <footer className="shrink-0 border-t border-line bg-surface-2 px-8 py-3 flex items-center justify-between text-xs text-muted">
          <span>
            © {new Date().getFullYear()} <span className="font-bold text-fg">SMART<span className="text-primary">GAMES</span></span>
          </span>
          <div className="flex items-center gap-4">
            <ThemeSwitcher></ThemeSwitcher>
            <Link href="/privacy" className="hover:text-fg transition-colors">Prywatność</Link>
            <Link href="/contact" className="hover:text-fg transition-colors">Kontakt</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}