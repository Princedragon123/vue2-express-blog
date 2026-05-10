<template>
  <article class="blog-page" aria-label="博客页面">
    <BlogBanner
      :search-keyword="searchKeyword"
      :is-mobile="isMobile"
      @update:searchKeyword="searchKeyword = $event"
      @search="fetchBlogs"
    />

    <BlogCategoryNav
      :current-category="currentCategory"
      :current-article-type="currentArticleType"
      @category-change="handleCategoryChange"
      @article-type-change="handleArticleTypeChange"
    />

    <main class="blog-page__main" role="main">
      <div class="blog-page__container container">
        <section
          v-if="showRecommendSection"
          class="blog-page__recommend recommend-section"
          aria-label="热门推荐"
        >
          <BlogCarousel
            :carousel-blogs="carouselBlogs"
            @open-modal="handleOpenModal"
          />
          <BlogRecommend
            :recommend-blogs="recommendBlogs"
            :is-refreshing="isRefreshingRecommend"
            @refresh="handleRefreshRecommend"
            @open-modal="handleOpenModal"
          />
        </section>

        <div class="blog-page__list blog-list-container">
          <PullRefresh
            :is-mobile="isMobile"
            :is-refreshing="isRefreshing"
            :pull-distance="pullDistance"
            :is-pulling="isPulling"
            :pull-threshold="pullThreshold"
          />

          <FilterFeedback
            :has-filter="hasFilter"
            :filter-name="getFilterName()"
            @clear="handleClearFilter"
          />

          <ErrorDisplay
            v-if="error"
            :error="error"
            @retry="fetchBlogs"
          />

          <BlogListGrid
            v-else-if="blogList.length > 0"
            :blog-list="blogList"
            :is-loading-more="isLoadingMore"
            :no-more-blogs="noMoreBlogs"
            @open-modal="handleOpenModal"
            @like="handleLikeBlog"
            @bookmark="handleBookmarkBlog"
            @go-to-profile="handleGoToProfile"
          />

          <BlogEmptyState
            v-else-if="!isLoading"
            :show-clear-search="!!searchKeyword"
            :title="'暂无博客文章'"
            :description="searchKeyword ? `没有找到与\"${searchKeyword}\"相关的博客` : '稍后再来看看吧'"
            @clear-search="handleClearSearch"
            @retry="fetchBlogs"
          />
        </div>
      </div>
    </main>

    <BlogModal
      :visible="showModal"
      :blog="currentBlog"
      :is-mobile="isMobile"
      @close="handleCloseModal"
      @filter-by-tag="handleFilterByTag"
    />

    <BackToTop
      :visible="showBackToTop"
      @click="handleScrollToTop"
    />
  </article>
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
import PullRefresh from './blog/PullRefresh.vue';
import BackToTop from './blog/BackToTop.vue';
import ErrorDisplay from './blog/ErrorDisplay.vue';
import { getAuthorAvatar } from '../utils/avatarUtils';

const CATEGORY_NAMES = {
  all: '全部攻略',
  game: '游戏攻略',
  travel: '旅游攻略',
  food: '美食攻略',
  tech: '科技攻略',
  fitness: '健身攻略'
};

