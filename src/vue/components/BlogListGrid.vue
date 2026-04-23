<!-- 
=============================================================================
  BlogListGrid.vue - 博客列表网格组件
=============================================================================

【组件职责】
  1. 展示博客卡片网格
  2. 响应式布局（自适应列数）
  3. 点赞/收藏/评论数显示
  4. 作者信息展示
  5. 点击打开详情

【学习重点】
  1. 响应式网格布局（grid-template-columns）
  2. 事件修饰符 .stop 阻止冒泡
  3. 图片懒加载（loading="lazy"）
  4. 无障碍访问（role="feed"）

【响应式规则】
  - 默认：自适应列数（最小 265px）
  - 移动端：2 列
  - 大屏（>1400px）：5 列

【数据流向】
  父组件 → props: blogList, isLoadingMore, noMoreBlogs
  子组件 → @open-modal, @like, @bookmark, @go-to-profile
=============================================================================
-->

<template>
  <div 
    class="blog-list-grid" 
    role="feed" 
    aria-label="博客列表"
  >
    <!-- 博客卡片 -->
    <article
      v-for="blog in blogList"
      :key="blog._id || blog.id"
      class="blog-list-grid__item blog-item"
      @click="handleOpenModal(blog)"
      @keydown.enter="handleOpenModal(blog)"
      tabindex="0"
      role="article"
      :aria-label="`博客文章：${blog.title}`"
    >
      <!-- 图片 -->
      <figure class="blog-item__image">
        <img
          :src="blog.image"
          :alt="blog.title"
          loading="lazy"
        >
      </figure>
      
      <!-- 内容 -->
      <div class="blog-item__info">
        <div class="blog-item__info-left">
          <!-- 作者 -->
          <div class="blog-item__author author-info">
            <img
              :src="getAuthorAvatar(blog.author, 36)"
              :alt="blog.author.username || '未知作者'"
              class="author-info__avatar"
              @click.stop="handleGoToProfile(blog.author._id || blog.author.id)"
              @keydown.enter.stop="handleGoToProfile(blog.author._id || blog.author.id)"
              tabindex="0"
              role="button"
              aria-label="查看作者资料"
            >
            <span
              class="author-info__name"
              @click.stop="handleGoToProfile(blog.author._id || blog.author.id)"
              @keydown.enter.stop="handleGoToProfile(blog.author._id || blog.author.id)"
              tabindex="0"
              role="button"
              aria-label="查看作者资料"
            >
              {{ blog.author.username || '未知作者' }}
            </span>
          </div>
          
          <!-- 标题 -->
          <h3 class="blog-item__title">
            {{ blog.title }}
          </h3>
        </div>
        
        <!-- 统计 -->
        <div class="blog-item__info-right">
          <div class="blog-item__stats blog-stats">
            <span
              class="blog-stats__item"
              aria-label="评论数"
            >
              <i class="fa fa-comment" aria-hidden="true"></i>
              {{ blog.comments || 0 }}
            </span>
            <span
              class="blog-stats__item"
              @click.stop="handleLike(blog)"
              @keydown.enter.stop="handleLike(blog)"
              tabindex="0"
              role="button"
              :aria-label="blog.isLiked ? '取消点赞' : '点赞'"
            >
              <i class="fa fa-heart" aria-hidden="true"></i>
              {{ blog.likes || 0 }}
            </span>
            <span
              class="blog-stats__item"
              @click.stop="handleBookmark(blog)"
              @keydown.enter.stop="handleBookmark(blog)"
              tabindex="0"
              role="button"
              :aria-label="blog.isBookmarked ? '取消收藏' : '收藏'"
            >
              <i class="fa fa-bookmark" aria-hidden="true"></i>
              {{ blog.bookmarks || 0 }}
            </span>
            <span
              class="blog-stats__item"
              aria-label="浏览数"
            >
              <i class="fa fa-eye" aria-hidden="true"></i>
              {{ blog.views || 0 }}
            </span>
          </div>
        </div>
      </div>
    </article>
    
    <!-- 加载更多 -->
    <div
      v-if="isLoadingMore"
      class="blog-list-grid__loader load-more-indicator"
      aria-live="polite"
    >
      <div class="load-more-indicator__spinner">
        <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
        <span class="load-more-indicator__text">加载中...</span>
      </div>
    </div>
    
    <!-- 没有更多 -->
    <div
      v-else-if="noMoreBlogs"
      class="blog-list-grid__end no-more-content"
      role="status"
      aria-live="polite"
    >
      <div class="no-more-content__text">
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <span>已经到底啦~</span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * BlogListGrid 组件
 * @module components/BlogListGrid
 */
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'BlogListGrid',

  props: {
    /**
     * 博客列表
     */
    blogList: {
      type: Array,
      default: () => []
    },

    /**
     * 是否正在加载更多
     */
    isLoadingMore: {
      type: Boolean,
      default: false
    },

    /**
     * 是否没有更多博客
     */
    noMoreBlogs: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    /**
     * 获取作者头像
     */
    getAuthorAvatar(author, size) {
      return getAuthorAvatar(author, size);
    },

    /**
     * 打开博客详情
     */
    handleOpenModal(blog) {
      this.$emit('open-modal', blog);
    },

    /**
     * 点赞
     */
    handleLike(blog) {
      this.$emit('like', blog);
    },

    /**
     * 收藏
     */
    handleBookmark(blog) {
      this.$emit('bookmark', blog);
    },

    /**
     * 跳转到用户资料
     */
    handleGoToProfile(userId) {
      this.$emit('go-to-profile', userId);
    }
  }
};
</script>

