"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
    const [form, setForm] = useState({ login: "", email: "", password: "" });
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        try {
            const res = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify(form)
            });
            
            const json = await res.json();
            setLoading(false);

            if (json.success) {
                router.push("/login?registered=true");
            } else {
                let extractedErrors: string[] = [];
                
                if (Array.isArray(json.message)) {
                    extractedErrors = json.message;
                } else if (typeof json.message === 'object' && json.message !== null) {
                    const msg = (json.message as any).message;
                    extractedErrors = Array.isArray(msg) ? msg : [msg || "Błąd rejestracji"];
                } else {
                    extractedErrors = [json.message || "Błąd rejestracji"];
                }
                
                setErrors(extractedErrors);
            }
        } catch (err) {
            setLoading(false);
            setErrors(["Błąd połączenia"]);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-fg p-6">
            <div className="w-full max-w-md bg-surface-2 border border-line p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter">DOŁĄCZ DO <span className="text-primary">SMART</span></h1>
                    <p className="text-muted text-sm mt-2">Rywalizuj i poprawiaj swoje wyniki</p>
                </div>

                {errors.length > 0 && (
                    <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-xl mb-6 text-xs">
                        <ul className="list-disc list-inside">
                            {errors.map((err, i) => <li key={i}>{String(err)}</li>)}
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
                        <label className="text-xs font-bold text-muted ml-1 uppercase">Email</label>
                        <input type="email" required className="w-full bg-surface-3 border border-line p-4 rounded-2xl focus:border-primary outline-none transition-all"
                            onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted ml-1 uppercase">Hasło</label>
                        <input type="password" required className="w-full bg-surface-3 border border-line p-4 rounded-2xl focus:border-primary outline-none transition-all"
                            onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    
                    <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-secondary text-white disabled:opacity-50 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 mt-4">
                        {loading ? "Tworzenie konta..." : "Zarejestruj się"}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-muted">
                    Masz już konto? <Link href="/login" className="text-primary font-bold hover:opacity-80 transition">Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
}