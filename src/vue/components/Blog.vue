<!-- 
=============================================================================
  Blog.vue - 博客首页主组件（组件化重构版）
=============================================================================

【组件职责】
  1. 协调各子组件（Banner、导航、轮播图、推荐、列表）
  2. 数据获取和状态管理
  3. 事件处理和组件通信
  4. 下拉刷新和懒加载

【重构说明】
  已将功能拆分到独立子组件：
  - BlogBanner.vue：顶部横幅 + 搜索
  - BlogCategoryNav.vue：分类导航
  - BlogCarousel.vue：轮播图
  - BlogRecommend.vue：热门推荐
  - BlogListGrid.vue：博客列表网格
  - BlogModal.vue：详情弹窗（已存在）

【学习重点】
  1. 组件化架构设计
  2. 父子组件通信（props/$emit）
  3. 数据流向管理
  4. 生命周期钩子使用
=============================================================================
-->

<template>
  <article class="blog-page" aria-label="博客页面">
    
    <!-- 顶部横幅 -->
    <BlogBanner
      :search-keyword="searchKeyword"
      :is-mobile="isMobile"
      @update:searchKeyword="searchKeyword = $event"
      @search="fetchBlogs"
    />
    
    <!-- 分类导航 -->
    <BlogCategoryNav
      :current-category="currentCategory"
      :current-article-type="currentArticleType"
      @category-change="handleCategoryChange"
      @article-type-change="handleArticleTypeChange"
    />

    <!-- 主内容区 -->
    <main class="blog-page__main" role="main">
      <div class="blog-page__container container">
        
        <!-- 推荐区域（PC 端且无筛选时显示） -->
        <section
          v-if="showRecommendSection"
          class="blog-page__recommend recommend-section"
          aria-label="热门推荐"
        >
          <!-- 轮播图 -->
          <BlogCarousel
            :carousel-blogs="carouselBlogs"
            @open-modal="handleOpenModal"
          />
          
          <!-- 热门推荐 -->
          <BlogRecommend
            :recommend-blogs="recommendBlogs"
            :is-refreshing="isRefreshingRecommend"
            @refresh="handleRefreshRecommend"
            @open-modal="handleOpenModal"
          />
        </section>
        
        <!-- 博客列表容器 -->
        <div class="blog-page__list blog-list-container">
          
          <!-- 下拉刷新指示器（移动端） -->
          <div
            v-if="isMobile"
            class="blog-list-container__refresh pull-refresh"
            :style="{ height: pullRefreshHeight }"
            aria-live="polite"
          >
            <div
              class="pull-refresh__content"
              :class="{ 'pull-refresh__content--refreshing': isRefreshing }"
            >
              <i
                class="fa fa-arrow-down pull-refresh__icon"
                :class="{ 'pull-refresh__icon--rotating': isRefreshing }"
                aria-hidden="true"
              ></i>
              <span class="pull-refresh__text">
                {{ pullRefreshText }}
              </span>
            </div>
          </div>
          
          <!-- 筛选反馈 -->
          <div
            v-if="hasFilter"
            class="blog-list-container__feedback filter-feedback"
            role="status"
            aria-live="polite"
          >
            <span class="filter-feedback__text">
              当前显示：{{ getFilterName() }}
            </span>
            <button
              class="filter-feedback__clear"
              @click="handleClearFilter"
              aria-label="清除筛选条件"
            >
              <i class="fa fa-times" aria-hidden="true"></i>
              清除
            </button>
          </div>
          
          <!-- 错误信息 -->
          <div
            v-if="error"
            class="blog-list-container__error error-message"
            role="alert"
            aria-live="assertive"
          >
            <p class="error-message__text">{{ error }}</p>
            <button
              class="error-message__button btn btn--primary"
              @click="fetchBlogs"
            >
              重新加载
            </button>
          </div>
          
          <!-- 博客列表网格 -->
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
          
          <!-- 空状态 -->
          <section
            v-else-if="!isLoading"
            class="blog-list-container__empty empty-state"
            aria-label="空状态"
          >
            <div class="empty-state__icon" aria-hidden="true">📝</div>
            <h3 class="empty-state__title">暂无博客文章</h3>
            <p class="empty-state__description">
              {{ searchKeyword ? `没有找到与"${searchKeyword}"相关的博客` : '稍后再来看看吧' }}
            </p>
            <button
              v-if="searchKeyword"
              class="empty-state__button btn btn--primary"
              @click="handleClearSearch"
            >
              清除搜索
            </button>
            <button
              class="empty-state__button btn btn--primary"
              @click="fetchBlogs"
            >
              重新加载
            </button>
          </section>
        </div>
      </div>
    </main>
    
    <!-- 博客详情弹窗 -->
    <BlogModal
      :visible="showModal"
      :blog="currentBlog"
      :is-mobile="isMobile"
      @close="handleCloseModal"
      @filter-by-tag="handleFilterByTag"
    />
    
    <!-- 回到顶部 -->
    <transition name="fade">
      <button
        v-show="showBackToTop"
        class="blog-page__back-to-top back-to-top"
        @click="handleScrollToTop"
        aria-label="回到顶部"
      >
        <i class="fa fa-chevron-up" aria-hidden="true"></i>
      </button>
    </transition>
  </article>
