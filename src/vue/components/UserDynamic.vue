<!-- ============================================================
     UserDynamic.vue - 用户动态页面组件（学习版）
     ============================================================
     
     【文件职责】
     展示用户的活动记录，包括：
     1. 发布的文章
     2. 点赞的文章
     3. 评论的文章
     4. 关注的用户
     5. 动态筛选功能
     
     【学习重点】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │  1. 数据筛选：使用 computed 属性实现动态筛选                            │
     │  2. 条件渲染：v-if/v-else-if/v-else 处理不同状态                        │
     │  3. 列表渲染：v-for 循环展示动态列表                                    │
     │  4. 事件监听：全局事件监听（风格切换）                                   │
     │  5. 错误处理：API 失败时的后备方案                                      │
     │  6. 响应式设计：适配不同屏幕尺寸                                        │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【动态类型】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                                                                         │
     │  【publish - 发布】                                                      │
     │  用户发布了新文章，展示文章封面、标题、分类、统计数据                    │
     │                                                                         │
     │  【like - 点赞】                                                         │
     │  用户点赞了文章，展示文章标题和摘要                                      │
     │                                                                         │
     │  【comment - 评论】                                                      │
     │  用户评论了文章，展示文章标题和摘要                                      │
     │                                                                         │
     │  【follow - 关注】                                                       │
     │  用户关注了其他用户，展示被关注用户的头像和简介                          │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【数据流向】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                                                                         │
     │  1. 页面加载 → mounted() → fetchDynamics()                             │
     │     │                                                                   │
     │     ├── 获取当前用户 ID                                                 │
     │     │                                                                   │
     │     ├── 调用 API 获取动态数据                                           │
     │     │                                                                   │
     │     └── API 失败 → 使用模拟数据作为后备                                 │
     │                                                                         │
     │  2. 用户筛选 → 点击筛选标签 → activeFilter 更新                        │
     │     │                                                                   │
     │     └── computed filteredDynamics 自动重新计算                         │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【面试常问】
     Q1: computed 和 methods 的区别？
     A: computed 有缓存，依赖不变就不重新计算；methods 每次调用都执行
     
     Q2: 如何实现全局事件监听？
     A: 在 created/mounted 中使用 window.addEventListener，在 beforeDestroy 中移除
     
     Q3: 为什么要在 beforeDestroy 中移除事件监听？
     A: 避免内存泄漏，组件销毁后事件监听器仍然存在会占用内存
     
     Q4: 如何处理 API 失败的情况？
     A: 使用 try-catch 捕获错误，提供后备数据或错误提示，保证用户体验
     ============================================================ -->
