<template>
  <div class="author-info">
    <img 
      :src="avatarUrl" 
      :alt="username" 
      class="author-avatar"
      @click="$emit('open-profile', authorId, username)"
      style="cursor: pointer"
    >
    <div class="author-details">
      <span 
        class="author-name"
        @click="$emit('open-profile', authorId, username)"
        style="cursor: pointer; text-decoration: underline"
      >{{ username }}</span>
      <span class="post-date">{{ postDate }}</span>
    </div>
    <button 
      v-if="showFollowBtn" 
      class="follow-btn" 
      :class="{ 'followed': isFollowing }" 
      @click="$emit('toggle-follow')"
    >
      <span class="nav-icon" v-if="!isFollowing">👤+</span>
      <span class="nav-icon" v-else>👤✓</span>
      {{ isFollowing ? '已关注' : '关注' }}
    </button>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../../utils/avatarUtils';

export default {
  name: 'AuthorInfo',
  props: {
    author: {
      type: Object,
      default: null
    },
    currentUserId: {
      type: String,
      default: ''
    },
    isFollowing: {
      type: Boolean,
      default: false
    },
    postDate: {
      type: String,
      default: ''
    }
  },
  computed: {
    authorId() {
      return this.author?.id || this.author?._id || '';
    },
    username() {
      return this.author?.username || '未知作者';
    },
    avatarUrl() {
      return getAuthorAvatar(this.author, 40);
    },
    showFollowBtn() {
      return this.authorId !== this.currentUserId && this.currentUserId;
    }
  }
};
</script>

<style scoped>
.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid #ff6b9d;
}

.author-details {
  display: flex;
  flex-direction: column;
  margin-right: auto;
  min-width: 120px;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.post-date {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #ff6b9d;
  background-color: white;
  color: #ff6b9d;
}

.follow-btn:hover:not(.followed) {
  background-color: #ff6b9d;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
}

.follow-btn.followed {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.follow-btn.followed:hover {
  background-color: #059669;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.follow-btn:active {
  transform: translateY(0);
}
</style>