</template>

<script>
/**
 * Blog 主组件
 * @module components/Blog
 */
import BlogBanner from './BlogBanner.vue';
import BlogCategoryNav from './BlogCategoryNav.vue';
import BlogCarousel from './BlogCarousel.vue';
import BlogRecommend from './BlogRecommend.vue';
import BlogListGrid from './BlogListGrid.vue';
import BlogModal from './BlogModal.vue';
import { getAuthorAvatar } from '../utils/avatarUtils';

/**
 * 分类名称映射
 */
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
    BlogModal
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
      // 筛选
      currentCategory: 'all',
      currentArticleType: 'all',
      searchKeyword: '',

      // 状态
      isLoading: false,
      error: null,
      showModal: false,
      currentBlog: null,
      isMobile: false,

      // 下拉刷新
      isPulling: false,
      pullDistance: 0,
      pullThreshold: 80,
      isRefreshing: false,
      touchStartY: 0,

      // 数据
      blogList: [],

      // 分页
      currentPage: 1,
      pageSize: 10,
      totalBlogs: 0,
      hasMore: true,
      isLoadingMore: false,
      noMoreBlogs: false,

      // 轮播图
      carouselBlogs: [],
      carouselCurrentIndex: 0,

      // 推荐
      recommendBlogs: [],
      isRefreshingRecommend: false,

      // 回到顶部
      showBackToTop: false,
      scrollListener: null
    };
  },

  computed: {
    /**
     * 是否显示推荐区域
     */
    showRecommendSection() {
      return (
        !this.isMobile &&
        this.currentCategory === 'all' &&
        this.currentArticleType === 'all' &&
        !this.searchKeyword
      );
    },

    /**
     * 是否有筛选条件
     */
    hasFilter() {
      return (
        this.currentCategory !== 'all' ||
        this.currentArticleType !== 'all' ||
        this.searchKeyword
      );
    },

    /**
     * 下拉刷新高度
     */
    pullRefreshHeight() {
      return `${(this.isPulling || this.isRefreshing) ? this.pullDistance : 0}px`;
    },

    /**
     * 下拉刷新文本
     */
    pullRefreshText() {
      if (this.isRefreshing) return '刷新中...';
      if (this.isPulling) {
        return this.pullDistance >= this.pullThreshold ? '释放刷新' : '下拉刷新';
      }
      return '下拉刷新';
    }
  },

  created() {
    this.initMobileDetection();
    this.initEventListeners();
  },

  async mounted() {
    console.log('🐱 Blog 组件已挂载');

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
      console.error('❌ 数据加载失败:', error);
    }
  },

  beforeDestroy() {
    this.cleanup();
  },

  methods: {
    // ==================== 工具方法 ====================

    /**
     * 处理博客数据
     */
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

    /**
     * 防抖函数
     */
    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    // ==================== 数据获取 ====================

    /**
     * 获取博客列表
     */
    async fetchBlogs(isAppend = false) {
      console.log('📝 fetchBlogs 被调用，isAppend:', isAppend);

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

        // 根据条件选择 API
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
          response = await this.$http.get('/api/blogs', { params });
        } else {
          response = await this.$http.get('/api/blogs/recommended', { params });
        }

        if (response.success && Array.isArray(response.data)) {
          this.updateBlogList(response.data, isAppend);
          this.updatePagination(response);
          this.error = null;
        } else {
          this.handleError(!isAppend);
        }
      } catch (error) {
        console.error('❌ fetchBlogs 错误:', error);
        this.error = error.message || '获取博客列表失败，请稍后重试';
        this.handleError(!isAppend);
      }
    },

    /**
     * 判断是否有筛选条件
     */
    hasFilterCondition() {
      return (
        this.currentCategory !== 'all' ||
        this.currentArticleType !== 'all' ||
        this.searchKeyword
      );
    },

    /**
     * 更新博客列表
     */
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

    /**
     * 更新分页信息
     */
    updatePagination(response) {
      const total = response.total || response.count || 0;
      const totalPages = response.totalPages || response.total_pages || 1;

      this.totalBlogs = total;
      this.hasMore = this.currentPage < totalPages;
      this.noMoreBlogs = !this.hasMore;
    },

    /**
     * 处理错误
     */
    handleError(shouldClear) {
      if (shouldClear) {
        this.blogList = [];
      }
    },

    /**
     * 获取热门博客
     */
    async fetchHotBlogs() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=5');
        this.hotArticles = response.success && Array.isArray(response.data)
          ? response.data.map(blog => this.processBlogData(blog))
          : [];
      } catch (error) {
        this.hotArticles = [];
      }
    },

    /**
     * 获取热点 TOP10
     */
    async fetchHotBlogsForTop10() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10');
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

    // ==================== 初始化 ====================

    /**
     * 初始化轮播图和推荐区域
     */
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

    /**
     * 初始化移动端检测
     */
    initMobileDetection() {
      this.isMobile = window.innerWidth <= 768;
    },

    /**
     * 初始化事件监听
     */
    initEventListeners() {
      window.addEventListener('resize', this.debounce(() => {
        this.initMobileDetection();
      }, 200));
    },

    /**
     * 初始化滚动监听
     */
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

    /**
     * 初始化回到顶部监听
     */
    initBackToTopListener() {
      const backToTopListener = this.debounce(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        this.showBackToTop = scrollTop > 300;
      }, 100);

      window.addEventListener('scroll', backToTopListener);
    },

    // ==================== 事件处理 ====================

    /**
     * 分类改变
     */
    handleCategoryChange(value) {
      this.currentCategory = value;
      this.fetchBlogs();
    },

    /**
     * 文章类型改变
     */
    handleArticleTypeChange(value) {
      this.currentArticleType = value;
      this.fetchBlogs();
    },

    /**
     * 清除搜索
     */
    handleClearSearch() {
      this.searchKeyword = '';
      this.fetchBlogs();
    },

    /**
     * 清除筛选
     */
    handleClearFilter() {
      this.currentCategory = 'all';
      this.currentArticleType = 'all';
      this.searchKeyword = '';
      this.fetchBlogs();
    },

    /**
     * 获取筛选名称
     */
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

    /**
     * 打开模态框
     */
    handleOpenModal(blog) {
      this.currentBlog = blog;
      this.showModal = true;
      document.body.style.overflow = 'hidden';
    },

    /**
     * 关闭模态框
     */
    handleCloseModal() {
      this.showModal = false;
      this.currentBlog = null;
      document.body.style.overflow = '';
    },

    /**
     * 按标签筛选
     */
    handleFilterByTag(tag) {
      this.currentCategory = `tag-${tag}`;
      this.fetchBlogs();
    },

    /**
     * 点赞
     */
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

    /**
     * 收藏
     */
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

    /**
     * 跳转到用户资料
     */
    handleGoToProfile(userId) {
      try {
        this.$router.push(`/profile/${userId}`);
      } catch (error) {
        console.error('跳转失败:', error);
      }
    },

    /**
     * 刷新推荐
     */
    async handleRefreshRecommend() {
      if (this.isRefreshingRecommend) return;

      this.isRefreshingRecommend = true;

      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10');
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

    /**
     * 加载更多
     */
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

    /**
     * 滚动到顶部
     */
    handleScrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },

    /**
     * 清理资源
     */
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

