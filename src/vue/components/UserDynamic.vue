<!-- UserDynamic.vue - 用户动态页面组件 -->
<template>
  <div class="dynamic-page" :class="currentStyle">
    <button class="back-btn" @click="goBack">
      <svg-icon name="arrowLeft" :size="18"></svg-icon> 返回首页
    </button>
    
    <main class="main-content">
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">用户动态</h1>
          <p class="page-subtitle">查看你的活动记录</p>
        </div>
      </div>
      
      <div class="container">
        <DynamicFilterTabs
          :active-tab="activeFilter"
          @change="activeFilter = $event"
        />
        
        <div class="dynamic-list">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          
          <div v-else-if="error" class="error-state">
            <svg-icon name="exclamationCircle" :size="32"></svg-icon>
            <p>{{ error }}</p>
            <button class="btn-primary" @click="fetchDynamics">重新加载</button>
          </div>
          
          <div v-else-if="filteredDynamics.length > 0">
            <DynamicItem
              v-for="dynamic in filteredDynamics"
              :key="dynamic._id || dynamic.id"
              :dynamic="dynamic"
              :formatted-time="formatDate(dynamic.createdAt)"
            />
          </div>
          
          <DynamicEmptyState
            v-else
            @go-explore="$router.push('/blog')"
          />
        </div>
      </div>
    </main>
    
    <MobileBottomNav />
  </div>
</template>

<script>
import TopNavbar from './TopNavbar.vue';
import MobileBottomNav from './MobileBottomNav.vue';
import DynamicFilterTabs from './dynamic/DynamicFilterTabs.vue';
import DynamicItem from './dynamic/DynamicItem.vue';
import DynamicEmptyState from './dynamic/DynamicEmptyState.vue';

export default {
  name: 'UserDynamic',
  
  components: {
    TopNavbar,
    MobileBottomNav,
    DynamicFilterTabs,
    DynamicItem,
    DynamicEmptyState
  },
  
  created() {
    window.addEventListener('styleChanged', this.handleStyleChange);
  },
  
  beforeDestroy() {
    window.removeEventListener('styleChanged', this.handleStyleChange);
  },
  
  mounted() {
    this.fetchDynamics();
  },
  
  data() {
    return {
      currentStyle: localStorage.getItem('currentStyle') || 'style-spring-garden',
      dynamics: [],
      isLoading: false,
      error: null,
      activeFilter: 'all',
      filterTabs: [
        { value: 'all', label: '全部', icon: 'list' },
        { value: 'publish', label: '发布', icon: 'penFancy' },
        { value: 'like', label: '点赞', icon: 'heart' },
        { value: 'comment', label: '评论', icon: 'comment' },
        { value: 'follow', label: '关注', icon: 'userPlus' }
      ]
    };
  },
  
  computed: {
    filteredDynamics() {
      if (this.activeFilter === 'all') {
        return this.dynamics;
      }
      return this.dynamics.filter(dynamic => dynamic.type === this.activeFilter);
    }
  },
  
  methods: {
    handleStyleChange(event) {
      this.currentStyle = event.detail.style;
    },
    
    goBack() {
      this.$router.push('/blog');
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    async fetchDynamics() {
      try {
        this.isLoading = true;
        this.error = null;
        
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) {
          throw new Error('用户未登录');
        }
        
        const user = JSON.parse(userStr);
        const currentUserId = user._id || user.id;
        
        if (!currentUserId) {
          throw new Error('无法获取用户 ID');
        }
        
        const response = await this.$http.get(`/users/${currentUserId}/dynamics`);
        
        if (response.success) {
          this.dynamics = response.data;
        } else {
          throw new Error(response.message || '获取动态数据失败');
        }
      } catch (error) {
        console.error('获取动态数据失败:', error);
        this.error = '获取动态数据失败，请稍后重试';
        this.dynamics = this.getMockDynamics();
      } finally {
        this.isLoading = false;
      }
    },
    
    getMockDynamics() {
      return [
        {
          id: 1,
          type: 'publish',
          text: '发布了新攻略',
          link: '/blog/1',
          linkText: '查看详情',
          user: {
            id: '659b4c44c6d2a34567890123',
            name: '游戏达人',
            avatar: 'https://via.placeholder.com/100'
          },
          content: {
            title: '2024最新游戏攻略：如何快速提升等级',
            category: '游戏攻略',
            image: 'https://via.placeholder.com/600x400?text=游戏攻略',
            views: 156,
            likes: 23,
            comments: 5
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
          id: 2,
          type: 'like',
          text: '点赞了文章',
          link: '/blog/2',
          linkText: '查看文章',
          user: {
            id: '659b4c44c6d2a34567890123',
            name: '游戏达人',
            avatar: 'https://via.placeholder.com/100'
          },
          content: {
            title: '日本东京5天4夜自由行完全攻略',
            excerpt: '这是一篇关于日本东京旅游的详细攻略，包含交通、住宿、美食等信息。'
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        },
        {
          id: 3,
          type: 'follow',
          text: '关注了用户',
          link: '/profile/2',
          linkText: '查看用户',
          user: {
            id: '659b4c44c6d2a34567890123',
            name: '游戏达人',
            avatar: 'https://via.placeholder.com/100'
          },
          content: {
            id: 2,
            name: '旅行爱好者',
            avatar: 'https://via.placeholder.com/100',
            bio: '喜欢探索世界各地的美景和美食，分享旅行攻略和心得。'
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
        },
        {
          id: 4,
          type: 'comment',
          text: '评论了文章',
          link: '/blog/3#comments',
          linkText: '查看评论',
          user: {
            id: '659b4c44c6d2a34567890123',
            name: '游戏达人',
            avatar: 'https://via.placeholder.com/100'
          },
          content: {
            title: '上海必吃的10家隐藏美食店',
            excerpt: '这是一篇关于上海美食的攻略，推荐了10家值得一去的隐藏美食店。'
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        }
      ];
    }
  }
}
</script>

<style scoped>
.dynamic-page {
  min-height: 100vh;
  background-color: #fafafa;
  padding-bottom: 70px;
}

.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background-color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.page-header {
  background-color: white;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #8e8e8e;
}

.dynamic-list {
  max-width: 800px;
  margin: 0 auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #999;
  font-size: 14px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.error-state i {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 16px;
}

.error-state p {
  color: #666;
  font-size: 14px;
  margin: 0 0 20px;
}

.btn-primary {
  padding: 12px 30px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff527d 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

@media (max-width: 768px) {
  .back-btn {
    top: 10px;
    left: 10px;
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
