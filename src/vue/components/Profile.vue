<template>
  <article class="profile-page" aria-label="个人资料页">
    <AppNotification
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
    />

    <main class="profile-page__main" role="main">
      <div class="profile-page__container">
        <!-- 错误/加载 -->
        <div v-if="error" class="profile-page__error">
          <p>{{ error }}</p>
          <button class="btn btn--primary" @click="fetchUserInfo">重新加载</button>
        </div>

        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 资料头部 -->
        <header v-else class="profile-page__header">
          <ProfileHeader
            :user-info="userInfo"
            :avatar-url="getAuthorAvatar(userInfo, 100)"
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
            @cover-mouse-move="handleCoverMove"
            @cover-mouse-leave="handleCoverLeave"
            @cover-touch-move="handleCoverTouchMove"
            @cover-touch-end="handleCoverLeave"
            @update:show-confirm-dialog="showConfirmDialog = $event"
          />
        </header>

        <!-- Tab 导航 -->
        <nav v-if="!error && !isLoading" class="profile-page__tabs">
          <ProfileTabs
            v-model="activeTab"
            :is-current-user="isCurrentUser"
          />
        </nav>

        <!-- Tab 内容 -->
        <div v-if="!error && !isLoading" class="profile-page__content">
          <section v-if="activeTab === 'posts'" aria-label="发布内容">
            <ArticleGrid
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
          </section>

          <section v-else-if="activeTab === 'likes'" aria-label="点赞内容">
            <ArticleGrid
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
          </section>

          <section v-else-if="activeTab === 'bookmarks'" aria-label="收藏内容">
            <ArticleGrid
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
          </section>
        </div>
      </div>
    </main>

    <!-- 社交列表弹窗 -->
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
  </article>
</template>

