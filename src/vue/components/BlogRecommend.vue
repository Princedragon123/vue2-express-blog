<!-- 
=============================================================================
  BlogRecommend.vue - 热门推荐组件
=============================================================================

  1. 展示热门推荐博客列表
  2. 提供"换一批"刷新功能
  3. 点击打开博客详情

  1. 防重复点击（标志位控制）
  2. 数组随机打乱（sort + Math.random）
  3. 加载状态显示
  4. 旋转动画

  - 点击"换一批"重新获取热门博客
  - 随机打乱顺序
  - 取前 4 篇展示
  - 500ms 延迟重置加载状态

  父组件 → props: recommendBlogs, isRefreshing
  子组件 → @refresh, @open-modal
=============================================================================
-->

<template>
  <aside 
    class="blog-recommend" 
    aria-label="热门推荐列表"
  >
    <!-- 标题栏 -->
    <div class="blog-recommend__header">
      <h3 class="blog-recommend__title">
        <svg-icon name="fire" :size="18" aria-hidden="true"></svg-icon>
        热门推荐
      </h3>
      <button
        class="blog-recommend__refresh"
        @click="handleRefresh"
        :disabled="isRefreshing"
        aria-label="换一批推荐"
      >
        <svg-icon
          name="refresh"
          :size="16"
          aria-hidden="true"
          :class-name="isRefreshing ? 'blog-recommend__refresh--rotating' : ''"
        ></svg-icon>
        换一批
      </button>
    </div>
    
    <!-- 推荐列表 -->
    <div class="blog-recommend__grid">
      <article
        v-for="blog in recommendBlogs"
        :key="blog.id || blog._id || blog.title"
        class="blog-recommend__card"
        @click="handleOpenModal(blog)"
        @keydown.enter="handleOpenModal(blog)"
        tabindex="0"
        role="button"
        :aria-label="`查看博客：${blog.title}`"
      >
        <!-- 图片 -->
        <figure class="blog-recommend__image">
          <img
            :src="blog.image"
            :alt="blog.title"
            loading="lazy"
          >
        </figure>
        
        <!-- 信息 -->
        <div class="blog-recommend__info">
          <h4 class="blog-recommend__card-title">
            {{ blog.title }}
          </h4>
          <div class="blog-recommend__meta">
            <span class="blog-recommend__author">
              <svg-icon name="user" :size="14" aria-hidden="true"></svg-icon>
              {{ blog.author.username }}
            </span>
            <span class="blog-recommend__views">
              <svg-icon name="eye" :size="14" aria-hidden="true"></svg-icon>
              {{ blog.views }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </aside>
</template>

<script>
/**
 * BlogRecommend 组件
 * @module components/BlogRecommend
 */
export default {
  name: 'BlogRecommend',

  props: {
    /**
     * 推荐博客列表
     */
    recommendBlogs: {
      type: Array,
      default: () => []
    },

    /**
     * 是否正在刷新
     */
    isRefreshing: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    /**
     * 打开博客详情
     */
    handleOpenModal(blog) {
      this.$emit('open-modal', blog);
    },

    /**
     * 刷新推荐
     */
    handleRefresh() {
      if (this.isRefreshing) return;
      this.$emit('refresh');
    }
  }
};
</script>

<style scoped>
/**
 * BlogRecommend 样式
 */

/* ==========================================================================
   推荐区域
   ========================================================================== */
.blog-recommend {
  background: linear-gradient(135deg, #ffffff 0%, #fef3c7 100%);
  border-radius: 12px;
  padding: 24px;
  border: 2px solid #fbcfe8;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.blog-recommend__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.blog-recommend__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #ec4899;
  display: flex;
  align-items: center;
  gap: 8px;
}

.blog-recommend__title i {
  color: #f59e0b;
}

.blog-recommend__refresh {
  background: #ffffff;
  border: 1px solid #fbcfe8;
  color: #ec4899;
  padding: 4px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 300ms ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
}

.blog-recommend__refresh:hover:not(:disabled) {
  background: #fbcfe8;
  transform: scale(1.05);
}

.blog-recommend__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.blog-recommend__refresh--rotating {
  animation: rotate 1s linear infinite;
}

/* 推荐列表 */
.blog-recommend__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.blog-recommend__card {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
  cursor: pointer;
}

.blog-recommend__card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.blog-recommend__card:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

.blog-recommend__image {
  width: 100%;
  height: 150px;
  overflow: hidden;
  margin: 0;
}

.blog-recommend__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.blog-recommend__card:hover .blog-recommend__image img {
  transform: scale(1.1);
}

.blog-recommend__info {
  padding: 16px;
}

.blog-recommend__card-title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: bold;
  color: #1a202c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.blog-recommend__meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #4a5568;
}

.blog-recommend__author,
.blog-recommend__views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 旋转动画 */
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
  .blog-recommend {
    display: none;
  }
}
</style>
