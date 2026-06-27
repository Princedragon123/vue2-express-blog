<template>
  <div class="search-page">
    <div class="search-page__bar">
      <div class="search-page__input-wrap">
        <svg-icon name="search" :size="16" class-name="search-page__icon" />
        <input ref="searchInput" v-model="searchQuery" placeholder="搜索攻略、用户" class="input search-page__input" @input="handleSearch" @keyup.enter="handleEnter">
        <button v-if="searchQuery" class="search-page__clear" @click="clearSearch">&times;</button>
      </div>
      <button class="search-page__cancel" @click="$router.back()">取消</button>
    </div>

    <!-- Search history -->
    <div class="search-page__section" v-if="!isSearching && searchHistory.length">
      <div class="search-page__history-header">
        <span class="search-page__section-title">最近搜索</span>
        <button class="search-page__history-clear" @click="clearHistory">清空</button>
      </div>
      <div class="search-page__tags">
        <button v-for="(item, i) in searchHistory" :key="i" class="search-page__tag" @click="searchFromHistory(item)">{{ item }}</button>
      </div>
    </div>

    <div class="search-page__section" v-if="isSearching">
      <h3 class="search-page__section-title">搜索结果</h3>
      <!-- Users -->
      <div v-if="users.length" class="search-page__group">
        <h4 class="search-page__group-title">用户</h4>
        <div v-for="u in users" :key="u._id" class="search-page__user" @click="goToUserProfile(u._id)">
          <img :src="u.profile?.avatar || 'https://via.placeholder.com/40'" class="search-page__avatar" alt="">
          <div class="search-page__user-info">
            <div class="search-page__user-name">{{ u.username }}</div>
            <div class="search-page__user-desc">{{ u.profile?.bio || '暂无简介' }}</div>
          </div>
        </div>
      </div>
      <!-- Blogs -->
      <div v-if="blogs.length" class="search-page__group">
        <h4 class="search-page__group-title">文章</h4>
        <div v-for="b in blogs" :key="b._id" class="search-page__blog" @click="goToBlogDetail(b._id)">
          <img :src="b.image || 'https://via.placeholder.com/120x80'" class="search-page__blog-img" alt="">
          <div class="search-page__blog-info">
            <h5 class="search-page__blog-title">{{ b.title }}</h5>
            <div class="search-page__blog-meta">{{ b.author?.username || '未知' }} · {{ b.views || 0 }} 浏览 · {{ formatDate(b.createdAt) }}</div>
          </div>
        </div>
      </div>
      <div v-if="!users.length && !blogs.length" class="search-page__empty">暂无相关结果</div>
    </div>

    <!-- Hot rank -->
    <div class="search-page__section" v-else>
      <h3 class="search-page__section-title">热门 TOP10</h3>
      <div v-for="(b, i) in hotBlogs" :key="b.id" class="search-page__hot-item" @click="goToBlogDetail(b.id)">
        <span class="search-page__rank" :class="`search-page__rank--${i + 1}`">{{ i + 1 }}</span>
        <img :src="b.image" class="search-page__hot-img" alt="">
        <div class="search-page__hot-info">
          <div class="search-page__hot-name">{{ b.title }}</div>
          <div class="search-page__hot-meta">{{ b.author }} · {{ b.views }} 浏览</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const HISTORY_KEY = 'search_history';
