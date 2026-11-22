const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
	generateFullBoard,
	createPuzzle,
	countSolutions,
	createBoard,
	isBoardComplete,
	assertMove,
} = require("../dist/sudoku");
const { parseDifficulty, getGameMode } = require("../dist");

test("generated puzzles have one solution without changing the solved board", () => {
	const solution = generateFullBoard();
	const snapshot = JSON.stringify(solution);
	for (const difficulty of ["easy", "medium", "hard"]) {
		const puzzle = createPuzzle(solution, difficulty);
		assert.equal(countSolutions(puzzle.map(row => [...row])), 1);
		assert.equal(isBoardComplete(createBoard(puzzle), solution), false);
		assert.equal(isBoardComplete(createBoard(solution), solution), true);
	}
	assert.equal(JSON.stringify(solution), snapshot);
});
test("shared input contracts reject invalid moves and catalog keys", () => {
	assert.equal(parseDifficulty("HARD"), "hard");
	assert.equal(getGameMode("sudoku", "pvp").maxPlayers, 2);
	for (const args of [
		[-1, 0, 1],
		[0, 9, 1],
		[0, 0, 10],
		[0.1, 0, 1],
	])
		assert.throws(() => assertMove(...args), RangeError);
	assert.throws(() => parseDifficulty("expert"), RangeError);
	assert.throws(() => getGameMode("unknown", "solo"), RangeError);
});
