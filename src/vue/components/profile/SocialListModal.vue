<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <span class="nav-icon">❌</span>
        </button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="$emit('retry')">重新加载</button>
        </div>

        <div v-else>
          <div v-if="users.length === 0" class="empty-state">
            <span class="nav-icon">{{ listType === 'followers' ? '👥' : '➕' }}</span>
            <p>{{ listType === 'followers' ? '暂无粉丝' : '暂无关注' }}</p>
          </div>

          <div class="user-list">
            <div class="user-item" v-for="user in users" :key="user._id">
              <div class="user-info">
                <img v-lazy="getUserAvatar(user)" alt="用户头像" class="user-avatar">
                <div class="user-details">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-bio">{{ user.profile?.bio || '' }}</div>
                </div>
              </div>
              <button
                v-if="currentUserId !== user._id"
                :class="['btn-primary', user.isFollowing ? 'btn-unfollow' : 'btn-follow']"
                @click="$emit('toggle-follow', user)"
              >
                {{ user.isFollowing && user.isMutualFollowing ? '相互关注' : user.isFollowing ? '已关注' : '关注' }}
              </button>
            </div>
          </div>

          <div v-if="hasMore && users.length > 0" class="load-more-container">
            <button class="btn-primary" @click="$emit('load-more')" :disabled="loading">
              <span v-if="loading" class="nav-icon">🔄</span>
              {{ loading ? '加载中...' : '加载更多' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../../utils/avatarUtils';

export default {
  name: 'SocialListModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    listType: {
      type: String,
      default: 'followers'
    },
    users: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: String,
      default: ''
    }
  },
  methods: {
    getUserAvatar(user) {
      return getAuthorAvatar(user.profile?.avatar, 40);
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background-color: #f3f4f6;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
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

.empty-state .nav-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.error-message {
  text-align: center;
  padding: 20px;
  color: #dc2626;
}

.error-message p {
  margin: 0 0 12px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.user-item:hover {
  background-color: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--background-dark);
}

.user-details {
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.user-bio {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.btn-primary {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-follow {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
}

.btn-follow:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
}

.btn-unfollow {
  background: #f3f4f6;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.btn-unfollow:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #dc2626;
}

.load-more-container {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.load-more-container .btn-primary {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
    border-radius: 16px;
  }
}
</style>
