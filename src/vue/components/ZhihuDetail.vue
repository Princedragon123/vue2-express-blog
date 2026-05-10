<template>
  <div class="zhihu-detail-page">
    <main class="zhihu-main">
      <div class="zhihu-content">
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchBlogDetail">重新加载</button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="blogData && Object.keys(blogData).length > 0" class="article-container">
          <h1 class="article-title">{{ blogData.title }}</h1>

          <ArticleHeader
            :author="blogData.author"
            :avatar-url="getAuthorAvatar(blogData.author)"
            :created-at="blogData.createdAt"
            :views="blogData.views"
            :is-author="isAuthor"
            :is-following="isFollowing"
            :tags="blogData.tags"
            @avatar-error="onAvatarError"
            @toggle-follow="toggleFollow"
            @delete-article="deleteBlog"
          />

          <div
            v-if="blogData.articleType === 'short' && blogData.mediaFiles && blogData.mediaFiles.length > 0"
            class="short-article-carousel"
          >
            <MediaCarousel
              :media-list="blogData.mediaFiles"
              :show-nav="true"
              :show-indicators="true"
              :show-counter="true"
              :autoplay="false"
              :loop="true"
              :touchable="true"
            />
          </div>

          <ArticleContent
            :article-type="blogData.articleType"
            :media-files="blogData.mediaFiles"
            :video-url="blogData.videoUrl"
            :short-content="blogData.shortContent"
            :content="blogData.content"
          />

          <InteractionSection
            :likes="blogData.likes || 0"
            :comments="blogData.comments || 0"
            :bookmarks="blogData.bookmarks || 0"
            :is-liked="blogData.isLiked || false"
            :is-bookmarked="blogData.isBookmarked || false"
            :blog-id="blogData._id"
            @like="likeBlog"
            @bookmark="bookmarkBlog"
            @open-share="openShareModal"
          />

          <CommentSection
            :is-zhihu-style="true"
            :comments="comments"
            :is-loading-comments="isLoadingComments"
            :comment-error="commentError"
            :user="currentUser"
            :comment-text="newComment"
            :article-author-id="blogData?.author?._id"
            @update:commentText="newComment = $event"
            @submit-comment="(commentContent) => submitComment(commentContent)"
            @submit-reply="submitReply"
            @delete-comment="deleteComment"
            @pin-comment="pinComment"
          />
        </div>
      </div>

      <ZhihuSidebar
        :recommended="recommended"
        :related-topics="relatedTopics"
        :author-articles="authorArticles"
      />
    </main>
  </div>
</template>

<script>
import CacheManager from '../utils/cache';
import MediaCarousel from './MediaCarousel.vue';
import CommentSection from './CommentSection.vue';
import InteractionSection from './InteractionSection.vue';
import ZhihuSidebar from './zhihu-detail/ZhihuSidebar.vue';
import ArticleHeader from './zhihu-detail/ArticleHeader.vue';
import ArticleContent from './zhihu-detail/ArticleContent.vue';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';

