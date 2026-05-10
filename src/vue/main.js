// ============================================================
// main.js - Vue 应用入口文件（学习版·应用初始化）
// ============================================================
// 
// 【文件职责】
// 创建和配置 Vue 应用实例，包括：
// 1. 导入依赖和插件
// 2. 配置全局属性和插件
// 3. 设置全局错误处理
// 4. 创建 Vue 根实例
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Vue 应用初始化：导入、配置、创建实例                                │
// │  2. 原型挂载：Vue.prototype 添加全局方法                                │
// │  3. 插件使用：Vue.use() 注册插件                                        │
// │  4. 全局错误处理：捕获各种类型的错误                                    │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Vue 应用启动流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   【Webpack 入口】                                                       │
// │   webpack.config.js                                                    │
// │   entry: './src/vue/main.js'                                           │
// │       │                                                                 │
// │       ▼                                                                 │
// │   【执行 main.js】                                                       │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       ├── 1. 导入 Vue 框架                                              │
// │       ├── 2. 导入根组件 App.vue                                         │
// │       ├── 3. 导入路由配置                                               │
// │       ├── 4. 导入工具函数                                               │
// │       ├── 5. 导入样式文件                                               │
// │       ├── 6. 配置插件                                                   │
// │       ├── 7. 挂载全局属性                                               │
// │       ├── 8. 设置错误处理                                               │
// │       │                                                                 │
// │       ▼                                                                 │
// │   【创建 Vue 实例】                                                      │
// │   new Vue({ ... })                                                      │
// │       │                                                                 │
// │       ├── el: '#app'        → 挂载到 DOM                               │
// │       ├── router            → 注入路由                                 │
// │       ├── render: h => h(App) → 渲染根组件                             │
// │       │                                                                 │
// │       ▼                                                                 │
// │   【挂载完成】                                                           │
// │   index.html 中的 <div id="app">                                       │
// │   被 Vue 实例替换，App 组件渲染完成                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Vue 2 vs Vue 3 入口对比】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【Vue 2（本项目）】                                                     │
// │  import Vue from 'vue'                                                 │
// │  import App from './App.vue'                                           │
// │  import router from './router'                                         │
// │                                                                         │
// │  new Vue({                                                              │
// │    el: '#app',                                                         │
// │    router,                                                             │
// │    render: h => h(App)                                                 │
// │  })                                                                     │
// │                                                                         │
// │  【Vue 3】                                                              │
// │  import { createApp } from 'vue'                                       │
// │  import App from './App.vue'                                           │
// │  import router from './router'                                         │
// │                                                                         │
// │  const app = createApp(App)                                            │
// │  app.use(router)                                                       │
// │  app.mount('#app')                                                     │
// │                                                                         │
// │  【主要区别】                                                            │
// │  1. Vue 3 使用 createApp 创建应用实例                                  │
// │  2. Vue 3 没有 Vue 构造函数，使用 app 实例方法                         │
// │  3. Vue 3 支持多根节点组件（Fragment）                                  │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// ============================================================

// ============================================================
// 【第一部分：导入核心依赖】
// ============================================================

// 导入 Vue 框架
// Vue 是渐进式 JavaScript 框架，用于构建用户界面
import Vue from 'vue';

// 导入根组件
// App.vue 是应用的根组件，包含整个应用的布局结构
import App from './App.vue';

// 导入路由配置
// router 定义了应用的页面导航规则
import router from './router';

// ============================================================
// 【第二部分：导入工具函数】
// ============================================================

// 导入 API 方法封装
// apiMethods 包含所有后端 API 调用方法
// 如：apiMethods.auth.login(), apiMethods.blog.getBlogs() 等
import apiMethods from './utils/api.js';

// 导入错误处理工具
// errorHandler 提供错误日志记录、错误提示等功能
import errorHandler from './utils/errorHandler.js';

// 导入 WebSocket 服务
// socketService 提供 WebSocket 连接和实时通信功能
import socketService from './utils/socket.js';

// ============================================================
// 【第三部分：导入样式文件】
// ============================================================

// 导入 Bootstrap 自定义配置
// 只引入 Grid 系统和必要的工具类，减少文件体积
// 完整的 Bootstrap CSS 被替换为按需引入
import './assets/styles/bootstrap-custom.scss';

