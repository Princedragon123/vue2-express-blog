<template>
  <div class="profile-card">
    <div class="card-header">
      <h3>浏览历史</h3>
      <button class="clear-history-btn" @click="$emit('clear')">
        <svg-icon name="trash" :size="16"></svg-icon> 清空历史
      </button>
    </div>
    <div class="history-content">
      <div v-if="history.length === 0" class="empty-history">
        <svg-icon name="clock" :size="32"></svg-icon>
        <p>暂无浏览历史</p>
        <p class="empty-history-tip">浏览文章后，这里会显示您的历史记录</p>
      </div>
      <div v-else class="history-container">
        <div class="history-list">
          <div v-for="(item, index) in history" :key="index" class="history-item">
            <div class="history-item-content">
              <h4 class="history-item-title">{{ item.title }}</h4>
              <p class="history-item-date">{{ formatDate(item.timestamp) }}</p>
            </div>
            <button class="history-item-button" @click="$emit('view', item)">
              <svg-icon name="eye" :size="16"></svg-icon> 查看
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistorySection',
  props: {
    history: {
      type: Array,
      default: () => []
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
.profile-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 13px;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.2s ease;
}

.clear-history-btn:hover {
  background: #fff5f5;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-history i {
  font-size: 2rem;
  margin-bottom: 10px;
}

.empty-history p {
  margin: 5px 0;
}

.empty-history-tip {
  font-size: 12px;
  color: #ccc;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.history-item:hover {
  background: #f0f0f0;
}

.history-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.history-item-date {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.history-item-button {
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.history-item-button:hover {
  background: var(--primary-color, #667eea);
  color: white;
  border-color: var(--primary-color, #667eea);
}
</style>
