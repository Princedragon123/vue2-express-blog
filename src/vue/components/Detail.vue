<!-- ============================================================
Detail.vue - 博客详情页组件（学习版）
============================================================

【文件职责】
展示博客文章的完整内容，包括：
1. 博客详情展示（标题、内容、封面图）
2. 评论功能（发表评论、回复评论）
3. 互动功能（点赞、收藏、分享）
4. 关注作者功能
5. 相关推荐

【学习重点】
┌─────────────────────────────────────────────────────────────────────────┐
│  1. 路由参数：this.$route.params.id 获取博客ID                          │
│  2. 数据缓存：CacheManager 缓存博客详情和评论                           │
│  3. 状态管理：isLiked、isBookmarked 等状态                              │
│  4. 分享功能：微信、微博、QQ、复制链接、私信分享                        │
│  5. SEO优化：metaInfo 设置页面标题和描述                                │
└─────────────────────────────────────────────────────────────────────────┘

【组件结构】
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  detail-header（标题区）                                         │  │
│   │  - 分类徽章、话题徽章                                            │  │
│   │  - 标题、作者信息、关注按钮                                      │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  detail-image（封面图）                                          │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  detail-content（文章内容）                                      │  │
│   │  - v-html 渲染富文本内容                                         │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  interaction-section（互动区）                                   │  │
│   │  - 点赞、评论、收藏、分享按钮                                    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  comments-section（评论区）                                      │  │
│   │  - 评论输入框、评论列表、回复功能                                │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  related-section（相关推荐）                                     │  │
│   │  - 相关博客卡片列表                                              │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

【面试常问】
Q1: 如何获取路由参数？
A: this.$route.params.id

Q2: 如何实现数据缓存？
A: 使用 CacheManager，设置缓存键和过期时间

Q3: 如何判断用户是否点赞/收藏？
A: 调用 API 检查状态，或从返回数据中获取

Q4: 如何实现分享功能？
A: 各平台有对应的分享 URL，window.open 打开

Q5: v-html 有什么安全风险？
A: XSS攻击，需要确保内容已过滤

