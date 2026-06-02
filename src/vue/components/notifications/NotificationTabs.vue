<template>
  <div class="notification-tabs">
    <button 
      class="tab-btn" 
      :class="{ active: activeTab === 'all' }"
      @click="$emit('switch-tab', 'all')"
    >
      全部
      <span v-if="totalCount > 0" class="tab-badge">{{ totalCount }}</span>
    </button>
    <button 
      class="tab-btn" 
      :class="{ active: activeTab === 'unread' }"
      @click="$emit('switch-tab', 'unread')"
    >
      未读
      <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'NotificationTabs',
  props: {
    activeTab: {
      type: String,
      default: 'all'
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.notification-tabs {
  display: flex;
  background-color: white;
  max-width: 1200px;
  margin: 0 auto;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background-color: #f5f5f5;
}

.tab-btn.active {
  color: #4caf50;
  background-color: #f0f9f0;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #4caf50;
}

.tab-badge {
  background-color: #f44336;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}
</style>
