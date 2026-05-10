<template>
  <div class="profile-page">
    <AppNotification
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
    />

    <main class="main-content">
      <div class="container">
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchUserInfo">重新加载</button>
        </div>

        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <ProfileHeader
          v-else
          :user-info="userInfo"
          :avatar-url="getAuthorAvatar(userInfo.avatar, 100)"
          :is-current-user="isCurrentUser"
          :is-following="isFollowing"
          :is-mutual-following="isMutualFollowing"
          :cover-style="coverStyle"
          :cover-image-style="coverImageStyle"
          :show-confirm-dialog="showConfirmDialog"
          @avatar-error="onAvatarError"
          @toggle-follow="isFollowing ? unfollowUser() : followUser()"
          @show-following="showFollowingList"
          @show-followers="showFollowersList"
          @navigate-creation="navigateToCreation"
          @cover-mouse-move="handleCoverMouseMove"
          @cover-mouse-leave="handleCoverMouseLeave"
          @update:showConfirmDialog="showConfirmDialog = $event"
        />

        <ProfileTabs
          v-if="!error && !isLoading"
          v-model="activeTab"
          :is-current-user="isCurrentUser"
        />

        <div v-if="!error && !isLoading" class="profile-tab-content">
          <ArticleGrid
            v-if="activeTab === 'posts'"
            :articles="userPosts"
            :privacy-denied="postsPrivacyDenied"
            empty-icon="📄"
            :empty-title="'暂无发布'"
            :empty-description="isCurrentUser ? '快去发布你的第一篇攻略吧' : '该用户还没有发布任何攻略'"
            :show-action="isCurrentUser"
            action-text="发布攻略"
            @click-article="goToBlogDetail"
            @action="$router.push('/create')"
          />

          <ArticleGrid
            v-else-if="activeTab === 'likes'"
            :articles="likedPosts"
            :privacy-denied="likesPrivacyDenied"
            :show-author="true"
            empty-icon="❤️"
            :empty-title="'暂无点赞'"
            :empty-description="isCurrentUser ? '快去点赞你喜欢的攻略吧' : '该用户还没有点赞任何攻略'"
            :show-action="true"
            action-text="浏览攻略"
            @click-article="goToBlogDetail"
            @action="$router.push('/blog')"
          />

          <ArticleGrid
            v-else-if="activeTab === 'bookmarks'"
            :articles="bookmarkedPosts"
            :privacy-denied="bookmarksPrivacyDenied"
            :show-author="true"
            empty-icon="📌"
            :empty-title="'暂无收藏'"
            :empty-description="isCurrentUser ? '快去收藏你喜欢的攻略吧' : '该用户还没有收藏任何攻略'"
            :show-action="true"
            action-text="浏览攻略"
            @click-article="goToBlogDetail"
            @action="$router.push('/blog')"
          />
        </div>
      </div>
    </main>

    <MobileBottomNav />

    <SocialListModal
      :visible="showSocialListModal"
      :title="socialListTitle"
      :list-type="socialListType"
      :users="socialList"
      :loading="socialListLoading"
      :error="socialListError"
      :has-more="hasMore"
      :current-user-id="userInfo._id || ''"
      @close="closeSocialListModal"
      @retry="fetchSocialList"
      @toggle-follow="toggleFollow"
      @load-more="loadMore"
    />
  </div>
</template>

<script>
import MobileBottomNav from './MobileBottomNav.vue';
import CacheManager from '../utils/cache';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';
import ProfileHeader from './profile/ProfileHeader.vue';
import ProfileTabs from './profile/ProfileTabs.vue';
import ArticleGrid from './profile/ArticleGrid.vue';
import SocialListModal from './profile/SocialListModal.vue';
import AppNotification from './profile/AppNotification.vue';

