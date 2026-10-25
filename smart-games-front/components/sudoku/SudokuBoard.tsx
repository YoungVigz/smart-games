"use client"
import "./board.css"
import { useEffect, useRef, useState, useCallback } from "react"
import { SudokuCell } from "./SudokuCell"
import { SudokuKeypad } from "./SudokuKeypad"
import VictoryModal from "./VictoryModal" 
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { formatTime } from "@/utils/time"
import { Clock, AlertCircle } from "lucide-react"

interface SudokuBoardProps {
    initialData: any;
    onGameOver: () => void;
}

const SudokuBoard = ({ initialData, onGameOver }: SudokuBoardProps) => { 
    const [game, setGame] = useState(initialData)
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null)
    const [noteMode, setNoteMode] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [victoryData, setVictoryData] = useState<any>(null);
    const { updateUserXp } = useAuth();
    const [elapsed, setElapsed] = useState(game.timeElapsed);

    const stateRef = useRef({ 
        activeCell, 
        noteMode, 
        gameId: game.id, 
        status: game.status,
        isProcessing 
    })

    useEffect(() => {
        stateRef.current = { activeCell, noteMode, gameId: game.id, status: game.status, isProcessing }
    }, [activeCell, noteMode, game.id, game.status, isProcessing])

    useEffect(() => {
        if (game.status !== 'IN_PROGRESS' || !game.lastStartedAt) {
            setElapsed(game.timeElapsed);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(game.lastStartedAt).getTime();
            const diff = Math.floor((now - start) / 1000);
            setElapsed(game.timeElapsed + diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [game.status, game.lastStartedAt, game.timeElapsed]);

    const handleAction = useCallback(async (action: string, value?: number) => {
        const { activeCell, gameId, status, isProcessing } = stateRef.current
        
        if (isProcessing) return
        
        if (status === 'PAUSED' && !['pause', 'surrender'].includes(action)) return
        
        if (!activeCell && ['move', 'note', 'erase'].includes(action)) return

        setIsProcessing(true)
        try {
            const body = (action === 'pause' || action === 'surrender')
                ? {} 
                : { row: activeCell?.row, col: activeCell?.col, value }

            const res = await apiFetch(`/sudoku/${action}`, {
                method: "POST",
                body: JSON.stringify(body)
            })
            
            const json = await res.json();
            if (json.success) {
                if (action === 'surrender') return onGameOver();
                
                setGame(json.data);

                if (json.data.status === 'COMPLETED' && json.data.xpGained) {
                    updateUserXp(json.data.newTotalXp);
                    
                    setVictoryData({
                        xpGained: json.data.xpGained,
                        totalXp: json.data.newTotalXp,
                        difficulty: json.data.difficulty,
                        time: formatTime(json.data.timeElapsed)
                    });
                }
            }

        } catch (err) {
            console.error("Błąd akcji:", err)
        } finally {
            setIsProcessing(false)
        }
    }, [onGameOver, updateUserXp])

    const forcePause = useCallback(async () => {
        if (stateRef.current.status === 'IN_PROGRESS') {
            await apiFetch(`/sudoku/${stateRef.current.gameId}/pause`, { method: "POST", body: JSON.stringify({}) });
        }
    }, []);

    const forceResume = useCallback(async () => {
        if (stateRef.current.status === 'PAUSED') {
            handleAction('pause');
        }
    }, [handleAction]);

    useEffect(() => {
        if (game.status === 'PAUSED') {
            forceResume();
        }

        return () => {
            forcePause();
        };
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const currentStatus = stateRef.current.status;
            if (document.visibilityState === 'hidden' && currentStatus === 'IN_PROGRESS') {
                handleAction('pause');
            } else if (document.visibilityState === 'visible' && currentStatus === 'PAUSED') {
                handleAction('pause');
            }
        };

        const handleBeforeUnload = () => {
            forcePause();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [handleAction, forcePause]);

    const handleCellClick = (row: number, col: number) => {
        if (game.status === 'PAUSED') return
        setActiveCell(prev => (prev?.row === row && prev?.col === col ? null : { row, col }))
    }

    const getCellClass = (row: number, col: number): string => {
        let classes = "cell "
        const cell = game.board[row][col]
        if (cell.invalid) classes += "invalid "
        if (cell.readonly) classes += "readonly "
        if (!activeCell) return classes
        if (activeCell.row === row && activeCell.col === col) classes += "active "
        else if (activeCell.row === row || activeCell.col === col || 
            (Math.floor(activeCell.row / 3) === Math.floor(row / 3) && Math.floor(activeCell.col / 3) === Math.floor(col / 3))) {
            classes += "hover "
        }
        const activeValue = game.board[activeCell.row][activeCell.col].value
        if (activeValue && cell.value === activeValue) classes += "same-number "
        return classes
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= "1" && e.key <= "9") handleAction(stateRef.current.noteMode ? 'note' : 'move', Number(e.key))
            else if (e.key === "Backspace" || e.key === "Delete") handleAction('erase')
            else if (e.key === "n") setNoteMode(prev => !prev)
            else if (stateRef.current.activeCell) {
                const { row, col } = stateRef.current.activeCell
                if (e.key === "ArrowUp" || e.key === "w") setActiveCell({ row: Math.max(0, row - 1), col })
                else if (e.key === "ArrowDown" || e.key === "s") setActiveCell({ row: Math.min(8, row + 1), col })
                else if (e.key === "ArrowLeft" || e.key === "a") setActiveCell({ row, col: Math.max(0, col - 1) })
                else if (e.key === "ArrowRight" || e.key === "d") setActiveCell({ row, col: Math.min(8, col + 1) })
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleAction])

    return (
        <div className="sudoku-container flex flex-col items-center w-full max-w-[540px]">
            {victoryData && (
                <VictoryModal 
                    {...victoryData} 
                    onClose={onGameOver} 
                    onPlayAgain={() => window.location.reload()} 
                />
            )}

            <div className="flex justify-between items-center w-full px-2 mb-6">
                <div className="flex flex-col gap-1">
                    <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                        {game.difficulty}
                    </span>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-bold text-sm">
                        <AlertCircle size={14} className={game.errors > 0 ? "text-red-500" : ""} />
                        Błędy: <span className={game.errors > 0 ? "text-red-500" : "text-zinc-300"}>{game.errors}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-emerald-500 font-mono font-black text-xl tracking-wider">
                        <Clock size={18} />
                        {formatTime(elapsed)}
                    </div>
                    <button 
                        onClick={() => handleAction('pause')} 
                        className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                        {game.status === 'PAUSED' ? 'Wznów' : 'Pauza'}
                    </button>
                </div>
            </div>

            <div className="relative">
                {game.status === 'PAUSED' && (
                    <div className="board-overlay">
                        <h2 className="text-2xl font-black italic mb-4">GRA ZATRZYMANA</h2>
                        <button onClick={() => handleAction('pause')} className="resume-btn uppercase">Kontynuuj</button>
                    </div>
                )}
                <div className="board">
                    {game.board.map((row: any[], rI: number) =>
                        row.map((cell: any, cI: number) => (
                            <SudokuCell key={`${rI}-${cI}`} cell={cell} active={getCellClass(rI, cI)} onClick={() => handleCellClick(rI, cI)} />
                        ))
                    )}
                </div>
            </div>
            
            <SudokuKeypad 
                getRemainingCount={(n) => 9 - game.board.flat().filter((c: any) => c.value === n && !c.invalid).length} 
                onInsert={(n) => handleAction(noteMode ? 'note' : 'move', n)}
                onErase={() => handleAction('erase')}
                noteMode={noteMode}
                toggleNotes={() => setNoteMode(!noteMode)}
            />

            <button onClick={() => confirm("Czy na pewno chcesz poddać grę?") && handleAction('surrender')} className="surrender-link uppercase text-zinc-600 hover:text-red-500 transition-colors mt-8 font-black text-[10px] tracking-[0.2em]">
                Poddaj grę
            </button>
        </div>
    )
}

export default SudokuBoard