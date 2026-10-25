"use client"
import "./board.css"
import { useEffect, useRef, useState, useCallback } from "react"
import { SudokuCell } from "./SudokuCell"
import { SudokuKeypad } from "./SudokuKeypad"
import { useAuth } from "@/context/AuthContext"
import { Swords, AlertCircle, Trophy, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function PvPSudokuBoard({ initialData, socket, onGameOver }: any) {
    const { user } = useAuth();
    const [game, setGame] = useState(initialData);
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
    const [opponentProgress, setOpponentProgress] = useState({ progress: 0, errors: 0 });
    const [noteMode, setNoteMode] = useState(false);
    const [matchResult, setMatchResult] = useState<any>(null);

    const stateRef = useRef({ activeCell, noteMode, matchResult, board: game.board });
    useEffect(() => { stateRef.current = { activeCell, noteMode, matchResult, board: game.board }; }, [activeCell, noteMode, matchResult, game.board]);

    useEffect(() => {
        if (!socket) return;
        socket.on("pvp_move_result", (data: any) => setGame((prev: any) => ({ ...prev, board: data.board, errors: data.errors })));
        socket.on("opponent_update", (data: any) => setOpponentProgress({ progress: data.progress, errors: data.errors }));
        socket.on("match_end", (data: any) => setMatchResult(data));
        return () => { socket.off("pvp_move_result"); socket.off("opponent_update"); socket.off("match_end"); };
    }, [socket]);

    const handleAction = useCallback((action: string, value?: number) => {
        if (stateRef.current.matchResult) return;
        const cell = stateRef.current.activeCell;
        if (!cell) return;
        if (action === 'move') socket.emit("pvp_move", { row: cell.row, col: cell.col, value });
        else if (action === 'erase') socket.emit("pvp_move", { row: cell.row, col: cell.col, value: null });
        else if (action === 'note') {
            const newBoard = [...game.board];
            const target = newBoard[cell.row][cell.col];
            if (target.readonly || target.value !== null) return;
            target.notes = (target.notes || []).includes(value) ? target.notes.filter((n:any) => n !== value) : [...(target.notes || []), value].sort();
            setGame((prev:any) => ({ ...prev, board: newBoard }));
        }
    }, [socket, game.board]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= "1" && e.key <= "9") handleAction(stateRef.current.noteMode ? 'note' : 'move', Number(e.key));
            else if (e.key === "Backspace" || e.key === "Delete") handleAction('erase');
            else if (e.key === "n") setNoteMode(prev => !prev);
            else if (stateRef.current.activeCell) {
                const { row, col } = stateRef.current.activeCell;
                if (e.key === "ArrowUp" || e.key === "w") setActiveCell({ row: Math.max(0, row - 1), col });
                else if (e.key === "ArrowDown" || e.key === "s") setActiveCell({ row: Math.min(8, row + 1), col });
                else if (e.key === "ArrowLeft" || e.key === "a") setActiveCell({ row, col: Math.max(0, col - 1) });
                else if (e.key === "ArrowRight" || e.key === "d") setActiveCell({ row, col: Math.min(8, col + 1) });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleAction]);

    const myProgress = (() => {
        const initial = 30;
        const correct = game.board.flat().filter((c: any) => c.readonly && !c.invalid).length;
        return Math.max(0, Math.round(((correct - initial) / (81 - initial)) * 100));
    })();

    const getCellClass = (r: number, c: number): string => {
        const cell = game.board[r][c];
        let cls = `cell ${cell.invalid ? 'invalid' : ''} ${cell.readonly ? 'readonly' : ''} `;
        if (activeCell?.row === r && activeCell?.col === c) cls += "active ";
        else if (activeCell?.row === r || activeCell?.col === c || (Math.floor(activeCell?.row!/3) === Math.floor(r/3) && Math.floor(activeCell?.col!/3) === Math.floor(c/3))) cls += "hover ";
        if (activeCell && game.board[activeCell.row][activeCell.col].value === cell.value && cell.value) cls += "same-number ";
        return cls;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-[540px] gap-6">
            <div className="grid grid-cols-2 gap-4 w-full px-2">
                <StatusBox label="Ty" errors={game.errors} progress={myProgress} color="emerald" />
                <StatusBox label="Rywal" errors={opponentProgress.errors} progress={opponentProgress.progress} color="amber" />
            </div>
            <div className="scale-[0.8] sm:scale-100 origin-top">
                <div className="board !my-0">
                    {game.board.map((row: any[], rI: number) => row.map((cell: any, cI: number) => (
                        <SudokuCell key={`${rI}-${cI}`} cell={cell} active={getCellClass(rI, cI)} onClick={() => setActiveCell({ row: rI, col: cI })} />
                    )))}
                </div>
            </div>
            <SudokuKeypad getRemainingCount={(n:number) => 9 - game.board.flat().filter((c:any) => c.value === n && !c.invalid).length} onInsert={(n:number) => handleAction(noteMode ? 'note' : 'move', n)} onErase={() => handleAction('erase')} noteMode={noteMode} toggleNotes={() => setNoteMode(!noteMode)} />
            <AnimatePresence>{matchResult && <ResultModal result={matchResult} userId={user?.id} onGameOver={onGameOver} />}</AnimatePresence>
        </div>
    )
}

function StatusBox({ label, errors, progress, color }: any) {
    return (
        <div className={`p-4 rounded-2xl border-2 bg-zinc-900 border-zinc-800`}>
            <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase">
                <span className="text-zinc-400">{label}</span>
                <span className="text-red-500">{errors}/3 ERR</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className={`h-full bg-${color}-500`} animate={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}

function ResultModal({ result, userId, onGameOver }: any) {
    const win = result.winnerId === userId;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[700] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] text-center max-w-sm w-full space-y-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${win ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {win ? <Trophy size={40} /> : <XCircle size={40} />}
                </div>
                <h2 className="text-3xl font-black uppercase italic text-white">{win ? "Zwycięstwo!" : "Porażka"}</h2>
                <p className="text-zinc-500 text-sm">{result.reason === 'DISQUALIFIED' ? 'Limit błędów przekroczony.' : 'Rywal był szybszy!'}</p>
                <button onClick={onGameOver} className="w-full bg-emerald-600 py-4 rounded-2xl font-black uppercase text-xs">Powrót</button>
            </div>
        </motion.div>
    )
}