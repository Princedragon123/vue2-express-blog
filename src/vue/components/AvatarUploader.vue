<template>
  <div class="form-section">
    <h2 class="section-title">头像设置</h2>
    <div class="avatar-edit-section">
      <div class="avatar-preview">
        <img :src="avatarUrl" alt="当前头像" class="current-avatar">
        <div class="avatar-upload-overlay">
          <span class="nav-icon">📷</span>
          <span>更换头像</span>
          <input type="file" class="avatar-input" accept="image/*" @change="handleUpload">
        </div>
      </div>
      <p class="form-help">选择一张清晰的头像照片，建议尺寸为200x200px</p>
    </div>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'AvatarUploader',
  props: {
    avatar: {
      type: String,
      default: ''
    }
  },
  computed: {
    avatarUrl() {
      if (!this.avatar) {
        return 'https://picsum.photos/200/200';
      }
      return getAuthorAvatar(this.avatar, 200);
    }
  },
  methods: {
    handleUpload(event) {
      this.$emit('upload', event);
    }
  }
}
</script>

<style scoped>
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

.avatar-edit-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 20px;
  cursor: pointer;
  border: 3px solid #ff6b9d;
  box-shadow: 0 3px 10px rgba(255, 107, 157, 0.2);
}

.current-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-upload-overlay {
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

.avatar-preview:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-overlay .nav-icon {
  font-size: 2rem;
  color: white;
  margin-bottom: 10px;
}

.avatar-upload-overlay span {
  color: white;
  font-size: 0.9rem;
}

.avatar-input {
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