export default {
  name: 'Search',
  data() { return { searchQuery: '', hotBlogs: [], blogs: [], users: [], isSearching: false, searchTimeout: null, searchHistory: [] }; },
  mounted() { this.$nextTick(() => { if (this.$refs.searchInput) this.$refs.searchInput.focus(); }); this.loadHistory(); this.fetchHotBlogs(); },
  beforeDestroy() { if (this.searchTimeout) clearTimeout(this.searchTimeout); },
  methods: {
    loadHistory() { try { this.searchHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { this.searchHistory = []; } },
    saveHistory(q) { q = q.trim(); if (!q) return; this.searchHistory = [q, ...this.searchHistory.filter(h => h !== q)].slice(0, 10); try { localStorage.setItem(HISTORY_KEY, JSON.stringify(this.searchHistory)); } catch {} },
    clearHistory() { this.searchHistory = []; localStorage.removeItem(HISTORY_KEY); },
    searchFromHistory(q) { this.searchQuery = q; this.isSearching = true; this.saveHistory(q); this.search(); },
    clearSearch() { this.searchQuery = ''; this.isSearching = false; this.blogs = []; this.users = []; if (this.$refs.searchInput) this.$refs.searchInput.focus(); },
    handleEnter() { if (this.searchQuery.trim()) { if (this.searchTimeout) clearTimeout(this.searchTimeout); this.isSearching = true; this.saveHistory(this.searchQuery); this.search(); } },
    handleSearch() { if (this.searchTimeout) clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => { if (this.searchQuery.trim()) { this.isSearching = true; this.search(); } else { this.isSearching = false; this.blogs = []; this.users = []; } }, 350); },
    async search() { const q = this.searchQuery.trim(); if (!q) return; this.saveHistory(q); try { const [ur, br] = await Promise.all([this.$http.get(`/api/users/search?query=${encodeURIComponent(q)}`).catch(() => ({ success: false })), this.$http.get(`/api/blogs/search?query=${encodeURIComponent(q)}`).catch(() => ({ success: false }))]); this.users = ur.success ? ur.data : []; this.blogs = br.success ? br.data.map(b => ({ ...b, _id: b._id || b.id })) : []; } catch { this.users = []; this.blogs = []; } },
    async fetchHotBlogs() { try { const d = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true }); if (d.success) this.hotBlogs = d.data.map(b => ({ id: b._id, title: b.title, image: b.image || 'https://via.placeholder.com/300x200', author: b.author?.username || '未知', views: b.views || 0 })); } catch { this.hotBlogs = []; } },
    goToUserProfile(id) { this.$router.push(`/profile/${id}`); },
    goToBlogDetail(id) { if (id) this.$router.push(`/zhihu-detail/${id}`); },
    formatDate(d) { if (!d) return ''; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; }
  }
};
</script>

<style scoped>
.search-page { min-height: 100vh; background: #faf8f5; }
.search-page__bar { display: flex; align-items: center; gap: 12px; padding: 12px 0; background: #fff; position: sticky; top: 56px; z-index: 50; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.search-page__input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.search-page__icon { position: absolute; left: 12px; color: #9ca3af; pointer-events: none; }
.search-page__input { padding-left: 36px !important; padding-right: 32px !important; border-radius: 9999px !important; }
.search-page__clear { position: absolute; right: 8px; width: 22px; height: 22px; border-radius: 50%; border: none; background: #e5e7eb; color: #6b7280; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.search-page__cancel { border: none; background: none; color: #6b7280; font-size: 0.9rem; cursor: pointer; white-space: nowrap; }
.search-page__section { width: 92%; max-width: 800px; margin: 20px auto 0; }
.search-page__section-title { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.search-page__history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.search-page__history-clear { border: none; background: none; color: #e11d48; font-size: 0.8rem; cursor: pointer; }
.search-page__tags { display: flex; flex-wrap: wrap; gap: 8px; }
.search-page__tag { padding: 6px 14px; border-radius: 9999px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 0.8rem; color: #6b7280; cursor: pointer; transition: all 0.15s; }
.search-page__tag:hover { border-color: #e11d48; color: #e11d48; }
.search-page__group { margin-bottom: 20px; }
.search-page__group-title { font-size: 0.85rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
.search-page__user { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; min-height: 48px; background: #fff; margin-bottom: 8px; }
.search-page__user:hover { background: #f9fafb; }
.search-page__avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.search-page__user-name { font-weight: 500; color: #1a1a1a; }
.search-page__user-desc { font-size: 0.8rem; color: #9ca3af; }
.search-page__blog { display: flex; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; min-height: 64px; background: #fff; margin-bottom: 8px; }
.search-page__blog:hover { background: #f9fafb; }
.search-page__blog-img { width: 100px; height: 68px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.search-page__blog-title { font-weight: 500; color: #1a1a1a; margin: 0 0 4px; }
.search-page__blog-meta { font-size: 0.75rem; color: #9ca3af; }
.search-page__hot-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; min-height: 56px; background: #fff; margin-bottom: 8px; }
.search-page__hot-item:hover { background: #f9fafb; }
.search-page__rank { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; background: #f3f4f6; color: #6b7280; flex-shrink: 0; }
.search-page__rank--1 { background: #fef2f2; color: #dc2626; }
.search-page__rank--2 { background: #fff7ed; color: #ea580c; }
.search-page__rank--3 { background: #fefce8; color: #ca8a04; }
.search-page__hot-img { width: 60px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.search-page__hot-name { font-weight: 500; color: #1a1a1a; margin-bottom: 2px; }
.search-page__hot-meta { font-size: 0.75rem; color: #9ca3af; }
.search-page__empty { text-align: center; padding: 60px 0; color: #d1d5db; font-size: 0.9rem; }

@media (max-width: 768px) {
  .search-page__bar { top: 0; padding: 10px 0; }
  .search-page__section { width: 92%; }
  .search-page__blog-img { width: 80px; height: 56px; }
  .search-page__hot-img { width: 54px; height: 40px; }
}
</style>