export default {
  name: 'ZhihuDetail',
  components: {
    MediaCarousel,
    CommentSection,
    InteractionSection,
    ZhihuSidebar,
    ArticleHeader,
    ArticleContent
  },

  data() {
    return {
      blogId: this.$route.params.id || 1,
      blogData: null,
      comments: [],
      newComment: '',
      isLoading: false,
      isLoadingComments: false,
      error: null,
      commentError: null,
      isAuthor: false,
      currentUser: null,
      isFollowing: false,
      recommended: [
        { id: 1, title: '如何提高学习效率？', views: 1234, answers: 45 },
        { id: 2, title: '程序员如何保持技术竞争力？', views: 2345, answers: 67 },
        { id: 3, title: '如何培养良好的阅读习惯？', views: 3456, answers: 89 }
      ],
      relatedTopics: [
        { id: 1, name: '学习方法', followers: 12345, articles: 678 },
        { id: 2, name: '自我提升', followers: 23456, articles: 789 }
      ],
      authorArticles: [
        { id: 1, title: '我的学习心得', likes: 123, views: 4567 },
        { id: 2, title: '如何制定学习计划', likes: 456, views: 7890 }
      ]
    };
  },

  created() {
    this.fetchBlogDetail();
    this.fetchComments();
  },

  watch: {
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.blogId = newId;
          this.fetchBlogDetail();
          this.fetchComments();
        }
      },
      immediate: true
    }
  },

  methods: {
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },

    onAvatarError() {
      // Avatar error handling can be extended if needed
    },

    async fetchBlogDetail() {
      try {
        this.isLoading = true;
        this.error = null;

        const cacheKey = `blog_detail_${this.blogId}`;
        const cachedData = CacheManager.get(cacheKey);

        if (cachedData) {
          this.blogData = cachedData;
          this.currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
          this.isAuthor = this.currentUser && this.currentUser._id === this.blogData.author?._id;
          if (this.currentUser) {
            this.checkLikeAndBookmarkStatus();
          }
        } else {
          const response = await this.$http.blogs.getDetail(this.blogId);
          this.blogData = response.data;
          CacheManager.set(cacheKey, response.data, 3600);
          this.currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
          this.isAuthor = this.currentUser && this.currentUser._id === this.blogData.author?._id;
          if (this.currentUser) {
            this.checkLikeAndBookmarkStatus();
          }
        }

        this.addToHistory();
      } catch (error) {
        console.error('获取博客详情失败:', error);
        this.error = '获取博客详情失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },

    async addToHistory() {
      if (!this.blogData || (!this.blogData._id && !this.blogData.id)) {
        return;
      }

      try {
        const blogId = this.blogData._id || this.blogData.id;
        const response = await this.$http.history.add(blogId);
        if (!response.success) {
          console.error('添加到历史记录失败:', response.message);
        }
      } catch (error) {
        console.error('添加到历史记录失败:', error);
      }
    },

    async submitReply(replyTarget, parentComment = null) {
      try {
        const content = replyTarget.replyText.trim();
        if (!content) {
          return;
        }

        const requestData = {
          content: content
        };

        if (parentComment) {
          requestData.parentId = parentComment._id;
          requestData.replyTo = replyTarget.author?.id || replyTarget.author?._id;
        } else {
          requestData.parentId = replyTarget._id;
        }

        const response = await this.$http.blogs.createComment(this.blogId, requestData);

        replyTarget.replyText = '';
        replyTarget.isReplying = false;

        await this.fetchComments();
      } catch (error) {
        console.error('提交回复失败:', error);
        showNotification('回复失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    async deleteBlog() {
      if (!confirm('确定要删除这篇文章吗？')) return;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          showNotification('请先登录后再删除文章', 'warning');
          return;
        }

        const response = await this.$http.blogs.delete(this.blogId);

        if (response.success) {
          showNotification('文章删除成功', 'success');
          this.$router.push('/');
        } else {
          showNotification('删除失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('删除文章失败:', error);
        showNotification('删除失败，请重试', 'error');
      }
    },

    async deleteComment(commentId) {
      if (!confirm('确定要删除这条评论吗？')) return;

      try {
        const response = await this.$http.blogs.deleteComment(commentId);

        showNotification('评论删除成功', 'success');
        await this.fetchComments();
      } catch (error) {
        console.error('删除评论失败:', error);
        showNotification('删除失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    async pinComment(commentId) {
      try {
        const response = await this.$http.blogs.pinComment(commentId);

        if (response.success) {
          showNotification(response.data.message || '操作成功', 'success');
          await this.fetchComments();
        } else {
          showNotification('操作失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('置顶评论失败:', error);
        showNotification('操作失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    async submitComment(commentContent) {
      if (!commentContent || !commentContent.trim()) {
        showNotification('请输入评论内容', 'warning');
        return;
      }

      if (!this.blogId) {
        showNotification('博客信息有误，请稍后重试', 'error');
        return;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        showNotification('请先登录后再评论', 'warning');
        return;
      }

      try {
        const requestData = {
          content: commentContent.trim()
        };

        const response = await this.$http.blogs.createComment(this.blogId, requestData);

        this.newComment = '';

        await this.fetchComments();
      } catch (error) {
        console.error('提交评论失败:', error);
        showNotification('评论失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    async fetchComments() {
      try {
        this.isLoadingComments = true;
        this.commentError = null;
        const response = await this.$http.blogs.getComments(this.blogId);

        this.comments = response.data.map(comment => {
          comment.isReplying = false;
          comment.replyText = '';

          if (comment.replies) {
            comment.replies = comment.replies.map(reply => {
              reply.isReplying = false;
              reply.replyText = '';
              return reply;
            });
          }

          return comment;
        });
      } catch (error) {
        console.error('获取评论失败:', error);
        this.commentError = '获取评论失败，请稍后重试: ' + (error.message || '未知错误');
        this.comments = [];
      } finally {
        this.isLoadingComments = false;
      }
    },

    openShareModal() {
      if (navigator.share) {
        navigator.share({
          title: this.blogData.title,
          text: this.blogData.shortContent || this.blogData.content.substring(0, 100),
          url: window.location.href
        }).catch(error => {
          console.error('分享失败:', error);
        });
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showNotification('链接已复制到剪贴板', 'success');
        }).catch(error => {
          console.error('复制链接失败:', error);
          showNotification('复制链接失败，请手动复制', 'error');
        });
      }
    },

    async likeBlog(blogId) {
      if (!this.blogData) return;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('请先登录后再点赞', 'warning');
        return;
      }

      try {
        const isCurrentlyLiked = this.blogData.isLiked || false;
        const result = await this.$http.blogs[isCurrentlyLiked ? 'unlike' : 'like'](blogId);

        if (result.success) {
          this.$set(this.blogData, 'likes', result.data.likes);
          this.$set(this.blogData, 'isLiked', !isCurrentlyLiked);
        } else {
          console.error('操作失败:', result.message);
          this.checkLikeAndBookmarkStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        this.checkLikeAndBookmarkStatus();
      }
    },

    async bookmarkBlog(blogId) {
      if (!this.blogData) return;

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('请先登录后再收藏', 'warning');
        return;
      }

      try {
        const isCurrentlyBookmarked = this.blogData.isBookmarked || false;
        const result = await this.$http.blogs[isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'](blogId);

        if (result.success) {
          this.$set(this.blogData, 'bookmarks', result.data.bookmarks);
          this.$set(this.blogData, 'isBookmarked', !isCurrentlyBookmarked);
        } else {
          console.error('操作失败:', result.message);
          this.checkLikeAndBookmarkStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        this.checkLikeAndBookmarkStatus();
      }
    },

    async checkLikeAndBookmarkStatus() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          return;
        }

        const blogDetailResponse = await this.$http.blogs.getDetail(this.blogId);
        if (blogDetailResponse.success) {
          this.$set(this.blogData, 'likes', blogDetailResponse.data.likes);
          this.$set(this.blogData, 'bookmarks', blogDetailResponse.data.bookmarks);
        }

        const likeStatusResponse = await this.$http.blogs.checkLikeStatus(this.blogId);
        if (likeStatusResponse.success) {
          this.$set(this.blogData, 'isLiked', likeStatusResponse.data.isLiked);
        }

        const bookmarkStatusResponse = await this.$http.blogs.checkBookmarkStatus(this.blogId);
        if (bookmarkStatusResponse.success) {
          this.$set(this.blogData, 'isBookmarked', bookmarkStatusResponse.data.isBookmarked);
        }

        if (this.blogData.author && this.blogData.author._id) {
          await this.checkFollowStatus();
        }
      } catch (error) {
        console.error('检查状态失败:', error);
      }
    },

    async checkFollowStatus() {
      const authorId = this.blogData.author?.id || this.blogData.author?._id;
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

    async toggleFollow() {
      const authorId = this.blogData.author?.id || this.blogData.author?._id;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token || !authorId) {
        showNotification('请先登录', 'warning');
        return;
      }

      try {
        const response = this.isFollowing
          ? await this.$http.users.unfollow(authorId)
          : await this.$http.users.follow(authorId);

        if (response && response.success) {
          this.isFollowing = !this.isFollowing;
          showNotification(this.isFollowing ? '关注成功' : '取消关注成功', 'success');
        } else {
          showNotification(response?.message || '操作失败', 'error');
        }
      } catch (error) {
        console.error('关注操作失败:', error);
        showNotification('操作失败，请重试', 'error');
      }
    }
  }
};
</script>

<style scoped>
.zhihu-detail-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.zhihu-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

.zhihu-content {
  flex: 1;
  min-width: 0;
}

.article-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}

.article-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.3;
}

.short-article-carousel {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0084ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

.error-message p {
  color: #d32f2f;
  margin-bottom: 16px;
}

.btn-primary {
  padding: 8px 20px;
  background-color: #0084ff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #0073e6;
}

@media (max-width: 1024px) {
  .zhihu-sidebar {
    display: none;
  }

  .zhihu-main {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .article-container {
    padding: 16px;
  }

  .article-title {
    font-size: 20px;
  }

  .zhihu-sidebar {
    display: none;
  }
}
</style>
