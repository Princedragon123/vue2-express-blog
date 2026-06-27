<template>
  <article class="detail-page" aria-label="博客详情">
    <main class="detail-page__main" role="main">
      <div class="detail-page__container">
        <!-- 错误/加载状态 -->
        <div v-if="error" class="detail-page__error">
          <p>{{ error }}</p>
          <button class="btn btn--primary" @click="fetchBlogDetail">重新加载</button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <template v-else-if="blogData && Object.keys(blogData).length > 0">
          <!-- 文章头部 -->
          <header class="detail-page__header">
            <DetailHeader
              :category="blogData.category?.name || blogData.category"
              :topic="blogData.topic"
              :title="blogData.title"
              :author="blogData.author"
              :author-avatar="getAuthorAvatar(blogData.author, 50)"
              :post-date="blogData.date"
              @go-to-topic="goToTopicDetail"
              @follow="followAuthor"
            />
          </header>

          <!-- 文章内容 -->
          <section class="detail-page__content">
            <DetailContent
              :image="blogData.image"
              :title="blogData.title"
              :content="blogData.content"
            />
          </section>

          <!-- 评论区域 -->
          <section class="detail-page__comments" aria-label="评论区域">
            <DetailCommentSection
              :comments="comments"
              :total-comments="blogData.comments"
              :is-loading="isLoading"
              :comment-input="commentInput"
              :reply-input="replyInput"
              :replying-to="replyingTo"
              user-avatar="https://via.placeholder.com/40"
              @update:commentInput="commentInput = $event"
              @update:replyInput="replyInput = $event"
              @submit-comment="submitComment"
              @toggle-reply="toggleReply"
              @submit-reply="submitReply"
              @cancel-reply="cancelReply"
            />
          </section>

          <!-- 相关推荐 -->
          <section class="detail-page__related" aria-label="相关文章">
            <RelatedArticles
              :articles="relatedBlogs"
              @click="goToBlogDetail"
            />
          </section>
        </template>
      </div>
    </main>

    <!-- 移动端底部互动栏（固定在底部） -->
    <div class="detail-page__mobile-bar" v-if="isMobile">
      <button class="mobile-bar__btn" @click="likeBlog" :class="{ 'mobile-bar__btn--active': isLiked }">
        <span>{{ isLiked ? '❤️' : '🤍' }}</span>
        <span>{{ blogData.likes || 0 }}</span>
      </button>
      <button class="mobile-bar__btn" @click="focusCommentInput">
        <span>💬</span>
        <span>{{ blogData.comments || 0 }}</span>
      </button>
      <button class="mobile-bar__btn" @click="isBookmarked ? unbookmarkBlog() : bookmarkBlog()" :class="{ 'mobile-bar__btn--active': isBookmarked }">
        <span>{{ isBookmarked ? '🔖' : '🏷️' }}</span>
        <span>{{ isBookmarked ? '已收藏' : '收藏' }}</span>
      </button>
      <button class="mobile-bar__btn" @click="toggleShareMenu">
        <span>📤</span>
        <span>分享</span>
      </button>
    </div>

    <!-- 桌面端互动栏 -->
    <div class="detail-page__desktop-bar" v-if="!isMobile">
      <section class="interaction-section" aria-label="互动区域">
        <InteractionBar
          :likes="blogData.likes"
          :comments="blogData.comments"
          :bookmarks="blogData.bookmarks"
          :is-bookmarked="isBookmarked"
          :show-share-menu="showShareMenu"
          @like="likeBlog"
          @toggle-bookmark="isBookmarked ? unbookmarkBlog() : bookmarkBlog()"
          @toggle-share="toggleShareMenu"
          @close-share="closeShareMenu"
          @share="handleShare"
        />
      </section>
    </div>
  </article>
</template>

<script>
import CacheManager from '../utils/cache';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';
import InteractionBar from './detail/InteractionBar.vue';
import DetailCommentSection from './detail/DetailCommentSection.vue';
import RelatedArticles from './detail/RelatedArticles.vue';
import DetailHeader from './detail/DetailHeader.vue';
import DetailContent from './detail/DetailContent.vue';

