<template>
  <div class="blog">
    <BlogBanner :search-keyword="searchKeyword" :is-mobile="isMobile" @update:searchKeyword="searchKeyword = $event" @search="fetchBlogs" />
    <BlogCategoryNav :current-category="currentCategory" :current-article-type="currentArticleType" @category-change="handleCategoryChange" @article-type-change="handleArticleTypeChange" />

    <div class="blog__container">
      <!-- Desktop carousel + recommend -->
      <div v-if="showRecommend" class="blog__recommend">
        <BlogCarousel :carousel-blogs="carouselBlogs" @open-modal="handleOpenModal" />
        <BlogRecommend :recommend-blogs="recommendBlogs" :is-refreshing="isRefreshingRecommend" @refresh="handleRefreshRecommend" @open-modal="handleOpenModal" />
      </div>

      <!-- Filter feedback -->
      <FilterFeedback v-if="hasFilter" :has-filter="hasFilter" :filter-name="filterDisplayName" @clear="handleClearFilter" />

      <!-- Error -->
      <ErrorDisplay v-if="error" :error="error" @retry="fetchBlogs" />

      <!-- Blog list -->
      <BlogListGrid v-else-if="blogList.length > 0" :blog-list="blogList" :is-loading-more="isLoadingMore" :no-more-blogs="noMoreBlogs" @open-modal="handleOpenModal" @like="handleLikeBlog" @bookmark="handleBookmarkBlog" @go-to-profile="handleGoToProfile" />

      <!-- Empty -->
      <BlogEmptyState v-else-if="!isLoading" :show-clear-search="!!searchKeyword" title="暂无博客文章" :description="emptyDescription" @clear-search="handleClearSearch" @retry="fetchBlogs" />
    </div>

    <BlogModal :visible="showModal" :blog="currentBlog" :is-mobile="isMobile" @close="handleCloseModal" @filter-by-tag="handleFilterByTag" />
    <BackToTop :visible="showBackToTop" @click="handleScrollToTop" />
  </div>
</template>

<script>
import BlogBanner from './BlogBanner.vue';
import BlogCategoryNav from './BlogCategoryNav.vue';
import BlogCarousel from './BlogCarousel.vue';
import BlogRecommend from './BlogRecommend.vue';
import BlogListGrid from './BlogListGrid.vue';
import BlogModal from './BlogModal.vue';
import FilterFeedback from './blog/FilterFeedback.vue';
import BlogEmptyState from './blog/BlogEmptyState.vue';
import BackToTop from './blog/BackToTop.vue';
import ErrorDisplay from './blog/ErrorDisplay.vue';
import { throttle } from '../utils/helpers';

const CATS = { all: '全部攻略', game: '游戏攻略', travel: '旅游攻略', food: '美食攻略', tech: '科技攻略', fitness: '健身攻略' };

