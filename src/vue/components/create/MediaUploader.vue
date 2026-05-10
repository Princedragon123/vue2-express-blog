<template>
  <div class="media-upload-section">
    <div class="media-preview-list">
      <div v-for="(media, index) in mediaFiles" :key="index" class="media-preview-item">
        <img v-if="media.mediaType === 'image'" :src="media.url" :alt="`媒体 ${index + 1}`" class="media-preview-img">
        <video v-else class="media-preview-video" controls>
          <source :src="media.url" type="video/mp4">
        </video>
        <button type="button" class="remove-media-btn" @click="handleRemove(index)">
          移除
        </button>
      </div>
    </div>
    <div v-if="mediaFiles.length < maxCount" class="media-upload-placeholder" @click="handleClick">
      <span class="nav-icon">🖼️</span>
      <p>添加图片或视频</p>
      <input type="file" class="media-input" accept="image/*,video/*" multiple @change="handleFileChange" ref="fileInput">
    </div>
  </div>
</template>

<script>
export default {
  name: 'MediaUploader',
  props: {
    mediaFiles: {
      type: Array,
      default: () => []
    },
    maxCount: {
      type: Number,
      default: 9
    }
  },
  methods: {
    handleClick() {
      this.$refs.fileInput.click();
    },
    handleFileChange(event) {
      const files = event.target.files;
      if (files.length > 0) {
        const remainingSlots = this.maxCount - this.mediaFiles.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);
        filesToUpload.forEach(file => {
          this.uploadFile(file);
        });
      }
      event.target.value = '';
    },
    uploadFile(file) {
      const formData = new FormData();
      if (file.type.startsWith('video/')) {
        formData.append('video', file);
        this.$http.post('/api/blogs/upload-video', formData)
          .then(data => {
            if (data.success) {
              this.$emit('add-media', {
                url: data.data.url,
                mediaType: 'video',
                name: data.data.name,
                size: data.data.size
              });
              this.$emit('notify', '视频上传成功！', 'success');
            } else {
              this.$emit('notify', `视频上传失败：${data.message}`, 'error');
            }
          })
          .catch(() => {
            this.$emit('notify', '上传视频失败，请稍后重试', 'error');
          });
      } else {
        formData.append('image', file);
        this.$http.post('/api/blogs/upload-image', formData)
          .then(data => {
            if (data.success) {
              this.$emit('add-media', {
                url: data.data.url,
                mediaType: 'image'
              });
              this.$emit('notify', '图片上传成功！', 'success');
            } else {
              this.$emit('notify', `图片上传失败：${data.message}`, 'error');
            }
          })
          .catch(() => {
            this.$emit('notify', '上传图片失败，请稍后重试', 'error');
          });
      }
    },
    handleRemove(index) {
      if (confirm('确定要移除这个媒体文件吗？')) {
        this.$emit('remove-media', index);
        this.$emit('notify', '媒体文件已移除', 'info');
      }
    }
  }
};
</script>

<style scoped>
.media-upload-section {
  margin-top: 15px;
}

.media-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.media-preview-item {
  position: relative;
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  transition: all 0.3s ease;
}

.media-preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.media-preview-img,
.media-preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-media-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
}

.remove-media-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.media-upload-placeholder {
  border: 4px dashed var(--background-dark);
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.media-upload-placeholder:hover {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  transform: translateY(-2px);
}

.media-upload-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  font-family: var(--font-family);
}

.media-input {
  display: none;
}
</style>