export default {
  name: 'Detail',
  components: { InteractionBar, DetailCommentSection, RelatedArticles, DetailHeader, DetailContent },

  metaInfo() {
    return {
      title: this.blogData.title || '博客详情',
      meta: [
        { name: 'description', content: (this.blogData.content || '').substring(0, 100) + '...' },
        { name: 'keywords', content: [this.blogData.title, this.blogData.category, this.blogData.author].filter(Boolean).join(',') }
      ]
    };
  },

  data() {
    return {
      blogId: this.$route.params.id || 1,
      blogData: null,
      comments: [],
      commentInput: '',
      replyInput: '',
      replyingTo: null,
      isLoading: false,
      error: null,
      isBookmarked: false,
      isLiked: false,
      showShareMenu: false,
      isMobile: false,
      relatedBlogs: []
    };
  },

  created() {
    this.isMobile = window.innerWidth <= 768;
    this.fetchBlogDetail();
    this.fetchComments();
  },

  watch: {
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.blogId = newId;
          this.fetchBlogDetail();
          this.fetchComments();
        }
      },
      immediate: true
    }
  },

  methods: {
    getAuthorAvatar,

    async fetchBlogDetail() {
      try {
        this.isLoading = true;
        this.error = null;

        const cacheKey = `blog_detail_${this.blogId}`;
        const cachedData = CacheManager.get(cacheKey);

        if (cachedData) {
          this.blogData = cachedData;
        } else {
          const response = await this.$http.get(`/api/blogs/${this.blogId}`);
          if (response.success) {
            this.blogData = response.data;
            CacheManager.set(cacheKey, response.data, 3600);
          } else {
            this.error = response.message || '获取博客详情失败';
          }
        }

        await this.checkLikeStatus();
        this.addToHistory();
      } catch (error) {
        console.error('获取博客详情失败:', error);
        this.error = '获取博客详情失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },

    async checkLikeStatus() {
      if (!this.$store.getters.isLoggedIn) { this.isLiked = false; return; }
      try {
        const response = await this.$http.blogs.checkLikeStatus(this.blogId);
        if (response.success) this.isLiked = response.data.isLiked;
      } catch { /* 静默失败 */ }
    },

    async addToHistory() {
      const blogId = this.blogData?._id || this.blogData?.id;
      if (!blogId) return;
      try { await this.$http.history.add(blogId); } catch { /* 静默失败 */ }
    },

    async fetchComments() {
      try {
        const cacheKey = `blog_comments_${this.blogId}`;
        const cachedData = CacheManager.get(cacheKey);
        if (cachedData) {
          this.comments = cachedData;
          return;
        }
        const result = await this.$http.blogs.getComments(this.blogId);
        if (result.success) {
          this.comments = result.data;
          CacheManager.set(cacheKey, result.data, 300);
        }
      } catch (error) {
        console.error('获取评论失败:', error);
      }
    },

    async submitComment() {
      if (!this.commentInput.trim()) return;
      try {
        const result = await this.$http.blogs.createComment(this.blogId, { content: this.commentInput });
        if (result.success) {
          this.comments.unshift(result.data);
          this.blogData.comments = (this.blogData.comments || 0) + 1;
          this.commentInput = '';
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        showNotification(error.response?.status === 401 ? '请先登录' : '提交评论失败', 'error');
      }
    },

    toggleReply(commentId) {
      this.replyingTo = this.replyingTo === commentId ? null : commentId;
      this.replyInput = '';
    },
    cancelReply() { this.replyingTo = null; this.replyInput = ''; },

    async submitReply(commentId) {
      if (!this.replyInput.trim()) return;
      try {
        const result = await this.$http.blogs.createComment(this.blogId, {
          content: this.replyInput,
          parentId: commentId
        });
        if (result.success) {
          const idx = this.comments.findIndex(c => c._id === commentId);
          if (idx !== -1) {
            if (!this.comments[idx].replies) this.comments[idx].replies = [];
            this.comments[idx].replies.push(result.data);
          }
          this.replyingTo = null;
          this.replyInput = '';
        }
      } catch (error) {
        console.error('回复失败:', error);
        showNotification('提交回复失败', 'error');
      }
    },

    async likeBlog() {
      try {
        const api = this.isLiked ? 'unlike' : 'like';
        const result = await this.$http.blogs[api](this.blogId);
        if (result.success) {
          this.blogData.likes += this.isLiked ? -1 : 1;
          this.isLiked = !this.isLiked;
        }
      } catch (error) {
        console.error('点赞失败:', error);
        showNotification('操作失败', 'error');
      }
    },

    async bookmarkBlog() {
      try {
        const result = await this.$http.blogs.bookmark(this.blogId);
        if (result.success) {
          this.isBookmarked = true;
          this.blogData.bookmarks = (this.blogData.bookmarks || 0) + 1;
          showNotification('收藏成功', 'success');
        }
      } catch (error) {
        showNotification('收藏失败', 'error');
      }
    },

    async unbookmarkBlog() {
      try {
        const result = await this.$http.blogs.unbookmark(this.blogId);
        if (result.success) {
          this.isBookmarked = false;
          this.blogData.bookmarks = Math.max(0, (this.blogData.bookmarks || 1) - 1);
          showNotification('已取消收藏', 'success');
        }
      } catch (error) {
        showNotification('操作失败', 'error');
      }
    },

    async followAuthor() {
      if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; }
      const authorId = this.blogData.author?._id || this.blogData.author?.id;
      if (!authorId) { showNotification('作者信息不完整', 'error'); return; }
      try {
        const result = await this.$http.users.follow(authorId);
        showNotification(result.success ? '关注成功' : (result.message || '关注失败'), result.success ? 'success' : 'error');
      } catch {
        showNotification('关注失败，请重试', 'error');
      }
    },

    toggleShareMenu() { this.showShareMenu = !this.showShareMenu; },
    closeShareMenu() { this.showShareMenu = false; },

    handleShare(platform) {
      const handlers = {
        weibo: () => window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`, '_blank', 'width=600,height=400'),
        copy: () => navigator.clipboard.writeText(window.location.href).then(() => showNotification('链接已复制', 'success')).catch(() => showNotification('复制失败', 'error')),
        qq: () => window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`, '_blank', 'width=600,height=400'),
        private: () => {
          sessionStorage.setItem('blogShareInfo', JSON.stringify({ title: this.blogData.title, link: window.location.href, image: this.blogData.image }));
          this.$router.push('/messages');
        }
      };
      if (handlers[platform]) handlers[platform]();
      this.closeShareMenu();
    },

    focusCommentInput() {
      // 滚动到评论区并聚焦输入框
      const commentsSection = document.querySelector('.detail-page__comments');
      if (commentsSection) commentsSection.scrollIntoView({ behavior: 'smooth' });
      // 触发评论输入框聚焦（通过子组件事件）
    },

    goToTopicDetail(topicId) { this.$router.push(`/topic/${topicId}`); },
    goToBlogDetail(blogId) { this.$router.push(`/zhihu-detail/${blogId}`); }
  }
};
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.detail-page__main {
  padding-bottom: 80px;
}

.detail-page__container {
  width: 95%;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
}

.detail-page__error {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.detail-page__error p {
  margin-bottom: 16px;
}

/* 移动端底部互动栏 */
.detail-page__mobile-bar {
  display: none;
}

.detail-page__desktop-bar {
  display: block;
}

/* 移动端底部固定栏 */
@media (max-width: 768px) {
  .detail-page__mobile-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(236, 72, 153, 0.1);
    justify-content: space-around;
    align-items: center;
    z-index: 500;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .mobile-bar__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 16px;
    border: none;
    background: none;
    color: #666;
    font-size: 0.7rem;
    cursor: pointer;
    min-width: 48px;
    min-height: 44px;
    transition: all 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-bar__btn:active { transform: scale(0.92); }
  .mobile-bar__btn--active { color: #ec4899; }

  .detail-page__desktop-bar { display: none; }
  .detail-page__container { padding-bottom: 60px; }
}

@media (min-width: 769px) {
  .detail-page__container { padding: 32px 0; }
}
</style>
