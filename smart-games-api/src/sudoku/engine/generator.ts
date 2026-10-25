import { shuffle } from './utils';
import { isValidPlacement } from './validator';

/**
 * Generates fully solved sudoku board.
 */
export function generateFullBoard(): number[][] {
	const board = Array.from({ length: 9 }, () => Array(9).fill(0));

	fillBoard(board);

	return board;
}

/**
 * Fills sudoku board recursively using backtracking.
 */
function fillBoard(board: number[][]): boolean {
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (board[row][col] !== 0) {
				continue;
			}

			const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

			for (const num of numbers) {
				if (!isValidPlacement(board, row, col, num)) {
					continue;
				}

				board[row][col] = num;

				if (fillBoard(board)) {
					return true;
				}

				board[row][col] = 0;
			}

			return false;
		}
	}

	return true;
}
