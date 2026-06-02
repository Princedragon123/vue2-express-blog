<!-- 
=============================================================================
  BlogCategoryNav.vue - 博客分类导航组件
=============================================================================

【组件职责】
  1. 显示所有分类选项
  2. 高亮当前选中的分类
  3. 处理分类点击事件

【学习重点】
  1. v-for 循环渲染列表
  2. :class 动态绑定类名
  3. @click 事件处理
  4. role="tablist" 无障碍访问

【分类说明】
  - 全部：显示所有内容
  - 短文章：类似朋友圈的短文
  - 长文章：类似知乎的长文
  - 游戏攻略、旅游攻略、美食攻略等

【数据流向】
  父组件 → props: currentCategory, currentArticleType
  子组件 → @category-change, @article-type-change
=============================================================================
-->

<template>
  <nav class="blog-category-nav" role="navigation" aria-label="文章分类导航">
    <div class="blog-category-nav__container container">
      <ul class="blog-category-nav__list" role="tablist">
        <li
          v-for="(category, index) in categories"
          :key="category.value"
          class="blog-category-nav__item"
          role="presentation"
        >
          <button
            :id="`category-tab-${index}`"
            class="blog-category-nav__button"
            :class="{ 'blog-category-nav__button--active': isActive(category.value, category.type) }"
            @click="handleCategoryClick(category)"
            role="tab"
            :aria-selected="isActive(category.value, category.type)"
            :aria-controls="`category-panel-${index}`"
            :aria-label="category.label"
          >
            <svg-icon :name="category.icon" :size="16" aria-hidden="true"></svg-icon>
            <span class="blog-category-nav__text">{{ category.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
/**
 * BlogCategoryNav 组件
 * @module components/BlogCategoryNav
 */

/**
 * 分类配置（常量，不会改变）
 */
const CATEGORIES = [
  { value: 'all', label: '全部', icon: 'home' },
  { value: 'short', label: '短文章', icon: 'image', type: 'articleType' },
  { value: 'long', label: '长文章', icon: 'fileText', type: 'articleType' },
  { value: 'game', label: '游戏攻略', icon: 'gamepad' },
  { value: 'travel', label: '旅游攻略', icon: 'plane' },
  { value: 'food', label: '美食攻略', icon: 'cutlery' },
  { value: 'tech', label: '科技攻略', icon: 'laptop' },
  { value: 'fitness', label: '健身攻略', icon: 'heartbeat' }
];

export default {
  name: 'BlogCategoryNav',

  props: {
    /**
     * 当前选中的分类
     */
    currentCategory: {
      type: String,
      default: 'all'
    },

    /**
     * 当前选中的文章类型
     */
    currentArticleType: {
      type: String,
      default: 'all'
    }
  },

  data() {
    return {
      categories: CATEGORIES
    };
  },

  methods: {
    /**
     * 判断分类是否激活
     * @param {string} value - 分类值
     * @param {string} type - 分类类型（articleType 或 undefined）
     * @returns {boolean} 是否激活
     */
    isActive(value, type) {
      if (type === 'articleType') {
        return this.currentArticleType === value;
      }
      return this.currentCategory === value;
    },

    /**
     * 处理分类点击
     * @param {Object} category - 分类对象
     */
    handleCategoryClick(category) {
      if (category.type === 'articleType') {
        // 文章类型筛选
        this.$emit('article-type-change', category.value);
      } else {
        // 分类筛选
        this.$emit('category-change', category.value);
      }
    }
  }
};
</script>

<style scoped>
/**
 * BlogCategoryNav 样式
 */

/* ==========================================================================
   分类导航
   ========================================================================== */
.blog-category-nav {
  border-bottom: 3px dashed #fbcfe8;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.blog-category-nav__container {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
}

.blog-category-nav__list {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-x: auto;
  white-space: nowrap;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: #ec4899 #f7fafc;
}

/* 自定义滚动条样式 */
.blog-category-nav__list::-webkit-scrollbar {
  height: 6px;
}

.blog-category-nav__list::-webkit-scrollbar-track {
  background: #f7fafc;
}

.blog-category-nav__list::-webkit-scrollbar-thumb {
  background: #ec4899;
  border-radius: 3px;
}

.blog-category-nav__item {
  flex-shrink: 0;
}

.blog-category-nav__button {
  padding: 16px 24px;
  cursor: pointer;
  transition: all 300ms ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  background: transparent;
  border: none;
  color: #4a5568;
  border-radius: 8px;
  position: relative;
}

.blog-category-nav__button:hover {
  transform: translateY(-2px);
  background: #fbcfe8;
}

.blog-category-nav__button--active {
  color: #ec4899;
  background: #fbcfe8;
  box-shadow: 0 4px 6px rgba(236, 72, 153, 0.2);
}

.blog-category-nav__button--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #ec4899;
  border-radius: 3px;
}

.blog-category-nav__button:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

.blog-category-nav__text {
  display: inline-block;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-category-nav__button {
    padding: 12px 16px;
    font-size: 1rem;
  }

  .blog-category-nav__list {
    gap: 4px;
  }
}
</style>
