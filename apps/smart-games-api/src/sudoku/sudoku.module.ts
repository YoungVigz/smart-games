import { GamesModule } from "../games/games.module";
import { Module } from "@nestjs/common";
import { SudokuController } from "./sudoku.controller";
import { SudokuService } from "./sudoku.service";

@Module({
	imports: [GamesModule],
	controllers: [SudokuController],
	providers: [SudokuService],
	exports: [SudokuService],
})
export class SudokuModule {}
