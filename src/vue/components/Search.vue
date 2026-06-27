<template>
  <div class="search-page">
    <!-- 顶部搜索栏 -->
    <header class="search-page__header">
      <div class="search-page__row">
        <div class="search-page__input-wrap">
          <span class="search-page__search-icon">🔍</span>
          <input
            ref="searchInput"
            v-model="searchQuery"
            placeholder="搜索攻略、用户"
            class="search-page__input"
            @input="handleSearch"
            @keyup.enter="handleEnter"
          >
          <!-- 清除按钮 -->
          <button v-if="searchQuery" class="search-page__clear" @click="clearSearch" aria-label="清除搜索">✕</button>
        </div>
        <button class="search-page__cancel" @click="$router.back()">取消</button>
      </div>

      <!-- 搜索历史标签 -->
      <div v-if="!isSearching && searchHistory.length > 0" class="search-page__history">
        <div class="search-history__header">
          <span class="search-history__title">最近搜索</span>
          <button class="search-history__clear-all" @click="clearHistory">清空</button>
        </div>
        <div class="search-history__tags">
          <button
            v-for="(item, index) in searchHistory"
            :key="index"
            class="search-history__tag"
            @click="searchFromHistory(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="search-page__main">
      <!-- 搜索结果 -->
      <div v-if="isSearching" class="search-page__results">
        <div class="search-page__result-title">
          搜索"{{ searchQuery }}"的结果
        </div>

        <!-- 用户列表 -->
        <div v-if="users.length > 0" class="search-section">
          <h4 class="search-section__title">用户</h4>
          <div
            v-for="user in users"
            :key="user._id"
            class="search-user-item"
            @click="goToUserProfile(user._id)"
          >
            <img class="search-user-item__avatar" :src="user.profile?.avatar || 'https://via.placeholder.com/40'" alt="">
            <div class="search-user-item__info">
              <div class="search-user-item__name">{{ user.username }}</div>
              <div class="search-user-item__desc">{{ user.profile?.bio || '暂无个人简介' }}</div>
            </div>
            <div class="search-user-item__stats">
              <span>{{ user.stats?.blogsCount || 0 }} 文章</span>
            </div>
          </div>
        </div>

        <!-- 文章列表 -->
        <div v-if="blogs.length > 0" class="search-section">
          <h4 class="search-section__title">文章</h4>
          <div
            v-for="blog in blogs"
            :key="blog._id"
            class="search-blog-item"
            @click="goToBlogDetail(blog._id)"
          >
            <img class="search-blog-item__cover" :src="blog.image || 'https://via.placeholder.com/120x80'" alt="">
            <div class="search-blog-item__info">
              <h5 class="search-blog-item__title">{{ blog.title }}</h5>
              <div class="search-blog-item__meta">
                <span>{{ blog.author?.username || '未知' }}</span>
                <span>·</span>
                <span>{{ blog.views || 0 }} 浏览</span>
                <span>·</span>
                <span>{{ formatDate(blog.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-if="users.length === 0 && blogs.length === 0" class="search-page__empty">
          暂无相关搜索结果
        </div>
      </div>

      <!-- 热门榜单（非搜索状态） -->
      <div v-else class="search-page__hot">
        <div class="search-page__result-title">🔥 热门 TOP10</div>
        <div
          v-for="(blog, index) in hotBlogs"
          :key="blog.id"
          class="search-hot-item"
          @click="goToBlogDetail(blog.id)"
        >
          <div class="search-hot-item__rank" :class="`search-hot-item__rank--${index + 1}`">
            {{ index + 1 }}
          </div>
          <img class="search-hot-item__cover" :src="blog.image" alt="">
          <div class="search-hot-item__info">
            <div class="search-hot-item__name">{{ blog.title }}</div>
            <div class="search-hot-item__meta">{{ blog.author }} · {{ blog.views }} 浏览</div>
          </div>
        </div>
        <div v-if="hotBlogs.length === 0" class="search-page__empty">暂无热门文章</div>
      </div>
    </main>
  </div>
</template>

<script>
const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

export default {
  name: 'Search',

  data() {
    return {
      searchQuery: '',
      hotBlogs: [],
      blogs: [],
      users: [],
      isSearching: false,
      searchTimeout: null,
      searchHistory: []
    };
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
    });
    this.loadSearchHistory();
    this.fetchHotBlogs();
  },

  beforeDestroy() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  },

  methods: {
    // 加载搜索历史
    loadSearchHistory() {
      try {
        const saved = localStorage.getItem(HISTORY_KEY);
        this.searchHistory = saved ? JSON.parse(saved) : [];
      } catch { this.searchHistory = []; }
    },

    // 保存搜索历史
    saveSearchHistory(query) {
      const q = query.trim();
      if (!q) return;
      // 去重 + 限制数量
      this.searchHistory = [q, ...this.searchHistory.filter(h => h !== q)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.searchHistory)); } catch { /* quota exceeded */ }
    },

    // 从历史记录搜索
    searchFromHistory(query) {
      this.searchQuery = query;
      this.isSearching = true;
      this.saveSearchHistory(query);
      this.searchUsersAndBlogs();
    },

    // 清空历史
    clearHistory() {
      this.searchHistory = [];
      localStorage.removeItem(HISTORY_KEY);
    },

    // 清除搜索
    clearSearch() {
      this.searchQuery = '';
      this.isSearching = false;
      this.blogs = [];
      this.users = [];
      if (this.$refs.searchInput) this.$refs.searchInput.focus();
    },

    handleEnter() {
      if (this.searchQuery.trim()) {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.isSearching = true;
        this.saveSearchHistory(this.searchQuery);
        this.searchUsersAndBlogs();
      }
    },

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
      }, 350);
    },

    async searchUsersAndBlogs() {
      const query = this.searchQuery.trim();
      if (!query) return;
      // 保存到历史记录
      this.saveSearchHistory(query);
      try {
        const [usersRes, blogsRes] = await Promise.all([
          this.$http.get(`/api/users/search?query=${encodeURIComponent(query)}`).catch(() => ({ success: false, data: [] })),
          this.$http.get(`/api/blogs/search?query=${encodeURIComponent(query)}`).catch(() => ({ success: false, data: [] }))
        ]);
        this.users = usersRes.success ? usersRes.data : [];
        this.blogs = blogsRes.success ? blogsRes.data.map(b => ({ ...b, _id: b._id || b.id })) : [];
      } catch (error) {
        console.error('搜索失败:', error);
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
      } catch { this.hotBlogs = []; }
    },

    goToUserProfile(userId) { this.$router.push(`/profile/${userId}`); },
    goToBlogDetail(blogId) { if (blogId) this.$router.push(`/zhihu-detail/${blogId}`); },

    formatDate(dateString) {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f8f9fa;
}

