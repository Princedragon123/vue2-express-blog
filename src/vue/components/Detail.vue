<!-- Detail.vue - 博客详情页组件 -->
<template>
  <div class="detail-page">
    <main class="main-content">
      <div class="container">
        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchBlogDetail">重新加载</button>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="blogData && Object.keys(blogData).length > 0">
          <DetailHeader
            :category="blogData.category.name || blogData.category"
            :topic="blogData.topic"
            :title="blogData.title"
            :author="blogData.author"
            :author-avatar="getAuthorAvatar(blogData.author, 50)"
            :post-date="blogData.date"
            @go-to-topic="goToTopicDetail"
            @follow="followAuthor"
          />

          <DetailContent
            :image="blogData.image"
            :title="blogData.title"
            :content="blogData.content"
          />

          <InteractionBar
            :likes="blogData.likes"
            :comments="blogData.comments"
            :bookmarks="blogData.bookmarks"
            :is-bookmarked="isBookmarked"
            :show-share-menu="showShareMenu"
            @like="likeBlog"
            @toggle-bookmark="isBookmarked ? unbookmarkBlog() : bookmarkBlog()"
            @toggle-share="toggleShareMenu"
            @close-share="closeShareMenu"
            @share="handleShare"
          />

          <DetailCommentSection
            :comments="comments"
            :total-comments="blogData.comments"
            :is-loading="isLoading"
            :comment-input="commentInput"
            :reply-input="replyInput"
            :replying-to="replyingTo"
            user-avatar="https://via.placeholder.com/40"
            @update:commentInput="commentInput = $event"
            @update:replyInput="replyInput = $event"
            @submit-comment="submitComment"
            @toggle-reply="toggleReply"
            @submit-reply="submitReply"
            @cancel-reply="cancelReply"
          />

          <RelatedArticles
            :articles="relatedBlogs"
            @click="goToBlogDetail"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import CacheManager from '../utils/cache';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';
import InteractionBar from './detail/InteractionBar.vue';
import DetailCommentSection from './detail/DetailCommentSection.vue';
import RelatedArticles from './detail/RelatedArticles.vue';
import DetailHeader from './detail/DetailHeader.vue';
import DetailContent from './detail/DetailContent.vue';

