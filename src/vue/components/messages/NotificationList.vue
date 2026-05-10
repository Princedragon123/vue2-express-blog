<template>
  <div class="notifications-section">
    <div class="notifications-list">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载通知中...</p>
      </div>

      <div
        class="notification-item"
        v-for="notification in notifications"
        :key="notification._id"
        :class="{ unread: !notification.isRead }"
        @click="$emit('click-notification', notification)"
      >
        <div class="notification-avatar">
          <img :src="getNotificationAvatar(notification)" alt="用户头像" class="avatar-img">
          <div v-if="!notification.isRead" class="unread-indicator"></div>
        </div>

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
            <span class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</span>
            <div class="notification-actions">
              <button
                class="notification-action-btn delete-btn"
                @click.stop="$emit('delete-notification', notification._id)"
              >
                <span class="nav-icon">🗑️</span> 删除
              </button>
            </div>
          </div>
        </div>

        <div class="notification-icon">
          <span class="nav-icon">{{ getNotificationIcon(notification.type) }}</span>
        </div>
      </div>

      <div v-if="!isLoading && notifications.length === 0" class="empty-notifications">
        <span class="nav-icon">🔔</span>
        <h3>暂无通知</h3>
        <p>当有新的通知时，会显示在这里</p>
      </div>
    </div>
  </div>
</template>

<script>
import avatarMixin from '../../mixins/avatarMixin';

export default {
  name: 'NotificationList',
  mixins: [avatarMixin],
  props: {
    notifications: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    getNotificationAvatar(notification) {
      return this.getAvatar(notification.sender || notification, 40);
    },
    getNotificationActionText(type) {
      const actions = {
        like: '点赞了',
        comment: '评论了',
        reply: '回复了',
        collect: '收藏了',
        follow: '关注了你',
        mention: '@了你'
      };
      return actions[type] || '操作了';
    },
    getNotificationIcon(type) {
      const icons = {
        like: '❤️',
        comment: '💬',
        reply: '↩️',
        collect: '📌',
        follow: '👥',
        mention: '@'
      };
      return icons[type] || '🔔';
    },
    formatNotificationTime(time) {
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
.notifications-section {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.notifications-section::-webkit-scrollbar {
  display: none;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state,
.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary-pink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-notifications .nav-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.empty-notifications h3 {
  margin: 0 0 5px 0;
  color: var(--text-primary);
}

.empty-notifications p {
  margin: 0;
  color: #6b7280;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid var(--background-dark);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 12px;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
  border-color: var(--primary-pink);
}

.notification-item.unread {
  background: linear-gradient(135deg, #fff5f7 0%, #fff 100%);
  border-color: var(--primary-pink);
}

.notification-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--background-dark);
}

.unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: var(--primary-pink);
  border-radius: 50%;
  border: 2px solid white;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.5;
}

.sender-name {
  font-weight: 600;
  color: var(--primary-pink);
}

.notification-action {
  margin-left: 4px;
  color: #666;
}

.notification-target {
  color: var(--primary-pink);
  font-weight: 500;
}

.notification-detail {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.notification-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-action-btn {
  background: none;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.delete-btn {
  color: #9ca3af;
}

.delete-btn:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.notification-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .notifications-section {
    padding: 10px;
  }

  .notification-item {
    padding: 12px;
  }
}
</style>
