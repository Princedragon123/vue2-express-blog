<template>
  <div class="user-item">
    <div class="user-info">
      <img v-lazy="avatarUrl" alt="用户头像" class="user-avatar">
      <div class="user-details">
        <div class="user-name">{{ user.username }}</div>
        <div class="user-email">{{ user.email }}</div>
        <div class="user-meta">
          <span class="user-role" :class="user.role">{{ getRoleName(user.role) }}</span>
          <span class="user-status" :class="user.status">{{ getStatusName(user.status) }}</span>
          <span class="user-joined">{{ formatDate(user.createdAt) }}</span>
        </div>
      </div>
    </div>
    
    <div class="user-actions">
      <button class="action-btn view-btn" @click="$emit('view', user)">
        <i class="fas fa-eye"></i> 查看
      </button>
      
      <button class="action-btn edit-btn" @click="$emit('edit', user)">
        <i class="fas fa-edit"></i> 编辑
      </button>
      
      <button 
        v-if="user.role !== 'admin'"
        class="action-btn" 
        :class="user.status === 'active' ? 'ban-btn' : 'unban-btn'"
        @click="$emit('toggle-status', user)"
      >
        <i :class="user.status === 'active' ? 'fas fa-ban' : 'fas fa-user-check'"></i>
        {{ user.status === 'active' ? '封禁' : '解封' }}
      </button>
      <button 
        v-else
        class="action-btn ban-btn" 
        disabled
      >
        <i class="fas fa-ban"></i> 封禁
      </button>
      
      <button 
        v-if="user.role !== 'admin'"
        class="action-btn delete-btn" 
        @click="$emit('delete', user)"
      >
        <i class="fas fa-trash"></i> 删除
      </button>
      <button 
        v-else
        class="action-btn delete-btn" 
        disabled
      >
        <i class="fas fa-trash"></i> 删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserItem',
  
  props: {
    user: {
      type: Object,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ''
    }
  },
  
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    
    getRoleName(role) {
      const roleMap = {
        'user': '普通用户',
        'admin': '管理员'
      };
      return roleMap[role] || role;
    },
    
    getStatusName(status) {
      const statusMap = {
        'active': '活跃',
        'banned': '封禁'
      };
      return statusMap[status] || status;
    }
  }
};
</script>

<style scoped>
.user-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--background-dark);
}

.user-item:last-child {
  border-bottom: none;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  border: 2px solid var(--primary-pink);
}

.user-avatar[src=""] {
  display: none;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.user-email {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.user-meta {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user-role, .user-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.user-role.user {
  background: linear-gradient(135deg, var(--background-light) 0%, #e3f2fd 100%);
  color: #1976d2;
}

.user-role.admin {
  background: linear-gradient(135deg, var(--background-dark) 0%, #ffebee 100%);
  color: #d32f2f;
}

.user-status.active {
  background: linear-gradient(135deg, var(--accent-green) 0%, #e8f5e9 100%);
  color: #388e3c;
}

.user-status.banned {
  background: linear-gradient(135deg, var(--accent-yellow) 0%, #fff8e1 100%);
  color: #f57c00;
}

.user-joined {
  font-size: 12px;
  color: #999;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.view-btn {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
}

.view-btn:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  color: var(--primary-pink);
}

.edit-btn {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: #fff;
}

.edit-btn:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, #be185d 100%);
}

.ban-btn {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: #fff;
}

.ban-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #f57c00 0%, #e65100 100%);
}

.unban-btn {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  color: #fff;
}

.unban-btn:hover {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
}

.delete-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
}

.delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
