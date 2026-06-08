<!-- 
=============================================================================
  BlogBanner.vue - 博客首页顶部横幅组件
=============================================================================

  1. 显示欢迎标题和副标题
  2. 提供搜索功能入口
  3. 响应式布局（移动端隐藏）

  1. v-model 双向绑定
  2. @submit.prevent 表单提交
  3. 无障碍访问（aria-label）
  4. 响应式设计（v-if="!isMobile"）

  父组件 → props: searchKeyword, isMobile
  子组件 → @search 事件触发搜索
=============================================================================
-->

<template>
  <header class="blog-banner" role="banner" v-if="!isMobile">
    <div class="blog-banner__content container">
      <h1 class="blog-banner__title">
        欢迎来到博客世界！
      </h1>
      <p class="blog-banner__subtitle">
        发现有趣的攻略，分享你的故事
      </p>
      
      <!-- 搜索表单 -->
      <form 
        class="blog-banner__search search-form" 
        @submit.prevent="handleSearch"
        role="search"
        aria-label="博客搜索"
      >
        <label 
          for="banner-search-input" 
          class="visually-hidden"
        >
          搜索感兴趣的内容
        </label>
        <input
          id="banner-search-input"
          ref="searchInput"
          type="search"
          :value="searchKeyword"
          @input="$emit('update:searchKeyword', $event.target.value)"
          class="search-form__input"
          placeholder="搜索感兴趣的内容..."
          aria-label="输入搜索关键词"
          autocomplete="off"
        >
        <button
          type="submit"
          class="search-form__button"
          aria-label="搜索"
        >
          <svg-icon name="search" :size="18" aria-hidden="true"></svg-icon>
        </button>
      </form>
    </div>
  </header>
</template>

<script>
/**
 * BlogBanner 组件
 * @module components/BlogBanner
 */
export default {
  name: 'BlogBanner',

  props: {
    /**
     * 搜索关键词（v-model 双向绑定）
     */
    searchKeyword: {
      type: String,
      default: ''
    },

    /**
     * 是否为移动端
     */
    isMobile: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    /**
     * 处理搜索提交
     */
    handleSearch() {
      this.$emit('search');
    }
  }
};
</script>

<style scoped>
/**
 * BlogBanner 样式
 * 使用 BEM 命名规范
 */

/* ==========================================================================
   顶部横幅
   ========================================================================== */
.blog-banner {
  padding: 60px 0 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%);
}

.blog-banner__content {
  position: relative;
  z-index: 1;
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
}

.blog-banner__title {
  margin: 0 0 16px;
  font-size: 2.8rem;
  font-weight: bold;
  color: #1a202c;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.blog-banner__subtitle {
  margin: 0 0 32px;
  font-size: 1.2rem;
  opacity: 0.95;
  font-style: italic;
  color: #4a5568;
}

/* 搜索表单 */
.search-form {
  display: flex;
  max-width: 600px;
  margin: 0 auto 32px;
  border-radius: 50px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: #ffffff;
}

.search-form__input {
  flex: 1;
  padding: 16px 24px;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1a202c;
}

.search-form__input:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

.search-form__button {
  padding: 0 32px;
  border: none;
  background: #ec4899;
  color: #ffffff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 300ms ease;
}

.search-form__button:hover {
  background: #db2777;
  transform: scale(1.05);
}

.search-form__button:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* 视觉隐藏（无障碍访问） */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-banner {
    display: none;
  }
}
</style>
