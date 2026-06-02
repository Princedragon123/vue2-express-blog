<!-- TopicList.vue - 话题列表组件 -->
<template>
  <div class="topic-list-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">话题圈</h1>
          <p class="page-subtitle">发现感兴趣的话题，参与讨论</p>
        </div>
      </div>
      
      <!-- 话题列表 -->
      <div class="container">
        <!-- 搜索框和创建按钮 -->
        <div class="search-and-create">
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索话题..."
            v-model="searchQuery"
            @input="searchTopics"
          >
          <button class="create-topic-btn" @click="showCreateModal = true">
            <svg-icon name="plus" :size="16"></svg-icon> 创建话题
          </button>
        </div>
        
        <!-- 话题分类 -->
        <div class="topic-categories">
          <button 
            class="category-btn" 
            :class="{ active: activeCategory === 'all' }"
            @click="setCategory('all')"
          >
            全部话题
          </button>
          <button 
            class="category-btn" 
            :class="{ active: activeCategory === 'hot' }"
            @click="setCategory('hot')"
          >
            热门话题
          </button>
          <button 
            class="category-btn" 
            :class="{ active: activeCategory === 'new' }"
            @click="setCategory('new')"
          >
            最新话题
          </button>
        </div>
        
        <!-- 话题列表 -->
        <div class="topic-list">
          <div 
            class="topic-item" 
            v-for="topic in topics" 
            :key="topic._id"
            @click="goToTopicDetail(topic._id)"
          >
            <div class="topic-info">
              <h3 class="topic-name">{{ topic.name }}</h3>
              <p class="topic-description">{{ topic.description }}</p>
              <div class="topic-stats">
                <span class="stat-item">
                  <svg-icon name="user" :size="14"></svg-icon>
                  {{ topic.followersCount }} 关注
                </span>
                <span class="stat-item">
                  <svg-icon name="fileText" :size="14"></svg-icon>
                  {{ topic.articlesCount }} 文章
                </span>
              </div>
            </div>
            <div class="topic-actions">
              <button 
                class="follow-btn" 
                :class="{ active: isFollowing(topic._id) }"
                @click.stop="toggleFollow(topic._id)"
              >
                {{ isFollowing(topic._id) ? '已关注' : '关注' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button class="btn-primary" @click="loadMore">加载更多</button>
        </div>
        
        <!-- 无话题提示 -->
        <div v-if="topics.length === 0" class="empty-state">
          <svg-icon name="comments" :size="48"></svg-icon>
          <p>暂无话题</p>
        </div>
      </div>
      
      <!-- 创建话题模态框 -->
      <div class="modal" v-if="showCreateModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>创建新话题</h2>
            <button class="close-btn" @click="showCreateModal = false">
              <svg-icon name="close" :size="20"></svg-icon>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createTopic">
              <div class="form-group">
                <label for="topic-name">话题名称</label>
                <input 
                  type="text" 
                  id="topic-name" 
                  v-model="newTopic.name"
                  placeholder="请输入话题名称"
                  required
                >
              </div>
              <div class="form-group">
                <label for="topic-description">话题描述</label>
                <textarea 
                  id="topic-description" 
                  v-model="newTopic.description"
                  placeholder="请输入话题描述"
                  rows="4"
                  required
                ></textarea>
              </div>
              <div class="form-group">
                <label for="topic-cover">封面图片（可选）</label>
                <input 
                  type="file" 
                  id="topic-cover" 
                  @change="handleCoverImage"
                  accept="image/*"
                >
                <img v-if="newTopic.coverImage" :src="newTopic.coverImage" class="preview-img">
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-secondary" @click="showCreateModal = false">取消</button>
                <button type="submit" class="btn-primary" :disabled="isCreating">
                  {{ isCreating ? '创建中...' : '创建话题' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';

export default {
  name: 'TopicList',
  components: {
  },
  data() {
    return {
      topics: [],
      searchQuery: '',
      activeCategory: 'all',
      page: 1,
      limit: 10,
      hasMore: true,
      followingTopics: [],
      showCreateModal: false,
      newTopic: {
        name: '',
        description: '',
        coverImage: ''
      },
      isCreating: false
    };
  },
  mounted() {
    this.fetchTopics();
    this.fetchFollowingTopics();
  },
  methods: {
    async fetchTopics() {
      try {
        let url = `/api/topics?page=${this.page}&limit=${this.limit}`;
        if (this.activeCategory === 'hot') {
          url += '&sort=followersCount';
        } else if (this.activeCategory === 'new') {
          url += '&sort=createdAt';
        }
        
        const data = await this.$http.get(url);
        if (data.success) {
          if (this.page === 1) {
            this.topics = data.data;
          } else {
            this.topics = [...this.topics, ...data.data];
          }
          this.hasMore = data.data.length === this.limit;
        }
      } catch (error) {
        console.error('获取话题列表失败:', error);
      }
    },
    async searchTopics() {
      if (this.searchQuery.trim()) {
        try {
          const data = await this.$http.get(`/api/topics/search?query=${encodeURIComponent(this.searchQuery)}`);
          if (data.success) {
            this.topics = data.data;
            this.hasMore = false;
          }
        } catch (error) {
          console.error('搜索话题失败:', error);
        }
      } else {
        this.page = 1;
        this.fetchTopics();
      }
    },
    setCategory(category) {
      this.activeCategory = category;
      this.page = 1;
      this.fetchTopics();
    },
    loadMore() {
      this.page += 1;
      this.fetchTopics();
    },
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`);
    },
    async fetchFollowingTopics() {
      try {
        const data = await this.$http.get('/api/topics/user/following');
        if (data.success) {
          this.followingTopics = data.data;
        }
      } catch (error) {
        console.error('获取关注话题失败:', error);
      }
    },
    isFollowing(topicId) {
      return this.followingTopics.includes(topicId);
    },
    async toggleFollow(topicId) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const isFollowing = this.isFollowing(topicId);
        let data;
        if (isFollowing) {
          data = await this.$http.delete(`/api/topics/${topicId}/follow`);
        } else {
          data = await this.$http.post(`/api/topics/${topicId}/follow`);
        }
        
        if (data.success) {
          if (isFollowing) {
            this.followingTopics = this.followingTopics.filter(id => id !== topicId);
          } else {
            this.followingTopics.push(topicId);
          }
          
          // 更新话题的关注数
          const topic = this.topics.find(t => t._id === topicId);
          if (topic) {
            topic.followersCount += isFollowing ? -1 : 1;
          }
        }
      } catch (error) {
        console.error('关注话题失败:', error);
      }
    },
    handleCoverImage(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.newTopic.coverImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async createTopic() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        this.isCreating = true;
        
        // 检查是否有图片需要上传
        if (this.newTopic.coverImage && this.newTopic.coverImage.startsWith('data:')) {
          // 这里可以实现图片上传逻辑，暂时使用占位图
          this.newTopic.coverImage = `https://via.placeholder.com/400x200?text=${encodeURIComponent(this.newTopic.name)}`;
        }
        
        const data = await this.$http.post('/api/topics', this.newTopic);
        if (data.success) {
          // 关闭模态框
          this.showCreateModal = false;
          // 重置表单
          this.newTopic = {
            name: '',
            description: '',
            coverImage: ''
          };
          // 重新获取话题列表
          this.page = 1;
          this.fetchTopics();
          // 显示成功提示
          showNotification('话题创建成功！', 'success');
        } else {
          showNotification('创建话题失败: ' + (data.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('创建话题失败:', error);
        showNotification('创建话题失败，请稍后重试', 'error');
      } finally {
        this.isCreating = false;
      }
    }
  }
};
</script>

<style scoped>
/* 话题列表页面 */
.topic-list-page {
  min-height: 100vh;
  background-color: #fafafa;
}

/* 页面标题 */
.page-header {
  background-color: white;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #8e8e8e;
}

/* 搜索框和创建按钮 */
.search-and-create {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.1);
}

.create-topic-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background-color: #4ecdc4;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-topic-btn:hover {
  background-color: #45b7aa;
  transform: translateY(-2px);
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #8e8e8e;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.preview-img {
  margin-top: 12px;
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  object-fit: cover;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background-color: #ff6b9d;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #ff528b;
}

.btn-primary:disabled {
  background-color: #e0e0e0;
  color: #8e8e8e;
  cursor: not-allowed;
}

/* 话题分类 */
.topic-categories {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background-color: white;
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.category-btn:hover {
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.category-btn.active {
  background-color: #ff6b9d;
  border-color: #ff6b9d;
  color: white;
}

/* 话题列表 */
.topic-list {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

/* 话题项 */
.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.topic-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.topic-info {
  flex: 1;
  margin-right: 20px;
}

.topic-name {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.topic-description {
  margin: 0 0 12px;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #8e8e8e;
}

.stat-item i {
  font-size: 1rem;
}

/* 话题操作 */
.topic-actions {
  display: flex;
  align-items: flex-start;
}

.follow-btn {
  padding: 8px 16px;
  border: 1px solid #ff6b9d;
  border-radius: 20px;
  background-color: white;
  font-size: 0.8rem;
  font-weight: 500;
  color: #ff6b9d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background-color: #ff6b9d;
  color: white;
}

.follow-btn.active {
  background-color: #ff6b9d;
  color: white;
}

/* 加载更多 */
.load-more {
  text-align: center;
  margin-bottom: 30px;
}

.btn-primary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #ff6b9d;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #ff528b;
  transform: translateY(-2px);
}

/* 无话题提示 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #8e8e8e;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .topic-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .topic-actions {
    margin-top: 16px;
  }
  
  .topic-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>