/* 推荐区域 */
.recommend-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

/* 博客列表容器 */
.blog-list-container {
  position: relative;
}

/* 下拉刷新 */
.pull-refresh {
  overflow: hidden;
  transition: height 300ms ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.pull-refresh__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #ffffff;
  border-bottom: 2px solid #fbcfe8;
}

.pull-refresh__icon {
  transition: transform 300ms ease;
}

.pull-refresh__icon--rotating {
  animation: rotate 1s linear infinite;
}

.pull-refresh__text {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: bold;
}

/* 筛选反馈 */
.filter-feedback {
  background: #ffffff;
  border-radius: 30px;
  padding: 16px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #fbcfe8;
}

.filter-feedback__text {
  font-weight: bold;
  font-size: 1.1rem;
  color: #1a202c;
}

.filter-feedback__clear {
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 4px 16px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 300ms ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
}

.filter-feedback__clear:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 错误信息 */
.error-message {
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
}

.error-message__text {
  color: #ef4444;
  margin: 0 0 16px;
}

.error-message__button {
  display: inline-block;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 64px 0;
}

.empty-state__icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 1.5rem;
  margin: 0 0 16px;
  color: #1a202c;
}

.empty-state__description {
  font-size: 1rem;
  color: #4a5568;
  margin-bottom: 24px;
}

