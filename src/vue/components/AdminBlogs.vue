<!-- AdminBlogs.vue - 管理员博客管理组件 -->
<template>
  <div class="admin-blogs">
    <!-- 主内容区 -->
    <main class="admin-content">
      <!-- 页面标题 -->
      <div class="admin-header">
        <div class="container">
          <h1 class="admin-title">博客管理</h1>
          <p class="admin-subtitle">管理所有博客文章</p>
        </div>
      </div>
      
      <!-- 博客管理内容 -->
      <div class="container">
        
        <!-- 搜索 -->
        <div class="blogs-filters">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              placeholder="搜索文章标题或内容..."
              v-model="searchQuery"
            >
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>
        
        <!-- 批量操作 -->
        <div class="batch-operations" v-if="blogs.length > 0">
          <div class="batch-select">
            <input type="checkbox" id="selectAll" v-model="selectAll" @change="toggleSelectAll">
            <label for="selectAll">全选</label>
          </div>
          <div class="batch-actions">
            <button class="batch-btn danger" @click="batchDelete" :disabled="selectedBlogs.length === 0">
              <i class="fas fa-trash"></i> 批量删除
            </button>
          </div>
        </div>
        
        <!-- 博客列表 -->
        <div class="blogs-list-container">
          <div v-if="isLoading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载博客列表中...</p>
          </div>
          
          <div v-else-if="blogs.length === 0" class="empty-state">
            <i class="fas fa-book"></i>
            <h4>暂无博客</h4>
            <p>没有符合条件的博客文章</p>
          </div>
          
          <div v-else>
            <div class="blogs-list">
              <div class="blog-item" v-for="blog in blogs" :key="blog._id" @click="viewBlog(blog)" :class="{ 'clickable': true }">
                <div class="blog-checkbox">
                  <input type="checkbox" :id="'blog-' + blog._id" :checked="isSelected(blog._id)" @change="toggleSelect(blog._id)" @click.stop>
                  <label :for="'blog-' + blog._id"></label>
                </div>
                <div class="blog-info">
                  <div class="blog-image">
                    <img v-lazy="blog.image" alt="博客封面" class="cover-image">
                  </div>
                  <div class="blog-details">
                    <div class="blog-title">{{ blog.title }}</div>
                    <div class="blog-meta">
                      <span class="blog-author">{{ blog.author?.username || '未知用户' }}</span>
                      <span class="blog-date">{{ formatDate(blog.createdAt) }}</span>
                      <span class="blog-status" :class="blog.status">{{ getStatusName(blog.status) }}</span>
                    </div>
                    <div class="blog-excerpt">{{ blog.excerpt || generateExcerpt(blog.content) }}</div>
                    <div class="blog-stats">
                      <span class="stat-item">
                        <i class="fas fa-eye"></i> {{ blog.views || 0 }}
                      </span>
                      <span class="stat-item">
                        <i class="fas fa-heart"></i> {{ blog.likes || 0 }}
                      </span>
                      <span class="stat-item">
                        <i class="fas fa-comment"></i> {{ blog.comments || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="blog-actions" @click.stop>
                  <button class="action-btn view-btn" @click="viewBlog(blog)">
                    <i class="fas fa-eye"></i> 查看
                  </button>
                  
                  <button class="action-btn delete-btn" @click="deleteBlog(blog)">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 分页 -->
            <div class="pagination">
              <button class="page-btn" :disabled="pagination.currentPage === 1" @click="prevPage">
                <i class="fas fa-chevron-left"></i> 上一页
              </button>
              <span class="page-info">第 {{ pagination.currentPage }} 页，共 {{ totalPages }} 页</span>
              <button class="page-btn" :disabled="pagination.currentPage === totalPages" @click="nextPage">
                下一页 <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import { showNotification } from '../utils/notification';
export default {
  name: 'AdminBlogs',
  components: {
    MobileBottomNav
  },
  data() {
    return {
      blogs: [],
      isLoading: false,
      searchQuery: '',
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
      selectedBlogs: [],
      selectAll: false,
      statusFilter: 'all',
      categoryFilter: 'all',
      categories: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    };
  },
  created() {
    // 加载博客列表
    this.fetchBlogs();
    // 加载分类列表
    this.loadCategories();
  },
  watch: {
    // 监听搜索查询变化
    searchQuery() {
      this.pagination.currentPage = 1; // 重置页码
      this.fetchBlogs();
    },

    // 监听分类筛选变化
    categoryFilter() {
      this.pagination.currentPage = 1; // 重置页码
      this.fetchBlogs();
    }
  },
  computed: {
    // 总博客数（从后端获取）
    totalBlogs() {
      return this.pagination.total || this.blogs.length;
    },

  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    },
    // 获取博客列表生成文章摘要
    generateExcerpt(content) {
      if (!content) return '';
      // 移除HTML标签
      const plainText = content.replace(/<[^>]*>/g, '');
      // 截取前100个字符
      return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    },
    // 获取博客列表
    async fetchBlogs() {
      try {
        this.isLoading = true;
        
        // 使用封装好的 API 方法，传递分页参数
        const response = await this.$http.admin.getAllBlogs({
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          category: this.categoryFilter !== 'all' ? this.categoryFilter : undefined,
          search: this.searchQuery || undefined
        });
        
        if (response && response.success) {
          // 确保 blogs 是数组
          this.blogs = Array.isArray(response.data) ? response.data : [];
          
          // 如果后端返回了分页信息，更新分页数据
          if (response.pagination) {
            this.totalPages = response.pagination.pages;
            this.pagination.currentPage = response.pagination.page;
            this.pagination.total = response.pagination.total;
          }
          
          // 如果后端返回空数据，不显示模拟数据
          if (this.blogs.length === 0) {
            // 不显示模拟数据，保持空数组
          }
        } else {
          throw new Error('获取博客列表失败');
        }
      } catch (error) {
        console.error('获取博客列表失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        // 重置博客列表为空数组
        this.blogs = [];
      } finally {
        this.isLoading = false;
      }
    },


    // 查看博客
    viewBlog(blog) {
      this.$router.push(`/detail/${blog._id}`);
    },


    // 删除博客
    async deleteBlog(blog) {
      if (!confirm(`确定要删除文章 "${blog.title}" 吗？此操作不可恢复。`)) {
        return;
      }
      
      try {
        // 使用封装好的 API 方法
        const response = await this.$http.admin.deleteBlog(blog._id);
        
        if (response && response.success) {
          // 从本地博客列表中删除
          this.blogs = this.blogs.filter(b => b._id !== blog._id);
          showNotification('博客删除成功', 'success');
        } else {
          throw new Error('删除博客失败');
        }
      } catch (error) {
        console.error('删除博客失败:', error);
        showNotification('删除失败，请稍后重试', 'error');
      }
    },
    // 分页
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.currentPage = page;
        this.fetchBlogs(); // 重新获取数据
      }
    },
    // 上一页
    prevPage() {
      if (this.pagination.currentPage > 1) {
        this.pagination.currentPage--;
        this.fetchBlogs();
      }
    },
    // 下一页
    nextPage() {
      if (this.pagination.currentPage < this.totalPages) {
        this.pagination.currentPage++;
        this.fetchBlogs();
      }
    },
    // 切换单个博客的选择状态
    toggleSelect(blogId) {
      const index = this.selectedBlogs.indexOf(blogId);
      if (index === -1) {
        this.selectedBlogs.push(blogId);
      } else {
        this.selectedBlogs.splice(index, 1);
      }
      // 更新全选状态
      this.selectAll = this.selectedBlogs.length === this.blogs.length;
    },
    // 切换全选状态
    toggleSelectAll() {
      if (this.selectAll) {
        // 全选
        this.selectedBlogs = this.blogs.map(blog => blog._id);
      } else {
        // 取消全选
        this.selectedBlogs = [];
      }
    },
    // 检查博客是否被选中
    isSelected(blogId) {
      return this.selectedBlogs.includes(blogId);
    },
    // 批量删除博客
    async batchDelete() {
      if (this.selectedBlogs.length === 0) return;
      
      if (!confirm(`确定要删除 ${this.selectedBlogs.length} 篇博客吗？此操作不可恢复。`)) {
        return;
      }
      
      try {
        this.isLoading = true;
        
        // 批量删除
        for (const blogId of this.selectedBlogs) {
          await this.$http.admin.deleteBlog(blogId);
          
          // 从本地博客列表中删除
          this.blogs = this.blogs.filter(b => b._id !== blogId);
        }
        
        showNotification(`成功删除 ${this.selectedBlogs.length} 篇博客`, 'success');
        this.selectedBlogs = [];
        this.selectAll = false;
      } catch (error) {
        console.error('批量删除失败:', error);
        showNotification('批量删除失败，请稍后重试', 'error');
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.admin-blogs {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  font-family: var(--font-family);
}

.admin-content {
  padding-top: 80px;
  padding-bottom: 70px;
}

.admin-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 25px 0;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--background-dark);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.2);
}

.admin-title {
  font-size: 32px;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.admin-subtitle {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 操作栏 */
.admin-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, #be185d 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.btn-secondary {
  padding: 12px 24px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

/* 批量操作 */
.batch-operations {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.batch-select {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-primary);
}

.batch-select input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-pink);
}

.batch-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-btn {
  padding: 10px 20px;
  border: 1px solid var(--primary-pink);
  border-radius: 6px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.batch-btn:hover:not(:disabled) {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-btn.danger:hover:not(:disabled) {
  border-color: #dc3545;
  color: #dc3545;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}

/* 博客复选框 */
.blog-checkbox {
  margin-top: 24px;
  margin-right: 20px;
  flex-shrink: 0;
}

.blog-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary-pink);
}

.blogs-filters {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 35px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 320px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 20px;
  border: 2px solid var(--primary-pink);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: var(--background-light);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-pink);
  font-size: 16px;
}

.filter-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid var(--primary-pink);
  border-radius: 6px;
  font-size: 14px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.blogs-list-container {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.blogs-list {
  margin-bottom: 24px;
}

.blog-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 0;
  border-bottom: 1px solid var(--background-dark);
  gap: 24px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 12px;
  position: relative;
}

.blog-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.blog-item.clickable {
  cursor: pointer;
}

.blog-item.clickable:hover {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  transform: translateX(4px);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

/* 确保操作按钮区域不触发点击事件 */
.blog-actions {
  pointer-events: auto;
}

.blog-image {
  width: 160px;
  height: 108px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid var(--background-dark);
}

.blog-item:hover .blog-image {
  transform: scale(1.02);
  box-shadow: 0 6px 12px rgba(236, 72, 153, 0.3);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.blog-details {
  flex: 1;
  min-width: 0;
  padding-right: 140px;
}

.blog-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.blog-item:hover .blog-title {
  color: var(--primary-pink);
}

.blog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6c757d;
}

.blog-author {
  font-weight: 500;
  color: var(--text-primary);
}

.blog-date {
  position: relative;
  padding-left: 12px;
}

.blog-date::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #adb5bd;
}

.blog-category {
  position: relative;
  padding-left: 12px;
  font-weight: 500;
  color: var(--primary-pink);
}

.blog-category::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #adb5bd;
}

