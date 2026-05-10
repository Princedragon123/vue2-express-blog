<template>
  <div class="profile-card">
    <h3>安全设置</h3>
    <div class="security-settings">
      <div class="setting-item">
        <div class="setting-info">
          <h4>修改用户名</h4>
          <p>修改您的登录用户名</p>
        </div>
        <button class="btn btn-secondary" @click="$emit('change-username')">修改用户名</button>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>修改密码</h4>
          <p>定期修改密码可以提高账号安全性</p>
        </div>
        <button class="btn btn-secondary" @click="$emit('change-password')">修改密码</button>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>账号注销</h4>
          <p>永久删除您的账号和所有数据</p>
        </div>
        <button class="btn btn-danger">注销账号</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SecuritySettings'
};
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.setting-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
}
</style>
