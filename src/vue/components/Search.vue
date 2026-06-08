<template>
  <div class="search-page">
    <!-- 顶部搜索栏 -->
    <header class="search-header">
      <div class="container">
        <div class="search-row">
          <div class="search-input-wrap">
            <svg-icon name="search" :size="18" class-name="search-icon"></svg-icon>
            <input 
              ref="searchInput"
              v-model="searchQuery" 
              placeholder="搜索攻略、用户" 
              class="search-input"
              @input="handleSearch"
            >
          </div>
          <span class="cancel-btn" @click="$router.back()">取消</span>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="main-content container">
      <!-- 搜索结果 -->
      <div v-if="isSearching" class="result-wrap">
        <div class="result-title">搜索结果</div>

        <!-- 用户列表 -->
        <div v-if="users.length > 0" class="section-wrap">
          <h4 class="sub-title">用户</h4>
          <div class="user-list">
            <div 
              class="user-item" 
              v-for="user in users" 
              :key="user._id"
              @click="goToUserProfile(user._id)"
            >
              <img 
                class="user-avatar"
                :src="user.profile.avatar || 'https://via.placeholder.com/40'" 
                alt="avatar"
              >
              <div class="user-info">
                <div class="username">{{ user.username }}</div>
                <div class="user-desc">{{ user.profile.bio || '暂无个人简介' }}</div>
              </div>
              <div class="user-stat">
                <span>{{ user.stats?.blogsCount || 0 }} 文章</span>
                <span>{{ user.social?.followers?.length || 0 }} 粉丝</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 文章列表 -->
        <div v-if="blogs.length > 0" class="section-wrap">
          <h4 class="sub-title">文章</h4>
          <div class="blog-list">
            <div 
              class="blog-item" 
              v-for="blog in blogs" 
              :key="blog._id"
              @click="goToBlogDetail(blog._id)"
            >
              <img 
                class="blog-cover"
                :src="blog.image || 'https://via.placeholder.com/120x80'" 
                alt="cover"
              >
              <div class="blog-info">
                <h5 class="blog-title">{{ blog.title }}</h5>
                <div class="blog-meta">
                  <span>{{ blog.author?.username || '未知作者' }}</span>
                  <span>{{ blog.views || 0 }} 浏览</span>
                  <span>{{ formatDate(blog.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-if="isSearching && users.length === 0 && blogs.length === 0" class="empty-tip">
          暂无相关搜索结果
        </div>
      </div>

      <!-- 热门榜单 -->
      <div v-else class="hot-wrap">
        <div class="result-title">热门 TOP10</div>
        <div class="hot-list">
          <div 
            class="hot-item" 
            v-for="(blog, index) in hotBlogs" 
            :key="blog.id"
            @click="goToBlogDetail(blog.id)"
          >
            <div class="rank-num" :class="rankClass(index + 1)">
              {{ index + 1 }}
            </div>
            <img class="hot-cover" :src="blog.image" alt="">
            <div class="hot-info">
              <div class="hot-name">{{ blog.title }}</div>
              <div class="hot-meta">{{ blog.author }} · {{ blog.views }} 浏览</div>
            </div>
          </div>
        </div>

        <div v-if="hotBlogs.length === 0" class="empty-tip">
          暂无热门文章
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

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus();
      }
    });
    this.fetchHotBlogs();
  },

  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },

  methods: {
    handleSearch() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
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

    async searchUsersAndBlogs() {
      try {
        const query = this.searchQuery.trim();
        const [usersData, blogsData] = await Promise.all([
          this.$http.get(`/api/users/search?query=${encodeURIComponent(query)}`),
          this.$http.get(`/api/blogs/search?query=${encodeURIComponent(query)}`)
        ]);

        this.users = usersData.success ? usersData.data : [];
        this.blogs = blogsData.success 
          ? blogsData.data.map(blog => ({ ...blog, _id: blog._id || blog.id })) 
          : [];
      } catch (error) {
        console.error('搜索失败:', error);
        this.users = [];
        this.blogs = [];
      }
    },

    async fetchHotBlogs() {
      try {
        const data = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true });
        if (data.success) {
          this.hotBlogs = data.data.map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author?.username || '未知',
            views: blog.views || 0
          }));
        }
      } catch (error) {
        console.error('获取热门博客失败:', error);
        this.hotBlogs = [];
      }
    },

    goToUserProfile(userId) {
      this.$router.push(`/profile/${userId}`);
    },
    goToBlogDetail(blogId) {
      if (blogId) this.$router.push(`/zhihu-detail/${blogId}`);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const d = new Date(dateString);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },
    rankClass(num) {
      if (num === 1) return 'rank-top1';
      if (num === 2) return 'rank-top2';
      if (num === 3) return 'rank-top3';
      return '';
    }
  }
};
</script>

<style scoped>
/* 全局基础 */
.search-page {
  min-height: 100vh;
  background: #f8f9fa;
  color: #333;
}
.container {
  width: 92%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 顶部搜索栏 */
.search-header {
  background: #fff;
  padding: 16px 0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.search-input-wrap {
  flex: 1;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}
.search-input {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 42px;
  background: #f5f6f8;
  border-radius: 21px;
  border: none;
  outline: none;
  font-size: 15px;
  transition: all 0.25s;
}
.search-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.25);
}
.cancel-btn {
  font-size: 15px;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
}
.cancel-btn:hover {
  color: #ec4899;
}

/* 主内容 */
.main-content {
  padding: 20px 0 40px;
}
.result-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #222;
}
.sub-title {
  font-size: 15px;
  font-weight: 500;
  color: #555;
  margin: 20px 0 12px;
}

/* 区块通用 */
.section-wrap,
.hot-wrap {
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

/* 用户列表 */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px;
  transition: background 0.25s;
}
.user-item:hover {
  background: #f8f9fa;
}
.user-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.username {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin-bottom: 2px;
}
.user-desc {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-stat {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 10px;
}

/* 文章列表 */
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.blog-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px;
  transition: background 0.25s;
}
.blog-item:hover {
  background: #f8f9fa;
}
.blog-cover {
  width: 110px;
  height: 75px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.blog-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}
.blog-title {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.blog-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 12px;
}

/* 热门榜单 */
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px;
  transition: background 0.25s;
}
.hot-item:hover {
  background: #f8f9fa;
}
.rank-num {
  width: 24px;
  height: 24px;
  text-align: center;
  line-height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  background: #f0f0f0;
  color: #666;
  flex-shrink: 0;
}
.rank-top1 {
  background: #ffecd2;
  color: #f59e0b;
}
.rank-top2 {
  background: #eef2ff;
  color: #6366f1;
}
.rank-top3 {
  background: #fef2f2;
  color: #ef4444;
}
.hot-cover {
  width: 70px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.hot-info {
  flex: 1;
  min-width: 0;
}
.hot-name {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  margin-bottom: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hot-meta {
  font-size: 12px;
  color: #999;
}

/* 空状态 */
.empty-tip {
  text-align: center;
  padding: 50px 0;
  color: #aaa;
  font-size: 14px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .blog-cover {
    width: 90px;
    height: 62px;
  }
  .hot-cover {
    width: 60px;
    height: 46px;
  }
  .blog-meta {
    gap: 6px;
  }
}
</style>