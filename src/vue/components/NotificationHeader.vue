<template>
  <header class="notifications-header">
    <div class="header-container">
      <button class="back-btn" @click="$emit('back')">
        <span class="nav-icon">←</span>
      </button>
      <h1 class="page-title">通知</h1>
      <div class="header-actions">
        <button class="action-btn" v-if="unreadCount > 0" @click="$emit('mark-all-read')">
          <span class="nav-icon">✓✓</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'NotificationHeader',
  props: {
    unreadCount: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.notifications-header {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #f0f0f0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-family);
}

.action-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f0f0f0;
}
</style>
