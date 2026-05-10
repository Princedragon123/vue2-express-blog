<!-- MyProfile.vue - 我的信息页面组件 -->
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
        <div v-if="isLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
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
import auth from '../utils/auth';
import SettingsSidebar from './my-profile/SettingsSidebar.vue';
import NotificationSettings from './my-profile/NotificationSettings.vue';
import PrivacySettings from './my-profile/PrivacySettings.vue';
import SecuritySettings from './my-profile/SecuritySettings.vue';
import HistorySection from './my-profile/HistorySection.vue';
import OtherSettings from './my-profile/OtherSettings.vue';

export default {
  name: 'MyProfile',
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
      activeTab: 'notifications', // basic, dynamics, edit, notifications, security, history
      editMode: false,
      // 历史记录
      history: [],
      // 退出登录确认弹框
      showLogoutModal: false,
      // 通知设置
      notificationSettings: {
        message: true,
        follow: true,
        like: true,
        comment: true
      },
      // 隐私设置
      privacySettings: {
        publicPosts: true,
        publicLikes: true,
        publicBookmarks: true,
        publicFollowList: true
      },
      // 其他设置
      isSimpleMode: localStorage.getItem('isSimpleMode') === 'true'

    };
  },
  created() {
    // 从后端获取用户信息
    this.fetchUserProfile();
  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) {
        return '未设置';
      }
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    // 切换风格
    changeStyle(style) {
      // 更新当前风格
      this.$parent.currentStyle = style.class;
      // 保存当前风格到localStorage
      localStorage.setItem('currentStyle', style.class);
      // 触发全局风格变化事件
      window.dispatchEvent(new CustomEvent('styleChanged', {
        detail: { style: style.class }
      }));
    },
    
    // 显示退出登录确认弹框
    logout() {
      this.showLogoutModal = true;
    },
    
    // 取消退出登录
    cancelLogout() {
      this.showLogoutModal = false;
    },
    
    // 确认退出登录
    confirmLogout() {
      // 使用认证模块来处理登出逻辑
      auth.logout();
      
      // 关闭弹框
      this.showLogoutModal = false;
      
      // 重定向到登录页面
      this.$router.push('/login');
    },
    
    // 加载历史记录
    async loadHistory() {
      try {
        const response = await this.$http.get('/api/history');
        if (response.success && response.data && response.data.history) {
          // 处理历史记录数据
          this.history = response.data.history.map(item => ({
            id: item.blog._id || item.blog.id,
            title: item.blog.title,
            timestamp: new Date(item.timestamp).getTime()
          }));
        } else {
          console.error('获取历史记录失败:', response.message);
          this.history = [];
        }
      } catch (error) {
        console.error('获取历史记录失败:', error);
        this.history = [];
      }
    },
    
    // 清空历史记录
    async clearHistory() {
      if (confirm('确定要清空浏览历史吗？')) {
        try {
          const response = await this.$http.delete('/api/history');
          if (response.success) {
            this.history = [];
          } else {
            console.error('清空历史记录失败:', response.message);
          }
        } catch (error) {
          console.error('清空历史记录失败:', error);
        }
      }
    },
    
    // 查看历史记录项
    viewHistoryItem(item) {
      // 跳转到zhihu-detail页面
      this.$router.push(`/zhihu-detail/${item.id}`);
    },
    
    // 格式化日期
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 切换标签页
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
    
    // 修改用户名
    changeUsername() {
      const newUsername = prompt('请输入新的用户名：');
      if (newUsername && newUsername.trim()) {
        // 这里可以添加用户名验证逻辑
        if (newUsername.length < 2 || newUsername.length > 20) {
          showNotification('用户名长度应在2-20个字符之间', 'error');
          return;
        }
        
        // 调用API修改用户名
        this.updateUserProfile({ username: newUsername.trim() });
      }
    },
    
    // 修改密码
    changePassword() {
      const currentPassword = prompt('请输入当前密码：');
      if (currentPassword) {
        const newPassword = prompt('请输入新密码：');
        if (newPassword) {
          const confirmPassword = prompt('请确认新密码：');
          if (newPassword === confirmPassword) {
            // 这里可以添加密码验证逻辑
            if (newPassword.length < 6) {
              showNotification('密码长度应至少为6个字符', 'error');
              return;
            }
            
            // 调用API修改密码
            this.updateUserPassword(currentPassword, newPassword);
          } else {
            showNotification('两次输入的密码不一致', 'error');
          }
        }
      }
    },
    
    // 更新用户资料
    async updateUserProfile(updatedData) {
      try {
        const response = await this.$http.put('/api/users/update-profile', updatedData);
        
        if (response.success) {
          // 更新本地用户信息
          Object.assign(this.user, response.data.user);
          
          // 更新localStorage和sessionStorage中的用户信息
          const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            Object.assign(user, response.data.user);
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(user));
            } else if (sessionStorage.getItem('user')) {
              sessionStorage.setItem('user', JSON.stringify(user));
            }
          }
          
          showNotification('用户名修改成功！', 'success');
        } else {
          showNotification(`修改失败: ${response.message}`, 'error');
        }
      } catch (error) {
        console.error('修改用户名失败:', error);
        showNotification('修改失败，请稍后重试', 'error');
      }
    },
    
    // 更新用户密码
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

    // 获取认证令牌
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    // 获取模拟用户数据
    getMockUserData() {
      return {
        username: '游戏达人',
        email: 'gamedev123@example.com',
        profile: {
          avatar: '/static/uploads/avatars/游戏达人.jpg',
          bio: '专注于分享各种游戏攻略和心得，欢迎关注！',
          coverImage: 'https://via.placeholder.com/800x200',
          location: '上海',
          website: 'https://gamedev.example.com',
          occupation: '游戏玩家'
        },
        social: {
          following: 48,
          followers: 156
        },
        stats: {
          postsCount: 23,
          likesCount: 523,
          commentsCount: 89
        },
        createdAt: '2023-03-15T00:00:00.000Z',
        lastLogin: new Date().toISOString()
      };
    },
    
    // 从后端获取用户信息
    async fetchUserProfile() {
      try {
        // 1. 初始化状态
        this.isLoading = true;
        
        // 2. 获取认证令牌
        const token = this.getAuthToken();
        
        // 3. 检查令牌
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        // 4. 不优先从localStorage读取，总是从后端获取最新用户信息
        
        // 5. 获取当前用户信息（包含隐私设置）
        const meResponse = await this.$http.get('/api/auth/me');
        
        // 注意：响应拦截器已经解包，直接返回 data
        // 后端返回：{ success: true, data: user }
        // 拦截器返回：{ success: true, data: user }
        // meResponse = { success: true, data: user }
        
        if (!meResponse.data) {
          console.error('获取用户信息失败：响应数据格式错误');
          this.user = this.getMockUserData();
          this.isLoading = false;
          return;
        }
        
        const userData = meResponse.data;
        this.user = userData;
        
        // 初始化隐私设置（从后端数据）
        this.privacySettings = {
          publicPosts: userData.privacy?.publicPosts !== false,
          publicLikes: userData.privacy?.publicLikes !== false,
          publicBookmarks: userData.privacy?.publicBookmarks !== false,
          publicFollowList: userData.privacy?.publicFollowList !== false
        };
        
        console.log('🔒 隐私设置初始化完成:', this.privacySettings);
        
        // 初始化通知设置（从后端数据）
        if (userData.notifications) {
          this.notificationSettings = {
            message: userData.notifications.message !== false,
            follow: userData.notifications.follow !== false,
            like: userData.notifications.like !== false,
            comment: userData.notifications.comment !== false
          };
        }
        
        // 更新 localStorage 或 sessionStorage 中的用户信息
        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(this.user));
        } else if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(this.user));
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.user = this.getMockUserData();
      } finally {
        // 7. 重置状态
        this.isLoading = false;
      }
    },

    // 上传头像
    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        try {
          // 先显示本地预览
          const reader = new FileReader();
          reader.onload = (e) => {
            this.user.profile.avatar = e.target.result;
          };
          reader.readAsDataURL(file);
          
          // 创建 FormData 对象
          const formData = new FormData();
          formData.append('avatar', file);
          
          const token = this.getAuthToken();
          
          // 调用 API 上传头像
          const response = await fetch('/api/users/upload-avatar', {
            method: 'POST',
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: formData,
            credentials: 'include'
          });
          
          const data = await response.json();
          
          if (data.success) {
            // 更新头像 URL
            this.user.profile.avatar = data.data.url;
            
            // 更新本地存储中的用户信息
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                user.avatar = data.data.url;
                if (user.profile) {
                  user.profile.avatar = data.data.url;
                }
                
                // 根据存储方式更新
                if (localStorage.getItem('user')) {
                  localStorage.setItem('user', JSON.stringify(user));
                } else if (sessionStorage.getItem('user')) {
                  sessionStorage.setItem('user', JSON.stringify(user));
                }
              } catch (error) {
                console.error('更新本地存储失败:', error);
              }
            }
          } else {
            throw new Error(data.message || '头像上传失败');
          }
        } catch (error) {
          console.error('上传头像失败:', error);
          showNotification('上传头像失败，请稍后重试', 'error');
        }
      }
    },
    // 保存用户信息
    async saveProfile() {
      try {
        const token = this.getAuthToken();
        
        // 获取当前用户 ID
        const authResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          credentials: 'include'
        });
        
        const authData = await authResponse.json();
        
        if (!authData.user) {
          throw new Error('未授权访问');
        }
        
        const currentUserId = authData.user._id;
        
        // 准备更新数据
        const updateData = {
          bio: this.user.profile.bio,
          location: this.user.profile.location,
          website: this.user.profile.website,
          occupation: this.user.profile.occupation
        };
        
        // 调用 API 更新用户信息
        const response = await fetch(`/api/users/${currentUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(updateData),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          // 更新本地用户信息
          this.user = data.data;
          showNotification('个人信息保存成功', 'success');
          this.switchTab('basic');
        } else {
          throw new Error(data.message || '保存失败');
        }
      } catch (error) {
        console.error('保存用户信息失败:', error);
        showNotification('保存用户信息失败，请稍后重试', 'error');
      }
    },
    
    // 保存通知设置
    async saveNotificationSettings() {
      try {
        const token = this.getAuthToken();
        if (!token) {
          return;
        }
        
        // 调用 API 保存通知设置
        const response = await this.$http.put('/api/users/update-notification-settings', {
          notifications: this.notificationSettings
        });
        
        if (response.success) {
          // 更新localStorage或sessionStorage中的用户信息
          if (response.data) {
            this.user = response.data;
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(this.user));
            } else if (sessionStorage.getItem('user')) {
              sessionStorage.setItem('user', JSON.stringify(this.user));
            }
          }
        } else {
          console.error('保存通知设置失败:', response.message);
        }
      } catch (error) {
        console.error('保存通知设置失败:', error);
      }
    },
    
    // 保存隐私设置
    async savePrivacySettings() {
      console.log('💾 保存隐私设置 - 当前设置:', this.privacySettings);
      
      try {
        const token = this.getAuthToken();
        console.log('🔑 Token:', token ? '存在' : '不存在');
        
        if (!token) {
          console.error('❌ 没有 token，无法保存');
          return;
        }
        
        // 调用 API 保存隐私设置
        console.log('📡 发送请求到 /api/users/update-privacy-settings');
        const response = await this.$http.put('/api/users/update-privacy-settings', {
          privacy: this.privacySettings
        });
        
        console.log('📥 收到响应:', response);
        
        if (response.success) {
          console.log('✅ 保存成功');
          // 更新 localStorage 或 sessionStorage 中的用户信息
          if (response.data) {
            this.user = response.data;
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(this.user));
            } else if (sessionStorage.getItem('user')) {
              sessionStorage.setItem('user', JSON.stringify(this.user));
            }
          }
        } else {
          console.error('❌ 保存失败:', response.message);
        }
      } catch (error) {
        console.error('❌ 保存异常:', error);
      }
    },
    
    // 切换简洁模式
    toggleSimpleMode() {
      // 保存到localStorage
      localStorage.setItem('isSimpleMode', this.isSimpleMode);
      // 触发全局简洁模式变化事件
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