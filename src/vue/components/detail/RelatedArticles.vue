<template>
  <div class="related-section">
    <h3 class="related-title">相关推荐</h3>
    <div class="related-grid">
      <div class="related-card" v-for="related in articles" :key="related._id || related.id" @click="$emit('click', related._id || related.id)">
        <div class="related-image">
          <img v-lazy="related.image" :alt="related.title" class="related-img">
        </div>
        <div class="related-content">
          <h4 class="related-title-small">{{ related.title }}</h4>
          <div class="related-meta">
            <span class="related-author">{{ related.author }}</span>
            <span class="related-likes">{{ related.likes }} 赞</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RelatedArticles',
  props: {
    articles: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.related-section {
  margin-top: 40px;
}

.related-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
}

.related-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.related-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.related-image {
  height: 120px;
  overflow: hidden;
}

.related-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.related-card:hover .related-img {
  transform: scale(1.05);
}

.related-content {
  padding: 12px;
}

.related-title-small {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

@media (max-width: 768px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