// 导入全局样式
// main.scss 包含自定义的全局样式、CSS 变量、工具类等
import './assets/styles/main.scss';

// 导入 Font Awesome 图标 (使用 CDN 方式)
// 注释掉是因为改用 CDN 方式引入，在 index.html 中加载
// import '@fortawesome/fontawesome-free/css/all.min.css';

// ============================================================
// 【第四部分：导入和配置插件】
// ============================================================

// 导入图片懒加载插件
// VueLazyload 用于延迟加载图片，提高页面加载速度
import VueLazyload from 'vue-lazyload';

// 导入 vue-meta 插件
// VueMeta 用于管理页面的 meta 信息（title、description 等）
import VueMeta from 'vue-meta';

// ============================================================
// 【第五部分：挂载全局属性】
// ============================================================
// Vue.prototype.xxx 可以在所有组件中通过 this.xxx 访问

// 将 API 方法挂载到 Vue 原型
// 在组件中使用：this.$http.auth.login()
Vue.prototype.$http = apiMethods;

// 将错误处理工具挂载到 Vue 原型
// 在组件中使用：this.$errorHandler.showError('错误信息')
Vue.prototype.$errorHandler = errorHandler;

// 将 WebSocket 服务挂载到 Vue 原型
// 在组件中使用：this.$socket.connect()
Vue.prototype.$socket = socketService;

// 注意：赛璐璐和樱花效果脚本将在组件内部按需初始化，而不是全局导入
// 这样可以避免与 Vue 组件生命周期冲突

// ============================================================
// 【第六部分：配置插件】
// ============================================================

// ─── 配置图片懒加载插件 ───
// Vue.use() 用于安装 Vue.js 插件
// 如果插件是一个对象，必须提供 install 方法
// 如果插件是一个函数，它会被作为 install 方法
Vue.use(VueLazyload, {
  // preLoad：预加载高度比例
  // 1.3 表示图片距离可视区域 1.3 倍高度时开始加载
  preLoad: 1.3,
  
  // error：图片加载失败时显示的图片
  error: 'https://picsum.photos/40/40',
  
  // loading：图片加载中显示的占位图
  loading: 'https://picsum.photos/40/40?blur=1',
  
  // attempt：尝试加载次数
  attempt: 1
});

// ─── 配置 vue-meta 插件 ───
// 用于管理页面的 meta 信息（SEO 优化）
Vue.use(VueMeta, {
  // keyName：组件中存储 meta 信息的属性名
  // 在组件中定义：metaInfo() { return { title: '页面标题' } }
  keyName: 'metaInfo',
  
  // attribute：生成的 meta 标签上添加的属性名
  // <meta data-vue-meta="true" ...>
  attribute: 'data-vue-meta',
  
  // ssrAttribute：服务端渲染时添加的属性名
  ssrAttribute: 'data-vue-meta-ssr',
  
  // tagIDKeyName：用于识别和更新 meta 标签的唯一标识键名
  tagIDKeyName: 'vmid',
  
  // refreshOnceOnNavigation：导航时只刷新一次 meta 信息
  // 提高性能，避免重复更新
  refreshOnceOnNavigation: true
});

// ============================================================
// 【第七部分：初始化错误处理】
// ============================================================

// 加载保存的错误日志
// 从 localStorage 读取之前保存的错误日志
errorHandler.loadFromStorage();

// ─── Vue 组件错误处理 ───
// Vue.config.errorHandler 捕获组件生命周期钩子中的错误
// 比全局 window.onerror 更精确，可以知道是哪个组件出错
Vue.config.errorHandler = function(err, vm, info) {
  // 在控制台打印错误信息，方便开发调试
  console.error('Vue组件错误:', err, vm, info);
  
  // 记录错误日志
  errorHandler.logError(err, { 
    // 组件名称，用于定位问题
    component: vm.$options.name || 'UnknownComponent',
    // 错误来源信息（如 "created hook"、"v-on handler" 等）
    info: info 
  });
  
  // 显示错误提示给用户
  errorHandler.showError('组件发生错误，请刷新页面重试', 'error');
};

