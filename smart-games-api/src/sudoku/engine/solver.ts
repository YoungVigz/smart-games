import { isValidPlacement } from './validator';

/**
 * Counts sudoku solutions up to specified limit.
 */
export function countSolutions(board: number[][], limit = 2): number {
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (board[row][col] !== 0) {
				continue;
			}

			let count = 0;

			for (let num = 1; num <= 9; num++) {
				if (!isValidPlacement(board, row, col, num)) {
					continue;
				}

				board[row][col] = num;

				count += countSolutions(board, limit);

				board[row][col] = 0;

				if (count >= limit) {
					return count;
				}
			}

			return count;
		}
	}

	return 1;
}
