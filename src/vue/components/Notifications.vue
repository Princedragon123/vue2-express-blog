<!-- Notifications.vue - 通知组件 -->
<template>
  <div class="notifications-container">
    <NotificationHeader
      :unread-count="unreadCount"
      @back="goBack"
      @mark-all-read="markAllAsRead"
    />
    
    <NotificationTabs
      :active-tab="activeTab"
      :unread-count="unreadCount"
      :total-count="totalCount"
      @switch-tab="switchTab"
    />
    
    <div class="notifications-list" @scroll="handleScroll" ref="notificationsList">
      <div v-if="isLoading && notifications.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>加载通知中...</p>
      </div>
      
      <div v-if="isLoadingMore" class="loading-more-indicator">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <NotificationItem
        v-for="notification in filteredNotifications" 
        :key="notification._id"
        :notification="notification"
        :avatar-url="getNotificationAvatar(notification)"
        :icon="getNotificationIcon(notification.type)"
        :formatted-time="formatTime(notification.createdAt)"
        @click="handleNotificationClick"
        @mark-read="markAsRead"
        @delete="deleteNotification"
      />
      
      <div v-if="!isLoading && notifications.length === 0" class="empty-notifications">
        <span class="nav-icon">🔔</span>
        <h3>暂无通知</h3>
        <p>当有新的通知时，会显示在这里</p>
      </div>
    </div>
  </div>
</template>

<script>
import avatarMixin from '../mixins/avatarMixin';
import webSocketMixin from '../mixins/webSocketMixin';
import { showNotification } from '../utils/notification';
import NotificationHeader from './NotificationHeader.vue';
import NotificationTabs from './NotificationTabs.vue';
import NotificationItem from './NotificationItem.vue';

export default {
  name: 'Notifications',
  
  mixins: [avatarMixin, webSocketMixin],
  
  components: {
    NotificationHeader,
    NotificationTabs,
    NotificationItem
  },
  
  created() {
    this.loadNotifications();
    this.setupWebSocket();
  },
  
  beforeDestroy() {
    this.removeSocketListeners();
  },
  
  data() {
    return {
      isLoading: false,
      isLoadingMore: false,
      hasMoreNotifications: true,
      currentPage: 1,
      pageSize: 20,
      notifications: [],
      activeTab: 'all',
      unreadCount: 0,
      totalCount: 0,
      currentUserId: null
    };
  },
  
  computed: {
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
    
    setupSocketListeners() {
      this.addSocketListener('notification', (notification) => {
        this.notifications.unshift(notification);
        this.unreadCount++;
        this.totalCount++;
      });
    },
    
    goBack() {
      this.$router.push('/messages');
    },
    
    switchTab(tab) {
      this.activeTab = tab;
    },
    
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
    
    handleScroll() {
      const container = this.$refs.notificationsList;
      if (!container) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (scrollHeight - scrollTop - clientHeight < 100) {
        this.loadMoreNotifications();
      }
    },
    
    async markAllAsRead() {
      try {
        await this.$http.notifications.markAllAsRead();
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
    
    async markAsRead(notificationId) {
      try {
        await this.$http.notifications.markAsRead(notificationId);
        this.notifications = this.notifications.map(notification => {
          if (notification._id === notificationId) {
            return { ...notification, isRead: true };
          }
          return notification;
        });
        if (this.unreadCount > 0) {
          this.unreadCount--;
        }
        this.showNotification('通知已标记为已读', 'success');
      } catch (error) {
        console.error('标记通知为已读失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
      }
    },
    
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
    
    handleNotificationClick(notification) {
      if (!notification.isRead) {
        this.markAsRead(notification._id);
      }
      if (notification.resourceType === 'blog') {
        this.$router.push(`/blog/${notification.resourceId}`);
      }
    },
    
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
    
    getNotificationAvatar(notification) {
      return this.getAvatar(notification.sender || notification, 40);
    },
    
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
    },
    
    showNotification(message, type = 'info') {
      showNotification(message, type);
    }
  }
};
</script>

<style scoped>
.notifications-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
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

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
}

.empty-notifications .nav-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-notifications h3 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #666;
}

.empty-notifications p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
