import { Difficulty } from '../domain/types';
import { CELLS_TO_REMOVE } from '../domain/constants';
import { shuffle } from './utils';
import { countSolutions } from './solver';

/**
 * Removes cells from solved board while preserving unique solution.
 */
export function createPuzzle(fullBoard: number[][], difficulty: Difficulty): number[][] {
	const puzzle = fullBoard.map(row => [...row]);

	const targetRemovals = CELLS_TO_REMOVE[difficulty];

	const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));

	let removed = 0;

	for (const pos of positions) {
		if (removed >= targetRemovals) {
			break;
		}

		const row = Math.floor(pos / 9);
		const col = pos % 9;

		const backup = puzzle[row][col];

		puzzle[row][col] = 0;

		const copy = puzzle.map(r => [...r]);

		if (countSolutions(copy) === 1) {
			removed++;
		} else {
			puzzle[row][col] = backup;
		}
	}

	return puzzle;
}
