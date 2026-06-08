<!-- TopicDetail.vue - 话题详情组件 -->
<template>
  <div class="topic-detail-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 加载失败提示 -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
        <button class="btn-primary" @click="fetchTopicDetail">重新加载</button>
      </div>
      
      <!-- 话题详情内容 -->
      <div v-else-if="topicData && Object.keys(topicData).length > 0">
        <!-- 话题头部 -->
        <div class="topic-header">
          <div class="container">
            <div class="topic-cover" v-if="topicData.coverImage">
              <img :src="topicData.coverImage" :alt="topicData.name" class="cover-img">
            </div>
            <div class="topic-cover" v-else>
              <div class="cover-placeholder">
                <svg-icon name="comments" :size="48"></svg-icon>
                <span>{{ topicData.name }}</span>
              </div>
            </div>
            
            <div class="topic-info">
              <h1 class="topic-name">{{ topicData.name }}</h1>
              <p class="topic-description">{{ topicData.description }}</p>
              <div class="topic-stats">
                <span class="stat-item">
                  <svg-icon name="user" :size="16"></svg-icon>
                  {{ topicData.followersCount }} 关注
                </span>
                <span class="stat-item">
                  <svg-icon name="fileText" :size="16"></svg-icon>
                  {{ topicData.articlesCount }} 文章
                </span>
                <span class="stat-item">
                  <svg-icon name="calendar" :size="16"></svg-icon>
                  {{ formatDate(topicData.createdAt) }}
                </span>
              </div>
              <div class="topic-actions">
                <button 
                  class="follow-btn" 
                  :class="{ active: topicData.isFollowing }"
                  @click="toggleFollow"
                >
                  {{ topicData.isFollowing ? '已关注' : '关注' }}
                </button>
                <button class="create-btn" @click="createArticle">
                  <svg-icon name="plus" :size="16"></svg-icon>
                  发布文章
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 话题文章列表 -->
        <div class="container">
          <h2 class="section-title">相关文章</h2>
          
          <!-- 文章列表 -->
          <div class="article-list">
            <!-- 长文章（知乎风格） -->
            <div 
              class="article-item article-item-long" 
              v-for="article in articles.filter(a => a.articleType === 'long' || !a.articleType)" 
              :key="article._id"
              @click="goToArticleDetail(article._id)"
            >
              <div class="article-content">
                <h2 class="article-title">{{ article.title }}</h2>
                <div class="article-author-info">
                  <img :src="getAuthorAvatar(article.author, 48)" :alt="article.author?.username" class="author-avatar">
                  <div class="author-details">
                    <span class="author-name">{{ article.author?.username }}</span>
                    <span class="article-meta-info">
                      {{ formatDate(article.createdAt) }} · {{ getReadTime(article) }} 阅读
                    </span>
                  </div>
                </div>
                <div class="article-excerpt">{{ getExcerpt(article) }}</div>
                <div class="article-bottom">
                  <div class="article-topics" v-if="article.topic">
                    <span class="topic-tag">{{ article.topic.name }}</span>
                  </div>
                  <div class="article-stats">
                    <span class="stat-item">
                      <svg-icon name="thumbsUp" :size="14"></svg-icon>
                      {{ article.likes || 0 }}
                    </span>
                    <span class="stat-item">
                      <svg-icon name="comment" :size="14"></svg-icon>
                      {{ article.comments || 0 }}
                    </span>
                    <span class="stat-item">
                      <svg-icon name="star" :size="14"></svg-icon>
                      {{ article.bookmarks || 0 }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="article-image" v-if="article.image">
                <img :src="article.image" :alt="article.title" class="article-img">
              </div>
            </div>
            
            <!-- 短文章（小红书风格） -->
            <div 
              class="article-item article-item-short" 
              v-for="article in articles.filter(a => a.articleType === 'short')" 
              :key="article._id"
              @click="goToArticleDetail(article._id)"
            >
              <div class="short-article-image" v-if="article.image">
                <img :src="article.image" :alt="article.title" class="short-article-img">
                <div class="short-article-stats">
                  <span class="stat-item">
                    <svg-icon name="heart" :size="14"></svg-icon>
                    {{ article.likes }}
                  </span>
                  <span class="stat-item">
                    <svg-icon name="comment" :size="14"></svg-icon>
                    {{ article.comments }}
                  </span>
                </div>
              </div>
              <div class="short-article-content">
                <h3 class="short-article-title">{{ article.title }}</h3>
                <div class="short-article-meta">
                  <span class="author-info">
                    <img :src="getAuthorAvatar(article.author, 48)" :alt="article.author?.username" class="author-avatar">
                    {{ article.author?.username }}
                  </span>
                  <span class="article-date">{{ formatDate(article.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <button class="btn-primary" @click="loadMore">加载更多</button>
          </div>
          
          <!-- 无文章提示 -->
          <div v-if="articles.length === 0" class="empty-state">
            <svg-icon name="fileText" :size="48"></svg-icon>
            <p>暂无相关文章</p>
            <button class="btn-primary" @click="createArticle">发布第一篇文章</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'TopicDetail',
  components: {
  },
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
  mounted() {
    this.fetchTopicDetail();
  },
  methods: {
    // 获取作者头像URL
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    async fetchTopicDetail() {
      try {
        this.isLoading = true;
        this.error = null;
        
        const { id } = this.$route.params;
        currentTextAnim
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
    async fetchArticles() {
      try {
        const { id } = this.$route.params;
        const data = await this.$http.get(`/api/topics/${id}/articles?page=${this.page}&limit=${this.limit}`);
        
        if (data.success) {
          if (this.page === 1) {
            this.articles = data.data;
          } else {
            this.articles = [...this.articles, ...data.data];
          }
          this.hasMore = data.data.length === this.limit;
        }
      } catch (error) {
        console.error('获取话题文章失败:', error);
      }
    },
    loadMore() {
      this.page += 1;
      this.fetchArticles();
    },
    goToArticleDetail(articleId) {
      this.$router.push(`/zhihu-detail/${articleId}`);
    },
    createArticle() {
      const { id } = this.$route.params;
      const topicName = this.topicData.name;
      this.$router.push(`/create?topic=${id}&topicName=${encodeURIComponent(topicName)}`);
    },
    async toggleFollow() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const { id } = this.$route.params;
        let data;
        if (this.topicData.isFollowing) {
          data = await this.$http.delete(`/api/topics/${id}/follow`);
        } else {
          data = await this.$http.post(`/api/topics/${id}/follow`);
        }
        
        if (data.success) {
          this.topicData.isFollowing = !this.topicData.isFollowing;
          this.topicData.followersCount += this.topicData.isFollowing ? 1 : -1;
        } else {
          console.error('关注操作失败:', data.message);
        }
      } catch (error) {
        console.error('关注话题失败:', error);
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    getExcerpt(article) {
      if (article.excerpt) {
        return article.excerpt;
      }
      
      const content = article.content || article.shortContent || '';
      const plainText = content.replace(/<[^>]+>/g, '');
      return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    },
    getReadTime(article) {
      const content = article.content || article.shortContent || '';
      const plainText = content.replace(/<[^>]+>/g, '');
      const wordCount = plainText.length;
      const readTime = Math.ceil(wordCount / 300); // 假设每分钟阅读300字
      return readTime;
    }
  }
};
</script>

<style scoped>
/* 话题详情页面 */
.topic-detail-page {
  min-height: 100vh;
  background-color: #fafafa;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #8e8e8e;
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

/* 错误提示 */
.error-message {
  text-align: center;
  padding: 60px 0;
  color: #8e8e8e;
}

.error-message p {
  margin-bottom: 16px;
  font-size: 1.1rem;
}

/* 话题头部 */
.topic-header {
  background-color: white;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.topic-cover {
  height: 200px;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b9d 0%, #4ecdc4 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 20px;
}

.cover-placeholder i {
  font-size: 48px;
  margin-bottom: 16px;
}

.cover-placeholder span {
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.topic-info {
  padding: 30px 0;
}

.topic-name {
  margin: 0 0 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.topic-description {
  margin: 0 0 20px;
  font-size: 1rem;
  color: #666;
  line-height: 1.5;
}

.topic-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #8e8e8e;
}

.stat-item i {
  font-size: 1.1rem;
}

.topic-actions {
  display: flex;
  gap: 12px;
}

.follow-btn {
  padding: 10px 24px;
  border: 1px solid #ff6b9d;
  border-radius: 24px;
  background-color: white;
  font-size: 1rem;
  font-weight: 600;
  color: #ff6b9d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background-color: #ff6b9d;
  color: white;
}

.follow-btn.active {
  background-color: #ff6b9d;
  color: white;
}

.create-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 24px;
  background-color: #4ecdc4;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-btn:hover {
  background-color: #45b7aa;
  transform: translateY(-2px);
}

/* 文章列表 */
.section-title {
  margin: 0 0 24px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.article-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* 长文章（知乎风格） */
.article-item-long {
  grid-column: 1 / -1;
  display: flex;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 24px;
  margin-bottom: 16px;
}

.article-item-long:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.article-content {
  flex: 1;
  margin-right: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1a1a1a;
}

.article-meta-info {
  font-size: 0.85rem;
  color: #8e8e8e;
}

.article-excerpt {
  margin: 0;
  font-size: 1.05rem;
  color: #444;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.article-topics {
  display: flex;
  gap: 8px;
}

.topic-tag {
  display: inline-block;
  background-color: #f0f0f0;
  color: #666;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.article-stats {
  display: flex;
  gap: 24px;
  align-items: center;
}

.article-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #8e8e8e;
  transition: color 0.3s ease;
}

.article-stats .stat-item:hover {
  color: #1a1a1a;
}

.article-image {
  width: 200px;
  height: 140px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 6px;
}

.article-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-item-long:hover .article-img {
  transform: scale(1.05);
}

/* 短文章（小红书风格） */
.article-item-short {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  max-width: 300px;
  margin: 0 auto;
}

.article-item-short:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.short-article-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.short-article-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-item-short:hover .short-article-img {
  transform: scale(1.05);
}

.short-article-stats {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px 12px;
  border-radius: 16px;
  color: white;
  font-size: 0.8rem;
}

.short-article-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.short-article-content {
  padding: 12px;
}

.short-article-title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.short-article-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #8e8e8e;
}

.short-article-meta .article-date {
  margin: 0;
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-bottom: 30px;
}

.btn-primary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #ff6b9d;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #ff528b;
  transform: translateY(-2px);
}

/* 无文章提示 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #8e8e8e;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0 0 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .topic-cover {
    height: 150px;
  }
  
  .topic-name {
    font-size: 1.5rem;
  }
  
  .topic-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .topic-actions {
    flex-direction: column;
  }
  
  .follow-btn,
  .create-btn {
    width: fit-content;
  }
  
  .article-item {
    flex-direction: column;
  }
  
  .article-image {
    width: 100%;
    height: 150px;
  }
  
  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .article-date {
    margin: 0;
  }
}
</style>