export default {
  name: 'Detail',
  components: {
    InteractionBar,
    DetailCommentSection,
    RelatedArticles,
    DetailHeader,
    DetailContent
  },
  
  metaInfo() {
    return {
      title: this.blogData.title || '博客详情',
      meta: [
        { name: 'description', content: this.blogData.content ? this.blogData.content.substring(0, 100) + '...' : '查看博客详情' },
        { name: 'keywords', content: `${this.blogData.title || '博客'},${this.blogData.category || ''},${this.blogData.author || ''}` }
      ]
    };
  },
  
  data() {
    return {
      blogId: this.$route.params.id || 1,
      
      blogData: {
        id: 1,
        title: '2024最新游戏攻略：如何快速提升等级',
        category: '游戏攻略',
        author: '游戏达人',
        authorAvatar: 'https://via.placeholder.com/40',
        date: '2024-01-07',
        image: 'https://via.placeholder.com/800x400',
        content: '这是一篇详细的游戏攻略...',
        likes: 123,
        comments: 45,
        bookmarks: 67,
        views: 0
      },
      
      comments: [],
      commentInput: '',
      replyInput: '',
      replyingTo: null,
      
      isLoading: false,
      error: null,
      
      isBookmarked: false,
      isLiked: false,
      hasViewed: false,
      
      showShareMenu: false,
      
      relatedBlogs: [
        { id: 2, title: '新手必看：游戏基础操作指南', image: '...', author: '游戏导师', likes: 234 },
        { id: 3, title: '高级玩家技巧：如何在游戏中脱颖而出', image: '...', author: '游戏大师', likes: 345 },
        { id: 4, title: '游戏装备推荐：性价比最高的装备组合', image: '...', author: '装备专家', likes: 456 }
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
    
    async fetchBlogDetail() {
      try {
        this.isLoading = true;
        this.error = null;
        
        const cacheKey = `blog_detail_${this.blogId}`;
        const cachedData = CacheManager.get(cacheKey);
        
        if (cachedData) {
          this.blogData = cachedData;
        } else {
          const response = await this.$http.get(`/api/blogs/${this.blogId}`);
          if (response.success) {
            this.blogData = response.data;
            CacheManager.set(cacheKey, response.data, 3600);
          } else {
            this.error = response.message || '获取博客详情失败';
          }
        }
        
        await this.checkLikeStatus();
        this.addToHistory();
      } catch (error) {
        console.error('获取博客详情失败:', error);
        this.error = '获取博客详情失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },
    
    async checkLikeStatus() {
      try {
        if (!this.$store.getters.isLoggedIn) {
          this.isLiked = false;
          return;
        }
        
        const response = await this.$http.get(`/api/blogs/${this.blogId}/is-liked`);
        
        if (response.success) {
          this.isLiked = response.data.isLiked;
        }
      } catch (error) {
        console.error('检查点赞状态失败:', error);
      }
    },
    
    async addToHistory() {
      if (!this.blogData || (!this.blogData._id && !this.blogData.id)) {
        return;
      }
      
      try {
        const blogId = this.blogData._id || this.blogData.id;
        const result = await this.$http.history.add(blogId);
      } catch (error) {
        console.error('添加到历史记录失败:', error);
      }
    },
    
    async fetchComments() {
      try {
        this.isLoading = true;
        
        const cacheKey = `blog_comments_${this.blogId}`;
        const cachedData = CacheManager.get(cacheKey);
        
        if (cachedData) {
          this.comments = cachedData;
        } else {
          const result = await this.$http.comments.getList(this.blogId);
          this.comments = result.data;
          CacheManager.set(cacheKey, result.data, 300);
        }
      } catch (error) {
        console.error('获取评论列表失败:', error);
        this.error = '获取评论列表失败';
      } finally {
        this.isLoading = false;
      }
    },
    
    async submitComment() {
      if (!this.commentInput.trim()) return;
      
      try {
        const result = await this.$http.comments.create({
          blogId: this.blogId,
          content: this.commentInput
        });
        
        this.comments.unshift(result.data);
        this.blogData.comments += 1;
        this.commentInput = '';
      } catch (error) {
        console.error('提交评论失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        } else {
          showNotification('提交评论失败，请重试', 'error');
        }
      }
    },
    
    toggleReply(commentId) {
      this.replyingTo = this.replyingTo === commentId ? null : commentId;
      this.replyInput = '';
    },
    
    cancelReply() {
      this.replyingTo = null;
      this.replyInput = '';
    },
    
    async submitReply(commentId) {
      if (!this.replyInput.trim()) return;
      
      try {
        const result = await this.$http.comments.reply({
          commentId,
          content: this.replyInput
        });
        
        const commentIndex = this.comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          if (!this.comments[commentIndex].replies) {
            this.comments[commentIndex].replies = [];
          }
          this.comments[commentIndex].replies.push(result.data);
        }
        
        this.replyingTo = null;
        this.replyInput = '';
      } catch (error) {
        console.error('提交回复失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        } else {
          showNotification('提交回复失败，请重试', 'error');
        }
      }
    },
    
    async likeBlog() {
      try {
        if (this.isLiked) {
          const result = await this.$http.blogs.unlike(this.blogId);
          if (result.success) {
            this.blogData.likes -= 1;
            this.isLiked = false;
          }
        } else {
          const result = await this.$http.blogs.like(this.blogId);
          if (result.success) {
            this.blogData.likes += 1;
            this.isLiked = true;
          }
        }
      } catch (error) {
        console.error('点赞博客失败:', error);
        showNotification('操作失败，请重试', 'error');
      }
    },
    
    async bookmarkBlog() {
      try {
        const result = await this.$http.blogs.bookmark(this.blogId);
        if (result.success) {
          this.isBookmarked = true;
          this.blogData.bookmarks += 1;
          showNotification('收藏成功', 'success');
        }
      } catch (error) {
        console.error('收藏博客失败:', error);
        showNotification('收藏失败，请重试', 'error');
      }
    },
    
    async unbookmarkBlog() {
      try {
        const response = await this.$http.delete(`/api/blogs/${this.blogId}/bookmark`);
        if (response.success) {
          this.isBookmarked = false;
          this.blogData.bookmarks -= 1;
          showNotification('取消收藏成功', 'success');
        }
      } catch (error) {
        console.error('取消收藏失败:', error);
        if (error.response && error.response.status === 401) {
          this.$router.push('/login');
        } else {
          showNotification('取消收藏失败，请重试', 'error');
        }
      }
    },
    
    async followAuthor() {
      if (!this.$store.getters.isLoggedIn) {
        this.$router.push('/login');
        return;
      }
      
      try {
        const authorId = this.blogData.author?._id || this.blogData.author?.id;
        if (!authorId) {
          showNotification('作者信息不完整', 'error');
          return;
        }
        
        const result = await this.$http.users.follow(authorId);
        if (result.success) {
          showNotification('关注成功的', 'success');
        } else {
          showNotification(result.message || '关注失败', 'error');
        }
      } catch (error) {
        console.error('关注作者失败:', error);
        showNotification('关注失败，请重试', 'error');
      }
    },
    
    toggleShareMenu() {
      this.showShareMenu = !this.showShareMenu;
    },
    
    closeShareMenu() {
      this.showShareMenu = false;
    },
    
    shareToWechat() {
      showNotification('微信分享功能待实现', 'info');
      this.closeShareMenu();
    },
    
    shareToWeibo() {
      const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.closeShareMenu();
    },
    
    copyLink() {
      const link = window.location.href;
      navigator.clipboard.writeText(link)
        .then(() => {
          showNotification('链接已复制到剪贴板', 'success');
          this.closeShareMenu();
        })
        .catch(err => {
          console.error('复制失败:', err);
          showNotification('复制失败，请手动复制', 'error');
        });
    },
    
    shareToQQ() {
      const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}&desc=${encodeURIComponent(this.blogData.excerpt || '')}&pics=${encodeURIComponent(this.blogData.image)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.closeShareMenu();
    },
    
    shareToPrivateMessage() {
      const blogShareInfo = {
        title: this.blogData.title,
        link: window.location.href,
        image: this.blogData.image,
        excerpt: this.blogData.excerpt || ''
      };
      sessionStorage.setItem('blogShareInfo', JSON.stringify(blogShareInfo));
      
      this.closeShareMenu();
      this.$router.push('/messages');
    },
    
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`);
    },
    
    handleShare(platform) {
      const shareMap = {
        wechat: 'shareToWechat',
        weibo: 'shareToWeibo',
        copy: 'copyLink',
        qq: 'shareToQQ',
        private: 'shareToPrivateMessage'
      };
      const method = shareMap[platform];
      if (method && typeof this[method] === 'function') {
        this[method]();
      }
    },
    
    goToBlogDetail(blogId) {
      this.$router.push(`/blog/${blogId}`);
    }
  }
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.main-content {
  padding-bottom: 70px;
}

.error-message {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.btn-primary {
  padding: 10px 24px;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
