import { Module } from '@nestjs/common';
import { SudokuController } from './sudoku.controller';
import { SudokuService } from './sudoku.service';

@Module({
	controllers: [SudokuController],
	providers: [SudokuService],
	exports: [SudokuService]
})
export class SudokuModule {}