export default {
  name: 'Profile',
  components: {
    MobileBottomNav,
    ProfileHeader,
    ProfileTabs,
    ArticleGrid,
    SocialListModal,
    AppNotification
  },
  
  metaInfo() {
    return {
      title: `${this.userInfo.username || '用户'}的个人资料`,
      meta: [
        { name: 'description', content: this.userInfo.bio || `${this.userInfo.username || '用户'}的个人博客资料页` },
        { name: 'keywords', content: `${this.userInfo.username || '用户'},个人资料,博客` }
      ]
    };
  },
  
  data() {
    return {
      userId: null,
      userInfo: {
        _id: '',
        username: '用户名',
        avatar: '/static/images/default-avatar.png',
        bio: '分享我的攻略经验，记录生活中的美好瞬间',
        posts: 0,
        following: 0,
        followers: 0,
        likes: 0
      },
      userPosts: [],
      isLoading: false,
      error: null,
      isCurrentUser: true,
      isFollowing: false,
      isMutualFollowing: false,
      showConfirmDialog: false,
      activeTab: 'posts',
      likedPosts: [],
      bookmarkedPosts: [],
      showSocialListModal: false,
      socialListType: 'followers',
      socialListTitle: '',
      socialList: [],
      socialListLoading: false,
      socialListError: null,
      currentPage: 1,
      hasMore: true,
      notification: {
        show: false,
        message: '',
        type: 'success'
      },
      likesPrivacyDenied: false,
      bookmarksPrivacyDenied: false,
      postsPrivacyDenied: false,
      coverMouseX: 0.5,
      coverMouseY: 0.5
    };
  },
  
  computed: {
    coverStyle() {
      return {
        '--mouse-x': this.coverMouseX,
        '--mouse-y': this.coverMouseY
      };
    },
    coverImageStyle() {
      const coverImage = this.userInfo.coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=profile%20cover%20image%20for%20blog%20user&image_size=landscape_16_9';
      return {
        backgroundImage: `url(${coverImage})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: 'cover'
      };
    }
  },
  
  created() {
    this.userId = this.$route.params.userId || 'current';
  },
  
  mounted() {
    this.fetchUserInfo();
  },
  
  watch: {
    '$route.params.userId': {
      handler(newUserId) {
        this.userId = newUserId || 'current';
        this.fetchUserInfo();
      },
      immediate: true
    },
    '$route': {
      handler(newRoute) {
        this.userId = newRoute.params.userId || 'current';
        this.fetchUserInfo();
      },
      immediate: true
    }
  },
  
  methods: {
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    handleCoverMouseMove(e) {
      const cover = e.currentTarget;
      const rect = cover.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.coverMouseX = x;
      this.coverMouseY = y;
    },
    
    handleCoverMouseLeave(e) {
      this.coverMouseX = 0.5;
      this.coverMouseY = 0.5;
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    
    confirmCreate() {
      this.showConfirmDialog = true;
    },
    
    navigateToCreation() {
      this.showConfirmDialog = false;
      this.$router.push('/my-creation');
    },
    
    async fetchLikedPosts() {
      try {
        this.likesPrivacyDenied = false;
        const response = await this.$http.users.getLikedPosts(this.userInfo._id);
        if (response.success) {
          this.likedPosts = response.data.map(blog => {
            let author = blog.author || '未知作者';
            if (typeof author === 'object' && author.username) {
              author = author.username;
            }
            return { ...blog, author, date: blog.date || blog.createdAt };
          });
        } else {
          this.likedPosts = [];
        }
      } catch (error) {
        console.error('获取点赞文章失败:', error);
        if (error.response && error.response.status === 403 && !this.isCurrentUser) {
          this.likesPrivacyDenied = true;
        }
        this.likedPosts = [];
      }
    },
    
    async fetchBookmarkedPosts() {
      try {
        this.bookmarksPrivacyDenied = false;
        const response = await this.$http.users.getBookmarkedPosts(this.userInfo._id);
        if (response.success) {
          this.bookmarkedPosts = response.data.map(blog => {
            let author = blog.author || '未知作者';
            if (typeof author === 'object' && author.username) {
              author = author.username;
            }
            return { ...blog, author, date: blog.date || blog.createdAt };
          });
        } else {
          this.bookmarkedPosts = [];
        }
      } catch (error) {
        console.error('获取收藏文章失败:', error);
        if (error.response && error.response.status === 403 && !this.isCurrentUser) {
          this.bookmarksPrivacyDenied = true;
        }
        this.bookmarkedPosts = [];
      }
    },
    
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    getMockUserData() {
      const validUserId = this.userId === 'current' || !this.userId || this.userId === 'undefined' || this.userId === 'null' 
        ? '699c78d38830cdbab2e8a637' 
        : this.userId;
      return {
        _id: validUserId,
        username: '游戏达人',
        avatar: '/static/uploads/avatars/游戏达人.jpg',
        coverImage: '/static/images/default-cover.jpg',
        bio: '专注于分享各种游戏攻略和心得，欢迎关注！',
        posts: 23,
        following: 48,
        followers: 156,
        likes: 523
      };
    },
    
    async fetchUserInfo() {
      if (!this.userId) {
        this.userId = this.$route.params.userId || 'current';
      }
      this.isLoading = true;
      this.error = null;
      
      try {
        const token = this.getAuthToken();
        if (!token && this.userId === 'current') {
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
          return;
        }
        
        let userData;
        let currentUserId = '';
        
        try {
          const meResponse = await this.$http.auth.getCurrentUser();
          if (meResponse.success && meResponse.data) {
            currentUserId = meResponse.data.id || meResponse.data._id;
          }
        } catch (error) {
          console.error('获取当前用户信息失败:', error);
        }
        
        try {
          const targetUserId = this.userId === 'current' ? currentUserId : this.userId;
          if (!targetUserId) {
            this.userInfo = this.getMockUserData();
            this.userPosts = [];
            this.isCurrentUser = false;
            this.isFollowing = false;
            return;
          }
          const userResponse = await this.$http.users.getInfo(targetUserId);
          if (userResponse && userResponse.success) {
            userData = userResponse.data;
          } else {
            this.userInfo = this.getMockUserData();
            this.userPosts = [];
            this.isCurrentUser = false;
            this.isFollowing = false;
            return;
          }
        } catch (error) {
          console.error('获取用户详细信息失败:', error);
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
          return;
        }
        
        if (userData) {
          const user = userData.user || {};
          const profile = user.profile || {};
          const latestBlogs = userData.latestBlogs || [];
          
          let avatar = profile.avatar || '/static/images/default-avatar.png';
          if (avatar && !avatar.startsWith('http://') && !avatar.startsWith('https://') && !avatar.startsWith('/static/')) {
            if (avatar.startsWith('/uploads/')) {
              avatar = `/static${avatar}`;
            } else if (avatar.startsWith('uploads/')) {
              avatar = `/static/${avatar}`;
            } else {
              avatar = `/static${avatar.startsWith('/') ? '' : '/'}${avatar}`;
            }
          }
          
          this.userInfo = {
            _id: user._id || '',
            username: user.username || '未知用户',
            avatar,
            coverImage: profile.coverImage || '/static/images/default-cover.jpg',
            bio: profile.bio || '',
            location: profile.location || '',
            occupation: profile.occupation || '',
            website: profile.website || '',
            posts: userData.totalPostsCount || latestBlogs.length || 0,
            following: user.followingCount || 0,
            followers: user.followersCount || 0,
            likes: user.stats?.likesCount || 0
          };
          
          this.userPosts = latestBlogs.map(blog => ({ ...blog }));
          this.isCurrentUser = this.userId === 'current' || this.userId === currentUserId;
          
          this.postsPrivacyDenied = this.isCurrentUser ? false : (userData.postsPrivacyDenied || false);
          this.likesPrivacyDenied = false;
          this.bookmarksPrivacyDenied = false;
          
          if (!this.isCurrentUser) {
            try {
              const targetUserId = this.userId === 'current' ? currentUserId : this.userId;
              const checkResponse = await this.$http.users.checkFollow(targetUserId);
              if (checkResponse && checkResponse.success) {
                this.$set(this, 'isFollowing', checkResponse.data.isFollowing);
                this.$set(this, 'isMutualFollowing', checkResponse.data.isMutualFollowing || false);
              }
            } catch (checkError) {
              console.error('调用 checkFollow API 失败:', checkError);
              this.$set(this, 'isFollowing', false);
              this.$set(this, 'isMutualFollowing', false);
            }
          } else {
            this.$set(this, 'isFollowing', false);
            this.$set(this, 'isMutualFollowing', false);
          }
        } else {
          this.userInfo = this.getMockUserData();
          this.userPosts = [];
          this.isCurrentUser = false;
          this.isFollowing = false;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.userInfo = this.getMockUserData();
        this.userPosts = [];
        this.isCurrentUser = false;
        this.isFollowing = false;
      } finally {
        this.isLoading = false;
      }
    },
    
    async followUser() {
      try {
        if (this.isCurrentUser) {
          showNotification('不能关注自己', 'error');
          return;
        }
        const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
        const oldIsFollowing = this.isFollowing;
        const oldIsMutualFollowing = this.isMutualFollowing;
        const oldFollowers = this.userInfo.followers;
        
        this.$set(this, 'isFollowing', true);
        this.$set(this, 'isMutualFollowing', false);
        this.$set(this.userInfo, 'followers', oldFollowers + 1);
        
        const response = await this.$http.users.follow(targetUserId);
        if (response.success) {
          CacheManager.remove(`user_info_${this.userId}`);
          if (response.data) {
            this.$set(this, 'isFollowing', response.data.isFollowing);
            this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
          }
          await this.fetchUserInfo();
          showNotification(response.message || '关注成功', 'success');
        } else {
          this.$set(this, 'isFollowing', oldIsFollowing);
          this.$set(this, 'isMutualFollowing', oldIsMutualFollowing);
          this.$set(this.userInfo, 'followers', oldFollowers);
          showNotification(`关注失败: ${response.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('关注用户失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        showNotification('关注用户失败，请稍后重试', 'error');
      }
    },
    
    goToBlogDetail(blogId) {
      this.$router.push(`/zhihu-detail/${blogId}`);
    },
    
    async unfollowUser() {
      try {
        if (this.isCurrentUser) {
          showNotification('不能取消关注自己', 'error');
          return;
        }
        const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
        const oldIsFollowing = this.isFollowing;
        const oldIsMutualFollowing = this.isMutualFollowing;
        const oldFollowers = this.userInfo.followers;
        
        this.$set(this, 'isFollowing', false);
        this.$set(this, 'isMutualFollowing', false);
        this.$set(this.userInfo, 'followers', Math.max(0, oldFollowers - 1));
        
        const response = await this.$http.users.unfollow(targetUserId);
        if (response.success) {
          CacheManager.remove(`user_info_${this.userId}`);
          if (response.data) {
            this.$set(this, 'isFollowing', response.data.isFollowing);
            this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
          }
          await this.fetchUserInfo();
          showNotification(response.message || '取消关注成功', 'success');
        } else {
          this.$set(this, 'isFollowing', oldIsFollowing);
          this.$set(this, 'isMutualFollowing', oldIsMutualFollowing);
          this.$set(this.userInfo, 'followers', oldFollowers);
          showNotification(`取消关注失败: ${response.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('取消关注失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        showNotification('取消关注失败，请稍后重试', 'error');
      }
    },
    
    async checkFollowStatus() {
      const targetUserId = this.userId === 'current' ? this.userInfo._id : this.userId;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token || !targetUserId) return;
      
      try {
        const response = await this.$http.users.checkFollow(targetUserId);
        if (response && response.success) {
          this.$set(this, 'isFollowing', response.data.isFollowing);
          this.$set(this, 'isMutualFollowing', response.data.isMutualFollowing || false);
        }
      } catch (error) {
        console.error('检查关注状态失败:', error);
      }
    },
    
    showFollowersList() {
      this.socialListType = 'followers';
      this.socialListTitle = `${this.userInfo.username}的粉丝`;
      this.showSocialListModal = true;
      this.fetchSocialList();
    },
    
    showFollowingList() {
      this.socialListType = 'following';
      this.socialListTitle = `${this.userInfo.username}的关注`;
      this.showSocialListModal = true;
      this.fetchSocialList();
    },
    
    closeSocialListModal() {
      this.showSocialListModal = false;
      this.socialList = [];
      this.currentPage = 1;
      this.hasMore = true;
    },
    
    async fetchSocialList() {
      this.socialListLoading = true;
      this.socialListError = null;
      
      try {
        if (!this.userInfo._id) {
          this.userInfo._id = '699c78d38830cdbab2e8a637';
        }
        
        const apiMethod = this.socialListType === 'followers' ? this.$http.users.getFollowers : this.$http.users.getFollowing;
        const response = await apiMethod(this.userInfo._id, {
          page: this.currentPage,
          limit: 10
        });
        
        if (response.success) {
          let users = response.data.map(user => ({
            ...user,
            isFollowing: user.isFollowing || false,
            isMutualFollowing: user.isMutualFollowing || false
          }));
          
          if (this.currentPage === 1) {
            this.socialList = users;
          } else {
            this.socialList = [...this.socialList, ...users];
          }
          this.hasMore = users.length === 10;
        } else {
          this.socialListError = response.message || `获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败`;
        }
      } catch (error) {
        console.error(`获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败:`, error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
          return;
        }
        this.socialListError = `获取${this.socialListType === 'followers' ? '粉丝' : '关注'}列表失败，请稍后重试`;
      } finally {
        this.socialListLoading = false;
      }
    },
    
    loadMore() {
      if (!this.socialListLoading && this.hasMore) {
        this.currentPage += 1;
        this.fetchSocialList();
      }
    },
    
    async toggleFollow(user) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        this.showNotification('请先登录', 'error');
        return;
      }
      
      try {
        const apiMethod = user.isFollowing ? this.$http.users.unfollow : this.$http.users.follow;
        const response = await apiMethod(user._id);
        if (response.success) {
          user.isFollowing = !user.isFollowing;
          user.isMutualFollowing = user.isFollowing;
          
          if (this.socialListType === 'following' && !user.isFollowing) {
            this.userInfo.following -= 1;
          } else if (this.socialListType === 'followers' && user.isFollowing) {
            this.userInfo.followers += 1;
          }
          this.showNotification(user.isFollowing ? '关注成功' : '取消关注成功', 'success');
        } else {
          this.showNotification(`操作失败: ${response.message}`, 'error');
        }
      } catch (error) {
        console.error('操作失败:', error);
        this.showNotification('操作失败，请稍后重试', 'error');
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        }
      }
    },
    
    showNotification(message, type = 'success') {
      this.notification = { show: true, message, type };
      setTimeout(() => { this.notification.show = false; }, 3000);
    },
    
    onAvatarError(event) {
      if (event.target.src.includes('default-avatar.png')) return;
      event.target.src = '/static/images/default-avatar.png';
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  position: relative;
  font-family: var(--font-family);
}

.main-content {
  padding: 20px;
  padding-bottom: 80px;
}

.profile-tab-content {
  min-height: 400px;
}

.error-message {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 15px;
}

.error-message p {
  color: #e74c3c;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
}
</style>
