<!-- AdminUsers.vue - 管理员用户管理组件 -->
<template>
  <div class="admin-users">
    <main class="admin-content">
      <div class="admin-header">
        <div class="container">
          <h1 class="admin-title">用户管理</h1>
          <p class="admin-subtitle">管理所有注册用户</p>
        </div>
      </div>
      
      <div class="container">
        <UserSearch
          :query="searchQuery"
          :status-filter="statusFilter"
          :role-filter="roleFilter"
          @update:query="searchQuery = $event"
          @update:statusFilter="statusFilter = $event"
          @update:roleFilter="roleFilter = $event"
        />
        
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
              <UserItem
                v-for="user in filteredUsers"
                :key="user._id"
                :user="user"
                :avatar-url="getAuthorAvatar(user, 40)"
                @view="viewUserProfile"
                @edit="editUser"
                @toggle-status="toggleUserStatus"
                @delete="deleteUser"
              />
            </div>
            
            <UserPagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @prev="changePage(currentPage - 1)"
              @next="changePage(currentPage + 1)"
            />
          </div>
        </div>
      </div>
    </main>
    
    <EditUserModal
      :visible="showEditModal"
      :user="editingUser"
      @close="closeEditModal"
      @save="saveUserChanges"
      @update:username="editingUser.username = $event"
      @update:password="editingUser.password = $event"
      @update:role="editingUser.role = $event"
      @update:banReason="editingUser.banReason = $event"
    />
  </div>
</template>

<script>
import UserSearch from './admin-users/UserSearch.vue';
import UserItem from './admin-users/UserItem.vue';
import UserPagination from './admin-users/UserPagination.vue';
import EditUserModal from './admin-users/EditUserModal.vue';
import { showNotification } from '../utils/notification';
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'AdminUsers',
  
  components: {
    UserSearch,
    UserItem,
    UserPagination,
    EditUserModal
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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
      } catch (error) {
        console.error('解析token失败:', error);
      }
    }
    
    this.fetchUsers();
  },
  
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.fetchUsers();
    },
    statusFilter() {
      this.currentPage = 1;
      this.fetchUsers();
    },
    roleFilter() {
      this.currentPage = 1;
      this.fetchUsers();
    }
  },
  
  computed: {
    filteredUsers() {
      let result = [...this.users];
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      if (this.statusFilter !== 'all') {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      if (this.roleFilter !== 'all') {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      const startIndex = (this.currentPage - 1) * this.pageSize;
      return result.slice(startIndex, startIndex + this.pageSize);
    },
    
    totalPages() {
      let result = [...this.users];
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      
      if (this.statusFilter !== 'all') {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      if (this.roleFilter !== 'all') {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      return Math.ceil(result.length / this.pageSize);
    }
  },
  
  methods: {
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    async fetchUsers() {
      try {
        this.isLoading = true;
        
        const response = await this.$http.admin.getAllUsers({
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          search: this.searchQuery,
          status: this.statusFilter === 'all' ? undefined : this.statusFilter,
          role: this.roleFilter === 'all' ? undefined : this.roleFilter
        });
        
        if (response && response.success) {
          this.users = Array.isArray(response.data) ? response.data : [];
        } else {
          throw new Error('获取用户列表失败');
        }
      } catch (error) {
        console.error('获取用户列表失败:', error);
        this.users = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    viewUserProfile(user) {
      this.$router.push(`/profile/${user._id}`);
    },
    
    editUser(user) {
      this.editingUser = { ...user, password: '' };
      this.showEditModal = true;
    },
    
    async saveUserChanges() {
      try {
        const response = await this.$http.admin.updateUser(this.editingUser._id, {
          role: this.editingUser.role,
          status: this.editingUser.status,
          banReason: this.editingUser.status === 'banned' ? this.editingUser.banReason : null,
          username: this.editingUser.username,
          password: this.editingUser.password
        });
        
        if (response && response.success) {
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
    
    async toggleUserStatus(user) {
      try {
        const newStatus = user.status === 'active' ? 'banned' : 'active';
        let banReason = null;
        
        if (newStatus === 'banned') {
          banReason = prompt('请输入封禁原因:');
          if (!banReason) return;
        }
        
        const response = await this.$http.admin[newStatus === 'banned' ? 'banUser' : 'unbanUser'](user._id, {
          reason: banReason
        });
        
        if (response && response.success) {
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
    
    async deleteUser(user) {
      if (!confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复。`)) {
        return;
      }
      
      const confirmUserId = prompt(`请输入用户 ID ${user._id} 进行确认:`);
      if (!confirmUserId || confirmUserId !== user._id) {
        showNotification('用户 ID 输入错误，删除操作已取消', 'warning');
        return;
      }
      
      try {
        const response = await this.$http.admin.deleteUser(user._id, {
          confirmUserId: confirmUserId
        });
        
        if (response && response.success) {
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
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    
    closeEditModal() {
      this.showEditModal = false;
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

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.loading i {
  font-size: 48px;
  color: var(--primary-pink);
  margin-bottom: 16px;
}

.loading p {
  font-size: 16px;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state i {
  font-size: 64px;
  color: var(--primary-pink);
  margin-bottom: 16px;
}

.empty-state h4 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>
