<!-- 
=============================================================================
  Blog.vue - 博客首页组件（学习版·列表渲染知识点）
=============================================================================

【组件职责】
  这是博客系统的核心页面，负责：
  1. 展示博客文章列表
  2. 分类筛选（游戏、旅游、美食等）
  3. 文章类型筛选（长文章、短文章）
  4. 搜索功能
  5. 下拉刷新（移动端）

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. Vue 生命周期：created、mounted、beforeDestroy                       │
  │  2. 数据绑定：v-model、v-for、v-if、v-else                              │
  │  3. 事件处理：@click、@touchstart 等                                    │
  │  4. 计算属性：computed                                                  │
  │  5. 监听器：watch                                                       │
  │  6. 异步请求：async/await                                               │
  │  7. 组件通信：props、$emit                                              │
  │  8. 响应式设计：isMobile 检测                                           │
  └─────────────────────────────────────────────────────────────────────────┘

【数据流向】
  用户操作 → 调用方法 → 发送HTTP请求 → 后端处理 → 返回数据 → 更新视图

【关键方法说明】
  ┌──────────────────────┬────────────────────────────────────────────────┐
  │  方法名               │  功能                                          │
  ├──────────────────────┼────────────────────────────────────────────────┤
  │  fetchBlogs()        │  获取博客列表（核心方法）                        │
  │  likeBlog(blog)      │  点赞/取消点赞                                  │
  │  bookmarkBlog(blog)  │  收藏/取消收藏                                  │
  │  openModal(blog)     │  打开文章详情弹窗                               │
  │  filterByCategory()  │  按分类筛选                                    │
  │  searchBlogs()       │  搜索博客                                      │
  └──────────────────────┴────────────────────────────────────────────────┘

<!--  -->

