<template>
  <div class="chess-stats">
    <!-- 标题栏 -->
    <div class="stats-header">
      <h2 class="stats-title">
        <span class="title-icon">📊</span>
        我的战绩
      </h2>
      <button class="close-btn" @click="$emit('close')">
        <span>×</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadStats">重试</button>
    </div>

    <!-- 战绩内容 -->
    <div v-else class="stats-content">
      <!-- 总览卡片 -->
      <div class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ stats.stats?.totalGames || 0 }}</div>
          <div class="stat-label">总场次</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value wins">{{ stats.stats?.wins || 0 }}</div>
          <div class="stat-label">胜利</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value losses">{{ stats.stats?.losses || 0 }}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value draws">{{ stats.stats?.draws || 0 }}</div>
          <div class="stat-label">平局</div>
        </div>
      </div>

      <!-- 胜率进度条 -->
      <div class="winrate-section">
        <div class="winrate-header">
          <span class="winrate-label">胜率</span>
          <span class="winrate-value">{{ winRate }}%</span>
        </div>
        <div class="winrate-bar">
          <div class="winrate-fill" :style="{ width: winRate + '%' }"></div>
        </div>
      </div>

      <!-- 连胜记录 -->
      <div class="streak-section">
        <div class="streak-item">
          <span class="streak-icon">🔥</span>
          <div class="streak-info">
            <div class="streak-label">当前连胜</div>
            <div class="streak-value">{{ stats.stats?.winStreak || 0 }} 场</div>
          </div>
        </div>
        <div class="streak-item">
          <span class="streak-icon">🏆</span>
          <div class="streak-info">
            <div class="streak-label">最高连胜</div>
            <div class="streak-value">{{ stats.stats?.maxWinStreak || 0 }} 场</div>
          </div>
        </div>
      </div>

      <!-- 最近游戏记录 -->
      <div class="recent-games">
        <h3 class="section-title">最近游戏</h3>
        <div v-if="!stats.recentGames || stats.recentGames.length === 0" class="no-games">
          <span class="empty-icon">🎮</span>
          <p>还没有游戏记录，快去开始你的第一局吧！</p>
        </div>
        <div v-else class="games-list">
          <div
            v-for="(game, index) in stats.recentGames"
            :key="index"
            class="game-item"
            :class="game.result"
          >
            <div class="game-result">
              <span class="result-badge" :class="game.result">
                {{ getResultText(game.result) }}
              </span>
            </div>
            <div class="game-details">
              <div class="game-info">
                <span class="game-piece">使用 {{ game.playedAs }}</span>
                <span class="game-moves">{{ game.moves }} 步</span>
              </div>
              <div class="game-time">{{ formatTime(game.playedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ChessStats',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      stats: null,
      loading: true,
      error: null,
    };
  },
  computed: {
    winRate() {
      if (!this.stats || !this.stats.stats || this.stats.stats.totalGames === 0) {
        return 0;
      }
      return ((this.stats.stats.wins / this.stats.stats.totalGames) * 100).toFixed(1);
    },
  },
  created() {
    this.loadStats();
  },
  methods: {
    async loadStats() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/chess/stats/${this.userId}`);
        this.stats = response.data.data;
      } catch (err) {
        console.error('加载战绩失败:', err);
        this.error = err.response?.data?.message || '加载战绩失败';
      } finally {
        this.loading = false;
      }
    },

    getResultText(result) {
      const map = {
        win: '胜利',
        lose: '失败',
        draw: '平局',
      };
      return map[result] || result;
    },

    formatTime(date) {
      if (!date) return '';
      const d = new Date(date);
      const now = new Date();
      const diff = now - d;

      // 小于1分钟
      if (diff < 60000) {
        return '刚刚';
      }
      // 小于1小时
      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} 分钟前`;
      }
      // 小于24小时
      if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} 小时前`;
      }
      // 小于7天
      if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)} 天前`;
      }

      // 超过7天显示具体日期
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    },
  },
};
</script>

<style scoped lang="scss">
.chess-stats {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// 标题栏
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-title {
  font-size: 24px;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

// 加载和错误状态
.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.retry-btn {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;
  border: none;
  padding: 10px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  margin-top: 16px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
  }
}

// 总览卡片
.overview-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;

  &.wins {
    color: #4caf50;
  }

  &.losses {
    color: #f44336;
  }

  &.draws {
    color: #ff9800;
  }
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

// 胜率进度条
.winrate-section {
  margin-bottom: 24px;
}

.winrate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.winrate-label {
  font-size: 16px;
  color: #fff;
}

.winrate-value {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.winrate-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.winrate-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffaa00);
  border-radius: 6px;
  transition: width 0.5s ease;
}

// 连胜记录
.streak-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.streak-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 12px;
}

.streak-icon {
  font-size: 32px;
}

.streak-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.streak-value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

// 最近游戏记录
.recent-games {
  .section-title {
    font-size: 18px;
    color: #fff;
    margin-bottom: 16px;
  }
}

.no-games {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);

  .empty-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
  }
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.05);
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }

  &.win {
    border-left: 3px solid #4caf50;
  }

  &.lose {
    border-left: 3px solid #f44336;
  }

  &.draw {
    border-left: 3px solid #ff9800;
  }
}

.result-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;

  &.win {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
  }

  &.lose {
    background: rgba(244, 67, 54, 0.2);
    color: #f44336;
  }

  &.draw {
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
  }
}

.game-details {
  flex: 1;
}

.game-info {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

.game-piece,
.game-moves {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.game-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
