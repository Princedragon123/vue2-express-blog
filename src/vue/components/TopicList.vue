<template>
  <div class="topics">
    <div class="topics__container">
      <header class="topics__header"><h1 class="topics__title">话题圈</h1><p class="topics__subtitle">发现感兴趣的话题</p></header>

      <div class="topics__toolbar">
        <input type="text" class="input" placeholder="搜索话题..." v-model="searchQuery" @input="onSearch" style="border-radius:9999px">
        <button class="btn btn-primary" @click="showCreateModal = true">创建话题</button>
      </div>

      <div class="topics__categories">
        <button v-for="c in categories" :key="c.key" :class="['topics__cat-btn', { 'topics__cat-btn--active': activeCategory === c.key }]" @click="setCategory(c.key)">{{ c.label }}</button>
      </div>

      <div class="topics__list">
        <article v-for="t in topics" :key="t._id" class="topics__item" @click="$router.push(`/topic/${t._id}`)">
          <div class="topics__item-info">
            <h3 class="topics__item-name">{{ t.name }}</h3>
            <p class="topics__item-desc">{{ t.description }}</p>
            <div class="topics__item-stats"><span>{{ t.followersCount }} 关注</span><span>{{ t.articlesCount }} 文章</span></div>
          </div>
          <button class="btn" :class="isFollowing(t._id) ? 'btn-secondary' : 'btn-primary'" @click.stop="toggleFollow(t)" style="font-size:0.8rem;padding:6px 16px">{{ isFollowing(t._id) ? '已关注' : '关注' }}</button>
        </article>
      </div>

      <div v-if="hasMore" class="topics__more"><button class="btn btn-secondary" @click="loadMore">加载更多</button></div>
      <div v-if="!topics.length && !searchQuery" class="empty-state"><span class="empty-state__icon">◎</span><p>暂无话题</p></div>

      <!-- Create modal -->
      <div class="topics__modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
        <div class="topics__modal">
          <div class="topics__modal-head"><h2>创建话题</h2><button @click="showCreateModal = false">&times;</button></div>
          <form class="topics__modal-body" @submit.prevent="createTopic">
            <div class="topics__field"><label>名称</label><input class="input" v-model="newTopic.name" required></div>
            <div class="topics__field"><label>描述</label><textarea class="input" v-model="newTopic.description" rows="4" required style="resize:vertical"></textarea></div>
            <div class="topics__modal-actions"><button type="button" class="btn btn-secondary" @click="showCreateModal = false">取消</button><button type="submit" class="btn btn-primary" :disabled="isCreating">{{ isCreating ? '创建中...' : '创建' }}</button></div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';
import { debounce } from '../utils/helpers';

export default {
  name: 'TopicList',
  data() { return { topics: [], searchQuery: '', activeCategory: 'all', page: 1, limit: 10, hasMore: true, followingTopics: new Set(), showCreateModal: false, newTopic: { name: '', description: '' }, isCreating: false, categories: [{ key: 'all', label: '全部' }, { key: 'hot', label: '热门' }, { key: 'new', label: '最新' }] }; },
  mounted() { this.fetchTopics(); this.fetchFollowing(); },
  methods: {
    async fetchTopics() { try { let url = `/api/topics?page=${this.page}&limit=${this.limit}`; if (this.activeCategory === 'hot') url += '&sort=followersCount'; else if (this.activeCategory === 'new') url += '&sort=createdAt'; const d = await this.$http.get(url); if (d.success) { this.topics = this.page === 1 ? d.data : [...this.topics, ...d.data]; this.hasMore = d.data.length === this.limit; } } catch {} },
    onSearch: debounce(function() { if (this.searchQuery.trim()) { this.$http.get(`/api/topics/search?query=${encodeURIComponent(this.searchQuery)}`).then(d => { if (d.success) { this.topics = d.data; this.hasMore = false; } }); } else { this.page = 1; this.hasMore = true; this.fetchTopics(); } }, 300),
    setCategory(c) { this.activeCategory = c; this.page = 1; this.hasMore = true; this.fetchTopics(); },
    loadMore() { this.page++; this.fetchTopics(); },
    async fetchFollowing() { try { const d = await this.$http.get('/api/topics/user/following'); if (d.success) { this.followingTopics = new Set(d.data.map(t => t._id || t)); } } catch {} },
    isFollowing(id) { return this.followingTopics.has(id); },
    async toggleFollow(t) { const token = this.$store.getters.getToken; if (!token) { this.$router.replace('/login'); return; } try { const following = this.isFollowing(t._id); const method = following ? 'delete' : 'post'; const d = await this.$http[method](`/api/topics/${t._id}/follow`); if (d.success) { if (following) this.followingTopics.delete(t._id); else this.followingTopics.add(t._id); t.followersCount += following ? -1 : 1; } } catch {} },
    async createTopic() { if (!this.newTopic.name.trim()) return; this.isCreating = true; try { const d = await this.$http.post('/api/topics', this.newTopic); if (d.success) { this.showCreateModal = false; this.newTopic = { name: '', description: '' }; this.page = 1; this.fetchTopics(); showNotification('创建成功', 'success'); } } catch { showNotification('创建失败', 'error'); } finally { this.isCreating = false; } }
  }
};
</script>

<style scoped>
.topics { min-height: 100vh; background: #faf8f5; }
.topics__container { max-width: 800px; margin: 0 auto; padding: 24px 20px 80px; }
.topics__header { margin-bottom: 24px; }
.topics__title { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.topics__subtitle { font-size: 0.9rem; color: #9ca3af; }
.topics__toolbar { display: flex; gap: 10px; margin-bottom: 20px; }
.topics__categories { display: flex; gap: 6px; margin-bottom: 20px; overflow-x: auto; }
.topics__cat-btn { padding: 6px 16px; border: 1.5px solid #e5e7eb; border-radius: 9999px; background: #fff; font-size: 0.8rem; color: #6b7280; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.topics__cat-btn:hover { border-color: #e11d48; color: #e11d48; }
.topics__cat-btn--active { background: #e11d48; border-color: #e11d48; color: #fff; }
.topics__list { display: flex; flex-direction: column; gap: 12px; }
.topics__item { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transition: all 0.2s; }
.topics__item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.topics__item-info { flex: 1; min-width: 0; margin-right: 12px; }
.topics__item-name { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 0 0 4px; }
.topics__item-desc { font-size: 0.8rem; color: #9ca3af; margin: 0 0 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.topics__item-stats { display: flex; gap: 12px; font-size: 0.75rem; color: #9ca3af; }
.topics__more { text-align: center; margin-top: 24px; }
.topics__modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.topics__modal { background: #fff; border-radius: 16px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
.topics__modal-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f3f4f6; }
.topics__modal-head h2 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.topics__modal-head button { width: 28px; height: 28px; border-radius: 50%; background: #f3f4f6; border: none; cursor: pointer; font-size: 1rem; }
.topics__modal-body { padding: 20px 24px; }
.topics__field { margin-bottom: 16px; }
.topics__field label { display: block; font-weight: 500; color: #3d3d3d; margin-bottom: 6px; font-size: 0.85rem; }
.topics__modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
@media (max-width: 768px) { .topics__container { padding: 16px 12px 80px; } }
</style>
