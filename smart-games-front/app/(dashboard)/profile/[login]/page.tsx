"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, Calendar, Trophy, BarChart, Hash, Quote } from "lucide-react";
import { XpEngine } from "@/lib/xp-engine";

export default function PublicProfilePage() {
    const { login } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        apiFetch(`/users/profile/${login}`).then(res => res.json()).then(json => {
            if(json.success) setProfile(json.data);
        });
    }, [login]);

    if (!profile) return null;

    const { level, progress } = XpEngine.getLevelProgress(profile.xp);
    const isOwnProfile = currentUser?.login === profile.login;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Avatar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-zinc-100">
                    <User size={200} />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Stock Avatar */}
                    <div className={`w-32 h-32 rounded-3xl bg-${profile.avatar}-500 flex items-center justify-center text-zinc-950 shadow-2xl rotate-3`}>
                        <User size={64} strokeWidth={2.5} />
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                            {profile.login}
                        </h1>
                        <p className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 font-bold text-xs uppercase tracking-widest">
                            <Calendar size={14} /> Dołączył {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                        {profile.bio && (
                            <p className="text-zinc-400 font-medium max-w-md italic flex gap-2 italic">
                                <Quote size={12} className="text-emerald-500 shrink-0" /> {profile.bio}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[24px] space-y-4">
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Trophy size={14} className="text-emerald-500" /> Poziom Konta
                    </p>
                    <div>
                        <p className="text-4xl font-black italic text-white leading-none">{level}</p>
                        <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[24px] space-y-4">
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Hash size={14} className="text-blue-500" /> Rank
                    </p>
                    <p className="text-4xl font-black italic text-white leading-none">#{profile.rank}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[24px] space-y-4">
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <BarChart size={14} className="text-rose-500" /> Gry Razem
                    </p>
                    <p className="text-4xl font-black italic text-white leading-none">{profile._count.games}</p>
                </div>
            </div>
            
            {isOwnProfile && (
                <div className="flex justify-end">
                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all">
                        Edytuj profil
                    </button>
                </div>
            )}
        </div>
    );
}