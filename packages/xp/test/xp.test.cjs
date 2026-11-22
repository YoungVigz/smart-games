const { test } = require("node:test");
const assert = require("node:assert/strict");
const { XpEngine, calculateReward } = require("../dist");
const input = {
	gameKey: "sudoku",
	modeKey: "solo",
	difficulty: "medium",
	errors: 0,
	outcome: "WIN",
};

test("rewards preserve solo rules, cap penalties and separate outcomes/modes", () => {
	assert.equal(calculateReward(input).xpGained, 250);
	assert.equal(calculateReward({ ...input, errors: 2 }).xpGained, 200);
	assert.equal(calculateReward({ ...input, errors: 100 }).xpGained, 75);
	for (const outcome of ["LOSS", "SURRENDER", "DRAW"])
		assert.equal(calculateReward({ ...input, outcome }).xpGained, 0);
	assert.equal(
		calculateReward({ ...input, modeKey: "pvp" }).policyVersion,
		"sudoku-pvp-v1",
	);
	assert.throws(
		() => calculateReward({ ...input, modeKey: "unknown" }),
		RangeError,
	);
	assert.throws(() => calculateReward({ ...input, errors: -1 }), RangeError);
});
test("every rounded level boundary agrees with progress display", () => {
	for (let level = 2; level <= 1000; level++) {
		const threshold = XpEngine.getTotalXpForLevel(level);
		assert.equal(XpEngine.getLevel(threshold - 1), level - 1);
		assert.equal(XpEngine.getLevel(threshold), level);
		assert.equal(XpEngine.getLevelProgress(threshold).progress, 0);
	}
	for (const xp of [-10, NaN, Infinity, 0])
		assert.equal(XpEngine.getLevelProgress(xp).level, 1);
});
