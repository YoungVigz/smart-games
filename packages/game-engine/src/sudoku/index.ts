export { generateFullBoard } from "./generator";
export { createPuzzle } from "./puzzle";
export { countSolutions } from "./solver";
export { isValidPlacement } from "./validator";
export type {
	SudokuCell as Cell,
	SudokuBoard as Board,
	MatrixBoard,
	Difficulty,
} from "../index";
import type { MatrixBoard, SudokuBoard } from "../index";

export function createBoard(puzzle: MatrixBoard): SudokuBoard {
	return puzzle.map(row =>
		row.map(value => ({
			value: value === 0 ? null : value,
			readonly: value !== 0,
			invalid: false,
			notes: [],
		})),
	);
}
export function isBoardComplete(
	board: SudokuBoard,
	solution: MatrixBoard,
): boolean {
	return board.every((row, ri) =>
		row.every((cell, ci) => cell.value === solution[ri][ci]),
	);
}
export function assertMove(
	row: number,
	col: number,
	value?: number | null,
): void {
	if (
		!Number.isInteger(row) ||
		!Number.isInteger(col) ||
		row < 0 ||
		row > 8 ||
		col < 0 ||
		col > 8
	)
		throw new RangeError("Invalid cell position");
	if (
		value !== undefined &&
		value !== null &&
		(!Number.isInteger(value) || value < 1 || value > 9)
	)
		throw new RangeError("Invalid cell value");
}
