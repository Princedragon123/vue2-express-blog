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
          @cover-mouse-move="handleCoverMouseMove"
          @cover-mouse-leave="handleCoverMouseLeave"
          @update:show-confirm-dialog="showConfirmDialog = $event"
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
            :empty-description="
              isCurrentUser
                ? '快去发布你的第一篇攻略吧'
                : '该用户还没有发布任何攻略'
            "
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
            :empty-description="
              isCurrentUser
                ? '快去点赞你喜欢的攻略吧'
                : '该用户还没有点赞任何攻略'
            "
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
            :empty-description="
              isCurrentUser
                ? '快去收藏你喜欢的攻略吧'
                : '该用户还没有收藏任何攻略'
            "
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
import MobileBottomNav from "./MobileBottomNav.vue";
import CacheManager from "../utils/cache";
import { getAuthorAvatar } from "../utils/avatarUtils";
import { showNotification } from "../utils/notification";
import ProfileHeader from "./profile/ProfileHeader.vue";
import ProfileTabs from "./profile/ProfileTabs.vue";
import ArticleGrid from "./profile/ArticleGrid.vue";
import SocialListModal from "./profile/SocialListModal.vue";
import AppNotification from "./profile/AppNotification.vue";

export default {
  name: "Profile",
  components: {
    MobileBottomNav,
    ProfileHeader,
    ProfileTabs,
    ArticleGrid,
    SocialListModal,
    AppNotification,
  },

  metaInfo() {
    return {
      title: `${this.userInfo.username || "用户"}的个人资料`,
      meta: [
        {
          name: "description",
          content:
            this.userInfo.bio ||
            `${this.userInfo.username || "用户"}的个人博客资料页`,
        },
        {
          name: "keywords",
          content: `${this.userInfo.username || "用户"},个人资料,博客`,
        },
      ],
    };
  },

  data() {
    return {
      userId: null,
      userInfo: {},
      userPosts: [],
      // 修复点2：isLoading 初始值改为 true，先显示加载状态
      isLoading: true,
      error: null,
      isCurrentUser: true,
      isFollowing: false,
      isMutualFollowing: false,
      showConfirmDialog: false,
      activeTab: "posts",
      likedPosts: [],
      bookmarkedPosts: [],
      showSocialListModal: false,
      socialListType: "followers",
      socialListTitle: "",
      socialList: [],
      socialListLoading: false,
      socialListError: null,
      currentPage: 1,
      hasMore: true,
      notification: {
        show: false,
        message: "",
        type: "success",
      },
      likesPrivacyDenied: false,
      bookmarksPrivacyDenied: false,
      postsPrivacyDenied: false,
      coverMouseX: 0.5,
      coverMouseY: 0.5,
    };
  },

  computed: {
    coverStyle() {
      return {
        "--mouse-x": this.coverMouseX,
        "--mouse-y": this.coverMouseY,
      };
    },
    coverImageStyle() {
      // 无数据时不显示背景图
      if (!this.userInfo.coverImage) return {};
      return {
        backgroundImage: `url(${this.userInfo.coverImage})`,
        backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`,
        backgroundSize: "cover",
      };
    },
  },

  created() {
    this.userId = this.$route.params.userId || "current";
  },

  mounted() {
    // 强制登录校验：未登录直接跳转
    if (!this.$store.getters.isLoggedIn) {
      this.$router.replace("/login");
      return;
    }
    this.fetchUserInfo();
  },

  watch: {
    "$route.params.userId": {
      handler(newUserId) {
        if (!this.$store.getters.isLoggedIn) {
          this.$router.replace("/login");
          return;
        }
        this.userId = newUserId || "current";
        this.fetchUserInfo();
      },
      immediate: true,
    },
    activeTab(newTab) {
      if (newTab === "settings") {
        this.$router.push("/my-profile");
      }
      // 切换到点赞
      else if (newTab === "likes") {
        this.fetchLikedPosts();
      }
      // 切换到收藏
      else if (newTab === "bookmarks") {
        this.fetchBookmarkedPosts();
      }
    },
  },

  methods: {
    getAuthorAvatar,
    handleCoverMouseMove(e) {
      const cover = e.currentTarget;
      const rect = cover.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.coverMouseX = x;
      this.coverMouseY = y;
    },
    handleCoverMouseLeave() {
      this.coverMouseX = 0.5;
      this.coverMouseY = 0.5;
    },
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? "" : date.toLocaleString();
    },
    confirmCreate() {
      this.showConfirmDialog = true;
    },
    navigateToCreation() {
      this.showConfirmDialog = false;
      this.$router.push("/my-creation");
    },
    async fetchLikedPosts() {
      try {
        this.likesPrivacyDenied = false;
        const response = await this.$http.users.getLikedPosts(
          this.userInfo._id,
        );
        this.likedPosts = response.success
          ? response.data.map((blog) => ({
              ...blog,
              author: blog.author?.username || "未知作者",
              date: blog.date || blog.createdAt,
            }))
          : [];
      } catch (error) {
        console.error("获取点赞文章失败:", error);
        this.likesPrivacyDenied =
          error.response?.status === 403 && !this.isCurrentUser;
        this.likedPosts = [];
      }
    },
    async fetchBookmarkedPosts() {
      try {
        this.bookmarksPrivacyDenied = false;
        const response = await this.$http.users.getBookmarkedPosts(
          this.userInfo._id,
        );
        this.bookmarkedPosts = response.success
          ? response.data.map((blog) => ({
              ...blog,
              author: blog.author?.username || "未知作者",
              date: blog.date || blog.createdAt,
            }))
          : [];
      } catch (error) {
        console.error("获取收藏文章失败:", error);
        this.bookmarksPrivacyDenied =
          error.response?.status === 403 && !this.isCurrentUser;
        this.bookmarkedPosts = [];
      }
    },
    // 获取Token（统一用auth模块）
    getAuthToken() {
      return this.$store.getters.getToken;
    },

    async fetchUserInfo() {
      if (!this.$store.getters.isLoggedIn) {
        this.userInfo = {};
        this.error = "请先登录";
        this.$router.replace("/login");
        return;
      }

      this.isLoading = true;
      this.error = null;
      let currentUserId = "";

      try {
        // 获取当前登录用户ID
        const meResponse = await this.$http.auth.getCurrentUser();
        currentUserId = meResponse.data?.id || meResponse.data?._id;
        if (!currentUserId) throw new Error("用户ID无效");
      } catch (error) {
        console.error("获取用户信息失败:", error);
        // Token失效 → 登出并跳转
        this.$store.dispatch('logout', this.$router);
        return;
      }

      try {
        const targetUserId =
          this.userId === "current" ? currentUserId : this.userId;
        const userResponse = await this.$http.users.getInfo(targetUserId);
        if (!userResponse.success) throw new Error(userResponse.message);

        const userData = userResponse.data || {};
        const user = userData.user || userData || {};
        const profile = user.profile || {};
        const latestBlogs = userData.latestBlogs || [];
        const totalPostsCount = userData.totalPostsCount || 0;

        this.userInfo = {
          _id: user._id || "",
          username: user.username || "",
          avatar: profile.avatar || "",
          coverImage: profile.coverImage || "",
          bio: profile.bio || "",
          location: profile.location || "",
          occupation: profile.occupation || "",
          website: profile.website || "",
          posts: totalPostsCount || latestBlogs.length || 0,
          following: user.followingCount || 0,
          followers: user.followersCount || 0,
          likes: user.stats?.likesCount || 0,
        };

        this.userPosts = latestBlogs || [];
        this.isCurrentUser = targetUserId === currentUserId;
        this.postsPrivacyDenied =
          !this.isCurrentUser && !!userData.postsPrivacyDenied;

        if (!this.isCurrentUser) {
          const checkRes = await this.$http.users.checkFollow(targetUserId);
          this.isFollowing = checkRes.data?.isFollowing || false;
          this.isMutualFollowing = checkRes.data?.isMutualFollowing || false;
        }
      } catch (error) {
        console.error("获取用户详情失败:", error);
        if (error.response?.status === 401) {
          this.$store.dispatch('logout', this.$router);
          return;
        }
        this.error = "获取用户信息失败";
      } finally {
        this.isLoading = false;
      }
    },

    async followUser() {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      try {
        if (this.isCurrentUser)
          return showNotification("不能关注自己", "error");
        const res = await this.$http.users.follow(this.userInfo._id);
        if (res.success) {
          CacheManager.remove(`user_info_${this.userId}`);
          await this.fetchUserInfo();
          showNotification("关注成功", "success");
        }
      } catch (err) {
        err.response?.status === 401 && this.$store.dispatch('logout', this.$router);
        showNotification("关注失败", "error");
      }
    },
    async unfollowUser() {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      try {
        if (this.isCurrentUser)
          return showNotification("不能取消关注自己", "error");
        const res = await this.$http.users.unfollow(this.userInfo._id);
        if (res.success) {
          CacheManager.remove(`user_info_${this.userId}`);
          await this.fetchUserInfo();
          showNotification("取消关注成功", "success");
        }
      } catch (err) {
        err.response?.status === 401 && this.$store.dispatch('logout', this.$router);
        showNotification("取消关注失败", "error");
      }
    },

    goToBlogDetail(blogId) {
      this.$router.push(`/zhihu-detail/${blogId}`);
    },
    showFollowersList() {
      this.socialListType = "followers";
      this.socialListTitle = `${this.userInfo.username}的粉丝`;
      this.showSocialListModal = true;
      this.fetchSocialList();
    },
    showFollowingList() {
      this.socialListType = "following";
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
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      this.socialListLoading = true;
      try {
        const api =
          this.socialListType === "followers" ? "getFollowers" : "getFollowing";
        const res = await this.$http.users[api](this.userInfo._id, {
          page: this.currentPage,
          limit: 10,
        });

        if (res.success) {
          const users = res.data.map((u) => ({
            ...u,
            isFollowing: u.isFollowing || false,
          }));
          this.socialList =
            this.currentPage === 1 ? users : [...this.socialList, ...users];
          this.hasMore = users.length === 10;
        }
      } catch (err) {
        err.response?.status === 401 && this.$store.dispatch('logout', this.$router);
        this.socialListError = "获取列表失败";
      } finally {
        this.socialListLoading = false;
      }
    },
    loadMore() {
      if (!this.socialListLoading && this.hasMore) {
        this.currentPage++;
        this.fetchSocialList();
      }
    },
    async toggleFollow(user) {
      if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router);
      try {
        const api = user.isFollowing ? "unfollow" : "follow";
        const res = await this.$http.users[api](user._id);
        if (res.success) {
          user.isFollowing = !user.isFollowing;
          user.isMutualFollowing = user.isFollowing;
          showNotification(user.isFollowing ? "关注成功" : "取消关注成功");
        }
      } catch (err) {
        err.response?.status === 401 && this.$store.dispatch('logout', this.$router);
        showNotification("操作失败");
      }
    },
    showNotification(message, type = "success") {
      this.notification = { show: true, message, type };
      setTimeout(() => (this.notification.show = false), 3000);
    },
    onAvatarError(e) {
      e.target.src = "/static/images/default-avatar.png";
    },
  },
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--background-light) 0%,
    var(--background-dark) 100%
  );
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
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
