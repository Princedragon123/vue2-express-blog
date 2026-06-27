<template>
  <div class="topic">
    <div class="topic__container">
      <div v-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else-if="error" class="topic__error"><p>{{ error }}</p><button class="btn btn-primary" @click="fetchTopicDetail">重试</button></div>
      <template v-else-if="topicData && Object.keys(topicData).length">
        <header class="topic__header">
          <div class="topic__cover" v-if="topicData.coverImage"><img :src="topicData.coverImage" :alt="topicData.name"></div>
          <div class="topic__cover topic__cover--placeholder" v-else><span>{{ topicData.name }}</span></div>
          <div class="topic__info">
            <h1 class="topic__name">{{ topicData.name }}</h1>
            <p class="topic__desc">{{ topicData.description }}</p>
            <div class="topic__stats"><span>{{ topicData.followersCount }} 关注</span><span>{{ topicData.articlesCount }} 文章</span><span>{{ formatDate(topicData.createdAt) }}</span></div>
            <div class="topic__actions">
              <button class="btn" :class="topicData.isFollowing ? 'btn-secondary' : 'btn-primary'" @click="toggleFollow" style="font-size:0.85rem;padding:8px 20px">{{ topicData.isFollowing ? '已关注' : '关注' }}</button>
              <button class="btn btn-primary" @click="createArticle" style="font-size:0.85rem;padding:8px 20px">发布文章</button>
            </div>
          </div>
        </header>

        <h2 class="topic__section-title">相关文章</h2>
        <div class="topic__articles">
          <article v-for="a in longArticles" :key="a._id" class="topic__article-long" @click="goToArticle(a._id)">
            <div class="topic__article-body">
              <h3 class="topic__article-title">{{ a.title }}</h3>
              <div class="topic__article-author"><img :src="getAuthorAvatar(a.author, 24)" class="topic__author-avatar"><span>{{ a.author?.username }}</span><span>{{ formatDate(a.createdAt) }}</span></div>
              <p class="topic__article-excerpt">{{ getExcerpt(a) }}</p>
              <div class="topic__article-stats"><span>{{ a.likes || 0 }} 赞</span><span>{{ a.comments || 0 }} 评论</span></div>
            </div>
            <div class="topic__article-img" v-if="a.image"><img :src="a.image" :alt="a.title"></div>
          </article>
          <article v-for="a in shortArticles" :key="a._id" class="topic__article-short" @click="goToArticle(a._id)">
            <div class="topic__article-short-img" v-if="a.image"><img :src="a.image"><div class="topic__article-short-overlay">{{ a.likes }} 赞 {{ a.comments }} 评</div></div>
            <div class="topic__article-short-body"><h3>{{ a.title }}</h3><div class="topic__article-author"><img :src="getAuthorAvatar(a.author, 20)" style="width:20px;height:20px"><span>{{ a.author?.username }}</span></div></div>
          </article>
        </div>
        <div v-if="hasMore" style="text-align:center;margin-top:24px"><button class="btn btn-secondary" @click="loadMore">加载更多</button></div>
        <div v-if="!articles.length" class="empty-state"><span class="empty-state__icon">¶</span><p>暂无文章</p><button class="btn btn-primary" @click="createArticle">写第一篇</button></div>
      </template>
    </div>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'TopicDetail',
  data() { return { isLoading: true, error: null, topicData: {}, articles: [], page: 1, limit: 10, hasMore: true }; },
  computed: { longArticles() { return this.articles.filter(a => a.articleType === 'long' || !a.articleType); }, shortArticles() { return this.articles.filter(a => a.articleType === 'short'); } },
  mounted() { this.fetchTopicDetail(); },
  methods: {
    getAuthorAvatar,
    async fetchTopicDetail() { this.isLoading = true; this.error = null; try { const { id } = this.$route.params; const d = await this.$http.get(`/api/topics/${id}`); if (d.success) { this.topicData = d.data; this.articles = d.data.articles || []; this.hasMore = this.articles.length === this.limit; } else { this.error = d.message || '获取失败'; } } catch { this.error = '获取失败'; } finally { this.isLoading = false; } },
    async loadMore() { this.page++; try { const { id } = this.$route.params; const d = await this.$http.get(`/api/topics/${id}/articles?page=${this.page}&limit=${this.limit}`); if (d.success) { this.articles = [...this.articles, ...d.data]; this.hasMore = d.data.length === this.limit; } } catch {} },
    goToArticle(id) { this.$router.push(`/zhihu-detail/${id}`); },
    createArticle() { const { id } = this.$route.params; this.$router.push(`/create?topic=${id}&topicName=${encodeURIComponent(this.topicData.name || '')}`); },
    async toggleFollow() { const token = this.$store.getters.getToken; if (!token) { this.$router.replace('/login'); return; } try { const { id } = this.$route.params; const method = this.topicData.isFollowing ? 'delete' : 'post'; const d = await this.$http[method](`/api/topics/${id}/follow`); if (d.success) { this.topicData.isFollowing = !this.topicData.isFollowing; this.topicData.followersCount += this.topicData.isFollowing ? 1 : -1; } } catch {} },
    formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }); },
    getExcerpt(a) { if (a.excerpt) return a.excerpt; const c = (a.content || a.shortContent || '').replace(/<[^>]+>/g, ''); return c.length > 150 ? c.substring(0, 150) + '...' : c; }
  }
};
</script>

