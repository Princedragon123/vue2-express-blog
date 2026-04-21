<!-- 
=============================================================================
  BlogModal.vue - 博客详情弹窗组件（学习版）
=============================================================================

【组件职责】
  这是博客详情的弹窗组件，负责：
  1. 展示博客文章详细内容
  2. 点赞、收藏、评论功能
  3. 关注作者功能
  4. 分享功能
  5. 标签点击筛选

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. Props 父子组件通信：接收父组件传递的数据                              │
  │  2. $emit 子父组件通信：向父组件发送事件                                  │
  │  3. v-if 条件渲染：根据文章类型显示不同布局                               │
  │  4. watch 监听器：监听 props 变化                                        │
  │  5. computed 计算属性：派生数据                                          │
  │  6. async/await 异步操作                                                 │
  │  7. $set 响应式更新：Vue 2 的响应式陷阱                                  │
  │  8. 事件修饰符：@click.stop 阻止冒泡                                     │
  └─────────────────────────────────────────────────────────────────────────┘

【Props 说明】
  ┌──────────────────┬──────────────┬───────────────────────────────────────┐
  │  属性名           │  类型         │  说明                                  │
  ├──────────────────┼──────────────┼───────────────────────────────────────┤
  │  visible         │  Boolean     │  控制弹窗显示/隐藏                      │
  │  blog            │  Object      │  博客文章数据                          │
  │  isMobile        │  Boolean     │  是否为移动端                          │
  └──────────────────┴──────────────┴───────────────────────────────────────┘

【事件说明】
  - @close：关闭弹窗
  - @filter-by-tag：点击标签筛选

【面试常问】
  Q: 为什么用 @click.stop？
  A: 阻止事件冒泡。点击弹窗内容区域时，不触发外层 overlay 的关闭事件。

  Q: v-if 和 v-show 在弹窗中怎么选择？
  A: 弹窗用 v-if，因为弹窗不频繁切换，v-if 可以减少 DOM 节点。

  Q: 为什么要用 $set？
  A: Vue 2 无法检测到对象属性的新增/修改，$set 可以触发响应式更新。

