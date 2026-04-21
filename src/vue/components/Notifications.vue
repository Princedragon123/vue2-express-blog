<!-- ============================================================
Notifications.vue - 通知组件（学习版·WebSocket实时推送）
============================================================

【文件职责】
展示和管理用户通知，包括：
1. 通知列表展示（全部/未读）
2. WebSocket实时接收新通知
3. 标记已读/全部已读
4. 删除通知
5. 点击通知跳转到相关资源

【学习重点】
┌─────────────────────────────────────────────────────────────────────────┐
│  1. WebSocket实时推送：新通知自动添加到列表                              │
│  2. Mixin混入：复用WebSocket和头像处理逻辑                              │
│  3. 计算属性：过滤通知列表                                              │
│  4. 生命周期：created初始化，beforeDestroy清理                          │
│  5. 事件处理：点击通知跳转、标记已读                                    │
└─────────────────────────────────────────────────────────────────────────┘

【WebSocket实时推送流程】
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   用户A点赞博客                                                         │
│   ─────────────                                                         │
│       │                                                                 │
│       ▼                                                                 │
│   后端 BlogController.likeBlog()                                        │
│   ─────────────────────────                                             │
│       │                                                                 │
│       │  socketService.sendNotification(blogAuthor, notification)       │
│       ▼                                                                 │
│   后端 socketService.js                                                 │
│   ─────────────────                                                     │
│       │                                                                 │
│       │  io.to(userId).emit('notification', notification)               │
│       ▼                                                                 │
│   前端 socket.js                                                        │
│   ─────────────                                                         │
│       │                                                                 │
│       │  socket.on('notification', handler)                             │
│       ▼                                                                 │
│   前端 Notifications.vue                                                │
│   ──────────────────────                                                │
│       │                                                                 │
│       │  this.notifications.unshift(notification)                       │
│       ▼                                                                 │
│   页面实时显示新通知 ✅                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

【通知类型】
┌─────────────────────────────────────────────────────────────────────────┐
│  type        │ 说明           │ 图标                                    │
│  ───────────┼────────────────┼───────────────────────────────────────  │
│  like        │ 点赞           │ ❤️                                      │
│  comment     │ 评论           │ 💬                                      │
│  reply       │ 回复           │ ↩️                                      │
│  collect     │ 收藏           │ 📌                                      │
│  follow      │ 关注           │ 👥                                      │
│  mention     │ @提及          │ @                                       │
│  message     │ 私信           │ ✉️                                      │
└─────────────────────────────────────────────────────────────────────────┘

【面试常问】
Q1: 如何实现实时通知？
A: WebSocket长连接，服务器主动推送

Q2: 为什么用Mixin？
A: 复用WebSocket初始化和头像处理逻辑

Q3: beforeDestroy中做什么？
A: 移除事件监听器，防止内存泄漏

Q4: 如何优化大量通知？
A: 分页加载、虚拟列表、缓存

