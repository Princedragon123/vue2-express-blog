<template>
  <div class="chess-board-container">
    <!-- 游戏信息栏 -->
    <div class="game-info-bar">
      <div class="room-info">
        <span class="label">房间</span>
        <span class="value">{{ roomId }}</span>
      </div>
      <div class="turn-info" :class="{ 'my-turn': isMyTurn, 'disconnected': isOpponentDisconnected }">
        <span class="turn-icon">{{ isOpponentDisconnected ? '⚠️' : (isMyTurn ? '' : '⏳') }}</span>
        <span class="turn-text">{{ getTurnText() }}</span>
        <span v-if="isOpponentDisconnected" class="countdown">{{ countdown }}s</span>
      </div>
      <div class="game-count">
        <span class="label">第</span>
        <span class="value">{{ gameCount + 1 }}</span>
        <span class="label">局</span>
      </div>
    </div>

    <!-- 对手信息 -->
    <div class="player-info opponent-info">
      <div class="player-avatar">
        <span class="avatar-icon">🐱</span>
      </div>
      <div class="player-details">
        <span class="player-name">对手</span>
        <span class="player-piece" :class="`piece-${opponentPiece.toLowerCase()}`">{{ opponentPiece }}</span>
      </div>
      <div class="player-status" :class="{ active: !isMyTurn }">
        <span class="status-dot"></span>
      </div>
    </div>

    <!-- 棋盘 -->
    <div class="board-wrapper">
      <div class="board">
        <div
          v-for="(cell, index) in board"
          :key="index"
          class="cell"
          :class="{
            'has-piece': cell !== null,
            'clickable': isMyTurn && cell === null,
            'win-cell': isWinCell(index),
            'hover-preview': isMyTurn && cell === null && hoveredCell === index,
            'last-move': lastMoveIndex === index,
          }"
          @click="handleCellClick(index)"
          @mouseenter="handleCellHover(index)"
          @mouseleave="handleCellLeave"
        >
          <transition name="piece-appear">
            <span v-if="cell" class="piece" :class="`piece-${cell.toLowerCase()}`">
              {{ cell }}
            </span>
          </transition>
          <span v-if="isMyTurn && cell === null && hoveredCell === index" class="piece-preview" :class="`piece-${youAre.toLowerCase()}`">
            {{ youAre }}
          </span>
        </div>
      </div>

      <!-- 获胜连线 -->
      <svg v-if="showWinLine" class="win-line-svg" viewBox="0 0 300 300">
        <line
          :x1="winLineStart.x"
          :y1="winLineStart.y"
          :x2="winLineEnd.x"
          :y2="winLineEnd.y"
          class="win-line"
        />
      </svg>
    </div>

    <!-- 自己信息 -->
    <div class="player-info self-info">
      <div class="player-avatar">
        <span class="avatar-icon">🐶</span>
      </div>
      <div class="player-details">
        <span class="player-name">你</span>
        <span class="player-piece" :class="`piece-${youAre.toLowerCase()}`">{{ youAre }}</span>
      </div>
      <div class="player-status" :class="{ active: isMyTurn }">
        <span class="status-dot"></span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="action-btn leave-btn" @click="$emit('leave-room')">
        <span class="btn-icon">🚪</span>
        <span>离开房间</span>
      </button>
    </div>
  </div>
</template>

<script>
import chessSocket from '../../utils/chessSocket';

