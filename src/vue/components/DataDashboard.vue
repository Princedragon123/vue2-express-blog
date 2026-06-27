<template>
  <article class="dashboard-page">
    <main class="dashboard-page__main">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载数据中...</p>
      </div>

      <template v-else-if="data">
        <!-- 概览卡片 -->
        <section class="dashboard-page__section">
          <h2 class="section-title">📊 数据概览</h2>
          <div class="overview-grid">
            <div class="stat-card" v-for="card in overviewCards" :key="card.label">
              <span class="stat-card__icon">{{ card.icon }}</span>
              <div class="stat-card__value">{{ card.value }}</div>
              <div class="stat-card__label">{{ card.label }}</div>
            </div>
          </div>
        </section>

        <!-- 最近30天 -->
        <section class="dashboard-page__section">
          <h2 class="section-title">📈 最近30天</h2>
          <div class="trend-grid">
            <div class="trend-card">
              <span class="trend-card__icon">📝</span>
              <div class="trend-card__value">+{{ data.last30Days.newBlogs }}</div>
              <div class="trend-card__label">新发布</div>
            </div>
            <div class="trend-card">
              <span class="trend-card__icon">👁️</span>
              <div class="trend-card__value">+{{ data.last30Days.newViews }}</div>
              <div class="trend-card__label">新增浏览</div>
            </div>
            <div class="trend-card">
              <span class="trend-card__icon">❤️</span>
              <div class="trend-card__value">+{{ data.last30Days.newLikes }}</div>
              <div class="trend-card__label">新增点赞</div>
            </div>
            <div class="trend-card">
              <span class="trend-card__icon">👥</span>
              <div class="trend-card__value">
                +{{ data.last30Days.newFollowers }}
                <small class="trend-card__rate">{{ data.last30Days.followerGrowthRate > 0 ? '↑' : '' }}{{ data.last30Days.followerGrowthRate }}%</small>
              </div>
              <div class="trend-card__label">新增粉丝</div>
            </div>
          </div>
        </section>

        <!-- 创作趋势 -->
        <section class="dashboard-page__section" v-if="data.creationTrend.length > 0">
          <h2 class="section-title">📅 创作趋势（近6月）</h2>
          <div class="chart-container">
            <div class="bar-chart">
              <div
                v-for="month in data.creationTrend"
                :key="month._id"
                class="bar-chart__item"
              >
                <div class="bar-chart__bar-wrap">
                  <div
                    class="bar-chart__bar"
                    :style="{ height: getBarHeight(month.count) }"
                  ></div>
                </div>
                <div class="bar-chart__label">{{ formatMonth(month._id) }}</div>
                <div class="bar-chart__count">{{ month.count }}篇</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 阅读数据 -->
        <section class="dashboard-page__section">
          <h2 class="section-title">📖 阅读足迹</h2>
          <div class="reading-grid">
            <div class="reading-card">
              <span class="reading-card__icon">📄</span>
              <div class="reading-card__value">{{ data.reading.totalReadArticles }}</div>
              <div class="reading-card__label">阅读文章总数</div>
            </div>
            <div class="reading-card">
              <span class="reading-card__icon">💬</span>
              <div class="reading-card__value">{{ data.reading.uniqueTopicsRead }}</div>
              <div class="reading-card__label">涉猎话题数</div>
            </div>
          </div>
        </section>

        <!-- 互动率 -->
        <section class="dashboard-page__section">
          <h2 class="section-title">🎯 互动分析</h2>
          <div class="interaction-card">
            <div class="interaction-card__rate">{{ data.overview.interactionRate }}</div>
            <div class="interaction-card__label">平均每篇互动数<br>（点赞+收藏+评论）/ 总文章数</div>
          </div>
        </section>
      </template>

      <!-- 错误状态 -->
      <div v-else class="error-state">
        <p>加载数据失败</p>
        <button class="btn btn--primary" @click="fetchData">重新加载</button>
      </div>
    </main>
  </article>
</template>

