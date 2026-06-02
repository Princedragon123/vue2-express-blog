<template>
  <div class="profile-container" :class="currentStyle">
    <div class="style-switcher">
      <button
        v-for="style in styles"
        :key="style.class"
        @click="changeStyle(style)"
        :class="{ active: currentStyle === style.class }"
        :title="style.name"
      >
        <i :class="style.icon"></i>
        {{ style.name }}
      </button>
    </div>

    <div class="profile-header">
      <h1>账户设置</h1>
    </div>

    <div class="profile-content">
      <SettingsSidebar
        :active-tab="activeTab"
        @switch-tab="switchTab"
        @navigate="$router.push($event)"
        @logout="logout"
      />

      <div class="profile-main">
        <!-- ✅ 新增：错误状态提示，和Profile.vue保持一致 -->
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchUserProfile">重新加载</button>
        </div>

        <div v-else-if="isLoading" class="loading">
          <svg-icon name="spinner" :size="24" class-name="fa-spin"></svg-icon>
          <p>加载中...</p>
        </div>

        <NotificationSettings
          v-else-if="activeTab === 'notifications'"
          :settings="notificationSettings"
          @update="handleNotificationUpdate"
        />

        <PrivacySettings
          v-else-if="activeTab === 'privacy'"
          :settings="privacySettings"
          @update="handlePrivacyUpdate"
        />

        <SecuritySettings
          v-else-if="activeTab === 'security'"
          @change-username="changeUsername"
          @change-password="changePassword"
        />

        <HistorySection
          v-else-if="activeTab === 'history'"
          :history="history"
          @clear="clearHistory"
          @view="viewHistoryItem"
        />

        <OtherSettings
          v-else-if="activeTab === 'other'"
          :is-simple-mode="isSimpleMode"
          :styles="styles"
          :current-style="currentStyle"
          @toggle-simple-mode="toggleSimpleMode"
          @change-style="changeStyle"
        />
      </div>
    </div>

    <div v-if="showLogoutModal" class="logout-confirm-overlay" @click="cancelLogout">
      <div class="logout-confirm-modal" @click.stop>
        <h3>确认退出登录</h3>
        <p>确定要退出登录吗？</p>
        <div class="logout-confirm-buttons">
          <button class="cancel-btn" @click="cancelLogout">取消</button>
          <button class="confirm-btn" @click="confirmLogout">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';
import SettingsSidebar from './my-profile/SettingsSidebar.vue';
import NotificationSettings from './my-profile/NotificationSettings.vue';
import PrivacySettings from './my-profile/PrivacySettings.vue';
import SecuritySettings from './my-profile/SecuritySettings.vue';
import HistorySection from './my-profile/HistorySection.vue';
import OtherSettings from './my-profile/OtherSettings.vue';

