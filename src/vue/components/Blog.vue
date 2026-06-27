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
        <!-- 推荐区域（仅桌面端 + 无筛选时显示） -->
        <section
          v-if="showRecommendSection"
          class="blog-page__recommend"
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

        <!-- 博客列表区域 -->
        <div class="blog-page__list">
          <PullRefresh
            :is-mobile="isMobile"
            :is-refreshing="isRefreshing"
            :pull-distance="pullDistance"
            :is-pulling="isPulling"
            :pull-threshold="pullThreshold"
          />

          <FilterFeedback
            :has-filter="hasFilter"
            :filter-name="filterDisplayName"
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
            title="暂无博客文章"
            :description="emptyDescription"
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
import { debounce, throttle } from '../utils/helpers';

const CATEGORY_NAMES = {
  all: '全部攻略',
  game: '游戏攻略',
  travel: '旅游攻略',
  food: '美食攻略',
  tech: '科技攻略',
  fitness: '健身攻略'
};

const SCROLL_THRESHOLD = 300;
const LOAD_MORE_OFFSET = 300;
const BACK_TO_TOP_VISIBLE = 300;
const MOBILE_BREAKPOINT = 768;

export default {
  name: 'Blog',
  components: {
    BlogBanner, BlogCategoryNav, BlogCarousel, BlogRecommend,
    BlogListGrid, BlogModal, FilterFeedback, BlogEmptyState,
    PullRefresh, BackToTop, ErrorDisplay
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
      blogList: [],
      currentPage: 1,
      pageSize: 10,
      totalBlogs: 0,
      hasMore: true,
      isLoadingMore: false,
      noMoreBlogs: false,
      carouselBlogs: [],
      recommendBlogs: [],
      isRefreshingRecommend: false,
      showBackToTop: false
    };
  },

  computed: {
    showRecommendSection() {
      return !this.isMobile
        && this.currentCategory === 'all'
        && this.currentArticleType === 'all'
        && !this.searchKeyword;
    },
    hasFilter() {
      return this.currentCategory !== 'all'
        || this.currentArticleType !== 'all'
        || !!this.searchKeyword;
    },
    emptyDescription() {
      return this.searchKeyword
        ? `没有找到与"${this.searchKeyword}"相关的博客`
        : '稍后再来看看吧';
    },
    filterDisplayName() {
      if (this.currentCategory === 'all') return '全部攻略';
      if (this.currentCategory.startsWith('tag-')) {
        return `标签：${this.currentCategory.replace('tag-', '')}`;
      }
      return CATEGORY_NAMES[this.currentCategory] || this.currentCategory;
    }
  },

  created() {
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    this._onResize = debounce(() => {
      this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    }, 200);
    window.addEventListener('resize', this._onResize);
  },

  async mounted() {
    try {
      await Promise.all([
        this.fetchBlogs(),
        this.fetchHotBlogs(5),
        this.fetchHotBlogsForTop10()
      ]);
      this.initCarouselAndRecommend();
    } catch (error) {
      console.error('数据加载失败:', error);
    }
    // 统一滚动监听（合并 backToTop + 加载更多）
    this._onScroll = throttle(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      this.showBackToTop = scrollTop > BACK_TO_TOP_VISIBLE;

      // 无限滚动加载更多
      if (this.hasMore && !this.isLoadingMore) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        if (documentHeight - (scrollTop + windowHeight) < LOAD_MORE_OFFSET) {
          this.loadMore();
        }
      }
    }, 150);
    window.addEventListener('scroll', this._onScroll, { passive: true });
  },

  beforeDestroy() {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
  },

  methods: {
    // 处理博客数据格式
    processBlogData(blog) {
      return {
        ...blog,
        id: blog._id || blog.id,
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

    // 判断是否有筛选条件
    hasFilterCondition() {
      return this.currentCategory !== 'all'
        || this.currentArticleType !== 'all'
        || !!this.searchKeyword;
    },

    // 获取博客列表
    async fetchBlogs(isAppend = false) {
      try {
        if (!isAppend) {
          this.currentPage = 1;
          this.blogList = [];
          this.hasMore = true;
          this.noMoreBlogs = false;
        }

        const params = { page: this.currentPage, limit: this.pageSize };
        if (this.hasFilterCondition()) {
          if (this.currentArticleType !== 'all') params.articleType = this.currentArticleType;
          if (this.currentCategory !== 'all' && !this.currentCategory.startsWith('tag-')) {
            params.category = this.currentCategory;
          }
          if (this.searchKeyword) params.keyword = this.searchKeyword;
        }

        const url = this.hasFilterCondition() ? '/api/blogs' : '/api/blogs/recommended';
        const response = await this.$http.get(url, { params, noAuth: true });

        if (response.success && Array.isArray(response.data)) {
          const processed = response.data
            .map(blog => this.processBlogData(blog))
            .filter(blog => this.currentArticleType === 'all' || blog.articleType === this.currentArticleType);

          if (isAppend) {
            const existingIds = new Set(this.blogList.map(b => b.id || b._id));
            this.blogList = [...this.blogList, ...processed.filter(b => !existingIds.has(b.id || b._id))];
          } else {
            this.blogList = processed;
          }

          const totalPages = response.totalPages || response.total_pages || 1;
          this.totalBlogs = response.total || response.count || 0;
          this.hasMore = this.currentPage < totalPages;
          this.noMoreBlogs = !this.hasMore;
          this.error = null;
        } else if (!isAppend) {
          this.blogList = [];
        }
      } catch (error) {
        this.error = error.message || '获取博客列表失败，请稍后重试';
        if (!isAppend) this.blogList = [];
      }
    },

    // 获取热门博客
    async fetchHotBlogs(limit = 5) {
      try {
        const response = await this.$http.get(`/api/blogs/hot?limit=${limit}`, { noAuth: true });
        this.hotArticles = response.success && Array.isArray(response.data)
          ? response.data.map(b => this.processBlogData(b))
          : [];
      } catch {
        this.hotArticles = [];
      }
    },

    // 获取热门博客 Top10（用于轮播和推荐）
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
      } catch {
        this.hotBlogs = [];
      }
    },

    initCarouselAndRecommend() {
      if (this.hotBlogs && this.hotBlogs.length > 0) {
        this.carouselBlogs = this.hotBlogs.slice(0, 6).map((b, i) => this.processBlogData(b));
        this.recommendBlogs = this.hotBlogs.slice(0, 4).map((b, i) => this.processBlogData(b));
      }
    },

    // 分类/类型切换
    handleCategoryChange(value) { this.currentCategory = value; this.fetchBlogs(); },
    handleArticleTypeChange(value) { this.currentArticleType = value; this.fetchBlogs(); },
    handleClearSearch() { this.searchKeyword = ''; this.fetchBlogs(); },
    handleClearFilter() {
      this.currentCategory = 'all';
      this.currentArticleType = 'all';
      this.searchKeyword = '';
      this.fetchBlogs();
    },

    // 弹窗控制
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

    // 标签筛选
    handleFilterByTag(tag) {
      this.currentCategory = `tag-${tag}`;
      this.fetchBlogs();
    },

    // 点赞/收藏
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

    // 跳转
    handleGoToProfile(userId) {
      this.$router.push(`/profile/${userId}`).catch(() => {});
    },
    handleScrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // 刷新推荐
    async handleRefreshRecommend() {
      if (this.isRefreshingRecommend) return;
      this.isRefreshingRecommend = true;
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10', { noAuth: true });
        if (response.success && Array.isArray(response.data)) {
          const shuffled = [...response.data].sort(() => Math.random() - 0.5);
          this.recommendBlogs = shuffled.slice(0, 4).map(blog => ({
            id: blog._id, title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author || { username: '未知作者' },
            views: blog.views || 0
          }));
        }
      } catch (error) {
        console.error('刷新推荐失败:', error);
      } finally {
        setTimeout(() => { this.isRefreshingRecommend = false; }, 500);
      }
    },

    // 加载更多
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
    }
  }
};
</script>

<style scoped>
.blog-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.blog-page__main {
  width: 95%;
  max-width: 1400px;
  margin: 32px auto;
}

.blog-page__container {
  padding: 0 8px;
}

.blog-page__recommend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.blog-page__list {
  position: relative;
}

@media (max-width: 768px) {
  .blog-page__recommend {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .blog-page__main {
    margin: 16px auto;
  }
}
</style>