export default {
  name: 'ChessBoard',
  props: {
    roomId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    youAre: {
      type: String,
      required: true,
      validator: (val) => ['X', 'O'].includes(val),
    },
    opponentId: {
      type: String,
      required: true,
    },
    board: {
      type: Array,
      required: true,
    },
    currentPlayer: {
      type: String,
      required: true,
    },
    gameCount: {
      type: Number,
      default: 0,
    },
    isOpponentDisconnected: {
      type: Boolean,
      default: false,
    },
    winCombo: {
      type: Array,
      default: null,
    },
    countdown: {
      type: Number,
      default: 30,
    },
  },
  data() {
    return {
      hoveredCell: null,
      lastMoveIndex: null,
    };
  },
  watch: {
    board: {
      handler(newBoard, oldBoard) {
        if (!oldBoard) return;
        const changedIndex = newBoard.findIndex((cell, index) => {
          return cell !== null && oldBoard[index] !== cell;
        });
        if (changedIndex !== -1) {
          this.lastMoveIndex = changedIndex;
          setTimeout(() => {
            this.lastMoveIndex = null;
          }, 1000);
        }
      },
      deep: true,
    },
  },
  computed: {
    isMyTurn() {
      return this.currentPlayer === this.userId;
    },
    opponentPiece() {
      return this.youAre === 'X' ? 'O' : 'X';
    },
    showWinLine() {
      return this.winCombo && this.winCombo.length === 3;
    },
    winLineStart() {
      if (!this.winCombo) return { x: 0, y: 0 };
      const pos = this.getCellCenter(this.winCombo[0]);
      return pos;
    },
    winLineEnd() {
      if (!this.winCombo) return { x: 0, y: 0 };
      const pos = this.getCellCenter(this.winCombo[2]);
      return pos;
    },
  },
  methods: {
    handleCellClick(index) {
      if (!this.isMyTurn || this.board[index] !== null) return;
      chessSocket.makeMove(this.userId, this.roomId, index);
      this.hoveredCell = null;
    },
    handleCellHover(index) {
      if (this.isMyTurn && this.board[index] === null) {
        this.hoveredCell = index;
      }
    },
    handleCellLeave() {
      this.hoveredCell = null;
    },
    getTurnText() {
      if (this.isOpponentDisconnected) {
        return '对手已断线，等待重连...';
      }
      return this.isMyTurn ? '轮到你了，画一个吧' : '对手正在思考...';
    },
    isWinCell(index) {
      return this.winCombo && this.winCombo.includes(index);
    },
    getCellCenter(index) {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const cellSize = 100;
      const gap = 8;
      const padding = 8;
      return {
        x: padding + col * (cellSize + gap) + cellSize / 2,
        y: padding + row * (cellSize + gap) + cellSize / 2,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.chess-board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 20px;
  gap: 20px;
}

// 游戏信息栏
.game-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.room-info,
.game-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  font-family: 'Courier New', monospace;
}

.turn-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  transition: all 0.3s;

  &.my-turn {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  &.disconnected {
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.3);
    animation: warningPulse 1.5s infinite;
  }
}

.countdown {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  animation: countdownPulse 1s infinite;
}

.turn-icon {
  font-size: 16px;
}

.turn-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

// 玩家信息
.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
}

.player-avatar {
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 24px;
}

.player-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-name {
  font-size: 16px;
  color: #fff;
  font-weight: 500;
}

.player-piece {
  font-size: 20px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 8px;
}

.piece-x {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.15);
}

.piece-o {
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.15);
}

.player-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: rgba(78, 205, 196, 0.3);
    animation: pulse 1.5s infinite;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ecdc4;
}

// 棋盘
.board-wrapper {
  position: relative;
  padding: 20px;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 8px;
  position: relative;
  z-index: 1;
}

.win-line-svg {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 300px;
  height: 300px;
  pointer-events: none;
  z-index: 10;
}

.win-line {
  stroke: #ffd700;
  stroke-width: 6;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: drawLine 0.6s ease-out forwards;
}

.cell {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.2s;
  position: relative;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: scale(0.95);
      transition: transform 0.1s;
    }
  }

  &.has-piece {
    background: rgba(255, 255, 255, 0.12);
  }

  &.last-move {
    animation: lastMoveGlow 1s ease-out;
  }

  &.win-cell {
    background: rgba(255, 215, 0, 0.2);
    border: 2px solid rgba(255, 215, 0, 0.5);
    animation: winCellPulse 1s infinite;
  }
}

.piece-preview {
  position: absolute;
  font-size: 48px;
  font-weight: bold;
  line-height: 1;
  opacity: 0.3;
  pointer-events: none;
  transition: opacity 0.2s;

  &.piece-x {
    color: #ffd700;
  }

  &.piece-o {
    color: #4ecdc4;
  }
}

.piece {
  font-size: 48px;
  font-weight: bold;
  line-height: 1;

  &.piece-x {
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }

  &.piece-o {
    color: #4ecdc4;
    text-shadow: 0 0 20px rgba(78, 205, 196, 0.5);
    font-family: 'Comic Sans MS', cursive, sans-serif;
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }
}

.leave-btn {
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;

  &:hover {
    background: rgba(255, 107, 107, 0.25);
  }
}

.btn-icon {
  font-size: 16px;
}

// 动画
.piece-appear-enter-active {
  animation: pieceAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pieceAppear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
    opacity: 0.8;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes warningPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.2);
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
  }
}

@keyframes winCellPulse {
  0%, 100% {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }
  50% {
    background: rgba(255, 215, 0, 0.3);
    border-color: rgba(255, 215, 0, 0.8);
  }
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes countdownPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes lastMoveGlow {
  0% {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  }
  100% {
    background: rgba(255, 255, 255, 0.12);
    box-shadow: none;
  }
}
</style>
