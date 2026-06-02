<template>
  <div class="form-section">
    <h2 class="section-title">个人主页背景图</h2>
    <div class="background-edit-section">
      <div class="background-preview" 
           @mousemove="handleMouseMove" 
           @mouseleave="handleMouseLeave"
           :style="previewStyle">
        <div class="current-background" :style="backgroundStyle"></div>
        <div class="background-upload-overlay">
          <span class="nav-icon">🖼️</span>
          <span>更换背景图</span>
          <input type="file" class="background-input" accept="image/*" @change="handleUpload">
        </div>
      </div>
      <p class="form-help">选择一张美观的背景图片，建议尺寸为 1200x400px</p>
    </div>
  </div>
</template>

<script>
import { getAuthorCover } from '../../utils/avatarUtils'; // ✅ 导入工具函数

export default {
  name: 'BackgroundEditor',
  props: {
    coverImage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      mouseX: 0.5,
      mouseY: 0.5
    };
  },
  computed: {
    backgroundUrl() {
      // ✅ 直接调用工具函数，全自动处理
      return getAuthorCover(this.coverImage);
    },
    previewStyle() {
      return {
        '--mouse-x': this.mouseX,
        '--mouse-y': this.mouseY
      };
    },
    backgroundStyle() {
      return {
        backgroundImage: `url(${this.backgroundUrl})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: 'cover'
      };
    }
  },
  methods: {
    handleMouseMove(e) {
      const preview = e.currentTarget;
      const rect = preview.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) / rect.width;
      this.mouseY = (e.clientY - rect.top) / rect.height;
    },
    handleMouseLeave() {
      this.mouseX = 0.5;
      this.mouseY = 0.5;
    },
    handleUpload(event) {
      this.$emit('upload', event);
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.form-section {
  margin-bottom: 30px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.background-edit-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.background-preview {
  position: relative;
  width: 100%;
  max-width: 600px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  cursor: pointer;
  border: 3px solid #ff6b9d;
  box-shadow: 0 3px 10px rgba(255, 107, 157, 0.2);
  --mouse-x: 0.5;
  --mouse-y: 0.5;
}

.current-background {
  width: 100%;
  height: 100%;
  transition: background-position 0.2s ease-out;
  will-change: background-position;
}

@media (hover: none) and (pointer: coarse) {
  .current-background {
    background-position: center center !important;
  }
}

.background-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.background-preview:hover .background-upload-overlay {
  opacity: 1;
}

.background-upload-overlay .nav-icon {
  font-size: 2rem;
  color: white;
  margin-bottom: 10px;
}

.background-upload-overlay span {
  color: white;
  font-size: 0.9rem;
}

.background-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.form-help {
  color: #8e8e8e;
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
}
</style>