<script>
export default {
  name: 'DataDashboard',

  data() {
    return {
      isLoading: true,
      data: null,
      error: null
    };
  },

  computed: {
    overviewCards() {
      if (!this.data) return [];
      const ov = this.data.overview;
      return [
        { icon: '📝', value: ov.publishedBlogs, label: '已发布文章' },
        { icon: '👁️', value: ov.totalViews, label: '总浏览量' },
        { icon: '❤️', value: ov.totalLikesReceived, label: '总获赞' },
        { icon: '⭐', value: ov.totalBookmarksReceived, label: '总收藏' },
        { icon: '💬', value: ov.totalCommentsReceived, label: '总评论' },
        { icon: '👥', value: ov.totalFollowers, label: '粉丝数' }
      ];
    }
  },

  mounted() {
    if (!this.$store.getters.isLoggedIn) {
      this.$router.replace('/login');
      return;
    }
    this.fetchData();
  },

  methods: {
    async fetchData() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await this.$http.stats.getDashboard();
        if (response.success) {
          this.data = response.data;
        } else {
          this.error = response.message;
        }
      } catch (error) {
        console.error('获取数据看板失败:', error);
        this.error = '获取数据失败';
      } finally {
        this.isLoading = false;
      }
    },

    getBarHeight(count) {
      if (!this.data?.creationTrend?.length) return '0%';
      const max = Math.max(...this.data.creationTrend.map(m => m.count), 1);
      return `${Math.round((count / max) * 100)}%`;
    },

    formatMonth(monthStr) {
      if (!monthStr) return '';
      const parts = monthStr.split('-');
      return `${parts[1]}月`;
    }
  }
};
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.dashboard-page__main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 16px;
}

.dashboard-page__section {
  margin-bottom: 28px;
}

/* 概览卡片网格 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: transform 0.2s ease;
}
.stat-card:hover { transform: translateY(-2px); }

.stat-card__icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
.stat-card__value { font-size: 1.6rem; font-weight: 700; color: #1f2937; }
.stat-card__label { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }

/* 趋势卡片 */
.trend-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.trend-card {
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-left: 3px solid #ec4899;
}
.trend-card__icon { font-size: 1.3rem; display: block; margin-bottom: 6px; }
.trend-card__value { font-size: 1.3rem; font-weight: 700; color: #ec4899; }
.trend-card__rate { font-size: 0.7rem; color: #10b981; }
.trend-card__label { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

/* 柱状图 */
.chart-container { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.bar-chart { display: flex; align-items: flex-end; gap: 12px; height: 180px; }
.bar-chart__item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.bar-chart__bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.bar-chart__bar {
  width: 60%; max-width: 48px;
  background: linear-gradient(180deg, #ec4899, #f9a8d4);
  border-radius: 6px 6px 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
}
.bar-chart__label { font-size: 0.75rem; color: #9ca3af; margin-top: 6px; }
.bar-chart__count { font-size: 0.7rem; color: #374151; font-weight: 500; }

/* 阅读卡片 */
.reading-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.reading-card {
  background: #fff; border-radius: 14px; padding: 20px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.reading-card__icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
.reading-card__value { font-size: 1.5rem; font-weight: 700; color: #1f2937; }
.reading-card__label { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }

/* 互动率 */
.interaction-card {
  background: linear-gradient(135deg, #ec4899, #db2777);
  border-radius: 16px; padding: 28px; text-align: center; color: #fff;
  box-shadow: 0 4px 20px rgba(236,72,153,0.3);
}
.interaction-card__rate { font-size: 2.5rem; font-weight: 700; }
.interaction-card__label { font-size: 0.85rem; opacity: 0.85; margin-top: 6px; }

/* 状态 */
.loading-state, .error-state {
  text-align: center; padding: 80px 20px; color: #9ca3af;
}
.spinner {
  width: 40px; height: 40px; border: 3px solid #f3f3f3;
  border-top-color: #ec4899; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .trend-grid { grid-template-columns: repeat(2, 1fr); }
  .reading-grid { grid-template-columns: 1fr; }
  .dashboard-page__main { padding: 16px 12px 80px; }
}
</style>
