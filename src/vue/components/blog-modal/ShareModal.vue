<template>
  <div class="share-modal-overlay" v-if="visible" @click="$emit('close')">
    <div class="share-modal-container" @click.stop>
      <div class="share-modal-header">
        <h3>分享博客</h3>
        <button class="share-close-btn" @click="$emit('close')">
          <span class="nav-icon">✕</span>
        </button>
      </div>
      <div class="share-modal-content">
        <div class="share-blog-info">
          <img :src="blogImage" :alt="blogTitle" class="share-blog-image">
          <div class="share-blog-details">
            <h4>{{ blogTitle }}</h4>
            <p class="share-blog-author">{{ blogAuthor }}</p>
          </div>
        </div>
        <div class="share-friends-section">
          <h5>选择好友</h5>
          <div class="friends-list" v-if="followingUsers && followingUsers.length > 0">
            <div v-for="user in followingUsers" :key="user._id" class="friend-item" @click="toggleFriend(user._id)">
              <img :src="getUserAvatar(user)" :alt="user.username" class="friend-avatar">
              <span class="friend-name">{{ user.username }}</span>
              <span class="friend-selected" v-if="selectedFriends.includes(user._id)"><span class="nav-icon">✓</span></span>
            </div>
          </div>
          <div v-else class="no-friends">
            <p>暂无关注的用户</p>
          </div>
        </div>
        <button class="share-btn" @click="handleShare" :disabled="selectedFriends.length === 0">
          <span class="nav-icon">🔗</span>
          <span>分享</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../../utils/avatarUtils';

export default {
  name: 'ShareModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    blogId: {
      type: String,
      default: ''
    },
    blogTitle: {
      type: String,
      default: ''
    },
    blogAuthor: {
      type: String,
      default: '未知作者'
    },
    blogImage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      followingUsers: [],
      selectedFriends: []
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadFollowingUsers();
        this.selectedFriends = [];
      }
    }
  },
  methods: {
    getUserAvatar(user, size = 40) {
      return getAuthorAvatar(user, size);
    },
    toggleFriend(userId) {
      const index = this.selectedFriends.indexOf(userId);
      if (index > -1) {
        this.selectedFriends.splice(index, 1);
      } else {
        this.selectedFriends.push(userId);
      }
    },
    async loadFollowingUsers() {
      try {
        const response = await this.$http.users.getFollowing('current');
        if (response.success) {
          this.followingUsers = response.data;
        }
      } catch (error) {
        console.error('加载关注用户失败:', error);
      }
    },
    async handleShare() {
      if (this.selectedFriends.length === 0) return;
      try {
        const response = await this.$http.messages.share({
          recipients: this.selectedFriends,
          blogId: this.blogId,
          blogTitle: this.blogTitle,
          blogAuthor: this.blogAuthor
        });
        if (response.success) {
          this.$emit('share-success', '分享成功！');
          this.$emit('close');
        } else {
          this.$emit('share-error', '分享失败: ' + (response.message || '未知错误'));
        }
      } catch (error) {
        console.error('分享失败:', error);
        this.$emit('share-error', '分享失败，请重试');
      }
    }
  }
};
</script>

<style scoped>
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

.share-modal-container {
  background-color: #ffffff;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.share-modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.share-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.share-close-btn:hover {
  background-color: #f3f4f6;
  color: #333;
}

.share-modal-content {
  padding: 25px;
}

.share-blog-info {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.share-blog-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.share-blog-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.share-blog-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.share-blog-author {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.share-friends-section h5 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  max-height: 300px;
  overflow-y: auto;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.friend-item:hover {
  background-color: #f3f4f6;
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.friend-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.friend-selected {
  color: #10b981;
  font-size: 18px;
}

.no-friends {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.share-btn {
  width: 100%;
  background-color: #ff6b9d;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.share-btn:hover:not(:disabled) {
  background-color: #ff8fab;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
}

.share-btn:active:not(:disabled) {
  transform: translateY(0);
}

.share-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .share-modal-container {
    width: 95%;
    max-height: 90vh;
  }
  .share-modal-header {
    padding: 15px 20px;
  }
  .share-modal-content {
    padding: 20px;
  }
  .share-blog-info {
    gap: 12px;
  }
  .share-blog-image {
    width: 70px;
    height: 70px;
  }
}
</style>
