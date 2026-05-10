<template>
  <div class="zhihu-sidebar">
    <div class="sidebar-section">
      <h3>推荐阅读</h3>
      <div class="recommended-item" v-for="item in recommended" :key="item.id">
        <div class="recommended-title">{{ item.title }}</div>
        <div class="recommended-meta">{{ item.views }} 阅读 · {{ item.answers }} 回答</div>
      </div>
    </div>
    <div class="sidebar-section">
      <h3>相关话题</h3>
      <div class="topic-item" v-for="topic in relatedTopics" :key="topic.id">
        <div class="topic-name">{{ topic.name }}</div>
        <div class="topic-meta">{{ topic.followers }} 关注 · {{ topic.articles }} 文章</div>
      </div>
    </div>
    <div class="sidebar-section">
      <h3>作者其他文章</h3>
      <div class="author-other-article" v-for="article in authorArticles" :key="article.id">
        <div class="article-title">{{ article.title }}</div>
        <div class="article-meta">{{ article.likes }} 赞 · {{ article.views }} 阅读</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ZhihuSidebar',
  props: {
    recommended: {
      type: Array,
      default: () => []
    },
    relatedTopics: {
      type: Array,
      default: () => []
    },
    authorArticles: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.zhihu-sidebar {
  width: 300px;
  flex-shrink: 0;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.sidebar-section h3 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.recommended-item {
  padding: 10px 0;
  border-bottom: 1px solid #f6f6f6;
  cursor: pointer;
}

.recommended-item:last-child {
  border-bottom: none;
}

.recommended-title {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 4px;
}

.recommended-title:hover {
  color: #175199;
}

.recommended-meta {
  font-size: 12px;
  color: #999;
}

.topic-item {
  padding: 10px 0;
  border-bottom: 1px solid #f6f6f6;
  cursor: pointer;
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-name {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 4px;
}

.topic-name:hover {
  color: #175199;
}

.topic-meta {
  font-size: 12px;
  color: #999;
}

.author-other-article {
  padding: 10px 0;
  border-bottom: 1px solid #f6f6f6;
  cursor: pointer;
}

.author-other-article:last-child {
  border-bottom: none;
}

.author-other-article .article-title {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 4px;
}

.author-other-article .article-title:hover {
  color: #175199;
}

.author-other-article .article-meta {
  font-size: 12px;
  color: #999;
}

@media (max-width: 1024px) {
  .zhihu-sidebar {
    display: none;
  }
}
</style>
