import type { SudokuBoard } from "@smart-games/game-engine";

export function getInitialCell(board: SudokuBoard) {
	for (const [row, cells] of board.entries()) {
		const col = cells.findIndex(cell => !cell.readonly);
		if (col !== -1) return { row, col };
	}
	return null;
}