.blog-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blog-status.published {
  background: linear-gradient(135deg, var(--accent-green) 0%, #e8f5e9 100%);
  color: #2e7d32;
  box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2);
}



.blog-excerpt {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.blog-stats {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 14px;
  color: #6c757d;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease;
}

.blog-item:hover .stat-item {
  color: var(--primary-pink);
}

.stat-item i {
  font-size: 16px;
}

.blog-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: absolute;
  right: 0;
  top: 20px;
  width: 120px;
  align-items: flex-end;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  min-width: 100px;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.view-btn {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
}

.view-btn:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}



.delete-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: #fff;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--background-dark);
}

.page-btn {
  padding: 10px 20px;
  border: 1px solid var(--primary-pink);
  border-radius: 6px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.2);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 60px;
}

.loading i {
  font-size: 32px;
  color: var(--primary-pink);
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-state i {
  font-size: 64px;
  color: var(--primary-pink);
  opacity: 0.6;
  margin-bottom: 16px;
  transition: color 0.3s ease;
}

.empty-state:hover i {
  color: var(--primary-pink);
  opacity: 1;
}

.empty-state h4 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-weight: 500;
}

.empty-state p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

@media (max-width: 768px) {
  .admin-header {
    padding: 20px 0;
  }
  
  .admin-title {
    font-size: 24px;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .blogs-filters {
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
  }
  
  .search-container {
    min-width: auto;
  }
  
  .filter-container {
    flex-direction: column;
  }
  
  .blog-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 0;
  }
  
  .blog-image {
    width: 100%;
    height: 200px;
  }
  
  .blog-actions {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
    min-width: 120px;
  }
  
  .batch-operations {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-actions {
    justify-content: center;
  }
}
</style>
