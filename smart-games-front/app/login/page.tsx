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
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-fg p-6">
            <div className="w-full max-w-md bg-surface-2 border border-line p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter">WITAJ W <span className="text-primary">SMART</span></h1>
                    <p className="text-muted text-sm mt-2">Zaloguj się, aby kontynuować</p>
                </div>

                {registered && (
                    <div className="bg-primary/10 border border-primary/50 text-primary p-4 rounded-xl mb-6 text-xs text-center font-bold">
                        Konto utworzone! Możesz się teraz zalogować.
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-xl mb-6 text-xs">
                        <ul className="list-disc list-inside">
                            {errors.map((err, i) => (
                                <li key={i}>{typeof err === 'string' ? err : "Nieoczekiwany błąd"}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted ml-1 uppercase">Login</label>
                        <input type="text" required className="w-full bg-surface-3 border border-line p-4 rounded-2xl focus:border-primary outline-none transition-all"
                            onChange={e => setForm({...form, login: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted ml-1 uppercase">Hasło</label>
                        <input type="password" required className="w-full bg-surface-3 border border-line p-4 rounded-2xl focus:border-primary outline-none transition-all"
                            onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    
                    <button type="submit" className="w-full bg-primary hover:bg-secondary text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 mt-4">
                        Zaloguj się
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-muted">
                    Nie masz konta? <Link href="/register" className="text-primary font-bold hover:opacity-80 transition">Zarejestruj się</Link>
                </p>
            </div>
        </div>
    );
}