Q5: 如何保证通知不丢失？
A: 数据库持久化 + 离线存储
============================================================ -->
<template>
  <div class="notifications-container">
    <!-- 顶部导航 -->
    <header class="notifications-header">
      <div class="header-container">
        <button class="back-btn" @click="goBack">
          <span class="nav-icon">←</span>
        </button>
        <h1 class="page-title">通知</h1>
        <div class="header-actions">
          <button class="action-btn" v-if="unreadCount > 0" @click="markAllAsRead">
            <span class="nav-icon">✓✓</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- 通知标签页 -->
    <div class="notification-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'all' }"
        @click="switchTab('all')"
      >
        全部
        <span v-if="totalCount > 0" class="tab-badge">{{ totalCount }}</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'unread' }"
        @click="switchTab('unread')"
      >
        未读
        <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
      </button>
    </div>
    
    <!-- 通知列表 -->
    <div class="notifications-list" @scroll="handleScroll" ref="notificationsList">
      <!-- 加载状态 -->
      <div v-if="isLoading && notifications.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>加载通知中...</p>
      </div>
      
      <!-- 加载更多指示器 -->
      <div v-if="isLoadingMore" class="loading-more-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 通知项 -->
      <div 
        class="notification-item" 
        v-for="notification in filteredNotifications" 
        :key="notification._id"
        :class="{ unread: !notification.isRead }"
        @click="handleNotificationClick(notification)"
      >
        <!-- 通知头像 -->
        <div class="notification-avatar">
          <img :src="getNotificationAvatar(notification)" alt="用户头像" class="avatar-img">
        </div>
        
        <!-- 通知图标 -->
        <div class="notification-icon">
          <span class="nav-icon">{{ getNotificationIcon(notification.type) }}</span>
        </div>
        
        <!-- 通知内容 -->
        <div class="notification-content">
          <div class="notification-text">
            <span class="sender-name">{{ notification.sender.username }}</span>
            <span class="notification-action">{{ getNotificationActionText(notification.type) }}</span>
            <span class="notification-target" v-if="notification.resourceType === 'blog'">你的文章</span>
            <span class="notification-target" v-else-if="notification.resourceType === 'comment'">你的评论</span>
          </div>
          <div class="notification-detail" v-if="notification.content">
            {{ notification.content }}
          </div>
          <div class="notification-meta">
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            <button 
              class="notification-action-btn" 
              @click.stop="markAsRead(notification._id)"
              v-if="!notification.isRead"
            >
              <span class="nav-icon">✓</span>
            </button>
            <button 
              class="notification-action-btn delete-btn" 
              @click.stop="deleteNotification(notification._id)"
            >
              <span class="nav-icon">🗑️</span>
            </button>
          </div>
        </div>
        

      </div>
      
      <!-- 空通知状态 -->
      <div v-if="!isLoading && notifications.length === 0" class="empty-notifications">
        <span class="nav-icon">🔔</span>
        <h3>暂无通知</h3>
        <p>当有新的通知时，会显示在这里</p>
      </div>
    </div>
  </div>
</template>

<script>
// ============================================================
// 导入依赖模块
// ============================================================
// avatarMixin: 头像处理混入
import avatarMixin from '../mixins/avatarMixin';
// webSocketMixin: WebSocket功能混入
import webSocketMixin from '../mixins/webSocketMixin';
// showNotification: 通知提示工具
import { showNotification } from '../utils/notification';

