<!-- AdminUsers.vue - 管理员用户管理组件 -->
<template>
  <div class="admin-users">
    <!-- 主内容区 -->
    <main class="admin-content">
      <!-- 页面标题 -->
      <div class="admin-header">
        <div class="container">
          <h1 class="admin-title">用户管理</h1>
          <p class="admin-subtitle">管理所有注册用户</p>
        </div>
      </div>
      
      <!-- 用户管理内容 -->
      <div class="container">
        <!-- 搜索和筛选 -->
        <div class="users-filters">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              placeholder="搜索用户名或邮箱..."
              v-model="searchQuery"
            >
            <i class="fas fa-search search-icon"></i>
          </div>
          <div class="filter-container">
            <select v-model="statusFilter" class="filter-select">
              <option value="all">所有状态</option>
              <option value="active">活跃用户</option>
              <option value="banned">封禁用户</option>
            </select>
            <select v-model="roleFilter" class="filter-select">
              <option value="all">所有角色</option>
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        
        <!-- 用户列表 -->
        <div class="users-list-container">
          <div v-if="isLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载用户列表中...</p>
          </div>
          
          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <i class="fas fa-users"></i>
            <h4>暂无用户</h4>
            <p>没有符合条件的用户</p>
          </div>
          
          <div v-else>
            <div class="users-list">
              <div class="user-item" v-for="user in filteredUsers" :key="user._id">
                <div class="user-info">
                  <img v-lazy="getAuthorAvatar(user, 40)" alt="用户头像" class="user-avatar">
                  <div class="user-details">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                    <div class="user-meta">
                      <span class="user-role" :class="user.role">{{ user.role }}</span>
                      <span class="user-status" :class="user.status">{{ user.status }}</span>
                      <span class="user-joined">{{ formatDate(user.createdAt) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="user-actions">
                <button class="action-btn view-btn" @click="viewUserProfile(user)">
                  <i class="fas fa-eye"></i> 查看
                </button>
                
                <button class="action-btn edit-btn" @click="editUser(user)">
                  <i class="fas fa-edit"></i> 编辑
                </button>
                
                <button 
                  v-if="user.role !== 'admin'"
                  class="action-btn" 
                  :class="user.status === 'active' ? 'ban-btn' : 'unban-btn'"
                  @click="toggleUserStatus(user)"
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
                  @click="deleteUser(user)"
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
            </div>
            
            <!-- 分页 -->
            <div class="pagination">
              <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                <i class="fas fa-chevron-left"></i> 上一页
              </button>
              <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
              <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
                下一页 <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 编辑用户模态框 -->
    <div class="modal-overlay" v-if="showEditModal" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button class="modal-close" @click="closeEditModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="editingUser.username"
              placeholder="输入新用户名"
            >
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input 
              type="email" 
              class="form-input" 
              v-model="editingUser.email" 
              readonly
            >
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input 
              type="password" 
              class="form-input" 
              v-model="editingUser.password"
              placeholder="输入新密码（留空不修改）"
            >
          </div>
          <div class="form-group">
            <label class="form-label">角色</label>
            <select v-model="editingUser.role" class="form-select">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group" v-if="editingUser.status === 'banned'">
            <label class="form-label">封禁原因</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="editingUser.banReason" 
              placeholder="请输入封禁原因"
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditModal">取消</button>
          <button class="btn btn-primary" @click="saveUserChanges">保存更改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'AdminUsers',
  components: {
  },
  data() {
    return {
      users: [],
      isLoading: false,
      searchQuery: '',
      statusFilter: 'all',
      roleFilter: 'all',
      currentPage: 1,
      pageSize: 10,
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      // 编辑模态框
      showEditModal: false,
      editingUser: {
        _id: '',
        username: '',
        email: '',
        password: '',
        role: '',
        status: '',
        banReason: ''
      }
    };
  },
  created() {
    // 检查登录状态
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 解析token获取用户信息
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error('解析token失败:', error);
      }
    }
    
    // 加载用户列表
    this.fetchUsers();
  },
  watch: {
    // 监听搜索查询变化
    searchQuery() {
      this.currentPage = 1; // 重置页码
      this.fetchUsers();
    },
    // 监听状态筛选变化
    statusFilter() {
      this.currentPage = 1; // 重置页码
      this.fetchUsers();
    },
    // 监听角色筛选变化
    roleFilter() {
      this.currentPage = 1; // 重置页码
      this.fetchUsers();
    }
  },
  computed: {
    // 过滤用户
    filteredUsers() {
      let result = [...this.users];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      // 状态过滤
      if (this.statusFilter !== 'all') {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      // 角色过滤
      if (this.roleFilter !== 'all') {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      // 分页
      const startIndex = (this.currentPage - 1) * this.pageSize;
      return result.slice(startIndex, startIndex + this.pageSize);
    },
    // 计算总页数
    totalPages() {
      let result = [...this.users];
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      // 状态过滤
      if (this.statusFilter !== 'all') {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      // 角色过滤
      if (this.roleFilter !== 'all') {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      return Math.ceil(result.length / this.pageSize);
    }
  },
  methods: {
    // 获取作者头像（使用工具函数）
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    
    // 获取用户列表
    async fetchUsers() {
      try {
        this.isLoading = true;
        
        // 构建查询参数
        const params = {
          search: this.searchQuery,
          status: this.statusFilter === 'all' ? undefined : this.statusFilter,
          role: this.roleFilter === 'all' ? undefined : this.roleFilter
        };
        
        // 使用封装好的 API 方法
        const response = await this.$http.admin.getAllUsers({
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          search: this.searchQuery,
          status: this.statusFilter === 'all' ? undefined : this.statusFilter,
          role: this.roleFilter === 'all' ? undefined : this.roleFilter
        });
        
        if (response && response.success) {
          // 确保 users 是数组
          this.users = Array.isArray(response.data) ? response.data : [];
        } else {
          throw new Error('获取用户列表失败');
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        // 重置用户列表为空数组
        this.users = [];
      } finally {
        this.isLoading = false;
      }
    },
    // 查看用户资料
    viewUserProfile(user) {
      this.$router.push(`/profile/${user._id}`);
    },
    // 编辑用户
    editUser(user) {
      this.editingUser = { ...user, password: '' };
      this.showEditModal = true;
    },
    // 保存用户更改
    async saveUserChanges() {
      try {
        // 使用封装好的 API 方法
        const response = await this.$http.admin.updateUser(this.editingUser._id, {
          role: this.editingUser.role,
          status: this.editingUser.status,
          banReason: this.editingUser.status === 'banned' ? this.editingUser.banReason : null,
          username: this.editingUser.username,
          password: this.editingUser.password
        });
        
        if (response && response.success) {
          // 更新本地用户列表
          const userIndex = this.users.findIndex(u => u._id === this.editingUser._id);
          if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...this.editingUser };
          }
          
          this.closeEditModal();
          showNotification('用户信息更新成功', 'success');
        } else {
          throw new Error('更新用户信息失败');
        }
      } catch (error) {
        console.error('更新用户信息失败:', error);
        showNotification('更新用户信息失败，请稍后重试', 'error');
      }
    },
    // 切换用户状态（封禁/解封）
    async toggleUserStatus(user) {
      try {
        const newStatus = user.status === 'active' ? 'banned' : 'active';
        let banReason = null;
        
        if (newStatus === 'banned') {
          banReason = prompt('请输入封禁原因:');
          if (!banReason) return;
        }
        
        // 使用封装好的 API 方法
        const response = await this.$http.admin[newStatus === 'banned' ? 'banUser' : 'unbanUser'](user._id, {
          reason: banReason
        });
        
        if (response && response.success) {
          // 更新本地用户列表
          const userIndex = this.users.findIndex(u => u._id === user._id);
          if (userIndex !== -1) {
            this.users[userIndex].status = newStatus;
            this.users[userIndex].banReason = banReason;
          }
          
          showNotification(`用户已${newStatus === 'banned' ? '封禁' : '解封'}`, 'success');
        } else {
          throw new Error('更新用户状态失败');
        }
      } catch (error) {
        console.error('更新用户状态失败:', error);
        showNotification('操作失败，请稍后重试', 'error');
      }
    },
    // 删除用户
    async deleteUser(user) {
      if (!confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复。`)) {
        return;
      }
      
      // 严格的二级审核：要求输入用户 ID
      const confirmUserId = prompt(`请输入用户 ID ${user._id} 进行确认:`);
      if (!confirmUserId || confirmUserId !== user._id) {
        showNotification('用户 ID 输入错误，删除操作已取消', 'warning');
        return;
      }
      
      try {
        // 使用封装好的 API 方法，传递 confirmUserId 作为请求体
        const response = await this.$http.admin.deleteUser(user._id, {
          confirmUserId: confirmUserId
        });
        
        if (response && response.success) {
          // 从本地用户列表中删除
          this.users = this.users.filter(u => u._id !== user._id);
          showNotification('用户删除成功', 'success');
        } else {
          throw new Error('删除用户失败');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        showNotification('删除用户失败，请稍后重试', 'error');
      }
    },
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    // 关闭编辑模态框
    closeEditModal() {
      this.showEditModal = false;
      // 重置编辑表单
      this.editingUser = {
        _id: '',
        username: '',
        email: '',
        role: '',
        status: '',
        banReason: ''
      };
    }
  }
};
</script>

<style scoped>
.admin-users {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  font-family: var(--font-family);
}

.admin-content {
  padding-top: 20px;
  padding-bottom: 20px;
}

.admin-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--background-dark);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
}

.admin-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 5px 0;
}

.admin-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.users-filters {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: var(--background-light);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-pink);
}

.filter-container {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
}

.users-list-container {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.users-list {
  margin-bottom: 20px;
}

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
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.4);
}

.ban-btn {
  background: linear-gradient(135deg, var(--accent-yellow) 0%, #ff9800 100%);
  color: #fff;
}

.ban-btn:hover {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.unban-btn {
  background: linear-gradient(135deg, var(--accent-green) 0%, #4caf50 100%);
  color: #fff;
}

.unban-btn:hover {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.delete-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
}

.delete-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--primary-pink);
  border-radius: 4px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  color: var(--primary-pink);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.loading {
  text-align: center;
  padding: 40px;
}

.loading i {
  font-size: 24px;
  color: var(--primary-pink);
  margin-bottom: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.empty-state i {
  font-size: 48px;
  color: var(--primary-pink);
  opacity: 0.6;
  margin-bottom: 10px;
}

.empty-state h4 {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.empty-state p {
  font-size: 14px;
  color: #999;
}

/* 模态框样式 */
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
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
}

/* 隐藏模态框内容的WebKit滚动条 */
.modal-content::-webkit-scrollbar {
  display: none;
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
  font-size: 20px;
  cursor: pointer;
  color: var(--primary-pink);
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: var(--secondary-pink);
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
  font-weight: bold;
  color: var(--text-primary);
}

.form-input, .form-select {
  width: 100%;
  padding: 10px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: var(--background-light);
  transition: all 0.3s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
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
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: #fff;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, #be185d 100%);
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  color: var(--primary-pink);
}

@media (max-width: 768px) {
  .users-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    min-width: auto;
  }
  
  .filter-container {
    flex-direction: column;
  }
  
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .user-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