<template>
  <div class="blog-container">

    <!-- 顶部横幅 -->
    <div class="top-banner" v-if="!isMobile">
      <div class="banner-content">
        <h1 class="banner-title">欢迎来到博客世界！</h1>
        <p class="banner-subtitle">发现有趣的攻略，分享你的故事</p>
        <div class="banner-search">
          <input type="text" v-model="searchKeyword" placeholder="搜索感兴趣的内容..." class="search-input">
          <button @click="searchBlogs()" class="search-btn">
            <i class="fa fa-search"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 分类导航 -->
    <nav class="category-nav">
      <div class="container">
        <ul class="nav-list">
          <li class="nav-item" :class="{ active: currentCategory === 'all' && currentArticleType === 'all' }" @click="filterByCategory('all'); filterByArticleType('all')">
            <i class="fa fa-home"></i>
            <span>全部</span>
          </li>
          <li class="nav-item" :class="{ active: currentArticleType === 'short' }" @click="filterByArticleType('short')">
            <i class="fa fa-picture-o"></i>
            <span>短文章</span>
          </li>
          <li class="nav-item" :class="{ active: currentArticleType === 'long' }" @click="filterByArticleType('long')">
            <i class="fa fa-file-text"></i>
            <span>长文章</span>
          </li>
          <li class="nav-item" :class="{ active: currentCategory === 'game' }" @click="filterByCategory('game')">
            <i class="fa fa-gamepad"></i>
            <span>游戏攻略</span>
          </li>
          <li class="nav-item" :class="{ active: currentCategory === 'travel' }" @click="filterByCategory('travel')">
            <i class="fa fa-plane"></i>
            <span>旅游攻略</span>
          </li>
          <li class="nav-item" :class="{ active: currentCategory === 'food' }" @click="filterByCategory('food')">
            <i class="fa fa-cutlery"></i>
            <span>美食攻略</span>
          </li>
          <li class="nav-item" :class="{ active: currentCategory === 'tech' }" @click="filterByCategory('tech')">
            <i class="fa fa-laptop"></i>
            <span>科技攻略</span>
          </li>
          <li class="nav-item" :class="{ active: currentCategory === 'fitness' }" @click="filterByCategory('fitness')">
            <i class="fa fa-heartbeat"></i>
            <span>健身攻略</span>
          </li>
        </ul>
      </div>
    </nav>

    
    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
        <!-- 顶部推荐区域（PC 端显示，仅无筛选时显示，简洁模式不显示） -->
        <div class="top-recommend-section" v-if="!isMobile && currentCategory === 'all' && currentArticleType === 'all' && !searchKeyword && !isSimpleMode">
          <!-- 左侧轮播图 -->
          <div class="carousel-container">
            <div class="carousel-wrapper">
              <div class="carousel-track" :style="{ transform: 'translateX(-' + carouselCurrentIndex * 100 + '%)' }">
                <div class="carousel-slide" v-for="(blog, index) in carouselBlogs" :key="blog.id || blog._id || index">
                  <div class="carousel-card" @click="openModal(blog)">
                    <div class="carousel-image">
                      <img :src="blog.image" :alt="blog.title">
                      <div class="carousel-overlay">
                      </div>
                    </div>
                    <div class="carousel-info">
                      <h3 class="carousel-title">{{ blog.title }}</h3>
                      <div class="carousel-meta">
                        <span class="carousel-author">
                          <img :src="getAuthorAvatar(blog.author, 24)" class="carousel-avatar">
                          {{ blog.author.username }}
                        </span>
                        <span class="carousel-views">
                          <i class="fa fa-eye"></i>
                          {{ blog.views }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 轮播控制按钮 -->
            <button class="carousel-btn prev" @click="carouselPrev" aria-label="上一个">
              <i class="fa fa-chevron-left"></i>
            </button>
            <button class="carousel-btn next" @click="carouselNext" aria-label="下一个">
              <i class="fa fa-chevron-right"></i>
            </button>
            <!-- 轮播指示器 -->
            <div class="carousel-indicators">
              <span 
                v-for="(blog, index) in carouselBlogs" 
                :key="index"
                :class="{ active: index === carouselCurrentIndex }"
                @click="carouselCurrentIndex = index"
              ></span>
            </div>
          </div>
          
          <!-- 右侧推荐列表 -->
          <div class="recommend-list">
            <div class="recommend-header">
              <h3 class="recommend-title">
                <i class="fa fa-fire"></i>
                热门推荐
              </h3>
              <button class="refresh-btn" @click="refreshRecommend" :disabled="isRefreshingRecommend">
                <i class="fa fa-refresh" :class="{ 'rotating': isRefreshingRecommend }"></i>
                换一批
              </button>
            </div>
            <div class="recommend-grid">
              <div 
                class="recommend-card" 
                v-for="blog in recommendBlogs" 
                :key="blog.id || blog._id || blog.title"
                @click="openModal(blog)"
              >
                <div class="recommend-image">
                  <img :src="blog.image" :alt="blog.title">
                </div>
                <div class="recommend-info">
                  <h4 class="recommend-title-text">{{ blog.title }}</h4>
                  <div class="recommend-meta">
                    <span class="recommend-author">
                      <i class="fa fa-user"></i>
                      {{ blog.author.username }}
                    </span>
                    <span class="recommend-views">
                      <i class="fa fa-eye"></i>
                      {{ blog.views }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 布局 -->
        <div class="content-layout" :class="{ 'simple-mode': isSimpleMode }">
          <!-- 中间主内容 -->
          <div class="center-content" 
               :class="{ 'mobile-content': isMobile }"
               @touchstart="handleTouchStart"
               @touchmove="handleTouchMove"
               @touchend="handleTouchEnd"
               @touchcancel="handleTouchEnd"
          >
            <!-- 下拉刷新指示器 -->
            <div class="pull-refresh-indicator" :style="{ height: isPulling || isRefreshing ? pullDistance + 'px' : '0' }">
              <div class="pull-refresh-content" :class="{ 'refreshing': isRefreshing }">
                <div class="pull-refresh-icon" :class="{ 'rotating': isRefreshing }">
                  <i class="fa fa-arrow-down"></i>
                </div>
                <p class="pull-refresh-text">
                  {{ isRefreshing ? '刷新中...' : (isPulling ? (pullDistance >= pullThreshold ? '释放刷新' : '下拉刷新') : '下拉刷新') }}
                </p>
              </div>
            </div>
            <!-- 筛选反馈 -->
            <div class="filter-feedback" v-if="currentCategory !== 'all'">
              <span>当前显示: {{ getCategoryName() }}</span>
              <button class="clear-filter" @click="clearFilter" aria-label="清除筛选条件">
                <i class="fa fa-times"></i>
                清除
              </button>
            </div>
            
            <!-- 错误信息 -->
            <div v-if="error" class="error-message">
              <p>{{ error }}</p>
              <button class="btn-primary" @click="fetchBlogs()">重新加载</button>
            </div>
            
            <!-- 博客列表（懒加载） -->
            <div v-else-if="blogList.length > 0" class="blog-list-grid">
              <div class="blog-item" 
                v-for="blog in blogList" 
                :key="blog._id || blog.id"
                @click="openModal(blog)"
                :aria-label="'查看博客：' + blog.title"
                tabindex="0"
              >
                <!-- 图片部分 -->
                <div class="blog-image">
                  <img :src="blog.image" :alt="blog.title">
                </div>
                <!-- 内容部分 -->
                <div class="blog-info">
                  <div class="blog-info-left">

                    <!-- 作者信息 -->
                    <div class="author-info">
                      <img :src="getAuthorAvatar(blog.author, 36)" :alt="blog.author.username || '未知作者'" class="author-avatar-image" @click.stop="goToProfile(blog.author._id || blog.author.id)" style="cursor: pointer; width: 36px; height: 36px; border-radius: 50%; margin-right: 12px; vertical-align: middle;">
                      <span class="blog-author" @click.stop="goToProfile(blog.author._id || blog.author.id)">{{ blog.author.username || '未知作者' }}</span>
                    </div>
                    <!-- 文章标题 -->
                    <h3 class="blog-title">{{ blog.title }}</h3>
                  </div>
                  <div class="blog-info-right">

                    <!-- 统计信息 -->
                    <div class="blog-stats">
                      <span class="stat-item">
                        <i class="fa fa-comment"></i>
                        {{ blog.comments || 0 }}
                      </span>
                      <span class="stat-item" @click.stop="likeBlog(blog)">
                        <i class="fa fa-heart"></i>
                        {{ blog.likes || 0 }}
                      </span>
                      <span class="stat-item" @click.stop="bookmarkBlog(blog)">
                        <i class="fa fa-bookmark"></i>
                        {{ blog.bookmarks || 0 }}
                      </span>
                      <span class="stat-item">
                        <i class="fa fa-eye"></i>
                        {{ blog.views || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 加载更多指示器 -->
              <div class="load-more-indicator" v-if="isLoadingMore" ref="loadMoreTrigger">
                <div class="loading-spinner">
                  <i class="fa fa-spinner fa-spin"></i>
                  <span>加载中...</span>
                </div>
              </div>
              
              <!-- 没有更多提示 -->
              <div class="no-more-content" v-else-if="noMoreBlogs">
                <div class="no-more-text">
                  <i class="fa fa-check-circle"></i>
                  <span>已经到底啦~</span>
                </div>
              </div>

            </div>
            
            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">📝</div>
              <h3 class="empty-title">暂无博客文章</h3>
              <p class="empty-description">
                {{ searchKeyword ? `没有找到与"${searchKeyword}"相关的博客` : '当前没有博客文章，稍后再来看看吧' }}
              </p>
              <button class="btn-primary" v-if="searchKeyword" @click="searchKeyword = ''; fetchBlogs()">
                清除搜索
              </button>
              <button class="btn-primary" @click="fetchBlogs()">
                重新加载
              </button>
            </div>
            

          </div>
          
          <!-- 右侧边栏已删除，内容整合到轮播图 -->
        </div>
      </div>
    </main>
    
    <!-- 博客模态框 -->
    <BlogModal 
      :visible="showModal"
      :blog="currentBlog"
      :is-mobile="isMobile"
      @close="closeModal"
      @filter-by-tag="filterByTag"
    />
    
    <!-- 回到顶部按钮 -->
    <transition name="fade">
      <button 
        v-show="showBackToTop"
        class="back-to-top"
        @click="scrollToTop"
        aria-label="回到顶部"
      >
        <i class="fa fa-chevron-up"></i>
      </button>
    </transition>
  </div>
</template>

<script>
import BlogModal from './BlogModal.vue';
import CacheManager from '../utils/cache';
import { getAuthorAvatar as getAvatar } from '../utils/avatarUtils';

export default {
  name: 'Blog',
  components: {
    BlogModal
  },
  metaInfo: {
    title: '博客首页',
    meta: [
      { name: 'description', content: '浏览最新博客文章，发现感兴趣的内容' },
      { name: 'keywords', content: '博客首页,最新文章,热门博客' }
    ]
  },
  data() {
    return {
      // ============================================================
      // 筛选相关数据
      // ============================================================
      // 【currentCategory】
      // 类型：String
      // 初始值：'all'
      // 作用：存储当前选中的文章分类
      // 可能的值：'all'（全部）、'game'（游戏）、'travel'（旅游）、
      //          'food'（美食）、'tech'（科技）、'fitness'（健身）
      // 使用场景：分类导航点击、筛选博客列表
      // 更新时机：用户点击分类导航时
      // ============================================================
      currentCategory: 'all',
      
      // 【currentArticleType】
      // 类型：String
      // 初始值：'all'
      // 作用：存储当前选中的文章类型
      // 可能的值：'all'（全部）、'short'（短文章）、'long'（长文章）
      // 使用场景：文章类型筛选
      // 区别：短文章类似朋友圈，长文章类似知乎
      // ============================================================
      currentArticleType: 'all',
      
      // 【searchKeyword】
      // 类型：String
      // 初始值：''
      // 作用：存储用户输入的搜索关键词
      // 使用场景：v-model 双向绑定到搜索输入框
      // 注意：搜索时需要 trim() 去除首尾空格
      // ============================================================
      searchKeyword: '',
      
      // ============================================================
      // 状态相关数据
      // ============================================================
      // 【isLoading】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记数据是否正在加载中
      // 使用场景：显示加载动画、禁用按钮防止重复请求
      // 注意：请求开始设为 true，请求结束设为 false
      // ============================================================
      isLoading: false,
      
      // 【error】
      // 类型：String | null
      // 初始值：null
      // 作用：存储请求失败的错误信息
      // 使用场景：显示错误提示、判断是否需要重试
      // 注意：null 表示无错误，有错误时存储错误消息
      // ============================================================
      error: null,
      
      // 【showModal】
      // 类型：Boolean
      // 初始值：false
      // 作用：控制博客详情弹窗的显示/隐藏
      // 使用场景：用户点击博客卡片时设为 true，关闭弹窗时设为 false
      // 配合：currentBlog 一起使用
      // ============================================================
      showModal: false,
      
      // 【currentBlog】
      // 类型：Object | null
      // 初始值：null
      // 作用：存储当前选中的博客数据，传递给 BlogModal 组件
      // 数据结构：{ _id, title, content, author, likes, comments, ... }
      // 使用场景：打开弹窗时保存点击的博客数据
      // 注意：关闭弹窗时设为 null 释放内存
      // ============================================================
      currentBlog: null,
      
      // 【isMobile】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记当前是否为移动端设备
      // 判断依据：window.innerWidth <= 768
      // 使用场景：响应式布局、显示/隐藏侧边栏、启用下拉刷新
      // 更新时机：页面加载时、窗口大小改变时
      // ============================================================
      isMobile: false,
      
      // ============================================================
      // 下拉刷新相关数据（移动端专用）
      // ============================================================
      // 【isPulling】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记用户是否正在执行下拉动作
      // 使用场景：控制下拉提示的显示
      // ============================================================
      isPulling: false,
      
      // 【pullDistance】
      // 类型：Number
      // 初始值：0
      // 作用：存储当前下拉的距离（像素）
      // 使用场景：计算下拉提示的位置、判断是否达到刷新阈值
      // 单位：像素（px）
      // ============================================================
      pullDistance: 0,
      
      // 【pullThreshold】
      // 类型：Number
      // 初始值：80
      // 作用：触发刷新所需的最小下拉距离
      // 使用场景：判断是否触发刷新
      // 单位：像素（px）
      // ============================================================
      pullThreshold: 80,
      
      // 【isRefreshing】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记是否正在执行刷新操作
      // 使用场景：防止刷新过程中重复触发
      // ============================================================
      isRefreshing: false,
      
      // 【touchStartY】
      // 类型：Number
      // 初始值：0
      // 作用：存储触摸开始时的 Y 坐标
      // 使用场景：计算下拉距离 = 当前Y - touchStartY
      // ============================================================
      touchStartY: 0,
      
      // ============================================================
      // 界面设置相关数据
      // ============================================================
      // 【isSimpleMode】
      // 类型：Boolean
      // 初始值：从 localStorage 读取
      // 作用：标记是否启用简洁模式（隐藏侧边栏）
      // 持久化：存储在 localStorage，刷新页面后保持
      // 使用场景：切换布局模式
      // ============================================================
      isSimpleMode: localStorage.getItem('isSimpleMode') === 'true',
      
      // ============================================================
      // 博客数据
      // ============================================================
      // 【blogList】
      // 类型：Array
      // 初始值：[]
      // 作用：存储博客文章列表数据
      // 数据结构：[{ _id, title, content, author, likes, ... }, ...]
      // 使用场景：渲染博客卡片列表
      // 更新时机：fetchBlogs() 请求成功后
      // ============================================================
      blogList: [],
      
      // ============================================================
      // 加载控制相关数据
      // ============================================================
      // 【loadTimeout】
      // 类型：Number | null
      // 初始值：null
      // 作用：存储加载超时定时器的 ID
      // 使用场景：超时后取消请求、组件销毁时清理
      // 注意：必须在 beforeDestroy 中清理，防止内存泄漏
      // ============================================================
      loadTimeout: null,
      
      // 【retryCount】
      // 类型：Number
      // 初始值：0
      // 作用：记录当前重试次数
      // 使用场景：请求失败后重试，达到最大次数后停止
      // ============================================================
      retryCount: 0,
      
      // 【maxRetries】
      // 类型：Number
      // 初始值：3
      // 作用：最大重试次数
      // 使用场景：限制重试次数，防止无限重试
      // ============================================================
      maxRetries: 3,
      
      // ============================================================
      // 侧边栏数据
      // ============================================================
      
      // 【hotArticles】
      // 类型：Array
      // 初始值：[]
      // 作用：存储热门文章列表（按浏览量排序）
      // 数据结构：[{ _id, title, views, ... }, ...]
      // 使用场景：侧边栏显示热门文章
      // 更新时机：fetchHotBlogs() 请求成功后
      // ============================================================
      hotArticles: [],
      
      // 【hotBlogs】
      // 类型：Array
      // 初始值：[]
      // 作用：存储热点 TOP10 文章
      // 使用场景：轮播图显示
      // 更新时机：fetchHotBlogsForTop10() 请求成功后
      // ============================================================
      hotBlogs: [],
      
      // ============================================================
      // 轮播图相关数据
      // ============================================================
      // 【carouselBlogs】
      // 类型：Array
      // 初始值：[]
      // 作用：存储轮播图展示的博客（6 个最热门）
      // ============================================================
      carouselBlogs: [],
      
      // 【carouselCurrentIndex】
      // 类型：Number
      // 初始值：0
      // 作用：轮播图当前显示的索引
      // ============================================================
      carouselCurrentIndex: 0,
      
      // 【carouselTimer】
      // 类型：Number
      // 初始值：null
      // 作用：轮播图自动播放定时器
      // ============================================================
      carouselTimer: null,
      
      // ============================================================
      // 推荐区域相关数据
      // ============================================================
      // 【recommendBlogs】
      // 类型：Array
      // 初始值：[]
      // 作用：存储推荐区域展示的博客（6 个）
      // ============================================================
      recommendBlogs: [],
      
      // 【isRefreshingRecommend】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记推荐区域是否正在刷新
      // ============================================================
      isRefreshingRecommend: false,
      
      // ============================================================
      // 懒加载相关数据
      // ============================================================
      // 【currentPage】
      // 类型：Number
      // 初始值：1
      // 作用：当前页码
      // ============================================================
      currentPage: 1,
      
      // 【pageSize】
      // 类型：Number
      // 初始值：10
      // 作用：每页加载数量
      // ============================================================
      pageSize: 10,
      
      // 【totalBlogs】
      // 类型：Number
      // 初始值：0
      // 作用：博客总数
      // ============================================================
      totalBlogs: 0,
      
      // 【hasMore】
      // 类型：Boolean
      // 初始值：true
      // 作用：是否还有更多数据
      // ============================================================
      hasMore: true,
      
      // 【isLoadingMore】
      // 类型：Boolean
      // 初始值：false
      // 作用：是否正在加载更多
      // ============================================================
      isLoadingMore: false,
      
      // 【noMoreBlogs】
      // 类型：Boolean
      // 初始值：false
      // 作用：是否没有更多博客
      // ============================================================
      noMoreBlogs: false,
      
      // 【scrollListener】
      // 类型：Function
      // 初始值：null
      // 作用：滚动监听函数
      // ============================================================
      scrollListener: null,
      
      // 【loadDistance】
      // 类型：Number
      // 初始值：300
      // 作用：距离底部多少像素触发加载
      // ============================================================
      loadDistance: 300,
      
      // ============================================================
      // 回到顶部相关数据
      // ============================================================
      // 【showBackToTop】
      // 类型：Boolean
      // 初始值：false
      // 作用：是否显示回到顶部按钮
      // 显示条件：滚动距离超过 300px
      // ============================================================
      showBackToTop: false,
      
      // 【scrollListener】
      // 类型：Function
      // 初始值：null
      // 作用：滚动监听函数（用于添加和移除事件监听）
      // ============================================================
      scrollListenerForBackToTop: null
    };
  },
  
  // ============================================================
  // created 生命周期钩子
  // ============================================================
  // 【学习重点】Vue 生命周期 - created
  // 
  // 【执行时机】组件实例创建完成后立即执行
  // 
  // 【特点】
  // - 此时 data、methods 已初始化完成
  // - 但 DOM 还未挂载（$el 不存在）
  // - 适合：初始化数据、添加事件监听
  // 
  // 【与 mounted 的区别】
  // - created：更早执行，DOM 还没有
  // - mounted：DOM 已经挂载完成
  // ============================================================
  created() {
    // 初始化移动端检测
    this.checkIsMobile();
    // 监听窗口大小变化（响应式设计）
    window.addEventListener('resize', this.checkIsMobile);
    
    // 监听全局简洁模式变化事件
    window.addEventListener('simpleModeChanged', this.handleSimpleModeChange);
  },
  
  // ============================================================
  // watch 监听器
  // ============================================================
  // 【学习重点】Vue 的响应式监听
  // 
  // 【作用】监听数据变化，执行相应操作
  // 
  // 【与 computed 的区别】
  // - computed：根据依赖计算新值（适合派生数据）
  // - watch：监听变化执行副作用（适合异步操作）
  // 
  // 【参数说明】
  // - handler：回调函数
  // - immediate: true：组件创建时立即执行一次
  // - deep: true：深度监听对象内部变化
  // ============================================================
  watch: {
    // 监听路由变化，检查登录状态并重新加载数据
    '$route': {
      handler(to) {
        // 当路由切换到博客页面时重新加载数据
        if (to.path === '/blog') {
          this.fetchBlogs();
        }
      },
      immediate: true // 【重要】立即执行一次，确保首次进入页面也加载数据
    }
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  // 【学习重点】Vue 生命周期 - mounted
  // 
  // 【执行时机】DOM 挂载完成后执行
  // 
  // 【特点】
  // - 此时可以访问 $el（DOM 元素）
  // - 适合：DOM 操作、发起网络请求、初始化第三方库
  // 
  // 【为什么用 async？】
  // 因为要等待多个异步请求完成
  // 
  // 【Promise.all 的作用】
  // 并行执行多个异步操作，等全部完成后再继续
  // 比串行执行更快！
  // ============================================================
  async mounted() {
    console.log(' mounted 生命周期开始执行');
    
    // 恢复页面滚动（防止从其他页面带过来的滚动状态）
    document.body.style.overflow = '';
    
    try {
      console.log('📡 开始并行加载数据...');
      
      // 【关键】Promise.all 并行加载多个数据
      // 同时请求多个接口，提高加载速度
      await Promise.all([
        this.fetchBlogs(),           // 获取博客列表
        this.fetchHotBlogs(),        // 获取热门博客
        this.fetchHotBlogsForTop10() // 获取 TOP10 热点
      ]);
      
      console.log('✅ 数据加载完成，初始化轮播图和推荐区域');
      
      // 初始化轮播图和推荐区域
      this.initCarouselAndRecommend();
      
      // 初始化滚动监听（懒加载）
      this.initScrollListener();
      
      // 初始化回到顶部按钮监听
      this.initBackToTopListener();
    } catch (error) {
      console.error('❌ mounted 中数据加载失败:', error);
    }
  },
  
  // ============================================================
  // beforeDestroy 生命周期钩子
  // ============================================================
  // 【学习重点】Vue 生命周期 - beforeDestroy
  // 
  // 【执行时机】组件销毁之前执行
  // 
  // 【作用】清理工作，防止内存泄漏
  // 
  // 【为什么要移除事件监听？】
  // - addEventListener 添加的监听器不会自动移除
  // - 如果不移除，组件销毁后监听器仍然存在
  // - 导致内存泄漏，可能引发错误
  // 
  // 【内存泄漏的危害】
  // - 占用内存越来越多
  // - 页面变慢、卡顿
  // - 严重时导致页面崩溃
  // ============================================================
  beforeDestroy() {
    // 【重要】移除所有事件监听，防止内存泄漏
    window.removeEventListener('resize', this.checkIsMobile);
    window.removeEventListener('simpleModeChanged', this.handleSimpleModeChange);
    
    // 移除滚动监听
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
    
    // 移除回到顶部滚动监听
    if (this.scrollListenerForBackToTop) {
      window.removeEventListener('scroll', this.scrollListenerForBackToTop);
    }
    
    // 清理定时器（如果有的话）
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
    
    // 清理轮播图定时器
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  // 【学习重点】Vue 组件的方法定义
  // 
  // 【特点】
  // - 所有方法都会被绑定到组件实例
  // - 可以通过 this.xxx 访问组件的数据和其他方法
  // - 可以在模板中通过 @click="xxx" 调用
  // ============================================================
  methods: {
    // ============================================================
    // 处理博客数据（数据格式化）
    // ============================================================
    // 【学习重点】数据预处理
    // 
    // 【作用】统一数据格式，防止后端数据不一致导致前端报错
    // 
    // 【常见处理】
    // - 设置默认值（防止 undefined）
    // - 格式化日期
    // - 补全图片 URL
    // ============================================================
    processBlogData(blog, index = 0) {
      return {
        ...blog,
        id: blog._id || blog.id || `blog-${index}`,
        date: blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN'),
        title: blog.title || '无标题',
        image: blog.image || 'https://via.placeholder.com/150',
        author: blog.author && typeof blog.author === 'object' ? blog.author : { username: '未知作者' },
        comments: blog.comments || 0,
        likes: blog.likes || 0,
        views: blog.views || 0,
        tags: blog.tags || [],
        articleType: blog.articleType || 'long'
      };
    },
    
    // ============================================================
    // 获取博客列表（核心方法）
    // ============================================================
    // 【功能】从后端 API 获取博客文章列表，支持分页和筛选
    // 【参数】isAppend: 是否追加模式（true=加载更多，false=刷新列表）
    // 
    // 【执行流程】
    // 1. 重置分页参数（仅刷新模式）
    // 2. 根据条件选择 API（推荐算法 or 普通列表）
    // 3. 发送请求获取数据
    // 4. 处理响应数据（统一格式、分页信息）
    // 5. 更新本地状态（blogList、hasMore 等）
    // 
    // 【关键点】
    // - 响应拦截器已返回 response.data，所以分页信息在 response 顶层
    // - 追加模式保留原数据，刷新模式清空原数据
    // - 加载失败时回退页码，避免分页错乱
    // ============================================================
    async fetchBlogs(isAppend = false) {
      console.log('📝 fetchBlogs 方法被调用，isAppend:', isAppend);
      
      try {
        // ------------------------------------------------------
        // 步骤 1：重置分页参数（仅刷新模式）
        // ------------------------------------------------------
        if (!isAppend) {
          console.log('🔄 重置分页参数，currentPage: 1');
          this.currentPage = 1;
          this.blogList = [];
          this.hasMore = true;
          this.noMoreBlogs = false;
        }
        
        // ------------------------------------------------------
        // 步骤 2：根据条件选择 API
        // ------------------------------------------------------
        let response;
        
        if (this.currentCategory !== 'all' || this.currentArticleType !== 'all' || this.searchKeyword) {
          // 有筛选条件：使用普通列表 API
          const params = {
            page: this.currentPage,
            limit: this.pageSize
          };
          
          if (this.currentArticleType !== 'all') {
            params.articleType = this.currentArticleType;
          }
          
          if (this.currentCategory !== 'all' && !this.currentCategory.startsWith('tag-')) {
            params.category = this.currentCategory;
          }
          
          if (this.searchKeyword) {
            params.keyword = this.searchKeyword;
          }
          
          response = await this.$http.get('/api/blogs', { params });
        } else {
          // 无筛选条件：使用推荐算法 API（个性化推荐）
          response = await this.$http.get('/api/blogs/recommended', {
            params: {
              page: this.currentPage,
              limit: this.pageSize
            }
          });
        }
        
        // ------------------------------------------------------
        // 步骤 3：处理响应数据
        // ------------------------------------------------------
        if (response.success) {
          // 【重要】提取分页信息
          // 由于响应拦截器已返回 response.data，所以分页信息在 response 顶层
          const total = response.total || response.count || 0;
          const totalPages = response.totalPages || response.total_pages || 1;
          const currentPage = response.page || response.currentPage || this.currentPage;
          const limit = response.limit || response.pageSize || this.pageSize;
          
          // 提取文章数组
          let blogsData = response.data;
          
          console.log('📊 完整响应数据:', response);
          console.log('📄 分页信息提取 - total:', total, 'totalPages:', totalPages, 'page:', currentPage, 'limit:', limit);
          console.log('获取博客数据 - 当前页:', this.currentPage, '数据数量:', blogsData?.length);
          
          if (Array.isArray(blogsData)) {
            // 统一数据格式（防止后端字段缺失导致前端报错）
            let processedBlogs = blogsData.map((blog, index) => this.processBlogData(blog, index));
            
            // 进一步按文章类型筛选（如果设置了筛选条件）
            if (this.currentArticleType !== 'all') {
              processedBlogs = processedBlogs.filter(blog => blog.articleType === this.currentArticleType);
            }
            
            // ------------------------------------------------------
            // 步骤 4：更新博客列表（带上去重逻辑）
            // ------------------------------------------------------
            if (isAppend) {
              // 追加模式：保留原有数据，追加新数据（去重）
              const existingIds = new Set(this.blogList.map(blog => blog.id || blog._id));
              const newBlogs = processedBlogs.filter(blog => {
                const blogId = blog.id || blog._id;
                return !existingIds.has(blogId);
              });
              
              this.blogList = [...this.blogList, ...newBlogs];
              console.log('追加模式 - 原始新增:', processedBlogs.length, '去重后新增:', newBlogs.length, '追加后总数:', this.blogList.length);
            } else {
              // 替换模式：清空原有数据，只保留新数据
              this.blogList = processedBlogs;
              console.log('替换模式 - 总数:', this.blogList.length);
            }
            
            // ------------------------------------------------------
            // 步骤 5：更新分页信息
            // ------------------------------------------------------
            this.totalBlogs = total;
            this.hasMore = this.currentPage < totalPages;  // 判断是否还有更多数据
            this.noMoreBlogs = !this.hasMore;
            this.error = null;
            
            console.log('📊 分页信息更新 - totalBlogs:', this.totalBlogs, 'hasMore:', this.hasMore, 'totalPages:', totalPages);
          } else {
            // 数据格式错误
            this.error = '数据格式错误';
            if (!isAppend) {
              this.blogList = [];
            }
          }
        } else {
          // 业务层面失败（如：参数错误、权限不足等）
          this.error = response.message || '获取博客列表失败';
          if (!isAppend) {
            this.blogList = [];
          }
        }
      } catch (error) {
        // 网络错误或服务器异常
        console.error('❌ fetchBlogs 错误:', error);
        this.error = error.message || '获取博客列表失败，请稍后重试';
        if (!isAppend) {
          this.blogList = [];
        }
      }
    },
    
    // 获取热门博客
    async fetchHotBlogs() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=5');
        
        if (response.success && Array.isArray(response.data)) {
          this.hotArticles = response.data.map(blog => this.processBlogData(blog));
        } else {
          this.hotArticles = [];
        }
      } catch (error) {
        this.hotArticles = [];
      }
    },
    
    // 获取热点 TOP10 博客
    async fetchHotBlogsForTop10() {
      try {
        const response = await this.$http.get('/api/blogs/hot?limit=10');
        
        if (response.success && Array.isArray(response.data)) {
          const blogs = response.data.map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author || { username: '未知作者' },
            views: blog.views || 0
          }));
          
          this.hotBlogs = blogs;
        }
      } catch (error) {
        this.hotBlogs = [];
      }
    },
    
    // 初始化轮播图和推荐区域
    initCarouselAndRecommend() {
      // 设置轮播图数据（6 个最热门）
      if (this.hotBlogs.length > 0) {
        this.carouselBlogs = this.hotBlogs.slice(0, 6).map((blog, index) => this.processBlogData(blog, index));
        
        // 设置推荐区域数据（4 个）
        this.recommendBlogs = this.hotBlogs.slice(0, 4).map((blog, index) => this.processBlogData(blog, index));
        
        // 启动轮播图自动播放
        this.startCarouselAutoPlay();
      }
    },
    
    // 轮播图上一张
    carouselPrev() {
      if (this.carouselCurrentIndex > 0) {
        this.carouselCurrentIndex--;
      } else {
        this.carouselCurrentIndex = this.carouselBlogs.length - 1;
      }
    },
    
    // 轮播图下一张
    carouselNext() {
      if (this.carouselCurrentIndex < this.carouselBlogs.length - 1) {
        this.carouselCurrentIndex++;
      } else {
        this.carouselCurrentIndex = 0;
      }
    },
    
    // 启动轮播图自动播放
    startCarouselAutoPlay() {
      // 清除旧的定时器
      if (this.carouselTimer) {
        clearInterval(this.carouselTimer);
      }
      
      // 每 5 秒自动切换
      this.carouselTimer = setInterval(() => {
        this.carouselNext();
      }, 5000);
    },
    
    // ============================================================
    // 刷新推荐区域
    // ============================================================
    // 【功能】点击"换一批"按钮，随机刷新推荐区域的文章
    // 【流程】
    // 1. 重新获取热门博客（10 篇）
    // 2. 随机打乱顺序
    // 3. 取前 4 篇更新推荐区域
    // 
    // 【防重复点击】
    // - isRefreshingRecommend 标志位，防止重复点击
    // - 延迟 500ms 重置标志位，等待动画完成
    // ============================================================
    async refreshRecommend() {
      if (this.isRefreshingRecommend) return;
      
      this.isRefreshingRecommend = true;
      
      try {
        // 重新获取热门博客
        const response = await this.$http.get('/api/blogs/hot?limit=10');
        
        if (response.success && Array.isArray(response.data)) {
          // 随机打乱顺序（Fisher-Yates 洗牌算法简化版）
          const shuffled = response.data.sort(() => Math.random() - 0.5);
          
          // 更新推荐区域（4 个）
          this.recommendBlogs = shuffled.slice(0, 4).map(blog => ({
            id: blog._id,
            title: blog.title,
            image: blog.image || 'https://via.placeholder.com/300x200',
            author: blog.author || { username: '未知作者' },
            views: blog.views || 0
          }));
        }
      } catch (error) {
        // 刷新失败
        console.error('刷新推荐失败:', error);
      } finally {
        // 延迟一点时间让动画完成
        setTimeout(() => {
          this.isRefreshingRecommend = false;
        }, 500);
      }
    },
    
    // ============================================================
    // 初始化滚动监听（懒加载核心）
    // ============================================================
    // 【功能】监听页面滚动，当接近底部时自动加载更多数据
    // 
    // 【触发条件】
    // 1. 距离底部 < loadDistance（300px）
    // 2. hasMore = true（还有更多数据）
    // 3. isLoadingMore = false（当前没有在加载中）
    // 
    // 【防抖优化】
    // - 使用 debounce 函数，避免滚动时频繁触发
    // - 延迟 200ms 执行，减少性能消耗
    // 
    // 【面试常问】
    // Q: 为什么不用 IntersectionObserver？
    // A: 兼容性考虑，scroll 事件 + 防抖更稳定
    // ============================================================
    initScrollListener() {
      // 使用防抖函数，避免频繁触发
      this.scrollListener = this.debounce(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // 距离底部的高度
        const remaining = documentHeight - (scrollTop + windowHeight);
        
        console.log('滚动监听触发 - 距离底部:', remaining, 'px, hasMore:', this.hasMore, 'isLoadingMore:', this.isLoadingMore);
        
        // 如果距离底部小于设定值，且有更多数据，且没有在加载中
        if (remaining < this.loadDistance && this.hasMore && !this.isLoadingMore) {
          console.log('触发懒加载！');
          this.loadMore();
        }
      }, 200);
      
      window.addEventListener('scroll', this.scrollListener);
    },
    
    // ============================================================
    // 初始化回到顶部按钮监听
    // ============================================================
    // 【功能】监听页面滚动，控制回到顶部按钮的显示/隐藏
    // 
    // 【显示条件】
    // - 滚动距离超过 300px 时显示
    // - 否则隐藏
    // 
    // 【为什么要用防抖？】
    // - scroll 事件触发频率极高（每秒几十次）
    // - 防抖可以减少执行次数，提升性能
    // ============================================================
    initBackToTopListener() {
      // 使用防抖函数，避免频繁触发
      this.scrollListenerForBackToTop = this.debounce(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        // 滚动距离超过 300px 时显示按钮
        this.showBackToTop = scrollTop > 300;
      }, 100);
      
      window.addEventListener('scroll', this.scrollListenerForBackToTop);
    },
    
    // ============================================================
    // 滚动到顶部
    // ============================================================
    // 【功能】平滑滚动到页面顶部
    // 
    // 【实现方式】
    // - 使用 window.scrollTo() 方法
    // - behavior: 'smooth' 实现平滑滚动效果
    // ============================================================
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    
    // ============================================================
    // 加载更多数据
    // ============================================================
    // 【功能】加载下一页的博客数据
    // 【流程】
    // 1. 页码 +1
    // 2. 调用 fetchBlogs(true) 追加数据
    // 3. 加载失败时回退页码
    // 
    // 【关键点】
    // - 使用 isAppend=true 追加模式，保留原有数据
    // - 加载失败时 currentPage--，避免页码错乱
    // ============================================================
    async loadMore() {
      if (this.isLoadingMore || !this.hasMore) return;
      
      this.isLoadingMore = true;
      
      try {
        this.currentPage++;
        await this.fetchBlogs(true);  // 使用追加模式
      } catch (error) {
        this.currentPage--; // 加载失败回退页码
        console.error('加载更多失败:', error);
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    // 防抖函数
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // 获取排名样式
    getRankClass(index) {
      if (index === 0) return 'rank-1';
      if (index === 1) return 'rank-2';
      if (index === 2) return 'rank-3';
      return '';
    },
    
    // 根据分类筛选博客
    filterByCategory(category) {
      this.currentCategory = category;
      this.fetchBlogs(); // 重新获取博客列表
    },
    
    // 根据文章类型筛选博客
    filterByArticleType(articleType) {
      this.currentArticleType = articleType;
      this.fetchBlogs(); // 重新获取博客列表
    },
    
    // 根据标签筛选博客
    filterByTag(tag) {
      this.currentCategory = 'tag-' + tag;
      this.fetchBlogs(); // 重新获取博客列表
    },
    
    // 搜索博客
    searchBlogs() {
      this.fetchBlogs(); // 重新获取博客列表
    },
    
    // 获取分类名称
    getCategoryName() {
      if (this.currentCategory === 'all') {
        return '全部攻略';
      } else if (this.currentCategory.startsWith('tag-')) {
        const tag = this.currentCategory.replace('tag-', '');
        return `标签：${tag}`;
      } else {
        const categoryNames = {
          'game': '游戏攻略',
          'travel': '旅游攻略',
          'food': '美食攻略',
          'tech': '科技攻略',
          'fitness': '健身攻略'
        };
        return categoryNames[this.currentCategory] || this.currentCategory;
      }
    },
    
    // 清除筛选条件
    clearFilter() {
      this.currentCategory = 'all';
      this.currentArticleType = 'all';
      this.searchKeyword = '';
      this.currentPage = 1;
      this.blogList = [];
      this.hasMore = true;
      this.noMoreBlogs = false;
      this.fetchBlogs(); // 重新获取博客列表
    },
    
    // 打开博客详情模态框
    // ============================================================
    // 【学习重点】模态框的实现原理
    // 
    // 【知识点】
    // 1. showModal：控制模态框显示/隐藏
    // 2. currentBlog：存储当前选中的博客数据
    // 3. document.body.style.overflow：禁用页面滚动
    //    - 'hidden'：禁止滚动（模态框打开时）
    //    - ''：恢复滚动（模态框关闭时）
    // 
    // 【为什么禁用滚动？】
    // 防止用户在模态框打开时滚动背景页面，影响用户体验
    // ============================================================
    openModal(blog) {
      this.currentBlog = blog;  // 保存当前博客数据
      this.showModal = true;    // 显示模态框
      // 禁用页面滚动（防止背景滚动）
      document.body.style.overflow = 'hidden';
    },
    
    // 关闭博客详情模态框
    closeModal() {
      this.showModal = false;   // 隐藏模态框
      this.currentBlog = null;  // 清空当前博客数据
      // 恢复页面滚动
      document.body.style.overflow = '';
    },
    
    // ============================================================
    // 检测是否为移动端
    // ============================================================
    // 【学习重点】响应式设计
    // 
    // 【知识点】
    // - window.innerWidth：获取窗口宽度
    // - 768px：平板和手机的分界点（Bootstrap 标准）
    // 
    // 【应用场景】
    // - 移动端：简化布局、隐藏侧边栏、启用下拉刷新
    // - PC端：完整布局、显示侧边栏
    // ============================================================
    checkIsMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    
    // 切换菜单展开状态


    // 处理简洁模式变化事件
    handleSimpleModeChange(event) {
      this.isSimpleMode = event.detail.isSimpleMode;
    },
    
    // ============================================================
    // 点赞/取消点赞博客
    // ============================================================
    // 【学习重点】async/await 异步请求
    // 
    // 【流程】
    // 1. 判断当前是否已点赞
    // 2. 调用对应的 API（like 或 unlike）
    // 3. 更新本地数据（乐观更新）
    // 
    // 【知识点】
    // - blog.isLiked ? 'unlike' : 'like'：三元表达式动态选择方法
    // - await：等待异步请求完成
    // - 乐观更新：先更新UI，不等待服务器确认（提升用户体验）
    // ============================================================
    async likeBlog(blog) {
      try {
        // 【关键】动态调用 like 或 unlike 方法
        // 如果已点赞，调用 unlike；否则调用 like
        const result = await this.$http.blogs[blog.isLiked ? 'unlike' : 'like'](blog.id);
        
        if (result.success) {
          // 【乐观更新】直接更新本地数据，无需重新请求
          blog.likes = result.data.likes;
          blog.isLiked = !blog.isLiked;
        }
      } catch (error) {
        // 操作失败
      }
    },
    
    // ============================================================
    // 收藏博客
    // ============================================================
    // 【学习重点】收藏功能的实现
    // 
    // 【流程】
    // 1. 调用收藏 API
    // 2. 更新本地收藏数和状态
    // 
    // 【与点赞的区别】
    // - 点赞：表达喜欢，可以取消
    // - 收藏：保存到个人收藏夹，方便以后查看
    // ============================================================
    async bookmarkBlog(blog) {
      try {
        const result = await this.$http.blogs.bookmark(blog.id);
        if (result.success) {
          // 更新本地数据
          blog.bookmarks = (blog.bookmarks || 0) + 1;
          blog.isBookmarked = true;
        }
      } catch (error) {
        // 收藏失败
      }
    },
    
    // 跳转到用户个人资料页
    goToProfile(userId, openInNewWindow = false) {
      const profileUrl = `/profile/${userId}`;
      
      try {
        if (openInNewWindow) {
          // 在新窗口中打开用户个人资料页面
          window.open(profileUrl, '_blank', 'noopener,noreferrer');
        } else {
          // 在当前窗口中跳转
          this.$router.push(profileUrl);
        }
      } catch (error) {
        // 跳转失败
      }
    },
    
    // 检查是否为表情符号头像
    isEmojiAvatar(author) {
      if (!author) return false;
      
      // 如果author是对象，获取avatar属性
      let avatar = typeof author === 'string' ? author : (author.avatar || author.profile?.avatar);
      
      if (!avatar) return false;
      
      // 简单判断：如果是单个字符或较短的字符串，可能是表情符号
      // 避免使用复杂的正则表达式，减少编译错误
      return avatar.length === 1 || avatar.length <= 3;
    },
    
    // 获取作者头像URL
    getAuthorAvatar(author, size = 40) {
      return getAvatar(author, size);
    },
    

    
    // 触摸开始事件处理
    handleTouchStart(event) {
      if (window.scrollY === 0 && !this.isRefreshing) {
        this.touchStartY = event.touches[0].clientY;
        this.isPulling = true;
      }
    },
    
    // 触摸移动事件处理
    handleTouchMove(event) {
      if (!this.isPulling || this.isRefreshing || window.scrollY > 0) {
        return;
      }
      
      const touchY = event.touches[0].clientY;
      const deltaY = touchY - this.touchStartY;
      
      if (deltaY > 0) {
        // 阻止默认滚动行为
        event.preventDefault();
        // 计算下拉距离，添加阻尼效果
        this.pullDistance = Math.min(deltaY * 0.5, this.pullThreshold * 2);
      }
    },
    
    // 触摸结束事件处理
    handleTouchEnd() {
      if (!this.isPulling) {
        return;
      }
      
      if (this.pullDistance >= this.pullThreshold && !this.isRefreshing) {
        // 触发刷新
        this.isRefreshing = true;
        this.pullDistance = this.pullThreshold;
        this.performRefresh();
      } else {
        // 回弹
        this.isPulling = false;
        this.pullDistance = 0;
      }
    },
    
    // 执行刷新操作
    async performRefresh() {
      try {
        await this.fetchBlogs();
        await this.fetchHotBlogs();
      } catch (error) {
        // 刷新失败
      } finally {
        // 刷新完成，恢复状态
        setTimeout(() => {
          this.isRefreshing = false;
          this.isPulling = false;
          this.pullDistance = 0;
        }, 500);
      }
    }
  }
}
</script>

<style scoped>
/* 博客页面 - 基础样式（无颜色） */
.blog-container {
  min-height: 100vh;
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive;
}

/* 顶部横幅 - 基础样式 */
.top-banner {
  padding: 60px 0 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%);
}

