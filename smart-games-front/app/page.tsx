"use client";
import { Button } from "@/components/Button";
import ThemeSwitcher from "@/components/ThemeButton";
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-text-primary p-6">
            <div className="flex flex-col items-center gap-2 mb-12">
                <div className="bg-primary w-16 h-16 rounded-2xl rotate-12 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                    <span className="text-3xl font-black text-surface -rotate-12">S</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter italic">
                    SMART<span className="text-primary">GAMES</span>
                </h1>
                <p className="text-muted font-medium">Wybierz tryb i zacznij zabawę</p>
            </div>
            
            <div className="grid gap-4 w-full max-w-sm">
                {status === "authenticated" ? (
                    <>
                        <Button 
                            text="Przejdz do panelu"
                            type="primary"
                            onClick={() => router.push("/dashboard")}
                        />

                        <Button 
                            text="Wyloguj się"
                            type="secondary"
                            onClick={logout}
                        />
                    </>
                ) : (
                    <>
                        <Button 
                            text="Zaloguj się" 
                            type="primary" 
                            onClick={ () => router.push("/login")}
                        />
                        
                        <Button 
                            text="Stwórz konto" 
                            type="secondary" 
                            onClick={ () => router.push("/register")}
                        />
                    </>
                )}
            </div>

            <div className="mt-5">
                <ThemeSwitcher></ThemeSwitcher>
            </div>
            
        </div>
    );
}