export default {
  name: 'ProfileSettings',
  components: {
    SettingsSidebar,
    NotificationSettings,
    PrivacySettings,
    SecuritySettings,
    HistorySection,
    OtherSettings
  },
  props: {
    currentStyle: {
      type: String,
      default: 'style-spring-garden'
    },
    styles: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      user: {
        username: '',
        email: '',
        profile: {
          avatar: '',
          bio: '',
          coverImage: '',
          location: '',
          website: '',
          occupation: ''
        },
        social: {
          following: 0,
          followers: 0
        },
        stats: {
          postsCount: 0,
          likesCount: 0,
          commentsCount: 0
        },
        createdAt: '',
        lastLogin: ''
      },
      isLoading: true,
      error: null, // ✅ 新增错误状态
      activeTab: 'notifications',
      editMode: false,
      history: [],
      showLogoutModal: false,
      notificationSettings: {
        message: true,
        follow: true,
        like: true,
        comment: true
      },
      privacySettings: {
        publicPosts: true,
        publicLikes: true,
        publicBookmarks: true,
        publicFollowList: true
      },
      isSimpleMode: localStorage.getItem('isSimpleMode') === 'true'
    };
  },
  created() {
    // ✅ 新增：组件加载时先检查登录状态，未登录直接跳转
    if (!this.$store.getters.isLoggedIn) {
      this.$router.replace('/login');
      return;
    }
    this.fetchUserProfile();
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '未设置';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    changeStyle(style) {
      this.$parent.currentStyle = style.class;
      localStorage.setItem('currentStyle', style.class);
      window.dispatchEvent(new CustomEvent('styleChanged', {
        detail: { style: style.class }
      }));
    },
    logout() {
      this.showLogoutModal = true;
    },
    cancelLogout() {
      this.showLogoutModal = false;
    },
    confirmLogout() {
      this.$store.dispatch('logout', this.$router);
      this.showLogoutModal = false;
    },
    async loadHistory() {
      try {
        const response = await this.$http.get('/api/history');
        if (response.success && response.data?.history) {
          this.history = response.data.history.map(item => ({
            id: item.blog._id || item.blog.id,
            title: item.blog.title,
            timestamp: new Date(item.timestamp).getTime()
          }));
        } else {
          this.history = [];
        }
      } catch (error) {
        console.error('获取历史记录失败:', error);
        this.history = [];
      }
    },
    async clearHistory() {
      if (confirm('确定要清空浏览历史吗？')) {
        try {
          const response = await this.$http.delete('/api/history');
          if (response.success) {
            this.history = [];
            showNotification('历史记录已清空', 'success');
          }
        } catch (error) {
          console.error('清空历史记录失败:', error);
          showNotification('清空失败，请稍后重试', 'error');
        }
      }
    },
    viewHistoryItem(item) {
      this.$router.push(`/zhihu-detail/${item.id}`);
    },
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'history') {
        this.loadHistory();
      }
    },
    handleNotificationUpdate({ key, value }) {
      this.notificationSettings[key] = value;
      this.saveNotificationSettings();
    },
    handlePrivacyUpdate({ key, value }) {
      this.privacySettings[key] = value;
      this.savePrivacySettings();
    },
    changeUsername() {
      const newUsername = prompt('请输入新的用户名：');
      if (newUsername?.trim()) {
        if (newUsername.length < 2 || newUsername.length > 20) {
          showNotification('用户名长度应在2-20个字符之间', 'error');
          return;
        }
        this.updateUserProfile({ username: newUsername.trim() });
      }
    },
    changePassword() {
      const currentPassword = prompt('请输入当前密码：');
      if (currentPassword) {
        const newPassword = prompt('请输入新密码：');
        if (newPassword) {
          const confirmPassword = prompt('请确认新密码：');
          if (newPassword === confirmPassword) {
            if (newPassword.length < 6) {
              showNotification('密码长度应至少为6个字符', 'error');
              return;
            }
            this.updateUserPassword(currentPassword, newPassword);
          } else {
            showNotification('两次输入的密码不一致', 'error');
          }
        }
      }
    },
    async updateUserProfile(updatedData) {
      try {
        const response = await this.$http.put('/api/users/update-profile', updatedData);
        if (response.success) {
          Object.assign(this.user, response.data.user);
          const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            Object.assign(user, response.data.user);
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(user));
            } else {
              sessionStorage.setItem('user', JSON.stringify(user));
            }
          }
          showNotification('修改成功！', 'success');
        } else {
          showNotification(`修改失败: ${response.message}`, 'error');
        }
      } catch (error) {
        console.error('修改失败:', error);
        showNotification('修改失败，请稍后重试', 'error');
      }
    },
    async updateUserPassword(currentPassword, newPassword) {
      try {
        const response = await this.$http.put('/api/users/change-password', { currentPassword, newPassword });
        if (response.success) {
          showNotification('密码修改成功！', 'success');
        } else {
          showNotification(`修改失败: ${response.message}`, 'error');
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        showNotification('修改失败，请稍后重试', 'error');
      }
    },
    getAuthToken() {
      return this.$store.getters.getToken;
    },
    async fetchUserProfile() {
      this.isLoading = true;
      this.error = null;
      try {
        const token = this.getAuthToken();
        if (!token) {
          this.$router.replace('/login');
          return;
        }
        const meResponse = await this.$http.get('/api/auth/me');
        if (!meResponse.data) {
          throw new Error('响应数据格式错误');
        }
        const userData = meResponse.data;
        this.user = userData;
        this.privacySettings = {
          publicPosts: userData.privacy?.publicPosts !== false,
          publicLikes: userData.privacy?.publicLikes !== false,
          publicBookmarks: userData.privacy?.publicBookmarks !== false,
          publicFollowList: userData.privacy?.publicFollowList !== false
        };
        if (userData.notifications) {
          this.notificationSettings = {
            message: userData.notifications.message !== false,
            follow: userData.notifications.follow !== false,
            like: userData.notifications.like !== false,
            comment: userData.notifications.comment !== false
          };
        }
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(this.user));
        } else if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(this.user));
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // ✅ 新增：401直接登出跳转，不再赋值假数据
        if (error.response?.status === 401) {
          this.$store.dispatch('logout', this.$router);
          return;
        }
        this.error = '获取用户信息失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },
    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.user.profile.avatar = e.target.result;
          };
          reader.readAsDataURL(file);
          const formData = new FormData();
          formData.append('avatar', file);
          // ✅ 把原生fetch换成this.$http，统一请求方式
          const response = await this.$http.post('/api/users/upload-avatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          if (response.success) {
            this.user.profile.avatar = response.data.url;
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              user.avatar = response.data.url;
              if (user.profile) {
                user.profile.avatar = response.data.url;
              }
              if (localStorage.getItem('user')) {
                localStorage.setItem('user', JSON.stringify(user));
              } else {
                sessionStorage.setItem('user', JSON.stringify(user));
              }
            }
            showNotification('头像上传成功', 'success');
          } else {
            throw new Error(response.message || '头像上传失败');
          }
        } catch (error) {
          console.error('上传头像失败:', error);
          showNotification('上传失败，请稍后重试', 'error');
        }
      }
    },
    async saveProfile() {
      try {
        const currentUserId = this.user._id;
        const updateData = {
          bio: this.user.profile.bio,
          location: this.user.profile.location,
          website: this.user.profile.website,
          occupation: this.user.profile.occupation
        };
        // ✅ 把原生fetch换成this.$http，统一请求方式
        const response = await this.$http.put(`/api/users/${currentUserId}`, updateData);
        if (response.success) {
          this.user = response.data;
          showNotification('个人信息保存成功', 'success');
          this.switchTab('basic');
        } else {
          throw new Error(response.message || '保存失败');
        }
      } catch (error) {
        console.error('保存用户信息失败:', error);
        showNotification('保存失败，请稍后重试', 'error');
      }
    },
    async saveNotificationSettings() {
      try {
        const response = await this.$http.put('/api/users/update-notification-settings', {
          notifications: this.notificationSettings
        });
        if (response.success && response.data) {
          this.user = response.data;
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(this.user));
          } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(this.user));
          }
        }
      } catch (error) {
        console.error('保存通知设置失败:', error);
      }
    },
    async savePrivacySettings() {
      try {
        const response = await this.$http.put('/api/users/update-privacy-settings', {
          privacy: this.privacySettings
        });
        if (response.success && response.data) {
          this.user = response.data;
          if (localStorage.getItem('user')) {
            localStorage.setItem('user', JSON.stringify(this.user));
          } else if (sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', JSON.stringify(this.user));
          }
        }
      } catch (error) {
        console.error('保存隐私设置失败:', error);
      }
    },
    toggleSimpleMode() {
      localStorage.setItem('isSimpleMode', this.isSimpleMode);
      window.dispatchEvent(new CustomEvent('simpleModeChanged', {
        detail: { isSimpleMode: this.isSimpleMode }
      }));
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
  padding: 20px;
}
.profile-header {
  text-align: center;
  margin-bottom: 30px;
}
.profile-header h1 {
  font-size: 2.5rem;
  margin: 0;
  animation: cute-bounce 2s infinite;
}
.profile-content {
  display: flex;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}
.profile-main {
  flex: 1;
}
.style-switcher {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.style-switcher button {
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid #fbcfe8;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  color: #ec4899;
}
.style-switcher button.active {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  border-color: transparent;
}
.loading {
  text-align: center;
  padding: 60px 20px;
}
.loading i {
  font-size: 2rem;
  color: #ec4899;
  margin-bottom: 10px;
}
/* ✅ 新增错误信息样式，和Profile.vue保持一致 */
.error-message {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 15px;
}
.error-message p {
  color: #e74c3c;
  margin-bottom: 16px;
}
.logout-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.logout-confirm-modal {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: slideIn 0.3s ease;
}
.logout-confirm-modal h3 {
  margin: 0 0 16px;
  color: #333;
}
.logout-confirm-modal p {
  margin: 0 0 24px;
  color: #666;
}
.logout-confirm-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}
.cancel-btn {
  padding: 10px 24px;
  border-radius: 20px;
  border: 2px solid #ddd;
  background: white;
  cursor: pointer;
  font-weight: 600;
  color: #666;
}
.confirm-btn {
  padding: 10px 24px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}
@keyframes cute-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
}
</style>