Q6: 如何优化详情页加载速度？
A: 缓存数据、懒加载图片、骨架屏
============================================================ -->
<template>
  <div class="detail-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
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
        
        <!-- 博客详情内容 -->
        <div v-else-if="blogData && Object.keys(blogData).length > 0">
          <!-- 攻略标题区 -->
          <div class="detail-header">
            <div class="category-badge">{{ blogData.category.name || blogData.category }}</div>
            <div v-if="blogData.topic" class="topic-badge" @click="goToTopicDetail(blogData.topic._id)">
              {{ blogData.topic.name }}
            </div>
            <h1 class="detail-title">{{ blogData.title }}</h1>
            
            <!-- 作者信息 -->
            <div class="author-section">
              <div class="author-info">
                <img v-lazy="getAuthorAvatar(blogData.author, 50)" alt="作者头像" class="author-avatar">
                <div class="author-details">
                  <div class="author-name">{{ blogData.author?.username || blogData.author }}</div>
                  <div class="post-date">{{ blogData.date }}</div>
                </div>
              </div>
              <button class="follow-btn" @click="followAuthor">
                <i class="fas fa-user-plus"></i>
                关注
              </button>
            </div>
          </div>
        
          <!-- 攻略封面图 -->
          <div class="detail-image">
            <img v-lazy="blogData.image" :alt="blogData.title" class="cover-img">
          </div>
          
          <!-- 攻略内容 -->
          <div class="detail-content">
            <div v-html="blogData.content"></div>
          </div>
          
          <!-- 互动按钮 -->
          <div class="interaction-section">
            <div class="interaction-buttons">
              <button class="interaction-btn" @click="likeBlog">
                <i class="fas fa-heart"></i>
                <span>{{ blogData.likes }}</span>
              </button>
              <button class="interaction-btn">
                <i class="fas fa-comment"></i>
                <span>{{ blogData.comments }}</span>
              </button>
              <button class="interaction-btn" @click="isBookmarked ? unbookmarkBlog() : bookmarkBlog()">
                <i :class="['fas', isBookmarked ? 'fa-bookmark' : 'fa-bookmark']"></i>
                <span>{{ blogData.bookmarks }}</span>
              </button>
              <button class="interaction-btn" @click="toggleShareMenu">
                <i class="fas fa-share"></i>
                <span>分享</span>
              </button>
              
              <!-- 分享菜单 -->
              <div v-if="showShareMenu" class="share-menu" @click.self="closeShareMenu">
                <div class="share-menu-header">
                  <h4>分享到</h4>
                  <button class="share-close-btn" @click="closeShareMenu">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="share-options">
                  <button class="share-option" @click="shareToWechat">
                    <i class="fab fa-weixin"></i>
                    <span>微信</span>
                  </button>
                  <button class="share-option" @click="shareToWeibo">
                    <i class="fab fa-weibo"></i>
                    <span>微博</span>
                  </button>
                  <button class="share-option" @click="copyLink">
                    <i class="fas fa-link"></i>
                    <span>复制链接</span>
                  </button>
                  <button class="share-option" @click="shareToQQ">
                    <i class="fab fa-qq"></i>
                    <span>QQ</span>
                  </button>
                  <button class="share-option" @click="shareToPrivateMessage">
                    <i class="fas fa-envelope"></i>
                    <span>私信分享</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        
          <!-- 评论区 -->
          <div class="comments-section">
            <h3 class="comments-title">评论 ({{ blogData.comments }})</h3>
            
            <!-- 评论输入框 -->
            <div class="comment-input-section">
              <img v-lazy="'https://via.placeholder.com/40'" alt="用户头像" class="commenter-avatar">
              <div class="comment-input-wrapper">
                <input type="text" class="comment-input" placeholder="写下你的评论..." v-model="commentInput" @keyup.enter="submitComment">
                <button class="comment-submit-btn" @click="submitComment">发送</button>
              </div>
            </div>
            
            <!-- 评论列表 -->
            <div class="comments-list">
              <div v-if="isLoading" class="loading-comments">
                <i class="fas fa-spinner fa-spin"></i>
                <span>加载评论中...</span>
              </div>
              
              <div v-else-if="comments.length === 0" class="no-comments">
                <i class="fas fa-comments"></i>
                <span>暂无评论，快来写下第一条评论吧！</span>
              </div>
              
              <div v-else class="comment-item" v-for="comment in comments" :key="comment._id">
                <img v-lazy="getAuthorAvatar(comment.author, 40)" alt="评论者头像" class="commenter-avatar">
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="commenter-name">{{ comment.author.username }}</span>
                    <span class="comment-date">{{ new Date(comment.createdAt).toLocaleString() }}</span>
                  </div>
                  <div class="comment-text">{{ comment.content }}</div>
                  <div class="comment-actions">
                    <button class="comment-action-btn" @click="toggleReply(comment._id)">
                      <i class="fas fa-reply"></i>
                      <span>回复</span>
                    </button>
                  </div>
                  
                  <!-- 回复输入框 -->
                  <div v-if="replyingTo === comment._id" class="reply-input-section">
                    <div class="reply-input-wrapper">
                      <input type="text" class="reply-input" placeholder="写下你的回复..." v-model="replyInput" @keyup.enter="submitReply(comment._id)">
                      <button class="reply-submit-btn" @click="submitReply(comment._id)">发送</button>
                      <button class="reply-cancel-btn" @click="cancelReply">取消</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 相关推荐 -->
          <div class="related-section">
            <h3 class="related-title">相关推荐</h3>
            <div class="related-grid">
              <div class="related-card" v-for="related in relatedBlogs" :key="related._id || related.id">
                <div class="related-image">
                  <img v-lazy="related.image" :alt="related.title" class="related-img">
                </div>
                <div class="related-content">
                  <h4 class="related-title-small">{{ related.title }}</h4>
                  <div class="related-meta">
                    <span class="related-author">{{ related.author }}</span>
                    <span class="related-likes">{{ related.likes }} 赞</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    

  </div>
</template>

<script>
// ============================================================
// 导入依赖模块
// ============================================================
// CacheManager: 数据缓存工具，减少重复请求
import CacheManager from '../utils/cache';
// auth: 认证工具，检查登录状态
import auth from '../utils/auth';
// getAuthorAvatar: 头像处理工具
import { getAuthorAvatar } from '../utils/avatarUtils';
// showNotification: 通知提示工具
import { showNotification } from '../utils/notification';

