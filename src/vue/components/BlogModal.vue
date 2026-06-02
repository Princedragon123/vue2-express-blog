<template>
  <div class="modal-overlay" @click="closeModal" v-if="visible">
    <div class="modal-container" :class="{ 'mobile-modal': isMobile, 'short-article': blog?.articleType === 'short' }" @click.stop>
      <button class="close-btn" @click="closeModal" :aria-label="'关闭' + (blog?.title || '文章')" tabindex="0">
        <span class="nav-icon">✕</span>
      </button>

      <div class="notification" :class="[notification.type, { 'show': notification.show }]">
        <span class="nav-icon">{{ notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️' }}</span>
        <span>{{ notification.message }}</span>
      </div>

      <LongArticleView
        v-if="!blog?.articleType || blog?.articleType === 'long'"
        :blog="blog"
        :blog-id="blogId"
        :current-user-id="user ? (user.id || user._id) : ''"
        :is-following="isFollowing"
        :is-bookmarked="isBookmarked"
        :comments="comments"
        :is-loading-comments="isLoadingComments"
        :comment-error="commentError"
        :user="user"
        :comment-text="commentText"
        @open-profile="openUserProfile"
        @toggle-follow="toggleFollow"
        @filter-by-tag="$emit('filter-by-tag', $event)"
        @like="likeBlog"
        @bookmark="bookmarkBlog"
        @open-share="openShareModal"
        @submit-comment="submitComment"
        @submit-reply="submitReply"
        @delete-comment="deleteComment"
      />

      <ShortArticleView
        v-else-if="blog?.articleType === 'short'"
        :blog="blog"
        :blog-id="blogId"
        :current-user-id="user ? (user.id || user._id) : ''"
        :is-following="isFollowing"
        :is-bookmarked="isBookmarked"
        :comments="comments"
        :is-loading-comments="isLoadingComments"
        :comment-error="commentError"
        :user="user"
        :comment-text="commentText"
        @open-profile="openUserProfile"
        @toggle-follow="toggleFollow"
        @filter-by-tag="$emit('filter-by-tag', $event)"
        @like="likeBlog"
        @bookmark="bookmarkBlog"
        @open-share="openShareModal"
        @update:commentText="commentText = $event"
        @submit-comment="submitComment"
        @submit-reply="submitReply"
        @delete-comment="deleteComment"
      />
    </div>

    <ShareModal
      :visible="showShareModal"
      :blog-id="blog ? (blog._id || blog.id) : ''"
      :blog-title="blog?.title || ''"
      :blog-author="blog?.author?.username || '未知作者'"
      :blog-image="blog?.image || ''"
      @close="closeShareModal"
      @share-success="showNotification"
      @share-error="(msg) => showNotification(msg, 'error')"
    />
  </div>
</template>

<script>
import ShareModal from './blog-modal/ShareModal.vue';
import LongArticleView from './blog-modal/LongArticleView.vue';
import ShortArticleView from './blog-modal/ShortArticleView.vue';

export default {
  name: 'BlogModal',

  components: {
    ShareModal,
    LongArticleView,
    ShortArticleView
  },

  emits: ['close', 'filter-by-tag'],

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    blog: {
      type: Object,
      default: null
    },
    isMobile: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      showShareModal: false,
      user: null,
      isFollowing: false,
      isBookmarked: false,
      commentText: '',
      comments: [],
      isLoadingComments: false,
      commentError: null,
      replyingTo: null,
      replyText: '',
      notification: {
        show: false,
        message: '',
        type: 'success'
      }
    };
  },

  computed: {
    blogId() {
      return this.blog?.id || this.blog?._id || '';
    }
  },

  methods: {
    closeModal() {
      this.$emit('close');
    },

    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    },

    openUserProfile(userId, username) {
      if (userId) {
        window.open(`/profile/${userId}`, '_blank', 'noopener,noreferrer');
      }
    },

    async initUserInfo() {
      if (this.$store.getters.isLoggedIn) {
        try {
          const response = await this.$http.auth.getCurrentUser();
          if (response.success && response.data) {
            this.user = response.data;
            await this.checkFollowStatus();
            await this.checkBookmarkStatus();
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      }
      return Promise.resolve();
    },

    async checkFollowStatus() {
      const authorId = this.blog?.author?.id || this.blog?.author?._id;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !authorId) return;

      try {
        const response = await this.$http.users.checkFollow(authorId);
        if (response && response.success) {
          this.isFollowing = response.data.isFollowing;
        }
      } catch (error) {
        console.error('检查关注状态失败:', error);
      }
    },

    async checkBookmarkStatus() {
      const blogId = this.blog?.id || this.blog?._id;

      if (!this.$store.getters.isLoggedIn || !blogId) return;

      try {
        const response = await this.$http.blogs.checkBookmarkStatus(blogId);
        if (response.success) {
          this.isBookmarked = response.data.isBookmarked;
          if (this.blog) {
            this.$set(this.blog, 'isBookmarked', response.data.isBookmarked);
          }
        }
      } catch (error) {
        console.error('检查收藏状态失败:', error);
      }
    },

    async toggleFollow() {
      const authorId = this.blog?.author?.id || this.blog?.author?._id;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !authorId) {
        this.showNotification('请先登录', 'error');
        return;
      }

      try {
        const response = this.isFollowing
          ? await this.$http.users.unfollow(authorId)
          : await this.$http.users.follow(authorId);

        if (response && response.success) {
          this.isFollowing = !this.isFollowing;
          this.showNotification(this.isFollowing ? '关注成功' : '取消关注成功', 'success');
        } else {
          this.showNotification(response?.message || '操作失败', 'error');
        }
      } catch (error) {
        console.error('关注操作失败:', error);
        this.showNotification('操作失败，请重试', 'error');
      }
    },

    async bookmarkBlog(blogId) {
      const id = blogId || this.blog?._id || this.blog?.id;

      if (!this.$store.getters.isLoggedIn || !id) {
        this.showNotification('请先登录', 'error');
        return;
      }

      try {
        const isCurrentlyBookmarked = this.isBookmarked || this.blog?.isBookmarked || false;
        const result = await this.$http.blogs[isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'](id);

        if (result.success) {
          this.isBookmarked = !isCurrentlyBookmarked;
          this.$set(this.blog, 'isBookmarked', this.isBookmarked);
          this.$set(this.blog, 'bookmarks', result.data.bookmarks);
          this.showNotification(this.isBookmarked ? '收藏成功' : '取消收藏成功', 'success');
        } else {
          this.showNotification(result.message || '操作失败', 'error');
          await this.checkBookmarkStatus();
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        this.showNotification('操作失败，请重试', 'error');
        await this.checkBookmarkStatus();
      }
    },

    showNotification(message, type = 'success') {
      this.notification = {
        show: true,
        message: message,
        type: type
      };

      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    },

    openShareModal() {
      this.showShareModal = true;
    },

    closeShareModal() {
      this.showShareModal = false;
    },

    async loadComments() {
      const blogId = this.blog?.id || this.blog?._id;
      if (!blogId) return;

      this.isLoadingComments = true;
      this.commentError = null;

      try {
        const response = await this.$http.blogs.getComments(blogId);

        if (response.success) {
          this.comments = (response.data || []).map(comment => {
            if (comment.replies) {
              comment.replies = comment.replies.map(reply => ({
                ...reply,
                isReplying: false,
                replyText: ''
              }));
            }
            return {
              ...comment,
              isReplying: false,
              replyText: ''
            };
          });
        } else {
          this.comments = [];
        }
      } catch (error) {
        console.error('加载评论失败:', error);
        this.comments = [];
      } finally {
        this.isLoadingComments = false;
      }
    },

    async submitComment(commentContent) {
      if (!commentContent || !commentContent.trim()) {
        this.showNotification('请输入评论内容', 'warning');
        return;
      }

      const blogId = this.blog?.id || this.blog?._id;
      if (!blogId) {
        this.showNotification('博客信息有误，请稍后重试', 'error');
        return;
      }

      if (!this.$store.getters.isLoggedIn) {
        this.showNotification('请先登录后再评论', 'warning');
        return;
      }

      try {
        const response = await this.$http.blogs.createComment(blogId, {
          content: commentContent.trim()
        });

        if (response.success) {
          this.commentText = '';
          await this.loadComments();
        } else {
          this.showNotification('评论失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        this.showNotification('评论失败，请重试', 'error');
      }
    },

    async submitReply(comment, parentComment = null) {
      if (!comment.replyText || !comment.replyText.trim()) {
        this.showNotification('请输入回复内容', 'warning');
        return;
      }

      const blogId = this.blog?.id || this.blog?._id;
      if (!blogId) {
        this.showNotification('博客信息有误，请稍后重试', 'error');
        return;
      }

      if (!this.$store.getters.isLoggedIn) {
        this.showNotification('请先登录后再回复', 'warning');
        return;
      }

      try {
        const requestData = {
          content: comment.replyText.trim()
        };

        if (parentComment) {
          requestData.parentId = parentComment._id.toString();
          requestData.replyTo = comment.author?.id || comment.author?._id;
        } else {
          requestData.parentId = comment._id.toString();
        }

        const response = await this.$http.blogs.createComment(blogId, requestData);

        if (response.success) {
          comment.replyText = '';
          comment.isReplying = false;
          await this.loadComments();
        } else {
          this.showNotification('回复失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('提交回复失败:', error);
        this.showNotification('回复失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    async checkLikeStatus() {
      if (!this.blog || !this.$store.getters.isLoggedIn) return;

      const id = this.blog._id || this.blog.id;
      if (!id) return;

      try {
        const response = await this.$http.blogs.checkLikeStatus(id);
        if (response.success) {
          this.$set(this.blog, 'isLiked', response.data.isLiked);
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error);
        this.$set(this.blog, 'isLiked', false);
      }
    },

    async likeBlog(blogId) {
      if (!this.blog) return;

      const id = blogId || this.blog._id || this.blog.id;
      if (!id) return;

      try {
        const isCurrentlyLiked = this.blog.isLiked || false;
        const result = await this.$http.blogs[isCurrentlyLiked ? 'unlike' : 'like'](id);

        if (result.success) {
          this.$set(this.blog, 'likes', result.data.likes);
          this.$set(this.blog, 'isLiked', !isCurrentlyLiked);
        } else {
          console.error('操作失败:', result.message);
          this.checkLikeStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        this.checkLikeStatus();
      }
    },

    async addToHistory() {
      if (!this.blog || (!this.blog._id && !this.blog.id)) {
        return;
      }

      try {
        const blogId = this.blog._id || this.blog.id;
        const response = await this.$http.history.add(blogId);
        if (!response.success) {
          console.error('添加到历史记录失败:', response.message);
        }
      } catch (error) {
        console.error('添加到历史记录失败:', error);
      }
    },

    async deleteComment(commentId) {
      if (!commentId) return;

      if (!confirm('确定要删除这条评论吗？')) {
        return;
      }

      try {
        const response = await this.$http.blogs.deleteComment(commentId);

        if (response.success) {
          this.showNotification('删除成功', 'success');
          await this.loadComments();
        } else {
          this.showNotification(response.message || '删除失败', 'error');
        }
      } catch (error) {
        console.error('删除评论失败:', error);
        this.showNotification('删除失败，请重试', 'error');
      }
    }
  },

  watch: {
    blog: {
      handler(newBlog) {
        if (newBlog) {
          if (this.user) {
            this.checkFollowStatus();
            this.checkLikeStatus();
            this.checkBookmarkStatus();
          }
          this.loadComments();
          this.addToHistory();
        }
      },
      deep: true
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
    this.initUserInfo().then(() => {
      this.checkLikeStatus();
    });
    this.loadComments();
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.notification {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1001;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
}

.notification.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.notification.success {
  background-color: rgba(16, 185, 129, 0.9);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.notification.error {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.notification.info {
  background-color: rgba(59, 130, 246, 0.9);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background-color: #ffffff;
  border-radius: 20px;
  width: 95%;
  max-width: 95vw;
  max-height: 95vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  padding: 30px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
}

.modal-container::-webkit-scrollbar {
  display: none;
}

.modal-container.short-article {
  max-width: 1100px;
  max-height: 95vh;
  padding: 30px;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.mobile-modal {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mobile-modal::-webkit-scrollbar {
  display: none;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 18px;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background-color: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.close-btn:active {
  transform: scale(0.95);
}

.mobile-modal .close-btn {
  top: 15px;
  left: 15px;
  right: auto;
}

@media (max-width: 768px) {
  .modal-container {
    width: 100% !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
  .close-btn {
    top: 15px;
    left: 15px;
    right: auto;
  }
}

@media (min-width: 769px) {
  .modal-container {
    max-width: 900px;
    max-height: 90vh;
    border-radius: 20px;
  }
  .close-btn {
    top: 20px;
    right: 20px;
    left: auto;
  }
}
</style>