export default {
  name: 'Notifications',
  
  // ============================================================
  // mixins - 混入
  // ============================================================
  // 【作用】复用其他组件的逻辑
  // 
  // 【avatarMixin 提供】
  // - getAvatar(author, size): 获取头像URL
  // 
  // 【webSocketMixin 提供】
  // - initWebSocket(): 初始化WebSocket连接
  // - addSocketListener(event, handler): 添加事件监听
  // - removeSocketListeners(): 移除所有监听器
  // - socketConnected: 连接状态
  // 
  // 【面试常问】
  // Q: Mixin和组件有同名方法怎么办？
  // A: 组件优先级更高，会覆盖Mixin的方法
  // ============================================================
  mixins: [avatarMixin, webSocketMixin],
  
  // ============================================================
  // created - 生命周期钩子
  // ============================================================
  // 【触发时机】组件创建完成后
  // 【作用】初始化数据，加载通知列表，建立WebSocket连接
  // ============================================================
  created() {
    this.loadNotifications();
    this.setupWebSocket();
  },
  
  // ============================================================
  // beforeDestroy - 生命周期钩子
  // ============================================================
  // 【触发时机】组件销毁前
  // 【作用】清理WebSocket监听器，防止内存泄漏
  // 
  // 【重要】
  // 如果不移除监听器，组件销毁后仍可能收到事件
  // 导致错误或内存泄漏
  // ============================================================
  beforeDestroy() {
    this.removeSocketListeners();
  },
  
  // ============================================================
  // data - 组件数据
  // ============================================================
  data() {
    return {
      // 加载状态
      isLoading: false,
      
      // 是否正在加载更多
      isLoadingMore: false,
      
      // 是否还有更多数据
      hasMoreNotifications: true,
      
      // 当前页码
      currentPage: 1,
      
      // 每页数量
      pageSize: 20,
      
      // 通知列表
      // 【结构】[{ _id, sender, type, content, resourceType, resourceId, isRead, createdAt }]
      notifications: [],
      
      // 当前激活的标签页
      // 【可选值】'all'（全部）或 'unread'（未读）
      activeTab: 'all',
      
      // 未读通知数量
      unreadCount: 0,
      
      // 通知总数
      totalCount: 0,
      
      // 当前用户 ID
      currentUserId: null
    };
  },
  
  // ============================================================
  // computed - 计算属性
  // ============================================================
  computed: {
    // 过滤后的通知列表
    // 【逻辑】根据activeTab过滤通知
    // - 'all': 返回所有通知
    // - 'unread': 返回未读通知
    filteredNotifications() {
      if (this.activeTab === 'all') {
        return this.notifications;
      } else if (this.activeTab === 'unread') {
        return this.notifications.filter(notification => !notification.isRead);
      }
      return this.notifications;
    }
  },
  
  methods: {
    // ========================================================
    // 初始化WebSocket（核心方法）
    // ========================================================
    // 【作用】建立WebSocket连接并设置监听器
    // 
    // 【流程】
    // 1. 调用Mixin的initWebSocket()建立连接
    // 2. 连接成功后设置事件监听器
    // 
    // 【面试常问】
    // Q: 为什么要先建立连接再设置监听？
    // A: 连接成功后才能监听事件
    // ========================================================
    async setupWebSocket() {
      try {
        const connected = await this.initWebSocket();
        if (connected) {
          this.setupSocketListeners();
        }
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    },
    
    // ========================================================
    // 设置WebSocket事件监听
    // ========================================================
    // 【作用】监听服务器推送的新通知
    // 
    // 【事件】'notification'
    // 【触发时机】服务器调用 socketService.sendNotification()
    // 
    // 【处理逻辑】
    // 1. 将新通知添加到列表顶部
    // 2. 更新未读计数
    // 3. 更新总数
    // 
    // 【面试常问】
    // Q: 为什么用unshift而不是push？
    // A: unshift添加到数组开头，新通知显示在最上面
    // ========================================================
    setupSocketListeners() {
      this.addSocketListener('notification', (notification) => {
        // 添加到列表顶部
        this.notifications.unshift(notification);
        // 更新计数
        this.unreadCount++;
        this.totalCount++;
      });
    },
    
    // 返回消息页面
    goBack() {
      this.$router.push('/messages');
    },
    
    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab;
    },
    
    // ========================================================
    // 加载通知列表
    // ========================================================
    // 【API】GET /api/notifications
    // 【返回】{ data: 通知列表, meta: { total, unread } }
    // ========================================================
    async loadNotifications() {
      try {
        this.isLoading = true;
        this.currentPage = 1;
        this.hasMoreNotifications = true;
        
        const data = await this.$http.notifications.getList({
          page: this.currentPage,
          limit: this.pageSize
        });
        
        this.notifications = data.data;
        this.unreadCount = data.meta.unread;
        this.totalCount = data.meta.total;
        
        // 判断是否还有更多数据
        this.hasMoreNotifications = this.notifications.length < this.totalCount;
      } catch (error) {
        console.error('加载通知失败:', error);
        this.notifications = [];
        this.unreadCount = 0;
        this.totalCount = 0;
      } finally {
        this.isLoading = false;
      }
    },
    
    // 加载更多通知（滚动加载）
    async loadMoreNotifications() {
      if (!this.hasMoreNotifications || this.isLoadingMore) {
        return;
      }
      
      try {
        this.isLoadingMore = true;
        this.currentPage++;
        
        const data = await this.$http.notifications.getList({
          page: this.currentPage,
          limit: this.pageSize
        });
        
        const newNotifications = data.data;
        
        if (newNotifications.length === 0) {
          this.hasMoreNotifications = false;
        } else {
          this.notifications = [...this.notifications, ...newNotifications];
          this.hasMoreNotifications = this.notifications.length < this.totalCount;
        }
      } catch (error) {
        console.error('加载更多通知失败:', error);
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    // 处理滚动事件
    handleScroll() {
      const container = this.$refs.notificationsList;
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // 当滚动到距离底部 100px 时加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        this.loadMoreNotifications();
      }
    },
    
    // ========================================================
    // 标记所有通知为已读
    // ========================================================
    // 【API】PUT /api/notifications/read-all
    // ========================================================
    async markAllAsRead() {
      try {
        await this.$http.notifications.markAllAsRead();
        // 更新所有通知状态
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        this.unreadCount = 0;
        this.showNotification('所有通知已标记为已读', 'success');
      } catch (error) {
        console.error('标记所有通知为已读失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
      }
    },
    
    // ========================================================
    // 标记单个通知为已读
    // ========================================================
    // 【API】PUT /api/notifications/:id/read
    // ========================================================
    async markAsRead(notificationId) {
      try {
        await this.$http.notifications.markAsRead(notificationId);
        // 更新通知状态
        this.notifications = this.notifications.map(notification => {
          if (notification._id === notificationId) {
            return { ...notification, isRead: true };
          }
          return notification;
        });
        // 更新未读计数
        if (this.unreadCount > 0) {
          this.unreadCount--;
        }
        this.showNotification('通知已标记为已读', 'success');
      } catch (error) {
        console.error('标记通知为已读失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
      }
    },
    
    // 删除通知
    async deleteNotification(notificationId) {
      try {
        await this.$http.notifications.delete(notificationId);
        const deletedNotification = this.notifications.find(n => n._id === notificationId);
        this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
        this.totalCount--;
        if (!deletedNotification.isRead && this.unreadCount > 0) {
          this.unreadCount--;
        }
        this.showNotification('通知已删除', 'success');
      } catch (error) {
        console.error('删除通知失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
      }
    },
    
    // 处理通知点击
    handleNotificationClick(notification) {
      if (!notification.isRead) {
        this.markAsRead(notification._id);
      }
      if (notification.resourceType === 'blog') {
        this.$router.push(`/blog/${notification.resourceId}`);
      }
    },
    
    // 获取通知动作文本
    getNotificationActionText(type) {
      switch (type) {
        case 'like': return '点赞了';
        case 'comment': return '评论了';
        case 'reply': return '回复了';
        case 'collect': return '收藏了';
        case 'follow': return '关注了你';
        case 'mention': return '@了你';
        default: return '操作了';
      }
    },
    
    // 获取通知头像
    getNotificationAvatar(notification) {
      return this.getAvatar(notification.sender || notification, 40);
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
      switch (type) {
        case 'like': return '❤️';
        case 'comment': return '💬';
        case 'reply': return '↩️';
        case 'collect': return '📌';
        case 'follow': return '👥';
        case 'mention': return '@';
        default: return '🔔';
      }
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '';
      const now = new Date();
      const notificationTime = new Date(time);
      const diffMs = now - notificationTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return notificationTime.toLocaleDateString('zh-CN');
    }
  }
};
</script>

<style scoped>
.notifications-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.notifications-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-family);
}

.action-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f0f0f0;
}

.notification-tabs {
  display: flex;
  background-color: white;
  max-width: 1200px;
  margin: 0 auto;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background-color: #f5f5f5;
}

.tab-btn.active {
  color: #4caf50;
  background-color: #f0f9f0;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #4caf50;
}

.tab-badge {
  background-color: #f44336;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.notifications-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 200px);
  overflow-y: auto;
}

.loading-more-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.loading-more-indicator .spinner {
  width: 24px;
  height: 24px;
  border-width: 3px;
  margin-bottom: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: #666;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification-item.unread {
  border-left: 4px solid #4caf50;
  background-color: #f9fff9;
}

.notification-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.sender-name {
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.notification-action {
  color: #666;
  margin-right: 4px;
}

.notification-target {
  color: #4caf50;
  font-weight: 500;
}

.notification-detail {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-action-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.notification-action-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.notification-action-btn.delete-btn:hover {
  color: #f44336;
}

.notification-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #999;
  padding: 8px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: #999;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-notifications .nav-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.empty-notifications h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #666;
}

.empty-notifications p {
  font-size: 14px;
  margin: 0;
  color: #999;
}

@media (max-width: 768px) {
  .header-container {
    padding: 16px 12px;
  }
  
  .notifications-list {
    padding: 12px;
  }
  
  .notification-item {
    padding: 16px;
    gap: 12px;
  }
  
  .avatar-img {
    width: 40px;
    height: 40px;
  }
}
</style>