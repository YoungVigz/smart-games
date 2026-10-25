"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
    const [form, setForm] = useState({ login: "", password: "" });
    const [errors, setErrors] = useState<string[]>([]);
    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);

        try {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify(form)
            });
            const json = await res.json();
            
            if (json.success) {
                login(json.data.accessToken, json.data.user);
                router.push("/dashboard");
            } else {
                let extractedErrors: string[] = [];
                
                if (typeof json.message === 'string') {
                    extractedErrors = [json.message];
                } else if (Array.isArray(json.message)) {
                    extractedErrors = json.message;
                } else if (typeof json.message === 'object' && json.message !== null) {
                    const msg = (json.message as any).message;
                    extractedErrors = Array.isArray(msg) ? msg : [msg || "Błąd serwera"];
                }

                setErrors(extractedErrors);
            }
        } catch (err) {
            setErrors(["Błąd połączenia z serwerem"]);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter">WITAJ W <span className="text-emerald-500">SMART</span></h1>
                    <p className="text-zinc-500 text-sm mt-2">Zaloguj się, aby kontynuować</p>
                </div>

                {registered && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl mb-6 text-xs text-center font-bold">
                        Konto utworzone! Możesz się teraz zalogować.
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-xs">
                        <ul className="list-disc list-inside">
                            {errors.map((err, i) => (
                                <li key={i}>{typeof err === 'string' ? err : "Nieoczekiwany błąd"}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Login</label>
                        <input type="text" required className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                            onChange={e => setForm({...form, login: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Hasło</label>
                        <input type="password" required className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                            onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 mt-4">
                        Zaloguj się
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-zinc-500">
                    Nie masz konta? <Link href="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition">Zarejestruj się</Link>
                </p>
            </div>
        </div>
    );
}