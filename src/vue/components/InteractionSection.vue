<template>
  <div class="interaction-section">
    <div class="interaction-buttons">
      <button class="interaction-btn" :class="{ 'liked': isLiked }" aria-label="点赞" tabindex="0" @click="handleLike">
        <svg-icon name="heart" :size="18"></svg-icon>
        <span>{{ likes }}</span>
      </button>
      <button class="interaction-btn" aria-label="评论" tabindex="0" @click="$emit('open-comments')">
        <svg-icon name="comment" :size="18"></svg-icon>
        <span>{{ comments }}</span>
      </button>
      <button class="interaction-btn" :class="{ 'bookmarked': isBookmarked }" aria-label="收藏" tabindex="0" @click="handleBookmark">
        <svg-icon name="bookmark" :size="18"></svg-icon>
        <span>{{ bookmarks }}</span>
      </button>
      <button class="interaction-btn" aria-label="分享" tabindex="0" @click="$emit('open-share')">
        <svg-icon name="shareAlt" :size="18"></svg-icon>
        <span>分享</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InteractionSection',
  props: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    isLiked: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    blogId: {
      type: String,
      required: true
    }
  },
  emits: ['like', 'bookmark', 'open-comments', 'open-share'],
  methods: {
    async handleLike() {
      this.$emit('like', this.blogId);
    },
    async handleBookmark() {
      this.$emit('bookmark', this.blogId);
    }
  }
};
</script>

<style scoped>
.interaction-section {
  margin: 20px 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  padding: 15px 0;
}

.interaction-buttons {
  display: flex;
  gap: 20px;
  align-items: center;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.interaction-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.interaction-btn i {
  font-size: 16px;
}

.interaction-btn.liked i {
  color: #ff4757;
}

.interaction-btn.bookmarked i {
  color: #ff9f43;
}

.interaction-btn:active {
  transform: scale(0.95);
}
</style>