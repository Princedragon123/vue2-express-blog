<template>
  <div v-if="visible" class="media-viewer-overlay" @click="$emit('close')">
    <div class="media-viewer-container" @click.stop>
      <button class="media-viewer-close" @click="$emit('close')" aria-label="关闭">
        <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      
      <div class="media-viewer-content">
        <img
          v-if="media?.mediaType === 'image'"
          :src="media?.url"
          :alt="media?.alt || '放大查看'"
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
          v-else-if="media?.mediaType === 'video'"
          :src="media?.url"
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
</template>

<script>
export default {
  name: 'MediaViewer',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    media: {
      type: Object,
      default: null
    }
  },
  
  data() {
    return {
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
    viewerStyle() {
      return {
        transform: `scale(${this.viewerScale}) translate(${this.viewerTranslateX}px, ${this.viewerTranslateY}px)`,
        transition: this.isViewerDragging ? 'none' : 'transform 0.2s ease',
        cursor: this.isViewerDragging ? 'grabbing' : 'grab'
      };
    }
  },
  
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.resetViewerState();
      }
    }
  },
  
  methods: {
    toggleZoom(event) {
      if (this.viewerScale === 1) {
        this.viewerScale = 2;
        const rect = event.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        this.viewerTranslateX = (clickX - centerX) * 2;
        this.viewerTranslateY = (clickY - centerY) * 2;
      } else {
        this.resetViewerState();
      }
    },
    
    resetViewerState() {
      this.viewerScale = 1;
      this.viewerTranslateX = 0;
      this.viewerTranslateY = 0;
    },
    
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
    
    onViewerMouseMove(event) {
      if (this.isViewerDragging) {
        const deltaX = event.clientX - this.viewerStartX;
        const deltaY = event.clientY - this.viewerStartY;
        this.viewerTranslateX = this.viewerStartTranslateX + deltaX;
        this.viewerTranslateY = this.viewerStartTranslateY + deltaY;
        event.preventDefault();
      }
    },
    
    onViewerMouseUp() {
      this.isViewerDragging = false;
    },
    
    onViewerWheel(event) {
      event.preventDefault();
      
      const zoomIntensity = 0.1;
      const delta = event.deltaY > 0 ? -zoomIntensity : zoomIntensity;
      const newScale = Math.max(0.5, Math.min(5, this.viewerScale + delta));
      
      const rect = event.target.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const mouseRatioX = mouseX / rect.width;
      const mouseRatioY = mouseY / rect.height;
      
      const scaleRatio = newScale / this.viewerScale;
      this.viewerTranslateX = mouseX - (mouseX - this.viewerTranslateX) * scaleRatio;
      this.viewerTranslateY = mouseY - (mouseY - this.viewerTranslateY) * scaleRatio;
      
      this.viewerScale = newScale;
    }
  }
};
</script>

<style scoped>
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
}

.media-viewer-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-viewer-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  z-index: 1001;
}

.media-viewer-close:hover {
  background-color: rgba(0, 0, 0, 0.7);
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
  min-height: 400px;
  max-width: 100%;
  max-height: 100%;
}

.media-viewer-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  display: block;
}

.media-viewer-video {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
}

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
