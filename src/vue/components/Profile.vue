<template>
  <div class="profile">
    <AppNotification :show="notification.show" :message="notification.message" :type="notification.type" />
    <div class="profile__container">
      <div v-if="error" class="profile__error"><p>{{ error }}</p><button class="btn btn-primary" @click="fetchUserInfo">重新加载</button></div>
      <div v-else-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <template v-else>
        <header class="profile__header">
          <ProfileHeader :user-info="userInfo" :avatar-url="getAuthorAvatar(userInfo, 96)" :is-current-user="isCurrentUser" :is-following="isFollowing" :is-mutual-following="isMutualFollowing" :cover-style="coverStyle" :cover-image-style="coverImageStyle" :show-confirm-dialog="showConfirmDialog" @avatar-error="onAvatarError" @toggle-follow="isFollowing ? unfollowUser() : followUser()" @show-following="showFollowingList" @show-followers="showFollowersList" @navigate-creation="navigateToCreation" @cover-mouse-move="handleCoverMove" @cover-mouse-leave="handleCoverLeave" @cover-touch-move="handleCoverTouch" @cover-touch-end="handleCoverLeave" @update:show-confirm-dialog="showConfirmDialog = $event" />
        </header>
        <nav class="profile__tabs">
          <ProfileTabs v-model="activeTab" :is-current-user="isCurrentUser" />
        </nav>
        <div class="profile__content">
          <ArticleGrid v-if="activeTab === 'posts'" :articles="userPosts" :privacy-denied="postsPrivacyDenied" empty-icon="§" :empty-title="'暂无发布'" :empty-description="isCurrentUser ? '快去发布第一篇攻略' : '暂无内容'" :show-action="isCurrentUser" action-text="写文章" @click-article="goToBlogDetail" @action="$router.push('/create')" />
          <ArticleGrid v-else-if="activeTab === 'likes'" :articles="likedPosts" :privacy-denied="likesPrivacyDenied" :show-author="true" empty-icon="♥" :empty-title="'暂无点赞'" :empty-description="isCurrentUser ? '去发现好内容' : '暂无点赞'" @click-article="goToBlogDetail" @action="$router.push('/blog')" />
          <ArticleGrid v-else-if="activeTab === 'bookmarks'" :articles="bookmarkedPosts" :privacy-denied="bookmarksPrivacyDenied" :show-author="true" empty-icon="◆" :empty-title="'暂无收藏'" :empty-description="isCurrentUser ? '收藏你喜欢的' : '暂无收藏'" @click-article="goToBlogDetail" @action="$router.push('/blog')" />
        </div>
      </template>
    </div>
    <SocialListModal :visible="showSocialListModal" :title="socialListTitle" :list-type="socialListType" :users="socialList" :loading="socialListLoading" :error="socialListError" :has-more="hasMore" :current-user-id="userInfo._id || ''" @close="closeSocialListModal" @retry="fetchSocialList" @toggle-follow="toggleFollow" @load-more="loadMore" />
  </div>
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
  metaInfo() { return { title: `${this.userInfo.username || '用户'}的主页` }; },
  data() { return { userId: null, userInfo: {}, userPosts: [], isLoading: true, error: null, isCurrentUser: true, isFollowing: false, isMutualFollowing: false, showConfirmDialog: false, activeTab: 'posts', likedPosts: [], bookmarkedPosts: [], showSocialListModal: false, socialListType: 'followers', socialListTitle: '', socialList: [], socialListLoading: false, socialListError: null, currentPage: 1, hasMore: true, notification: { show: false, message: '', type: 'success' }, likesPrivacyDenied: false, bookmarksPrivacyDenied: false, postsPrivacyDenied: false, coverMouseX: 0.5, coverMouseY: 0.5 }; },
  computed: { coverStyle() { return { '--mouse-x': this.coverMouseX, '--mouse-y': this.coverMouseY }; }, coverImageStyle() { if (!this.userInfo.coverImage) return {}; return { backgroundImage: `url(${this.userInfo.coverImage})`, backgroundPosition: `calc((var(--mouse-x) - 0.5) * 20% + 50%) calc((var(--mouse-y) - 0.5) * 20% + 50%)`, backgroundSize: 'cover' }; } },
  created() { this.userId = this.$route.params.userId || 'current'; },
  mounted() { if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; } this.fetchUserInfo(); },
  watch: { '$route.params.userId': { handler(id) { if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; } this.userId = id || 'current'; this.fetchUserInfo(); }, immediate: true }, activeTab(t) { if (t === 'settings') this.$router.push('/my-profile'); else if (t === 'likes') this.fetchLikedPosts(); else if (t === 'bookmarks') this.fetchBookmarkedPosts(); } },
  methods: {
    getAuthorAvatar,
    handleCoverMove(e) { const r = e.currentTarget.getBoundingClientRect(); this.coverMouseX = (e.clientX - r.left) / r.width; this.coverMouseY = (e.clientY - r.top) / r.height; },
    handleCoverTouch(e) { if (!e.touches.length) return; const r = e.currentTarget.getBoundingClientRect(); this.coverMouseX = (e.touches[0].clientX - r.left) / r.width; this.coverMouseY = (e.touches[0].clientY - r.top) / r.height; },
    handleCoverLeave() { this.coverMouseX = 0.5; this.coverMouseY = 0.5; },
    navigateToCreation() { this.showConfirmDialog = false; this.$router.push('/my-creation'); },
    async fetchLikedPosts() { try { this.likesPrivacyDenied = false; const r = await this.$http.users.getLikedPosts(this.userInfo._id); this.likedPosts = r.success ? r.data.map(b => ({ ...b, author: b.author?.username || '未知' })) : []; } catch (e) { this.likesPrivacyDenied = e.response?.status === 403 && !this.isCurrentUser; this.likedPosts = []; } },
    async fetchBookmarkedPosts() { try { this.bookmarksPrivacyDenied = false; const r = await this.$http.users.getBookmarkedPosts(this.userInfo._id); this.bookmarkedPosts = r.success ? r.data.map(b => ({ ...b, author: b.author?.username || '未知' })) : []; } catch (e) { this.bookmarksPrivacyDenied = e.response?.status === 403 && !this.isCurrentUser; this.bookmarkedPosts = []; } },
    async fetchUserInfo() {
      if (!this.$store.getters.isLoggedIn) { this.$router.replace('/login'); return; }
      this.isLoading = true; this.error = null;
      let curId = '';
      try { const mr = await this.$http.auth.getCurrentUser(); curId = mr.data?.id || mr.data?._id; if (!curId) throw new Error('无效ID'); } catch { this.$store.dispatch('logout', this.$router); return; }
      try {
        const tid = this.userId === 'current' ? curId : this.userId;
        const r = await this.$http.users.getInfo(tid);
        if (!r.success) throw new Error(r.message);
        const d = r.data || {}; const u = d.user || d || {}; const p = u.profile || {};
        this.userInfo = { _id: u._id || '', username: u.username || '', avatar: p.avatar || '', coverImage: p.coverImage || '', bio: p.bio || '', location: p.location || '', occupation: p.occupation || '', website: p.website || '', posts: d.totalPostsCount || (d.latestBlogs || []).length || 0, following: u.followingCount || 0, followers: u.followersCount || 0, likes: u.stats?.likesCount || 0 };
        this.userPosts = d.latestBlogs || [];
        this.isCurrentUser = tid === curId;
        this.postsPrivacyDenied = !this.isCurrentUser && !!d.postsPrivacyDenied;
        if (!this.isCurrentUser) { const cr = await this.$http.users.checkFollow(tid); this.isFollowing = cr.data?.isFollowing || false; this.isMutualFollowing = cr.data?.isMutualFollowing || false; }
      } catch (e) { if (e.response?.status === 401) { this.$store.dispatch('logout', this.$router); return; } this.error = '获取用户信息失败'; }
      finally { this.isLoading = false; }
    },
    async followUser() { if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router); if (this.isCurrentUser) return showNotification('不能关注自己', 'error'); try { const r = await this.$http.users.follow(this.userInfo._id); if (r.success) { CacheManager.remove(`user_info_${this.userId}`); await this.fetchUserInfo(); showNotification('关注成功', 'success'); } } catch {} },
    async unfollowUser() { if (!this.$store.getters.isLoggedIn) return this.$store.dispatch('logout', this.$router); try { const r = await this.$http.users.unfollow(this.userInfo._id); if (r.success) { CacheManager.remove(`user_info_${this.userId}`); await this.fetchUserInfo(); showNotification('已取消关注', 'success'); } } catch {} },
    goToBlogDetail(id) { this.$router.push(`/zhihu-detail/${id}`); },
    showFollowersList() { this.socialListType = 'followers'; this.socialListTitle = `${this.userInfo.username}的粉丝`; this.showSocialListModal = true; this.fetchSocialList(); },
    showFollowingList() { this.socialListType = 'following'; this.socialListTitle = `${this.userInfo.username}的关注`; this.showSocialListModal = true; this.fetchSocialList(); },
    closeSocialListModal() { this.showSocialListModal = false; this.socialList = []; this.currentPage = 1; this.hasMore = true; },
    async fetchSocialList() { this.socialListLoading = true; try { const api = this.socialListType === 'followers' ? 'getFollowers' : 'getFollowing'; const r = await this.$http.users[api](this.userInfo._id, { page: this.currentPage, limit: 10 }); if (r.success) { const users = r.data.map(u => ({ ...u, isFollowing: u.isFollowing || false })); this.socialList = this.currentPage === 1 ? users : [...this.socialList, ...users]; this.hasMore = users.length === 10; } } catch { this.socialListError = '获取列表失败'; } finally { this.socialListLoading = false; } },
    loadMore() { if (!this.socialListLoading && this.hasMore) { this.currentPage++; this.fetchSocialList(); } },
    async toggleFollow(user) { try { const api = user.isFollowing ? 'unfollow' : 'follow'; const r = await this.$http.users[api](user._id); if (r.success) { user.isFollowing = !user.isFollowing; } } catch {} },
    showNotificationLocal(m, t = 'success') { this.notification = { show: true, message: m, type: t }; setTimeout(() => (this.notification.show = false), 3000); },
    onAvatarError(e) { e.target.src = '/static/images/default-avatar.png'; }
  }
};
</script>

<style scoped>
.profile { min-height: 100vh; background: #faf8f5; }
.profile__container { max-width: 1000px; margin: 0 auto; padding: 20px 20px 80px; }
.profile__error { text-align: center; padding: 40px; background: #fff; border-radius: 16px; }
.profile__error p { color: #6b7280; margin-bottom: 16px; }
.profile__header { margin-bottom: 20px; }
.profile__tabs { position: sticky; top: 56px; z-index: 40; background: rgba(250,248,245,0.9); backdrop-filter: blur(8px); margin-bottom: 20px; padding: 12px 0; }
@media (max-width: 768px) { .profile__container { padding: 12px 12px 80px; } }
</style>
