// notificationRoutes.js - 通知管理路由
// 定义通知相关的 API 路由，包括：
// 1. 创建通知（点赞、评论、关注等）
// 2. 获取用户通知列表
// 3. 标记通知为已读
// 4. 删除通知
// A: 数据库存储保证离线用户登录后能看到通知；
//    实时推送保证在线用户即时收到通知。
// A: 1. 分页加载，避免一次加载过多
//    2. 定期清理过期通知
//    3. 提供"全部标记已读"功能
// A: 在 Notification 模型中添加 read 字段（布尔值），
//    默认为 false，用户查看后设为 true。

// 模块导入

// 导入 express 框架
const express = require('express');

// 创建路由器实例
// Router() 创建一个可挂载的路由模块
const router = express.Router();

// 导入通知控制器
// 控制器包含具体的业务逻辑处理函数
const notificationController = require('../controllers/NotificationController');

// 导入身份验证中间件
// authMiddleware 用于验证请求中的 JWT token
// 确保只有登录用户才能访问这些路由
const { authMiddleware } = require('../middlewares/auth');

// 路由定义

// 创建通知
// 路由: POST /api/notifications
// 功能: 创建一条新通知
// 认证: 需要登录（authMiddleware）
// 通常由后端其他控制器调用，如：
// - BlogController 中点赞/评论时创建通知
// - userController 中关注时创建通知
// POST /api/notifications
// Headers: { Authorization: Bearer <token> }
// Body: {
//   recipient: '用户ID',      // 接收通知的用户
//   type: 'like',             // 通知类型
//   sender: '发送者ID',       // 触发通知的用户
//   content: '点赞了你的文章',
//   relatedId: '相关资源ID'   // 如文章ID、评论ID等
//   success: true,
//   data: {
//     _id: '通知ID',
//     recipient: '...',
//     type: 'like',
//     read: false,
//     createdAt: '2024-01-01T00:00:00.000Z'
// 此路由一般不直接暴露给前端调用
// 而是由后端其他服务内部调用
router.post('/', authMiddleware, notificationController.createNotification);

// 获取用户通知列表
// 路由: GET /api/notifications
// 功能: 获取当前用户的所有通知
// 认证: 需要登录（authMiddleware）
// GET /api/notifications?page=1&limit=20&unreadOnly=true
// Headers: { Authorization: Bearer <token> }
// - page: 页码，默认为1
// - limit: 每页数量，默认为20
// - unreadOnly: 是否只显示未读，默认为false
//   success: true,
//   data: {
//     notifications: [
//         _id: '...',
//         type: 'like',
//         sender: { username: '张三', avatar: '...' },
//         content: '点赞了你的文章',
//         read: false,
//         createdAt: '2024-01-01T00:00:00.000Z'
//     ],
//     unreadCount: 5,
//     total: 50
// 通常按时间倒序排列（最新的在前）
router.get('/', authMiddleware, notificationController.getNotifications);

// 标记通知为已读
// 路由: PUT /api/notifications/:notificationId/read
// 功能: 将指定通知标记为已读
// 认证: 需要登录（authMiddleware）
// PUT /api/notifications/507f1f77bcf86cd799439011/read
// Headers: { Authorization: Bearer <token> }
// :notificationId - 通知的唯一标识符（MongoDB ObjectId）
//   success: true,
//   message: '通知已标记为已读'
// 使用 PUT 方法因为这是更新操作
// 路径设计为 /:id/read 表示更新通知的已读状态
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);

// 标记所有通知为已读
// 路由: PUT /api/notifications/read-all
// 功能: 将当前用户的所有未读通知标记为已读
// 认证: 需要登录（authMiddleware）
// PUT /api/notifications/read-all
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   message: '已将所有通知标记为已读',
//   data: { modifiedCount: 10 }  // 更新的通知数量
// 用户点击"全部已读"按钮时调用
// 一次性清除所有未读通知的红点提示
// DELETE 通常用于删除资源
// 标记已读是更新状态，不是删除，所以用 PUT
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);

// 删除通知
// 路由: DELETE /api/notifications/:notificationId
// 功能: 删除指定的通知
// 认证: 需要登录（authMiddleware）
// DELETE /api/notifications/507f1f77bcf86cd799439011
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   message: '通知已删除'
// 控制器中应验证通知的接收者是否为当前用户
// 防止用户删除其他人的通知
// - 硬删除：直接从数据库删除记录
// - 软删除：添加 deleted 字段标记为已删除
// 本项目使用硬删除，实际项目中可考虑软删除
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

// 导出路由
// 将路由模块导出，供 index.js 中挂载使用
// 使用方式: app.use('/api/notifications', require('./notificationRoutes'))
module.exports = router;
