// 创建和配置 Vue 应用实例，包括：
// 1. 导入依赖和插件
// 2. 配置全局属性和插件
// 3. 设置全局错误处理
// 4. 创建 Vue 根实例


// 导入 Vue 框架
// Vue 是渐进式 JavaScript 框架，用于构建用户界面
import Vue from 'vue';

// 导入根组件
// App.vue 是应用的根组件，包含整个应用的布局结构
import App from './App.vue';

// 导入路由配置
// router 定义了应用的页面导航规则
import router from './router';

// 导入 Vuex 状态管理
// store 定义了应用的全局状态
import store from './store';


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

 
// 导入 Bootstrap 自定义配置
// 只引入 Grid 系统和必要的工具类，减少文件体积
// 完整的 Bootstrap CSS 被替换为按需引入
import './assets/styles/bootstrap-custom.scss';

// 导入全局样式
// main.scss 包含自定义的全局样式、CSS 变量、工具类等
import './assets/styles/main.scss';
// main.js
import './assets/styles/auth-common.scss';
// 导入 Font Awesome 图标 (使用 CDN 方式)
// 注释掉是因为改用 CDN 方式引入，在 index.html 中加载
// import '@fortawesome/fontawesome-free/css/all.min.css';


// 导入图片懒加载插件
// VueLazyload 用于延迟加载图片，提高页面加载速度
import VueLazyload from 'vue-lazyload';

// 导入 vue-meta 插件
// VueMeta 用于管理页面的 meta 信息（title、description 等）
import VueMeta from 'vue-meta';

// 导入 SVG 图标组件
// SvgIcon 提供内联 SVG 图标，替代 Font Awesome，无需外部 CDN
import SvgIcon from './components/SvgIcon.vue';
Vue.component('SvgIcon', SvgIcon);

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


// 加载保存的错误日志
// 从 localStorage 读取之前保存的错误日志
errorHandler.loadFromStorage();

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


// 创建 Vue 实例并挂载到 DOM
new Vue({
  // el：指定 Vue 实例挂载的 DOM 元素
  // 对应 index.html 中的 <div id="app"></div>
  el: '#app',
  
  // router：注入路由配置
  // 注入后可以在任何组件中访问 this.$router 和 this.$route
  router,
  
  // store：注入 Vuex 状态管理
  // 注入后可以在任何组件中访问 this.$store
  store,
  
  // render：渲染函数
  // h 是 createElement 的别名，用于创建 VNode（虚拟 DOM 节点）
  // h(App) 创建 App 组件的 VNode
  // 等价于：
  // render: function(createElement) {
  //   return createElement(App);
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

