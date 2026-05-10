<template>
  <div class="profile-card">
    <h3>通知设置</h3>
    <div class="notifications-settings">
      <div class="setting-item">
        <div class="setting-info">
          <h4>新消息通知</h4>
          <p>当收到新私信时通知我</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="message-notification" :checked="settings.message" @change="$emit('update', { key: 'message', value: $event.target.checked })">
          <label for="message-notification"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>关注通知</h4>
          <p>当有人关注我时通知我</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="follow-notification" :checked="settings.follow" @change="$emit('update', { key: 'follow', value: $event.target.checked })">
          <label for="follow-notification"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>点赞通知</h4>
          <p>当我的文章被点赞时通知我</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="like-notification" :checked="settings.like" @change="$emit('update', { key: 'like', value: $event.target.checked })">
          <label for="like-notification"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>评论通知</h4>
          <p>当我的文章被评论时通知我</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="comment-notification" :checked="settings.comment" @change="$emit('update', { key: 'comment', value: $event.target.checked })">
          <label for="comment-notification"></label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationSettings',
  props: {
    settings: {
      type: Object,
      default: () => ({
        message: true,
        follow: true,
        like: true,
        comment: true
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
