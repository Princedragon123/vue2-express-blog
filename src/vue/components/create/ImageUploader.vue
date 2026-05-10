<template>
  <div class="image-upload-section">
    <div class="image-preview" v-if="imageUrl || localTempUrl">
      <img :src="localTempUrl || imageUrl" alt="封面预览" class="preview-img">
      <button type="button" class="remove-image-btn" @click="handleRemove">
        移除
      </button>
    </div>
    <div class="image-upload-placeholder" v-else @dragover.prevent @dragenter.prevent @dragleave.prevent @drop.prevent="handleDragUpload" @click="handleClick">
      <span class="nav-icon">📷</span>
      <p>点击或拖拽图片到此处上传</p>
      <input type="file" class="image-input" accept="image/*" @change="handleFileChange" ref="fileInput">
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageUploader',
  props: {
    imageUrl: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      localTempUrl: null,
      selectedFile: null
    };
  },
  methods: {
    handleClick(event) {
      const inputElement = event.currentTarget.querySelector('.image-input');
      if (inputElement) {
        inputElement.click();
      }
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.processFile(file);
      }
    },
    handleDragUpload(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        if (file.type.startsWith('image/')) {
          this.processFile(file);
        } else {
          this.$emit('notify', '请拖拽图片文件', 'error');
        }
      }
    },
    processFile(file) {
      if (this.localTempUrl && this.localTempUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.localTempUrl);
      }
      this.localTempUrl = URL.createObjectURL(file);
      this.selectedFile = file;
      this.$emit('update:imageUrl', this.localTempUrl);
      this.$emit('file-selected', file);
      this.$emit('notify', '封面图片已选择，预览成功！', 'success');
    },
    handleRemove() {
      if (this.localTempUrl && this.localTempUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.localTempUrl);
      }
      this.localTempUrl = null;
      this.selectedFile = null;
      this.$emit('update:imageUrl', '');
      this.$emit('file-removed');
      this.$emit('notify', '封面图片已移除', 'info');
    },
    getFile() {
      return this.selectedFile;
    },
    getTempUrl() {
      return this.localTempUrl;
    },
    clearFile() {
      if (this.localTempUrl && this.localTempUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.localTempUrl);
      }
      this.localTempUrl = null;
      this.selectedFile = null;
    }
  },
  beforeDestroy() {
    if (this.localTempUrl && this.localTempUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.localTempUrl);
    }
  }
};
</script>

<style scoped>
.image-upload-section {
  position: relative;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
}

.remove-image-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.image-upload-placeholder {
  border: 4px dashed var(--background-dark);
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.image-upload-placeholder:hover {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  transform: translateY(-2px);
}

.image-upload-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-family: var(--font-family);
}

.image-input {
  display: none;
}
</style>
