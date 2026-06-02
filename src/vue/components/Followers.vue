<!-- Followers.vue - 粉丝页组件 -->
<template>
  <div class="followers-page" :class="currentStyle">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">
      <svg-icon name="arrowLeft" :size="18"></svg-icon> 返回首页
    </button>
    
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">我的粉丝</h1>
          <p class="page-subtitle">查看关注你的用户</p>
        </div>
      </div>
      
      <!-- 粉丝列表 -->
      <div class="container">
        <div class="followers-list">
          <!-- 粉丝用户卡片 -->
          <div class="follower-card" v-for="follower in followers" :key="follower.id || follower._id">
            <div class="user-info" @click="goToUserProfile(follower.id)">
              <img :src="getAvatar(follower, 100)" alt="用户头像" class="user-avatar" style="cursor: pointer;" @error="handleAvatarError($event, follower.username, 100)">
              <div class="user-details">
                <div class="username" style="cursor: pointer;">{{ follower.username }}</div>
                <div class="user-bio">{{ follower.bio }}</div>
                <div class="user-stats">
                  <span class="stat-item">{{ follower.followers }} 粉丝</span>
                  <span class="stat-separator">·</span>
                  <span class="stat-item">{{ follower.posts }} 攻略</span>
                </div>
              </div>
            </div>
            <button 
              :class="['follow-btn', follower.isFollowing ? 'btn-following' : 'btn-primary']"
              @click.stop="toggleFollow(follower.id)"
            >
              {{ follower.isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
        </div>
        
        <!-- 空粉丝状态 -->
        <div v-if="followers.length === 0" class="empty-state">
          <svg-icon name="users" :size="48"></svg-icon>
          <h3>暂无粉丝</h3>
          <p>发布更多内容，吸引粉丝关注你吧</p>
          <button class="btn-primary" @click="$router.push('/blog')">
            发布内容
          </button>
        </div>
      </div>
    </main>
    
    <!-- 底部导航栏 -->
    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import avatarMixin from '../mixins/avatarMixin';

export default {
  name: 'FollowersPage',
  mixins: [avatarMixin],
  components: {
    MobileBottomNav
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
    // 页面加载时获取粉丝列表
    this.fetchFollowers();
  },
  data() {
    return {
      currentStyle: localStorage.getItem('currentStyle') || 'style-spring-garden',
      followers: [],
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
    
    // 切换关注状态
    async toggleFollow(userId) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          alert('请先登录');
          return;
        }
        
        const followerIndex = this.followers.findIndex(f => f.id === userId);
        if (followerIndex === -1) return;
        
        const isFollowing = this.followers[followerIndex].isFollowing;
        
        if (isFollowing) {
          const data = await this.$http.delete(`/api/users/${userId}/follow`);
          if (data.success) {
            this.followers[followerIndex].isFollowing = false;
          }
        } else {
          const data = await this.$http.post(`/api/users/${userId}/follow`);
          if (data.success) {
            this.followers[followerIndex].isFollowing = true;
          }
        }
      } catch (error) {
        console.error('关注操作失败:', error);
      }
    },
    
    // 从后端获取粉丝列表
    async fetchFollowers() {
      try {
        this.isLoading = true;
        // 获取当前用户ID（删除硬编码虚拟ID）
        const userInfo = await this.$http.get('/api/auth/me');
        const currentUserId = userInfo.user?.id || userInfo.user?._id;

        // 无用户ID时直接抛出异常
        if (!currentUserId) {
          throw new Error('未获取到当前用户信息');
        }
        
        // 调用API获取粉丝列表
        const data = await this.$http.get(`/api/users/${currentUserId}/followers`);
        
        if (data.success) {
          this.followers = data.data.map(user => ({
            id: user._id,
            username: user.username,
            // 删除虚拟占位头像
            avatar: user.profile?.avatar,
            bio: user.profile?.bio || '',
            posts: user.stats?.postsCount || 0,
            followers: user.social?.followers?.length || 0,
            isFollowing: user.isFollowing || false
          }));
        } else {
          throw new Error(data.message || '获取粉丝列表失败');
        }
      } catch (error) {
        console.error('获取粉丝列表失败:', error);
        // 此处已删除所有模拟虚拟数据
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
/* 粉丝页面 */
.followers-page {
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

/* 粉丝列表 */
.followers-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

/* 粉丝用户卡片 */
.follower-card {
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.follower-card:hover {
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
  border: 2px solid #ff6b9d;
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

.follow-btn {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #ff6b9d;
  color: white;
}

.btn-primary:hover {
  background-color: #ff477e;
}

.btn-following {
  background-color: #f5f5f5;
  color: #666;
}

.btn-following:hover {
  background-color: #e0e0e0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 4rem;
  color: #ff6b9d;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
  color: #333;
}

.empty-state p {
  margin: 0 0 20px;
  color: #8e8e8e;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .follower-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .follow-btn {
    align-self: flex-end;
  }
}
</style>