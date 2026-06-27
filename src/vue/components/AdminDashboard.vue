<!-- AdminDashboard.vue - 管理员仪表盘（嵌套路由子组件，渲染在AdminLayout的router-view中） -->
<template>
  <div class="admin-dashboard">
    <!-- 统计概览 -->
    <!-- 加载状态 -->
    <div v-if="isLoading" class="admin-dashboard__loading">
      <div class="spinner"></div>
      <p>加载统计数据...</p>
    </div>

    <!-- 统计概览 -->
    <div v-else class="stats-overview">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--users">
          <svg-icon name="users" :size="32"></svg-icon>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ stats.totalUsers }}</div>
          <div class="stat-card__label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blogs">
          <svg-icon name="book" :size="32"></svg-icon>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ stats.totalBlogs }}</div>
          <div class="stat-card__label">总博客数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--comments">
          <span>💬</span>
        </div>
        <div class="stat-card__content">
          <div class="stat-card__number">{{ stats.totalComments || 0 }}</div>
          <div class="stat-card__label">总评论数</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="admin-dashboard__quick-actions">
      <h3 class="quick-actions__title">快捷操作</h3>
      <div class="quick-actions__grid">
        <router-link to="/admin/users" class="quick-action-card">
          <span class="quick-action-card__icon">👥</span>
          <span class="quick-action-card__text">用户管理</span>
        </router-link>
        <router-link to="/admin/blogs" class="quick-action-card">
          <span class="quick-action-card__icon">📝</span>
          <span class="quick-action-card__text">博客管理</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'AdminDashboard',
  data() {
    return {
      stats: {
        totalUsers: 0,
        totalBlogs: 0
      },
      isLoading: false
    };
  },
  created() {
    // 获取管理员统计数据
    this.fetchAdminStats();
  },
  methods: {
    // 获取管理员统计数据
    async fetchAdminStats() {
      try {
        this.isLoading = true;
        // 使用封装好的 API 方法
        const response = await this.$http.admin.getDashboardStats();
        
        if (response && response.success) {
          // 确保 stats 是对象
          this.stats = typeof response.data === 'object' && response.data !== null ? response.data : {};
        } else {
          throw new Error('获取统计数据失败');
        }
      } catch (error) {
        console.error('获取管理员统计数据失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        // 重置统计数据为空对象
        this.stats = {
          totalUsers: 0,
          totalBlogs: 0
        };
      } finally {
        this.isLoading = false;
      }
    },
    // 跳转逻辑已移至 AdminLayout 侧边栏导航
  }
};
</script>

<style scoped>
.admin-dashboard__loading {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f3f3f3;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: #fff;
  border: 2px solid #fbcfe8;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(251, 207, 232, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  cursor: default;
  /* 触摸反馈 */
  -webkit-tap-highlight-color: transparent;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.15);
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-card__icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card__icon--users {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
}

.stat-card__icon--blogs {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

.stat-card__icon--comments {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
}

.stat-card__number {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.1;
}

.stat-card__label {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 快捷操作 */
.admin-dashboard__quick-actions {
  margin-top: 8px;
}

.quick-actions__title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 14px;
}

.quick-actions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border: 2px solid #fbcfe8;
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.25s ease;
  min-height: 52px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.quick-action-card:hover {
  border-color: #ec4899;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.1);
}

.quick-action-card:active {
  transform: scale(0.97);
}

.quick-action-card__icon {
  font-size: 1.4rem;
}

.quick-action-card__text {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 18px;
  }

  .stat-card__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .stat-card__number {
    font-size: 24px;
  }

  .quick-actions__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
