<!-- Search.vue - 搜索页面组件 -->
<template>
  <div class="search-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 搜索框区域 -->
      <div class="search-header">
        <div class="container">
          <div class="search-box-wrapper">
            <div class="search-input-container">
              <i class="fas fa-search search-icon"></i>
              <input 
                ref="searchInput"
                type="text" 
                v-model="searchQuery" 
                placeholder="搜索攻略、用户" 
                class="search-input"
                @input="handleSearch"
              >
            </div>
            <button class="cancel-btn" @click="$router.back()">取消</button>
          </div>
        </div>
      </div>
      
      <!-- 搜索结果区域 -->
      <div class="container">
        <!-- 搜索结果 -->
        <div v-if="isSearching" class="search-section">
          <div class="section-header">
            <h3>搜索结果</h3>
          </div>
          <div class="search-results">
            <!-- 用户搜索结果 -->
            <div v-if="users.length > 0" class="search-result-group">
              <h4 class="result-group-title">用户</h4>
              <div class="user-results">
                <div 
                  class="user-result-item" 
                  v-for="user in users" 
                  :key="user._id"
                  @click="goToUserProfile(user._id)"
                >
                  <div class="user-avatar">
                    <img :src="user.profile.avatar || 'https://via.placeholder.com/40'" :alt="user.username" class="avatar-img">
                  </div>
                  <div class="user-info">
                    <h5 class="user-name">{{ user.username }}</h5>
                    <p class="user-bio">{{ user.profile.bio || '暂无简介' }}</p>
                    <div class="user-stats">
                      <span>{{ user.stats?.blogsCount || 0 }} 文章</span>
                      <span>{{ user.social?.followers?.length || 0 }} 粉丝</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 博客搜索结果 -->
            <div v-if="blogs.length > 0" class="search-result-group">
              <h4 class="result-group-title">文章</h4>
              <div class="blog-results">
                <div 
                  class="blog-result-item" 
                  v-for="blog in blogs" 
                  :key="blog._id"
                  @click="goToBlogDetail(blog._id)"
                >
                  <div class="blog-image">
                    <img :src="blog.image || 'https://via.placeholder.com/120x80'" :alt="blog.title" class="blog-img">
                  </div>
                  <div class="blog-info">
                    <h5 class="blog-title">{{ blog.title }}</h5>
                    <div class="blog-meta">
                      <span class="blog-author">{{ blog.author?.username || '未知' }}</span>
                      <span class="blog-views">{{ blog.views || 0 }} 浏览</span>
                      <span class="blog-date">{{ formatDate(blog.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 无搜索结果 -->
            <div v-if="!isSearching && searchQuery" class="no-results">
              <p>未找到相关结果</p>
            </div>
          </div>
        </div>
        
        <!-- 热点TOP10 -->
        <div v-else class="search-section">
          <div class="section-header">
            <h3>热点TOP10</h3>
          </div>
          <div class="latest-blogs">
            <div 
              class="latest-blog-item" 
              v-for="(blog, index) in hotBlogs" 
              :key="blog.id"
              @click="goToBlogDetail(blog.id)"
            >
              <div class="hot-rank">{{ index + 1 }}</div>
              <div class="latest-blog-image">
                <img :src="blog.image" :alt="blog.title" class="latest-blog-img">
              </div>
              <div class="latest-blog-info">
                <h4 class="latest-blog-title">{{ blog.title }}</h4>
                <div class="latest-blog-meta">
                  <span class="latest-blog-author">{{ blog.author }}</span>
                  <span class="latest-blog-date">{{ blog.views }} 浏览</span>
                </div>
              </div>
            </div>
            <div v-if="hotBlogs.length === 0" class="no-results">
              <p>暂无热点文章</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Search',
  data() {
    return {
      searchQuery: '',
      hotBlogs: [],
      blogs: [],
      users: [],
      isSearching: false,
      searchTimeout: null
    };
  },
  
  // 组件挂载后自动聚焦到搜索框并获取数据
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus();
      }
    });
    
    // 获取热门博客
    this.fetchHotBlogs();
  },
  
  methods: {
    // 处理搜索
    handleSearch() {
      // 清除之前的定时器
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // 设置新的定时器，实现防抖
      this.searchTimeout = setTimeout(() => {
        if (this.searchQuery.trim()) {
          this.isSearching = true;
          this.searchUsersAndBlogs();
        } else {
          this.isSearching = false;
          this.blogs = [];
          this.users = [];
        }
      }, 300);
    },
    
    // 搜索用户和博客
    async searchUsersAndBlogs() {
      try {
        const query = this.searchQuery.trim();
        
        // 并行搜索用户和博客
        const [usersData, blogsData] = await Promise.all([
          this.$http.get(`/api/users/search?query=${encodeURIComponent(query)}`),
          this.$http.get(`/api/blogs/search?query=${encodeURIComponent(query)}`)
        ]);
        
        if (usersData.success) {
          this.users = usersData.data;
        } else {
          this.users = [];
        }
        
        if (blogsData.success) {
          // 确保每个博客对象都有 _id 字段
          this.blogs = blogsData.data.map(blog => ({
            ...blog,
            _id: blog._id || blog.id
          }));
        } else {
          this.blogs = [];
        }
      } catch (error) {
        console.error('搜索失败:', error);
        this.users = [];
        this.blogs = [];
      }
    },
    
    // 获取热门博客
    async fetchHotBlogs() {
      try {
        const data = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true });
        
        if (data.success) {
          const blogs = data.data.map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author?.username || '未知',
            views: blog.views || 0
          }));
          
          // 直接更新 hotBlogs 数组
          this.hotBlogs = blogs;
        }
      } catch (error) {
        console.error('获取热门博客失败:', error);
        // 失败时显示空数组，让无结果提示显示
        this.hotBlogs = [];
      }
    },
    
    // 跳转到用户 profile
    goToUserProfile(userId) {
      this.$router.push(`/profile/${userId}`);
    },
    
    // 跳转到知乎风格详情页
    goToBlogDetail(blogId) {
      if (blogId) {
        this.$router.push(`/zhihu-detail/${blogId}`);
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.search-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 20px 0;
  border-bottom: 1px solid var(--background-dark);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
}

.search-box-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-input-container {
  position: relative;
  flex: 1;
  max-width: 600px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 2px solid var(--primary-pink);
  border-radius: 20px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  background: var(--background-light);
}

.search-input:focus {
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2);
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-pink);
  font-size: 16px;
}

