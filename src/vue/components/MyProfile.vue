<!-- MyProfile.vue - 我的信息页面组件 -->
<template>
  <div class="profile-container" :class="currentStyle">
    <!-- 风格切换按钮 -->
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
    
    <!-- 页面标题 -->
    <div class="profile-header">
      <h1>账户设置</h1>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="profile-content">
      <!-- 左侧菜单 -->
      <div class="profile-sidebar">
        <ul class="profile-menu">
          <li class="menu-item" @click="$router.push('/edit-profile')">
            <span>编辑资料</span>
          </li>
          <li class="menu-item" @click="$router.push('/my-creation')">
            <span>我的创作</span>
          </li>
          <li class="menu-item" :class="{ active: activeTab === 'notifications' }" @click="switchTab('notifications')">
            <span>通知设置</span>
          </li>
          <li class="menu-item" :class="{ active: activeTab === 'privacy' }" @click="switchTab('privacy')">
            <span>隐私设置</span>
          </li>
          <li class="menu-item" :class="{ active: activeTab === 'security' }" @click="switchTab('security')">
            <span>安全设置</span>
          </li>
          <li class="menu-item" :class="{ active: activeTab === 'history' }" @click="switchTab('history')">
            <span>历史记录</span>
          </li>
          <li class="menu-item" :class="{ active: activeTab === 'other' }" @click="switchTab('other')">
            <span>其他设置</span>
          </li>
          <li class="menu-item logout-item" @click="logout">
            <span>退出登录</span>
          </li>
        </ul>
      </div>
      
      <!-- 右侧内容 -->
      <div class="profile-main">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>
        
        <!-- 通知设置 -->
        <div v-else-if="activeTab === 'notifications'">
          <div class="profile-card">
            <h3>通知设置</h3>
            <div class="notifications-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>新消息通知</h4>
                  <p>当收到新私信时通知我</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="message-notification" v-model="notificationSettings.message" @change="saveNotificationSettings">
                  <label for="message-notification"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>关注通知</h4>
                  <p>当有人关注我时通知我</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="follow-notification" v-model="notificationSettings.follow" @change="saveNotificationSettings">
                  <label for="follow-notification"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>点赞通知</h4>
                  <p>当我的文章被点赞时通知我</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="like-notification" v-model="notificationSettings.like" @change="saveNotificationSettings">
                  <label for="like-notification"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>评论通知</h4>
                  <p>当我的文章被评论时通知我</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="comment-notification" v-model="notificationSettings.comment" @change="saveNotificationSettings">
                  <label for="comment-notification"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 隐私设置 -->
        <div v-else-if="activeTab === 'privacy'">
          <div class="profile-card">
            <h3>隐私设置</h3>
            <div class="privacy-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>公开文章</h4>
                  <p>允许其他用户查看您发布的文章</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="public-posts" v-model="privacySettings.publicPosts" @change="savePrivacySettings">
                  <label for="public-posts"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>公开点赞</h4>
                  <p>允许其他用户查看您的点赞记录</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="public-likes" v-model="privacySettings.publicLikes" @change="savePrivacySettings">
                  <label for="public-likes"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>公开收藏</h4>
                  <p>允许其他用户查看您的收藏记录</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="public-bookmarks" v-model="privacySettings.publicBookmarks" @change="savePrivacySettings">
                  <label for="public-bookmarks"></label>
                </div>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>公开关注列表</h4>
                  <p>允许其他用户查看您的关注和粉丝列表</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="public-follow-list" v-model="privacySettings.publicFollowList" @change="savePrivacySettings">
                  <label for="public-follow-list"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 安全设置 -->
        <div v-else-if="activeTab === 'security'">
          <div class="profile-card">
            <h3>安全设置</h3>
            <div class="security-settings">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>修改用户名</h4>
                  <p>修改您的登录用户名</p>
                </div>
                <button class="btn btn-secondary" @click="changeUsername">修改用户名</button>
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <h4>修改密码</h4>
                  <p>定期修改密码可以提高账号安全性</p>
                </div>
                <button class="btn btn-secondary" @click="changePassword">修改密码</button>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>账号注销</h4>
                  <p>永久删除您的账号和所有数据</p>
                </div>
                <button class="btn btn-danger">注销账号</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 历史记录 -->
        <div v-else-if="activeTab === 'history'">
          <div class="profile-card">
            <div class="card-header">
              <h3>浏览历史</h3>
              <button class="clear-history-btn" @click="clearHistory">
                <i class="fas fa-trash"></i> 清空历史
              </button>
            </div>
            <div class="history-content">
              <div v-if="history.length === 0" class="empty-history">
                <i class="fas fa-clock"></i>
                <p>暂无浏览历史</p>
                <p class="empty-history-tip">浏览文章后，这里会显示您的历史记录</p>
              </div>
              <div v-else class="history-container">
                <div class="history-list">
                  <div v-for="(item, index) in history" :key="index" class="history-item">
                    <div class="history-item-content">
                      <h4 class="history-item-title">{{ item.title }}</h4>
                      <p class="history-item-date">{{ formatDate(item.timestamp) }}</p>
                    </div>
                    <button class="history-item-button" @click="viewHistoryItem(item)">
                      <i class="fas fa-eye"></i> 查看
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 其他设置 -->
        <div v-else-if="activeTab === 'other'">
          <div class="profile-card">
            <h3>其他设置</h3>
            <div class="other-settings">
              <!-- 简洁模式 -->
              <div class="setting-item">
                <div class="setting-info">
                  <h4>简洁模式</h4>
                  <p>启用后不显示侧边栏，文章卡片和平板端一样</p>
                </div>
                <div class="setting-toggle">
                  <input type="checkbox" id="simple-mode" v-model="isSimpleMode" @change="toggleSimpleMode">
                  <label for="simple-mode"></label>
                </div>
              </div>
              <!-- 风格选择 -->
              <div class="setting-item">
                <div class="setting-info">
                  <h4>界面风格</h4>
                  <p>选择您喜欢的界面风格</p>
                </div>
                <div class="style-selector">
                  <button 
                    v-for="style in styles" 
                    :key="style.class"
                    @click="changeStyle(style)"
                    :class="{ active: currentStyle === style.class }"
                    :title="style.name"
                    class="style-btn"
                  >
                    <i :class="style.icon"></i>
                    {{ style.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 退出登录确认弹框 -->
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
export default {
  name: 'MyProfile',
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
      // 如果切换到历史记录标签，加载历史记录
      if (tab === 'history') {
        this.loadHistory();
      }
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
/* 我的信息页面基础样式 */
.profile-container {
  min-height: 100vh;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
  padding: 20px;
}

/* 页面标题 */
.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-header h1 {
  font-size: 2.5rem;
  margin: 0;
  animation: cute-bounce 2s infinite;
}

/* 主要内容区域 */
.profile-content {
  display: flex;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 左侧菜单 */
.profile-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.profile-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.profile-menu .menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  margin-bottom: 10px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  color: #ec4899;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 2px solid #fbcfe8;
}

.profile-menu .menu-item:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(251, 207, 232, 0.3);
}

.profile-menu .menu-item.active {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.profile-menu .menu-item i {
  font-size: 1.3rem;
}

/* 退出登录按钮特殊样式 */
.profile-menu .logout-item {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  margin-top: 20px;
  border-color: #fca5a5;
}

.profile-menu .logout-item:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 右侧内容 */
.profile-main {
  flex: 1;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 50px 0;
}

.loading i {
  font-size: 3rem;
  margin-bottom: 20px;
  animation: cute-spin 1s linear infinite;
}

/* 个人信息卡片 */
.profile-card {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 3px solid #fbcfe8;
}

/* 头像区域 */
.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #fbcfe8;
  margin-bottom: 20px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 个人信息 */
.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  margin: 0 0 5px;
}

.profile-username {
  font-size: 1.1rem;
  margin: 0 0 15px;
  color: #6ee7b7;
}

.profile-bio {
  font-size: 1rem;
  margin: 0 0 20px;
  line-height: 1.5;
}

.profile-stats {
  display: flex;
  gap: 30px;
}

.profile-stats .stat-item {
  text-align: center;
}

.profile-stats .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  display: block;
}

.profile-stats .stat-label {
  font-size: 0.9rem;
  display: block;
}

/* 个人信息操作按钮 */
.profile-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.profile-actions .btn {
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.profile-actions .btn-primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #fec89a 100%);
  color: white;
  border: none;
}

.profile-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
}

