<template>
  <div class="filter-tabs">
    <button 
      v-for="tab in tabs" 
      :key="tab.value"
      :class="['filter-tab', { active: activeTab === tab.value }]"
      @click="$emit('change', tab.value)"
    >
      <svg-icon :name="tab.iconName" :size="16"></svg-icon>
      {{ tab.label }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'DynamicFilterTabs',
  props: {
    activeTab: {
      type: String,
      default: 'all'
    },
    tabs: {
      type: Array,
      default: () => [
        { value: 'all', label: '全部', iconName: 'list' },
        { value: 'publish', label: '发布', iconName: 'pen' },
        { value: 'like', label: '点赞', iconName: 'heart' },
        { value: 'comment', label: '评论', iconName: 'comment' },
        { value: 'follow', label: '关注', iconName: 'userPlus' }
      ]
    }
  }
}
</script>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background-color: white;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-tab:hover {
  border-color: #ff6b9d;
  color: #ff6b9d;
  transform: translateY(-2px);
}

.filter-tab.active {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff527d 100%);
  border-color: #ff6b9d;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.filter-tab i {
  font-size: 14px;
}
</style>