.cancel-btn {
  background: none;
  border: none;
  color: var(--primary-pink);
  font-size: 16px;
  cursor: pointer;
  padding: 0 15px;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  color: var(--secondary-pink);
}

.search-section {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  margin: 20px 0;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 3px solid var(--background-dark);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  font-family: var(--font-family);
}

.latest-blogs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.latest-blog-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.latest-blog-item:last-child {
  border-bottom: none;
}

.hot-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 15px;
  color: var(--primary-pink);
  background: var(--background-light);
  border: 2px solid var(--primary-pink);
}

.latest-blog-image {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 15px;
}

.latest-blog-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.latest-blog-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.latest-blog-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.latest-blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.latest-blog-author {
  font-weight: 500;
}

.latest-blog-date {
  color: #999;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

/* 搜索结果样式 */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-result-group {
  margin-bottom: 20px;
}

.result-group-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--background-dark);
  font-family: var(--font-family);
}

/* 用户搜索结果样式 */
.user-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-result-item:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.user-bio {
  font-size: 13px;
  color: #999;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

/* 博客搜索结果样式 */
.blog-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.blog-result-item {
  display: flex;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.blog-result-item:hover {
  background-color: #f5f5f5;
}

.blog-image {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 15px;
}

.blog-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.blog-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #999;
  align-items: center;
}

.blog-author {
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .search-box-wrapper {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-input-container {
    max-width: 100%;
  }
  
  .user-result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .user-avatar {
    margin-right: 0;
  }
  
  .blog-result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .blog-image {
    width: 100%;
    height: 150px;
    margin-right: 0;
  }
}
</style>