.profile-actions .btn-secondary {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  border: none;
}

.profile-actions .btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(148, 163, 184, 0.4);
}

/* 个人资料详情 */
.profile-details {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 20px;
  padding: 25px;
  margin-bottom: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 3px solid #fbcfe8;
}

.profile-details h3 {
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: #ec4899;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 1.05rem;
}

.detail-label {
  font-weight: bold;
  min-width: 120px;
}

.detail-value a {
  color: #ec4899;
  text-decoration: none;
}

.detail-value a:hover {
  text-decoration: underline;
}

/* 我的创作统计 */
.creation-stats {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 3px solid #fbcfe8;
}

.creation-stats h3 {
  font-size: 1.5rem;
  margin: 0 0 20px;
  color: #ec4899;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #fbcfe8;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-title {
  font-size: 1rem;
  font-weight: bold;
}

/* 表单样式 */
.edit-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #ec4899;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #fbcfe8;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* 头像上传 */
.avatar-upload {
  position: relative;
  width: 150px;
  height: 150px;
  margin-bottom: 20px;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid #fbcfe8;
}

.avatar-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-upload:hover .avatar-upload-overlay {
  opacity: 1;
}

.avatar-upload-btn {
  background: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  cursor: pointer;
  font-weight: bold;
  color: #ec4899;
  display: flex;
  align-items: center;
  gap: 5px;
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

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

/* 按钮样式 */
.btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  color: #ec4899;
  border: 2px solid #fbcfe8;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 设置项 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #fbcfe8;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  margin: 0 0 5px;
  color: #ec4899;
}

