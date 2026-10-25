import { Module } from '@nestjs/common';
import { PvpGateway } from './pvp.gateway';
import { SudokuService } from 'src/sudoku/sudoku.service';

@Module({
    providers: [PvpGateway, SudokuService]
})
export class PvpModule {}
