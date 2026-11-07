"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Medal, Crown, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function RankingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"xp" | "pvp">("xp");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/ranking/${activeTab}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [activeTab]);

  return (
    <div className="mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">
            Hall of <span className="text-primary">Fame</span>
          </h1>
          <p className="text-muted font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Najlepsi gracze Smart Games
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-surface-2 p-1 rounded-2xl border border-line">
          <TabBtn active={activeTab === 'xp'} onClick={() => setActiveTab('xp')} label="Global XP" />
          <TabBtn active={activeTab === 'pvp'} onClick={() => setActiveTab('pvp')} label="PvP Rank" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'pvp' ? (
          <motion.div 
            key="pvp"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-2 border-2 border-dashed border-line rounded-[40px] p-20 flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-surface-3 p-6 rounded-full text-muted"><Lock size={40}/></div>
            <h2 className="text-2xl font-black uppercase italic text-fg/80">System Rankingowy wkrótce</h2>
            <p className="text-muted max-w-xs text-sm font-medium">Tryb PvP jest obecnie w fazie projektowania. Rangi zostaną odblokowane wraz z premierą trybu multiplayer.</p>
          </motion.div>
        ) : (
          <motion.div key="xp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-surface-2 border border-line rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-surface-3/50 text-[10px] font-black uppercase text-muted">
                  <tr>
                    <th className="px-8 py-5">Poz.</th>
                    <th className="px-8 py-5">Gracz</th>
                    <th className="px-8 py-5 text-right">Suma XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {data?.leaderboard.map((player: any) => (
                    <tr 
                      key={player.userId}
                      className={`group transition-colors ${player.userId === user?.id ? "bg-primary/5" : "hover:bg-surface-3/30"}`}
                    >
                      <td className="px-8 py-4">
                        <RankBadge rank={player.rank} />
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar / Initial */}
                          <div className={`w-8 h-8 rounded-lg bg-${player.avatar}-500/20 flex items-center justify-center text-${player.avatar}-500 font-black text-xs uppercase`}>
                            {player.login[0]}
                          </div>

                          {/* Link do profilu */}
                          <Link 
                            href={`/profile/${player.login}`} 
                            className="group/name transition-all"
                          >
                            <span className={`font-bold group-hover/name:text-primary transition-colors ${player.userId === user?.id ? "text-primary" : "text-fg"}`}>
                              {player.login}
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right font-mono font-black text-muted group-hover:text-primary transition-colors">
                        {player.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!data?.myStats?.isInTop && (
              <div className="bg-primary p-6 rounded-[32px] flex justify-between items-center shadow-xl shadow-primary/30 animate-bounce-subtle">
                <div className="flex items-center gap-6">
                   <div className="text-surface">
                      <p className="text-[10px] font-black uppercase leading-none opacity-70">Twoja Pozycja</p>
                      <p className="text-3xl font-black italic leading-none">#{data?.myStats?.rank}</p>
                   </div>
                   <div className="h-10 w-[2px] bg-surface/20" />
                   <div className="text-surface">
                      <p className="text-[10px] font-black uppercase leading-none opacity-70">Twój Wynik</p>
                      <p className="text-3xl font-black italic leading-none">{user?.xp.toLocaleString()} XP</p>
                   </div>
                </div>
                <div className="bg-surface/10 p-4 rounded-2xl font-black text-surface text-xs uppercase tracking-widest">
                    Graj więcej by awansować!
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? "bg-primary text-surface shadow-lg" : "text-muted hover:text-fg"}`}>
      {label}
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="bg-warning/20 text-warning w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-warning/20"><Crown size={16} /></div>;
  if (rank === 2) return <div className="bg-muted/20 text-muted w-8 h-8 rounded-lg flex items-center justify-center"><Medal size={16} /></div>;
  if (rank === 3) return <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-lg flex items-center justify-center"><Medal size={16} /></div>;
  return <span className="text-muted/70 font-mono font-black text-sm w-8 text-center block">#{rank}</span>;
}