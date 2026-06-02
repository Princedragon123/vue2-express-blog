<!-- MyCreation.vue - 我的创作页面组件 -->
<template>
  <div class="my-creation-page" :class="currentStyle">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">
      <svg-icon name="arrowLeft" :size="18"></svg-icon> 返回首页
    </button>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">我的创作</h1>
          <p class="page-subtitle">查看和管理你发布的所有攻略文章</p>
        </div>
      </div>
      
      <!-- 创作列表 -->
      <div class="container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <svg-icon name="spinner" :size="24" class-name="fa-spin"></svg-icon>
          <p>加载中...</p>
        </div>
        
        <!-- 创作文章列表 -->
        <div v-else class="creation-list">
          <!-- 创作文章卡片 -->
          <div class="creation-card" v-for="(creation, index) in paginatedCreations" :key="creation.id">
            <div class="creation-image" v-if="creation.image">
              <img :src="creation.image" alt="文章封面" class="article-image">
            </div>
            <div class="creation-content">
              <div class="creation-category">{{ creation.category }}</div>
              <h3 class="creation-title" @click="viewCreation(creation.id)">{{ creation.title }}</h3>
              <div class="creation-meta">
                <span class="creation-date">{{ creation.date }}</span>
                <span class="creation-stats">
                  <svg-icon name="eye" :size="14"></svg-icon> {{ creation.views }}
                  <svg-icon name="heart" :size="14"></svg-icon> {{ creation.likes }}
                  <svg-icon name="comment" :size="14"></svg-icon> {{ creation.comments }}
                </span>
              </div>
              <div class="creation-actions">
                <button class="action-btn edit-btn" @click="editCreation(creation.id)">
                  <svg-icon name="edit" :size="16"></svg-icon> 编辑
                </button>
                <button class="action-btn delete-btn" @click="deleteCreation(creation.id)">
                  <svg-icon name="trash" :size="16"></svg-icon> 删除
                </button>
              </div>
            </div>
          </div>
          
          <!-- 分页控制 -->
          <div v-if="creations.length > 0" class="pagination">
            <button 
              class="page-btn" 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
            >
              <svg-icon name="chevronLeft" :size="16"></svg-icon> 上一页
            </button>
            
            <span class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页（共 {{ totalCreations }} 条）
            </span>
            
            <button 
              class="page-btn" 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
            >
              下一页 <svg-icon name="chevronRight" :size="16"></svg-icon>
            </button>
          </div>
        </div>
        
        <!-- 空创作状态 -->
        <div v-if="!loading && creations.length === 0" class="empty-state">
          <svg-icon name="edit" :size="48"></svg-icon>
          <h3>暂无创作</h3>
          <p>你还没有发布任何攻略文章，快去创作第一篇吧！</p>
          <button class="btn-primary" @click="goToCreate">
            <svg-icon name="plus" :size="16"></svg-icon> 发布攻略
          </button>
        </div>
      </div>
    </main>
    

  </div>
</template>

<script>
import { showNotification } from '../utils/notification';

