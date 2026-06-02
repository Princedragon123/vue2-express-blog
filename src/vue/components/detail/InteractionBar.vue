<template>
  <div class="interaction-section">
    <div class="interaction-buttons">
      <button class="interaction-btn" @click="$emit('like')">
        <svg-icon name="heart" :size="18"></svg-icon>
        <span>{{ likes }}</span>
      </button>
      <button class="interaction-btn">
        <svg-icon name="comment" :size="18"></svg-icon>
        <span>{{ comments }}</span>
      </button>
      <button class="interaction-btn" @click="$emit('toggle-bookmark')">
        <svg-icon name="bookmark" :size="18"></svg-icon>
        <span>{{ bookmarks }}</span>
      </button>
      <button class="interaction-btn" @click="$emit('toggle-share')">
        <svg-icon name="share" :size="18"></svg-icon>
        <span>分享</span>
      </button>

      <div v-if="showShareMenu" class="share-menu" @click.self="$emit('close-share')">
        <div class="share-menu-header">
          <h4>分享到</h4>
          <button class="share-close-btn" @click="$emit('close-share')">
            <svg-icon name="close" :size="18"></svg-icon>
          </button>
        </div>
        <div class="share-options">
          <button class="share-option" @click="$emit('share', 'wechat')">
            <svg-icon name="wechat" :size="20"></svg-icon>
            <span>微信</span>
          </button>
          <button class="share-option" @click="$emit('share', 'weibo')">
            <svg-icon name="weibo" :size="20"></svg-icon>
            <span>微博</span>
          </button>
          <button class="share-option" @click="$emit('share', 'copy')">
            <svg-icon name="link" :size="20"></svg-icon>
            <span>复制链接</span>
          </button>
          <button class="share-option" @click="$emit('share', 'qq')">
            <svg-icon name="qq" :size="20"></svg-icon>
            <span>QQ</span>
          </button>
          <button class="share-option" @click="$emit('share', 'private')">
            <svg-icon name="envelope" :size="20"></svg-icon>
            <span>私信分享</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InteractionBar',
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
    isBookmarked: {
      type: Boolean,
      default: false
    },
    showShareMenu: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.interaction-section {
  padding: 20px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin: 20px 0;
}

.interaction-buttons {
  display: flex;
  gap: 15px;
  position: relative;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 2px solid #eee;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #666;
}

.interaction-btn:hover {
  border-color: var(--primary-color, #667eea);
  color: var(--primary-color, #667eea);
  background: rgba(102, 126, 234, 0.05);
}

.share-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 100;
  min-width: 280px;
}

.share-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.share-menu-header h4 {
  margin: 0;
  font-size: 16px;
}

.share-close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999;
}

.share-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: none;
  background: #f9f9f9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.share-option:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.share-option i {
  font-size: 20px;
  color: #666;
}

.share-option span {
  font-size: 11px;
  color: #999;
}
</style>
