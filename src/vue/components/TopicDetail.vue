<template>
  <div class="topic-detail-page">
    <main class="topic-detail-page__main">
      <!-- 加载 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn--primary" @click="fetchTopicDetail">重新加载</button>
      </div>

      <!-- 内容 -->
      <template v-else-if="topicData && Object.keys(topicData).length > 0">
        <!-- 话题头部 -->
        <header class="topic-detail-page__header">
          <div class="topic-detail-page__container">
            <div class="topic-cover" v-if="topicData.coverImage">
              <img :src="topicData.coverImage" :alt="topicData.name" class="topic-cover__img">
            </div>
            <div class="topic-cover topic-cover--placeholder" v-else>
              <span class="topic-cover__icon">💬</span>
              <span class="topic-cover__name">{{ topicData.name }}</span>
            </div>

            <div class="topic-info">
              <h1 class="topic-info__name">{{ topicData.name }}</h1>
              <p class="topic-info__desc">{{ topicData.description }}</p>
              <div class="topic-info__stats">
                <span>👥 {{ topicData.followersCount }} 关注</span>
                <span>📄 {{ topicData.articlesCount }} 文章</span>
                <span>📅 {{ formatDate(topicData.createdAt) }}</span>
              </div>
              <div class="topic-info__actions">
                <button class="follow-btn" :class="{ 'follow-btn--active': topicData.isFollowing }" @click="toggleFollow">
                  {{ topicData.isFollowing ? '已关注' : '+ 关注' }}
                </button>
                <button class="create-btn" @click="createArticle">✏️ 发布文章</button>
              </div>
            </div>
          </div>
        </header>

        <!-- 文章列表 -->
        <div class="topic-detail-page__container">
          <h2 class="section-title">相关文章</h2>

          <div class="article-list">
            <!-- 长文章 -->
            <article
              class="article-long"
              v-for="article in longArticles"
              :key="article._id"
              @click="goToArticleDetail(article._id)"
            >
              <div class="article-long__content">
                <h2 class="article-long__title">{{ article.title }}</h2>
                <div class="article-long__author">
                  <img :src="getAuthorAvatar(article.author, 36)" class="author-avatar" alt="">
                  <span>{{ article.author?.username }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatDate(article.createdAt) }}</span>
                </div>
                <p class="article-long__excerpt">{{ getExcerpt(article) }}</p>
                <div class="article-long__stats">
                  <span>👍 {{ article.likes || 0 }}</span>
                  <span>💬 {{ article.comments || 0 }}</span>
                  <span>⭐ {{ article.bookmarks || 0 }}</span>
                </div>
              </div>
              <div class="article-long__image" v-if="article.image">
                <img :src="article.image" :alt="article.title">
              </div>
            </article>

            <!-- 短文章 -->
            <article
              class="article-short"
              v-for="article in shortArticles"
              :key="article._id"
              @click="goToArticleDetail(article._id)"
            >
              <div class="article-short__image" v-if="article.image">
                <img :src="article.image" :alt="article.title">
                <div class="article-short__overlay">
                  <span>❤️ {{ article.likes }}</span>
                  <span>💬 {{ article.comments }}</span>
                </div>
              </div>
              <div class="article-short__body">
                <h3 class="article-short__title">{{ article.title }}</h3>
                <div class="article-short__meta">
                  <img :src="getAuthorAvatar(article.author, 24)" class="author-avatar-sm" alt="">
                  <span>{{ article.author?.username }}</span>
                  <span>{{ formatDate(article.createdAt) }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="hasMore" class="load-more">
            <button class="btn btn--primary" @click="loadMore">加载更多</button>
          </div>

          <div v-if="articles.length === 0" class="empty-state">
            <span class="empty-state__icon">📄</span>
            <p>暂无相关文章</p>
            <button class="btn btn--primary" @click="createArticle">发布第一篇文章</button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'TopicDetail',

  data() {
    return {
      isLoading: true,
      error: null,
      topicData: {},
      articles: [],
      page: 1,
      limit: 10,
      hasMore: true
    };
  },

  computed: {
    longArticles() {
      return this.articles.filter(a => a.articleType === 'long' || !a.articleType);
    },
    shortArticles() {
      return this.articles.filter(a => a.articleType === 'short');
    }
  },

  mounted() {
    this.fetchTopicDetail();
  },

  methods: {
    getAuthorAvatar,

    async fetchTopicDetail() {
      this.isLoading = true;
      this.error = null;
      try {
        const { id } = this.$route.params;
        const data = await this.$http.get(`/api/topics/${id}`);
        if (data.success) {
          this.topicData = data.data;
          this.articles = data.data.articles || [];
          this.hasMore = this.articles.length === this.limit;
        } else {
          this.error = data.message || '获取话题详情失败';
        }
      } catch (error) {
        console.error('获取话题详情失败:', error);
        this.error = '获取话题详情失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },

    async loadMore() {
      this.page += 1;
      try {
        const { id } = this.$route.params;
        const data = await this.$http.get(`/api/topics/${id}/articles?page=${this.page}&limit=${this.limit}`);
        if (data.success) {
          this.articles = [...this.articles, ...data.data];
          this.hasMore = data.data.length === this.limit;
        }
      } catch (error) {
        console.error('加载更多失败:', error);
      }
    },

    goToArticleDetail(id) { this.$router.push(`/zhihu-detail/${id}`); },

    createArticle() {
      const { id } = this.$route.params;
      this.$router.push(`/create?topic=${id}&topicName=${encodeURIComponent(this.topicData.name || '')}`);
    },

    async toggleFollow() {
      const token = this.$store.getters.getToken;
      if (!token) { this.$router.replace('/login'); return; }
      try {
        const { id } = this.$route.params;
        const method = this.topicData.isFollowing ? 'delete' : 'post';
        const data = await this.$http[method](`/api/topics/${id}/follow`);
        if (data.success) {
          this.topicData.isFollowing = !this.topicData.isFollowing;
          this.topicData.followersCount += this.topicData.isFollowing ? 1 : -1;
        }
      } catch (error) {
        console.error('关注操作失败:', error);
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },

    getExcerpt(article) {
      if (article.excerpt) return article.excerpt;
      const content = article.content || article.shortContent || '';
      const plain = content.replace(/<[^>]+>/g, '');
      return plain.length > 150 ? plain.substring(0, 150) + '...' : plain;
    }
  }
};
</script>

<style scoped>
.topic-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.topic-detail-page__main { padding-bottom: 60px; }
.topic-detail-page__container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }

/* 话题头部 */
.topic-detail-page__header {
  background: #fff;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.topic-cover { height: 200px; overflow: hidden; }
.topic-cover__img { width: 100%; height: 100%; object-fit: cover; }
.topic-cover--placeholder {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #fff; gap: 12px;
}
.topic-cover__icon { font-size: 2.5rem; }
.topic-cover__name { font-size: 1.3rem; font-weight: 600; }

.topic-info { padding: 24px 0; }
.topic-info__name { margin: 0 0 8px; font-size: 1.8rem; font-weight: 700; color: #1f2937; }
.topic-info__desc { margin: 0 0 16px; color: #6b7280; line-height: 1.5; }
.topic-info__stats { display: flex; gap: 20px; margin-bottom: 20px; font-size: 0.9rem; color: #9ca3af; }
.topic-info__actions { display: flex; gap: 12px; }

.follow-btn {
  padding: 10px 28px; border-radius: 24px; border: 1.5px solid #ec4899;
  background: #fff; color: #ec4899; font-weight: 600; cursor: pointer;
  transition: all 0.25s ease;
}
.follow-btn:hover,
.follow-btn--active { background: #ec4899; color: #fff; }

.create-btn {
  padding: 10px 28px; border-radius: 24px; border: none;
  background: linear-gradient(135deg, #10b981, #059669); color: #fff;
  font-weight: 600; cursor: pointer; transition: all 0.25s ease;
}
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }

/* 文章列表 */
.section-title { font-size: 1.3rem; font-weight: 600; color: #1f2937; margin: 0 0 20px; }

.article-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

/* 长文章 */
.article-long {
  display: flex; gap: 20px;
  background: #fff; border-radius: 12px; padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer; transition: all 0.25s ease;
}
.article-long:hover { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }
.article-long__content { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.article-long__title { margin: 0; font-size: 1.2rem; font-weight: 600; color: #1f2937; }
.article-long__author { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #9ca3af; }
.author-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.author-avatar-sm { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; }
.dot { color: #d1d5db; }
.article-long__excerpt { margin: 0; font-size: 0.9rem; color: #6b7280; line-height: 1.5; }
.article-long__stats { display: flex; gap: 16px; font-size: 0.85rem; color: #9ca3af; }
.article-long__image { width: 160px; height: 110px; flex-shrink: 0; border-radius: 8px; overflow: hidden; }
.article-long__image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.article-long:hover .article-long__image img { transform: scale(1.05); }

/* 短文章 */
.article-short {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); cursor: pointer;
  transition: all 0.25s ease; max-width: 300px;
}
.article-short:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1); }
.article-short__image { position: relative; height: 180px; overflow: hidden; }
.article-short__image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.article-short:hover .article-short__image img { transform: scale(1.05); }
.article-short__overlay {
  position: absolute; bottom: 8px; left: 8px;
  display: flex; gap: 8px; background: rgba(0,0,0,0.5);
  padding: 4px 10px; border-radius: 12px; color: #fff; font-size: 0.75rem;
}
.article-short__body { padding: 12px; }
.article-short__title { margin: 0 0 6px; font-size: 0.95rem; font-weight: 600; color: #1f2937; }
.article-short__meta { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #9ca3af; }

/* 状态 */
.loading-state, .error-state, .empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
.load-more { text-align: center; margin-bottom: 30px; }
.spinner {
  width: 40px; height: 40px; border: 3px solid #f3f3f3;
  border-top-color: #ec4899; border-radius: 50%;
  animation: spin 0.8s linear infinite; margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .topic-cover { height: 140px; }
  .topic-info__name { font-size: 1.4rem; }
  .topic-info__stats { flex-wrap: wrap; gap: 10px; }
  .topic-info__actions { flex-direction: column; }
  .article-long { flex-direction: column; padding: 16px; }
  .article-long__image { width: 100%; height: 160px; }
  .article-short { max-width: 100%; }
}
</style>
