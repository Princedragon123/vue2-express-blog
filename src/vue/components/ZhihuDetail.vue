<!-- ============================================================
     ZhihuDetail.vue - 知乎风格文章详情页组件（学习版）
     ============================================================
     
     【文件职责】
     知乎风格的文章详情页，包含：
     1. 文章内容展示（支持长文、短文、视频）
     2. 作者信息展示与关注功能
     3. 点赞、收藏、分享互动功能
     4. 评论系统（支持多级回复）
     5. 浏览历史记录
     6. 缓存优化
     
     【学习重点】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │  1. 组件通信：父子组件通过 props 和 events 通信                         │
     │  2. 缓存策略：使用 CacheManager 优化性能                                │
     │  3. 内容处理：处理富文本中的图片和视频路径                              │
     │  4. 权限控制：判断是否为作者、是否可删除                                │
     │  5. 响应式数据：动态更新点赞、收藏状态                                  │
     │  6. 路由监听：watch $route.params 实现页面切换                          │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【组件结构】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                                                                         │
     │  ZhihuDetail（父组件）                                                  │
     │     │                                                                   │
     │     ├── MediaCarousel（媒体轮播组件）                                   │
     │     │     └── 短文章的多图/视频轮播展示                                 │
     │     │                                                                   │
     │     ├── InteractionSection（互动区域组件）                              │
     │     │     ├── 点赞按钮                                                  │
     │     │     ├── 收藏按钮                                                  │
     │     │     └── 分享按钮                                                  │
     │     │                                                                   │
     │     └── CommentSection（评论区域组件）                                  │
     │           ├── 评论列表                                                  │
     │           ├── 回复功能                                                  │
     │           └── 删除/置顶功能                                             │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【数据流向】
     ┌─────────────────────────────────────────────────────────────────────────┐
     │                                                                         │
     │  1. 页面加载 → created() → fetchBlogDetail()                           │
     │     │                                                                   │
     │     ├── 检查缓存 → 有缓存 → 直接使用缓存数据                           │
     │     │                                                                   │
     │     └── 无缓存 → API 请求 → 缓存数据 → 渲染页面                        │
     │                                                                         │
     │  2. 用户互动 → 点赞/收藏 → 更新本地状态 → API 请求                     │
     │                                                                         │
     │  3. 评论操作 → 提交评论 → API 请求 → 刷新评论列表                      │
     │                                                                         │
     └─────────────────────────────────────────────────────────────────────────┘
     
     【面试常问】
     Q1: 如何处理富文本中的图片路径？
     A: 使用正则表达式匹配 img 标签，处理相对路径，添加正确的服务器前缀
     
     Q2: 如何实现缓存优化？
     A: 使用 CacheManager 工具，设置缓存键和过期时间，减少重复请求
     
     Q3: 如何判断用户是否有权限删除文章？
     A: 比较当前用户 ID 和文章作者 ID，或者检查用户角色是否为 admin
     
     Q4: watch $route.params 的作用是什么？
     A: 监听路由参数变化，当文章 ID 改变时重新加载数据，实现页面复用
     ============================================================ -->