<template>
  <div class="dynamic-page" :class="currentStyle">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">
      <i class="fas fa-arrow-left"></i> 返回首页
    </button>
    

    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">用户动态</h1>
          <p class="page-subtitle">查看你的活动记录</p>
        </div>
      </div>
      
      <!-- 动态内容区 -->
      <div class="container">
        <!-- 筛选标签 -->
        <div class="filter-tabs">
          <button 
            v-for="tab in filterTabs" 
            :key="tab.value"
            :class="['filter-tab', { active: activeFilter === tab.value }]"
            @click="activeFilter = tab.value"
          >
            <i :class="tab.icon"></i>
            {{ tab.label }}
          </button>
        </div>
        
        <!-- 动态列表 -->
        <div class="dynamic-list">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
            <button class="btn-primary" @click="fetchDynamics">重新加载</button>
          </div>
          
          <!-- 动态列表 -->
          <div v-else-if="filteredDynamics.length > 0">
            <!-- 动态条目 -->
            <div
              class="dynamic-item"
              v-for="dynamic in filteredDynamics"
              :key="dynamic._id || dynamic.id"
              :class="dynamic.type"
            >
              <div class="dynamic-content">
                <!-- 用户信息 -->
                <div class="user-info">
                  <img v-lazy="dynamic.user.avatar" alt="用户头像" class="user-avatar">
                  <div class="user-details">
                    <div class="username">{{ dynamic.user.name }}</div>
                    <div class="dynamic-time">{{ formatDate(dynamic.createdAt) }}</div>
                  </div>
                </div>
                
                <!-- 动态内容 -->
                <div class="dynamic-body">
                  <p class="dynamic-text">
                    <span v-html="dynamic.text"></span>
                    <a v-if="dynamic.link" :href="dynamic.link" class="dynamic-link">{{ dynamic.linkText }}</a>
                  </p>
                  
                  <!-- 相关内容预览 -->
                  <div v-if="dynamic.content" class="content-preview" :class="dynamic.type">
                    <template v-if="dynamic.type === 'publish'">
                      <div class="blog-preview">
                        <div class="blog-image">
                          <img v-lazy="dynamic.content.image" alt="文章封面" class="preview-img">
                        </div>
                        <div class="blog-info">
                          <div class="blog-category">{{ dynamic.content.category }}</div>
                          <h4 class="blog-title">{{ dynamic.content.title }}</h4>
                          <div class="blog-stats">
                            <span class="stat-item"><i class="fas fa-eye"></i> {{ dynamic.content.views }}</span>
                            <span class="stat-item"><i class="fas fa-heart"></i> {{ dynamic.content.likes }}</span>
                            <span class="stat-item"><i class="fas fa-comment"></i> {{ dynamic.content.comments }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                    
                    <template v-else-if="dynamic.type === 'like' || dynamic.type === 'comment'">
                      <div class="interacted-content">
                        <h4 class="content-title">{{ dynamic.content.title }}</h4>
                        <p class="content-excerpt">{{ dynamic.content.excerpt }}</p>
                      </div>
                    </template>
                    
                    <template v-else-if="dynamic.type === 'follow'">
                      <div class="followed-user">
                        <img v-lazy="dynamic.content.avatar" alt="用户头像" class="followed-avatar">
                        <div class="followed-info">
                          <div class="followed-name">{{ dynamic.content.name }}</div>
                          <div class="followed-bio">{{ dynamic.content.bio }}</div>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <i class="fas fa-activity"></i>
            <h3>暂无动态</h3>
            <p>你还没有相关的活动记录</p>
            <button class="btn-primary" @click="$router.push('/blog')">
              去逛逛
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
  </div>
</template>

<script>
// ============================================================
// 【模块导入】
// ============================================================

import TopNavbar from './TopNavbar.vue';
import MobileBottomNav from './MobileBottomNav.vue';

export default {
  name: 'UserDynamic',
  
  // ========================================================
  // 【组件注册】
  // ========================================================
  components: {
    TopNavbar,
    MobileBottomNav
  },
  
  // ========================================================
  // 【created 生命周期钩子】
  // ========================================================
  // 组件创建完成后调用
  // 用于添加全局事件监听器
  // ========================================================
  created() {
    // 添加全局风格变化事件监听器
    // 当用户切换页面风格时，更新当前组件的风格
    window.addEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
  },
  
  // ========================================================
  // 【beforeDestroy 生命周期钩子】
  // ========================================================
  // 组件销毁前调用
  // 用于清理事件监听器，避免内存泄漏
  // ========================================================
  beforeDestroy() {
    // 移除事件监听器
    // 【重要】必须在组件销毁前移除监听器，否则会造成内存泄漏
    window.removeEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
  },
  
  // ========================================================
  // 【mounted 生命周期钩子】
  // ========================================================
  // 组件挂载到 DOM 后调用
  // 用于发送 API 请求、初始化第三方库
  // ========================================================
  mounted() {
    // 页面加载时获取动态数据
    this.fetchDynamics();
  },
  
  // ========================================================
  // 【data 数据区】
  // ========================================================
  // 组件的响应式数据
  // ========================================================
  data() {
    return {
      // 当前页面风格（从 localStorage 读取，默认为 'style-spring-garden'）
      currentStyle: localStorage.getItem('currentStyle') || 'style-spring-garden',
      
      // 动态列表数据
      dynamics: [],
      
      // 加载状态
      isLoading: false,
      
      // 错误信息
      error: null,
      
      // 当前激活的筛选标签
      activeFilter: 'all',
      
      // 筛选标签配置
      // 【数据结构】
      // - value: 筛选值，用于判断
      // - label: 显示文本
      // - icon: Font Awesome 图标类名
      filterTabs: [
        { value: 'all', label: '全部', icon: 'fas fa-list' },
        { value: 'publish', label: '发布', icon: 'fas fa-pen-fancy' },
        { value: 'like', label: '点赞', icon: 'fas fa-heart' },
        { value: 'comment', label: '评论', icon: 'fas fa-comment' },
        { value: 'follow', label: '关注', icon: 'fas fa-user-plus' }
      ]
    };
  },
  
  // ========================================================
  // 【computed 计算属性】
  // ========================================================
  // 基于现有数据计算出新数据
  // 有缓存，依赖不变就不重新计算
  // ========================================================
  computed: {
    // 筛选后的动态列表
    // 【计算逻辑】
    // - 如果 activeFilter 为 'all'，返回所有动态
    // - 否则返回类型匹配的动态
    filteredDynamics() {
      if (this.activeFilter === 'all') {
        return this.dynamics;
      }
      return this.dynamics.filter(dynamic => dynamic.type === this.activeFilter);
    }
  },
  
  // ========================================================
  // 【methods 方法区】
  // ========================================================
  // 组件的所有方法
  // ========================================================
  methods: {
    // -----------------------------------------------------
    // 【导航方法】
    // -----------------------------------------------------
    
    // 返回首页
    goBack() {
      this.$router.push('/blog');
    },
    
    // -----------------------------------------------------
    // 【工具方法】
    // -----------------------------------------------------
    
    // 格式化日期
    // 将 ISO 日期字符串转换为本地化格式
    // 例如：2024-01-15T10:30:00.000Z → 2024年1月15日 10:30
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
    
    // -----------------------------------------------------
    // 【数据获取方法】
    // -----------------------------------------------------
    
    // 从后端获取动态数据
    // 【错误处理策略】
    // 1. API 成功 → 使用真实数据
    // 2. API 失败 → 使用模拟数据作为后备
    async fetchDynamics() {
      try {
        this.isLoading = true;
        this.error = null;
        
        // 获取当前用户 ID（从 localStorage 或 sessionStorage 中获取）
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) {
          throw new Error('用户未登录');
        }
        
        const user = JSON.parse(userStr);
        const currentUserId = user._id || user.id;
        
        if (!currentUserId) {
          throw new Error('无法获取用户 ID');
        }
        
        // 调用 API 获取动态数据
        const response = await this.$http.get(`/users/${currentUserId}/dynamics`);
        
        if (response.success) {
          this.dynamics = response.data;
        } else {
          throw new Error(response.message || '获取动态数据失败');
        }
      } catch (error) {
        console.error('获取动态数据失败:', error);
        this.error = '获取动态数据失败，请稍后重试';
        
        // 当 API 调用失败时使用模拟数据作为后备
        // 【开发技巧】提供后备数据可以保证开发过程中页面正常显示
        this.dynamics = this.getMockDynamics();
      } finally {
        this.isLoading = false;
      }
    },
    
    // 模拟动态数据
    // 【用途】
    // 1. 开发阶段测试页面展示
    // 2. API 失败时的后备数据
    // 3. 演示不同类型动态的展示效果
    getMockDynamics() {
      return [
        // 【发布类型动态】
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
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1小时前
        },
        // 【点赞类型动态】
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
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3小时前
        },
        // 【关注类型动态】
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
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5小时前
        },
        // 【评论类型动态】
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
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1天前
        },
        // 【发布类型动态】
        {
          id: 5,
          type: 'publish',
          text: '发布了新攻略',
          link: '/blog/4',
          linkText: '查看详情',
          user: {
            id: '659b4c44c6d2a34567890123',
            name: '游戏达人',
            avatar: 'https://via.placeholder.com/100'
          },
          content: {
            title: '零基础学习Python：从入门到精通',
            category: '学习攻略',
            image: 'https://via.placeholder.com/600x400?text=Python学习',
            views: 234,
            likes: 45,
            comments: 12
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2天前
        }
      ];
    }
  }
}
</script>