/* 顶部搜索栏 */
.search-page__header {
  background: #fff;
  padding: 12px 0;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-page__row {
  width: 92%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-page__input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-page__search-icon {
  position: absolute;
  left: 14px;
  z-index: 1;
  font-size: 14px;
  pointer-events: none;
}

.search-page__input {
  width: 100%;
  height: 42px;
  padding: 0 36px 0 40px;
  background: #f5f6f8;
  border-radius: 21px;
  border: none;
  outline: none;
  font-size: 15px;
  transition: all 0.25s;
}

.search-page__input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2);
}

.search-page__clear {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #999;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.search-page__cancel {
  border: none;
  background: none;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 4px;
}

.search-page__cancel:hover { color: #ec4899; }

/* 搜索历史 */
.search-page__history {
  width: 92%;
  max-width: 1200px;
  margin: 12px auto 0;
}

.search-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.search-history__title {
  font-size: 13px;
  color: #999;
}

.search-history__clear-all {
  border: none;
  background: none;
  color: #ec4899;
  font-size: 12px;
  cursor: pointer;
}

.search-history__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-history__tag {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(236, 72, 153, 0.2);
  background: rgba(236, 72, 153, 0.04);
  color: #ec4899;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-history__tag:active {
  background: rgba(236, 72, 153, 0.12);
  transform: scale(0.96);
}

/* 主内容 */
.search-page__main {
  width: 92%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 0 40px;
}

.search-page__result-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #222;
}

.search-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.search-section__title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin: 0 0 12px;
}

/* 搜索结果 - 用户 */
.search-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  /* 最小触摸目标 */
  min-height: 48px;
}
.search-user-item:active { background: #f8f9fa; }

.search-user-item__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.search-user-item__info { flex: 1; min-width: 0; }
.search-user-item__name { font-size: 15px; font-weight: 500; color: #222; }
.search-user-item__desc { font-size: 13px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-user-item__stats { font-size: 12px; color: #999; }

/* 搜索结果 - 文章 */
.search-blog-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 72px;
}
.search-blog-item:active { background: #f8f9fa; }

.search-blog-item__cover {
  width: 100px;
  height: 68px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.search-blog-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.search-blog-item__title {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-blog-item__meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 热门榜单 */
.search-hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 56px;
  background: #fff;
  margin-bottom: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
}
.search-hot-item:active { background: #f8f9fa; }

.search-hot-item__rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background: #f0f0f0;
  color: #999;
  flex-shrink: 0;
}
.search-hot-item__rank--1 { background: #ffecd2; color: #f59e0b; }
.search-hot-item__rank--2 { background: #eef2ff; color: #6366f1; }
.search-hot-item__rank--3 { background: #fef2f2; color: #ef4444; }

.search-hot-item__cover {
  width: 64px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.search-hot-item__info { flex: 1; min-width: 0; }
.search-hot-item__name { font-size: 14px; font-weight: 500; color: #222; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-hot-item__meta { font-size: 12px; color: #999; }

/* 空状态 */
.search-page__empty {
  text-align: center;
  padding: 50px 0;
  color: #aaa;
  font-size: 14px;
}

@media (max-width: 768px) {
  .search-hot-item__cover { width: 56px; height: 42px; }
  .search-blog-item__cover { width: 80px; height: 56px; }
}
</style>
