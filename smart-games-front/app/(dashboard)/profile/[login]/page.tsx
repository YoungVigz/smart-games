"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User, Calendar, Trophy, BarChart, Hash, Quote } from "lucide-react";
import { XpEngine } from "@/lib/xp-engine";

const AVATAR_BG: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
};

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
        <div className="mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header / Avatar */}
            <div className="bg-surface-2 border border-line rounded-[32px] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 text-fg">
                    <User size={200} />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    {/* Stock Avatar */}
                    <div className={`w-32 h-32 rounded-3xl ${AVATAR_BG[profile.avatar] ?? "bg-primary"} flex items-center justify-center text-white shadow-2xl rotate-3`}>
                        <User size={64} strokeWidth={2.5} />
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-fg">
                            {profile.login}
                        </h1>
                        <p className="flex items-center justify-center md:justify-start gap-2 text-muted font-bold text-xs uppercase tracking-widest">
                            <Calendar size={14} /> Dołączył {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                        {profile.bio && (
                            <p className="text-muted font-medium max-w-md italic flex gap-2">
                                <Quote size={12} className="text-primary shrink-0" /> {profile.bio}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-2 border border-line p-8 rounded-[24px] space-y-4">
                    <p className="text-muted font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Trophy size={14} className="text-primary" /> Poziom Konta
                    </p>
                    <div>
                        <p className="text-4xl font-black italic text-fg leading-none">{level}</p>
                        <div className="mt-4 h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="bg-surface-2 border border-line p-8 rounded-[24px] space-y-4">
                    <p className="text-muted font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <Hash size={14} className="text-info" /> Rank
                    </p>
                    <p className="text-4xl font-black italic text-fg leading-none">#{profile.rank}</p>
                </div>

                <div className="bg-surface-2 border border-line p-8 rounded-[24px] space-y-4">
                    <p className="text-muted font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                        <BarChart size={14} className="text-danger" /> Gry Razem
                    </p>
                    <p className="text-4xl font-black italic text-fg leading-none">{profile._count.games}</p>
                </div>
            </div>
            
            {isOwnProfile && (
                <div className="flex justify-end">
                    <button className="bg-surface-3 hover:bg-line text-fg font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all">
                        Edytuj profil
                    </button>
                </div>
            )}
        </div>
    );
}