.top-banner::before {
  content: '✨✨✨';
  position: absolute;
  top: 20px;
  left: 10%;
  font-size: 1.5em;
  animation: cute-blink 2s infinite;
}

.top-banner::after {
  content: '☁️☁️';
  position: absolute;
  top: 30px;
  right: 10%;
  font-size: 1.8em;
  animation: cute-float 3s infinite ease-in-out;
}

.banner-content {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.banner-title {
  margin: 0 0 10px;
  font-size: 2.8rem;
  font-weight: bold;
}

.banner-subtitle {
  margin: 0 0 25px;
  font-size: 1.2rem;
  opacity: 0.95;
  font-style: italic;
}

/* 搜索框样式 - 基础样式 */
.banner-search {
  display: flex;
  max-width: 600px;
  margin: 0 auto 30px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  border: none;
  outline: none;
  font-size: 1rem;
}

.search-btn {
  padding: 0 25px;
  border: none;
  background: #ff6b6b;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  background: #ff5252;
  transform: scale(1.05);
}

/* ============================================================
   顶部推荐区域样式
   ============================================================ */
.top-recommend-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

/* 轮播图容器 */
.carousel-container {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid #fbcfe8;
  background: white;
  height: 500px;
}

.carousel-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
  height: 100%;
}

.carousel-slide {
  min-width: 100%;
  height: 100%;
}

