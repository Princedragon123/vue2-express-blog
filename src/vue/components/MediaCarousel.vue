<template>
  <div class="carousel-container">
    <!-- 轮播图主体 -->
    <div class="carousel-wrapper">
      <!-- 轮播轨道，使用flex横向排列 -->
      <div 
        class="carousel-track" 
        :style="trackStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <!-- 媒体项，支持图片和视频 -->
        <div 
          v-for="(media, index) in processedMediaList" 
          :key="index"
          class="carousel-slide"
          :class="{ active: currentIndex === index }"
        >
          <!-- 图片类型 -->
          <img
            v-if="media.mediaType === 'image'"
            :src="media.url"
            :alt="`图片 ${index + 1}`"
            class="carousel-image"
            loading="lazy"
            @load="onImageLoad"
            @error="onImageError"
            @click="openMediaViewer(media)"
            style="cursor: pointer"
          />
          
          <!-- 视频类型 -->
          <video
            v-else-if="media.mediaType === 'video'"
            :src="media.url"
            class="carousel-video"
            controls
            preload="metadata"
            @loadeddata="onVideoLoad"
            @error="onVideoError"
            @click="openMediaViewer(media)"
            style="cursor: pointer"
          >
            您的浏览器不支持视频播放
          </video>
          
          <!-- 媒体加载失败占位符 -->
          <div v-else class="media-error">
            <span>无法加载媒体文件</span>
          </div>
        </div>
      </div>
      
      <!-- 左右导航按钮 -->
      <button 
        v-if="showNav && mediaList.length > 1" 
        class="carousel-nav carousel-prev"
        :class="{ disabled: !canGoPrev }"
        @click="goPrev"
        aria-label="上一张"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      
      <button 
        v-if="showNav && mediaList.length > 1" 
        class="carousel-nav carousel-next"
        :class="{ disabled: !canGoNext }"
        @click="goNext"
        aria-label="下一张"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
    
    <!-- 指示器/分页点 -->
    <div v-if="showIndicators && mediaList.length > 1" class="carousel-indicators">
      <button
        v-for="(_, index) in mediaList"
        :key="index"
        class="carousel-indicator"
        :class="{ active: currentIndex === index }"
        @click="goTo(index)"
        :aria-label="`跳转到第 ${index + 1} 张`"
      />
    </div>
    
    <!-- 计数器 -->
    <div v-if="showCounter && mediaList.length > 1" class="carousel-counter">
      <span class="current-index">{{ currentIndex + 1 }}</span>
      <span class="separator">/</span>
      <span class="total-count">{{ mediaList.length }}</span>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="carousel-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 媒体查看器模态框 -->
    <div v-if="showMediaViewer" class="media-viewer-overlay" @click="closeMediaViewer">
      <div class="media-viewer-container" @click.stop>
        <button class="media-viewer-close" @click="closeMediaViewer" aria-label="关闭">
          <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        
        <div class="media-viewer-content">
          <img
            v-if="currentViewerMedia?.mediaType === 'image'"
            :src="currentViewerMedia?.url"
            :alt="currentViewerMedia?.alt || '放大查看'"
            class="media-viewer-image"
            :style="viewerStyle"
            @dblclick="toggleZoom"
            @mousedown="onViewerMouseDown"
            @mousemove="onViewerMouseMove"
            @mouseup="onViewerMouseUp"
            @mouseleave="onViewerMouseUp"
            @wheel="onViewerWheel"
          />
          
          <video
            v-else-if="currentViewerMedia?.mediaType === 'video'"
            :src="currentViewerMedia?.url"
            class="media-viewer-video"
            controls
            autoplay
            preload="auto"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaCarousel',
  
  props: {
    // 媒体文件列表
    mediaList: {
      type: Array,
      default: () => [],
      validator: (list) => {
        return list.every(item => 
          item && 
          typeof item === 'object' && 
          item.url && 
          typeof item.url === 'string'
        );
      }
    },
    
    // 是否显示导航按钮
    showNav: {
      type: Boolean,
      default: true
    },
    
    // 是否显示指示器
    showIndicators: {
      type: Boolean,
      default: true
    },
    
    // 是否显示计数器
    showCounter: {
      type: Boolean,
      default: true
    },
    
    // 是否自动播放
    autoplay: {
      type: Boolean,
      default: false
    },
    
    // 自动播放间隔（毫秒）
    autoplayInterval: {
      type: Number,
      default: 5000,
      validator: (value) => value >= 1000
    },
    
    // 是否循环播放
    loop: {
      type: Boolean,
      default: true
    },
    
    // 是否启用触摸滑动
    touchable: {
      type: Boolean,
      default: true
    },
    
    // 初始索引
    initialIndex: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0
    }
  },
  
  data() {
    return {
      currentIndex: Math.max(0, Math.min(this.initialIndex, this.mediaList.length - 1)),
      trackOffset: 0,
      containerWidth: 0,
      loading: false,
      isDragging: false,
      startX: 0,
      currentX: 0,
      dragOffset: 0,
      autoplayTimer: null,
      resizeObserver: null,
      showMediaViewer: false,
      currentViewerMedia: null,
      // 媒体查看器缩放和拖动相关
      viewerScale: 1,
      viewerTranslateX: 0,
      viewerTranslateY: 0,
      isViewerDragging: false,
      viewerStartX: 0,
      viewerStartY: 0,
      viewerStartTranslateX: 0,
      viewerStartTranslateY: 0
    };
  },
  
  computed: {
    // 处理媒体文件URL
    processedMediaList() {
      if (!this.mediaList || this.mediaList.length === 0) {
        return [];
      }
      
      return this.mediaList.map(media => {
        let mediaUrl = media.url;
        
        // 处理相对路径
        if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          if (!mediaUrl.startsWith('/static/uploads')) {
            mediaUrl = `/static/uploads/${mediaUrl.replace(/^\/+/, '')}`;
          }
        }
        
        return {
          url: mediaUrl,
          mediaType: media.mediaType || 'image',
          alt: media.alt || `媒体文件`
        };
      });
    },
    
    // 媒体查看器图片样式
    viewerStyle() {
      return {
        transform: `scale(${this.viewerScale}) translate(${this.viewerTranslateX}px, ${this.viewerTranslateY}px)`,
        transition: this.isViewerDragging ? 'none' : 'transform 0.2s ease',
        cursor: this.isViewerDragging ? 'grabbing' : 'grab'
      };
    },
    
    // 计算轨道样式
    trackStyle() {
      const totalOffset = this.trackOffset + this.dragOffset;
      return {
        transform: `translateX(${totalOffset}px)`,
        transition: this.isDragging ? 'none' : 'transform 0.3s ease'
      };
    },
    
    // 是否可以前往上一张
    canGoPrev() {
      if (this.loop) return true;
      return this.currentIndex > 0;
    },
    
    // 是否可以前往下一张
    canGoNext() {
      if (this.loop) return true;
      return this.currentIndex < this.mediaList.length - 1;
    },
    
    // 当前媒体项
    currentMedia() {
      if (this.mediaList.length === 0) return null;
      return this.processedMediaList[this.currentIndex];
    }
  },
  
  watch: {
    // 监听当前索引变化
    currentIndex(newIndex, oldIndex) {
      this.updateTrackPosition();
      this.$emit('slide-change', {
        index: newIndex,
        media: this.currentMedia
      });
    },
    
    // 监听媒体列表变化
    mediaList: {
      handler(newList) {
        if (newList.length === 0) return;
        
        // 确保当前索引有效
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, newList.length - 1));
        
        // 重新计算位置
        this.$nextTick(() => {
          this.updateContainerWidth();
          this.updateTrackPosition();
        });
      },
      deep: true
    },
    
    // 监听自动播放状态
    autoplay(newVal) {
      if (newVal) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }
  },
  
  mounted() {
    this.initCarousel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
    
    // 使用ResizeObserver监听容器大小变化
    this.initResizeObserver();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    // 初始化轮播图
    initCarousel() {
      this.updateContainerWidth();
      this.updateTrackPosition();
      
      if (this.autoplay) {
        this.startAutoplay();
      }
    },
    
    // 更新容器宽度
    updateContainerWidth() {
      const container = this.$el?.querySelector('.carousel-wrapper');
      if (container) {
        this.containerWidth = container.clientWidth;
      }
    },
    
    // 更新轨道位置
    updateTrackPosition() {
      this.trackOffset = -this.currentIndex * this.containerWidth;
      this.dragOffset = 0; // 重置拖拽偏移
    },
    
    // 前往上一张
    goPrev() {
      if (this.mediaList.length <= 1) return;
      
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else if (this.loop) {
        this.currentIndex = this.mediaList.length - 1;
      }
      
      this.resetAutoplay();
    },
    
    // 前往下一张
    goNext() {
      if (this.mediaList.length <= 1) return;
      
      if (this.currentIndex < this.mediaList.length - 1) {
        this.currentIndex++;
      } else if (this.loop) {
        this.currentIndex = 0;
      }
      
      this.resetAutoplay();
    },
    
    // 跳转到指定索引
    goTo(index) {
      if (index < 0 || index >= this.mediaList.length || index === this.currentIndex) {
        return;
      }
      
      this.currentIndex = index;
      this.resetAutoplay();
    },
    
    // 开始自动播放
    startAutoplay() {
      if (this.autoplayTimer || this.mediaList.length <= 1 || !this.autoplay) {
        return;
      }
      
      this.autoplayTimer = setInterval(() => {
        this.goNext();
      }, this.autoplayInterval);
    },
    
    // 停止自动播放
    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    },
    
    // 重置自动播放
    resetAutoplay() {
      if (!this.autoplay) return;
      
      this.stopAutoplay();
      this.startAutoplay();
    },
    
    // 触摸开始
    onTouchStart(event) {
      if (!this.touchable || this.mediaList.length <= 1) return;
      
      this.isDragging = true;
      this.startX = event.touches[0].clientX;
      this.currentX = this.startX;
    },
    
    // 触摸移动
    onTouchMove(event) {
      if (!this.isDragging) return;
      
      event.preventDefault();
      this.currentX = event.touches[0].clientX;
      this.dragOffset = this.currentX - this.startX;
    },
    
    // 触摸结束
    onTouchEnd() {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      
      const dragDistance = this.currentX - this.startX;
      const dragThreshold = this.containerWidth * 0.2; // 阈值为容器宽度的20%
      
      // 判断滑动方向
      if (Math.abs(dragDistance) > dragThreshold) {
        if (dragDistance > 0) {
          // 向右滑动，显示上一张
          this.goPrev();
        } else {
          // 向左滑动，显示下一张
          this.goNext();
        }
      } else {
        // 未达到阈值，回弹到当前位置
        this.dragOffset = 0;
      }
    },
    
    // 图片加载完成
    onImageLoad(event) {
      this.loading = false;
      this.$emit('media-loaded', {
        type: 'image',
        element: event.target
      });
    },
    
    // 图片加载失败
    onImageError(event) {
      console.error('图片加载失败:', event.target.src);
      this.$emit('media-error', {
        type: 'image',
        src: event.target.src
      });
    },
    
    // 视频加载完成
    onVideoLoad(event) {
      this.loading = false;
      this.$emit('media-loaded', {
        type: 'video',
        element: event.target
      });
    },
    
    // 视频加载失败
    onVideoError(event) {
      console.error('视频加载失败:', event.target.src);
      this.$emit('media-error', {
        type: 'video',
        src: event.target.src
      });
    },
    
    // 处理窗口大小变化
    handleResize() {
      this.updateContainerWidth();
      this.updateTrackPosition();
    },
    
    // 初始化ResizeObserver
    initResizeObserver() {
      if (typeof ResizeObserver === 'undefined') return;
      
      const container = this.$el?.querySelector('.carousel-wrapper');
      if (!container) return;
      
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerWidth();
        this.updateTrackPosition();
      });
      
      this.resizeObserver.observe(container);
    },
    
    // 清理资源
    cleanup() {
      this.stopAutoplay();
      window.removeEventListener('resize', this.handleResize);
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    
    // 打开媒体查看器
    openMediaViewer(media) {
      this.currentViewerMedia = media;
      this.showMediaViewer = true;
      // 暂停自动播放
      if (this.autoplay) {
        this.stopAutoplay();
      }
    },
    
    // 切换缩放状态
    toggleZoom(event) {
      if (this.viewerScale === 1) {
        // 放大到2倍
        this.viewerScale = 2;
        // 计算点击位置相对于图片中心的偏移
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // 调整偏移量，使点击位置位于视口中心
        this.viewerTranslateX = (clickX - centerX) * 2;
        this.viewerTranslateY = (clickY - centerY) * 2;
      } else {
        // 重置缩放和位置
        this.resetViewerState();
      }
    },
    
    // 重置查看器状态
    resetViewerState() {
      this.viewerScale = 1;
      this.viewerTranslateX = 0;
      this.viewerTranslateY = 0;
    },
    
    // 鼠标按下开始拖动
    onViewerMouseDown(event) {
      if (this.viewerScale > 1) {
        this.isViewerDragging = true;
        this.viewerStartX = event.clientX;
        this.viewerStartY = event.clientY;
        this.viewerStartTranslateX = this.viewerTranslateX;
        this.viewerStartTranslateY = this.viewerTranslateY;
        event.preventDefault();
      }
    },
    
    // 鼠标移动进行拖动
    onViewerMouseMove(event) {
      if (this.isViewerDragging) {
        const deltaX = event.clientX - this.viewerStartX;
        const deltaY = event.clientY - this.viewerStartY;
        this.viewerTranslateX = this.viewerStartTranslateX + deltaX;
        this.viewerTranslateY = this.viewerStartTranslateY + deltaY;
        event.preventDefault();
      }
    },
    
    // 鼠标释放结束拖动
    onViewerMouseUp() {
      this.isViewerDragging = false;
    },
    
    // 鼠标滚轮缩放
    onViewerWheel(event) {
      event.preventDefault();
      
      const zoomIntensity = 0.1;
      const delta = event.deltaY > 0 ? -zoomIntensity : zoomIntensity;
      const newScale = Math.max(0.5, Math.min(5, this.viewerScale + delta));
      
      // 计算鼠标位置相对于图片的比例
      const rect = event.target.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const mouseRatioX = mouseX / rect.width;
      const mouseRatioY = mouseY / rect.height;
      
      // 计算缩放前后的偏移量变化
      const scaleRatio = newScale / this.viewerScale;
      this.viewerTranslateX = mouseX - (mouseX - this.viewerTranslateX) * scaleRatio;
      this.viewerTranslateY = mouseY - (mouseY - this.viewerTranslateY) * scaleRatio;
      
      this.viewerScale = newScale;
    },
    
    // 关闭媒体查看器
    closeMediaViewer() {
      this.showMediaViewer = false;
      this.currentViewerMedia = null;
      // 重置查看器状态
      this.resetViewerState();
      // 恢复自动播放
      if (this.autoplay) {
        this.startAutoplay();
      }
    }
  }
};
</script>

