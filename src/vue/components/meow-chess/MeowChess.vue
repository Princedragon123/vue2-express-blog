<template>
  <div class="meow-chess-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="paw-print" v-for="i in 6" :key="i" :style="getPawStyle(i)"></div>
    </div>

    <!-- 顶部标题栏 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <span class="title-icon">🐱</span>
          <h1 class="page-title">喵星棋局</h1>
          <span class="svip-badge">SVIP 专属</span>
        </div>
        <div class="header-actions">
          <button class="sound-toggle-btn" @click="toggleSound" :title="soundEnabled ? '关闭音效' : '开启音效'">
            <span class="sound-icon">{{ soundEnabled ? '🔊' : '🔇' }}</span>
          </button>
          <button class="back-btn" @click="goBack">
            <span>←</span> 返回
          </button>
        </div>
      </div>
    </div>

    <!-- 房间大厅 -->
    <ChessLobby
      v-if="gameState === 'lobby'"
      :user-id="userId"
      :user-role="userRole"
      @room-created="onRoomCreated"
      @room-joined="onRoomJoined"
    />

    <!-- 游戏棋盘 -->
    <ChessBoard
      v-if="gameState === 'playing' || gameState === 'result'"
      :room-id="roomId"
      :user-id="userId"
      :user-role="userRole"
      :you-are="youAre"
      :opponent-id="opponentId"
      :board="board"
      :current-player="currentPlayer"
      :game-count="gameCount"
      :is-opponent-disconnected="opponentDisconnected"
      :win-combo="winCombo"
      :countdown="reconnectCountdown"
      @leave-room="onLeaveRoom"
    />

    <!-- 结算弹窗 -->
    <ChessResult
      v-if="gameState === 'result'"
      :winner="winner"
      :win-combo="winCombo"
      :board="board"
      :you-are="youAre"
      @rematch="onRematch"
      @back-to-lobby="onBackToLobby"
    />

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-toast" :class="{ show: errorMessage }">
      <span class="error-icon">⚠️</span>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import ChessLobby from './ChessLobby.vue';
import ChessBoard from './ChessBoard.vue';
import ChessResult from './ChessResult.vue';
import chessSocket from '../../utils/chessSocket';
import audioManager from '../../utils/audioManager';
import store from '../../store';
import webSocketMixin from '../../mixins/webSocketMixin';

