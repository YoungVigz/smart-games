import { Inject } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { SudokuService } from 'src/sudoku/sudoku.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'pvp'
})
export class PvpGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private activeConnections = new Map<string, string>();

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly sudokuService: SudokuService
  ) {}

  private readonly QUEUE_KEY = 'pvp:queue';

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId; 
    if (!userId) return client.disconnect();
    client.data.userId = userId;
    this.activeConnections.set(userId, client.id);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      await this.redis.lrem(this.QUEUE_KEY, 0, userId);
      this.activeConnections.delete(userId);
    }
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(client: Socket) {
    const userId = client.data.userId;
    await this.redis.lrem(this.QUEUE_KEY, 0, userId);
    await this.redis.rpush(this.QUEUE_KEY, userId);
    const queueLen = await this.redis.llen(this.QUEUE_KEY);
    if (queueLen >= 2) {
      const p1Id = await this.redis.lpop(this.QUEUE_KEY);
      const p2Id = await this.redis.lpop(this.QUEUE_KEY);
      if (p1Id && p2Id) this.startMatch(p1Id, p2Id);
    } else {
      client.emit('queue_status', { status: 'waiting' });
    }
  }

  @SubscribeMessage('leave_queue')
  async handleLeaveQueue(client: Socket) {
    await this.redis.lrem(this.QUEUE_KEY, 0, client.data.userId);
    client.emit('queue_status', { status: 'idle' });
  }

  private async startMatch(p1Id: string, p2Id: string) {
    const matchId = `match:${Date.now()}`;
    const { board, solution } = await this.sudokuService.preparePvpGame('medium');
    const matchState = { matchId, solution, players: [p1Id, p2Id], status: 'PLAYING' };
    await this.redis.setex(`pvp:${matchId}:meta`, 3600, JSON.stringify(matchState));

    for (const pid of [p1Id, p2Id]) {
      const playerState = { board, errors: 0 };
      await this.redis.setex(`pvp:${matchId}:player:${pid}`, 3600, JSON.stringify(playerState));
      await this.redis.setex(`pvp:player:${pid}:active_match`, 3600, matchId);
    }

    const s1Id = this.activeConnections.get(p1Id);
    const s2Id = this.activeConnections.get(p2Id);
    if (s1Id && s2Id) {
      this.server.in(s1Id).socketsJoin(matchId);
      this.server.in(s2Id).socketsJoin(matchId);
      this.server.to(matchId).emit('match_found', { matchId, board, opponents: [p1Id, p2Id] });
    }
  }

  @SubscribeMessage('pvp_move')
  async handleMove(client: Socket, payload: { row: number, col: number, value: number | null }) {
    const userId = client.data.userId;
    const matchId = await this.redis.get(`pvp:player:${userId}:active_match`);
    if (!matchId) return;

    const metaStr = await this.redis.get(`pvp:${matchId}:meta`);
    const playerStr = await this.redis.get(`pvp:${matchId}:player:${userId}`);
    if (!metaStr || !playerStr) return;

    const meta = JSON.parse(metaStr);
    const player = JSON.parse(playerStr);
    const { row, col, value } = payload;
    const cell = player.board[row][col];

    if (cell.readonly) return;

    if (value === null) {
      cell.value = null;
      cell.invalid = false;
    } else {
      const isCorrect = meta.solution[row][col] === value;
      cell.value = value;
      cell.invalid = !isCorrect;
      if (!isCorrect) {
        player.errors++;
        if (player.errors >= 3) return this.endMatch(matchId, userId, 'DISQUALIFIED');
      } else {
        cell.readonly = true;
        if (this.isComplete(player.board, meta.solution)) return this.endMatch(matchId, userId, 'WINNER');
      }
    }

    await this.redis.setex(`pvp:${matchId}:player:${userId}`, 3600, JSON.stringify(player));
    client.emit('pvp_move_result', { board: player.board, errors: player.errors });
    const progress = this.calculateProgress(player.board);
    client.to(matchId).emit('opponent_update', { userId, progress, errors: player.errors });
  }

  private async endMatch(matchId: string, triggerUserId: string, reason: 'WINNER' | 'DISQUALIFIED') {
    const meta = JSON.parse((await this.redis.get(`pvp:${matchId}:meta`))!);
    const winnerId = reason === 'WINNER' ? triggerUserId : meta.players.find((id: string) => id !== triggerUserId);
    this.server.to(matchId).emit('match_end', { winnerId, reason });
    await this.redis.del(`pvp:${matchId}:meta`);
    for (const pid of meta.players) {
      await this.redis.del(`pvp:${matchId}:player:${pid}`);
      await this.redis.del(`pvp:player:${pid}:active_match`);
    }
  }

  private calculateProgress(board: any[][]): number {
    const totalToFill = board.flat().filter(c => c.value === null || c.readonly === false || c.invalid === true).length;
    const correctMoves = board.flat().filter(c => c.readonly === true && !c.invalid && c.notes === undefined).length;
    const initialFilled = board.flat().filter(c => c.readonly === true && c.value !== null && c.notes?.length === 0).length;
    const currentCorrect = board.flat().filter(c => c.readonly === true && !c.invalid).length;
    const initialCount = 30; // approx
    return Math.max(0, Math.min(100, Math.round(((currentCorrect - initialCount) / (81 - initialCount)) * 100)));
  }

  private isComplete = (b: any[][], s: number[][]) => b.every((r, ri) => r.every((c, ci) => c.value === s[ri][ci]));
}