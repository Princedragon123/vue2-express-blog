// ============================================================
// index.js - 主路由入口文件
// ============================================================
// 
// 【文件职责】
// 统一管理所有API路由，包括：
// 1. 导入各模块路由
// 2. 设置路由前缀
// 3. 挂载路由到主路由
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Express Router：模块化路由管理                                      │
// │  2. router.use()：挂载子路由                                            │
// │  3. 路由前缀：统一API路径格式                                           │
// │  4. 模块化设计：按功能拆分路由文件                                      │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Express Router 基础】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【什么是 Router？】                                                     │
// │  Router 是 Express 提供的路由模块化工具                                 │
// │  可以将路由拆分到不同文件，便于管理                                     │
// │                                                                         │
// │  【创建 Router】                                                         │
// │  const router = express.Router();                                      │
// │                                                                         │
// │  【挂载 Router】                                                         │
// │  app.use('/api', router);                                              │
// │  // 所有路由都会加上 /api 前缀                                          │
// │                                                                         │
// │  【路由前缀的作用】                                                      │
// │  router.use('/auth', authRoutes);                                      │
// │  // authRoutes 中的 '/' 实际路径是 '/auth'                              │
// │  // authRoutes 中的 '/login' 实际路径是 '/auth/login'                   │
// │                                                                         │
// │  【面试常问】                                                            │
// │  Q: Router 和 app 的区别？                                              │
// │  A: Router 是迷你版 app，只处理路由，不能独立运行                       │
// │                                                                         │
// │  Q: 为什么要模块化路由？                                                │
// │  A: 代码更清晰，便于维护，支持团队协作                                  │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【路由结构图】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   主应用 (app.js)                                                       │
// │   ────────────────                                                     │
// │       │                                                                 │
// │       └── app.use('/api', routes)                                      │
// │               │                                                         │
// │               ├── /auth/* ──────→ authRoutes                           │
// │               │                   ├── POST /login                      │
// │               │                   ├── POST /register                   │
// │               │                   └── GET /me                          │
// │               │                                                         │
// │               ├── /blogs/* ─────→ blogRoutes                           │
// │               │                   ├── GET /                            │
// │               │                   ├── POST /                           │
// │               │                   ├── GET /:id                         │
// │               │                   └── POST /:id/like                   │
// │               │                                                         │
// │               ├── /messages/* ──→ messageRoutes                        │
// │               │                   ├── GET /                            │
// │               │                   └── POST /                           │
// │               │                                                         │
// │               └── /admin/* ─────→ adminRoutes                          │
// │                                   ├── GET /users                       │
// │                                   └── PUT /users/:id/ban               │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【API 路径对照表】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  模块          │ 前缀          │ 示例路径                              │
// │  ─────────────┼───────────────┼──────────────────────────────────────  │
// │  authRoutes   │ /auth         │ POST /api/auth/login                  │
// │  blogRoutes   │ /blogs        │ GET /api/blogs                        │
// │  userRoutes   │ /users        │ GET /api/users/:id                    │
// │  messageRoutes│ /messages     │ POST /api/messages                    │
// │  adminRoutes  │ /admin        │ GET /api/admin/users                  │
// │  notificationRoutes│ /notifications│ GET /api/notifications          │
// │  topicRoutes  │ /topics       │ GET /api/topics                       │
// │  historyRoutes│ /history      │ GET /api/history                      │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 如何实现路由版本控制？
// A: app.use('/api/v1', v1Routes); app.use('/api/v2', v2Routes);
// 
// Q2: 路由中间件的执行顺序？
// A: 按挂载顺序执行，先挂载的先执行
// 
// Q3: 如何实现路由级别的错误处理？
// A: 在路由最后添加 app.use((err, req, res, next) => {...})
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
// express: Node.js Web 框架
const express = require('express');

// 创建路由实例
// 【语法】express.Router([options])
// 【options】可选配置，如 caseSensitive, mergeParams 等
const router = express.Router();

