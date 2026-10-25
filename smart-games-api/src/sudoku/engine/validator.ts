/**
 * Checks whether placing a number in given position is valid.
 */
export function isValidPlacement(
	board: number[][],
	row: number,
	col: number,
	num: number,
): boolean {
	// row + column validation
	for (let i = 0; i < 9; i++) {
		if (i !== col && board[row][i] === num) {
			return false;
		}

		if (i !== row && board[i][col] === num) {
			return false;
		}
	}

	// 3x3 box validation
	const boxRow = Math.floor(row / 3) * 3;
	const boxCol = Math.floor(col / 3) * 3;

	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 3; c++) {
			const currentRow = boxRow + r;
			const currentCol = boxCol + c;

			if ((currentRow !== row || currentCol !== col) && board[currentRow][currentCol] === num) {
				return false;
			}
		}
	}

	return true;
}