export default {
  name: 'Blog',
  components: { BlogBanner, BlogCategoryNav, BlogCarousel, BlogRecommend, BlogListGrid, BlogModal, FilterFeedback, BlogEmptyState, BackToTop, ErrorDisplay },
  metaInfo: { title: '博客首页', meta: [{ name: 'description', content: '浏览最新博客文章' }, { name: 'keywords', content: '博客,攻略' }] },
  data() { return { currentCategory: 'all', currentArticleType: 'all', searchKeyword: '', isLoading: false, error: null, showModal: false, currentBlog: null, isMobile: window.innerWidth <= 768, blogList: [], currentPage: 1, pageSize: 10, hasMore: true, isLoadingMore: false, noMoreBlogs: false, carouselBlogs: [], recommendBlogs: [], isRefreshingRecommend: false, showBackToTop: false }; },

  computed: {
    showRecommend() { return !this.isMobile && this.currentCategory === 'all' && this.currentArticleType === 'all' && !this.searchKeyword; },
    hasFilter() { return this.currentCategory !== 'all' || this.currentArticleType !== 'all' || !!this.searchKeyword; },
    emptyDescription() { return this.searchKeyword ? `没有找到与"${this.searchKeyword}"相关的博客` : '稍后再来看看吧'; },
    filterDisplayName() {
      if (this.currentCategory === 'all') return '全部攻略';
      if (this.currentCategory.startsWith('tag-')) return `标签: ${this.currentCategory.replace('tag-', '')}`;
      return CATS[this.currentCategory] || this.currentCategory;
    }
  },

  mounted() {
    this.fetchBlogs();
    this.fetchHotBlogs(10).then(() => this.initCarouselAndRecommend());
    this._onScroll = throttle(() => {
      const st = window.scrollY || document.documentElement.scrollTop;
      this.showBackToTop = st > 300;
      if (this.hasMore && !this.isLoadingMore) {
        const dh = document.documentElement.scrollHeight;
        if (dh - (st + window.innerHeight) < 300) this.loadMore();
      }
    }, 150);
    window.addEventListener('scroll', this._onScroll, { passive: true });
  },

  beforeDestroy() { if (this._onScroll) window.removeEventListener('scroll', this._onScroll); },

  methods: {
    processBlogData(blog) {
      return {
        ...blog, id: blog._id || blog.id,
        date: blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('zh-CN') : '',
        title: blog.title || '无标题',
        image: blog.image || 'https://via.placeholder.com/300x200',
        author: blog.author && typeof blog.author === 'object' ? blog.author : { username: '未知作者' },
        comments: blog.comments || 0, likes: blog.likes || 0, views: blog.views || 0, tags: blog.tags || [], articleType: blog.articleType || 'long'
      };
    },
    hasFilterCondition() { return this.currentCategory !== 'all' || this.currentArticleType !== 'all' || !!this.searchKeyword; },

    async fetchBlogs(isAppend = false) {
      try {
        if (!isAppend) { this.currentPage = 1; this.blogList = []; this.hasMore = true; this.noMoreBlogs = false; }
        const params = { page: this.currentPage, limit: this.pageSize };
        if (this.hasFilterCondition()) {
          if (this.currentArticleType !== 'all') params.articleType = this.currentArticleType;
          if (this.currentCategory !== 'all' && !this.currentCategory.startsWith('tag-')) params.category = this.currentCategory;
          if (this.searchKeyword) params.keyword = this.searchKeyword;
        }
        const url = this.hasFilterCondition() ? '/api/blogs' : '/api/blogs/recommended';
        const r = await this.$http.get(url, { params, noAuth: true });
        if (r.success && Array.isArray(r.data)) {
          const processed = r.data.map(b => this.processBlogData(b)).filter(b => this.currentArticleType === 'all' || b.articleType === this.currentArticleType);
          if (isAppend) { const ids = new Set(this.blogList.map(b => b.id)); this.blogList = [...this.blogList, ...processed.filter(b => !ids.has(b.id))]; }
          else { this.blogList = processed; }
          const tp = r.totalPages || r.total_pages || 1;
          this.hasMore = this.currentPage < tp;
          this.noMoreBlogs = !this.hasMore;
          this.error = null;
        } else if (!isAppend) { this.blogList = []; }
      } catch (e) { this.error = e.message || '获取博客列表失败'; if (!isAppend) this.blogList = []; }
    },

    async fetchHotBlogs(limit = 10) {
      try { const r = await this.$http.get(`/api/blogs/hot?limit=${limit}`, { noAuth: true }); if (r.success) this.hotBlogs = r.data.map(b => ({ id: b._id, title: b.title, image: b.image || 'https://via.placeholder.com/300x200', author: b.author || { username: '未知作者' }, views: b.views || 0 })); } catch { this.hotBlogs = []; }
    },

    initCarouselAndRecommend() {
      if (this.hotBlogs.length > 0) { this.carouselBlogs = this.hotBlogs.slice(0, 6); this.recommendBlogs = this.hotBlogs.slice(0, 4); }
    },

    handleCategoryChange(v) { this.currentCategory = v; this.fetchBlogs(); },
    handleArticleTypeChange(v) { this.currentArticleType = v; this.fetchBlogs(); },
    handleClearSearch() { this.searchKeyword = ''; this.fetchBlogs(); },
    handleClearFilter() { this.currentCategory = 'all'; this.currentArticleType = 'all'; this.searchKeyword = ''; this.fetchBlogs(); },

    handleOpenModal(blog) { this.currentBlog = blog; this.showModal = true; document.body.style.overflow = 'hidden'; },
    handleCloseModal() { this.showModal = false; this.currentBlog = null; document.body.style.overflow = ''; },
    handleFilterByTag(tag) { this.currentCategory = `tag-${tag}`; this.fetchBlogs(); },

    async handleLikeBlog(blog) { try { const r = await this.$http.blogs[blog.isLiked ? 'unlike' : 'like'](blog.id); if (r.success) { blog.likes = r.data.likes; blog.isLiked = !blog.isLiked; } } catch {} },
    async handleBookmarkBlog(blog) { try { const r = await this.$http.blogs.bookmark(blog.id); if (r.success) { blog.bookmarks = (blog.bookmarks || 0) + 1; blog.isBookmarked = true; } } catch {} },
    handleGoToProfile(id) { this.$router.push(`/profile/${id}`).catch(() => {}); },
    handleScrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); },

    async handleRefreshRecommend() { if (this.isRefreshingRecommend) return; this.isRefreshingRecommend = true; try { const r = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true }); if (r.success) this.recommendBlogs = [...r.data].sort(() => Math.random() - 0.5).slice(0, 4).map(b => ({ id: b._id, title: b.title, image: b.image || 'https://via.placeholder.com/300x200', author: b.author || { username: '未知' }, views: b.views || 0 })); } catch {} finally { setTimeout(() => { this.isRefreshingRecommend = false; }, 500); } },

    async loadMore() { if (this.isLoadingMore || !this.hasMore) return; this.isLoadingMore = true; try { this.currentPage++; await this.fetchBlogs(true); } catch { this.currentPage--; } finally { this.isLoadingMore = false; } }
  }
};
</script>

<style scoped>
.blog { min-height: 100vh; background: #faf8f5; }
.blog__container { width: 92%; max-width: 1200px; margin: 0 auto; padding: 24px 0 40px; }
.blog__recommend { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }

@media (max-width: 768px) {
  .blog__recommend { grid-template-columns: 1fr; }
  .blog__container { padding: 16px 0 32px; }
}
</style>
