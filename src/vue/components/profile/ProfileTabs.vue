<template>
  <nav class="profile-tabs" role="tablist" aria-label="个人资料标签页">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      class="profile-tabs__tab tab-item"
      :class="{ 'tab-item--active': modelValue === tab.name }"
      @click="$emit('update:modelValue', tab.name)"
      role="tab"
      :aria-selected="modelValue === tab.name"
    >
      <span class="profile-tabs__icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="profile-tabs__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script>
export default {
  name: 'ProfileTabs',
  props: {
    modelValue: {
      type: String,
      default: 'posts'
    },
    isCurrentUser: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    tabs() {
      const baseTabs = [
        { name: 'posts', icon: '📝', label: this.isCurrentUser ? '我的发布' : '发布的攻略' },
        { name: 'likes', icon: '❤️', label: this.isCurrentUser ? '我的点赞' : '他的点赞' },
        { name: 'bookmarks', icon: '📌', label: this.isCurrentUser ? '我的收藏' : '他的收藏' }
      ];

      if (this.isCurrentUser) {
        baseTabs.push({ name: 'settings', icon: '⚙️', label: '设置' });
      }

      return baseTabs;
    }
  }
}
</script>

<style scoped>
.profile-tabs {
  display: flex;
  background: white;
  border-radius: 15px;
  padding: 10px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.profile-tabs__tab {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.profile-tabs__tab:hover:not(.tab-item--active) {
  background: #f5f5f5;
}

.tab-item--active {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

@media (max-width: 768px) {
  .profile-tabs {
    flex-wrap: wrap;
  }

  .profile-tabs__tab {
    flex: 1 1 45%;
    font-size: 12px;
  }
}
</style>