<style scoped>
/* 动态页面 */
.dynamic-page {
  min-height: 100vh;
  background-color: #fafafa;
}

/* 主内容区 */
.main-content {
  padding-bottom: 70px; /* 为底部导航栏预留空间 */
}

/* 页面标题 */
.page-header {
  background-color: white;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: white;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-tab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.filter-tab.active {
  background-color: #ff6b9d;
  color: white;
}

/* 动态列表 */
.dynamic-list {
  margin-bottom: 30px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 50px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 50px 0;
  color: #dc3545;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 15px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 4rem;
  color: #ff6b9d;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  color: #333;
}

.empty-state p {
  margin: 0 0 20px;
  color: #8e8e8e;
}

/* 动态条目 */
.dynamic-item {
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  padding: 20px;
  transition: all 0.3s ease;
}

.dynamic-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

/* 动态内容 */
.dynamic-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff6b9d;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #333;
}

.dynamic-time {
  font-size: 0.8rem;
  color: #8e8e8e;
}

/* 动态文本 */
.dynamic-text {
  color: #333;
  line-height: 1.6;
}

.dynamic-link {
  color: #ff6b9d;
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}

.dynamic-link:hover {
  text-decoration: underline;
}

/* 内容预览 */
.content-preview {
  margin-top: 10px;
  padding: 15px;
  border-radius: 10px;
  background-color: #f8f9fa;
  border-left: 4px solid #ff6b9d;
}

/* 博客预览 */
.content-preview.publish {
  border-left-color: #28a745;
}

.blog-preview {
  display: flex;
  gap: 15px;
}

.blog-image {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.blog-category {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 5px;
}

.blog-title {
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-stats {
  display: flex;
  gap: 15px;
  font-size: 0.8rem;
  color: #8e8e8e;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 互动内容预览 */
.content-preview.like {
  border-left-color: #dc3545;
}

.content-preview.comment {
  border-left-color: #ffc107;
}

.interacted-content .content-title {
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.interacted-content .content-excerpt {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 关注用户预览 */
.content-preview.follow {
  border-left-color: #17a2b8;
}

.followed-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.followed-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #17a2b8;
}

.followed-info {
  flex: 1;
}

.followed-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.followed-bio {
  font-size: 0.9rem;
  color: #6c757d;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .blog-preview {
    flex-direction: column;
  }
  
  .blog-image {
    width: 100%;
    height: auto;
  }
}
</style>