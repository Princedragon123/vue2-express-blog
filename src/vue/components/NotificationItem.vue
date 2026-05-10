<template>
  <div 
    class="notification-item" 
    :class="{ unread: !notification.isRead }"
    @click="$emit('click', notification)"
  >
    <div class="notification-avatar">
      <img :src="avatarUrl" alt="用户头像" class="avatar-img">
    </div>
    
    <div class="notification-icon">
      <span class="nav-icon">{{ icon }}</span>
    </div>
    
    <div class="notification-content">
      <div class="notification-text">
        <span class="sender-name">{{ senderName }}</span>
        <span class="notification-action">{{ actionText }}</span>
        <span class="notification-target" v-if="notification.resourceType === 'blog'">你的文章</span>
        <span class="notification-target" v-else-if="notification.resourceType === 'comment'">你的评论</span>
      </div>
      <div class="notification-detail" v-if="notification.content">
        {{ notification.content }}
      </div>
      <div class="notification-meta">
        <span class="notification-time">{{ formattedTime }}</span>
        <button 
          class="notification-action-btn" 
          @click.stop="$emit('mark-read', notification._id)"
          v-if="!notification.isRead"
        >
          <span class="nav-icon">✓</span>
        </button>
        <button 
          class="notification-action-btn delete-btn" 
          @click.stop="$emit('delete', notification._id)"
        >
          <span class="nav-icon">🗑️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationItem',
  props: {
    notification: {
      type: Object,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: '🔔'
    },
    formattedTime: {
      type: String,
      default: ''
    }
  },
  computed: {
    senderName() {
      return this.notification.sender ? this.notification.sender.username : '';
    },
    actionText() {
      const type = this.notification.type;
      const actionMap = {
        like: '赞了',
        comment: '评论了',
        reply: '回复了',
        collect: '收藏了',
        follow: '关注了你',
        mention: '提到了你',
        message: '给你发了私信'
      };
      return actionMap[type] || '';
    }
  }
}
</script>

<style scoped>
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

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  color: #666;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.notification-action-btn:hover {
  background-color: #f0f0f0;
}

.delete-btn:hover {
  background-color: #fee2e2;
}
</style>