<script>
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
  components: { ProfileHeader, ProfileTabs, ArticleGrid, SocialListModal, AppNotification },

  metaInfo() {
    return {
      title: `${this.userInfo.username || '用户'}的个人资料`,
      meta: [
        { name: 'description', content: this.userInfo.bio || `${this.userInfo.username || '用户'}的个人博客资料页` },
        { name: 'keywords', content: [this.userInfo.username, '个人资料,博客'].filter(Boolean).join(',') }
      ]
    };
  },

  data() {
    return {
      userId: null,
      userInfo: {},
      userPosts: [],
      isLoading: true,
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
      notification: { show: false, message: '', type: 'success' },
      likesPrivacyDenied: false,
      bookmarksPrivacyDenied: false,
      postsPrivacyDenied: false,
      coverMouseX: 0.5,
      coverMouseY: 0.5
    };
  },

  computed: {
    coverStyle() {
      return { '--mouse-x': this.coverMouseX, '--mouse-y': this.coverMouseY };
    },
    coverImageStyle() {
      if (!this.userInfo.coverImage) return {};
      return {
        backgroundImage: `url(${this.userInfo.coverImage})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: 'cover'
      };
    }
  },

  created() {
    this.userId = this.$route.params.userId || 'current';
  },

  mounted() {
    if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; }
    this.fetchUserInfo();
  },

  watch: {
    '$route.params.userId': {
      handler(newUserId) {
        if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; }
        this.userId = newUserId || 'current';
        this.fetchUserInfo();
      },
      immediate: true
    },
    activeTab(newTab) {
      if (newTab === 'settings') this.$router.push('/my-profile');
      else if (newTab === 'likes') this.fetchLikedPosts();
      else if (newTab === 'bookmarks') this.fetchBookmarkedPosts();
    }
  },

  methods: {
    getAuthorAvatar,

    handleCoverMove(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      this.coverMouseX = (e.clientX - rect.left) / rect.width;
      this.coverMouseY = (e.clientY - rect.top) / rect.height;
    },
    handleCoverTouchMove(e) {
      if (e.touches.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      this.coverMouseX = (e.touches[0].clientX - rect.left) / rect.width;
      this.coverMouseY = (e.touches[0].clientY - rect.top) / rect.height;
    },
    handleCoverLeave() {
      this.coverMouseX = 0.5;
      this.coverMouseY = 0.5;
    },

    navigateToCreation() { this.showConfirmDialog = false; this.$router.push('/my-creation'); },

    async fetchLikedPosts() {
      try {
        this.likesPrivacyDenied = false;
        const response = await this.$http.users.getLikedPosts(this.userInfo._id);
        this.likedPosts = response.success
          ? response.data.map(blog => ({ ...blog, author: blog.author?.username || '未知作者', date: blog.date || blog.createdAt }))
          : [];
      } catch (error) {
        this.likesPrivacyDenied = error.response?.status === 403 && !this.isCurrentUser;
        this.likedPosts = [];
      }
    },

    async fetchBookmarkedPosts() {
      try {
        this.bookmarksPrivacyDenied = false;
        const response = await this.$http.users.getBookmarkedPosts(this.userInfo._id);
        this.bookmarkedPosts = response.success
          ? response.data.map(blog => ({ ...blog, author: blog.author?.username || '未知作者', date: blog.date || blog.createdAt }))
          : [];
      } catch (error) {
        this.bookmarksPrivacyDenied = error.response?.status === 403 && !this.isCurrentUser;
        this.bookmarkedPosts = [];
      }
    },

    async fetchUserInfo() {
      if (!this.$store.getters.isLoggedIn) { this.userInfo = {}; this.error = '请先登录'; this.$router.replace('/login'); return; }
      this.isLoading = true;
      this.error = null;
      let currentUserId = '';

      try {
        const meResponse = await this.$http.auth.getCurrentUser();
        currentUserId = meResponse.data?.id || meResponse.data?._id;
        if (!currentUserId) throw new Error('用户ID无效');
      } catch {
        this.$store.dispatch('logout', this.$router);
        return;
      }

      try {
        const targetUserId = this.userId === 'current' ? currentUserId : this.userId;
        const userResponse = await this.$http.users.getInfo(targetUserId);
        if (!userResponse.success) throw new Error(userResponse.message);

        const userData = userResponse.data || {};
        const user = userData.user || userData || {};
        const profile = user.profile || {};

        this.userInfo = {
          _id: user._id || '',
          username: user.username || '',
          avatar: profile.avatar || '',
          coverImage: profile.coverImage || '',
          bio: profile.bio || '',
          location: profile.location || '',
          occupation: profile.occupation || '',
          website: profile.website || '',
          posts: userData.totalPostsCount || (userData.latestBlogs || []).length || 0,
          following: user.followingCount || 0,
          followers: user.followersCount || 0,
          likes: user.stats?.likesCount || 0
        };

        this.userPosts = userData.latestBlogs || [];
        this.isCurrentUser = targetUserId === currentUserId;
        this.postsPrivacyDenied = !this.isCurrentUser && !!userData.postsPrivacyDenied;

        if (!this.isCurrentUser) {
          const checkRes = await this.$http.users.checkFollow(targetUserId);
          this.isFollowing = checkRes.data?.isFollowing || false;
          this.isMutualFollowing = checkRes.data?.isMutualFollowing || false;
        }
      } catch (error) {
        if (error.response?.status === 401) { this.$store.dispatch('logout', this.$router); return; }
        this.error = '获取用户信息失败';
      } finally {
        this.isLoading = false;
      }
    },

    async followUser() {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      if (this.isCurrentUser) return showNotification('不能关注自己', 'error');
      try {
        const res = await this.$http.users.follow(this.userInfo._id);
        if (res.success) { CacheManager.remove(`user_info_${this.userId}`); await this.fetchUserInfo(); showNotification('关注成功', 'success'); }
      } catch (err) {
        if (err.response?.status === 401) this.$store.dispatch('logout', this.$router);
        else showNotification('关注失败', 'error');
      }
    },

    async unfollowUser() {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      if (this.isCurrentUser) return showNotification('不能取消关注自己', 'error');
      try {
        const res = await this.$http.users.unfollow(this.userInfo._id);
        if (res.success) { CacheManager.remove(`user_info_${this.userId}`); await this.fetchUserInfo(); showNotification('取消关注成功', 'success'); }
      } catch (err) {
        if (err.response?.status === 401) this.$store.dispatch('logout', this.$router);
        else showNotification('取消关注失败', 'error');
      }
    },

    goToBlogDetail(blogId) { this.$router.push(`/zhihu-detail/${blogId}`); },

    showFollowersList() { this.socialListType = 'followers'; this.socialListTitle = `${this.userInfo.username}的粉丝`; this.showSocialListModal = true; this.fetchSocialList(); },
    showFollowingList() { this.socialListType = 'following'; this.socialListTitle = `${this.userInfo.username}的关注`; this.showSocialListModal = true; this.fetchSocialList(); },
    closeSocialListModal() { this.showSocialListModal = false; this.socialList = []; this.currentPage = 1; this.hasMore = true; },

    async fetchSocialList() {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      this.socialListLoading = true;
      try {
        const api = this.socialListType === 'followers' ? 'getFollowers' : 'getFollowing';
        const res = await this.$http.users[api](this.userInfo._id, { page: this.currentPage, limit: 10 });
        if (res.success) {
          const users = res.data.map(u => ({ ...u, isFollowing: u.isFollowing || false }));
          this.socialList = this.currentPage === 1 ? users : [...this.socialList, ...users];
          this.hasMore = users.length === 10;
        }
      } catch (err) {
        if (err.response?.status === 401) this.$store.dispatch('logout', this.$router);
        else this.socialListError = '获取列表失败';
      } finally { this.socialListLoading = false; }
    },

    loadMore() { if (!this.socialListLoading && this.hasMore) { this.currentPage++; this.fetchSocialList(); } },

    async toggleFollow(user) {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      try {
        const api = user.isFollowing ? 'unfollow' : 'follow';
        const res = await this.$http.users[api](user._id);
        if (res.success) { user.isFollowing = !user.isFollowing; showNotification(user.isFollowing ? '关注成功' : '取消关注成功'); }
      } catch (err) {
        if (err.response?.status === 401) this.$store.dispatch('logout', this.$router);
      }
    },

    showNotificationLocal(message, type = 'success') {
      this.notification = { show: true, message, type };
      setTimeout(() => (this.notification.show = false), 3000);
    },

    onAvatarError(e) { e.target.src = '/static/images/default-avatar.png'; }
  }
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.profile-page__main {
  padding: 20px 20px 80px;
}

.profile-page__container {
  max-width: 1000px;
  margin: 0 auto;
}

.profile-page__error {
  text-align: center;
  padding: 40px 20px;
  background: #fff;
  border-radius: 16px;
}

.profile-page__error p {
  color: #e74c3c;
  margin-bottom: 16px;
}

.profile-page__header {
  margin-bottom: 16px;
}

/* Tab 导航 - 移动端吸顶 */
.profile-page__tabs {
  position: sticky;
  top: 56px;
  z-index: 50;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  margin-bottom: 16px;
}

.profile-page__content {
  min-height: 400px;
}

@media (max-width: 768px) {
  .profile-page__main {
    padding: 10px 10px 80px;
  }
  .profile-page__tabs {
    top: 56px;
    margin: 0 -10px 16px;
    border-radius: 0;
  }
}
</style>
