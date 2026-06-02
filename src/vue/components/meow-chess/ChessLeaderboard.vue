<template>
  <div class="chess-leaderboard">
    <!-- 标题栏 -->
    <div class="leaderboard-header">
      <h2 class="leaderboard-title">
        <span class="title-icon">🏆</span>
        排行榜
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
      <button class="retry-btn" @click="loadLeaderboard">重试</button>
    </div>

    <!-- 排行榜列表 -->
    <div v-else class="leaderboard-content">
      <!-- 前三名 -->
            <div v-if="topThree.length > 0" class="top-three">
              <div
                v-for="(player, index) in topThree"
                :key="player.userId"
                class="top-player"
                :class="`rank-${index + 1}`"
              >
                <div class="rank-badge">{{ index + 1 }}</div>
                <div class="player-avatar">
                  <img :src="player.avatar" :alt="player.username" class="avatar-img" />
                  <span class="rank-emoji">{{ getAvatarEmoji(index) }}</span>
                </div>
                <div class="player-info">
                  <div class="player-name">{{ player.username }}</div>
                  <div class="player-stats">
                    <span class="stat-item">
                      <span class="stat-label">胜率</span>
                      <span class="stat-value">{{ getWinRate(player) }}%</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">胜场</span>
                      <span class="stat-value">{{ player.stats.wins }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

      <!-- 完整排行榜 -->
      <div class="full-list">
        <h3 class="section-title">完整排行</h3>
        <div v-if="leaderboard.length === 0" class="empty-state">
          <span class="empty-icon">🎮</span>
          <p>还没有玩家记录，成为第一个上榜的人吧！</p>
        </div>
        <div v-else class="player-list">
          <div
                v-for="(player, index) in leaderboard"
                :key="player.userId"
                class="player-item"
                :class="{ 'is-you': player.userId === userId }"
              >
                <div class="player-rank">{{ index + 1 }}</div>
                <img :src="player.avatar" :alt="player.username" class="player-avatar-img" />
                <div class="player-details">
                  <div class="player-name-row">
                    <span class="player-name">{{ player.username }}</span>
                    <span v-if="player.userId === userId" class="you-badge">我</span>
                  </div>
                  <div class="player-stats-row">
                    <span class="stat">总场次: {{ player.stats.totalGames }}</span>
                    <span class="stat-divider">|</span>
                    <span class="stat wins">胜: {{ player.stats.wins }}</span>
                    <span class="stat-divider">|</span>
                    <span class="stat winrate">胜率: {{ getWinRate(player) }}%</span>
                  </div>
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
  name: 'ChessLeaderboard',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      leaderboard: [],
      loading: true,
      error: null,
    };
  },
  computed: {
    topThree() {
      return this.leaderboard.slice(0, 3);
    },
  },
  created() {
    this.loadLeaderboard();
  },
  methods: {
    async loadLeaderboard() {
      this.loading = true;
      this.error = null;

      try {
        console.log('[ChessLeaderboard] 开始加载排行榜...');
        const response = await axios.get('/api/chess/leaderboard?limit=50');
        console.log('[ChessLeaderboard] 排行榜数据:', response.data);
        this.leaderboard = response.data.data || [];
        
        if (this.leaderboard.length === 0) {
          console.log('[ChessLeaderboard] 排行榜为空，可能还没有玩家记录');
        }
      } catch (err) {
        console.error('[ChessLeaderboard] 加载排行榜失败:', err);
        console.error('[ChessLeaderboard] 错误详情:', err.response?.data);
        
        this.error = err.response?.data?.message || '加载排行榜失败，请稍后重试';
        
        // 如果是500错误，显示更友好的提示
        if (err.response?.status === 500) {
          this.error = '服务器繁忙，请稍后重试或联系管理员';
        }
      } finally {
        this.loading = false;
      }
    },

    getWinRate(player) {
              if (!player.stats || player.stats.totalGames === 0) {
                return 0;
              }
              return ((player.stats.wins / player.stats.totalGames) * 100).toFixed(1);
            },

            getAvatarEmoji(rank) {
              const emojis = ['👑', '🥈', '🥉'];
              return emojis[rank] || '🎖️';
            },
  },
};
</script>

<style scoped lang="scss">
.chess-leaderboard {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// 标题栏
.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.leaderboard-title {
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

// 前三名
.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 32px;
  padding: 20px 0;
}

.top-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
  }

  &.rank-1 {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 170, 0, 0.1));
    border: 2px solid rgba(255, 215, 0, 0.3);
    order: 2;
    transform: scale(1.1);

    &:hover {
      transform: scale(1.1) translateY(-5px);
    }
  }

  &.rank-2 {
    background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(169, 169, 169, 0.1));
    border: 2px solid rgba(192, 192, 192, 0.3);
    order: 1;
  }

  &.rank-3 {
    background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(184, 115, 51, 0.1));
    border: 2px solid rgba(205, 127, 50, 0.3);
    order: 3;
  }
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.rank-1 .rank-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;
}

.rank-2 .rank-badge {
  background: linear-gradient(135deg, #c0c0c0, #a9a9a9);
  color: #1a1a2e;
}

.rank-3 .rank-badge {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.player-avatar {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 12px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.rank-emoji {
  position: absolute;
  bottom: -5px;
  right: -5px;
  font-size: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-1 .player-avatar {
  width: 80px;
  height: 80px;
}

.avatar-emoji {
  font-size: 32px;
}

.rank-1 .avatar-emoji {
  font-size: 40px;
}

.player-info {
  text-align: center;
}

.player-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 8px;
}

.player-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

// 完整排行榜
.full-list {
  .section-title {
    font-size: 18px;
    color: #fff;
    margin-bottom: 16px;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);

  .empty-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
  }
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }

  &.is-you {
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
  }
}

.player-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  flex-shrink: 0;
}

.player-avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.player-details {
  flex: 1;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.player-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.you-badge {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a2e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
}

.player-stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.stat {
  color: rgba(255, 255, 255, 0.6);

  &.wins {
    color: #4caf50;
  }

  &.winrate {
    color: #ffd700;
  }
}

.stat-divider {
  color: rgba(255, 255, 255, 0.2);
}

// 动画
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
