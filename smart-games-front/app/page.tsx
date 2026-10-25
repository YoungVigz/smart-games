"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const { status, logout } = useAuth();
    const router = useRouter();

    const handleGuest = () => {
        router.push("/sudoku");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
            <div className="flex flex-col items-center gap-2 mb-12">
                <div className="bg-emerald-500 w-16 h-16 rounded-2xl rotate-12 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <span className="text-3xl font-black text-zinc-950 -rotate-12">S</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter italic">SMART<span className="text-emerald-500">GAMES</span></h1>
                <p className="text-zinc-500 font-medium">Wybierz tryb i zacznij zabawę</p>
            </div>
            
            <div className="grid gap-4 w-full max-w-sm">
                {status === "authenticated" ? (
                    <>
                        <Link href="/dashboard" className="bg-emerald-600 hover:bg-emerald-500 text-center py-4 rounded-2xl font-bold transition shadow-lg shadow-emerald-900/20">
                            Przejdź do Panelu
                        </Link>
                        <button onClick={logout} className="text-zinc-500 hover:text-white text-sm transition">Wyloguj się</button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-center py-4 rounded-2xl font-bold transition shadow-lg shadow-emerald-900/20">
                            Zaloguj się
                        </Link>
                        <Link href="/register" className="bg-zinc-800 hover:bg-zinc-700 text-center py-4 rounded-2xl font-bold transition">
                            Stwórz konto
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}