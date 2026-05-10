<!-- AdminBlogs.vue - 管理员博客管理组件 -->
<template>
  <div class="admin-blogs">
    <main class="admin-content">
      <div class="admin-header">
        <div class="container">
          <h1 class="admin-title">博客管理</h1>
          <p class="admin-subtitle">管理所有博客文章</p>
        </div>
      </div>
      
      <div class="container">
        <BlogSearch
          :query="searchQuery"
          @update:query="searchQuery = $event"
        />
        
        <BatchOperations
          :total-items="blogs.length"
          :selected-count="selectedBlogs.length"
          :is-all-selected="selectAll"
          @toggle-select-all="toggleSelectAll"
          @batch-delete="batchDelete"
        />
        
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
              <BlogItem
                v-for="blog in blogs"
                :key="blog._id"
                :blog="blog"
                :is-selected="isSelected(blog._id)"
                @view="viewBlog"
                @delete="deleteBlog"
                @toggle-select="toggleSelect(blog._id)"
              />
            </div>
            
            <BlogPagination
              :current-page="pagination.currentPage"
              :total-pages="totalPages"
              @prev="prevPage"
              @next="nextPage"
            />
          </div>
        </div>
      </div>
    </main>
    
    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import BlogSearch from './admin-blogs/BlogSearch.vue';
import BatchOperations from './admin-blogs/BatchOperations.vue';
import BlogItem from './admin-blogs/BlogItem.vue';
import BlogPagination from './admin-blogs/BlogPagination.vue';
import { showNotification } from '../utils/notification';

export default {
  name: 'AdminBlogs',
  
  components: {
    MobileBottomNav,
    BlogSearch,
    BatchOperations,
    BlogItem,
    BlogPagination
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
    this.fetchBlogs();
    this.loadCategories();
  },
  
  watch: {
    searchQuery() {
      this.pagination.currentPage = 1;
      this.fetchBlogs();
    },
    categoryFilter() {
      this.pagination.currentPage = 1;
      this.fetchBlogs();
    }
  },
  
  computed: {
    totalBlogs() {
      return this.pagination.total || this.blogs.length;
    },
  },
  
  methods: {
    async fetchBlogs() {
      try {
        this.isLoading = true;
        
        const response = await this.$http.admin.getAllBlogs({
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          category: this.categoryFilter !== 'all' ? this.categoryFilter : undefined,
          search: this.searchQuery || undefined
        });
        
        if (response && response.success) {
          this.blogs = Array.isArray(response.data) ? response.data : [];
          
          if (response.pagination) {
            this.totalPages = response.pagination.pages;
            this.pagination.currentPage = response.pagination.page;
            this.pagination.total = response.pagination.total;
          }
        } else {
          throw new Error('获取博客列表失败');
        }
      } catch (error) {
        console.error('获取博客列表失败:', error);
        this.blogs = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadCategories() {
      try {
        const response = await this.$http.admin.getCategories();
        if (response && response.success) {
          this.categories = response.data || [];
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    },
    
    viewBlog(blog) {
      this.$router.push(`/detail/${blog._id}`);
    },
    
    async deleteBlog(blog) {
      if (!confirm(`确定要删除文章 "${blog.title}" 吗？此操作不可恢复。`)) {
        return;
      }
      
      try {
        const response = await this.$http.admin.deleteBlog(blog._id);
        
        if (response && response.success) {
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
    
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.currentPage = page;
        this.fetchBlogs();
      }
    },
    
    prevPage() {
      if (this.pagination.currentPage > 1) {
        this.pagination.currentPage--;
        this.fetchBlogs();
      }
    },
    
    nextPage() {
      if (this.pagination.currentPage < this.totalPages) {
        this.pagination.currentPage++;
        this.fetchBlogs();
      }
    },
    
    toggleSelect(blogId) {
      const index = this.selectedBlogs.indexOf(blogId);
      if (index === -1) {
        this.selectedBlogs.push(blogId);
      } else {
        this.selectedBlogs.splice(index, 1);
      }
      this.selectAll = this.selectedBlogs.length === this.blogs.length;
    },
    
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedBlogs = this.blogs.map(blog => blog._id);
      } else {
        this.selectedBlogs = [];
      }
    },
    
    isSelected(blogId) {
      return this.selectedBlogs.includes(blogId);
    },
    
    async batchDelete() {
      if (this.selectedBlogs.length === 0) return;
      
      if (!confirm(`确定要删除 ${this.selectedBlogs.length} 篇博客吗？此操作不可恢复。`)) {
        return;
      }
      
      try {
        this.isLoading = true;
        
        for (const blogId of this.selectedBlogs) {
          await this.$http.admin.deleteBlog(blogId);
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
