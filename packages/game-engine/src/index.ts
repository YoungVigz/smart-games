export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type GameOutcome = "WIN" | "LOSS" | "DRAW" | "SURRENDER";
export type GameStatus = "IN_PROGRESS" | "PAUSED" | "COMPLETED" | "SURRENDERED";

// Board containers are reusable; cell semantics belong to each game's engine.
export type Board<TCell> = TCell[][];
export interface Position {
	row: number;
	col: number;
}
export interface SudokuCell {
	value: number | null;
	readonly: boolean;
	invalid?: boolean;
	notes?: number[];
}
export type SudokuBoard = Board<SudokuCell>;
export type MatrixBoard = Board<number>;
export interface SudokuGameView {
	id: string;
	userId: string;
	gameKey: "sudoku";
	modeKey: "solo";
	difficulty: Uppercase<Difficulty>;
	board: SudokuBoard;
	status: GameStatus;
	errors: number;
	timeElapsed: number;
	lastStartedAt: string | null;
	startedAt: string;
	xpGained?: number;
	newTotalXp?: number;
}

export interface PvpSudokuView {
	matchId: string;
	board: SudokuBoard;
	errors?: number;
	opponents: string[];
}
export interface MatchEnd {
	winnerId?: string;
	reason: string;
	participants: {
		userId: string;
		xpGained: number | null;
		newTotalXp: number;
	}[];
}

export interface GameModeDefinition {
	key: string;
	minPlayers: number;
	maxPlayers: number;
	competitive: boolean;
}
export interface GameDefinition {
	key: string;
	difficulties: readonly Difficulty[];
	modes: readonly GameModeDefinition[];
}
export const GAME_CATALOG: readonly GameDefinition[] = [
	{
		key: "sudoku",
		difficulties: DIFFICULTIES,
		modes: [
			{ key: "solo", minPlayers: 1, maxPlayers: 1, competitive: false },
			{ key: "pvp", minPlayers: 2, maxPlayers: 2, competitive: true },
		],
	},
];

export function getGameMode(
	gameKey: string,
	modeKey: string,
): GameModeDefinition {
	const mode = GAME_CATALOG.find(game => game.key === gameKey)?.modes.find(
		mode => mode.key === modeKey,
	);
	if (!mode)
		throw new RangeError(`Unsupported game/mode: ${gameKey}/${modeKey}`);
	return mode;
}
export function parseDifficulty(value: unknown): Difficulty {
	if (typeof value !== "string") throw new RangeError("Invalid difficulty");
	const difficulty = value.toLowerCase();
	if (!DIFFICULTIES.includes(difficulty as Difficulty))
		throw new RangeError("Invalid difficulty");
	return difficulty as Difficulty;
}
