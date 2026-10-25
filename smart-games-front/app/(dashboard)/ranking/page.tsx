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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">
            Hall of <span className="text-emerald-500">Fame</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Najlepsi gracze Smart Games
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          <TabBtn active={activeTab === 'xp'} onClick={() => setActiveTab('xp')} label="Global XP" />
          <TabBtn active={activeTab === 'pvp'} onClick={() => setActiveTab('pvp')} label="PvP Rank" />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'pvp' ? (
          <motion.div 
            key="pvp"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[40px] p-20 flex flex-col items-center text-center space-y-4"
          >
            <div className="bg-zinc-800 p-6 rounded-full text-zinc-600"><Lock size={40}/></div>
            <h2 className="text-2xl font-black uppercase italic text-zinc-400">System Rankingowy wkrótce</h2>
            <p className="text-zinc-600 max-w-xs text-sm font-medium">Tryb PvP jest obecnie w fazie projektowania. Rangi zostaną odblokowane wraz z premierą trybu multiplayer.</p>
          </motion.div>
        ) : (
          <motion.div key="xp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-500">
                  <tr>
                    <th className="px-8 py-5">Poz.</th>
                    <th className="px-8 py-5">Gracz</th>
                    <th className="px-8 py-5 text-right">Suma XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {data?.leaderboard.map((player: any) => (
                    <tr 
                      key={player.userId}
                      className={`group transition-colors ${player.userId === user?.id ? "bg-emerald-500/5" : "hover:bg-zinc-800/30"}`}
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
                            <span className={`font-bold group-hover/name:text-emerald-400 transition-colors ${player.userId === user?.id ? "text-emerald-400" : "text-zinc-200"}`}>
                              {player.login}
                            </span>
                          </Link>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right font-mono font-black text-zinc-400 group-hover:text-emerald-500 transition-colors">
                        {player.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!data?.myStats?.isInTop && (
              <div className="bg-emerald-600 p-6 rounded-[32px] flex justify-between items-center shadow-xl shadow-emerald-900/40 animate-bounce-subtle">
                <div className="flex items-center gap-6">
                   <div className="text-zinc-950">
                      <p className="text-[10px] font-black uppercase leading-none opacity-70">Twoja Pozycja</p>
                      <p className="text-3xl font-black italic leading-none">#{data?.myStats?.rank}</p>
                   </div>
                   <div className="h-10 w-[2px] bg-zinc-950/20" />
                   <div className="text-zinc-950">
                      <p className="text-[10px] font-black uppercase leading-none opacity-70">Twój Wynik</p>
                      <p className="text-3xl font-black italic leading-none">{user?.xp.toLocaleString()} XP</p>
                   </div>
                </div>
                <div className="bg-zinc-950/10 p-4 rounded-2xl font-black text-zinc-950 text-xs uppercase tracking-widest">
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
    <button onClick={onClick} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? "bg-emerald-600 text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>
      {label}
    </button>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="bg-yellow-500/20 text-yellow-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]"><Crown size={16} /></div>;
  if (rank === 2) return <div className="bg-zinc-300/20 text-zinc-300 w-8 h-8 rounded-lg flex items-center justify-center"><Medal size={16} /></div>;
  if (rank === 3) return <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-lg flex items-center justify-center"><Medal size={16} /></div>;
  return <span className="text-zinc-600 font-mono font-black text-sm w-8 text-center block">#{rank}</span>;
}