export default {
  name: 'MyCreation',
  components: {
  },
  created() {
    // 添加全局风格变化事件监听器
    window.addEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
    
    // 加载用户文章列表
    this.loadMyCreations();
  },
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
  },
  data() {
    return {
      currentStyle: localStorage.getItem('currentStyle') || 'style-spring-garden',
      creations: [],
      loading: true,
      currentPage: 1,
      pageSize: 6,
      totalCreations: 0
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalCreations / this.pageSize);
    },
    paginatedCreations() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.creations.slice(start, end);
    }
  },
  methods: {
    goToCreate() {
      this.$router.push('/create');
    },
    
    // 返回首页
    goBack() {
      this.$router.push('/blog');
    },
    
    // 获取认证令牌
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    // 获取模拟文章数据
    getMockCreationsData() {
      // 使用 picsum.photos 作为替代的占位符图片服务
      return [
        {
          id: '1',
          title: '最新游戏攻略：如何快速升级',
          image: 'https://picsum.photos/300/180',
          category: '游戏攻略',
          date: new Date().toISOString().split('T')[0],
          views: 1234,
          likes: 56,
          comments: 23
        },
        {
          id: '2',
          title: '游戏装备选择指南',
          image: 'https://picsum.photos/301/180',
          category: '游戏攻略',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          views: 987,
          likes: 45,
          comments: 18
        },
        {
          id: '3',
          title: '游戏团队配合技巧',
          image: 'https://picsum.photos/302/180',
          category: '游戏攻略',
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          views: 765,
          likes: 34,
          comments: 12
        }
      ];
    },
    
    // 加载用户文章列表
    async loadMyCreations() {
      // 1. 初始化状态
      this.loading = true;
      
      try {
        // 2. 获取认证令牌
        const token = this.getAuthToken();
        
        // 3. 检查令牌
        if (!token) {
          const mockData = this.getMockCreationsData();
          this.creations = mockData;
          this.totalCreations = mockData.length;
          return;
        }
        
        // 4. 准备请求头
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        // 5. 获取文章列表（获取所有数据，不限制数量）
        try {
          const data = await this.$http.get('/api/blogs/my', {
            params: {
              page: 1,
              limit: 1000  // 获取最多 1000 条，应该够用了
            }
          });
          
          if (data.success && data.data) {
            console.log('后端返回的数据:', data.data);
            console.log('数据数量:', data.data.length);
            
            // 转换数据格式，适配前端显示
            const blogData = data.data.map(blog => ({
              id: blog._id,
              title: blog.title,
              image: blog.image,
              category: '游戏攻略',
              date: new Date(blog.createdAt).toISOString().split('T')[0],
              views: blog.views || 0,
              likes: blog.likes || 0,
              comments: blog.comments || 0
            }));
            
            // 去重：使用 Map 根据 id 去重
            const uniqueMap = new Map();
            blogData.forEach(blog => {
              if (!uniqueMap.has(blog.id)) {
                uniqueMap.set(blog.id, blog);
              }
            });
            
            const uniqueBlogData = Array.from(uniqueMap.values());
            
            console.log('去重后的数据:', uniqueBlogData);
            console.log('去重后数量:', uniqueBlogData.length);
            console.log('原始数量:', blogData.length);
            
            this.creations = uniqueBlogData;
            this.totalCreations = uniqueBlogData.length;
            console.log('总数量:', this.totalCreations);
          } else {
            const mockData = this.getMockCreationsData();
            this.creations = mockData;
            this.totalCreations = mockData.length;
          }
        } catch (error) {
          console.error('获取文章列表失败:', error);
          const mockData = this.getMockCreationsData();
          this.creations = mockData;
          this.totalCreations = mockData.length;
        }
      } catch (error) {
        console.error('加载创作列表失败:', error);
        const mockData = this.getMockCreationsData();
        this.creations = mockData;
        this.totalCreations = mockData.length;
      } finally {
        // 6. 重置状态
        this.loading = false;
      }
    },
    
    // 查看文章详情
    viewCreation(id) {
      // 跳转到文章详情页
      this.$router.push(`/detail/${id}`);
    },
    
    // 编辑文章
    editCreation(id) {
      // 跳转到编辑页面，传入文章ID
      this.$router.push(`/edit/${id}`);
    },
    
    // 删除文章
    async deleteCreation(id) {
      // 首先显示确认对话框
      const confirmed = confirm('确定要删除这篇文章吗？此操作不可恢复。');
      
      // 只有用户确认后才执行删除操作
      if (confirmed) {
        try {
          const token = this.getAuthToken();
          
          if (!token) {
            // 模拟删除
            this.creations = this.creations.filter(c => c.id !== id);
            this.totalCreations = this.creations.length;
            showNotification('删除成功', 'success');
            return;
          }
          
          const response = await this.$http.delete(`/api/blogs/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.success) {
            // 从列表中移除已删除的文章
            this.creations = this.creations.filter(c => c.id !== id);
            this.totalCreations = this.creations.length;
            
            // 如果当前页没有数据了，返回上一页
            if (this.paginatedCreations.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
            
            showNotification('删除成功', 'success');
          }
        } catch (error) {
          console.error('删除文章失败:', error);
          showNotification('删除失败，请重试', 'error');
        }
      }
    },
    
    // 切换页码
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
</script>

<style scoped>
/* 我的创作页面 */
.my-creation-page {
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

/* 创作列表 */
.creation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* 创作文章卡片 */
.creation-card {
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.creation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.creation-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.creation-card:hover .article-image {
  transform: scale(1.05);
}

.creation-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.creation-category {
  display: inline-block;
  padding: 5px 12px;
  background-color: #ffd700;
  color: #8b4513;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  align-self: flex-start;
}

.creation-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.creation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #8e8e8e;
}

.creation-stats {
  display: flex;
  gap: 15px;
  align-items: center;
}

.creation-stats i {
  margin-right: 4px;
  color: #ff6b9d;
}

.creation-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.edit-btn {
  background-color: #4ecdc4;
  color: white;
}

.edit-btn:hover {
  background-color: #45b7aa;
  transform: translateY(-2px);
}

.delete-btn {
  background-color: #ff6b6b;
  color: white;
}

.delete-btn:hover {
  background-color: #ee5a52;
  transform: translateY(-2px);
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.loading-state i {
  font-size: 3rem;
  color: #ff6b9d;
  margin-bottom: 20px;
}

.loading-state p {
  margin: 0;
  color: #8e8e8e;
  font-size: 1.1rem;
}

/* 空创作状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  grid-column: 1 / -1;
}

.empty-state i {
  font-size: 4rem;
  color: #e0e0e0;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  color: #333;
}

.empty-state p {
  margin: 0 0 30px;
  color: #8e8e8e;
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #fec89a 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  width: 100%;
}

.page-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e0e0e0;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
}

/* 返回按钮 */
.back-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 12px 25px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  font-weight: bold;
  font-family: 'Comic Sans MS', cursive;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
  z-index: 1000;
}

.back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
  animation: cute-swing 0.5s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .creation-list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 992px) {
  .page-title {
    font-size: 1.75rem;
  }
  
  .creation-list {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .page-subtitle {
    font-size: 0.9rem;
  }
  
  .creation-list {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .creation-card {
    flex-direction: row;
  }
  
  .creation-image {
    width: 150px;
    height: 150px;
    flex-shrink: 0;
  }
  
  .creation-content {
    padding: 15px;
    gap: 8px;
  }
  
  .creation-title {
    font-size: 1.1rem;
  }
  
  .creation-actions {
    flex-direction: column;
  }
  
  .empty-state {
    padding: 40px 15px;
  }
  
  .empty-state i {
    font-size: 3rem;
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
  }
}

@media (max-width: 576px) {
  .creation-card {
    flex-direction: column;
  }
  
  .creation-image {
    width: 100%;
    height: 180px;
  }
}
</style>