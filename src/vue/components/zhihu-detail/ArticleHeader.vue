<template>
  <header class="article-header">
    <div class="author-section">
      <div class="author-info">
        <img :src="avatarUrl" alt="作者头像" class="author-avatar" @error="$emit('avatar-error')">
        <div class="author-details">
          <div class="author-name">{{ authorName }}</div>
          <div class="author-meta">
            <span class="publish-date">{{ formattedDate }}</span>
            <span class="article-stats">
              <i class="fa fa-eye"></i> {{ views }} 阅读
            </span>
          </div>
        </div>
      </div>
      <div class="author-actions">
        <button
          v-if="!isAuthor"
          class="follow-btn"
          :class="{ 'followed': isFollowing }"
          @click="$emit('toggle-follow')"
        >
          {{ isFollowing ? '已关注' : '关注' }}
        </button>
        <button
          v-if="isAuthor"
          class="delete-btn"
          @click="$emit('delete-article')"
        >
          删除文章
        </button>
      </div>
    </div>

    <div v-if="tags && tags.length > 0" class="article-tags">
      <span
        v-for="tag in tags"
        :key="tag"
        class="tag"
      >
        {{ tag }}
      </span>
    </div>
  </header>
</template>

<script>
export default {
  name: 'ArticleHeader',
  props: {
    author: {
      type: [Object, String],
      required: true
    },
    avatarUrl: {
      type: String,
      required: true
    },
    createdAt: {
      type: String,
      default: ''
    },
    views: {
      type: Number,
      default: 0
    },
    isAuthor: {
      type: Boolean,
      default: false
    },
    isFollowing: {
      type: Boolean,
      default: false
    },
    tags: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    authorName() {
      if (typeof this.author === 'string') return this.author;
      return this.author?.username || this.author?.name || '未知用户';
    },
    formattedDate() {
      if (!this.createdAt) return '';
      const date = new Date(this.createdAt);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.author-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.author-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
}

.follow-btn {
  padding: 6px 16px;
  border: 1px solid #0084ff;
  border-radius: 20px;
  background-color: #fff;
  color: #0084ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background-color: #e6f7ff;
}

.follow-btn.followed {
  background-color: #f0f0f0;
  border-color: #d9d9d9;
  color: #999;
}

.delete-btn {
  padding: 6px 16px;
  border: 1px solid #ff4d4f;
  border-radius: 20px;
  background-color: #fff;
  color: #ff4d4f;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background-color: #fff1f0;
  border-color: #ff7875;
  color: #ff7875;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag {
  padding: 4px 12px;
  background-color: #f0f7ff;
  color: #0084ff;
  font-size: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tag:hover {
  background-color: #d6ebff;
}
</style>