// ─── 全局 JavaScript 错误处理 ───
// window.onerror 捕获所有 JavaScript 运行时错误
// 包括语法错误、未捕获的异常等
window.onerror = function(message, source, lineno, colno, error) {
  // 在控制台打印错误信息，方便开发调试
  console.error('全局JavaScript错误:', { message, source, lineno, colno, error });
  
  // 如果有错误对象，则直接使用错误对象
  if (error) {
    // 调用错误处理工具记录错误，传入错误对象和错误相关信息
    errorHandler.logError(error, { 
      type: 'global',  // 错误类型为全局错误
      source,         // 错误来源文件
      lineno,         // 错误行号
      colno           // 错误列号
    });
  } else {
    // 如果没有错误对象，则创建一个新的 Error 对象
    errorHandler.logError(new Error(message), { 
      type: 'global', 
      source, 
      lineno, 
      colno 
    });
  }
  
  // 返回 true 表示错误已被处理
  // 浏览器不会再显示默认的错误提示
  return true;
};

// ─── 全局未捕获的 Promise 拒绝处理 ───
// window.onunhandledrejection 捕获未处理的 Promise 拒绝
// 当 Promise 被 reject 且没有 catch 处理时触发
window.onunhandledrejection = function(event) {
  console.error('全局未捕获的Promise拒绝:', event.reason);
  
  // 将拒绝原因转换为 Error 对象
  const err = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason));
  
  // 记录错误日志
  errorHandler.logError(err, { type: 'unhandledRejection' });
};

// ============================================================
// 【第八部分：创建 Vue 根实例】
// ============================================================

// 创建 Vue 实例并挂载到 DOM
new Vue({
  // el：指定 Vue 实例挂载的 DOM 元素
  // 对应 index.html 中的 <div id="app"></div>
  el: '#app',
  
  // router：注入路由配置
  // 注入后可以在任何组件中访问 this.$router 和 this.$route
  router,
  
  // render：渲染函数
  // h 是 createElement 的别名，用于创建 VNode（虚拟 DOM 节点）
  // h(App) 创建 App 组件的 VNode
  // 等价于：
  // render: function(createElement) {
  //   return createElement(App);
  // }
  render: h => h(App),
  
  // metaInfo：全局 meta 信息配置
  // 会被子组件的 metaInfo 覆盖或合并
  metaInfo: {
    // 页面标题
    title: '博客系统',
    
    // 标题模板
    // %s 会被子组件的 title 替换
    // 例如子组件 title: '登录' → '登录 - 博客系统'
    titleTemplate: '%s - 博客系统',
    
    // meta 标签配置
    meta: [
      // 字符编码
      { charset: 'utf-8' },
      
      // 视口设置（响应式布局必需）
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      
      // 页面描述（SEO）
      { name: 'description', content: '一个功能丰富的博客系统，支持评论、点赞、收藏、关注等功能' },
      
      // 关键词（SEO）
      { name: 'keywords', content: '博客,评论,点赞,收藏,关注' }
    ]
  }
});