.carousel-card {
  width: 100%;
  height: 100%;
  cursor: pointer;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.carousel-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-card:hover .carousel-image img {
  transform: scale(1.1);
}

.carousel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%);
}

.carousel-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  color: white;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
}

.carousel-title {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.carousel-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.carousel-author {
  display: flex;
  align-items: center;
  gap: 6px;
}

.carousel-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
}

.carousel-views {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 轮播图控制按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #ec4899;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.carousel-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

.carousel-btn.prev {
  left: 15px;
}

.carousel-btn.next {
  right: 15px;
}

/* 轮播图指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.carousel-indicators span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid white;
}

.carousel-indicators span.active {
  background: white;
  transform: scale(1.2);
}

.carousel-indicators span:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

/* 推荐列表 */
.recommend-list {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 15px;
  padding: 25px;
  
  border: 2px solid #fbcfe8;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.recommend-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: #ec4899;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 1px 1px 0px rgba(251, 207, 232, 0.3);
}

.recommend-title i {
  animation: cute-bounce 2s infinite;
}

.refresh-btn {
  background: white;
  border: 1px solid #fbcfe8;
  color: #ec4899;
  padding: 6px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.refresh-btn:hover:not(:disabled) {
  background: #fbcfe8;
  transform: scale(1.03);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn .rotating {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.recommend-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #fbcfe8;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.recommend-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.15);
}

.recommend-image {
  width: 100%;
  height: 100px;
  overflow: hidden;
  position: relative;
}

.recommend-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recommend-card:hover .recommend-image img {
  transform: scale(1.1);
}

.recommend-info {
  padding: 10px;
}

.recommend-title-text {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  min-height: 2.6em;
}

.recommend-meta {
  display: flex;
  gap: 10px;
  font-size: 0.85rem;
  color: #6b7280;
}

.recommend-author,
.recommend-views {
  display: flex;
  align-items: center;
  gap: 5px;
}

.recommend-author i,
.recommend-views i {
  color: #ec4899;
}

/* 简洁模式样式 */
.content-layout.simple-mode {
  flex-direction: column;
  align-items: stretch;
}

.content-layout.simple-mode .center-content {
  flex: 1;
  margin: 0;
  max-width: 100%;
  width: 100%;
}

.content-layout.simple-mode .blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
  width: 100%;
  max-width: none;
}

.content-layout.simple-mode .blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: white;
  border: 2px solid #fbcfe8;
  min-width: 205px;
  width: 100%;
  aspect-ratio: 3/4;
}



.content-layout.simple-mode .blog-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

.content-layout.simple-mode .blog-image {
  flex-shrink: 0;  /* 不压缩图片 */
  width: 100%;
  height: 60%;  /* 固定 60% 高度 */
  overflow: hidden;
  position: relative;
}

.content-layout.simple-mode .blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.content-layout.simple-mode .blog-item:hover .blog-image img {
  transform: scale(1.1);
}



.content-layout.simple-mode .blog-info {
  flex: 1;  /* 占据剩余空间 */
  padding: 15px;
  display: flex;
  flex-direction: column;  /* 上下排列 */
  position: relative;
  overflow: hidden;  /* 防止内容溢出 */
}

.content-layout.simple-mode .blog-info-left {
  flex-shrink: 0;  /* 不压缩 */
  margin-bottom: 12px;
}

.content-layout.simple-mode .blog-info-right {
  margin-top: auto;  /* 自动推到底部 */
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.content-layout.simple-mode .blog-title {
  font-size: 0.9rem;
  margin: 0px;
  font-weight: bold;
  line-height: 1.4;
  /* 单行省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-layout.simple-mode .blog-stats {
  font-size: 0.7rem;
  gap: 12px;
  display: flex;
}

.content-layout.simple-mode .stat-item {
  margin: 0 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ============================================================
   博客列表 Grid 布局（懒加载）
   ============================================================ */
.blog-list-grid {
  display: grid;
  gap: 20px;
  /* 移动端：每行 2 个 */
  grid-template-columns: repeat(2, 1fr);
}

/* 平板：每行 3 个 */
@media (min-width: 768px) {
  .blog-list-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 中屏：每行 4 个 */
@media (min-width: 1024px) {
  .blog-list-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 桌面：每行 5 个 */
@media (min-width: 1400px) {
  .blog-list-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* 博客卡片样式 */
.blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: white;
  border: 2px solid #fbcfe8;
  min-width: 0;
  width: 100%;
  aspect-ratio: 3/4;
}

.blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: white;
  border: 2px solid #fbcfe8;
  min-width: 205px;
  width: 100%;
  aspect-ratio: 3/4;  /* 固定卡片比例 3:4 */
}

.blog-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

.blog-image {
  flex-shrink: 0;  /* 不压缩图片 */
  width: 100%;
  height: 60%;  /* 固定 60% 高度 */
  overflow: hidden;
  position: relative;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.blog-item:hover .blog-image img {
  transform: scale(1.1);
}

.blog-info {
  flex: 1;  /* 占据剩余空间 */
  padding: 15px;
  display: flex;
  flex-direction: column;  /* 上下排列 */
  position: relative;
  overflow: hidden;  /* 防止内容溢出 */
}

.blog-info-left {
  flex-shrink: 0;  /* 不压缩 */
  margin-bottom: 12px;
}

.blog-info-right {
  margin-top: auto;  /* 自动推到底部 */
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}

.blog-title {
  font-size: 0.75rem;
  margin: 5px 0;
  font-weight: bold;
  line-height: 1.4;
  /* 单行省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.blog-stats {
  font-size: 0.65rem;
  gap: 10px;
  display: flex;
}

.stat-item {
  margin: 0 5px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: scale(1.1);
}

/* ============================================================
   懒加载指示器样式
   ============================================================ */
.load-more-indicator {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.1rem;
  color: #ec4899;
}

.loading-spinner i {
  font-size: 1.5rem;
}

.no-more-content {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.no-more-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  color: #10b981;
  font-weight: bold;
}

.no-more-text i {
  font-size: 1.3rem;
}


/* 分类导航 - 基础样式 */
.category-nav {
  border-bottom: 3px dashed;
}

.category-nav .container {
  width: 95%;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-list {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-x: auto;
  white-space: nowrap;
}

.nav-item {
  padding: 18px 28px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  font-size: 1.1rem;
}

.nav-item:last-child {
  border-right: none;
}

.nav-item:hover {
  transform: translateY(-2px);
}

.nav-item.active {
  font-weight: bold;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* 主内容区 */
.main-content {
  width: 95%;
  max-width: 1400px;
  margin: 30px auto;
}

/* 三栏布局 */
.content-layout {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

/* 中间主内容 */
.center-content {
  flex: 1;
  min-width: 0;
}

/* 右侧边栏 */
.right-sidebar {
  width: 220px;
  flex-shrink: 0;
}

/* 侧边栏通用样式 */
.sidebar-section {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 3px solid #fbcfe8;
}

.sidebar-title {
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0 0 15px;
  color: #ec4899;
  text-align: center;
  text-shadow: 2px 2px 0px rgba(251, 207, 232, 0.3);
}

/* 文章列表 */
.hot-articles {
  list-style: none;
  padding: 0;
  margin: 0;
}

.article-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 2px solid #fbcfe8;
}

.article-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(251, 207, 232, 0.3);
}

.article-image {
  width: 80px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.article-title {
  margin: 0 0 5px;
  font-size: 0.95rem;
  font-weight: bold;
  line-height: 1.3;
  color: #10b981;
  text-shadow: 1px 1px 0px rgba(167, 243, 208, 0.3);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-meta {
  font-size: 0.8rem;
  color: #6ee7b7;
}

/* 筛选反馈 */
.filter-feedback {
  border-radius: 25px;
  padding: 18px 25px;
  margin-bottom: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-feedback span {
  font-weight: bold;
  font-size: 1.1rem;
}

.clear-filter {
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  font-size: 1rem;
}

.clear-filter:hover {
  transform: translateY(-3px);
  animation: cute-bounce 0.5s ease;
}

/* 博客列表 - 基础样式 */
.blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(265px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
}

/* 博客项 - 基础样式 */
.blog-item {
  display: flex;
  flex-direction: column;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: white;
  border: 2px solid #fbcfe8;
  min-width: 205px;
  width: 100%;
  aspect-ratio: 3/4;
}




.blog-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

/* 博客图片 */
.blog-image {
  width: 100%;
  height: 75%; /* 占卡片的60% */
  overflow: hidden;
  position: relative;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
}



/* 博客信息 */
.blog-info {
  flex: 1;  /* 自适应高度 */
  display: flex;
  flex-direction: column; 
  position: relative;
  justify-content: space-between;
  overflow: hidden;  /* 防止内容溢出 */
}


.blog-info-left {
 
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-right: 10px;
}


.blog-info-right {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
}

.blog-author {
  font-weight: bold;
  color: #333;
}

.blog-item:hover .blog-image img {
  transform: scale(1.1);
}



.blog-title {
  margin: 0px;
  font-size: 1.3rem;
  font-weight: bold;
  line-height: 1.4;
  /* 多行省略（2 行） */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;  /* 限制显示 2 行 */
  -webkit-box-orient: vertical;
}





/* 博客统计 */
.blog-stats {
  display: flex;
  flex-direction: row;
  gap: 5px;
  margin-top: auto;
  font-size: 0.9rem;
  font-weight: bold;
  align-items: flex-end;
}



.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  animation: cute-bounce 0.5s ease;
}

.stat-item i {
  font-size: 1.3rem;
}



.stat-item i.liked {
  color: #ff6b9d;
}

/* 响应式样式 */
/* 平板端样式（768px - 1200px） */
@media (max-width: 1200px) and (min-width: 769px) {
  /* 隐藏评论数量（不占空间） */
  .blog-stats .stat-item:first-child {
    visibility: hidden;
    width: 0;
    padding: 0;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .blog-list {
    grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
    gap: 15px;
  }
  
  .stat-item i {
    font-size: 1.2rem;
  }
  
  .stat-item {
    gap: 6px;
  }
  
  .author-avatar-image {
    width: 20px;
    height: 20px;
    margin-right: 4px;
  }
  
  .blog-author {
    font-size: 1.1rem;
  }
  
  .blog-title {
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .blog-stats {
    font-size: 0.85rem;
    gap: 10px;
  }
}

/* 手机端样式 */
@media (max-width: 480px) {
  .blog-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .blog-item {
    min-width: 100%;
    aspect-ratio: 2/3;
  }
  
  .blog-image {
    height: 70%;
  }
  
  .blog-info {
    height: 30%;
    padding-top:2px;
  }
  
  .blog-title {
    font-size: 1.2rem;
    margin-bottom: 8px;
  }
  
  .blog-stats {
    gap: 15px;
    font-size: 0.8rem;
  }
  
  .blog-stats .stat-item:nth-child(3),
  .blog-stats .stat-item:nth-child(4) {
    display: none;
  }
  
  .stat-item i {
    font-size: 1rem;
  }
  
  .stat-item {
    gap: 4px;
  }
  
  .author-avatar-image {
    width: 28px;
    height: 28px;
    margin-right: 6px;
  }
  
  .blog-author {
    font-size: 0.8rem;
  }
}

/* 移动端隐藏顶部推荐区域 */
@media (max-width: 768px) {
  .top-recommend-section {
    display: none !important;
  }
}

/* 极小屏幕样式 */
@media (max-width: 320px) {
  .blog-item {
    aspect-ratio: 1/1;
  }
  
  .blog-stats .stat-item:nth-child(2) {
    display: none;
  }
  
  .blog-title {
    font-size: 1rem;
    margin-bottom: 6px;
  }
  
  .blog-category {
    padding: 4px 12px;
    font-size: 0.8rem;
    margin-bottom: 6px;
  }
}

.blog-container {
  background: linear-gradient(135deg, #fef3c7 0%, #fbcfe8 100%);
}



.search-btn,
.clear-filter {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

.search-btn:hover,
.clear-filter:hover {
  background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}



/* 分类导航颜色样式 */
.category-nav {
  border-bottom: 3px dashed #ec4899;
}

.nav-item {
  color: #ec4899;
  border-right: 2px dashed #fbcfe8;
}

.nav-item:hover {
  background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%);
  color: #db2777;
}

.nav-item.active {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: white;
  border-color: #fbcfe8;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
}

/* 筛选反馈颜色样式 */
.filter-feedback {
  background: linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%);
  border: 3px double #6ee7b7;
  box-shadow: 0 4px 15px rgba(187, 247, 208, 0.2);
}

.filter-feedback span {
  color: #16a34a;
}

/* 博客项颜色样式 */
.blog-item {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 4px solid #fbcfe8;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.blog-item:hover {
  box-shadow: 0 12px 35px rgba(251, 207, 232, 0.4);
}

/* 博客信息颜色样式 */
.blog-title {
  color: #16a34a;
  text-shadow: 2px 2px 0px rgba(187, 247, 208, 0.3);
}

/* 博客统计颜色样式 */
.blog-stats {
  color: #16a34a;
}

.stat-item i {
  color: #6ee7b7;
}













/* 加载状态和错误提示样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #fbcfe8;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 1.3rem;
  color: #ec4899;
  font-weight: bold;
  margin: 0;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  border-radius: 20px;
  margin-bottom: 25px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #ef4444;
}

.error-message p {
  font-size: 1.2rem;
  color: #991b1b;
  font-weight: bold;
  margin: 0 0 20px;
}

.error-message .btn-primary {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.error-message .btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 15px rgba(239, 68, 68, 0.3);
  animation: cute-bounce 0.5s ease;
}

.loading-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-comments .spinner {
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

.loading-comments p {
  font-size: 1.1rem;
  color: #ec4899;
  font-weight: bold;
  margin: 0;
}

/* 通用按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  animation: cute-bounce 0.5s ease;
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

/* 博客列表信息样式 */
.blog-list-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border-radius: 20px;
  border: 2px solid #ddd6fe;
}

.blog-list-info p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
  color: #6d28d9;
}

.blog-list-info .btn-primary {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
}

.blog-list-info .btn-primary:hover {
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

/* 空状态提示样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  border-radius: 20px;
  margin-bottom: 25px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fbbf24;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: cute-bounce 2s infinite;
}

.empty-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #f59e0b;
  margin: 0 0 15px;
}

.empty-description {
  font-size: 1.1rem;
  color: #d97706;
  margin: 0 0 25px;
  line-height: 1.5;
  max-width: 500px;
}

.empty-state .btn-primary {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.empty-state .btn-primary:hover {
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

/* 下拉刷新样式 */
.pull-refresh-indicator {
  overflow: hidden;
  transition: height 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.pull-refresh-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  gap: 10px;
  color: #6d28d9;
  font-weight: bold;
}

.pull-refresh-icon {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.pull-refresh-icon.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pull-refresh-text {
  margin: 0;
  font-size: 1rem;
}

.pull-refresh-content.refreshing .pull-refresh-icon i {
  transform: rotate(180deg);
}

/* ============================================================
   回到顶部按钮样式
   ============================================================ */
.back-to-top {
  position: fixed;
  right: 30px;
  bottom: 50px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

.back-to-top:active {
  transform: translateY(-2px);
}

/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  /* 手机端隐藏回到顶部按钮 */
  .back-to-top {
    display: none;
  }
}
</style>