.setting-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* 切换开关 */
.setting-toggle {
  position: relative;
  width: 60px;
  height: 30px;
}

.setting-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.setting-toggle label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fef3c7;
  border: 2px solid #fbcfe8;
  transition: .4s;
  border-radius: 34px;
}

.setting-toggle label:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.setting-toggle input:checked + label {
  background-color: #ec4899;
}

.setting-toggle input:focus + label {
  box-shadow: 0 0 1px #ec4899;
}

.setting-toggle input:checked + label:before {
  transform: translateX(26px);
}

/* 风格选择器 */
.style-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.style-btn {
  padding: 8px 16px;
  border: 2px solid #fbcfe8;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  color: #ec4899;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.style-btn:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
  transform: translateY(-2px);
}

.style-btn.active {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  border-color: #ec4899;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
  }
  
  .profile-stats {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 15px;
  }
  
  .profile-header h1 {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-avatar {
    width: 120px;
    height: 120px;
  }
}

/* 历史记录样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.clear-history-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.clear-history-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

.empty-history {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 15px;
  border: 2px solid #fbcfe8;
  margin-top: 20px;
}

.empty-history i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #fbcfe8;
}

.empty-history p {
  margin: 10px 0;
  font-size: 1.1rem;
}

.empty-history-tip {
  font-size: 0.9rem;
  color: #999;
}

.history-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏Chrome、Safari和Opera的滚动条 */
.history-container::-webkit-scrollbar {
  display: none;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px 0;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 15px;
  border: 2px solid #fbcfe8;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
  box-shadow: 0 4px 15px rgba(251, 207, 232, 0.3);
  transform: translateY(-2px);
}

.history-item-content {
  flex: 1;
}

.history-item-title {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ec4899;
  line-height: 1.4;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-item-date {
  margin: 0;
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
}

.history-item-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
}

.history-item-button:hover {
  background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
}

.history-item-button i {
  font-size: 1.1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #fbcfe8;
}

.card-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ec4899;
  margin: 0;
}

/* 退出登录确认弹框 */
.logout-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.logout-confirm-modal {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  animation: slideIn 0.3s ease;
  border: 3px solid #fbcfe8;
}

.logout-confirm-modal h3 {
  margin-bottom: 20px;
  color: #ec4899;
  font-size: 1.3rem;
  font-weight: 600;
}

.logout-confirm-modal p {
  margin-bottom: 30px;
  color: #666;
  font-size: 1.1rem;
}

.logout-confirm-buttons {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.logout-confirm-buttons button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  color: #ec4899;
  border: 2px solid #fbcfe8;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 207, 232, 0.4);
}

.confirm-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
</style>