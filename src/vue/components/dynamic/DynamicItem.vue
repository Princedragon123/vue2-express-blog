<template>
  <div class="dynamic-item" :class="dynamic.type">
    <div class="dynamic-content">
      <div class="user-info">
        <img v-lazy="dynamic.user.avatar" alt="用户头像" class="user-avatar">
        <div class="user-details">
          <div class="username">{{ dynamic.user.name }}</div>
          <div class="dynamic-time">{{ formattedTime }}</div>
        </div>
      </div>
      
      <div class="dynamic-body">
        <p class="dynamic-text">
          <span v-html="dynamic.text"></span>
          <a v-if="dynamic.link" :href="dynamic.link" class="dynamic-link">{{ dynamic.linkText }}</a>
        </p>
        
        <div v-if="dynamic.content" class="content-preview" :class="dynamic.type">
          <template v-if="dynamic.type === 'publish'">
            <div class="blog-preview">
              <div class="blog-image">
                <img v-lazy="dynamic.content.image" alt="文章封面" class="preview-img">
              </div>
              <div class="blog-info">
                <div class="blog-category">{{ dynamic.content.category }}</div>
                <h4 class="blog-title">{{ dynamic.content.title }}</h4>
                <div class="blog-stats">
                  <span class="stat-item"><svg-icon name="eye" :size="14"></svg-icon> {{ dynamic.content.views }}</span>
                  <span class="stat-item"><svg-icon name="heart" :size="14"></svg-icon> {{ dynamic.content.likes }}</span>
                  <span class="stat-item"><svg-icon name="comment" :size="14"></svg-icon> {{ dynamic.content.comments }}</span>
                </div>
              </div>
            </div>
          </template>
          
          <template v-else-if="dynamic.type === 'like' || dynamic.type === 'comment'">
            <div class="interacted-content">
              <h4 class="content-title">{{ dynamic.content.title }}</h4>
              <p class="content-excerpt">{{ dynamic.content.excerpt }}</p>
            </div>
          </template>
          
          <template v-else-if="dynamic.type === 'follow'">
            <div class="followed-user">
              <img v-lazy="dynamic.content.avatar" alt="用户头像" class="followed-avatar">
              <div class="followed-info">
                <div class="followed-name">{{ dynamic.content.name }}</div>
                <div class="followed-bio">{{ dynamic.content.bio }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DynamicItem',
  props: {
    dynamic: {
      type: Object,
      required: true
    },
    formattedTime: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.dynamic-item {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dynamic-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.dynamic-content {
  padding: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff6b9d;
}

.user-details {
  flex: 1;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.dynamic-time {
  color: #999;
  font-size: 13px;
  margin-top: 4px;
}

.dynamic-body {
  margin-top: 12px;
}

.dynamic-text {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.dynamic-link {
  color: #ff6b9d;
  text-decoration: none;
  font-weight: 500;
  margin-left: 8px;
}

.dynamic-link:hover {
  text-decoration: underline;
}

.content-preview {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.blog-preview {
  display: flex;
  gap: 16px;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.blog-image {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blog-info {
  flex: 1;
  min-width: 0;
}

.blog-category {
  display: inline-block;
  background-color: #ff6b9d;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}

.blog-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.blog-stats {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-item i {
  font-size: 12px;
}

.interacted-content {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ff6b9d;
}

.content-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.content-excerpt {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.followed-user {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.followed-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff6b9d;
}

.followed-info {
  flex: 1;
}

.followed-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
  margin-bottom: 4px;
}

.followed-bio {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
