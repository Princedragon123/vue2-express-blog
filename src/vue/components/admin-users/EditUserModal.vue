<template>
  <div class="modal-overlay" v-if="visible" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑用户</h3>
        <button class="modal-close" @click="$emit('close')">
          <svg-icon name="close" :size="20"></svg-icon>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input 
            type="text" 
            class="form-input" 
            :value="user.username"
            @input="$emit('update:username', $event.target.value)"
            placeholder="输入新用户名"
          >
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input 
            type="email" 
            class="form-input" 
            :value="user.email" 
            readonly
          >
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input 
            type="password" 
            class="form-input" 
            :value="user.password"
            @input="$emit('update:password', $event.target.value)"
            placeholder="输入新密码（留空不修改）"
          >
        </div>
        <div class="form-group">
          <label class="form-label">角色</label>
          <select :value="user.role" @change="$emit('update:role', $event.target.value)" class="form-select">
            <option value="user">普通用户</option>
              <option value="svip">svip用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <div class="form-group" v-if="user.status === 'banned'">
          <label class="form-label">封禁原因</label>
          <input 
            type="text" 
            class="form-input" 
            :value="user.banReason"
            @input="$emit('update:banReason', $event.target.value)"
            placeholder="请输入封禁原因"
          >
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="$emit('save')">保存更改</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditUserModal',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    user: {
      type: Object,
      default: () => ({})
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--background-dark);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.form-select {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--background-dark);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, #be185d 100%);
}
</style>
