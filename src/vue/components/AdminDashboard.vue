<template>
  <div class="dash">
    <div v-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载统计数据...</p></div>
    <template v-else>
      <div class="dash__cards">
        <div class="dash__card"><div class="dash__card-icon" style="background:#e11d48">§</div><div class="dash__card-num">{{ stats.totalUsers }}</div><div class="dash__card-label">总用户数</div></div>
        <div class="dash__card"><div class="dash__card-icon" style="background:#059669">¶</div><div class="dash__card-num">{{ stats.totalBlogs }}</div><div class="dash__card-label">总博客数</div></div>
        <div class="dash__card"><div class="dash__card-icon" style="background:#d97706">◎</div><div class="dash__card-num">{{ stats.totalComments || 0 }}</div><div class="dash__card-label">总评论数</div></div>
      </div>
      <h3 class="dash__section-title">快捷操作</h3>
      <div class="dash__quick">
        <router-link to="/admin/users" class="dash__quick-card">◎ 用户管理</router-link>
        <router-link to="/admin/blogs" class="dash__quick-card">¶ 博客管理</router-link>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() { return { stats: { totalUsers: 0, totalBlogs: 0, totalComments: 0 }, isLoading: false }; },
  created() { this.fetchStats(); },
  methods: { async fetchStats() { this.isLoading = true; try { const r = await this.$http.admin.getDashboardStats(); if (r?.success) this.stats = typeof r.data === 'object' ? { ...this.stats, ...r.data } : this.stats; } catch {} finally { this.isLoading = false; } } }
};
</script>

<style scoped>
.dash { }
.dash__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
.dash__card { background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.dash__card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; margin-bottom: 14px; }
.dash__card-num { font-size: 1.8rem; font-weight: 700; color: #1a1a1a; }
.dash__card-label { font-size: 0.8rem; color: #9ca3af; margin-top: 4px; }
.dash__section-title { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.dash__quick { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.dash__quick-card { display: flex; align-items: center; padding: 16px 20px; background: #fff; border-radius: 12px; border: 1.5px solid #e5e7eb; text-decoration: none; color: #3d3d3d; font-weight: 500; transition: all 0.2s; }
.dash__quick-card:hover { border-color: #e11d48; color: #e11d48; }
@media (max-width: 768px) { .dash__cards { grid-template-columns: 1fr; } .dash__quick { grid-template-columns: 1fr; } }
</style>
