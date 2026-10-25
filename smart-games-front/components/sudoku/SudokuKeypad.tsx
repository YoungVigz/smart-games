import { Eraser, Pencil } from "lucide-react";

type SudokuKeypadProps = {
    onInsert: (num: number) => void
    onErase: () => void
    getRemainingCount: (num: number) => number
    noteMode: boolean
    toggleNotes: () => void
}

export const SudokuKeypad = ({
    onInsert,
    onErase,
    getRemainingCount,
    noteMode,
    toggleNotes
}: SudokuKeypadProps) => {
    return (
        <div className="w-full space-y-4">
            <div className="grid grid-cols-9 gap-2">
                {Array.from({ length: 9 }, (_, i) => {
                    const num = i + 1;
                    const remaining = getRemainingCount(num);
                    return (
                        <button
                            key={num}
                            onClick={() => onInsert(num)}
                            disabled={remaining === 0}
                            className="group flex flex-col items-center justify-center h-14 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500 transition-all disabled:opacity-30 active:scale-95"
                        >
                            <span className="text-xl font-black text-zinc-200 group-hover:text-emerald-500 transition-colors">
                                {num}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-600 group-hover:text-emerald-500/50">
                                {remaining}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={toggleNotes}
                    className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-[0.2em] active:scale-[0.98] ${
                        noteMode 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    }`}
                >
                    <Pencil size={16} /> Tryb Notatek: {noteMode ? "WŁ" : "WYŁ"}
                </button>
                <button
                    onClick={onErase}
                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-zinc-900 border-2 border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-400/50 transition-all font-black uppercase text-[10px] tracking-[0.2em] active:scale-[0.98]"
                >
                    <Eraser size={16} /> Wymaż pole
                </button>
            </div>
        </div>
    );
};