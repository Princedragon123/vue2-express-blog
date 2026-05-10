<template>
  <div class="profile-sidebar">
    <ul class="profile-menu">
      <li class="menu-item" @click="$emit('navigate', '/edit-profile')">
        <span>编辑资料</span>
      </li>
      <li class="menu-item" @click="$emit('navigate', '/my-creation')">
        <span>我的创作</span>
      </li>
      <li class="menu-item" :class="{ active: activeTab === 'notifications' }" @click="$emit('switch-tab', 'notifications')">
        <span>通知设置</span>
      </li>
      <li class="menu-item" :class="{ active: activeTab === 'privacy' }" @click="$emit('switch-tab', 'privacy')">
        <span>隐私设置</span>
      </li>
      <li class="menu-item" :class="{ active: activeTab === 'security' }" @click="$emit('switch-tab', 'security')">
        <span>安全设置</span>
      </li>
      <li class="menu-item" :class="{ active: activeTab === 'history' }" @click="$emit('switch-tab', 'history')">
        <span>历史记录</span>
      </li>
      <li class="menu-item" :class="{ active: activeTab === 'other' }" @click="$emit('switch-tab', 'other')">
        <span>其他设置</span>
      </li>
      <li class="menu-item logout-item" @click="$emit('logout')">
        <span>退出登录</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SettingsSidebar',
  props: {
    activeTab: {
      type: String,
      default: 'notifications'
    }
  }
};
</script>

<style scoped>
.profile-sidebar {
  width: 220px;
  flex-shrink: 0;
}

.profile-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.menu-item {
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #333;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: #f5f5f5;
  border-left-color: var(--primary-color, #667eea);
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-left-color: var(--primary-color, #667eea);
  font-weight: 600;
  color: var(--primary-color, #667eea);
}

.logout-item {
  color: #e74c3c;
  border-top: 1px solid #eee;
  margin-top: 10px;
}

.logout-item:hover {
  background: #fff5f5;
  border-left-color: #e74c3c;
}

@media (max-width: 768px) {
  .profile-sidebar {
    width: 100%;
  }

  .profile-menu {
    display: flex;
    flex-wrap: wrap;
    border-radius: 10px;
  }

  .menu-item {
    flex: 1 1 auto;
    padding: 10px 15px;
    text-align: center;
    border-left: none;
    border-bottom: 3px solid transparent;
    font-size: 12px;
  }

  .menu-item.active {
    border-bottom-color: var(--primary-color, #667eea);
    border-left: none;
  }

  .logout-item {
    margin-top: 0;
    border-top: none;
    border-left: none;
  }
}
</style>