// ============================================================
// 【面试常问问题】
// ============================================================
// 
// Q1: Vue.prototype 和 Vue.use 有什么区别？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【Vue.prototype】                                                       │
// │  - 作用：添加全局属性/方法                                               │
// │  - 使用：在组件中通过 this.xxx 访问                                     │
// │  - 示例：Vue.prototype.$http = apiMethods                               │
// │  - 适用：简单的全局方法                                                  │
// │                                                                         │
// │  【Vue.use】                                                             │
// │  - 作用：安装 Vue.js 插件                                               │
// │  - 原理：调用插件的 install 方法                                        │
// │  - 示例：Vue.use(VueRouter)                                             │
// │  - 适用：复杂的功能模块                                                  │
// │                                                                         │
// │  【插件结构示例】                                                        │
// │  const MyPlugin = {                                                     │
// │    install(Vue, options) {                                             │
// │      // 1. 添加全局方法或属性                                            │
// │      Vue.myGlobalMethod = function() { ... }                           │
// │                                                                         │
// │      // 2. 添加全局资源                                                  │
// │      Vue.directive('my-directive', { ... })                            │
// │                                                                         │
// │      // 3. 注入组件选项                                                  │
// │      Vue.mixin({ ... })                                                 │
// │                                                                         │
// │      // 4. 添加实例方法                                                  │
// │      Vue.prototype.$myMethod = function() { ... }                      │
// │    }                                                                    │
// │  }                                                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q2: 为什么需要全局错误处理？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【目的】                                                                │
// │  1. 用户体验：避免页面崩溃，显示友好的错误提示                          │
// │  2. 问题定位：记录错误日志，方便排查问题                                │
// │  3. 数据收集：收集错误信息，用于分析和改进                              │
// │                                                                         │
// │  【错误类型】                                                            │
// │  1. Vue.config.errorHandler：组件内部错误                              │
// │     - 生命周期钩子错误                                                  │
// │     - 方法调用错误                                                      │
// │     - 计算属性错误                                                      │
// │                                                                         │
// │  2. window.onerror：全局 JavaScript 错误                               │
// │     - 语法错误                                                          │
// │     - 未捕获的异常                                                      │
// │     - 资源加载错误（部分）                                              │
// │                                                                         │
// │  3. window.onunhandledrejection：Promise 拒绝                          │
// │     - 未 catch 的 Promise                                              │
// │     - async/await 未 try-catch                                         │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q3: render 函数的作用是什么？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【模板编译流程】                                                        │
// │  template → compiler → render 函数 → VNode → DOM                       │
// │                                                                         │
// │  【使用 render 的原因】                                                  │
// │  1. 性能：跳过模板编译步骤                                              │
// │  2. 灵活：可以使用 JavaScript 的全部功能                                │
// │  3. 必要：Vue 运行时版本不包含编译器                                    │
// │                                                                         │
// │  【render 函数示例】                                                     │
// │  render: h => h(App)                                                   │
// │                                                                         │
// │  // 等价于                                                              │
// │  render: function(createElement) {                                     │
// │    return createElement(App);                                          │
// │  }                                                                      │
// │                                                                         │
// │  // createElement 参数                                                  │
// │  createElement(                                                         │
// │    'div',           // 标签名或组件                                     │
// │    { class: 'foo' }, // 属性对象                                        │
// │    [ ... ]          // 子节点数组                                       │
// │  )                                                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q4: 什么是图片懒加载？为什么需要？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【定义】                                                                │
// │  图片懒加载（Lazy Load）是一种延迟加载图片的技术                         │
// │  只有当图片进入可视区域时才加载                                          │
// │                                                                         │
// │  【优势】                                                                │
// │  1. 提高页面加载速度：减少首屏请求数量                                  │
// │  2. 节省带宽：用户可能不会滚动到页面底部                                │
// │  3. 提升用户体验：页面更快显示内容                                      │
// │                                                                         │
// │  【工作原理】                                                            │
// │  1. 图片 src 设置为占位图                                               │
// │  2. 真实 URL 存储在 data-src 属性                                       │
// │  3. 监听滚动事件，判断图片是否进入可视区域                              │
// │  4. 进入可视区域后，将 data-src 赋值给 src                              │
// │                                                                         │
// │  【使用示例】                                                            │
// │  <img v-lazy="imageUrl">                                               │
// │  // 或                                                                  │
// │  <div v-lazy:background-image="imageUrl"></div>                        │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// Q5: Vue 实例有哪些生命周期？
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【创建阶段】                                                            │
// │  beforeCreate  → 实例初始化之后，数据观测和事件配置之前                 │
// │  created       → 实例创建完成，数据观测、属性和方法已配置               │
// │                                                                         │
// │  【挂载阶段】                                                            │
// │  beforeMount    → 挂载开始之前，render 函数首次被调用                   │
// │  mounted        → 挂载完成，DOM 已生成，可以访问 this.$el              │
// │                                                                         │
// │  【更新阶段】                                                            │
// │  beforeUpdate   → 数据更新时，DOM 重新渲染之前                          │
// │  updated        → 数据更新后，DOM 重新渲染完成                          │
// │                                                                         │
// │  【销毁阶段】                                                            │
// │  beforeDestroy  → 实例销毁之前，实例仍然可用                            │
// │  destroyed      → 实例销毁后，所有事件监听和子组件已移除                │
// │                                                                         │
// │  【keep-alive 特有】                                                     │
// │  activated      → 被 keep-alive 缓存的组件激活时                        │
// │  deactivated    → 被 keep-alive 缓存的组件停用时                        │
// │                                                                         │
// │  【错误捕获】                                                            │
// │  errorCaptured → 捕获子组件的错误                                       │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================