<style scoped>
.topic { min-height: 100vh; background: #faf8f5; }
.topic__container { max-width: 900px; margin: 0 auto; padding: 0 20px 80px; }
.topic__error { text-align: center; padding: 60px 20px; }
.topic__header { background: #fff; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.topic__cover { height: 180px; overflow: hidden; }
.topic__cover img { width: 100%; height: 100%; object-fit: cover; }
.topic__cover--placeholder { background: #1a1a1a; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; font-weight: 600; }
.topic__info { padding: 24px 0; }
.topic__name { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
.topic__desc { color: #6b7280; margin: 0 0 16px; line-height: 1.5; }
.topic__stats { display: flex; gap: 16px; font-size: 0.8rem; color: #9ca3af; margin-bottom: 16px; }
.topic__actions { display: flex; gap: 10px; }
.topic__section-title { font-size: 1.15rem; font-weight: 600; color: #1a1a1a; margin: 0 0 16px; }
.topic__articles { display: flex; flex-direction: column; gap: 12px; }
.topic__article-long { display: flex; gap: 16px; background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transition: all 0.2s; }
.topic__article-long:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.topic__article-body { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.topic__article-title { font-size: 1.05rem; font-weight: 600; color: #1a1a1a; margin: 0; }
.topic__article-author { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #9ca3af; }
.topic__author-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.topic__article-excerpt { font-size: 0.85rem; color: #6b7280; margin: 0; line-height: 1.5; }
.topic__article-stats { display: flex; gap: 12px; font-size: 0.75rem; color: #9ca3af; }
.topic__article-img { width: 140px; height: 100px; flex-shrink: 0; border-radius: 8px; overflow: hidden; }
.topic__article-img img { width: 100%; height: 100%; object-fit: cover; }
.topic__article-short { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.04); cursor: pointer; max-width: 280px; transition: all 0.2s; }
.topic__article-short:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.topic__article-short-img { position: relative; height: 160px; overflow: hidden; }
.topic__article-short-img img { width: 100%; height: 100%; object-fit: cover; }
.topic__article-short-overlay { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.5); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; }
.topic__article-short-body { padding: 10px; }
.topic__article-short-body h3 { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; margin: 0 0 6px; }
@media (max-width: 768px) { .topic__article-long { flex-direction: column; } .topic__article-img { width: 100%; height: 140px; } .topic__article-short { max-width: 100%; } .topic__container { padding: 0 12px 80px; } }
</style>