=============================================================================
-->
<template>
  <div class="modal-overlay" @click="closeModal" v-if="visible">
    <div class="modal-container" :class="{ 'mobile-modal': isMobile, 'short-article': blog?.articleType === 'short' }" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeModal" :aria-label="'关闭' + (blog?.title || '文章')" tabindex="0">
        <span class="nav-icon">✕</span>
      </button>
      
      <!-- 通知提示 -->
      <div class="notification" :class="[notification.type, { 'show': notification.show }]">
        <span class="nav-icon">{{ notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️' }}</span>
        <span>{{ notification.message }}</span>
      </div>
      
      <!-- 长文章模式 - 知乎风格 -->
      <div v-if="!blog?.articleType || blog?.articleType === 'long'" class="modal-content long-article-content">
        <!-- 长文章头部 -->
        <div class="long-article-header">
          <!-- 作者信息 -->
          <div class="author-info">
            <img 
              :src="getAuthorAvatar(blog?.author)" 
              :alt="blog?.author?.username || '未知作者'" 
              class="author-avatar"
              @click="openUserProfile(blog?.author?.id || blog?.author?._id, blog?.author?.username)"
              style="cursor: pointer"
            >
            <div class="author-details">
              <span 
                class="author-name"
                @click="openUserProfile(blog?.author?.id || blog?.author?._id, blog?.author?.username)"
                style="cursor: pointer; text-decoration: underline"
              >{{ blog?.author?.username || '未知作者' }}</span>
              <span class="post-date">{{ blog?.date }}</span>
            </div>
            <button v-if="(blog?.author?.id || blog?.author?._id) !== (user?.id || user?._id) && user" class="follow-btn" :class="{ 'followed': isFollowing }" @click="toggleFollow">
              <span class="nav-icon" v-if="!isFollowing">👤+</span>
              <span class="nav-icon" v-else>👤✓</span>
              {{ isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
          
          <!-- 文章标题 -->
          <h2 class="article-title">{{ blog?.title }}</h2>
          
          <!-- 文章标签 -->
          <div class="article-meta">
            <div class="article-tags">
              <span v-for="(tag, index) in blog?.tags" :key="index" class="article-tag" @click="$emit('filter-by-tag', tag)">
                #{{ tag }}
              </span>
            </div>
          </div>
        </div>
        

        
        <!-- 文章内容 -->
        <div class="article-info">
          <!-- 文章正文 - 知乎风格 -->
          <div class="article-body zhihu-style">
            <p v-if="!blog?.content">这是一篇精彩的文章内容，展示了作者的独特见解和经验分享。</p>
            <p v-if="!blog?.content">通过图文并茂的方式，为读者呈现了详细的攻略和实用的技巧。</p>
            <p v-if="!blog?.content">感谢您的阅读和支持！</p>
            <div v-else v-html="processContentImages(blog.content)"></div>
          </div>
          
          <!-- 文章底部信息 -->
          <div class="article-footer zhihu-footer">
            <!-- 交互按钮 -->
            <InteractionSection 
              :likes="blog?.likes || 0"
              :comments="blog?.comments || 0"
              :bookmarks="blog?.bookmarks || 0"
              :is-liked="blog?.isLiked || false"
              :is-bookmarked="isBookmarked || false"
              :blog-id="blog?.id || blog?._id"
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
              :user="user"
              :comment-text="commentText"
              @submit-comment="submitComment"
              @submit-reply="submitReply"
              @delete-comment="deleteComment"
            />
          </div>
        </div>
      </div>
      
      <!-- 短文章模式 -->
      <div v-else-if="blog?.articleType === 'short'" class="modal-content short-article-content">
        <!-- 左侧媒体区域 -->
        <div class="short-article-media">
          <MediaCarousel 
            :mediaList="processedMediaFiles"
            :autoplay="true"
            :autoplay-interval="5000"
            :loop="true"
          />
        </div>
        
        <!-- 右侧内容区域 -->
        <div class="short-article-info">
          <!-- 作者信息 -->
          <div class="author-info">
            <img 
              :src="getAuthorAvatar(blog?.author)" 
              :alt="blog?.author?.username || '未知作者'" 
              class="author-avatar"
              @click="openUserProfile(blog?.author?.id || blog?.author?._id, blog?.author?.username)"
              style="cursor: pointer"
            >
            <div class="author-details">
              <span 
                class="author-name"
                @click="openUserProfile(blog?.author?.id || blog?.author?._id, blog?.author?.username)"
                style="cursor: pointer; text-decoration: underline"
              >{{ blog?.author?.username || '未知作者' }}</span>
              <span class="post-date">{{ blog?.date }}</span>
            </div>
            <button v-if="(blog?.author?.id || blog?.author?._id) !== (user?.id || user?._id) && user" class="follow-btn" :class="{ 'followed': isFollowing }" @click="toggleFollow">
              <span class="nav-icon" v-if="!isFollowing">👤+</span>
              <span class="nav-icon" v-else>👤✓</span>
              {{ isFollowing ? '已关注' : '关注' }}
            </button>
          </div>
          
          <!-- 文章标题 -->
          <h2 class="article-title">{{ blog?.title }}</h2>
          
          <!-- 文章内容 -->
          <div class="article-body">
            <p v-if="!blog?.shortContent">这是一篇精彩的短文章内容，展示了作者的独特见解和经验分享。</p>
            <div v-else>{{ blog.shortContent }}</div>
          </div>
          
          <!-- 位置信息 -->
          <div class="location-info" v-if="blog?.location">
            <span class="nav-icon">📍</span>
            <span>{{ blog.location }}</span>
          </div>
          
          <!-- 话题标签 -->
          <div class="article-tags">
            <span v-for="(tag, index) in blog?.hashtags" :key="index" class="article-tag" @click="$emit('filter-by-tag', tag)">
              #{{ tag }}
            </span>
          </div>
          
          <!-- 交互区域 -->
          <InteractionSection 
            :likes="blog?.likes || 0"
            :comments="blog?.comments || 0"
            :bookmarks="blog?.bookmarks || 0"
            :is-liked="blog?.isLiked || false"
            :is-bookmarked="isBookmarked || false"
            :blog-id="blog?.id || blog?._id"
            @like="likeBlog"
            @bookmark="bookmarkBlog"
            @open-share="openShareModal"
          />
          
          <!-- 评论区域 -->
          <CommentSection 
            :is-zhihu-style="false"
            :comments="comments"
            :is-loading-comments="isLoadingComments"
            :comment-error="commentError"
            :user="user"
            :comment-text="commentText"
            :article-author-id="blog?.author?._id"
            @update:commentText="commentText = $event"
            @submit-comment="(commentContent) => submitComment(commentContent)"
            @submit-reply="submitReply"
            @delete-comment="deleteComment"
          />
        </div>
      </div>
    </div>
    
    <!-- 分享模态框 -->
    <div class="share-modal-overlay" v-if="showShareModal" @click="closeShareModal">
      <div class="share-modal-container" @click.stop>
        <div class="share-modal-header">
          <h3>分享博客</h3>
          <button class="share-close-btn" @click="closeShareModal">
            <span class="nav-icon">✕</span>
          </button>
        </div>
        <div class="share-modal-content">
          <div class="share-blog-info">
            <img :src="blog?.image" :alt="blog?.title" class="share-blog-image">
            <div class="share-blog-details">
              <h4>{{ blog?.title }}</h4>
              <p class="share-blog-author">{{ blog?.author?.username || '未知作者' }}</p>
            </div>
          </div>
          <div class="share-friends-section">
            <h5>选择好友</h5>
            <div class="friends-list" v-if="followingUsers && followingUsers.length > 0">
              <div v-for="user in followingUsers" :key="user._id" class="friend-item" @click="selectFriend(user)">
                <img :src="getCurrentUserAvatar(user)" :alt="user.username" class="friend-avatar">
                <span class="friend-name">{{ user.username }}</span>
                <span class="friend-selected" v-if="selectedFriends.includes(user._id)"><span class="nav-icon">✓</span></span>
              </div>
            </div>
            <div v-else class="no-friends">
              <p>暂无关注的用户</p>
            </div>
          </div>
          <button class="share-btn" @click="shareBlog" :disabled="selectedFriends.length === 0">
            <span class="nav-icon">🔗</span>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ============================================================
// 组件导入区
// ============================================================
// 【学习重点】Vue 组件化开发
// 
// 【为什么要拆分组件？】
// 1. 单一职责：每个组件只做一件事
// 2. 复用性：CommentSection 可以在其他地方复用
// 3. 可维护性：修改评论功能只需要改 CommentSection
// ============================================================
import MediaCarousel from './MediaCarousel.vue';    // 媒体轮播组件
import CommentSection from './CommentSection.vue';  // 评论区域组件
import InteractionSection from './InteractionSection.vue'; // 交互按钮组件
import auth from '../utils/auth';                   // 认证工具
import { getAuthorAvatar } from '../utils/avatarUtils'; // 头像处理工具

export default {
  name: 'BlogModal',  // 组件名称（用于调试和递归组件）
  
  // ============================================================
  // components 注册区
  // ============================================================
  // 【学习重点】组件注册
  // 
  // 【两种注册方式】
  // 1. 全局注册：Vue.component('MyComponent', {...})
  // 2. 局部注册：在 components 中注册（推荐）
  // 
  // 【局部注册的优点】
  // - 按需加载，减少打包体积
  // - 依赖关系更清晰
  // ============================================================
  components: {
    MediaCarousel,
    CommentSection,
    InteractionSection
  },
  
  // ============================================================
  // props 属性区
  // ============================================================
  // 【学习重点】父子组件通信 - Props
  // 
  // 【作用】接收父组件传递的数据
  // 
  // 【特点】
  // - 单向数据流：子组件不能直接修改 props
  // - 需要定义类型和默认值
  // 
  // 【验证类型】
  // - String, Number, Boolean, Array, Object, Function, Symbol
  // ============================================================
  props: {
    // visible：控制弹窗显示/隐藏
    visible: {
      type: Boolean,    // 类型验证
      default: false    // 默认值
    },
    // blog：博客文章数据对象
    blog: {
      type: Object,     // 对象类型
      default: null     // 默认为空
    },
    // isMobile：是否为移动端
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  
  // ============================================================
  // emits 事件声明区
  // ============================================================
  // 【学习重点】Vue 3 的 emits 选项（Vue 2.7+ 也支持）
  // 
  // 【作用】声明组件会触发的自定义事件
  // 
  // 【好处】
  // - 文档化：让其他开发者知道组件会触发哪些事件
  // - 验证：可以对事件参数进行验证
  // ============================================================
  emits: ['close', 'filter-by-tag'],
  
  // ============================================================
  // data 数据区
  // ============================================================
  // 【学习重点】组件的响应式数据
  // 
  // 【特点】
  // - 必须是函数，返回数据对象（防止组件复用时数据共享）
  // - 数据变化会触发视图更新
  // 
  // 【与 props 的区别】
  // - props：外部传入，只读
  // - data：内部定义，可修改
  // 
  // 【响应式原理】
  // Vue 2 使用 Object.defineProperty 劫持数据
  // 当数据变化时，自动触发视图更新
  // ============================================================
  data() {
    return {
      // ============================================================
      // 分享功能相关数据
      // ============================================================
      // 【showShareModal】
      // 类型：Boolean
      // 初始值：false
      // 作用：控制分享弹窗的显示/隐藏
      // 使用场景：用户点击分享按钮时设为 true，关闭时设为 false
      // ============================================================
      showShareModal: false,
      
      // 【followingUsers】
      // 类型：Array
      // 初始值：[]
      // 作用：存储当前用户关注的好友列表
      // 数据结构：[{ _id: '用户ID', username: '用户名', avatar: '头像URL' }, ...]
      // 使用场景：分享文章时选择要分享的好友
      // ============================================================
      followingUsers: [],
      
      // 【selectedFriends】
      // 类型：Array
      // 初始值：[]
      // 作用：存储用户选中的要分享的好友ID列表
      // 数据结构：['用户ID1', '用户ID2', ...]
      // 使用场景：分享时记录选中的好友，提交时发送给后端
      // ============================================================
      selectedFriends: [],
      
      // ============================================================
      // 用户状态相关数据
      // ============================================================
      // 【user】
      // 类型：Object | null
      // 初始值：null
      // 作用：存储当前登录用户的信息
      // 数据结构：{ _id: '用户ID', username: '用户名', avatar: '头像', ... }
      // 使用场景：判断用户是否登录、显示用户信息、权限判断
      // 注意：null 表示未登录或未获取到用户信息
      // ============================================================
      user: null,
      
      // 【isFollowing】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记当前用户是否已关注文章作者
      // 可能的值：true（已关注）、false（未关注）
      // 使用场景：控制"关注/已关注"按钮的显示状态
      // 更新时机：打开文章时检查，点击关注按钮后更新
      // ============================================================
      isFollowing: false,
      
      // 【isBookmarked】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记当前用户是否已收藏该文章
      // 可能的值：true（已收藏）、false（未收藏）
      // 使用场景：控制收藏按钮的显示状态（实心/空心图标）
      // 更新时机：打开文章时检查，点击收藏按钮后更新
      // ============================================================
      isBookmarked: false,
      
      // ============================================================
      // 评论功能相关数据
      // ============================================================
      // 【commentText】
      // 类型：String
      // 初始值：''
      // 作用：存储用户输入的评论内容
      // 使用场景：v-model 双向绑定到评论输入框
      // 注意：提交评论后需要清空此值
      // ============================================================
      commentText: '',
      
      // 【comments】
      // 类型：Array
      // 初始值：[]
      // 作用：存储文章的评论列表
      // 数据结构：[{ _id, content, author, createdAt, replies: [...] }, ...]
      // 使用场景：渲染评论列表、添加新评论后更新
      // ============================================================
      comments: [],
      
      // 【isLoadingComments】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记评论是否正在加载中
      // 使用场景：显示加载动画、防止重复请求
      // 注意：请求开始设为 true，请求结束设为 false
      // ============================================================
      isLoadingComments: false,
      
      // 【commentError】
      // 类型：String | null
      // 初始值：null
      // 作用：存储评论加载失败的错误信息
      // 使用场景：显示错误提示
      // 注意：null 表示无错误，有错误时存储错误消息字符串
      // ============================================================
      commentError: null,
      
      // ============================================================
      // 回复功能相关数据
      // ============================================================
      // 【replyingTo】
      // 类型：Object | null
      // 初始值：null
      // 作用：存储当前正在回复的评论对象
      // 数据结构：{ _id, content, author, ... }
      // 使用场景：显示回复输入框、提交回复时关联父评论
      // 注意：null 表示当前没有在回复任何评论
      // ============================================================
      replyingTo: null,
      
      // 【replyText】
      // 类型：String
      // 初始值：''
      // 作用：存储用户输入的回复内容
      // 使用场景：v-model 双向绑定到回复输入框
      // 注意：提交回复后需要清空此值
      // ============================================================
      replyText: '',
      
      // ============================================================
      // 通知提示相关数据
      // ============================================================
      // 【notification】
      // 类型：Object
      // 作用：存储操作结果的通知提示信息
      // 使用场景：点赞、收藏、关注等操作后显示结果
      // 
      // 【notification.show】
      // 类型：Boolean
      // 初始值：false
      // 作用：控制通知提示的显示/隐藏
      // 
      // 【notification.message】
      // 类型：String
      // 初始值：''
      // 作用：通知提示的消息内容
      // 示例：'关注成功'、'操作失败，请重试'
      // 
      // 【notification.type】
      // 类型：String
      // 初始值：'success'
      // 可能的值：'success'（成功-绿色）、'error'（错误-红色）、'info'（信息-蓝色）
      // 作用：决定通知提示的样式颜色
      // ============================================================
      notification: {
        show: false,            // 是否显示通知
        message: '',            // 通知消息内容
        type: 'success'         // 通知类型：success/error/info
      }
    };
  },
  
  // ============================================================
  // computed 计算属性区
  // ============================================================
  // 【学习重点】计算属性
  // 
  // 【特点】
  // - 基于依赖缓存，依赖不变就不重新计算
  // - 必须有返回值
  // 
  // 【与 methods 的区别】
  // - computed：有缓存，适合派生数据
  // - methods：每次调用都执行
  // 
  // 【使用场景】
  // - 格式化数据
  // - 过滤/排序列表
  // - 组合多个数据
  // ============================================================
  computed: {
    // 处理媒体文件URL
    processedMediaFiles() {
      if (!this.blog?.mediaFiles) return [];
      
      return this.blog.mediaFiles.map(media => {
        let mediaUrl = media.url;
        if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          // 检查是否已经包含 /static/uploads
          if (!mediaUrl.startsWith('/static/uploads')) {
            mediaUrl = `/static/uploads/${mediaUrl.replace(/^\/+/, '')}`;
          }
        }
        return {
          url: mediaUrl,
          mediaType: media.mediaType || 'image'
        };
      });
    }
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  // 【学习重点】组件方法定义
  // 
  // 【特点】
  // - 可以通过 this 访问组件实例
  // - 可以在模板中通过 @click="xxx" 调用
  // - 可以被其他方法调用
  // ============================================================
  methods: {
    // ============================================================
    // 关闭弹窗
    // ============================================================
    // 【学习重点】$emit 子父通信
    // 
    // 【流程】
    // 1. 子组件调用 this.$emit('close')
    // 2. 父组件监听 @close="closeModal"
    // 3. 父组件执行 closeModal 方法
    // 
    // 【为什么用 $emit 而不是直接修改 props？】
    // - Vue 是单向数据流
    // - 子组件不能直接修改 props
    // - 必须通过事件通知父组件修改
    // ============================================================
    closeModal() {
      this.$emit('close');  // 触发 close 事件，通知父组件
    },
    
    // ============================================================
    // 键盘事件处理
    // ============================================================
    // 【学习重点】键盘事件监听
    // 
    // 【应用场景】
    // - ESC 关闭弹窗
    // - Enter 提交表单
    // - 方向键导航
    // ============================================================
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    },
    
    // 打开用户个人资料页面
    openUserProfile(userId, username) {
      if (userId) {
        // 在新窗口中打开用户个人资料页面
        window.open(`/profile/${userId}`, '_blank', 'noopener,noreferrer');
      }
    },
    
    // ============================================================
    // 初始化用户信息
    // ============================================================
    // 【学习重点】异步初始化流程
    // 
    // 【流程】
    // 1. 检查登录状态
    // 2. 获取用户信息
    // 3. 检查关注状态
    // 4. 检查收藏状态
    // 
    // 【为什么返回 Promise.resolve()？】
    // 确保调用方可以使用 await 等待初始化完成
    // ============================================================
    async initUserInfo() {
      // 获取用户信息
      if (auth.isLoggedIn()) {
        try {
          const response = await this.$http.auth.getCurrentUser();
          if (response.success && response.data) {
            this.user = response.data;
            // 检查是否已关注作者
            await this.checkFollowStatus();
            // 检查是否已收藏文章
            await this.checkBookmarkStatus();
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
        }
      }
      return Promise.resolve();
    },
    
    // ============================================================
    // 检查关注状态
    // ============================================================
    // 【学习重点】状态检查
    // 
    // 【作用】进入文章详情时，检查是否已关注作者
    // 【场景】显示"关注"或"已关注"按钮状态
    // ============================================================
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
    
    // ============================================================
    // 检查收藏状态
    // ============================================================
    // 【学习重点】$set 响应式更新
    // 
    // 【为什么要用 $set？】
    // Vue 2 无法检测到对象属性的新增
    // this.blog.isBookmarked = true 不会触发视图更新
    // 必须用 this.$set(this.blog, 'isBookmarked', true)
    // 
    // 【Vue 3 的变化】
    // Vue 3 使用 Proxy，可以直接添加属性
    // ============================================================
    async checkBookmarkStatus() {
      const blogId = this.blog?.id || this.blog?._id;
      
      if (!auth.isLoggedIn() || !blogId) return;
      
      try {
        const response = await this.$http.blogs.checkBookmarkStatus(blogId);
        if (response.success) {
          this.isBookmarked = response.data.isBookmarked;
          // 【关键】使用 $set 确保响应式更新
          if (this.blog) {
            this.$set(this.blog, 'isBookmarked', response.data.isBookmarked);
          }
        }
      } catch (error) {
        console.error('检查收藏状态失败:', error);
      }
    },
    
    // ============================================================
    // 切换关注状态
    // ============================================================
    // 【学习重点】三元表达式 + 动态方法调用
    // 
    // 【流程】
    // 1. 检查登录状态
    // 2. 根据当前状态选择 API 方法
    // 3. 更新本地状态
    // 4. 显示操作结果
    // 
    // 【三元表达式的妙用】
    // this.isFollowing ? 'unfollow' : 'follow'
    // 动态决定调用哪个 API 方法
    // ============================================================
    async toggleFollow() {
      const authorId = this.blog?.author?.id || this.blog?.author?._id;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token || !authorId) {
        this.showNotification('请先登录', 'error');
        return;
      }
      
      try {
        // 【关键】根据当前状态选择不同的 API
        const response = this.isFollowing 
          ? await this.$http.users.unfollow(authorId)   // 已关注 → 取消关注
          : await this.$http.users.follow(authorId);    // 未关注 → 关注
        
        if (response && response.success) {
          this.isFollowing = !this.isFollowing;  // 切换状态
          // 显示操作成功的提示
          this.showNotification(this.isFollowing ? '关注成功' : '取消关注成功', 'success');
        } else {
          this.showNotification(response?.message || '操作失败', 'error');
        }
      } catch (error) {
        console.error('关注操作失败:', error);
        this.showNotification('操作失败，请重试', 'error');
      }
    },
    
    // ============================================================
    // 收藏/取消收藏博客
    // ============================================================
    // 【学习重点】收藏功能的完整实现
    // 
    // 【流程】
    // 1. 检查登录状态
    // 2. 获取当前收藏状态
    // 3. 调用对应的 API
    // 4. 更新本地数据
    // 5. 显示操作结果
    // ============================================================
    async bookmarkBlog(blogId) {
      const id = blogId || this.blog?._id || this.blog?.id;
      
      if (!auth.isLoggedIn() || !id) {
        this.showNotification('请先登录', 'error');
        return;
      }
      
      try {
        // 获取当前收藏状态
        const isCurrentlyBookmarked = this.isBookmarked || this.blog?.isBookmarked || false;
        // 【关键】动态调用 bookmark 或 unbookmark
        const result = await this.$http.blogs[isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'](id);
        
        if (result.success) {
          // 更新本地数据
          this.isBookmarked = !isCurrentlyBookmarked;
          this.$set(this.blog, 'isBookmarked', this.isBookmarked);
          this.$set(this.blog, 'bookmarks', result.data.bookmarks);
          
          // 显示操作成功的提示
          this.showNotification(this.isBookmarked ? '收藏成功' : '取消收藏成功', 'success');
        } else {
          this.showNotification(result.message || '操作失败', 'error');
          // 操作失败后，重新检查收藏状态
          await this.checkBookmarkStatus();
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        this.showNotification('操作失败，请重试', 'error');
        // 操作失败后，重新检查收藏状态
        await this.checkBookmarkStatus();
      }
    },
    
    // 显示通知
    showNotification(message, type = 'success') {
      this.notification = {
        show: true,
        message: message,
        type: type
      };
      
      // 3秒后自动关闭通知
      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    },
    openShareModal() {
      this.loadFollowingUsers();
      this.selectedFriends = [];
      this.showShareModal = true;
    },
    closeShareModal() {
      this.showShareModal = false;
    },
    async loadFollowingUsers() {
      try {
        const response = await this.$http.users.getFollowing('current');
        if (response.success) {
          this.followingUsers = response.data;
        }
      } catch (error) {
        console.error('加载关注用户失败:', error);
      }
    },
    selectFriend(user) {
      const index = this.selectedFriends.indexOf(user._id);
      if (index > -1) {
        this.selectedFriends.splice(index, 1);
      } else {
        this.selectedFriends.push(user._id);
      }
    },
    async shareBlog() {
      if (this.selectedFriends.length === 0) return;
      
      try {
        const response = await this.$http.messages.share({
          recipients: this.selectedFriends,
          blogId: this.blog._id,
          blogTitle: this.blog.title,
          blogAuthor: this.blog.author?.username || '未知作者'
        });
        
        if (response.success) {
          this.showNotification('分享成功！', 'success');
          this.closeShareModal();
        } else {
          this.showNotification('分享失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('分享失败:', error);
        this.showNotification('分享失败，请重试', 'error');
      }
    },
    
    // 加载评论列表
    async loadComments() {
      const blogId = this.blog?.id || this.blog?._id;
      if (!blogId) return;
      
      this.isLoadingComments = true;
      this.commentError = null;
      
      try {
        const response = await this.$http.blogs.getComments(blogId);
        
        console.log('📝 评论响应数据:', response);
        
        if (response.success) {
          // 为每个评论添加响应式的回复相关属性
          this.comments = (response.data || []).map(comment => {
            console.log('💬 原始评论数据:', comment);
            console.log('👤 评论 author 字段:', comment.author);
            
            // 为回复添加响应式属性
            if (comment.replies) {
              comment.replies = comment.replies.map(reply => {
                console.log('🔁 回复数据:', reply);
                console.log('👤 回复 author 字段:', reply.author);
                return {
                  ...reply,
                  isReplying: false,
                  replyText: ''
                };
              });
            }
            // 使用 Vue 的响应式方法添加属性
            return {
              ...comment,
              isReplying: false,
              replyText: ''
            };
          });
        } else {
          // 不显示错误信息，保持界面干净
          this.comments = [];
        }
      } catch (error) {
        console.error('加载评论失败:', error);
        // 不显示错误信息，保持界面干净
        this.comments = [];
      } finally {
        this.isLoadingComments = false;
      }
    },
    
    // 提交评论
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
      
      if (!auth.isLoggedIn()) {
        this.showNotification('请先登录后再评论', 'warning');
        return;
      }
      
      try {
        const response = await this.$http.blogs.createComment(blogId, {
          content: commentContent.trim()
        });
        
        if (response.success) {
          // 清空评论输入框
          this.commentText = '';
          // 重新加载评论列表
          await this.loadComments();
        } else {
          this.showNotification('评论失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('提交评论失败:', error);
        this.showNotification('评论失败，请重试', 'error');
      }
    },
    
    // 提交回复
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
      
      if (!auth.isLoggedIn()) {
        this.showNotification('请先登录后再回复', 'warning');
        return;
      }
      
      try {
        // 构建请求数据
        const requestData = {
          content: comment.replyText.trim()
        };
        
        // 如果是回复的回复，需要指定父评论ID
        if (parentComment) {
          // 回复的回复，父评论是原始评论
          requestData.parentId = parentComment._id.toString();
          // 同时指定回复的目标用户
          requestData.replyTo = comment.author?.id || comment.author?._id;
        } else {
          // 直接回复评论
          requestData.parentId = comment._id.toString();
        }
        
        const response = await this.$http.blogs.createComment(blogId, requestData);
        
        if (response.success) {
          // 清空回复输入框并关闭回复状态
          comment.replyText = '';
          comment.isReplying = false;
          // 重新加载评论列表
          await this.loadComments();
        } else {
          this.showNotification('回复失败: ' + (response.message || '未知错误'), 'error');
        }
      } catch (error) {
        console.error('提交回复失败:', error);
        this.showNotification('回复失败，请重试: ' + (error.message || '未知错误'), 'error');
      }
    },
    
    // 检查用户是否已经点赞过博客
    async checkLikeStatus() {
      if (!this.blog || !auth.isLoggedIn()) return;
      
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
    
    // 点赞/取消点赞博客
    async likeBlog(blogId) {
      if (!this.blog) return;
      
      const id = blogId || this.blog._id || this.blog.id;
      if (!id) return;
      
      try {
        const isCurrentlyLiked = this.blog.isLiked || false;
        const result = await this.$http.blogs[isCurrentlyLiked ? 'unlike' : 'like'](id);
        
        if (result.success) {
          // 更新本地数据
          this.$set(this.blog, 'likes', result.data.likes);
          this.$set(this.blog, 'isLiked', !isCurrentlyLiked);
        } else {
          console.error('操作失败:', result.message);
          // 操作失败后，重新检查点赞状态
          this.checkLikeStatus();
        }
      } catch (error) {
        console.error('操作失败:', error);
        // 操作失败后，重新检查点赞状态
        this.checkLikeStatus();
      }
    },
    
    // 处理文章内容中的图片路径
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
        return `<img src="${newSrc}" style="max-width: 100%; height: auto;"`;
      });
      
      // 移除内容中可能存在的图片路径文本
      processedContent = processedContent.replace(/\(\/static\/uploads\/[^)]+\)/g, '');
      
      return processedContent;
    },
    
    // 添加到浏览历史
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
    
    // 获取作者头像URL
    getAuthorAvatar(author, size = 60) {
      return getAuthorAvatar(author, size);
    },
    
    // 获取评论作者头像URL
    getCommentAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    
    // 获取当前用户头像URL
    getCurrentUserAvatar(user, size = 40) {
      return getAuthorAvatar(user, size);
    },
    
    // 删除评论
    async deleteComment(commentId) {
      if (!commentId) return;
      
      if (!confirm('确定要删除这条评论吗？')) {
        return;
      }
      
      try {
        const response = await this.$http.blogs.deleteComment(commentId);
        
        if (response.success) {
          this.showNotification('删除成功', 'success');
          // 重新加载评论列表
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
  
  // ============================================================
  // watch 监听器
  // ============================================================
  // 【学习重点】监听 props 变化
  // 
  // 【为什么需要监听 blog？】
  // - props 是外部传入的，可能会变化
  // - 当用户切换文章时，blog 会更新
  // - 需要重新检查关注状态、收藏状态、加载评论
  // 
  // 【deep: true 的作用】
  // - 深度监听对象内部变化
  // - 如果只监听 blog 本身，内部属性变化不会触发
  // - deep: true 会监听所有嵌套属性
  // 
  // 【性能注意】
  // - deep 监听会遍历对象所有属性
  // - 大对象会影响性能，谨慎使用
  // ============================================================
  watch: {
    // 监听blog属性变化，当blog数据更新时重新检查关注状态和加载评论
    blog: {
      handler(newBlog) {
        if (newBlog) {
          if (this.user) {
            this.checkFollowStatus();    // 检查是否关注作者
            this.checkLikeStatus();      // 检查是否点赞
            this.checkBookmarkStatus();  // 检查是否收藏
          }
          this.loadComments();           // 加载评论列表
          // 添加到浏览历史
          this.addToHistory();
        }
      },
      deep: true  // 【重要】深度监听对象内部变化
    }
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  // 【学习重点】组件挂载后的初始化
  // 
  // 【执行时机】DOM 挂载完成后执行
  // 
  // 【初始化流程】
  // 1. 添加键盘事件监听（ESC 关闭弹窗）
  // 2. 初始化用户信息
  // 3. 检查点赞状态
  // 4. 加载评论列表
  // 
  // 【Promise.then 的使用】
  // initUserInfo() 返回 Promise
  // .then() 在初始化完成后执行后续操作
  // ============================================================
  mounted() {
    // 添加键盘事件监听（ESC 关闭弹窗）
    document.addEventListener('keydown', this.handleKeydown);
    // 初始化用户信息
    this.initUserInfo().then(() => {
      // 初始化用户信息后检查点赞状态
      this.checkLikeStatus();
    });
    // 加载评论列表
    this.loadComments();
  },
  
  // ============================================================
  // beforeUnmount 生命周期钩子
  // ============================================================
  // 【学习重点】组件销毁前的清理工作
  // 
  // 【为什么要移除事件监听？】
  // - 全局事件监听不会自动移除
  // - 组件销毁后监听器仍然存在
  // - 可能导致内存泄漏和错误
  // 
  // 【Vue 2 vs Vue 3】
  // - Vue 2: beforeDestroy
  // - Vue 3: beforeUnmount
  // ============================================================
  beforeUnmount() {
    // 移除键盘事件监听，防止内存泄漏
    document.removeEventListener('keydown', this.handleKeydown);
  }
}
</script>

<style scoped>
/* 模态框遮罩层 */
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

/* 通知提示 */
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

.notification i {
  font-size: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* PC端模态框容器 */
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
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  box-sizing: border-box;
}

/* 隐藏WebKit浏览器的滚动条 */
.modal-container::-webkit-scrollbar {
  display: none;
}

/* 短文章模态框容器 */
.modal-container.short-article {
  max-width: 1100px;
  max-height: 95vh;
  padding: 30px;
}

/* 隐藏WebKit浏览器的滚动条 */
.modal-container::-webkit-scrollbar {
  display: none;
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 移动端模态框容器 */
.mobile-modal {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  overflow-y: auto;
  padding: 20px;
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏WebKit浏览器的滚动条 */
.mobile-modal::-webkit-scrollbar {
  display: none;
}

/* 隐藏移动端模态框的WebKit滚动条 */
.mobile-modal::-webkit-scrollbar {
  display: none;
}

/* 长文章内容容器 - 知乎风格 */
.modal-content.long-article-content {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: none;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
}

/* 长文章头部区域 */
.long-article-header {
  margin-bottom: 30px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;
}

/* 长文章图片区域 */
.modal-content.long-article-content .modal-image {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 30px;
}

/* 长文章内容区域 */
.modal-content.long-article-content .article-info {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  /* 隐藏滚动条但保持可滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  box-sizing: border-box;
}

/* 隐藏WebKit浏览器的滚动条 */
.modal-content.long-article-content .article-info::-webkit-scrollbar {
  display: none;
}

/* 上部内容区域 */
.article-header {
  margin-bottom: 20px;
}

/* 下部评论区域 */
.article-footer {
  margin-top: auto;
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

/* 知乎风格文章正文 */
.article-body.zhihu-style {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 40px;
}

.article-body.zhihu-style p {
  margin-bottom: 16px;
  text-align: justify;
}

.article-body.zhihu-style h1,
.article-body.zhihu-style h2,
.article-body.zhihu-style h3 {
  margin: 24px 0 16px 0;
  font-weight: 600;
  color: #1a1a1a;
}

.article-body.zhihu-style h1 {
  font-size: 24px;
}

.article-body.zhihu-style h2 {
  font-size: 20px;
}

.article-body.zhihu-style h3 {
  font-size: 18px;
}

.article-body.zhihu-style img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* 响应式图片调整 */
@media (max-width: 768px) {
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
  }
}

@media (max-width: 480px) {
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
  }
}

/* 知乎风格交互按钮 */
.interaction-buttons.zhihu-interaction {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 30px;
}

.interaction-btn.zhihu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px;
  border: none;
  background: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.interaction-btn.zhihu-btn:hover {
  color: #0077cc;
  transform: translateY(-2px);
}

.interaction-btn.zhihu-btn i {
  font-size: 20px;
}

/* 知乎风格评论区域 */
.comments-section.zhihu-comments {
  margin-top: 30px;
}

.comments-section.zhihu-comments h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.comment-item.zhihu-comment {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item.zhihu-comment:last-child {
  border-bottom: none;
}

.reply-btn.zhihu-reply {
  color: #0077cc;
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  margin-top: 8px;
}

.reply-btn.zhihu-reply:hover {
  text-decoration: underline;
}

/* 知乎风格评论输入框 */
.comment-input-section.zhihu-comment-input {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 知乎风格文章底部 */
.article-footer.zhihu-footer {
  margin-top: 40px;
}

/* 长文章标题样式 */
.long-article-header .article-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 20px 0 16px 0;
  line-height: 1.3;
}

/* 长文章作者信息 */
.long-article-header .author-info {
  margin-bottom: 20px;
}

/* 响应式设计 - 长文章 */
@media (max-width: 768px) {
  /* 长文章响应式布局 */
  .modal-content.long-article-content {
    flex-direction: column;
    height: auto;
    max-height: none;
    padding: 15px;
  }
  
  .modal-content.long-article-content .modal-image {
    width: 100%;
    max-height: 300px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .modal-content.long-article-content .article-info {
    flex: none;
    padding: 0;
    max-width: 100%;
  }
  
  /* 移动端长文章头部 */
  .long-article-header {
    max-width: 100%;
    padding: 0 10px;
  }
  
  /* 移动端长文章标题 */
  .long-article-header .article-title {
    font-size: 24px;
  }
  
  /* 移动端知乎风格正文 */
  .article-body.zhihu-style {
    font-size: 15px;
    line-height: 1.7;
    padding: 0 10px;
  }
  
  /* 移动端图片调整 */
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }
}

/* 小屏幕手机响应式设计 */
@media (max-width: 480px) {
  /* 小屏幕长文章布局 */
  .modal-content.long-article-content {
    padding: 10px;
  }
  
  /* 小屏幕长文章头部 */
  .long-article-header {
    padding: 0 8px;
  }
  
  /* 小屏幕长文章标题 */
  .long-article-header .article-title {
    font-size: 20px;
  }
  
  /* 小屏幕知乎风格正文 */
  .article-body.zhihu-style {
    font-size: 14px;
    line-height: 1.6;
    padding: 0 8px;
  }
  
  /* 小屏幕图片调整 */
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 12px 0;
  }
}

/* 短文章内容容器 */
.modal-content.short-article-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 80vh;
  max-height: 800px;
}

/* 短文章媒体区域 */
.short-article-media {
  height: 100%;
  position: relative;
  overflow: hidden;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  margin-left: 10px;
}

/* 短文章信息区域 */
.short-article-info {
  padding: 25px;
  display: flex;
  flex-direction: column;
}

/* 位置信息 */
.location-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
  gap: 6px;
}

.location-info i {
  font-size: 14px;
}

/* 响应式设计 - 短文章 */
@media (max-width: 768px) {
  /* 短文章响应式布局 */
  .modal-content.short-article-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: 90vh;
    max-height: none;
  }
  
  .short-article-media {
    height: 40vh;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  
  .short-article-info {
    height: 50vh;
  }
}

/* 关闭按钮 */
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

/* 移动端关闭按钮位置调整 */
.mobile-modal .close-btn {
  top: 15px;
  left: 15px;
  right: auto;
}

/* 模态框内容 */
.modal-content {
  display: flex;
  flex-direction: column;
}

/* 文章图片 */
.modal-image {
  width: 100%;
  overflow: hidden;
}

.article-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

/* 长文章封面图片容器 */
.modal-content.long-article-content .modal-image {
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 30px;
}

/* 文章信息 */
.article-info {
  padding: 25px;
}

/* 移动端文章信息内边距 */
.mobile-modal .article-info {
  padding: 20px;
}

.article-category {
  display: inline-block;
  background-color: #ff6b9d;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.article-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.3;
}

/* 移动端标题字体大小 */
.mobile-modal .article-title {
  font-size: 20px;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid #ff6b9d;
}

.author-details {
  display: flex;
  flex-direction: column;
  margin-right: auto;
  min-width: 120px;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.post-date {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* 关注按钮 */
.follow-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #ff6b9d;
  background-color: white;
  color: #ff6b9d;
}

.follow-btn:hover:not(.followed) {
  background-color: #ff6b9d;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
}

.follow-btn.followed {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.follow-btn.followed:hover {
  background-color: #059669;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.follow-btn:active {
  transform: translateY(0);
}

/* 文章标签 */
.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.article-tag {
  background-color: #f3e5f5;
  color: #8e24aa;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
}

.article-tag:hover {
  background-color: #e1bee7;
  transform: translateY(-1px);
}

/* 文章正文 */
.article-body {
  margin-bottom: 24px;
  line-height: 1.7;
  color: #4b5563;
}

.article-body p {
  margin-bottom: 16px;
}

/* 交互区域 */
.interaction-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.interaction-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.interaction-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.interaction-btn:hover {
  background-color: #f3e5f5;
  color: #ff6b9d;
  transform: translateY(-2px);
}

.interaction-btn:active {
  transform: translateY(0);
}

.interaction-btn i {
  font-size: 16px;
}

.interaction-btn i.liked {
  color: #ff6b9d;
}

.interaction-btn i.bookmarked {
  color: #faad14;
}

/* 评论输入框 */
.comment-input-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.comment-input-container {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #f9fafb;
  padding: 12px;
  border-radius: 25px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.comment-input-container:focus-within {
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  outline: none;
  font-family: inherit;
}

.comment-input::placeholder {
  color: #9ca3af;
}

.send-comment-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #ff6b9d;
  border: none;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-comment-btn:hover:not(:disabled) {
  background-color: #ff8fab;
  transform: scale(1.05);
}

.send-comment-btn:active {
  transform: scale(0.95);
}

.send-comment-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

/* 评论操作按钮 */
.comment-actions {
  margin-top: 8px;
}

.reply-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.reply-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

/* 回复用户头像 */
.reply-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

/* 回复输入区域 */
.reply-input-section {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.reply-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s ease;
}

.reply-input:focus {
  border-color: #ff69b4;
  box-shadow: 0 0 0 2px rgba(255, 105, 180, 0.1);
}

.send-reply-btn {
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-reply-btn:hover:not(:disabled) {
  background-color: #ff1493;
  transform: scale(1.05);
}

.send-reply-btn:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

.cancel-reply-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cancel-reply-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

/* 回复列表样式 */
.replies-list {
  margin-top: 12px;
  padding-left: 40px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.reply-author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 2px;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.reply-date {
  font-size: 11px;
  color: #999;
}

.reply-text {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.reply-date {
  font-size: 10px;
  color: #999;
}

.reply-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 评论区域样式 */
.comments-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 12px;
}

.comment-author-avatar {
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-date {
  font-size: 12px;
  color: #9ca3af;
}

.comment-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.loading-comments {
  margin: 15px 0;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.comment-error {
  margin: 15px 0;
  padding: 12px;
  background-color: #fee2e2;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  text-align: center;
}

/* 媒体查询 - 移动端适配 */
@media (max-width: 768px) {
  .modal-container {
    width: 100% !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
  
  .article-title {
    font-size: 20px;
  }
  
  .article-info {
    padding: 20px;
  }
  
  .close-btn {
    top: 15px;
    left: 15px;
    right: auto;
  }
}

/* 媒体查询 - PC端适配 */
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

/* 分享模态框样式 */
.share-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

.share-modal-container {
  background-color: #ffffff;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.share-modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.share-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.share-close-btn:hover {
  background-color: #f3f4f6;
  color: #333;
}

.share-modal-content {
  padding: 25px;
}

.share-blog-info {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.share-blog-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
}

.share-blog-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.share-blog-details h4 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.share-blog-author {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.share-friends-section h5 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px 0;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  max-height: 300px;
  overflow-y: auto;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.friend-item:hover {
  background-color: #f3f4f6;
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.friend-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.friend-selected {
  color: #10b981;
  font-size: 18px;
}

.no-friends {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.share-btn {
  width: 100%;
  background-color: #ff6b9d;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.share-btn:hover:not(:disabled) {
  background-color: #ff8fab;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.4);
}

.share-btn:active:not(:disabled) {
  transform: translateY(0);
}

.share-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .share-modal-container {
    width: 95%;
    max-height: 90vh;
  }
  
  .share-modal-header {
    padding: 15px 20px;
  }
  
  .share-modal-content {
    padding: 20px;
  }
  
  .share-blog-info {
    gap: 12px;
  }
  
  .share-blog-image {
    width: 70px;
    height: 70px;
  }
}

/* 回复标识样式 */
.reply-to {
  color: #999;
  font-size: 13px;
}

.reply-to-user {
  color: #0084ff;
  font-weight: 500;
}


</style>