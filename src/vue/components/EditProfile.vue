<!-- EditProfile.vue - 编辑个人资料组件 -->
<template>
  <div class="edit-profile-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">编辑个人资料</h1>
          <p class="page-subtitle">更新你的个人信息和头像</p>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchUserInfo">重新加载</button>
        </div>
        
        <!-- 加载状态 -->
        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        
        <!-- 编辑表单 -->
        <div v-else class="edit-profile-form">
          <!-- 头像编辑 -->
          <div class="form-section">
            <h2 class="section-title">头像设置</h2>
            <div class="avatar-edit-section">
              <div class="avatar-preview">
                <img :src="getAvatarUrl(formData.avatar)" alt="当前头像" class="current-avatar">
                <div class="avatar-upload-overlay">
                  <span class="nav-icon">📷</span>
                  <span>更换头像</span>
                  <input type="file" class="avatar-input" accept="image/*" @change="handleAvatarUpload">
                </div>
              </div>
              <p class="form-help">选择一张清晰的头像照片，建议尺寸为200x200px</p>
            </div>
          </div>
          
          <!-- 个人主页背景图设置 -->
          <div class="form-section">
            <h2 class="section-title">个人主页背景图</h2>
            <div class="background-edit-section">
              <div class="background-preview" 
                   @mousemove="handleBackgroundMouseMove" 
                   @mouseleave="handleBackgroundMouseLeave"
                   :style="backgroundPreviewStyle">
                <div class="current-background" :style="backgroundImageStyle"></div>
                <div class="background-upload-overlay">
                  <span class="nav-icon">🖼️</span>
                  <span>更换背景图</span>
                  <input type="file" class="background-input" accept="image/*" @change="handleCoverUpload">
                </div>
              </div>
              <p class="form-help">选择一张美观的背景图片，建议尺寸为 1200x400px</p>
            </div>
          </div>
          
          <!-- 个人信息编辑 -->
          <div class="form-section">
            <h2 class="section-title">个人信息</h2>
            <div class="form-group">
              <label for="username" class="form-label">用户名</label>
              <input 
                type="text" 
                id="username" 
                v-model="formData.username" 
                class="form-input"
                placeholder="请输入用户名"
              >
            </div>
            <div class="form-group">
              <label for="bio" class="form-label">个人简介</label>
              <textarea 
                id="bio" 
                v-model="formData.bio" 
                class="form-textarea"
                placeholder="介绍一下自己吧..."
                rows="4"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="location" class="form-label">所在地</label>
              <input 
                type="text" 
                id="location" 
                v-model="formData.location" 
                class="form-input"
                placeholder="请输入所在地"
              >
            </div>
            <div class="form-group">
              <label for="website" class="form-label">个人网站</label>
              <input 
                type="url" 
                id="website" 
                v-model="formData.website" 
                class="form-input"
                placeholder="请输入个人网站地址"
              >
            </div>
            <div class="form-group">
              <label for="occupation" class="form-label">职业</label>
              <input 
                type="text" 
                id="occupation" 
                v-model="formData.occupation" 
                class="form-input"
                placeholder="请输入职业"
              >
            </div>
          </div>
          
          <!-- 表单操作按钮 -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn-secondary" 
              @click="cancelEdit"
            >
              取消
            </button>
            <button 
              type="button" 
              class="btn-primary" 
              @click="saveChanges"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="nav-icon">🔄</span>
              {{ isSubmitting ? '保存中...' : '保存更改' }}
            </button>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import { getAuthorAvatar } from '../utils/avatarUtils';
import auth from '../utils/auth';

