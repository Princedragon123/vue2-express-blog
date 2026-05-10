<template>
  <div class="article-grid-section">
    <div v-if="privacyDenied" class="empty-state">
      <span class="nav-icon">🔒</span>
      <h3>无法查看</h3>
      <p>由于对方隐私设置，你没有权限查看该内容</p>
    </div>

    <div v-else-if="articles.length > 0" class="blog-cards-grid">
      <div class="blog-card" v-for="blog in articles" :key="blog._id || blog.id" @click="$emit('click-article', blog._id || blog.id)">
        <div class="card-image">
          <img v-lazy="blog.image" :alt="blog.title" class="card-img">
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ blog.title }}</h3>
          <div class="card-meta" v-if="showAuthor">
            <span class="author-name">{{ blog.author }}</span>
            <span class="post-date">{{ formatDate(blog.date) }}</span>
          </div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="nav-icon">❤️</span>
              <span>{{ blog.likes }}</span>
            </div>
            <div class="stat-item">
              <span class="nav-icon">💬</span>
              <span>{{ blog.comments }}</span>
            </div>
            <div class="stat-item" v-if="blog.bookmarks !== undefined">
              <span class="nav-icon">📌</span>
              <span>{{ blog.bookmarks }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="nav-icon">{{ emptyIcon }}</span>
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyDescription }}</p>
      <button v-if="showAction" class="btn-primary" @click="$emit('action')">
        {{ actionText }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArticleGrid',
  props: {
    articles: {
      type: Array,
      default: () => []
    },
    privacyDenied: {
      type: Boolean,
      default: false
    },
    showAuthor: {
      type: Boolean,
      default: false
    },
    emptyIcon: {
      type: String,
      default: '📄'
    },
    emptyTitle: {
      type: String,
      default: '暂无内容'
    },
    emptyDescription: {
      type: String,
      default: ''
    },
    showAction: {
      type: Boolean,
      default: false
    },
    actionText: {
      type: String,
      default: ''
    }
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }
  }
};
</script>

<style scoped>
.blog-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.blog-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid var(--background-dark);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.2);
  border-color: var(--primary-pink);
}

.card-image {
  height: 180px;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.blog-card:hover .card-img {
  transform: scale(1.05);
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  color: #6b7280;
}

.card-stats {
  display: flex;
  gap: 16px;
}

.card-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state .nav-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}

.btn-primary {
  padding: 10px 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
}

@media (max-width: 768px) {
  .blog-cards-grid {
    grid-template-columns: 1fr;
  }

  .card-image {
    height: 150px;
  }
}
</style>
