import { GamesModule } from "../games/games.module";
import { Module } from "@nestjs/common";
import { PvpGateway } from "./pvp.gateway";
import { SudokuService } from "src/sudoku/sudoku.service";

@Module({
	imports: [GamesModule],
	providers: [PvpGateway, SudokuService],
})
export class PvpModule {}
