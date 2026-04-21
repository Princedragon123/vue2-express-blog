<!-- Following.vue - 关注页组件 -->
<template>
  <div class="following-page" :class="currentStyle">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">我的关注</h1>
          <p class="page-subtitle">查看你关注的用户和他们的最新动态</p>
        </div>
      </div>
      
      <!-- 关注列表 -->
      <div class="container">
        <div class="following-list">
          <!-- 关注用户卡片 -->
          <div class="following-card" v-for="followed in followedUsers" :key="followed.id || followed._id">
            <div class="user-info" @click="goToUserProfile(followed.id)">
              <img :src="getAvatar(followed.avatar || followed, 100)" alt="用户头像" class="user-avatar" style="cursor: pointer;" @error="handleAvatarError($event, followed.username, 100)">
              <div class="user-details">
                <div class="username" style="cursor: pointer;">{{ followed.username }}</div>
                <div class="user-bio">{{ followed.bio }}</div>
                <div class="user-stats">
                  <span class="stat-item">{{ followed.followers }} 粉丝</span>
                  <span class="stat-separator">·</span>
                  <span class="stat-item">{{ followed.following }} 关注</span>
                  <span class="stat-separator">·</span>
                  <span class="stat-item">{{ followed.posts }} 攻略</span>
                  <span class="stat-separator">·</span>
                  <span class="stat-item">{{ followed.likes }} 获赞</span>
                </div>
              </div>
            </div>
            <button 
              :class="['following-btn', { 'is-following': followed.isFollowing }]"
              @click.stop="toggleFollow(followed.id, followed.isFollowing)"
            >
              <span class="nav-icon">{{ followed.isFollowing ? '✓' : '+' }}</span>
              {{ followed.isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
          
          <!-- 用户文章卡片 -->
          <div v-if="followedArticles.length > 0" class="user-articles">
            <h3 class="section-title">他们的最新文章</h3>
            <div class="articles-grid">
              <div class="article-card" v-for="article in followedArticles" :key="article._id || article.id" @click="goToArticleDetail(article._id || article.id)">
                <img v-lazy="article.image" alt="文章封面" class="article-image">
                <div class="article-content">
                  <div class="article-category">{{ article.category }}</div>
                  <h4 class="article-title">{{ article.title }}</h4>
                  <div class="article-meta">
                    <span class="article-author">{{ article.author }}</span>
                    <span class="article-date">{{ article.date }}</span>
                  </div>
                  <div class="article-stats">
                    <span class="stat-item">{{ article.likes }} 赞</span>
                    <span class="stat-separator">·</span>
                    <span class="stat-item">{{ article.comments }} 评论</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空关注状态 -->
        <div v-if="followedUsers.length === 0" class="empty-state">
          <span class="nav-icon">👥</span>
          <h3>暂无关注</h3>
          <p>快去关注一些你感兴趣的用户吧</p>
          <button class="btn-primary" @click="$router.push('/blog')">
            浏览用户
          </button>
        </div>
      </div>
    </main>
    

  </div>
</template>

<script>
import avatarMixin from '../mixins/avatarMixin';
import { showNotification } from '../utils/notification';

export default {
  name: 'Following',
  mixins: [avatarMixin],
  components: {
  },
  created() {
    // 添加全局风格变化事件监听器
    window.addEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
  },
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('styleChanged', (event) => {
      this.currentStyle = event.detail.style;
    });
  },
  mounted() {
    // 页面加载时获取关注用户列表和他们的文章
    this.fetchFollowedUsers();
    this.fetchFollowedArticles();
  },
  data() {
    return {
      currentStyle: localStorage.getItem('currentStyle') || 'style-spring-garden',
      followedUsers: [],
      followedArticles: [],
      isLoading: false
    };
  },
  methods: {
    // 返回首页
    goBack() {
      this.$router.push('/blog');
    },
    
    // 跳转到用户个人信息页
    goToUserProfile(userId) {
      this.$router.push(`/profile/${userId}`);
    },
    
    // 跳转到文章详情页
    goToArticleDetail(articleId) {
      this.$router.push(`/zhihu-detail/${articleId}`);
    },

// 切换关注状态
    async toggleFollow(userId, isFollowing) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          showNotification('请先登录', 'warning');
          return;
        }
        
        if (isFollowing) {
          // 取消关注
          const data = await this.$http.delete(`/api/users/${userId}/follow`);
          if (data.success) {
            const index = this.followedUsers.findIndex(user => user.id === userId);
            if (index !== -1) {
              this.followedUsers[index].isFollowing = false;
            }
            showNotification('取消关注成功', 'success');
          } else {
            showNotification(data.message || '取消关注失败', 'error');
          }
        } else {
          // 关注
          const data = await this.$http.post(`/api/users/${userId}/follow`);
          if (data.success) {
            const index = this.followedUsers.findIndex(user => user.id === userId);
            if (index !== -1) {
              this.followedUsers[index].isFollowing = true;
            }
            showNotification('关注成功', 'success');
          } else {
            showNotification(data.message || '关注失败', 'error');
          }
        }
      } catch (error) {
        console.error('关注操作失败:', error);
        showNotification('操作失败，请重试', 'error');
      }
    },
    
    // 从后端获取关注用户列表
    async fetchFollowedUsers() {
      try {
        this.isLoading = true;
        // 获取当前用户ID
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.followedUsers = [];
          return;
        }
        
        // 先获取当前用户信息
        const userInfo = await this.$http.get('/api/auth/me');
        const currentUserId = userInfo.data?.id || userInfo.data?._id;
        
        if (!currentUserId) {
          this.followedUsers = [];
          return;
        }
        
        // 调用API获取关注用户列表
        const data = await this.$http.get(`/api/users/${currentUserId}/following`);
        
        if (data.success) {
          // 使用用户的社交关注列表长度作为关注数
          // 由于后端已经返回了用户的完整信息，包括social字段，我们可以直接使用
          this.followedUsers = data.data.map(user => ({
            id: user._id,
            username: user.username,
            avatar: (user.profile?.avatar && user.profile.avatar.trim()) || 'https://via.placeholder.com/100',
            bio: user.profile?.bio || '',
            posts: user.stats?.postsCount || 0,
            followers: user.followingCount || 0,
            following: user.followersCount || 0,
            likes: user.stats?.likesCount || 0,
            isFollowing: user.isFollowing || false
          }));
          
          // 为了确保攻略数、获赞数、粉丝数和关注数的准确性，我们可以为每个用户获取实际的用户信息和博客列表
          // 这里使用现有的API端点 /api/users/:userId 来获取用户信息和博客列表
          const followedUsersWithDetails = await Promise.all(
            this.followedUsers.map(async (user) => {
              try {
                // 获取用户信息和博客列表
                const userData = await this.$http.get(`/api/users/${user.id}`);
                if (userData.success) {
                  const postsCount = userData.data.latestBlogs.length;
                  // 计算用户的获赞数（可以从用户的stats.likesCount获取，或者从博客列表中计算）
                  const likesCount = userData.data.user?.stats?.likesCount || 0;
                  // 获取用户的粉丝数和关注数
                  const followersCount = userData.data.user?.followersCount || 0;
                  const followingCount = userData.data.user?.followingCount || 0;
                  
                  return {
                    ...user,
                    posts: postsCount,
                    likes: likesCount,
                    followers: followersCount,
                    following: followingCount
                  };
                }
                return user;
              } catch (error) {
                console.error(`获取用户 ${user.username} 的详细信息失败:`, error);
                return user;
              }
            })
          );
          
          this.followedUsers = followedUsersWithDetails;
        } else {
          throw new Error(data.message || '获取关注用户列表失败');
        }
      } catch (error) {
        console.error('获取关注用户列表失败:', error);
        // 当API调用失败时显示空数组，不使用模拟数据
        this.followedUsers = [];
      } finally {
        this.isLoading = false;
      }
    },
    
    // 从后端获取关注用户的文章
    async fetchFollowedArticles() {
      try {
        // 获取当前用户ID
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.followedArticles = [];
          return;
        }
        
        // 先获取当前用户信息
        const userInfo = await this.$http.get('/api/auth/me');
        const currentUserId = userInfo.data?.id || userInfo.data?._id;
        
        if (!currentUserId) {
          this.followedArticles = [];
          return;
        }
        
        // 由于后端没有提供获取关注用户文章的API，我们可以通过获取关注用户列表，然后获取每个用户的文章
        // 首先获取关注用户列表
        const followingData = await this.$http.get(`/api/users/${currentUserId}/following`);
        
        if (followingData.success) {
          const followedUserIds = followingData.data.map(user => user._id);
          
          // 获取每个关注用户的文章
          const articlesPromises = followedUserIds.map(async (userId) => {
            try {
              const userData = await this.$http.get(`/api/users/${userId}`);
              if (userData.success) {
                return userData.data.latestBlogs.map(blog => ({
                  ...blog,
                  author: userData.data.user.username
                }));
              }
              return [];
            } catch (error) {
              console.error(`获取用户 ${userId} 的文章失败:`, error);
              return [];
            }
          });
          
          const articlesArrays = await Promise.all(articlesPromises);
          // 合并所有文章并按创建时间排序
          this.followedArticles = articlesArrays
            .flat()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // 只显示最新的10篇文章
        } else {
          throw new Error(followingData.message || '获取关注用户列表失败');
        }
      } catch (error) {
        console.error('获取关注用户文章失败:', error);
        // 当API调用失败时显示空数组，不使用模拟数据
        this.followedArticles = [];
      }
    }
  }
}
</script>