export default {
  name: 'EditProfile',
  components: {
    MobileBottomNav
  },
  data() {
    return {
      isLoading: true,
      isSubmitting: false,
      error: null,
      formData: {
        username: '',
        avatar: '',
        coverImage: '',
        bio: '',
        location: '',
        website: '',
        occupation: ''
      },
      
      // 背景图鼠标跟随效果
      backgroundMouseX: 0.5,
      backgroundMouseY: 0.5
    };
  },
  
  computed: {
    // 背景预览容器样式
    backgroundPreviewStyle() {
      return {
        '--mouse-x': this.backgroundMouseX,
        '--mouse-y': this.backgroundMouseY
      };
    },
    
    // 背景图片样式
    backgroundImageStyle() {
      const bgUrl = this.getBackgroundUrl(this.formData.coverImage);
      return {
        backgroundImage: `url(${bgUrl})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: 'cover'
      };
    }
  },
  
  mounted() {
    // 页面加载时获取用户信息
    this.fetchUserInfo();
  },
  methods: {
    // 获取头像 URL
    getAvatarUrl(avatarUrl) {
      if (!avatarUrl) {
        return 'https://picsum.photos/200/200';
      }
      return getAuthorAvatar(avatarUrl, 200);
    },
    
    // 获取背景图 URL
    getBackgroundUrl(coverUrl) {
      if (!coverUrl) {
        return 'https://picsum.photos/1200/400';
      }
      if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
        return coverUrl;
      }
      if (coverUrl.startsWith('/static/')) {
        return coverUrl;
      }
      if (coverUrl.startsWith('/uploads/')) {
        return `/static${coverUrl}`;
      }
      if (coverUrl.startsWith('uploads/')) {
        return `/static/${coverUrl}`;
      }
      return `/static${coverUrl.startsWith('/') ? '' : '/'}${coverUrl}`;
    },
    
    // ============================================================
    // 背景图片鼠标跟随效果
    // ============================================================
    handleBackgroundMouseMove(e) {
      const preview = e.currentTarget;
      const rect = preview.getBoundingClientRect();
      
      // 计算鼠标位置的百分比（0-1 之间）
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // 更新响应式数据
      this.backgroundMouseX = x;
      this.backgroundMouseY = y;
    },
    
    handleBackgroundMouseLeave(e) {
      // 恢复中心位置
      this.backgroundMouseX = 0.5;
      this.backgroundMouseY = 0.5;
    },
    
    // 获取认证令牌
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    // 获取用户信息
    async fetchUserInfo() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = this.getAuthToken();
        if (!token) {
          this.error = '请先登录';
          this.isLoading = false;
          return;
        }
        
        // 获取当前用户信息
        const meData = await this.$http.get('/api/auth/me');
        
        if (!meData.data) {
          this.error = '获取用户信息失败';
          this.isLoading = false;
          return;
        }
        
        const userData = meData.data;
        const userId = userData.id || userData._id;
        
        if (!userId) {
          this.error = '用户信息不完整';
          this.isLoading = false;
          return;
        }
        
        // 获取详细用户信息
        const userResponseData = await this.$http.get(`/api/users/${userId}`);
        
        if (userResponseData.success && userResponseData.data && userResponseData.data.user) {
          const detailedUser = userResponseData.data.user;
          const profile = detailedUser.profile || {};
          
          this.formData = {
            username: detailedUser.username || '',
            avatar: profile.avatar || '',
            coverImage: profile.coverImage || '',
            bio: profile.bio || '',
            location: profile.location || '',
            website: profile.website || '',
            occupation: profile.occupation || ''
          };
        } else {
          this.error = '获取用户详细信息失败';
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.error = error.message || '获取用户信息失败';
      } finally {
        this.isLoading = false;
      }
    },
    
    // 处理头像上传
    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // 调用API上传头像
        const formData = new FormData();
        formData.append('avatar', file);
        
        // 显示加载状态
        this.isSubmitting = true;
        
        try {
          const data = await this.$http.post('/api/users/upload-avatar', formData);
          
          if (data.success) {
            // 后端已经返回了正确格式的 URL，直接使用
            this.formData.avatar = data.data.url;
            this.showNotification('头像上传成功！', 'success');
            
            // 不调用 updateAuthState()，避免额外的 API 请求
            // 头像已经在 formData 中更新，页面会自动刷新显示新头像
          } else {
            this.showNotification(`头像上传失败: ${data.message}`, 'error');
          }
        } catch (error) {
          console.error('上传头像失败:', error);
          this.showNotification('上传头像失败，请稍后重试', 'error');
        } finally {
          this.isSubmitting = false;
        }
      }
    },
    
    // 处理背景图上传
    async handleCoverUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // 调用API上传背景图
        const formData = new FormData();
        formData.append('coverImage', file);
        
        // 显示加载状态
        this.isSubmitting = true;
        
        try {
          const data = await this.$http.post('/api/users/upload-cover', formData);
          
          if (data.success) {
            // 后端已经返回了正确格式的 URL，直接使用
            this.formData.coverImage = data.data.url;
            this.showNotification('背景图上传成功！', 'success');
            
            // 不调用 updateAuthState()，避免额外的 API 请求
            // 背景图已经在 formData 中更新，页面会自动刷新显示新背景
          } else {
            this.showNotification(`背景图上传失败: ${data.message}`, 'error');
          }
        } catch (error) {
          console.error('上传背景图失败:', error);
          this.showNotification('上传背景图失败，请稍后重试', 'error');
        } finally {
          this.isSubmitting = false;
        }
      }
    },
    
    // 保存更改
    async saveChanges() {
      // 表单验证
      if (!this.formData.username.trim()) {
        this.showNotification('请输入用户名', 'warning');
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.showNotification('请先登录', 'warning');
          this.isSubmitting = false;
          this.$router.push('/login');
          return;
        }
        
        // 准备表单数据
        const userData = {
          bio: this.formData.bio,
          location: this.formData.location,
          website: this.formData.website,
          occupation: this.formData.occupation,
          coverImage: this.formData.coverImage
        };
        
        // 调用后端API更新用户信息
        const data = await this.$http.put(`/api/users/${this.getUserId()}`, userData);
        
        if (data.success) {
          this.showNotification('个人资料更新成功！', 'success');
          
          // 不调用 updateAuthState()，避免额外的 API 请求
          // 用户信息已经在 formData 中更新，页面会自动刷新显示新信息
          
          // 跳转到账户设置页
          this.$router.push('/my-profile');
        } else {
          this.showNotification(`更新失败: ${data.message}`, 'error');
        }
      } catch (error) {
        console.error('更新个人资料失败:', error);
        this.showNotification('更新失败，请稍后重试', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 取消编辑
    cancelEdit() {
      this.$router.push('/my-profile');
    },
    
    // 获取当前用户ID
    getUserId() {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.id || payload._id;
        } catch (error) {
          console.error('解析token失败:', error);
          return '';
        }
      }
      return '';
    },
    
    // 更新用户认证状态
    async updateAuthState() {
      try {
        const response = await this.$http.get('/auth/me');
        if (response.success && response.data) {
          const userData = response.data;
          const user = {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            avatar: userData.profile?.avatar,
            profile: userData.profile
          };
          
          const token = auth.getToken();
          auth.loginSuccess(user, token, localStorage.getItem('token') !== null);
        }
      } catch (error) {
        // 静默失败，不显示错误提示
        // 因为头像已经上传成功了，更新用户信息失败不影响用户体验
        console.warn('更新认证状态失败（非致命错误）:', error.message);
      }
    },
    // 显示通知
    showNotification(message, type = 'info') {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="nav-icon">${this.getNotificationIcon(type)}</span>
          <span>${message}</span>
        </div>
      `;
      
      // 添加到页面
      document.body.appendChild(notification);
      
      // 添加动画
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      // 3秒后移除
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
      switch (type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'warning':
          return '⚠️';
        default:
          return 'ℹ️';
      }
    }
  }
}
</script>

<style scoped>
/* 编辑个人资料页面 */
.edit-profile-page {
  min-height: 100vh;
  background-color: #fafafa;
}

/* 主内容区 */
.main-content {
  padding-bottom: 70px; /* 为底部导航栏预留空间 */
}

/* 页面标题 */
.page-header {
  background-color: white;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #8e8e8e;
}

/* 编辑表单 */
.edit-profile-form {
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-bottom: 30px;
}

/* 表单区块 */
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

/* 头像编辑区域 */
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

/* 背景图编辑区域 */
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
  /* CSS 变量默认值 */
  --mouse-x: 0.5;
  --mouse-y: 0.5;
}

.current-background {
  width: 100%;
  height: 100%;
  /* 背景图样式由内联样式动态控制 */
  transition: background-position 0.2s ease-out;
  will-change: background-position;
}

/* 移动端禁用效果 */
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

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #fec89a 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 错误提示 */
.error-message {
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  color: #c53030;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 20px;
}

.error-message p {
  margin: 0 0 15px;
  font-size: 1rem;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 107, 157, 0.3);
  border-top-color: #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #8e8e8e;
  font-size: 1rem;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .edit-profile-form {
    padding: 20px;
  }
  
  .avatar-preview {
    width: 120px;
    height: 120px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>

<style>
/* 全局通知样式 */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  transform: translateX(100%);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.notification.show {
  transform: translateX(0);
  opacity: 1;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-content .nav-icon {
  font-size: 1.2rem;
}

.notification-success {
  background-color: #dcfce7;
  color: #166534;
}

.notification-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.notification-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.notification-info {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>