export default {
  name: 'Detail',
  components: {
  },
  
  // ============================================================
  // metaInfo - SEO优化配置
  // ============================================================
  // 【作用】设置页面标题和meta标签，优化SEO
  // 【依赖】vue-meta 插件
  // 
  // 【效果】
  // <title>博客标题 | 博客详情</title>
  // <meta name="description" content="博客内容摘要...">
  // <meta name="keywords" content="博客标题,分类,作者">
  // 
  // 【面试常问】
  // Q: 为什么要做SEO优化？
  // A: 提高搜索引擎排名，增加流量
  // ============================================================
  metaInfo() {
    return {
      title: this.blogData.title || '博客详情',
      meta: [
        { name: 'description', content: this.blogData.content ? this.blogData.content.substring(0, 100) + '...' : '查看博客详情' },
        { name: 'keywords', content: `${this.blogData.title || '博客'},${this.blogData.category || ''},${this.blogData.author || ''}` }
      ]
    };
  },
  
  // ============================================================
  // data - 组件数据
  // ============================================================
  // 【重要属性说明】
  // 
  // blogId: 当前博客ID
  // 【来源】路由参数 this.$route.params.id
  // 
  // blogData: 博客详情数据
  // 【字段】title, category, author, image, content, likes, comments, bookmarks
  // 
  // comments: 评论列表
  // 【结构】[{ _id, author, content, likes, createdAt, replies }]
  // 
  // isLiked: 当前用户是否已点赞
  // isBookmarked: 当前用户是否已收藏
  // 【用途】控制按钮状态和样式
  // 
  // showShareMenu: 是否显示分享菜单
  // replyingTo: 当前正在回复的评论ID
  // ============================================================
  data() {
    return {
      // 博客ID（从路由参数获取）
      blogId: this.$route.params.id || 1,
      
      // 博客详情数据
      blogData: {
        id: 1,
        title: '2024最新游戏攻略：如何快速提升等级',
        category: '游戏攻略',
        author: '游戏达人',
        authorAvatar: 'https://via.placeholder.com/40',
        date: '2024-01-07',
        image: 'https://via.placeholder.com/800x400',
        content: '这是一篇详细的游戏攻略...',
        likes: 123,        // 点赞数
        comments: 45,      // 评论数
        bookmarks: 67,     // 收藏数
        views: 0           // 浏览数
      },
      
      // 评论列表
      comments: [],
      // 评论输入内容
      commentInput: '',
      // 回复输入内容
      replyInput: '',
      // 当前正在回复的评论ID
      replyingTo: null,
      
      // 加载状态
      isLoading: false,
      // 错误信息
      error: null,
      
      // 互动状态
      isBookmarked: false,  // 是否已收藏
      isLiked: false,       // 是否已点赞
      hasViewed: false,     // 是否已浏览
      
      // 分享菜单显示状态
      showShareMenu: false,
      
      // 相关推荐博客列表
      relatedBlogs: [
        { id: 2, title: '新手必看：游戏基础操作指南', image: '...', author: '游戏导师', likes: 234 },
        { id: 3, title: '高级玩家技巧：如何在游戏中脱颖而出', image: '...', author: '游戏大师', likes: 345 },
        { id: 4, title: '游戏装备推荐：性价比最高的装备组合', image: '...', author: '装备专家', likes: 456 }
      ]
    };
  },
  
  // ============================================================
  // created - 生命周期钩子
  // ============================================================
  // 【触发时机】组件创建完成后立即调用
  // 【作用】初始化数据，获取博客详情和评论
  // 
  // 【面试常问】
  // Q: created 和 mounted 有什么区别？
  // A: created 时 DOM 还未挂载，mounted 时 DOM 已挂载
  // 
  // Q: 为什么在 created 中获取数据？
  // A: 尽早获取数据，减少用户等待时间
  // ============================================================
  created() {
    this.fetchBlogDetail();
    this.fetchComments();
  },
  
  // ============================================================
  // watch - 监听路由变化
  // ============================================================
  // 【作用】当路由参数变化时，重新获取数据
  // 【场景】用户从一篇博客详情跳转到另一篇博客详情
  // 
  // 【配置说明】
  // immediate: true - 组件创建时立即执行一次
  // handler(newId) - 路由参数变化时的回调函数
  // 
  // 【面试常问】
  // Q: 为什么需要监听路由变化？
  // A: Vue Router 复用组件，不会重新创建，需要手动刷新数据
  // ============================================================
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
    // ========================================================
    // 获取作者头像URL
    // ========================================================
    // 【参数】
    // author: 作者对象或字符串
    // size: 头像尺寸（像素）
    // 
    // 【返回值】头像URL
    // ========================================================
    getAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    // ========================================================
    // 获取博客详情（核心方法）
    // ========================================================
    // 【作用】从服务器获取博客详情数据
    // 
    // 【流程】
    // 1. 设置加载状态
    // 2. 检查缓存，有则直接使用
    // 3. 无缓存则发送API请求
    // 4. 缓存数据（1小时过期）
    // 5. 检查点赞状态
    // 6. 添加到浏览历史
    // 
    // 【缓存策略】
    // - 缓存键：blog_detail_${blogId}
    // - 过期时间：1小时（3600秒）
    // - 目的：减少重复请求，提升加载速度
    // 
    // 【面试常问】
    // Q: 为什么要用缓存？
    // A: 减少服务器压力，提升用户体验
    // 
    // Q: 缓存过期时间怎么设置？
    // A: 根据数据更新频率，博客详情变化少，设1小时
    // ========================================================
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
    
    // ========================================================
    // 检查点赞状态
    // ========================================================
    // 【作用】检查当前用户是否已点赞该博客
    // 【返回】设置 isLiked 状态
    // 
    // 【流程】
    // 1. 检查用户是否登录
    // 2. 发送请求检查点赞状态
    // 3. 更新 isLiked 状态
    // ========================================================
    async checkLikeStatus() {
      try {
        if (!auth.isLoggedIn()) {
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
    
    // ========================================================
    // 添加到浏览历史
    // ========================================================
    // 【作用】将当前博客添加到用户的浏览历史
    // 【API】POST /api/history/add
    // ========================================================
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
    
    // ========================================================
    // 获取评论列表
    // ========================================================
    // 【作用】获取当前博客的所有评论
    // 
    // 【缓存策略】
    // - 缓存键：blog_comments_${blogId}
    // - 过期时间：5分钟（300秒）
    // - 评论变化频繁，缓存时间短
    // ========================================================
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
    
    // ========================================================
    // 提交评论
    // ========================================================
    // 【作用】发表新评论
    // 
    // 【流程】
    // 1. 检查输入不为空
    // 2. 发送评论请求
    // 3. 将新评论添加到列表顶部
    // 4. 更新评论计数
    // 5. 清空输入框
    // 
    // 【错误处理】
    // - 401: 未登录，跳转登录页
    // - 其他: 显示错误提示
    // ========================================================
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
    
    // ========================================================
    // 点赞评论
    // ========================================================
    // 【作用】为评论点赞
    // 【参数】comment: 评论对象
    // ========================================================
    // 切换回复输入框
    toggleReply(commentId) {
      this.replyingTo = this.replyingTo === commentId ? null : commentId;
      this.replyInput = '';
    },
    // 取消回复
    cancelReply() {
      this.replyingTo = null;
      this.replyInput = '';
    },
    // 提交回复
    async submitReply(commentId) {
      if (!this.replyInput.trim()) return;
      
      try {
        const result = await this.$http.comments.reply({
          commentId,
          content: this.replyInput
        });
        
        // 找到对应的评论并添加回复
        const commentIndex = this.comments.findIndex(c => c._id === commentId);
        if (commentIndex !== -1) {
          if (!this.comments[commentIndex].replies) {
            this.comments[commentIndex].replies = [];
          }
          this.comments[commentIndex].replies.push(result.data);
        }
        
        // 清除回复输入
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
    // 检查用户是否已经点赞过博客
    async checkLikeStatus() {
      try {
        // 这里需要实现一个 API 来检查用户是否已经点赞过博客
        // 或者在获取博客详情时，同时返回用户的点赞状态
        // 暂时跳过，后续实现
      } catch (error) {
        console.error('检查点赞状态失败:', error);
      }
    },
    
    // 点赞博客
    async likeBlog() {
      try {
        if (this.isLiked) {
          // 已经点赞过，执行取消点赞
          const result = await this.$http.blogs.unlike(this.blogId);
          if (result.success) {
            // 更新博客点赞数
            this.blogData.likes -= 1;
            this.isLiked = false;
          }
        } else {
          // 未点赞过，执行点赞
          const result = await this.$http.blogs.like(this.blogId);
          if (result.success) {
            // 更新博客点赞数
            this.blogData.likes += 1;
            this.isLiked = true;
          }
        }
      } catch (error) {
        console.error('点赞博客失败:', error);
        showNotification('操作失败，请重试', 'error');
      }
    },
    // 收藏博客
    async bookmarkBlog() {
      try {
        const result = await this.$http.blogs.bookmark(this.blogId);
        if (result.success) {
          // 更新收藏状态和收藏数
          this.isBookmarked = true;
          this.blogData.bookmarks += 1;
          showNotification('收藏成功', 'success');
        }
      } catch (error) {
        console.error('收藏博客失败:', error);
        showNotification('收藏失败，请重试', 'error');
      }
    },
    // 取消收藏博客
    async unbookmarkBlog() {
      try {
        const response = await this.$http.delete(`/api/blogs/${this.blogId}/bookmark`);
        if (response.success) {
          // 更新收藏状态和收藏数
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
    // 关注作者
    async followAuthor() {
      // 检查认证状态
      if (!auth.isLoggedIn()) {
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
          showNotification('关注成功', 'success');
        } else {
          showNotification(result.message || '关注失败', 'error');
        }
      } catch (error) {
        console.error('关注作者失败:', error);
        showNotification('关注失败，请重试', 'error');
      }
    },
    // 分享功能
    toggleShareMenu() {
      this.showShareMenu = !this.showShareMenu;
    },
    closeShareMenu() {
      this.showShareMenu = false;
    },
    shareToWechat() {
      // 分享到微信的逻辑
      showNotification('微信分享功能待实现', 'info');
      this.closeShareMenu();
    },
    shareToWeibo() {
      // 分享到微博的逻辑
      const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.closeShareMenu();
    },
    copyLink() {
      // 复制链接到剪贴板
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
      // 分享到QQ的逻辑
      const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(this.blogData.title)}&desc=${encodeURIComponent(this.blogData.excerpt || '')}&pics=${encodeURIComponent(this.blogData.image)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.closeShareMenu();
    },
    shareToPrivateMessage() {
      // 分享到私信的逻辑
      // 将博客信息保存到sessionStorage，以便在私信页面使用
      const blogShareInfo = {
        title: this.blogData.title,
        link: window.location.href,
        image: this.blogData.image,
        excerpt: this.blogData.excerpt || ''
      };
      sessionStorage.setItem('blogShareInfo', JSON.stringify(blogShareInfo));
      
      // 关闭分享菜单
      this.closeShareMenu();
      
      // 跳转到私信页面
      this.$router.push('/messages');
    },
    // 跳转到话题详情页
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`);
    }
  }
}
</script>

<style scoped>
/* 详情页面 - 春日花园风格 */
.detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

/* 主内容区 */
.main-content {
  padding-bottom: 70px; /* 为底部导航栏预留空间 */
}

/* 攻略标题区 - 春日花园风格 */
.detail-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
}

/* 分类徽章 - 春日花园风格 */
.category-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 15px;
  /* 春日花园风格徽章 */
  border: 2px solid var(--background-dark);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

/* 话题徽章 - 春日花园风格 */
.topic-badge {
  display: inline-block;
  background: linear-gradient(135deg, var(--accent-green) 0%, var(--text-primary) 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 15px;
  margin-left: 8px;
  /* 春日花园风格徽章 */
  border: 2px solid var(--background-dark);
  box-shadow: 0 2px 4px rgba(109, 231, 183, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.topic-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(109, 231, 183, 0.4);
}

/* 详情标题 - 春日花园风格 */
.detail-title {
  margin: 0 0 20px;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  /* 春日花园风格标题 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink),
               1px -1px 0 var(--primary-pink),
               -1px 1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

/* 作者信息 - 春日花园风格 */
.author-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 作者头像 - 春日花园风格 */
.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  /* 春日花园风格头像 */
  border: 2px solid var(--primary-pink);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
}

.author-details {
  display: flex;
  flex-direction: column;
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

.author-name {
  font-weight: 600;
  color: var(--primary-pink);
  font-size: 1rem;
  /* 春日花园风格作者名 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
}

.post-date {
  font-size: 0.85rem;
  color: #8e8e8e;
  margin-top: 3px;
}

/* 关注按钮 - 春日花园风格 */
.follow-btn {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: 2px solid var(--background-dark);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  /* 春日花园风格按钮 */
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
  font-family: var(--font-family);
}

.follow-btn:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, var(--primary-pink) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.5);
}

/* 攻略封面图 - 春日花园风格 */
.detail-image {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
}

.cover-img {
  width: 100%;
  height: auto;
  display: block;
}

/* 攻略内容 - 春日花园风格 */
.detail-content {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  line-height: 1.8;
  color: var(--text-primary);
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

/* 富文本编辑器生成的内容样式 */
.detail-content h1,
.detail-content h2,
.detail-content h3,
.detail-content h4,
.detail-content h5,
.detail-content h6 {
  margin: 20px 0 15px;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 1px 1px 0 #fff, -1px -1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

.detail-content h1 {
  font-size: 1.5rem;
}

.detail-content h2 {
  font-size: 1.35rem;
}

.detail-content h3 {
  font-size: 1.2rem;
}

.detail-content p {
  margin-bottom: 15px;
  text-align: justify;
}

.detail-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 20px 0;
  border: 2px solid var(--primary-pink);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
}

.detail-content ul,
.detail-content ol {
  margin: 15px 0;
  padding-left: 30px;
}

.detail-content li {
  margin-bottom: 8px;
}

.detail-content blockquote {
  border-left: 4px solid var(--primary-pink);
  padding-left: 15px;
  margin: 15px 0;
  font-style: italic;
  color: #666;
}

.detail-content code {
  background-color: var(--background-light);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  border: 1px solid var(--background-dark);
}

.detail-content pre {
  background-color: var(--background-light);
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 15px 0;
  border: 1px solid var(--background-dark);
}

.detail-content pre code {
  background: none;
  padding: 0;
  font-size: 0.85rem;
  border: none;
}

.detail-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.detail-content table th,
.detail-content table td {
  border: 1px solid var(--background-dark);
  padding: 8px;
  text-align: left;
}

.detail-content table th {
  background-color: var(--background-light);
  font-weight: 600;
  color: var(--text-primary);
}

/* 互动按钮 - 春日花园风格 */
.interaction-section {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 20px 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
}

.interaction-buttons {
  display: flex;
  gap: 30px;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 2px solid var(--primary-pink);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 16px;
  border-radius: 20px;
  /* 春日花园风格按钮 */
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

.interaction-btn:hover {
  background: linear-gradient(135deg, var(--background-dark) 0%, #f9a8d4 100%);
  color: var(--secondary-pink);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.interaction-btn i {
  font-size: 1.25rem;
  /* 春日花园风格图标 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
  color: var(--primary-pink);
}

/* 评论区 - 春日花园风格 */
.comments-section {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 25px;
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
}

.comments-title {
  margin: 0 0 25px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  /* 春日花园风格标题 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

/* 评论输入框 - 春日花园风格 */
.comment-input-section {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

/* 评论者头像 - 春日花园风格 */
.commenter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  /* 春日花园风格头像 */
  border: 2px solid var(--primary-pink);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  gap: 10px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 10px;
  border-radius: 25px;
  /* 春日花园风格边框 */
  border: 2px solid var(--primary-pink);
}

.comment-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  padding: 8px 15px;
  font-family: var(--font-family);
  color: var(--text-primary);
}

/* 评论提交按钮 - 春日花园风格 */
.comment-submit-btn {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: 2px solid var(--background-dark);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 春日花园风格按钮 */
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
  font-family: var(--font-family);
}

.comment-submit-btn:hover {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, var(--primary-pink) 100%);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.5);
}

/* 评论列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 加载评论状态 */
.loading-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 10px;
  color: var(--primary-pink);
  font-size: 1rem;
  font-family: var(--font-family);
}

.loading-comments i {
  font-size: 1.5rem;
  animation: spin 1s linear infinite;
  color: var(--primary-pink);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 无评论状态 */
.no-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 10px;
  color: #8e8e8e;
  font-size: 1rem;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border-radius: 10px;
  border: 2px dashed var(--background-dark);
  font-family: var(--font-family);
}

.no-comments i {
  font-size: 1.5rem;
  color: var(--primary-pink);
}

.comment-item {
  display: flex;
  gap: 15px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.commenter-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

.comment-date {
  font-size: 0.8rem;
  color: #8e8e8e;
}

.comment-text {
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 8px;
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

.comment-actions {
  display: flex;
  gap: 20px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 2px solid var(--primary-pink);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  /* 春日花园风格按钮 */
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
  text-shadow: 1px 1px 0 #fff;
  font-family: var(--font-family);
}

.comment-action-btn:hover {
  background: linear-gradient(135deg, var(--background-dark) 0%, #f9a8d4 100%);
  color: var(--secondary-pink);
}

/* 相关推荐 - 春日花园风格 */
.related-section {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 30px;
  /* 春日花园风格边框 */
  border: 4px solid var(--background-dark);
}

.related-title {
  margin: 0 0 25px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  /* 春日花园风格标题 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.related-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 春日花园风格卡片 */
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.related-card:hover {
  transform: translateY(-5px) rotate(1deg);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.related-image {
  width: 100%;
  padding-top: 60%; /* 5:3 宽高比 */
  position: relative;
  overflow: hidden;
  /* 春日花园风格图片边框 */
  border-bottom: 2px solid var(--background-dark);
}

.related-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 15px;
}

.related-title-small {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* 春日花园风格标题 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

.related-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #8e8e8e;
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
}

/* 响应式设计 - 重新定义断点 */
/* 手机端 (默认) */

/* 平板端 (768px 以上) */
@media (min-width: 768px) {
  .detail-header {
    padding: 30px;
  }
  
  .detail-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  .author-section {
    flex-direction: row;
    align-items: center;
    gap: 0;
    justify-content: space-between;
  }
  
  .detail-content {
    padding: 30px;
  }
  
  .interaction-section {
    padding: 20px 30px;
  }
  
  .interaction-buttons {
    gap: 30px;
  }
  
  .comments-section {
    padding: 30px;
  }
  
  .related-section {
    padding: 30px;
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
}

/* 电脑端 (1024px 以上) */
@media (min-width: 1024px) {
  .detail-title {
    font-size: 1.75rem;
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 25px;
  }
}

/* 大屏幕电脑 (1200px 以上) */
@media (min-width: 1200px) {
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
  }
}

/* 分享菜单样式 - 春日花园风格 */
.share-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 2px solid var(--background-dark);
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
  padding: 15px;
  width: 250px;
  z-index: 1000;
  margin-top: 10px;
  /* 春日花园风格边框 */
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3),
              0 0 0 2px var(--background-dark) inset;
}

.share-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.share-menu-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  /* 春日花园风格标题 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
  font-family: var(--font-family);
}

.share-close-btn {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 1px solid var(--primary-pink);
  font-size: 1.25rem;
  color: var(--primary-pink);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.share-close-btn:hover {
  background: linear-gradient(135deg, var(--background-dark) 0%, #f9a8d4 100%);
  color: var(--secondary-pink);
}

.share-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 2px solid var(--primary-pink);
  border-radius: 10px;
  padding: 12px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  /* 春日花园风格按钮 */
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
  font-family: var(--font-family);
}

.share-option:hover {
  background: linear-gradient(135deg, var(--background-dark) 0%, #f9a8d4 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.share-option i {
  font-size: 1.5rem;
  margin-bottom: 5px;
  /* 春日花园风格图标 */
  text-shadow: 1px 1px 0 #fff,
               -1px -1px 0 var(--primary-pink);
}

.share-option span {
  font-size: 0.85rem;
  color: var(--text-primary);
  /* 春日花园风格文字 */
  text-shadow: 1px 1px 0 #fff;
}

/* 社交媒体特定颜色 */
.share-option:nth-child(1) i { color: #07c160; }
.share-option:nth-child(2) i { color: #e6162d; }
.share-option:nth-child(3) i { color: var(--text-primary); }
.share-option:nth-child(4) i { color: #12b7f5; }

/* 小屏幕手机优化 (576px 以下) */
@media (max-width: 576px) {
  .container {
    width: 95%;
  }
  
  .detail-header {
    padding: 20px;
  }
  
  .detail-title {
    font-size: 1.25rem;
    margin-bottom: 15px;
  }
  
  .author-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .detail-content {
    padding: 20px;
  }
  
  .interaction-section {
    padding: 15px 20px;
  }
  
  .interaction-buttons {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .share-menu {
    width: 200px;
    right: -20px;
  }
  
  .comments-section {
    padding: 20px;
  }
  
  .related-section {
    padding: 20px;
  }
  
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .comment-input-section {
    gap: 10px;
  }
  
  .commenter-avatar {
    width: 35px;
    height: 35px;
  }
}
</style>