// ============================================================
// 导入各模块路由
// ============================================================
// 【模块化设计】
// 每个功能模块有独立的路由文件
// 便于维护和团队协作

// 认证路由：登录、注册、获取当前用户
const authRoutes = require('./authRoutes');

// 博客路由：文章 CRUD、点赞、评论、文件上传
const blogRoutes = require('./blogRoutes');

// 用户管理路由：用户信息、关注、粉丝
const userRoutes = require('./userRoutes');

// 私信管理路由：发送消息、获取聊天记录
const messageRoutes = require('./messageRoutes');

// 管理员路由：用户管理、内容审核
const adminRoutes = require('./adminRoutes');

// 通知路由：获取通知、标记已读
const notificationRoutes = require('./notificationRoutes');

// 话题路由：话题列表、话题详情
const topicRoutes = require('./topicRoutes');

// 浏览记录路由：浏览历史
const browseHistoryRoutes = require('./browseHistoryRoutes');

// ============================================================
// 挂载路由（设置路由前缀）
// ============================================================
// 【语法】router.use(path, router)
// path: 路由前缀
// router: 子路由实例
// 
// 【执行流程】
// 请求 /api/auth/login
//   → 匹配 app.use('/api', routes)
//   → 匹配 router.use('/auth', authRoutes)
//   → 匹配 authRoutes.post('/login', ...)
// ============================================================

// 认证路由：前缀 /auth
// 【路径示例】
// POST /api/auth/login - 登录
// POST /api/auth/register - 注册
// GET /api/auth/me - 获取当前用户信息
router.use('/auth', authRoutes);

// 博客路由：前缀 /blogs
// 【路径示例】
// GET /api/blogs - 获取文章列表
// POST /api/blogs - 创建文章
// GET /api/blogs/:id - 获取文章详情
// POST /api/blogs/:id/like - 点赞文章
// POST /api/blogs/upload-image - 上传图片
// POST /api/blogs/upload-video - 上传视频
router.use('/blogs', blogRoutes);

// 用户管理路由：前缀 /users
// 【路径示例】
// GET /api/users/:id - 获取用户信息
// PUT /api/users/:id - 更新用户信息
// GET /api/users/:id/following - 获取关注列表
// GET /api/users/:id/followers - 获取粉丝列表
router.use('/users', userRoutes);

// 私信管理路由：前缀 /messages
// 【路径示例】
// GET /api/messages - 获取会话列表
// GET /api/messages/:userId - 获取与某用户的聊天记录
// POST /api/messages - 发送消息
router.use('/messages', messageRoutes);

// 管理员路由：前缀 /admin
// 【路径示例】
// GET /api/admin/users - 获取所有用户
// PUT /api/admin/users/:id/ban - 封禁用户
// GET /api/admin/blogs - 获取所有文章
// DELETE /api/admin/blogs/:id - 删除文章
router.use('/admin', adminRoutes);

// 通知路由：前缀 /notifications
// 【路径示例】
// GET /api/notifications - 获取通知列表
// PUT /api/notifications/:id/read - 标记已读
// PUT /api/notifications/read-all - 全部标记已读
router.use('/notifications', notificationRoutes);

// 话题路由：前缀 /topics
// 【路径示例】
// GET /api/topics - 获取话题列表
// GET /api/topics/:id - 获取话题详情
// GET /api/topics/:id/blogs - 获取话题下的文章
router.use('/topics', topicRoutes);

// 浏览记录路由：前缀 /history
// 【路径示例】
// GET /api/history - 获取浏览历史
// DELETE /api/history/:id - 删除浏览记录
// DELETE /api/history - 清空浏览历史
router.use('/history', browseHistoryRoutes);

// ============================================================
// 导出路由
// ============================================================
// 【使用方法】
// 在 app.js 中：
// const routes = require('./routes');
// app.use('/api', routes);
// 
// 【完整路径】
// 所有路由都会加上 /api 前缀
// 例如：/auth/login → /api/auth/login
// ============================================================
module.exports = router;
