<template>
  <div class="profile-header">
    <div class="profile-cover"
      @mousemove="$emit('cover-mouse-move', $event)"
      @mouseleave="$emit('cover-mouse-leave')"
      :style="coverStyle">
      <div class="cover-background" :style="coverImageStyle"></div>
    </div>
    <div class="profile-avatar-container">
      <img v-lazy="avatarUrl" alt="用户头像" class="profile-avatar" @error="$emit('avatar-error')">
    </div>
    <div class="profile-info">
      <div class="profile-name">{{ userInfo.username }}</div>
      <div class="profile-bio">{{ userInfo.bio }}</div>
      <div class="profile-details" v-if="userInfo.location || userInfo.website || userInfo.occupation">
        <div class="detail-item" v-if="userInfo.location">
          <span class="nav-icon">📍</span>
          <span>{{ userInfo.location }}</span>
        </div>
        <div class="detail-item" v-if="userInfo.occupation">
          <span class="nav-icon">💼</span>
          <span>{{ userInfo.occupation }}</span>
        </div>
        <div class="detail-item" v-if="userInfo.website">
          <span class="nav-icon">🌐</span>
          <a :href="userInfo.website" target="_blank" rel="noopener noreferrer">{{ userInfo.website }}</a>
        </div>
      </div>
      <div class="profile-actions">
        <button
          v-if="!isCurrentUser"
          :class="['btn-primary', isFollowing ? 'btn-unfollow' : 'btn-follow']"
          @click="$emit('toggle-follow')"
        >
          {{ isMutualFollowing ? '相互关注' : isFollowing ? '已关注' : '关注' }}
        </button>
      </div>

      <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click="$emit('update:showConfirmDialog', false)">
        <div class="confirm-dialog" @click.stop>
          <h3>确认操作</h3>
          <p>确定要跳转到我的创作页面吗？</p>
          <div class="confirm-dialog-buttons">
            <button class="btn-secondary" @click="$emit('update:showConfirmDialog', false)">取消</button>
            <button class="btn-primary" @click="$emit('navigate-creation')">确定</button>
          </div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-count">{{ userInfo.posts }}</span>
          <span class="stat-label">攻略</span>
        </div>
        <div class="stat-item" @click="$emit('show-following')">
          <span class="stat-count">{{ userInfo.following }}</span>
          <span class="stat-label">关注</span>
        </div>
        <div class="stat-item" @click="$emit('show-followers')">
          <span class="stat-count">{{ userInfo.followers }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-count">{{ userInfo.likes }}</span>
          <span class="stat-label">获赞</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileHeader',
  props: {
    userInfo: {
      type: Object,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    isCurrentUser: {
      type: Boolean,
      default: false
    },
    isFollowing: {
      type: Boolean,
      default: false
    },
    isMutualFollowing: {
      type: Boolean,
      default: false
    },
    coverStyle: {
      type: Object,
      default: () => ({})
    },
    coverImageStyle: {
      type: Object,
      default: () => ({})
    },
    showConfirmDialog: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.profile-header {
  position: relative;
  margin-bottom: 30px;
}

.profile-cover {
  height: 250px;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  position: relative;
  cursor: default;
  transition: transform 0.3s ease;
}

.cover-background {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
}

.profile-avatar-container {
  position: absolute;
  top: 190px;
  left: 30px;
  z-index: 2;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-info {
  padding: 60px 30px 20px;
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.profile-bio {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.6;
}

.profile-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
}

.detail-item a {
  color: var(--primary-pink);
  text-decoration: none;
}

.detail-item a:hover {
  text-decoration: underline;
}

.profile-actions {
  margin-bottom: 16px;
}

.btn-primary {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
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
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
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

.btn-secondary {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  color: #6b7280;
  transition: all 0.2s ease;
}

.confirm-dialog-overlay {
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
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-dialog h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: var(--text-primary);
}

.confirm-dialog p {
  margin: 0 0 20px;
  color: #6b7280;
}

.confirm-dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.profile-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

@media (max-width: 768px) {
  .profile-cover {
    height: 180px;
  }

  .profile-avatar-container {
    top: 130px;
    left: 20px;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
  }

  .profile-info {
    padding: 50px 20px 15px;
  }

  .profile-name {
    font-size: 20px;
  }

  .profile-stats {
    gap: 16px;
  }

  .stat-count {
    font-size: 16px;
  }
}
</style>