<template>
  <div class="zhihu-detail-page">

    <!-- 主内容区 -->
    <main class="zhihu-main">
        <!-- 中间内容区 -->
        <div class="zhihu-content">
          <!-- 加载失败提示 -->
          <div v-if="error" class="error-message">
            <p>{{ error }}</p>
            <button class="btn-primary" @click="fetchBlogDetail">重新加载</button>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
          
          <!-- 文章内容 -->
          <div v-else-if="blogData && Object.keys(blogData).length > 0" class="article-container">
            <!-- 文章标题 -->
            <h1 class="article-title">{{ blogData.title }}</h1>
            
            <!-- 作者信息 -->
            <div class="author-section">
              <div class="author-info">
                <img :src="getAuthorAvatar(blogData.author)" alt="作者头像" class="author-avatar">
                <div class="author-details">
                  <div class="author-name">{{ blogData.author?.username || blogData.author }}</div>
                  <div class="author-meta">
                    <span class="publish-date">{{ formatDate(blogData.createdAt) }}</span>
                    <span class="article-stats">
                      <i class="fa fa-eye"></i> {{ blogData.views }} 阅读
                    </span>
                  </div>
                </div>
              </div>
              <div class="author-actions">
                <button v-if="!isAuthor" class="follow-btn" :class="{ 'followed': isFollowing }" @click="toggleFollow">
                  {{ isFollowing ? '已关注' : '关注' }}
                </button>
                <button v-if="isAuthor" class="delete-btn" @click="deleteBlog">删除文章</button>
              </div>
            </div>
            
            <!-- 文章标签 -->
            <div class="article-tags">
              <span class="tag" v-for="tag in blogData.tags" :key="tag">{{ tag }}</span>
            </div>
            
            <!-- 短文章轮播图 -->
            <div v-if="blogData.articleType === 'short' && blogData.mediaFiles && blogData.mediaFiles.length > 0" class="short-article-carousel">
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
            
            <!-- 文章内容 -->
            <div class="article-content">
              <!-- 视频播放器 -->
              <div v-if="blogData.videoUrl" class="video-container">
                <video controls class="article-video">
                  <source :src="processVideoUrl(blogData.videoUrl)" type="video/mp4">
                  您的浏览器不支持视频播放。
                </video>
              </div>
              <!-- 文章正文 -->
              <div v-html="processContentImages(blogData.shortContent || blogData.content)"></div>
            </div>
            
            <!-- 互动区域 -->
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
            
            <!-- 评论区域 -->
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
        
        <!-- 右侧边栏 -->
        <div class="zhihu-sidebar">
          <div class="sidebar-section">
            <h3>推荐阅读</h3>
            <div class="recommended-item" v-for="item in recommended" :key="item.id">
              <div class="recommended-title">{{ item.title }}</div>
              <div class="recommended-meta">{{ item.views }} 阅读 · {{ item.answers }} 回答</div>
            </div>
          </div>
          <div class="sidebar-section">
            <h3>相关话题</h3>
            <div class="topic-item" v-for="topic in relatedTopics" :key="topic.id">
              <div class="topic-name">{{ topic.name }}</div>
              <div class="topic-meta">{{ topic.followers }} 关注 · {{ topic.articles }} 文章</div>
            </div>
          </div>
          <div class="sidebar-section">
            <h3>作者其他文章</h3>
            <div class="author-other-article" v-for="article in authorArticles" :key="article.id">
              <div class="article-title">{{ article.title }}</div>
              <div class="article-meta">{{ article.likes }} 赞 · {{ article.views }} 阅读</div>
            </div>
          </div>
        </div>
    </main>
  </div>
</template>

<script>
// ============================================================
// 【模块导入】
// ============================================================

import CacheManager from '../utils/cache';
import MediaCarousel from './MediaCarousel.vue';
import CommentSection from './CommentSection.vue';
import InteractionSection from './InteractionSection.vue';
import { getAuthorAvatar } from '../utils/avatarUtils';
import { showNotification } from '../utils/notification';

