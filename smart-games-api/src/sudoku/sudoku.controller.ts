import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { SudokuService } from './sudoku.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('sudoku')
@UseGuards(AuthGuard)
export class SudokuController {
	constructor(private readonly sudokuService: SudokuService) {}

	@Get('active')
	getActive(@Req() req) {
		return this.sudokuService.getActiveGame(req.user.sub);
	}

	@Post('/')
	createBoard(@Req() req, @Body('difficulty') difficulty: any) {
		return this.sudokuService.generateBoard(req.user.sub, difficulty || 'easy');
	}

	@Post('move')
	makeMove(
		@Req() req,
		@Body() move: { row: number; col: number; value: number },
	) {
		return this.sudokuService.makeMove(req.user.sub, move.row, move.col, move.value);
	}

	@Post('pause')
	togglePause(@Req() req) {
		return this.sudokuService.togglePause(req.user.sub);
	}

	@Post('surrender')
	surrender(@Req() req) {
		return this.sudokuService.surrender(req.user.sub);
	}

	@Post('note')
	updateNote(
		@Req() req,
		@Body('row') row: number,
		@Body('col') col: number,
		@Body('value') value: number,
	) {
		return this.sudokuService.updateNote(req.user.sub, row, col, value);
	}

	@Post('erase')
	erase(@Req() req, @Body('row') row: number, @Body('col') col: number) {
		return this.sudokuService.erase(req.user.sub, row, col);
	}

	@Get("statistics")
	getUserStats(@Req() req) {
		return this.sudokuService.getUserStats(req.user.sub);
	}
}