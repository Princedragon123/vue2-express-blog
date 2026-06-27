<template>
  <article class="detail">
    <div class="detail__container">
      <!-- Error -->
      <div v-if="error" class="detail__error">
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="fetchBlogDetail">重新加载</button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>

      <template v-else-if="blogData && Object.keys(blogData).length > 0">
        <!-- Header -->
        <header class="detail__header">
          <DetailHeader :category="blogData.category?.name || blogData.category" :topic="blogData.topic" :title="blogData.title" :author="blogData.author" :author-avatar="getAuthorAvatar(blogData.author, 48)" :post-date="blogData.date" @go-to-topic="goToTopicDetail" @follow="followAuthor" />
        </header>

        <!-- Content -->
        <section class="detail__body">
          <DetailContent :image="blogData.image" :title="blogData.title" :content="blogData.content" />
        </section>

        <!-- Desktop interaction -->
        <div class="detail__interaction" v-if="!isMobile">
          <InteractionBar :likes="blogData.likes" :comments="blogData.comments" :bookmarks="blogData.bookmarks" :is-bookmarked="isBookmarked" :show-share-menu="showShareMenu" @like="likeBlog" @toggle-bookmark="isBookmarked ? unbookmarkBlog() : bookmarkBlog()" @toggle-share="toggleShareMenu" @close-share="closeShareMenu" @share="handleShare" />
        </div>

        <!-- Comments -->
        <section class="detail__comments">
          <DetailCommentSection :comments="comments" :total-comments="blogData.comments" :is-loading="isLoading" :comment-input="commentInput" :reply-input="replyInput" :replying-to="replyingTo" user-avatar="https://via.placeholder.com/40" @update:commentInput="commentInput = $event" @update:replyInput="replyInput = $event" @submit-comment="submitComment" @toggle-reply="toggleReply" @submit-reply="submitReply" @cancel-reply="cancelReply" />
        </section>

        <!-- Related -->
        <section class="detail__related">
          <RelatedArticles :articles="relatedBlogs" @click="goToBlogDetail" />
        </section>
      </template>
    </div>

    <!-- Mobile bottom bar -->
    <div class="detail__mobile-bar" v-if="isMobile">
      <button class="detail__mobile-btn" :class="{ 'detail__mobile-btn--active': isLiked }" @click="likeBlog"><span>{{ isLiked ? '♥' : '♡' }}</span><span>{{ blogData.likes || 0 }}</span></button>
      <button class="detail__mobile-btn" @click="focusComments"><span>◎</span><span>{{ blogData.comments || 0 }}</span></button>
      <button class="detail__mobile-btn" :class="{ 'detail__mobile-btn--active': isBookmarked }" @click="isBookmarked ? unbookmarkBlog() : bookmarkBlog()"><span>{{ isBookmarked ? '◆' : '◇' }}</span><span>收藏</span></button>
      <button class="detail__mobile-btn" @click="toggleShareMenu"><span>↗</span><span>分享</span></button>
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
  metaInfo() { return { title: this.blogData?.title || '博客详情' }; },
  data() { return { blogId: this.$route.params.id, blogData: null, comments: [], commentInput: '', replyInput: '', replyingTo: null, isLoading: false, error: null, isBookmarked: false, isLiked: false, showShareMenu: false, isMobile: window.innerWidth <= 768, relatedBlogs: [] }; },
  created() { this.fetchBlogDetail(); this.fetchComments(); },
  watch: { '$route.params.id': { handler(id) { if (id) { this.blogId = id; this.fetchBlogDetail(); this.fetchComments(); } }, immediate: true } },
  methods: {
    getAuthorAvatar,
    async fetchBlogDetail() {
      this.isLoading = true; this.error = null;
      try {
        const cacheKey = `blog_detail_${this.blogId}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) { this.blogData = cached; }
        else {
          const r = await this.$http.get(`/api/blogs/${this.blogId}`);
          if (r.success) { this.blogData = r.data; CacheManager.set(cacheKey, r.data, 3600); }
          else { this.error = r.message || '获取博客详情失败'; }
        }
        await this.checkLikeStatus();
        this.addToHistory();
      } catch (e) { this.error = '获取博客详情失败'; }
      finally { this.isLoading = false; }
    },
    async checkLikeStatus() { if (!this.$store.getters.isLoggedIn) return; try { const r = await this.$http.blogs.checkLikeStatus(this.blogId); if (r.success) this.isLiked = r.data.isLiked; } catch {} },
    async addToHistory() { const id = this.blogData?._id || this.blogData?.id; if (id) try { await this.$http.history.add(id); } catch {} },
    async fetchComments() {
      try {
        const cacheKey = `blog_comments_${this.blogId}`;
        const cached = CacheManager.get(cacheKey);
        if (cached) { this.comments = cached; return; }
        const r = await this.$http.blogs.getComments(this.blogId);
        if (r.success) { this.comments = r.data; CacheManager.set(cacheKey, r.data, 300); }
      } catch {}
    },
    async submitComment() { if (!this.commentInput.trim()) return; try { const r = await this.$http.blogs.createComment(this.blogId, { content: this.commentInput }); if (r.success) { this.comments.unshift(r.data); this.blogData.comments = (this.blogData.comments || 0) + 1; this.commentInput = ''; } } catch (e) { showNotification(e.response?.status === 401 ? '请先登录' : '提交评论失败', 'error'); } },
    toggleReply(id) { this.replyingTo = this.replyingTo === id ? null : id; this.replyInput = ''; },
    cancelReply() { this.replyingTo = null; this.replyInput = ''; },
    async submitReply(commentId) { if (!this.replyInput.trim()) return; try { const r = await this.$http.blogs.createComment(this.blogId, { content: this.replyInput, parentId: commentId }); if (r.success) { const idx = this.comments.findIndex(c => c._id === commentId); if (idx !== -1) { if (!this.comments[idx].replies) this.comments[idx].replies = []; this.comments[idx].replies.push(r.data); } this.replyingTo = null; this.replyInput = ''; } } catch { showNotification('提交回复失败', 'error'); } },
    async likeBlog() { try { const api = this.isLiked ? 'unlike' : 'like'; const r = await this.$http.blogs[api](this.blogId); if (r.success) { this.blogData.likes += this.isLiked ? -1 : 1; this.isLiked = !this.isLiked; } } catch {} },
    async bookmarkBlog() { try { const r = await this.$http.blogs.bookmark(this.blogId); if (r.success) { this.isBookmarked = true; this.blogData.bookmarks = (this.blogData.bookmarks || 0) + 1; showNotification('收藏成功', 'success'); } } catch {} },
    async unbookmarkBlog() { try { const r = await this.$http.blogs.unbookmark(this.blogId); if (r.success) { this.isBookmarked = false; this.blogData.bookmarks = Math.max(0, (this.blogData.bookmarks || 1) - 1); showNotification('已取消收藏', 'success'); } } catch {} },
    async followAuthor() { if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; } const authorId = this.blogData.author?._id || this.blogData.author?.id; if (!authorId) { showNotification('作者信息不完整', 'error'); return; } try { await this.$http.users.follow(authorId); showNotification('关注成功', 'success'); } catch { showNotification('关注失败', 'error'); } },
    toggleShareMenu() { this.showShareMenu = !this.showShareMenu; },
    closeShareMenu() { this.showShareMenu = false; },
    handleShare(platform) {
      const handlers = {
        copy: () => navigator.clipboard.writeText(window.location.href).then(() => showNotification('链接已复制', 'success')),
        weibo: () => window.open(`https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`, '_blank'),
        qq: () => window.open(`https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`, '_blank')
      };
      if (handlers[platform]) handlers[platform]();
      this.closeShareMenu();
    },
    focusComments() { const el = document.querySelector('.detail__comments'); if (el) el.scrollIntoView({ behavior: 'smooth' }); },
    goToTopicDetail(id) { this.$router.push(`/topic/${id}`); },
    goToBlogDetail(id) { this.$router.push(`/zhihu-detail/${id}`); }
  }
};
</script>

<style scoped>
.detail { min-height: 100vh; background: #faf8f5; }
.detail__container { width: 92%; max-width: 800px; margin: 0 auto; padding: 32px 0 80px; }
.detail__error { text-align: center; padding: 60px 20px; }
.detail__error p { margin-bottom: 16px; color: #6b7280; }
.detail__header { margin-bottom: 32px; }
.detail__body { margin-bottom: 40px; }
.detail__comments { margin-bottom: 40px; }
.detail__related { border-top: 1px solid #e5e7eb; padding-top: 32px; }

/* Mobile bar */
.detail__mobile-bar { display: none; }
@media (max-width: 768px) {
  .detail__mobile-bar {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 52px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid #e5e7eb;
    justify-content: space-around;
    align-items: center;
    z-index: 500;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .detail__mobile-btn {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 4px 16px; border: none; background: none;
    color: #6b7280; font-size: 0.65rem; cursor: pointer;
    min-width: 48px; min-height: 44px;
    -webkit-tap-highlight-color: transparent;
  }
  .detail__mobile-btn--active { color: #e11d48; }
  .detail__mobile-btn span:first-child { font-size: 1.1rem; }
  .detail__container { padding-bottom: 60px; }
}
</style>