export default {
  name: 'ZhihuDetail',
  
  // ========================================================
  // 【组件注册】
  // ========================================================
  // 子组件说明：
  // - MediaCarousel: 媒体轮播组件，用于短文章的多图/视频展示
  // - CommentSection: 评论区域组件，包含评论列表和回复功能
  // - InteractionSection: 互动区域组件，包含点赞、收藏、分享按钮
  // ========================================================
  components: {
    MediaCarousel,
    CommentSection,
    InteractionSection
  },
  
  // ========================================================
  // 【data 数据区】
  // ========================================================
  // 组件的响应式数据，数据变化会自动触发视图更新
  // ========================================================
  data() {
    return {
      // -----------------------------------------------------
      // 【核心数据】
      // -----------------------------------------------------
      blogId: this.$route.params.id || 1,  // 当前文章 ID，从路由参数获取
      blogData: null,                       // 文章详情数据
      comments: [],                         // 评论列表数据
      newComment: '',                       // 新评论内容
      
      // -----------------------------------------------------
      // 【状态标志】
      // -----------------------------------------------------
      isLoading: false,           // 文章加载状态
      isLoadingComments: false,   // 评论加载状态
      error: null,                // 文章加载错误信息
      commentError: null,         // 评论加载错误信息
      isAuthor: false,            // 当前用户是否为文章作者
      currentUser: null,          // 当前登录用户信息
      isFollowing: false,         // 是否已关注作者
      
      // -----------------------------------------------------
      // 【侧边栏数据】（模拟数据，实际项目应从后端获取）
      // -----------------------------------------------------
      // 推荐阅读列表
      recommended: [
        {
          id: 1,
          title: '如何提高学习效率？',
          views: 1234,
          answers: 45
        },
        {
          id: 2,
          title: '程序员如何保持技术竞争力？',
          views: 2345,
          answers: 67
        },
        {
          id: 3,
          title: '如何培养良好的阅读习惯？',
          views: 3456,
          answers: 89
        }
      ],
      
      // 相关话题列表
      relatedTopics: [
        {
          id: 1,
          name: '学习方法',
          followers: 12345,
          articles: 678
        },
        {
          id: 2,
          name: '自我提升',
          followers: 23456,
          articles: 789
        }
      ],
      
      // 作者其他文章列表
      authorArticles: [
        {
          id: 1,
          title: '我的学习心得',
          likes: 123,
          views: 4567
        },
        {
          id: 2,
          title: '如何制定学习计划',
          likes: 456,
          views: 7890
        }
      ]
    };
  },
  
  // ========================================================
  // 【created 生命周期钩子】
  // ========================================================
  // 组件创建完成后立即调用
  // 用于初始化数据、发送 API 请求
  // ========================================================
  created() {
    this.fetchBlogDetail();  // 获取文章详情
    this.fetchComments();    // 获取评论列表
  },
  
  // ========================================================
  // 【watch 监听器】
  // ========================================================
  // 监听数据变化，执行相应操作
  // 常用于监听路由参数变化、深度监听对象变化
  // ========================================================
  watch: {
    // 监听路由参数 id 的变化
    // 当用户从一篇文章跳转到另一篇文章时，组件不会销毁重建
    // 而是复用同一个组件，此时需要监听参数变化重新加载数据
    '$route.params.id': {
      handler(newId) {
        if (newId) {
          this.blogId = newId;
          this.fetchBlogDetail();  // 重新加载文章详情
          this.fetchComments();    // 重新加载评论列表
        }
      },
      immediate: true  // 立即执行一次，初始化时也会触发
    }
  },
  
  // ========================================================
  // 【methods 方法区】
  // ========================================================
  // 组件的所有方法，包括事件处理、API 调用、数据处理等
  // ========================================================
  methods: {
    // -----------------------------------------------------
    // 【工具方法】
    // -----------------------------------------------------
    
    // 获取作者头像 URL
    // 调用工具函数处理头像路径
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },

    // 格式化日期
    // 将 ISO 日期字符串转换为中文格式
    // 例如：2024-01-15 → 2024年1月15日
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    
    // -----------------------------------------------------
    // 【数据获取方法】
    // -----------------------------------------------------
    
    // 获取博客详情
    // 【缓存策略】
    // 1. 先检查缓存，有缓存直接使用
    // 2. 无缓存则发送 API 请求
    // 3. 获取数据后缓存，有效期 1 小时
    async fetchBlogDetail() {
      try {
        this.isLoading = true;
        this.error = null;
        
        // 生成缓存键（唯一标识）
        const cacheKey = `blog_detail_${this.blogId}`;
        
        // 检查是否有缓存数据
        const cachedData = CacheManager.get(cacheKey);
        
        if (cachedData) {
          // 【命中缓存】直接使用缓存数据
          this.blogData = cachedData;
          
          // 检查当前用户是否是文章作者
          this.currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
          this.isAuthor = this.currentUser && this.currentUser._id === this.blogData.author?._id;
          
          // 检查用户是否已登录，如果登录了，获取点赞和收藏状态
          if (this.currentUser) {
            this.checkLikeAndBookmarkStatus();
          }
        } else {
          // 【未命中缓存】发送 API 请求
          const response = await this.$http.blogs.getDetail(this.blogId);
          
          this.blogData = response.data;
          
          // 缓存数据，设置缓存时间为 1 小时（3600 秒）
          CacheManager.set(cacheKey, response.data, 3600);
          
          // 检查当前用户是否是文章作者
          this.currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
          this.isAuthor = this.currentUser && this.currentUser._id === this.blogData.author?._id;
          
          // 检查用户是否已登录，如果登录了，获取点赞和收藏状态
          if (this.currentUser) {
            this.checkLikeAndBookmarkStatus();
          }
        }
        
        // 添加到浏览历史
        this.addToHistory();
      } catch (error) {
        console.error('获取博客详情失败:', error);
        this.error = '获取博客详情失败，请稍后重试';
      } finally {
        this.isLoading = false;
      }
    },
    
    // 添加到浏览历史
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
    // 处理文章内容中的图片和视频路径
    processContentImages(content) {
      if (!content) return '';
      
      // 处理图片路径，确保正确显示
      let processedContent = content;
      
      // 替换图片标签中的src属性，确保路径正确，并移除内联宽度样式
      processedContent = processedContent.replace(/<img\s+src="([^"]+)"\s*(?:style="[^"]*")?/g, (match, src) => {
        let newSrc = src;
        // 如果图片路径不是完整的URL，也不是以/static/开头
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/static/')) {
          // 添加/static/uploads/前缀
          newSrc = `/static/uploads/${src.replace(/^\/+|^\/*/, '')}`;
        }
        return `<img src="${newSrc}" style="max-width: 100%; height: auto; display: block; margin: 16px 0;"`;
      });
      
      // 替换视频标签中的src属性，确保路径正确
      processedContent = processedContent.replace(/<video\s+.*?src="([^"]+)"\s*(?:style="[^"]*")?/g, (match, src) => {
        let newSrc = src;
        // 如果视频路径不是完整的URL，也不是以/static/开头
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/static/')) {
          // 添加/static/uploads/前缀
          newSrc = `/static/uploads/${src.replace(/^\/+|^\/*/, '')}`;
        }
        return `<video controls style="max-width: 100%; height: auto; display: block; margin: 16px 0;"><source src="${newSrc}" type="video/mp4">您的浏览器不支持视频播放。</video>`;
      });
      
      // 移除内容中可能存在的图片路径文本
      processedContent = processedContent.replace(/\(\/static\/uploads\/[^)]+\)/g, '');
      
      return processedContent;
    },
    // 处理视频URL路径
    processVideoUrl(videoUrl) {
      if (!videoUrl) return '';
      
      // 如果视频路径不是完整的URL，也不是以/static/开头
      if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('/static/')) {
        // 添加/static/uploads/前缀
        return `/static/uploads/${videoUrl.replace(/^\/+|^\/*/, '')}`;
      }
      
      return videoUrl;
    },
    // 提交回复
    async submitReply(replyTarget, parentComment = null) {
      try {
        const content = replyTarget.replyText.trim();
        if (!content) {
          return;
        }
        
        // 构建请求数据
        const requestData = {
          content: content
        };
        
        // 如果是回复的回复，需要指定父评论ID和回复目标用户
        if (parentComment) {
          // 回复的回复，父评论是原始评论
          requestData.parentId = parentComment._id;
          // 同时指定回复的目标用户
          requestData.replyTo = replyTarget.author?.id || replyTarget.author?._id;
        } else {
          // 直接回复评论
          requestData.parentId = replyTarget._id;
        }
        
        // 发送请求
        const response = await this.$http.blogs.createComment(this.blogId, requestData);
        
        // 清空回复输入框并关闭回复状态
        replyTarget.replyText = '';
        replyTarget.isReplying = false;
        
        // 重新加载评论列表
        await this.fetchComments();
      } catch (error) {
        console.error('提交回复失败:', error);
        showNotification('回复失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    // 检查当前用户是否有权限删除评论
    canDeleteComment(comment) {
      const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
      if (!currentUser) return false;
      
      // 检查是否是评论作者
      const isAuthor = currentUser._id === comment.author?._id;
      
      // 检查是否是文章作者
      const isBlogAuthor = currentUser._id === this.blogData?.author?._id;
      
      // 检查是否是管理员
      const isAdmin = currentUser.role === 'admin';
      
      return isAuthor || isBlogAuthor || isAdmin;
    },
    // 删除文章
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
          // 跳转到首页
          this.$router.push('/');
        } else {
          showNotification('删除失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('删除文章失败:', error);
        showNotification('删除失败，请重试', 'error');
      }
    },
    // 删除评论
    async deleteComment(commentId) {
      if (!confirm('确定要删除这条评论吗？')) return;
      
      try {
        const response = await this.$http.blogs.deleteComment(commentId);
        
        showNotification('评论删除成功', 'success');
        // 重新加载评论列表
        await this.fetchComments();
      } catch (error) {
        console.error('删除评论失败:', error);
        showNotification('删除失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },
    // 置顶评论
    async pinComment(commentId) {
      try {
        const response = await this.$http.blogs.pinComment(commentId);
        
        if (response.success) {
          showNotification(response.data.message || '操作成功', 'success');
          // 重新加载评论列表
          await this.fetchComments();
        } else {
          showNotification('操作失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('置顶评论失败:', error);
        showNotification('操作失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },

    // 提交评论
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
        // 构建请求数据
        const requestData = {
          content: commentContent.trim()
        };
        
        // 发送请求
        const response = await this.$http.blogs.createComment(this.blogId, requestData);
        
        // 清空评论输入框
        this.newComment = '';
        
        // 重新加载评论列表
        await this.fetchComments();
      } catch (error) {
        console.error('提交评论失败:', error);
        showNotification('评论失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },
    // 获取评论列表
    async fetchComments() {
      try {
        this.isLoadingComments = true;
        this.commentError = null;
        const response = await this.$http.blogs.getComments(this.blogId);
        
        // 为每个评论和回复添加响应式属性
        this.comments = response.data.map(comment => {
          // 为评论添加响应式属性
          comment.isReplying = false;
          comment.replyText = '';
          
          // 为回复添加响应式属性
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

    // 打开分享模态框
    openShareModal() {
      // 实现分享功能
      if (navigator.share) {
        // 使用Web Share API
        navigator.share({
          title: this.blogData.title,
          text: this.blogData.shortContent || this.blogData.content.substring(0, 100),
          url: window.location.href
        }).catch(error => {
          console.error('分享失败:', error);
        });
      } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
          showNotification('链接已复制到剪贴板', 'success');
        }).catch(error => {
          console.error('复制链接失败:', error);
          showNotification('复制链接失败，请手动复制', 'error');
        });
      }
    },
    // 点赞文章
    async likeBlog(blogId) {
      if (!this.blogData) return;
      
      // 检查用户是否已登录
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('请先登录后再点赞', 'warning');
        return;
      }
      
      try {
        // 检查当前点赞状态
        const isCurrentlyLiked = this.blogData.isLiked || false;
        const result = await this.$http.blogs[isCurrentlyLiked ? 'unlike' : 'like'](blogId);
        
        if (result.success) {
          // 更新本地数据
          this.$set(this.blogData, 'likes', result.data.likes);
          this.$set(this.blogData, 'isLiked', !isCurrentlyLiked);
        } else {
          console.error('操作失败:', result.message);
          // 操作失败后，重新检查点赞状态
          this.checkLikeAndBookmarkStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        // 操作失败后，重新检查点赞状态
        this.checkLikeAndBookmarkStatus();
      }
    },
    // 收藏文章
    async bookmarkBlog(blogId) {
      if (!this.blogData) return;
      
      // 检查用户是否已登录
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showNotification('请先登录后再收藏', 'warning');
        return;
      }
      
      try {
        // 检查当前收藏状态
        const isCurrentlyBookmarked = this.blogData.isBookmarked || false;
        const result = await this.$http.blogs[isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'](blogId);
        
        if (result.success) {
          // 更新本地数据
          this.$set(this.blogData, 'bookmarks', result.data.bookmarks);
          this.$set(this.blogData, 'isBookmarked', !isCurrentlyBookmarked);
        } else {
          console.error('操作失败:', result.message);
          // 操作失败后，重新检查收藏状态
          this.checkLikeAndBookmarkStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        // 操作失败后，重新检查收藏状态
        this.checkLikeAndBookmarkStatus();
      }
    },
    // 检查用户的点赞、收藏和关注状态
    async checkLikeAndBookmarkStatus() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          return;
        }
        
        // 重新获取博客详情，确保点赞和收藏数量是最新的
        const blogDetailResponse = await this.$http.blogs.getDetail(this.blogId);
        if (blogDetailResponse.success) {
          // 更新博客详情
          this.$set(this.blogData, 'likes', blogDetailResponse.data.likes);
          this.$set(this.blogData, 'bookmarks', blogDetailResponse.data.bookmarks);
        }
        
        // 检查点赞状态
        const likeStatusResponse = await this.$http.blogs.checkLikeStatus(this.blogId);
        if (likeStatusResponse.success) {
          this.$set(this.blogData, 'isLiked', likeStatusResponse.data.isLiked);
        }
        
        // 检查收藏状态
        const bookmarkStatusResponse = await this.$http.blogs.checkBookmarkStatus(this.blogId);
        if (bookmarkStatusResponse.success) {
          this.$set(this.blogData, 'isBookmarked', bookmarkStatusResponse.data.isBookmarked);
        }
        
        // 检查关注状态
        if (this.blogData.author && this.blogData.author._id) {
          await this.checkFollowStatus();
        }
      } catch (error) {
        console.error('检查状态失败:', error);
      }
    },
    
    // 检查关注状态
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
    
    // 关注/取消关注作者
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


/* 主内容区 */
.zhihu-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  gap: 20px;
}

/* 侧边栏 */
.zhihu-sidebar {
  width: 250px;
  max-width: 100%;
}

/* 确保侧边栏中的图片也能响应式调整 */
.zhihu-sidebar img {
  max-width: 100%;
  height: auto;
}

.sidebar-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sidebar-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.recommended-item {
  margin-bottom: 12px;
  cursor: pointer;
}

.recommended-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.4;
}

.recommended-meta {
  font-size: 12px;
  color: #999;
}

.topic-item {
  margin-bottom: 12px;
  cursor: pointer;
}

.topic-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.topic-meta {
  font-size: 12px;
  color: #999;
}

.author-other-article {
  margin-bottom: 12px;
  cursor: pointer;
}

/* 中间内容区 */
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

/* 作者信息 */
.author-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.author-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
}

.follow-btn {
  padding: 6px 16px;
  border: 1px solid #0084ff;
  border-radius: 20px;
  background-color: #fff;
  color: #0084ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background-color: #e6f7ff;
}

/* 文章标签 */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag {
  padding: 4px 12px;
  background-color: #f0f7ff;
  color: #0084ff;
  font-size: 12px;
  border-radius: 12px;
  cursor: pointer;
}

/* 文章图片 */
.article-image {
  margin-bottom: 20px;
}

.cover-img {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  max-height: 400px;
}

/* 文章内容 */
.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 24px;
  max-width: 100%;
  width: 100%;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
}

.article-content img {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 16px 0 !important;
  border-radius: 8px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

/* 短文章轮播图样式 */
.short-article-carousel {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 视频播放器样式 */
.video-container {
  margin: 16px 0;
  width: 100%;
}

.article-video {
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

.article-content p {
  margin-bottom: 16px;
}

.article-content h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 16px;
  color: #333;
}

.article-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #333;
}

.article-content ul, .article-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.article-content li {
  margin-bottom: 8px;
}

/* 互动区域 */
.interaction-section {
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 30px;
}

.interaction-buttons {
  display: flex;
  gap: 32px;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 8px 0;
  transition: all 0.3s ease;
}

.interaction-btn:hover {
  color: #0084ff;
}

.interaction-btn i {
  font-size: 16px;
}

/* 评论区域 */
.comments-section {
  margin-top: 30px;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.comment-input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: all 0.3s ease;
}

.comment-input:focus {
  border-color: #0084ff;
  box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.1);
}

.comment-submit-btn {
  align-self: flex-end;
  padding: 8px 20px;
  background-color: #0084ff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-submit-btn:hover {
  background-color: #0073e6;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

.comment-actions {
  display: flex;
  gap: 24px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.comment-action-btn:hover {
  color: #1890ff;
}

/* 回复列表 */
.replies-list {
  margin-top: 12px;
  margin-left: 48px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reply-item {
  display: flex;
  margin-bottom: 12px;
  gap: 12px;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.reply-time {
  font-size: 12px;
  color: #999;
}

.reply-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.reply-to {
  color: #999;
  font-size: 14px;
}

.reply-to-user {
  color: #0084ff;
  font-weight: 500;
}

/* 回复输入框 */
.reply-input-section {
  margin-top: 12px;
  margin-left: 0;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.reply-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 8px;
}

.reply-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.reply-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.reply-submit-btn {
  padding: 6px 16px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reply-submit-btn:hover {
  background-color: #40a9ff;
}

.reply-submit-btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.reply-cancel-btn {
  padding: 6px 16px;
  background-color: #fff;
  color: #333;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reply-cancel-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 回复操作按钮 */
.reply-actions {
  margin-top: 8px;
}

.reply-action-btn {
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reply-action-btn:hover {
  color: #1890ff;
}

.delete-comment-btn {
  color: #ff4d4f;
}

.delete-comment-btn:hover {
  color: #ff7875;
}

.delete-btn {
  padding: 6px 16px;
  border: 1px solid #ff4d4f;
  border-radius: 20px;
  background-color: #fff;
  color: #ff4d4f;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
}

.delete-btn:hover {
  background-color: #fff1f0;
  border-color: #ff7875;
  color: #ff7875;
}

/* 加载状态 */
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

/* 错误提示 */
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

/* 响应式设计 */
@media (max-width: 1024px) {
  .zhihu-sidebar {
    display: none;
  }
  
  .zhihu-main {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .nav-search {
    order: 3;
    flex: 1 1 100%;
    margin: 0;
  }
  
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