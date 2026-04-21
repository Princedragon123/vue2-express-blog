<!-- AdminDashboard.vue - 管理员仪表盘组件 -->
<template>
  <div class="admin-dashboard">
    <!-- 主内容区 -->
    <main class="admin-content">
      <!-- 页面标题 -->
      <div class="admin-header">
        <div class="container">
          <h1 class="admin-title">管理员仪表盘</h1>
          <p class="admin-subtitle">管理博客系统的所有内容</p>
        </div>
      </div>
      
      <!-- 统计概览 -->
      <div class="container">
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon users-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon blogs-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.totalBlogs }}</div>
              <div class="stat-label">总博客数</div>
            </div>
          </div>
        </div>
        
        <!-- 管理导航 -->
        <div class="admin-nav">
          <div class="nav-card" @click="goToUsers">
            <div class="nav-icon">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="nav-content">
              <h3>用户管理</h3>
              <p>管理所有注册用户</p>
            </div>
            <div class="nav-arrow">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
          <div class="nav-card" @click="goToBlogs">
            <div class="nav-icon">
              <i class="fas fa-book-open"></i>
            </div>
            <div class="nav-content">
              <h3>博客管理</h3>
              <p>管理所有博客文章</p>
            </div>
            <div class="nav-arrow">
              <i class="fas fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
export default {
  name: 'AdminDashboard',
  components: {
    MobileBottomNav
  },
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
    // 跳转到用户管理页面
    goToUsers() {
      this.$router.push('/admin/users');
    },
    // 跳转到博客管理页面
    goToBlogs() {
      this.$router.push('/admin/blogs');
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  font-family: var(--font-family);
}

.admin-content {
  padding-top: 80px;
  padding-bottom: 70px;
}

.admin-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.admin-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 5px 0;
}

.admin-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.users-icon {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
}

.blogs-icon {
  background: linear-gradient(135deg, var(--accent-green) 0%, #4caf50 100%);
  color: white;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.admin-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.nav-card {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.nav-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.nav-icon {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  margin-right: 15px;
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
}

.nav-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 5px 0;
}

.nav-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.nav-arrow {
  margin-left: auto;
  font-size: 18px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .admin-nav {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 20px;
  }
  
  .nav-card {
    padding: 20px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .nav-icon {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
}
</style>
