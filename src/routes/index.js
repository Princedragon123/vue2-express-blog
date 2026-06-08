// index.js - 主路由入口文件
// 统一管理所有API路由，包括：
// 1. 导入各模块路由
// 2. 设置路由前缀
// 3. 挂载路由到主路由
// A: app.use('/api/v1', v1Routes); app.use('/api/v2', v2Routes);
// A: 按挂载顺序执行，先挂载的先执行
// A: 在路由最后添加 app.use((err, req, res, next) => {...})

// 导入依赖模块
// express: Node.js Web 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 导入各模块路由
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

// 表情包路由：收藏、上传
const emojiRoutes = require('./emojiRoutes');

// 井字棋战绩路由：战绩统计、排行榜
const chessRoutes = require('./chessRoutes');

// 挂载路由（设置路由前缀）
// path: 路由前缀
// router: 子路由实例
// 请求 /api/auth/login
//   → 匹配 app.use('/api', routes)
//   → 匹配 router.use('/auth', authRoutes)
//   → 匹配 authRoutes.post('/login', ...)

// 认证路由：前缀 /auth
// POST /api/auth/login - 登录
// POST /api/auth/register - 注册
// GET /api/auth/me - 获取当前用户信息
router.use('/auth', authRoutes);

// 博客路由：前缀 /blogs
// GET /api/blogs - 获取文章列表
// POST /api/blogs - 创建文章
// GET /api/blogs/:id - 获取文章详情
// POST /api/blogs/:id/like - 点赞文章
// POST /api/blogs/upload-image - 上传图片
// POST /api/blogs/upload-video - 上传视频
router.use('/blogs', blogRoutes);

// 用户管理路由：前缀 /users
// GET /api/users/:id - 获取用户信息
// PUT /api/users/:id - 更新用户信息
// GET /api/users/:id/following - 获取关注列表
// GET /api/users/:id/followers - 获取粉丝列表
router.use('/users', userRoutes);

// 私信管理路由：前缀 /messages
// GET /api/messages - 获取会话列表
// GET /api/messages/:userId - 获取与某用户的聊天记录
// POST /api/messages - 发送消息
router.use('/messages', messageRoutes);

// 管理员路由：前缀 /admin
// GET /api/admin/users - 获取所有用户
// PUT /api/admin/users/:id/ban - 封禁用户
// GET /api/admin/blogs - 获取所有文章
// DELETE /api/admin/blogs/:id - 删除文章
router.use('/admin', adminRoutes);

// 通知路由：前缀 /notifications
// GET /api/notifications - 获取通知列表
// PUT /api/notifications/:id/read - 标记已读
// PUT /api/notifications/read-all - 全部标记已读
router.use('/notifications', notificationRoutes);

// 话题路由：前缀 /topics
// GET /api/topics - 获取话题列表
// GET /api/topics/:id - 获取话题详情
// GET /api/topics/:id/blogs - 获取话题下的文章
router.use('/topics', topicRoutes);

// 浏览记录路由：前缀 /history
// GET /api/history - 获取浏览历史
// DELETE /api/history/:id - 删除浏览记录
// DELETE /api/history - 清空浏览历史
router.use('/history', browseHistoryRoutes);

// 表情包路由：前缀 /emojis
// POST /api/emojis/upload - 上传表情包
// GET /api/emojis/favorites - 获取收藏表情包
// DELETE /api/emojis/favorites/:emojiId - 删除收藏表情包
router.use('/emojis', emojiRoutes);

// 井字棋战绩路由：前缀 /chess
// GET /api/chess/stats/:userId - 获取用户战绩统计
// GET /api/chess/leaderboard - 获取战绩排行榜
router.use('/chess', chessRoutes);

// 导出路由
// 在 app.js 中：
// const routes = require('./routes');
// app.use('/api', routes);
// 所有路由都会加上 /api 前缀
// 例如：/auth/login → /api/auth/login
module.exports = router;