export default {
  name: 'MeowChess',
  mixins: [webSocketMixin],
  components: {
    ChessLobby,
    ChessBoard,
    ChessResult,
  },
  data() {
    return {
      gameState: 'lobby', // lobby | playing | result
      userId: null,
      userRole: null,
      roomId: null,
      youAre: null, // 'X' | 'O'
      opponentId: null,
      board: Array(9).fill(null),
      currentPlayer: null,
      winner: null,
      winCombo: null,
      gameCount: 0,
      errorMessage: '',
      isReconnecting: false, // 是否正在重连
      opponentDisconnected: false, // 对手是否断线
      soundEnabled: true, // 音效开关
      reconnectCountdown: 30, // 重连倒计时（秒）
      countdownTimer: null, // 倒计时定时器
    };
  },
  computed: {
    isMyTurn() {
      return this.currentPlayer === this.userId;
    },
  },
  created() {
    // 获取用户信息
    this.userId = store.getters.currentUser?._id || store.getters.currentUser?.id;
    this.userRole = store.getters.getUserRole;

    // 初始化音频管理器
    audioManager.init();
  },
  async mounted() {
    // 确保 WebSocket 已连接
    try {
      await this.initWebSocket();
      console.log('[MeowChess] WebSocket 连接成功');
      
      // 连接成功后再初始化 chessSocket 和注册事件
      chessSocket.init();
      
      // 注册事件监听
      this.registerEvents();
      
      console.log('[MeowChess] 游戏初始化完成');
    } catch (error) {
      console.error('[MeowChess] 初始化失败:', error);
      this.showError('连接服务器失败，请刷新页面重试');
    }
  },
  beforeDestroy() {
    // 清理事件监听
    chessSocket.cleanup();
    
    // 清理倒计时定时器
    this.stopReconnectCountdown();
  },
  methods: {
    // ============================================================
    // 事件监听
    // ============================================================
    registerEvents() {
      chessSocket.onOpponentJoined((data) => {
        // 房主收到对手加入通知
        this.opponentId = data.opponentId;
      });

      chessSocket.onGameStarted((data) => {
        this.roomId = data.roomId;
        this.board = [...data.board];
        this.currentPlayer = data.currentPlayer;
        this.youAre = data.youAre;
        this.opponentId = data.opponentId;
        this.gameCount = data.gameCount || 0;
        this.winner = null;
        this.winCombo = null;
        this.gameState = 'playing';
      });

      chessSocket.onMoveMade((data) => {
        // 根据position和piece更新棋盘，而不是接收整个board（优化传输速度）
        this.board[data.position] = data.piece;
        this.currentPlayer = data.currentPlayer;
        
        // 播放画圈/画叉音效
        audioManager.play('placePiece');
      });

      chessSocket.onGameOver((data) => {
        // 先播放音效，再切换状态，让用户体验更流畅
        if (data.winner === 'draw') {
          audioManager.play('draw');
        } else if (data.winner === this.youAre) {
          audioManager.play('win');
        } else {
          audioManager.play('lose');
        }
        
        // 短暂延迟后切换状态，让音效先播放
        setTimeout(() => {
          this.gameState = 'result';
          this.winner = data.winner;
          this.winCombo = data.winCombo;
          this.board = [...data.board];
        }, 100);
      });

      chessSocket.onOpponentLeft(() => {
        this.showError('对手已离开房间');
        this.onBackToLobby();
      });

      chessSocket.onOpponentDisconnected(() => {
        this.opponentDisconnected = true;
        this.showError('对手已断开连接，等待重连中...');
        this.startReconnectCountdown();
      });

      chessSocket.onOpponentReconnected(() => {
        this.opponentDisconnected = false;
        this.showError('对手已重新连接');
        this.stopReconnectCountdown();
      });

      chessSocket.onError((data) => {
        this.showError(data.message);
      });

      // 监听 socket 重连事件（全局 socket 重连后自动尝试恢复游戏）
      if (chessSocket.socket) {
        chessSocket.socket.on('reconnect', () => {
          console.log('[MeowChess] Socket 重连成功，尝试恢复游戏');
          if (this.roomId && this.userId && this.gameState === 'playing') {
            this.attemptReconnect();
          }
        });
      }
    },

    // ============================================================
    // 房间事件处理
    // ============================================================
    async onRoomCreated(data) {
      this.roomId = data.roomId;
      this.youAre = data.youAre;
      audioManager.play('join');
      // 等待对手加入，状态保持 lobby
    },

    async onRoomJoined(data) {
      audioManager.play('join');
      // 加入房间后等待 gameStarted 事件
    },

    onLeaveRoom() {
      if (this.roomId && this.userId) {
        chessSocket.leaveRoom(this.userId, this.roomId);
      }
      this.resetGameState();
    },

    onRematch() {
      if (this.roomId && this.userId) {
        chessSocket.rematch(this.userId, this.roomId);
        audioManager.play('rematch');
      }
      // 等待 gameStarted 事件来更新状态
      this.winner = null;
      this.winCombo = null;
    },

    onBackToLobby() {
      this.onLeaveRoom();
      this.gameState = 'lobby';
    },

    // ============================================================
    // 工具方法
    // ============================================================
    async attemptReconnect() {
      if (this.isReconnecting || !this.roomId) return;
      
      this.isReconnecting = true;
      this.showError('正在尝试重连...');
      
      try {
        const data = await chessSocket.reconnect(this.userId, this.roomId);
        
        // 重连成功，恢复游戏状态
        this.board = [...data.board];
        this.currentPlayer = data.currentPlayer;
        this.youAre = data.youAre;
        this.opponentId = data.opponentId;
        this.gameCount = data.gameCount || 0;
        this.gameState = 'playing';
        
        this.showError('重连成功！');
      } catch (error) {
        console.error('重连失败:', error);
        this.showError(error.message || '重连失败');
        this.onBackToLobby();
      } finally {
        this.isReconnecting = false;
      }
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      audioManager.setEnabled(this.soundEnabled);
      
      if (this.soundEnabled) {
        audioManager.play('join');
      }
    },

    startReconnectCountdown() {
      this.reconnectCountdown = 30;
      this.countdownTimer = setInterval(() => {
        this.reconnectCountdown--;
        if (this.reconnectCountdown <= 0) {
          this.stopReconnectCountdown();
        }
      }, 1000);
    },

    stopReconnectCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.reconnectCountdown = 30;
    },

    resetGameState() {
      this.roomId = null;
      this.youAre = null;
      this.opponentId = null;
      this.board = Array(9).fill(null);
      this.currentPlayer = null;
      this.winner = null;
      this.winCombo = null;
      this.gameCount = 0;
    },

    showError(message) {
      this.errorMessage = message;
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    },

    getPawStyle(index) {
      const positions = [
        { top: '10%', left: '5%', rotate: '15deg', opacity: 0.1 },
        { top: '20%', right: '10%', rotate: '-20deg', opacity: 0.08 },
        { top: '50%', left: '3%', rotate: '10deg', opacity: 0.06 },
        { top: '70%', right: '5%', rotate: '-15deg', opacity: 0.1 },
        { top: '85%', left: '15%', rotate: '25deg', opacity: 0.07 },
        { top: '40%', right: '3%', rotate: '-10deg', opacity: 0.09 },
      ];
      const pos = positions[index - 1] || positions[0];
      return {
        ...pos,
        transform: `rotate(${pos.rotate})`,
      };
    },

    goBack() {
      this.onLeaveRoom();
      this.$router.push('/blog');
    },
  },
};
</script>

<style scoped lang="scss">
.meow-chess-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
  z-index: 1000;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.paw-print {
  position: absolute;
  width: 60px;
  height: 60px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='65' r='25' fill='%23ffffff'/%3E%3Ccircle cx='25' cy='35' r='12' fill='%23ffffff'/%3E%3Ccircle cx='75' cy='35' r='12' fill='%23ffffff'/%3E%3Ccircle cx='15' cy='55' r='10' fill='%23ffffff'/%3E%3Ccircle cx='85' cy='55' r='10' fill='%23ffffff'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  opacity: 0.1;
}

// 顶部标题栏
.page-header {
  position: relative;
  z-index: 10;
  padding: 20px 30px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sound-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  font-size: 36px;
  animation: bounce 2s infinite;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 200, 100, 0.5);
}

.svip-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 8px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-3px);
  }
}

// 错误提示
.error-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: #fff;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 16px;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
  opacity: 0;
  transition: all 0.3s;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 10px;

  &.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.error-icon {
  font-size: 20px;
}

// 动画
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