<style scoped>
/* 关注页面 */
.following-page {
  min-height: 100vh;
  background-color: #fafafa;
}

/* 主内容区 */
.main-content {
  padding-bottom: 70px; /* 为底部导航栏预留空间 */
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

/* 关注列表 */
.following-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

/* 关注用户卡片 */
.following-card {
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.following-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.user-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.user-bio {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.user-stats {
  font-size: 0.8rem;
  color: #8e8e8e;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-separator {
  color: #ccc;
}

.following-btn {
  background-color: #f5f5f5;
  color: #666;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.following-btn:hover {
  background-color: #e0e0e0;
}

.following-btn .nav-icon {
  color: var(--primary-pink);
  font-size: 0.8rem;
}

/* 空关注状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.empty-state .nav-icon {
  font-size: 4rem;
  color: #e0e0e0;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  color: #333;
}

.empty-state p {
  margin: 0 0 30px;
  color: #8e8e8e;
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
}

/* 文章列表样式 */
.user-articles {
  margin-top: 40px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.article-card {
  background-color: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.article-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.article-content {
  padding: 15px;
}

.article-category {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f5f5f5;
  color: #666;
  margin-bottom: 10px;
}

.article-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #8e8e8e;
  margin-bottom: 10px;
}

.article-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: #8e8e8e;
}

.article-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}



/* 响应式设计 */
@media (max-width: 992px) {
  .page-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .page-subtitle {
    font-size: 0.9rem;
  }
  
  .following-card {
    padding: 15px;
  }
  
  .user-avatar {
    width: 50px;
    height: 50px;
  }
  
  .username {
    font-size: 0.95rem;
  }
  
  .user-bio {
    font-size: 0.85rem;
  }
  
  .following-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .following-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .following-btn {
    align-self: flex-end;
  }
  
  .empty-state {
    padding: 40px 15px;
  }
  
  .empty-state i {
    font-size: 3rem;
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
  }
}
</style>
