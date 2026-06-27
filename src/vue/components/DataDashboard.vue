<template>
  <div class="dd">
    <div class="dd__container">
      <div v-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载数据...</p></div>
      <template v-else-if="data">
        <section class="dd__section">
          <h2 class="dd__section-title">数据概览</h2>
          <div class="dd__grid">
            <div class="dd__stat" v-for="c in overviewCards" :key="c.label"><span class="dd__stat-icon">{{ c.icon }}</span><span class="dd__stat-val">{{ c.value }}</span><span class="dd__stat-label">{{ c.label }}</span></div>
          </div>
        </section>
        <section class="dd__section">
          <h2 class="dd__section-title">最近30天</h2>
          <div class="dd__trend-grid">
            <div class="dd__trend"><span>+{{ data.last30Days.newBlogs }}</span><small>新发布</small></div>
            <div class="dd__trend"><span>+{{ data.last30Days.newViews }}</span><small>浏览</small></div>
            <div class="dd__trend"><span>+{{ data.last30Days.newLikes }}</span><small>点赞</small></div>
            <div class="dd__trend"><span>+{{ data.last30Days.newFollowers }} <em>({{ data.last30Days.followerGrowthRate }}%)</em></span><small>粉丝</small></div>
          </div>
        </section>
        <section class="dd__section" v-if="data.creationTrend.length">
          <h2 class="dd__section-title">创作趋势</h2>
          <div class="dd__chart">
            <div class="dd__bar-wrap"><div v-for="m in data.creationTrend" :key="m._id" class="dd__bar-col"><div class="dd__bar" :style="{ height: barH(m.count) }"></div><span class="dd__bar-label">{{ formatMonth(m._id) }}</span></div></div>
          </div>
        </section>
        <section class="dd__section">
          <h2 class="dd__section-title">阅读足迹</h2>
          <div class="dd__reading"><span>{{ data.reading.totalReadArticles }} 篇</span><span>{{ data.reading.uniqueTopicsRead }} 个话题</span></div>
        </section>
        <section class="dd__section">
          <div class="dd__interaction"><span class="dd__interaction-num">{{ data.overview.interactionRate }}</span><span class="dd__interaction-label">平均每篇互动次数</span></div>
        </section>
      </template>
      <div v-else class="dd__error"><p>加载失败</p><button class="btn btn-primary" @click="fetchData">重试</button></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataDashboard',
  data() { return { isLoading: true, data: null, error: null }; },
  computed: { overviewCards() { if (!this.data) return []; const o = this.data.overview; return [{ icon: '§', value: o.publishedBlogs, label: '已发布' },{ icon: '◎', value: o.totalViews, label: '浏览量' },{ icon: '♥', value: o.totalLikesReceived, label: '获赞' },{ icon: '◆', value: o.totalBookmarksReceived, label: '收藏' },{ icon: '●', value: o.totalCommentsReceived, label: '评论' },{ icon: '◎', value: o.totalFollowers, label: '粉丝' }]; } },
  mounted() { if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; } this.fetchData(); },
  methods: {
    async fetchData() { this.isLoading = true; try { const r = await this.$http.stats.getDashboard(); if (r.success) this.data = r.data; } catch {} finally { this.isLoading = false; } },
    barH(c) { if (!this.data?.creationTrend?.length) return '0%'; const max = Math.max(...this.data.creationTrend.map(m => m.count), 1); return `${Math.round(c / max * 100)}%`; },
    formatMonth(s) { if (!s) return ''; return s.split('-')[1] + '月'; }
  }
};
</script>

<style scoped>
.dd { min-height: 100vh; background: #faf8f5; }
.dd__container { max-width: 900px; margin: 0 auto; padding: 24px 20px 80px; }
.dd__section { margin-bottom: 28px; }
.dd__section-title { font-size: 1.05rem; font-weight: 600; color: #1a1a1a; margin: 0 0 14px; }
.dd__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.dd__stat { background: #fff; border-radius: 14px; padding: 20px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
.dd__stat-icon { font-size: 1.2rem; display: block; margin-bottom: 6px; }
.dd__stat-val { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; }
.dd__stat-label { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
.dd__trend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.dd__trend { background: #fff; border-radius: 12px; padding: 16px; text-align: center; border-left: 2px solid #e11d48; }
.dd__trend span { font-size: 1.1rem; font-weight: 700; color: #e11d48; display: block; }
.dd__trend small { font-size: 0.7rem; color: #9ca3af; }
.dd__trend em { font-style: normal; font-size: 0.65rem; color: #059669; }
.dd__chart { background: #fff; border-radius: 14px; padding: 24px; }
.dd__bar-wrap { display: flex; align-items: flex-end; gap: 10px; height: 150px; }
.dd__bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.dd__bar { width: 100%; max-width: 40px; background: #e11d48; border-radius: 4px 4px 0 0; min-height: 3px; }
.dd__bar-label { font-size: 0.7rem; color: #9ca3af; margin-top: 6px; }
.dd__reading { display: flex; gap: 20px; background: #fff; border-radius: 14px; padding: 24px; font-size: 1.1rem; color: #3d3d3d; }
.dd__interaction { background: #e11d48; border-radius: 14px; padding: 28px; text-align: center; color: #fff; }
.dd__interaction-num { font-size: 2rem; font-weight: 700; display: block; }
.dd__interaction-label { font-size: 0.8rem; opacity: 0.8; margin-top: 6px; }
.dd__error { text-align: center; padding: 80px 20px; }
@media (max-width: 768px) { .dd__grid { grid-template-columns: repeat(2, 1fr); } .dd__trend-grid { grid-template-columns: repeat(2, 1fr); } .dd__container { padding: 16px 12px 80px; } }
</style>
