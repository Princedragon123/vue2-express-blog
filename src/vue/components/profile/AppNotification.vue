<template>
  <transition name="notification-slide">
    <div
      v-if="show"
      class="notification"
      :class="['notification--' + type]"
      role="alert"
      aria-live="polite"
    >
      <i class="notification__icon fas" :class="iconClass" aria-hidden="true"></i>
      <span class="notification__message">{{ message }}</span>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'AppNotification',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success',
      validator: v => ['success', 'error', 'info'].includes(v)
    }
  },
  computed: {
    iconClass() {
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
      };
      return icons[this.type] || icons.info;
    }
  }
}
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
}

.notification--success {
  background: linear-gradient(135deg, #00b894, #00cec9);
  color: white;
}

.notification--error {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.notification--info {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: transform 0.3s ease;
}

.notification-slide-enter,
.notification-slide-leave-to {
  transform: translateX(-50%) translateY(-100%);
}
</style>