<style scoped>
.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.carousel-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.carousel-track {
  display: flex;
  height: 100%;
  width: 100%;
  will-change: transform;
}

.carousel-slide {
  flex: 0 0 100%;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
}

.carousel-image,
.carousel-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.carousel-video {
  width: 100%;
  height: 100%;
  background-color: #000;
}

.media-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e0e0e0;
  color: #666;
  font-size: 14px;
}

/* 导航按钮样式 */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, opacity 0.2s;
  z-index: 10;
  opacity: 0.7;
}

.carousel-nav:hover {
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 1;
}

.carousel-nav.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-nav.disabled:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.carousel-prev {
  left: 16px;
}

.carousel-next {
  right: 16px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}

/* 指示器样式 */
.carousel-indicators {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 10;
  padding: 8px;
}

.carousel-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.carousel-indicator.active {
  background-color: white;
  width: 20px;
  border-radius: 10px;
}

/* 计数器样式 */
.carousel-counter {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
}

.current-index {
  font-weight: 600;
}

.separator {
  margin: 0 4px;
  opacity: 0.8;
}

/* 加载状态 */
.carousel-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 20;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #3f51b5;
  border-radius: 50%;
  animation: spinner-rotate 1s linear infinite;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .carousel-nav {
    width: 36px;
    height: 36px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .carousel-prev {
    left: 8px;
  }
  
  .carousel-next {
    right: 8px;
  }
  
  .carousel-indicators {
    bottom: 12px;
  }
  
  .carousel-counter {
    bottom: 12px;
    right: 12px;
  }
}

@media (max-width: 480px) {
  .carousel-nav {
    width: 32px;
    height: 32px;
  }
  
  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

/* 媒体查看器样式 */
.media-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.media-viewer-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  border-radius: 8px;
  animation: zoomIn 0.3s ease;
}

.media-viewer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  z-index: 10;
}

.media-viewer-close:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.close-icon {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}

.media-viewer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.media-viewer-image {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.media-viewer-video {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  background-color: #000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 媒体查看器响应式调整 */
@media (max-width: 768px) {
  .media-viewer-container {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .media-viewer-close {
    width: 36px;
    height: 36px;
    top: 12px;
    right: 12px;
  }
  
  .close-icon {
    width: 20px;
    height: 20px;
  }
  
  .media-viewer-content {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .media-viewer-container {
    max-width: 98vw;
    max-height: 98vh;
  }
  
  .media-viewer-close {
    width: 32px;
    height: 32px;
    top: 8px;
    right: 8px;
  }
  
  .close-icon {
    width: 18px;
    height: 18px;
  }
  
  .media-viewer-content {
    min-height: 200px;
  }
}
</style>