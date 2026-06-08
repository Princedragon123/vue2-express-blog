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
            <svg-icon name="spinner" :size="24" class-name="fa-spin"></svg-icon>
            <p>加载用户列表中...</p>
          </div>
          
          <div v-else-if="filteredUsers.length === 0" class="empty-state">
            <svg-icon name="users" :size="48"></svg-icon>
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
    this.fetchUsers();
  },
  
  watch: {
    searchQuery: 'resetAndFetch',
    statusFilter: 'resetAndFetch',
    roleFilter: 'resetAndFetch'
  },
  
  computed: {
    // 抽离公共筛选逻辑，只写一次
    getFilteredUsers() {
      let result = [...this.users];
      const query = this.searchQuery.toLowerCase();

      if (this.searchQuery) {
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
      return result;
    },
    
    filteredUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.getFilteredUsers.slice(start, start + this.pageSize);
    },
    
    totalPages() {
      return Math.ceil(this.getFilteredUsers.length / this.pageSize);
    }
  },
  
  methods: {
    getAuthorAvatar,
    
    resetAndFetch() {
      this.currentPage = 1;
      this.fetchUsers();
    },
    
    async fetchUsers() {
      try {
        this.isLoading = true;
        const res = await this.$http.admin.getAllUsers({
          page: this.currentPage,
          limit: this.pageSize,
          search: this.searchQuery || undefined,
          status: this.statusFilter === 'all' ? undefined : this.statusFilter,
          role: this.roleFilter === 'all' ? undefined : this.roleFilter
        });

        this.users = res?.success ? Array.isArray(res.data) ? res.data : [] : [];
      } catch (error) {
        console.error('获取用户列表失败:', error);
        this.users = [];
        showNotification('获取用户列表失败，请稍后重试', 'error');
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
        const res = await this.$http.admin.updateUser(this.editingUser._id, {
          role: this.editingUser.role,
          status: this.editingUser.status,
          banReason: this.editingUser.banReason || null,
          username: this.editingUser.username,
          password: this.editingUser.password || undefined
        });

        if (res?.success) {
          const idx = this.users.findIndex(u => u._id === this.editingUser._id);
          if (idx !== -1) this.users[idx] = { ...this.users[idx], ...this.editingUser };
          
          this.closeEditModal();
          showNotification('用户信息更新成功', 'success');
        }
      } catch (error) {
        console.error('更新用户失败:', error);
        showNotification('更新失败，请重试', 'error');
      }
    },
    
    async toggleUserStatus(user) {
      try {
        const isBan = user.status === 'active';
        let banReason = null;

        if (isBan) {
          banReason = prompt('请输入封禁原因：');
          if (!banReason) return;
        }

        const api = isBan ? 'banUser' : 'unbanUser';
        const res = await this.$http.admin[api](user._id, { reason: banReason });

        if (res?.success) {
          user.status = isBan ? 'banned' : 'active';
          user.banReason = banReason;
          showNotification(`用户已${isBan ? '封禁' : '解封'}`, 'success');
        }
      } catch (error) {
        console.error('状态切换失败:', error);
        showNotification('操作失败', 'error');
      }
    },
    
    async deleteUser(user) {
      
      const confirmId = prompt(`请输入用户ID：${user._id} 确认删除`);
      if (confirmId !== user._id) {
        showNotification('ID输入错误，删除已取消', 'warning');
        return;
      }

      try {
        const res = await this.$http.admin.deleteUser(user._id, { confirmUserId: user._id });
        if (res?.success) {
          this.users = this.users.filter(u => u._id !== user._id);
          showNotification('用户删除成功', 'success');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        showNotification('删除失败', 'error');
      }
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    },
    
    closeEditModal() {
      this.showEditModal = false;
      this.editingUser = { _id: '', username: '', email: '', password: '', role: '', status: '', banReason: '' };
    }
  }
};
</script>

<style scoped>
/* 补充所有缺失的CSS变量 */
:root {
  --primary-pink: #ec4899;
  --secondary-pink: #db2777;
  --text-primary: #1f2937;
  --background-light: #fdf2f8;
  --background-dark: #fbc7e0;
  --accent-green: #4ade80;
  --accent-yellow: #fbbf24;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-users {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  font-family: var(--font-family);
}

.admin-content {
  padding: 20px 0;
}

.admin-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--background-dark);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.admin-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 5px;
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

.loading p {
  font-size: 16px;
  margin: 16px 0 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-state h4 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 16px 0 8px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>