.empty-state__button {
  margin: 0 8px;
}

/* 按钮 */
.btn {
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 300ms ease;
}

.btn--primary {
  background: #ec4899;
  color: #ffffff;
}

.btn--primary:hover {
  background: #db2777;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 回到顶部 */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ec4899;
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
  z-index: 100;
}

.back-to-top:hover {
  background: #db2777;
  transform: translateY(-5px);
  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.15);
}

.back-to-top:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* Fade 过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 加载更多指示器 */
.load-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.load-more-indicator__spinner {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a5568;
  font-size: 0.9rem;
}

.load-more-indicator__spinner i {
  font-size: 1.2rem;
  color: #ec4899;
}

/* 没有更多内容 */
.no-more-content {
  text-align: center;
  padding: 24px;
  color: #4a5568;
  font-size: 0.9rem;
}

.no-more-content__text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.no-more-content__text i {
  color: #6ee7b7;
}

/* 博客项样式 */
.blog-item {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.blog-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.blog-item:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

.blog-item__image {
  margin: 0;
  overflow: hidden;
  position: relative;
  padding-top: 60%;
}

.blog-item__image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.blog-item:hover .blog-item__image img {
  transform: scale(1.05);
}

.blog-item__info {
  display: flex;
  flex-direction: column;
  padding: 16px;
  flex: 1;
}

.blog-item__info-left {
  flex: 1;
}

.blog-item__info-right {
  margin-top: auto;
}

.blog-item__author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-info__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 200ms ease;
}

.author-info__avatar:hover {
  transform: scale(1.1);
}

.author-info__name {
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  transition: color 200ms ease;
}

.author-info__name:hover {
  color: #ec4899;
}

.blog-item__title {
  font-size: 1.1rem;
  margin: 0;
  color: #1a202c;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-stats {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  color: #718096;
  font-size: 0.85rem;
}

.blog-stats__item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 200ms ease;
}

.blog-stats__item:hover {
  color: #ec4899;
  transform: scale(1.1);
}

.blog-stats__item i {
  font-size: 0.9rem;
}

/* 博客列表网格样式 */
.blog-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.blog-list-grid__item {
  min-width: 0;
}

.blog-list-grid__loader {
  grid-column: 1 / -1;
}

.blog-list-grid__end {
  grid-column: 1 / -1;
}

.blog-list-grid__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 0;
}

/* 动画 */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .recommend-section {
    grid-template-columns: 1fr;
  }

  .back-to-top {
    display: none;
  }
  
  .blog-list-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .blog-item__title {
    font-size: 1rem;
  }
  
  .blog-stats {
    justify-content: flex-start;
    gap: 12px;
  }
}

@media (min-width: 1400px) {
  .blog-list-container {
    max-width: 100%;
  }
  
  .blog-list-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 响应式 - 小屏幕 */
@media (max-width: 480px) {
  .blog-page__main {
    margin: 16px auto;
  }
  
  .empty-state {
    padding: 32px 0;
  }
  
  .empty-state__icon {
    font-size: 3rem;
  }
  
  .empty-state__title {
    font-size: 1.2rem;
  }
  
  .btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}
</style>
