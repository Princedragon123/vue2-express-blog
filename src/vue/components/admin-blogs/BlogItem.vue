<template>
  <div class="blog-item" @click="$emit('view', blog)" :class="{ 'clickable': true }">
    <div class="blog-checkbox">
      <input type="checkbox" :id="'blog-' + blog._id" :checked="isSelected" @change="$emit('toggle-select')" @click.stop>
      <label :for="'blog-' + blog._id"></label>
    </div>
    <div class="blog-info">
      <div class="blog-image">
        <img v-lazy="blog.image" alt="博客封面" class="cover-image">
      </div>
      <div class="blog-details">
        <div class="blog-title">{{ blog.title }}</div>
        <div class="blog-meta">
          <span class="blog-author">{{ blog.author?.username || '未知用户' }}</span>
          <span class="blog-date">{{ formatDate(blog.createdAt) }}</span>
          <span class="blog-status" :class="blog.status">{{ getStatusName(blog.status) }}</span>
        </div>
        <div class="blog-excerpt">{{ blog.excerpt || generateExcerpt(blog.content) }}</div>
        <div class="blog-stats">
          <span class="stat-item">
            <svg-icon name="eye" :size="14"></svg-icon> {{ blog.views || 0 }}
          </span>
          <span class="stat-item">
            <svg-icon name="heart" :size="14"></svg-icon> {{ blog.likes || 0 }}
          </span>
          <span class="stat-item">
            <svg-icon name="comment" :size="14"></svg-icon> {{ blog.comments || 0 }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="blog-actions" @click.stop>
      <button class="action-btn view-btn" @click="$emit('view', blog)">
        <svg-icon name="eye" :size="16"></svg-icon> 查看
      </button>
      
      <button class="action-btn delete-btn" @click="$emit('delete', blog)">
        <svg-icon name="trash" :size="16"></svg-icon> 删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogItem',
  
  props: {
    blog: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    
    generateExcerpt(content) {
      if (!content) return '';
      const plainText = content.replace(/<[^>]*>/g, '');
      return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    },
    
    getStatusName(status) {
      const statusMap = {
        'published': '已发布',
        'draft': '草稿',
        'pending': '待审核'
      };
      return statusMap[status] || status;
    }
  }
};
</script>

<style scoped>
.blog-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 0;
  border-bottom: 1px solid var(--background-dark);
  gap: 24px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 12px;
  position: relative;
}

.blog-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.blog-item.clickable {
  cursor: pointer;
}

.blog-item.clickable:hover {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  transform: translateX(4px);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.blog-checkbox {
  margin-top: 24px;
  margin-right: 20px;
  flex-shrink: 0;
}

.blog-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary-pink);
}

.blog-info {
  display: flex;
  flex: 1;
  gap: 20px;
  min-width: 0;
}

.blog-image {
  width: 160px;
  height: 108px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid var(--background-dark);
}

.blog-item:hover .blog-image {
  transform: scale(1.02);
  box-shadow: 0 6px 12px rgba(236, 72, 153, 0.3);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.blog-details {
  flex: 1;
  min-width: 0;
  padding-right: 140px;
}

.blog-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.blog-item:hover .blog-title {
  color: var(--primary-pink);
}

.blog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6c757d;
}

.blog-author {
  font-weight: 500;
  color: var(--text-primary);
}

.blog-date {
  position: relative;
  padding-left: 12px;
}

.blog-date::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #adb5bd;
}

.blog-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blog-status.published {
  background: linear-gradient(135deg, var(--accent-green) 0%, #e8f5e9 100%);
  color: #2e7d32;
  box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2);
}

.blog-excerpt {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.blog-stats {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 14px;
  color: #6c757d;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
}

.blog-item:hover .stat-item {
  color: var(--primary-pink);
}

.stat-item i {
  font-size: 16px;
}

.blog-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: absolute;
  right: 0;
  top: 20px;
  width: 120px;
  align-items: flex-end;
  pointer-events: auto;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  min-width: 100px;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.view-btn {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
}

.view-btn:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.delete-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
}
</style>
