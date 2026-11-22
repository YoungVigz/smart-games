import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { GAME_CATALOG } from "@smart-games/game-engine";
import { AuthGuard } from "../auth/auth.guard";
import { GamesService } from "./games.service";

@Controller("games")
@UseGuards(AuthGuard)
export class GamesController {
	constructor(private readonly games: GamesService) {}
	@Get("catalog") catalog() {
		return GAME_CATALOG;
	}
	@Get("history") history(
		@Req() req: Request & { user: { sub: string } },
		@Query("gameKey") gameKey?: string,
		@Query("modeKey") modeKey?: string,
		@Query("difficulty") difficulty?: string,
		@Query("limit") limit?: string,
		@Query("before") before?: string,
	) {
		return this.games.history(
			req.user.sub,
			{ gameKey, modeKey, difficulty },
			limit === undefined ? 25 : Number(limit),
			before,
		);
	}
	@Get("statistics") statistics(
		@Req() req: Request & { user: { sub: string } },
		@Query("gameKey") gameKey?: string,
		@Query("modeKey") modeKey?: string,
		@Query("difficulty") difficulty?: string,
	) {
		return this.games.statistics(req.user.sub, {
			gameKey,
			modeKey,
			difficulty,
		});
	}

	@Get(":sessionId")
	details(
		@Req() req: Request & { user: { sub: string } },
		@Param("sessionId") sessionId: string,
	) {
		return this.games.details(req.user.sub, sessionId);
	}
}