export default {
  name: 'Blog',

  components: {
    BlogBanner,
    BlogCategoryNav,
    BlogCarousel,
    BlogRecommend,
    BlogListGrid,
    BlogModal,
    FilterFeedback,
    BlogEmptyState,
    PullRefresh,
    BackToTop,
    ErrorDisplay
  },

  metaInfo: {
    title: '博客首页',
    meta: [
      { name: 'description', content: '浏览最新博客文章，发现感兴趣的内容' },
      { name: 'keywords', content: '博客首页，最新文章，热门博客' }
    ]
  },

  data() {
    return {
      currentCategory: 'all',
      currentArticleType: 'all',
      searchKeyword: '',
      isLoading: false,
      error: null,
      showModal: false,
      currentBlog: null,
      isMobile: false,
      isPulling: false,
      pullDistance: 0,
      pullThreshold: 80,
      isRefreshing: false,
      touchStartY: 0,
      blogList: [],
      currentPage: 1,
      pageSize: 10,
      totalBlogs: 0,
      hasMore: true,
      isLoadingMore: false,
      noMoreBlogs: false,
      carouselBlogs: [],
      carouselCurrentIndex: 0,
      recommendBlogs: [],
      isRefreshingRecommend: false,
      showBackToTop: false,
      scrollListener: null
    };
  },

  computed: {
    showRecommendSection() {
      return (
        !this.isMobile &&
        this.currentCategory === 'all' &&
        this.currentArticleType === 'all' &&
        !this.searchKeyword
      );
    },
    hasFilter() {
      return (
        this.currentCategory !== 'all' ||
        this.currentArticleType !== 'all' ||
        this.searchKeyword
      );
    }
  },

  created() {
    this.initMobileDetection();
    this.initEventListeners();
  },

  async mounted() {
    try {
      await Promise.all([
        this.fetchBlogs(),
        this.fetchHotBlogs(),
        this.fetchHotBlogsForTop10()
      ]);
      this.initCarouselAndRecommend();
      this.initScrollListener();
      this.initBackToTopListener();
    } catch (error) {
      console.error('数据加载失败:', error);
    }
  },

  beforeDestroy() {
    this.cleanup();
  },

  methods: {
    processBlogData(blog, index = 0) {
      return {
        ...blog,
        id: blog._id || blog.id || `blog-${index}`,
        date: blog.createdAt
          ? new Date(blog.createdAt).toLocaleDateString('zh-CN')
          : new Date().toLocaleDateString('zh-CN'),
        title: blog.title || '无标题',
        image: blog.image || 'https://via.placeholder.com/150',
        author: blog.author && typeof blog.author === 'object'
          ? blog.author
          : { username: '未知作者' },
        comments: blog.comments || 0,
        likes: blog.likes || 0,
        views: blog.views || 0,
        tags: blog.tags || [],
        articleType: blog.articleType || 'long'
      };
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    async fetchBlogs(isAppend = false) {
      try {
        if (!isAppend) {
          this.currentPage = 1;
          this.blogList = [];
          this.hasMore = true;
          this.noMoreBlogs = false;
        }

        let response;
        const params = {
          page: this.currentPage,
          limit: this.pageSize
        };

        if (this.hasFilterCondition()) {
          if (this.currentArticleType !== 'all') {
            params.articleType = this.currentArticleType;
          }
          if (this.currentCategory !== 'all' && !this.currentCategory.startsWith('tag-')) {
            params.category = this.currentCategory;
          }
          if (this.searchKeyword) {
            params.keyword = this.searchKeyword;
          }
          response = await this.$http.get('/api/blogs', { params, noAuth: true });
        } else {
          response = await this.$http.get('/api/blogs/recommended', { params, noAuth: true });
        }

        if (response.success && Array.isArray(response.data)) {
          this.updateBlogList(response.data, isAppend);
          this.updatePagination(response);
          this.error = null;
        } else {
          this.handleError(!isAppend);
        }
      } catch (error) {
        this.error = error.message || '获取博客列表失败，请稍后重试';
        this.handleError(!isAppend);
      }
    },

    hasFilterCondition() {
      return (
        this.currentCategory !== 'all' ||
        this.currentArticleType !== 'all' ||
        this.searchKeyword
      );
    },

    updateBlogList(blogs, isAppend) {
      const processedBlogs = blogs
        .map((blog, index) => this.processBlogData(blog, index))
        .filter(blog =>
          this.currentArticleType === 'all' ||
          blog.articleType === this.currentArticleType
        );

      if (isAppend) {
        const existingIds = new Set(this.blogList.map(blog => blog.id || blog._id));
        const newBlogs = processedBlogs.filter(
          blog => !existingIds.has(blog.id || blog._id)
        );
        this.blogList = [...this.blogList, ...newBlogs];
      } else {
        this.blogList = processedBlogs;
      }
    },

    updatePagination(response) {
      const total = response.total || response.count || 0;
      const totalPages = response.totalPages || response.total_pages || 1;
      this.totalBlogs = total;
      this.hasMore = this.currentPage < totalPages;
      this.noMoreBlogs = !this.hasMore;
    },

    handleError(shouldClear) {
      if (shouldClear) {
        this.blogList = [];
      }
    },

    async fetchHotBlogs() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=5', { noAuth: true });
        this.hotArticles = response.success && Array.isArray(response.data)
          ? response.data.map(blog => this.processBlogData(blog))
          : [];
      } catch (error) {
        this.hotArticles = [];
      }
    },

    async fetchHotBlogsForTop10() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true });
        if (response.success && Array.isArray(response.data)) {
          this.hotBlogs = response.data.map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author || { username: '未知作者' },
            views: blog.views || 0
          }));
        }
      } catch (error) {
        this.hotBlogs = [];
      }
    },

    initCarouselAndRecommend() {
      if (this.hotBlogs.length > 0) {
        this.carouselBlogs = this.hotBlogs.slice(0, 6).map((blog, index) =>
          this.processBlogData(blog, index)
        );
        this.recommendBlogs = this.hotBlogs.slice(0, 4).map((blog, index) =>
          this.processBlogData(blog, index)
        );
      }
    },

    initMobileDetection() {
      this.isMobile = window.innerWidth <= 768;
    },

    initEventListeners() {
      window.addEventListener('resize', this.debounce(() => {
        this.initMobileDetection();
      }, 200));
    },

    initScrollListener() {
      this.scrollListener = this.debounce(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const remaining = documentHeight - (scrollTop + windowHeight);

        if (remaining < 300 && this.hasMore && !this.isLoadingMore) {
          this.loadMore();
        }
      }, 200);

      window.addEventListener('scroll', this.scrollListener);
    },

    initBackToTopListener() {
      const backToTopListener = this.debounce(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        this.showBackToTop = scrollTop > 300;
      }, 100);

      window.addEventListener('scroll', backToTopListener);
    },

    handleCategoryChange(value) {
      this.currentCategory = value;
      this.fetchBlogs();
    },

    handleArticleTypeChange(value) {
      this.currentArticleType = value;
      this.fetchBlogs();
    },

    handleClearSearch() {
      this.searchKeyword = '';
      this.fetchBlogs();
    },

    handleClearFilter() {
      this.currentCategory = 'all';
      this.currentArticleType = 'all';
      this.searchKeyword = '';
      this.fetchBlogs();
    },

    getFilterName() {
      if (this.currentCategory === 'all') {
        return '全部攻略';
      }
      if (this.currentCategory.startsWith('tag-')) {
        const tag = this.currentCategory.replace('tag-', '');
        return `标签：${tag}`;
      }
      return CATEGORY_NAMES[this.currentCategory] || this.currentCategory;
    },

    handleOpenModal(blog) {
      this.currentBlog = blog;
      this.showModal = true;
      document.body.style.overflow = 'hidden';
    },

    handleCloseModal() {
      this.showModal = false;
      this.currentBlog = null;
      document.body.style.overflow = '';
    },

    handleFilterByTag(tag) {
      this.currentCategory = `tag-${tag}`;
      this.fetchBlogs();
    },

    async handleLikeBlog(blog) {
      try {
        const result = await this.$http.blogs[blog.isLiked ? 'unlike' : 'like'](blog.id);
        if (result.success) {
          blog.likes = result.data.likes;
          blog.isLiked = !blog.isLiked;
        }
      } catch (error) {
        console.error('点赞失败:', error);
      }
    },

    async handleBookmarkBlog(blog) {
      try {
        const result = await this.$http.blogs.bookmark(blog.id);
        if (result.success) {
          blog.bookmarks = (blog.bookmarks || 0) + 1;
          blog.isBookmarked = true;
        }
      } catch (error) {
        console.error('收藏失败:', error);
      }
    },

    handleGoToProfile(userId) {
      try {
        this.$router.push(`/profile/${userId}`);
      } catch (error) {
        console.error('跳转失败:', error);
      }
    },

    async handleRefreshRecommend() {
      if (this.isRefreshingRecommend) return;
      this.isRefreshingRecommend = true;

      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true });
        if (response.success && Array.isArray(response.data)) {
          const shuffled = response.data.sort(() => Math.random() - 0.5);
          this.recommendBlogs = shuffled.slice(0, 4).map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author || { username: '未知作者' },
            views: blog.views || 0
          }));
        }
      } catch (error) {
        console.error('刷新推荐失败:', error);
      } finally {
        setTimeout(() => {
          this.isRefreshingRecommend = false;
        }, 500);
      }
    },

    async loadMore() {
      if (this.isLoadingMore || !this.hasMore) return;
      this.isLoadingMore = true;

      try {
        this.currentPage++;
        await this.fetchBlogs(true);
      } catch (error) {
        this.currentPage--;
        console.error('加载更多失败:', error);
      } finally {
        this.isLoadingMore = false;
      }
    },

    handleScrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    cleanup() {
      window.removeEventListener('resize', this.checkIsMobile);
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
      }
    }
  }
};
</script>

<style scoped>
.blog-page {
  min-height: 100vh;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
  background-color: #f7fafc;
}

.blog-page__main {
  width: 95%;
  max-width: 1400px;
  margin: 32px auto;
}

.blog-page__container {
  padding: 0 8px;
}

.recommend-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.blog-list-container {
  position: relative;
}

@media (max-width: 768px) {
  .recommend-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .blog-page__main {
    margin: 16px auto;
  }
}

@media (min-width: 1400px) {
  .blog-list-container {
    max-width: 100%;
  }
}
</style>
