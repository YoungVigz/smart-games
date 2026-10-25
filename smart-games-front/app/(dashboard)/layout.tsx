"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Grid3X3, BarChart3, User, LogOut, ChevronLeft, ChevronRight, ChartLine } from "lucide-react";

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
      <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="bg-emerald-500 w-12 h-12 rounded-xl animate-bounce shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <span className="text-xl font-black text-zinc-950">S</span>
          </div>
          <div className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Smart Games
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen max-h-screen bg-zinc-950 text-zinc-200">
      <aside className={`relative flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        
        <div className="p-3 border-b border-zinc-800 flex justify-center items-center gap-3">
          <div className="bg-emerald-500 min-w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-xl font-black text-zinc-950 uppercase">S</span>
          </div>
          {!isCollapsed && <span className="text-xl font-black italic tracking-tighter">SMART<span className="text-emerald-500">GAMES</span></span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 relative">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 -top-3.5 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white cursor-pointer z-20">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${isCollapsed ? "justify-center": ""}  gap-3 p-3 rounded-lg font-medium transition-all ${
                pathname === item.href ? "bg-emerald-600/10 text-emerald-500" : "text-zinc-500 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <item.icon size={24} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800 space-y-1">
          <button onClick={logout} className="w-full flex justify-center items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
            <LogOut size={24} />
            {!isCollapsed && <span className="font-bold text-sm">Wyloguj się</span>}
          </button>
        </div>

      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
      </main>
    </div>
  );
}