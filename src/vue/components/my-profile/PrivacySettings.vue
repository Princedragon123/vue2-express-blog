<template>
  <div class="profile-card">
    <h3>隐私设置</h3>
    <div class="privacy-settings">
      <div class="setting-item">
        <div class="setting-info">
          <h4>公开文章</h4>
          <p>允许其他用户查看您发布的文章</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="public-posts" :checked="settings.publicPosts" @change="$emit('update', { key: 'publicPosts', value: $event.target.checked })">
          <label for="public-posts"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>公开点赞</h4>
          <p>允许其他用户查看您的点赞记录</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="public-likes" :checked="settings.publicLikes" @change="$emit('update', { key: 'publicLikes', value: $event.target.checked })">
          <label for="public-likes"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>公开收藏</h4>
          <p>允许其他用户查看您的收藏记录</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="public-bookmarks" :checked="settings.publicBookmarks" @change="$emit('update', { key: 'publicBookmarks', value: $event.target.checked })">
          <label for="public-bookmarks"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>公开关注列表</h4>
          <p>允许其他用户查看您的关注和粉丝列表</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="public-follow-list" :checked="settings.publicFollowList" @change="$emit('update', { key: 'publicFollowList', value: $event.target.checked })">
          <label for="public-follow-list"></label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivacySettings',
  props: {
    settings: {
      type: Object,
      default: () => ({
        publicPosts: true,
        publicLikes: true,
        publicBookmarks: true,
        publicFollowList: true
      })
    }
  }
};
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.setting-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.setting-toggle {
  position: relative;
  width: 50px;
  height: 26px;
}

.setting-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.setting-toggle label {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ddd;
  border-radius: 26px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-toggle label::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.setting-toggle input:checked + label {
  background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2));
}

.setting-toggle input:checked + label::before {
  transform: translateX(24px);
}
</style>
