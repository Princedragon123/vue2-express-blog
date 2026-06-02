<template>
  <div class="messages-tabs" role="tablist" aria-label="消息与通知切换">
    <button
      class="messages-tabs__tab tab-btn"
      :class="{ 'tab-btn--active': value === 'notifications' }"
      @click="handleTabClick('notifications')"
      role="tab"
      :aria-selected="value === 'notifications'"
    >
      通知
      <span
        v-if="notificationCount > 0"
        class="messages-tabs__badge tab-badge"
        aria-label="未读通知数量"
      >
        {{ notificationCount }}
      </span>
    </button>
    <button
      class="messages-tabs__tab tab-btn"
      :class="{ 'tab-btn--active': value === 'messages' }"
      @click="handleTabClick('messages')"
      role="tab"
      :aria-selected="value === 'messages'"
    >
      私信
      <span
        v-if="messageCount > 0"
        class="messages-tabs__badge tab-badge"
        aria-label="未读私信数量"
      >
        {{ messageCount }}
      </span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'MessagesTabs',
  props: {
    value: {
      type: String,
      default: 'notifications',
      validator: v => ['notifications', 'messages'].includes(v)
    },
    notificationCount: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  methods: {
    handleTabClick(tab) {
      this.$emit('input', tab);
    }
  }
}
</script>

<style scoped>
.messages-tabs {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  overflow: hidden;
}

.messages-tabs__tab {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.messages-tabs__tab:hover {
  background-color: var(--background-light);
}

.tab-btn--active {
  color: white;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
}

.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--secondary-pink);
}

.messages-tabs__badge {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
}
</style>
