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
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic tracking-tighter">DOŁĄCZ DO <span className="text-emerald-500">SMART</span></h1>
                    <p className="text-zinc-500 text-sm mt-2">Rywalizuj i poprawiaj swoje wyniki</p>
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-xs">
                        <ul className="list-disc list-inside">
                            {errors.map((err, i) => <li key={i}>{String(err)}</li>)}
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
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Email</label>
                        <input type="email" required className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                            onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 ml-1 uppercase">Hasło</label>
                        <input type="password" required className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                            onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    
                    <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 mt-4">
                        {loading ? "Tworzenie konta..." : "Zarejestruj się"}
                    </button>
                </form>

                <p className="text-center mt-8 text-sm text-zinc-500">
                    Masz już konto? <Link href="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition">Zaloguj się</Link>
                </p>
            </div>
        </div>
    );
}