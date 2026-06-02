<template>
  <div class="chess-lobby">
    <!-- 主内容区 -->
    <div class="lobby-content">
      <!-- 欢迎语 -->
      <div class="welcome-section">
        <h2 class="welcome-title">欢迎来到喵星棋局</h2>
        <p class="welcome-subtitle">与好友来一场智慧的较量吧！</p>
      </div>

      <!-- 操作按钮区 -->
      <div class="action-section">
        <button
          v-if="!roomId"
          class="action-btn create-btn"
          @click="handleCreateRoom"
          :disabled="isLoading"
        >
          <span class="btn-icon"></span>
          <span class="btn-text">{{ isLoading ? '创建中...' : '创建房间' }}</span>
        </button>

        <button
          v-if="!roomId"
          class="action-btn join-btn"
          @click="showJoinModal = true"
        >
          <span class="btn-icon"></span>
          <span class="btn-text">加入房间</span>
        </button>

        <button
          v-if="!roomId"
          class="action-btn stats-btn"
          @click="showStats = true"
        >
          <span class="btn-icon">📊</span>
          <span class="btn-text">查看战绩</span>
        </button>

        <button
          v-if="!roomId"
          class="action-btn leaderboard-btn"
          @click="showLeaderboard = true"
        >
          <span class="btn-icon">🏆</span>
          <span class="btn-text">排行榜</span>
        </button>

        <!-- 等待对手界面 -->
        <div v-if="roomId && !gameStarted" class="waiting-section">
          <div class="room-info">
            <span class="room-label">房间号</span>
            <div class="room-id-display">
              <span class="room-id">{{ roomId }}</span>
              <button class="copy-btn" @click="copyRoomId" :class="{ copied: copied }">
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
          </div>

          <div class="waiting-animation">
            <div class="waiting-dots">
              <span class="dot" v-for="i in 3" :key="i"></span>
            </div>
            <p class="waiting-text">等待对手加入...</p>
          </div>

          <button class="cancel-btn" @click="handleLeaveRoom">
            取消等待
          </button>
        </div>
      </div>

      <!-- 游戏规则 -->
      <div class="rules-section">
        <h3 class="rules-title">📖 游戏规则</h3>
        <ul class="rules-list">
          <li>房主执 <strong class="piece-x">X</strong>，客人执 <strong class="piece-o">O</strong></li>
          <li>双方轮流在 3×3 棋盘上落子</li>
          <li>先将三个棋子连成一线者获胜</li>
          <li>每局结束后自动轮换先手</li>
        </ul>
      </div>
    </div>

    <!-- 加入房间弹窗 -->
    <div v-if="showJoinModal" class="modal-overlay" @click.self="showJoinModal = false">
      <div class="modal-content">
        <h3 class="modal-title">加入房间</h3>
        <p class="modal-subtitle">请输入 6 位房间号</p>
        <div class="input-group">
          <input
            v-model="joinRoomId"
            type="text"
            class="room-input"
            placeholder="例如：123456"
            maxlength="6"
            @keyup.enter="handleJoinRoom"
            ref="roomInput"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showJoinModal = false">取消</button>
          <button
            class="modal-btn confirm"
            @click="handleJoinRoom"
            :disabled="!joinRoomId || joinRoomId.length !== 6 || isLoading"
          >
            {{ isLoading ? '加入中...' : '加入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 战绩统计弹窗 -->
    <div v-if="showStats" class="modal-overlay" @click.self="showStats = false">
      <div class="modal-content stats-modal">
        <ChessStats :userId="userId" @close="showStats = false" />
      </div>
    </div>

    <!-- 排行榜弹窗 -->
    <div v-if="showLeaderboard" class="modal-overlay" @click.self="showLeaderboard = false">
      <div class="modal-content leaderboard-modal">
        <ChessLeaderboard :userId="userId" @close="showLeaderboard = false" />
      </div>
    </div>
  </div>
</template>

<script>
import chessSocket from '../../utils/chessSocket';
import ChessStats from './ChessStats.vue';
import ChessLeaderboard from './ChessLeaderboard.vue';

export default {
  name: 'ChessLobby',
  components: {
    ChessStats,
    ChessLeaderboard,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      roomId: null,
      gameStarted: false,
      showJoinModal: false,
      joinRoomId: '',
      isLoading: false,
      copied: false,
      showStats: false,
      showLeaderboard: false,
    };
  },
  watch: {
    showJoinModal(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs.roomInput?.focus();
        });
      }
    },
  },
  methods: {
    // ============================================================
    // 创建房间
    // ============================================================
    async handleCreateRoom() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        console.log('[ChessLobby] 开始创建房间...');
        const data = await chessSocket.createRoom(this.userId, this.userRole);
        console.log('[ChessLobby] 房间创建成功:', data);
        this.roomId = data.roomId;
        this.$emit('room-created', data);
      } catch (error) {
        console.error('[ChessLobby] 创建房间失败:', error);
        alert(`创建房间失败: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    },

    // ============================================================
    // 加入房间
    // ============================================================
    async handleJoinRoom() {
      if (!this.joinRoomId || this.joinRoomId.length !== 6) return;
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        console.log('[ChessLobby] 开始加入房间:', this.joinRoomId);
        await chessSocket.joinRoom(this.userId, this.userRole, this.joinRoomId);
        console.log('[ChessLobby] 房间加入成功');
        this.roomId = this.joinRoomId;
        this.$emit('room-joined', { roomId: this.joinRoomId });
        this.showJoinModal = false;
        this.joinRoomId = '';
      } catch (error) {
        console.error('[ChessLobby] 加入房间失败:', error);
        alert(`加入房间失败: ${error.message}`);
      } finally {
        this.isLoading = false;
      }
    },

    // ============================================================
    // 离开房间
    // ============================================================
    handleLeaveRoom() {
      if (this.roomId) {
        chessSocket.leaveRoom(this.userId, this.roomId);
      }
      this.roomId = null;
      this.gameStarted = false;
    },

    // ============================================================
    // 复制房间号
    // ============================================================
    copyRoomId() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.roomId).then(() => {
          this.copied = true;
          setTimeout(() => {
            this.copied = false;
          }, 2000);
        });
      } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = this.roomId;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      }
    },
  }
}
</script>

<style scoped lang="scss">
.chess-lobby {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
}

.lobby-content {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

// 欢迎区
.welcome-section {
  margin-bottom: 50px;
}

.welcome-title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 15px;
  text-shadow: 0 0 30px rgba(255, 200, 100, 0.3);
}

.welcome-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

// 操作按钮区
.action-section {
  margin-bottom: 50px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 40px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  margin: 10px;
  min-width: 200px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
}

.create-btn {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;

  &:not(:disabled):hover {
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
  }
}

.join-btn {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: #fff;

  &:not(:disabled):hover {
    box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
  }
}

.btn-icon {
  font-size: 24px;
}

.stats-btn {
  background: linear-gradient(135deg, #a18cd1, #fbc2eb);
  color: #fff;

  &:not(:disabled):hover {
    box-shadow: 0 10px 30px rgba(161, 140, 209, 0.3);
  }
}

// 等待区
.waiting-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  backdrop-filter: blur(10px);
}

.room-info {
  margin-bottom: 30px;
}

.room-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.room-id-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.room-id {
  font-size: 48px;
  font-weight: bold;
  color: #ffd700;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.copied {
    background: rgba(78, 205, 196, 0.3);
    border-color: #4ecdc4;
    color: #4ecdc4;
  }
}

.waiting-animation {
  margin: 30px 0;
}

.waiting-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #ffd700;
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

.waiting-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  padding: 10px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }
}

// 游戏规则
.rules-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px 30px;
  text-align: left;
}

.rules-title {
  font-size: 18px;
  color: #fff;
  margin: 0 0 15px;
}

.rules-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rules-list li {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.piece-x {
  color: #ffd700;
  font-size: 16px;
}

.piece-o {
  color: #4ecdc4;
  font-size: 16px;
}

// 弹窗
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 35px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-title {
  font-size: 24px;
  color: #fff;
  margin: 0 0 10px;
}

.modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 25px;
}

.input-group {
  margin-bottom: 25px;
}

.room-input {
  width: 100%;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 24px;
  text-align: center;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #ffd700;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
    letter-spacing: 2px;
    font-size: 16px;
  }
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.cancel {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;

    &:not(:disabled):hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &.confirm {
    background: linear-gradient(135deg, #4ecdc4, #44a08d);
    color: #fff;

    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(78, 205, 196, 0.3);
    }
  }
}

.leaderboard-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #fff;

  &:not(:disabled):hover {
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
  }
}

.stats-modal {
  max-width: 700px;
  padding: 20px;
}

.leaderboard-modal {
  max-width: 700px;
  padding: 20px;
}

// 动画
@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