<style scoped>
/**
 * BlogListGrid 样式
 */

/* ==========================================================================
   博客列表网格
   ========================================================================== */
.blog-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
  gap: 24px;
  width: 100%;
}

/* 博客卡片 */
.blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
  cursor: pointer;
  position: relative;
  background: #ffffff;
  border: 2px solid #fbcfe8;
  aspect-ratio: 3/4;
}

.blog-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}

.blog-item:focus {
  outline: 3px solid #ec4899;
  outline-offset: 2px;
}

.blog-item__image {
  flex-shrink: 0;
  width: 100%;
  height: 60%;
  overflow: hidden;
  position: relative;
  margin: 0;
}

.blog-item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.blog-item:hover .blog-item__image img {
  transform: scale(1.1);
}

.blog-item__info {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.blog-item__info-left {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.blog-item__info-right {
  margin-top: auto;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.blog-item__title {
  font-size: 0.75rem;
  margin: 4px 0;
  font-weight: bold;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1a202c;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.author-info__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 300ms ease;
}

.author-info__avatar:hover {
  transform: scale(1.1);
}

.author-info__avatar:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

.author-info__name {
  font-weight: bold;
  color: #4a5568;
  cursor: pointer;
}

.author-info__name:hover {
  color: #ec4899;
}

.author-info__name:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

/* 统计信息 */
.blog-stats {
  display: flex;
  gap: 16px;
  font-size: 0.65rem;
  font-weight: bold;
}

.blog-stats__item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 300ms ease;
  color: #4a5568;
}

.blog-stats__item:hover {
  transform: scale(1.1);
  color: #ec4899;
}

.blog-stats__item i {
  font-size: 1rem;
}

.blog-stats__item:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

/* 加载更多 */
.load-more-indicator {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 0;
}

.load-more-indicator__spinner {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 1.1rem;
  color: #ec4899;
}

.load-more-indicator__spinner i {
  font-size: 1.5rem;
}

.load-more-indicator__text {
  color: #4a5568;
}

/* 没有更多 */
.no-more-content {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 0;
}

.no-more-content__text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #10b981;
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-list-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .blog-item__title {
    font-size: 0.7rem;
  }

  .blog-stats {
    gap: 8px;
    font-size: 0.6rem;
  }
}

@media (min-width: 1400px) {
  .blog-list-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
