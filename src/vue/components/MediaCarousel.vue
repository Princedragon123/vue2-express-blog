<template>
  <div class="carousel-container">
    <div class="carousel-wrapper">
      <div 
        class="carousel-track" 
        :style="trackStyle"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >
        <div 
          v-for="(media, index) in processedMediaList" 
          :key="index"
          class="carousel-slide"
          :class="{ active: currentIndex === index }"
        >
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
          
          <div v-else class="media-error">
            <span>无法加载媒体文件</span>
          </div>
        </div>
      </div>
      
      <CarouselControls
        :show="showNav"
        :total-items="mediaList.length"
        :can-go-prev="canGoPrev"
        :can-go-next="canGoNext"
        @prev="goPrev"
        @next="goNext"
      />
    </div>
    
    <CarouselIndicators
      :show="showIndicators"
      :total-items="mediaList.length"
      :current-index="currentIndex"
      @go-to="goTo"
    />
    
    <CarouselCounter
      :show="showCounter"
      :total-items="mediaList.length"
      :current-index="currentIndex"
    />
    
    <div v-if="loading" class="carousel-loading">
      <div class="loading-spinner"></div>
    </div>
    
    <MediaViewer
      :visible="showMediaViewer"
      :media="currentViewerMedia"
      @close="closeMediaViewer"
    />
  </div>
</template>

<script>
import CarouselControls from './media-carousel/CarouselControls.vue';
import CarouselIndicators from './media-carousel/CarouselIndicators.vue';
import CarouselCounter from './media-carousel/CarouselCounter.vue';
import MediaViewer from './media-carousel/MediaViewer.vue';

export default {
  name: 'MediaCarousel',
  
  components: {
    CarouselControls,
    CarouselIndicators,
    CarouselCounter,
    MediaViewer
  },
  
  props: {
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
    
    showNav: {
      type: Boolean,
      default: true
    },
    
    showIndicators: {
      type: Boolean,
      default: true
    },
    
    showCounter: {
      type: Boolean,
      default: true
    },
    
    autoplay: {
      type: Boolean,
      default: false
    },
    
    autoplayInterval: {
      type: Number,
      default: 5000,
      validator: (value) => value >= 1000
    },
    
    loop: {
      type: Boolean,
      default: true
    },
    
    touchable: {
      type: Boolean,
      default: true
    },
    
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
      currentViewerMedia: null
    };
  },
  
  computed: {
    processedMediaList() {
      if (!this.mediaList || this.mediaList.length === 0) {
        return [];
      }
      
      return this.mediaList.map(media => {
        let mediaUrl = media.url;
        
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
    
    trackStyle() {
      const totalOffset = this.trackOffset + this.dragOffset;
      return {
        transform: `translateX(${totalOffset}px)`,
        transition: this.isDragging ? 'none' : 'transform 0.3s ease'
      };
    },
    
    canGoPrev() {
      if (this.loop) return true;
      return this.currentIndex > 0;
    },
    
    canGoNext() {
      if (this.loop) return true;
      return this.currentIndex < this.mediaList.length - 1;
    },
    
    currentMedia() {
      if (this.mediaList.length === 0) return null;
      return this.processedMediaList[this.currentIndex];
    }
  },
  
  watch: {
    currentIndex(newIndex, oldIndex) {
      this.updateTrackPosition();
      this.$emit('slide-change', {
        index: newIndex,
        media: this.currentMedia
      });
    },
    
    mediaList: {
      handler(newList) {
        if (newList.length === 0) return;
        
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, newList.length - 1));
        
        this.$nextTick(() => {
          this.updateContainerWidth();
          this.updateTrackPosition();
        });
      },
      deep: true
    },
    
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
    window.addEventListener('resize', this.handleResize);
    this.initResizeObserver();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    initCarousel() {
      this.updateContainerWidth();
      this.updateTrackPosition();
      
      if (this.autoplay) {
        this.startAutoplay();
      }
    },
    
    updateContainerWidth() {
      const container = this.$el?.querySelector('.carousel-wrapper');
      if (container) {
        this.containerWidth = container.clientWidth;
      }
    },
    
    updateTrackPosition() {
      this.trackOffset = -this.currentIndex * this.containerWidth;
      this.dragOffset = 0;
    },
    
    goPrev() {
      if (this.mediaList.length <= 1) return;
      
      if (this.currentIndex > 0) {
        this.currentIndex--;
      } else if (this.loop) {
        this.currentIndex = this.mediaList.length - 1;
      }
      
      this.resetAutoplay();
    },
    
    goNext() {
      if (this.mediaList.length <= 1) return;
      
      if (this.currentIndex < this.mediaList.length - 1) {
        this.currentIndex++;
      } else if (this.loop) {
        this.currentIndex = 0;
      }
      
      this.resetAutoplay();
    },
    
    goTo(index) {
      if (index < 0 || index >= this.mediaList.length || index === this.currentIndex) {
        return;
      }
      
      this.currentIndex = index;
      this.resetAutoplay();
    },
    
    startAutoplay() {
      if (this.autoplayTimer || this.mediaList.length <= 1 || !this.autoplay) {
        return;
      }
      
      this.autoplayTimer = setInterval(() => {
        this.goNext();
      }, this.autoplayInterval);
    },
    
    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    },
    
    resetAutoplay() {
      if (!this.autoplay) return;
      
      this.stopAutoplay();
      this.startAutoplay();
    },
    
    onTouchStart(event) {
      if (!this.touchable || this.mediaList.length <= 1) return;
      
      this.isDragging = true;
      this.startX = event.touches[0].clientX;
      this.currentX = this.startX;
    },
    
    onTouchMove(event) {
      if (!this.isDragging) return;
      
      event.preventDefault();
      this.currentX = event.touches[0].clientX;
      this.dragOffset = this.currentX - this.startX;
    },
    
    onTouchEnd() {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      
      const dragDistance = this.currentX - this.startX;
      const dragThreshold = this.containerWidth * 0.2;
      
      if (Math.abs(dragDistance) > dragThreshold) {
        if (dragDistance > 0) {
          this.goPrev();
        } else {
          this.goNext();
        }
      } else {
        this.dragOffset = 0;
      }
    },
    
    onImageLoad(event) {
      this.loading = false;
      this.$emit('media-loaded', {
        type: 'image',
        element: event.target
      });
    },
    
    onImageError(event) {
      console.error('图片加载失败:', event.target.src);
      this.$emit('media-error', {
        type: 'image',
        src: event.target.src
      });
    },
    
    onVideoLoad(event) {
      this.loading = false;
      this.$emit('media-loaded', {
        type: 'video',
        element: event.target
      });
    },
    
    onVideoError(event) {
      console.error('视频加载失败:', event.target.src);
      this.$emit('media-error', {
        type: 'video',
        src: event.target.src
      });
    },
    
    handleResize() {
      this.updateContainerWidth();
      this.updateTrackPosition();
    },
    
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
    
    cleanup() {
      this.stopAutoplay();
      window.removeEventListener('resize', this.handleResize);
      
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    },
    
    openMediaViewer(media) {
      this.currentViewerMedia = media;
      this.showMediaViewer = true;
      if (this.autoplay) {
        this.stopAutoplay();
      }
    },
    
    closeMediaViewer() {
      this.showMediaViewer = false;
      this.currentViewerMedia = null;
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
  z-index: 5;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
