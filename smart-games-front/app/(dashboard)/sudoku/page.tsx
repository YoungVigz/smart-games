"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import SudokuBoard from "@/components/sudoku/SudokuBoard";
import PvPSudokuBoard from "@/components/sudoku/PvpSudokuBoard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Zap, Target, Trophy, Play, Swords, ShieldCheck, Loader2, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

export default function SudokuPage() {
  const { user, status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [gameMode, setGameMode] = useState<"solo" | "pvp">("solo");
  const [pvpStatus, setPvpStatus] = useState<"idle" | "searching" | "playing">("idle");
  const [queueTime, setQueueTime] = useState(0);
  const [showVsScreen, setShowVsScreen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const loadGame = useCallback(async () => {
    if (status !== 'authenticated') return; 
    try {
      const res = await apiFetch("/sudoku/active");
      const json = await res.json();
      if (json.success && json.data) {
          setActiveGame(json.data);
          setGameMode("solo");
      }
    } finally { setLoading(false); }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadGame();
      if (!socketRef.current) {
        socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL}/pvp`, { auth: { userId: user?.id } });
        socketRef.current.on("match_found", (data) => {
          setShowVsScreen(true);
          setTimeout(() => { setShowVsScreen(false); setPvpStatus("playing"); setActiveGame(data); setGameMode("pvp"); }, 3500);
        });
        socketRef.current.on("queue_status", (d) => { if (d.status === 'idle') setPvpStatus("idle"); });
      }
    }
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, [status, user?.id, loadGame]);

  useEffect(() => {
    let interval: any;
    if (pvpStatus === "searching") interval = setInterval(() => setQueueTime(prev => prev + 1), 1000);
    else setQueueTime(0);
    return () => clearInterval(interval);
  }, [pvpStatus]);

  const handleStartAction = async () => {
    if (gameMode === "solo") {
      setLoading(true);
      const res = await apiFetch("/sudoku", { method: "POST", body: JSON.stringify({ difficulty }) });
      const json = await res.json();
      if (json.success) setActiveGame(json.data);
      else alert(json.message);
      setLoading(false);
    } else {
      socketRef.current?.emit("join_queue");
      setPvpStatus("searching");
    }
  };

  if (status === 'loading' || loading) return <div className="h-full flex items-center justify-center text-emerald-500 font-black animate-pulse">WCZYTYWANIE...</div>;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col items-center justify-center p-6 pb-20">
      <AnimatePresence>
        {showVsScreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <div className="flex items-center gap-16 relative z-10">
                <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center space-y-4">
                    <div className="w-40 h-40 bg-emerald-500 rounded-[40px] flex items-center justify-center text-zinc-950 font-black text-6xl shadow-[0_0_50px_rgba(16,185,129,0.3)]">{user?.login[0].toUpperCase()}</div>
                    <p className="text-2xl font-black italic uppercase text-white">{user?.login}</p>
                </motion.div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="text-8xl font-black italic text-zinc-800">VS</motion.div>
                <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-center space-y-4">
                    <div className="w-40 h-40 bg-zinc-900 border-4 border-zinc-800 rounded-[40px] flex items-center justify-center text-zinc-700 shadow-2xl"><UserIcon size={80} /></div>
                    <p className="text-2xl font-black italic uppercase text-zinc-600">RYWAL</p>
                </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeGame ? (
        <div className="w-full space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-white">Sudoku <span className="text-emerald-500">Lobby</span></h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em]">Wybierz tryb gry</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-10">
                    <section className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ModeCard active={gameMode === 'solo'} onClick={() => setGameMode('solo')} icon={<Play size={20} />} title="Solo Practice" desc="Zdobywaj XP we własnym tempie." />
                            <ModeCard active={gameMode === 'pvp'} onClick={() => setGameMode('pvp')} icon={<Swords size={20} />} title="Ranked PvP" desc="Pojedynek 1v1 w czasie rzeczywistym." />
                        </div>
                    </section>
                    {gameMode === 'solo' && (
                        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4">
                            <DifficultyBtn id="easy" label="Łatwy" icon={Zap} active={difficulty === 'easy'} onClick={setDifficulty} />
                            <DifficultyBtn id="medium" label="Średni" icon={Target} active={difficulty === 'medium'} onClick={setDifficulty} />
                            <DifficultyBtn id="hard" label="Trudny" icon={Trophy} active={difficulty === 'hard'} onClick={setDifficulty} />
                        </motion.section>
                    )}
                </div>
                <div className="lg:col-span-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] shadow-2xl space-y-8 h-fit">
                        <SummaryRow label="Poziom" value={gameMode === "solo" ? difficulty.toUpperCase() : "MEDIUM (PVP)"} />
                        {pvpStatus === "searching" ? (
                            <div className="space-y-4">
                                <div className="text-center py-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                                    <Loader2 className="mx-auto mb-2 text-emerald-500 animate-spin" />
                                    <p className="text-emerald-500 font-mono text-2xl">{Math.floor(queueTime/60)}:{(queueTime%60).toString().padStart(2,'0')}</p>
                                </div>
                                <button onClick={() => { socketRef.current?.emit("leave_queue"); setPvpStatus("idle"); }} className="w-full bg-zinc-800 py-4 rounded-2xl font-black uppercase text-xs">Anuluj</button>
                            </div>
                        ) : (
                            <button onClick={handleStartAction} className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black py-6 rounded-3xl transition-all shadow-xl shadow-emerald-900/20 uppercase italic tracking-tighter">
                                {gameMode === 'solo' ? 'Start Solo' : 'Join Queue'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      ) : (
        gameMode === "pvp" ? <PvPSudokuBoard initialData={activeGame} socket={socketRef.current} onGameOver={() => { setActiveGame(null); setPvpStatus("idle"); setGameMode("solo"); }} /> : <SudokuBoard initialData={activeGame} onGameOver={() => setActiveGame(null)} />
      )}
    </div>
  );
}

function ModeCard({ active, onClick, icon, title, desc }: any) {
    return <button onClick={onClick} className={`p-8 rounded-[32px] border-2 text-left transition-all ${active ? "bg-emerald-600/5 border-emerald-500" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"}`}><div className={`mb-4 p-3 rounded-2xl w-fit ${active ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-500"}`}>{icon}</div><p className="font-black text-xl uppercase italic text-white">{title}</p><p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">{desc}</p></button>;
}

function DifficultyBtn({ label, icon: Icon, active, onClick, id }: any) {
    return <button onClick={() => onClick(id)} className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] ${active ? "border-emerald-500 text-emerald-500 bg-zinc-800" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}><Icon size={14} />{label}</button>;
}

function SummaryRow({ label, value }: any) {
    return <div className="flex justify-between items-center border-b border-zinc-800 pb-4"><span className="text-zinc-500 text-[10px] font-black uppercase">{label}</span><span className="text-white font-black uppercase italic">{value}</span></div>;
}