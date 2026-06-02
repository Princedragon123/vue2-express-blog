<!-- 
=============================================================================
  BlogCarousel.vue - 博客轮播图组件
=============================================================================

【组件职责】
  1. 展示热门博客轮播
  2. 自动播放功能
  3. 手动切换（上一张/下一张）
  4. 指示器导航
  5. 点击打开详情

【学习重点】
  1. 计算属性 computed
  2. 定时器 setInterval/clearInterval
  3. 数组方法 slice()
  4. 内联样式 :style
  5. 生命周期 beforeDestroy 清理定时器

【自动播放逻辑】
  - 每 5 秒自动切换到下一张
  - 鼠标悬停时暂停播放
  - 组件销毁时清理定时器

【数据流向】
  父组件 → props: carouselBlogs
  子组件 → @open-modal 打开详情
=============================================================================
-->

<template>
  <article 
    class="blog-carousel" 
    aria-label="热门轮播"
    @mouseenter="pauseAutoPlay"
    @mouseleave="startAutoPlay"
  >
    <div class="blog-carousel__wrapper">
      <!-- 轮播轨道 -->
      <div
        class="blog-carousel__track"
        :style="trackStyle"
      >
        <!-- 轮播卡片 -->
        <article
          v-for="(blog, index) in carouselBlogs"
          :key="blog.id || blog._id || index"
          class="blog-carousel__slide"
        >
          <div
            class="blog-carousel__card"
            @click="handleOpenModal(blog)"
            @keydown.enter="handleOpenModal(blog)"
            tabindex="0"
            role="button"
            :aria-label="`查看博客：${blog.title}`"
          >
            <!-- 图片 -->
            <figure class="blog-carousel__image">
              <img
                :src="blog.image"
                :alt="blog.title"
                loading="lazy"
              >
              <figcaption class="blog-carousel__overlay"></figcaption>
            </figure>
            
            <!-- 信息 -->
            <div class="blog-carousel__info">
              <h3 class="blog-carousel__title">
                {{ blog.title }}
              </h3>
              <div class="blog-carousel__meta">
                <span class="blog-carousel__author">
                  <img
                    :src="getAuthorAvatar(blog.author, 24)"
                    class="blog-carousel__avatar"
                    :alt="blog.author.username"
                  >
                  {{ blog.author.username }}
                </span>
                <span class="blog-carousel__views">
                  <svg-icon name="eye" :size="14" aria-hidden="true"></svg-icon>
                  {{ blog.views }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>
      
      <!-- 控制按钮 -->
      <button
        class="blog-carousel__button blog-carousel__button--prev"
        @click="handlePrev"
        aria-label="上一个轮播图"
      >
        <svg-icon name="chevronLeft" :size="20" aria-hidden="true"></svg-icon>
      </button>
      <button
        class="blog-carousel__button blog-carousel__button--next"
        @click="handleNext"
        aria-label="下一个轮播图"
      >
        <svg-icon name="chevronRight" :size="20" aria-hidden="true"></svg-icon>
      </button>
      
      <!-- 指示器 -->
      <div
        class="blog-carousel__indicators"
        role="tablist"
        aria-label="轮播图导航"
      >
        <button
          v-for="(blog, index) in carouselBlogs"
          :key="index"
          :class="{ 'blog-carousel__indicator--active': index === currentIndex }"
          class="blog-carousel__indicator"
          @click="handleIndicatorClick(index)"
          role="tab"
          :aria-selected="index === currentIndex"
          :aria-label="`切换到第${index + 1}张轮播图`"
        ></button>
      </div>
    </div>
  </article>
</template>

<script>
/**
 * BlogCarousel 组件
 * @module components/BlogCarousel
 */
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'BlogCarousel',

  props: {
    /**
     * 轮播图博客数组
     */
    carouselBlogs: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      currentIndex: 0,
      autoPlayTimer: null
    };
  },

  computed: {
    /**
     * 轮播轨道样式
     */
    trackStyle() {
      return {
        transform: `translateX(-${this.currentIndex * 100}%)`
      };
    }
  },

  mounted() {
    this.startAutoPlay();
  },

  beforeDestroy() {
    this.stopAutoPlay();
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
     * 上一张
     */
    handlePrev() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else {
        this.currentIndex = this.carouselBlogs.length - 1;
      }
    },

    /**
     * 下一张
     */
    handleNext() {
      if (this.currentIndex < this.carouselBlogs.length - 1) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }
    },

    /**
     * 指示器点击
     */
    handleIndicatorClick(index) {
      this.currentIndex = index;
    },

    /**
     * 开始自动播放
     */
    startAutoPlay() {
      if (this.autoPlayTimer) return;
      
      this.autoPlayTimer = setInterval(() => {
        this.handleNext();
      }, 5000);
    },

    /**
     * 暂停自动播放
     */
    pauseAutoPlay() {
      this.stopAutoPlay();
    },

    /**
     * 停止自动播放
     */
    stopAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    }
  }
};
</script>

<style scoped>
/**
 * BlogCarousel 样式
 */

/* ==========================================================================
   轮播图主体
   ========================================================================== */
.blog-carousel {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  border: 3px solid #fbcfe8;
  background: #ffffff;
  height: 500px;
}

.blog-carousel__wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.blog-carousel__track {
  display: flex;
  transition: transform 300ms ease;
  height: 100%;
}

.blog-carousel__slide {
  min-width: 100%;
  height: 100%;
}

.blog-carousel__card {
  width: 100%;
  height: 100%;
  cursor: pointer;
  position: relative;
}

.blog-carousel__card:focus {
  outline: 3px solid #ec4899;
  outline-offset: 2px;
}

/* 图片区域 */
.blog-carousel__image {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  margin: 0;
}

.blog-carousel__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

.blog-carousel__card:hover .blog-carousel__image img {
  transform: scale(1.1);
}

.blog-carousel__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.8) 100%);
}

/* 信息区域 */
.blog-carousel__info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  color: #ffffff;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%);
}

.blog-carousel__title {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.blog-carousel__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.9rem;
}

.blog-carousel__author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.blog-carousel__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.blog-carousel__views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 控制按钮 */
.blog-carousel__button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #ec4899;
  transition: all 300ms ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.blog-carousel__button:hover {
  background: #ffffff;
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.blog-carousel__button--prev {
  left: 16px;
}

.blog-carousel__button--next {
  right: 16px;
}

.blog-carousel__button:focus {
  outline: 2px solid #ec4899;
  outline-offset: 2px;
}

/* 指示器 */
.blog-carousel__indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.blog-carousel__indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 300ms ease;
  border: 2px solid #ffffff;
  padding: 0;
}

.blog-carousel__indicator:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

.blog-carousel__indicator--active {
  background: #ffffff;
  transform: scale(1.2);
}

.blog-carousel__indicator:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-carousel {
    height: 300px;
  }

  .blog-carousel__title {
    font-size: 1rem;
  }

  .blog-carousel__button {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>
