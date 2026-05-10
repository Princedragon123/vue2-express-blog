<template>
  <div class="detail-header">
    <div class="category-badge">{{ category }}</div>
    <div v-if="topic" class="topic-badge" @click="$emit('go-to-topic', topicId)">
      {{ topicName }}
    </div>
    <h1 class="detail-title">{{ title }}</h1>

    <div class="author-section">
      <div class="author-info">
        <img :src="authorAvatar" alt="作者头像" class="author-avatar">
        <div class="author-details">
          <div class="author-name">{{ authorName }}</div>
          <div class="post-date">{{ postDate }}</div>
        </div>
      </div>
      <button class="follow-btn" @click="$emit('follow')">
        <i class="fas fa-user-plus"></i>
        关注
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailHeader',
  props: {
    category: {
      type: String,
      default: ''
    },
    topic: {
      type: Object,
      default: null
    },
    title: {
      type: String,
      default: ''
    },
    author: {
      type: [Object, String],
      default: ''
    },
    authorAvatar: {
      type: String,
      default: 'https://via.placeholder.com/40'
    },
    postDate: {
      type: String,
      default: ''
    }
  },
  computed: {
    topicName() {
      return this.topic ? this.topic.name : '';
    },
    topicId() {
      return this.topic ? this.topic._id : '';
    },
    authorName() {
      return typeof this.author === 'object' ? (this.author.username || '') : this.author;
    }
  }
}
</script>

<style scoped>
.detail-header {
  background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  border: 4px solid #fafafa;
}

.category-badge {
  display: inline-block;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff527d 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.topic-badge {
  display: inline-block;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
  margin-left: 8px;
  cursor: pointer;
}

.detail-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 10px 0 20px;
  line-height: 1.4;
}

.author-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fbcfe8;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.post-date {
  color: #999;
  font-size: 13px;
}

.follow-btn {
  padding: 8px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.follow-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

@media (max-width: 768px) {
  .detail-header {
    padding: 20px;
  }

  .detail-title {
    font-size: 1.5rem;
  }

  .author-section {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>
