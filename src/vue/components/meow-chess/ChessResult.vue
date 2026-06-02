<template>
  <div class="chess-result-overlay">
    <!-- 背景遮罩 -->
    <div class="result-backdrop" @click.self="$emit('back-to-lobby')"></div>

    <!-- 结算卡片 -->
    <transition name="card-pop" mode="out-in">
      <div class="result-card" :class="resultClass" :key="resultClass">
        <!-- 胜利/失败动画 -->
        <div class="result-animation">
          <transition name="result-pop" mode="out-in">
            <div v-if="isDraw" key="draw" class="result-icon draw-icon">
              <span class="icon">🤝</span>
            </div>
            <div v-else-if="isWinner" key="win" class="result-icon win-icon">
              <span class="icon">🎉</span>
              <div class="confetti-container">
                <span class="confetti" v-for="i in 30" :key="i" :style="getConfettiStyle(i)"></span>
              </div>
            </div>
            <div v-else key="lose" class="result-icon lose-icon">
              <span class="icon">😿</span>
            </div>
          </transition>
        </div>

        <!-- 结果文字 -->
        <div class="result-text">
          <h2 class="result-title">{{ resultTitle }}</h2>
          <p class="result-subtitle">{{ resultSubtitle }}</p>
        </div>

        <!-- 棋盘回顾 -->
        <div class="board-review">
          <div class="mini-board">
            <div
              v-for="(cell, index) in board"
              :key="index"
              class="mini-cell"
              :class="{
                'win-cell': winCombo && winCombo.includes(index),
              }"
            >
              <span v-if="cell" class="mini-piece" :class="`piece-${cell.toLowerCase()}`">
                {{ cell }}
              </span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <button class="result-btn rematch-btn" @click="$emit('rematch')">
            <span class="btn-icon">🔄</span>
            <span>再来一局</span>
          </button>
          <button class="result-btn back-btn" @click="$emit('back-to-lobby')">
            <span class="btn-icon">🏠</span>
            <span>返回大厅</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'ChessResult',
  props: {
    winner: {
      type: String,
      default: null,
    },
    winCombo: {
      type: Array,
      default: null,
    },
    board: {
      type: Array,
      required: true,
    },
    youAre: {
      type: String,
      required: true,
      validator: (val) => ['X', 'O'].includes(val),
    },
  },
  computed: {
    isWinner() {
      return this.winner === this.youAre;
    },
    isDraw() {
      return this.winner === 'draw';
    },
    resultClass() {
      if (this.isWinner) return 'result-win';
      if (this.isDraw) return 'result-draw';
      return 'result-lose';
    },
    resultTitle() {
      if (this.isWinner) return '恭喜你赢了！';
      if (this.isDraw) return '平局！';
      return '很遗憾，你输了';
    },
    resultSubtitle() {
      if (this.isWinner) return '喵星棋王就是你！';
      if (this.isDraw) return '势均力敌的对决！';
      return '再接再厉，下次一定能赢！';
    },
  },
  methods: {
    getConfettiStyle(index) {
      const colors = ['#ffd700', '#4ecdc4', '#ff6b6b', '#a8e6cf', '#ffd93d'];
      const randomX = Math.random() * 100;
      const randomDelay = Math.random() * 2;
      const randomDuration = 2 + Math.random() * 2;
      return {
        left: `${randomX}%`,
        backgroundColor: colors[index % colors.length],
        animationDelay: `${randomDelay}s`,
        animationDuration: `${randomDuration}s`,
      };
    },
  },
};
</script>

<style scoped lang="scss">
.chess-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.result-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
}

.result-card {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  animation: cardAppear 0.5s ease-out;

  &.result-win {
    border-color: rgba(255, 215, 0, 0.3);
    box-shadow: 0 0 50px rgba(255, 215, 0, 0.2);
  }

  &.result-lose {
    border-color: rgba(255, 107, 107, 0.3);
    box-shadow: 0 0 50px rgba(255, 107, 107, 0.1);
  }

  &.result-draw {
    border-color: rgba(78, 205, 196, 0.3);
    box-shadow: 0 0 50px rgba(78, 205, 196, 0.1);
  }
}

.result-animation {
  margin-bottom: 20px;
}

.result-icon {
  position: relative;
  display: inline-block;

  .icon {
    font-size: 80px;
    display: block;
  }
}

.win-icon .icon {
  animation: winBounce 1s infinite;
}

.lose-icon .icon {
  animation: loseShake 0.5s ease-in-out;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confettiFall 3s infinite linear;
  
  &:nth-child(odd) {
    width: 8px;
    height: 14px;
    border-radius: 4px;
  }
  
  &:nth-child(3n) {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
}

.result-text {
  margin-bottom: 30px;
}

.result-title {
  font-size: 32px;
  font-weight: bold;
  margin: 0 0 10px;

  .result-win & {
    color: #ffd700;
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  }

  .result-lose & {
    color: #ff6b6b;
  }

  .result-draw & {
    color: #4ecdc4;
  }
}

.result-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.board-review {
  margin: 30px 0;
}

.mini-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 6px;
  margin: 0 auto;
}

.mini-cell {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.win-cell {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid #ffd700;
  }
}

.mini-piece {
  font-size: 28px;
  font-weight: bold;

  &.piece-x {
    color: #ffd700;
  }

  &.piece-o {
    color: #4ecdc4;
  }
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.result-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-3px);
  }
}

.rematch-btn {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: #fff;

  &:hover {
    box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
  }
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.btn-icon {
  font-size: 18px;
}

// 动画
.card-pop-enter-active {
  animation: cardPopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-pop-leave-active {
  animation: cardPopOut 0.3s ease-in;
}

@keyframes cardPopIn {
  0% {
    transform: scale(0.5) translateY(50px);
    opacity: 0;
  }
  60% {
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes cardPopOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes cardAppear {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes winBounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.1);
  }
}

@keyframes loseShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(300px) rotate(720deg);
    opacity: 0;
  }
}

.result-pop-enter-active {
  animation: popIn 0.4s ease-out;
}

@keyframes popIn {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
</style>
