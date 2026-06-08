// messageRoutes.js - 私信路由
// 定义私信相关的 API 路由，包括：
// 1. 获取联系人列表
// 2. 获取消息历史
// 3. 发送消息
// 4. 上传附件
// 5. 标记已读
// 6. 分享博客
// A: 私信是私密通信，必须验证用户身份
// A: 消息保存到数据库，用户上线后通过 HTTP 获取历史
// A: multer 中间件处理 multipart/form-data

// 导入依赖模块
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');
const uploadService = require('../services/uploadService');

// 联系人相关路由

// GET /contacts - 获取联系人列表
// [
//     user: { _id, username, avatar },
//     lastMessage: { content, createdAt },
//     unreadCount: 3
//   ...
// ]
// 1. 查询与当前用户有消息往来的所有用户
// 2. 获取每个用户的最后一条消息
// 3. 统计未读消息数
// 4. 按最后消息时间排序
router.get('/contacts', authMiddleware, messageController.getContacts);

// 消息相关路由

// GET /:userId - 获取与特定用户的消息历史
// ?page=1&limit=20
//   messages: [...],
//   user: { _id, username, avatar },
//   hasMore: true
// 1. 查询 sender=我 AND receiver=对方
// 2. 查询 sender=对方 AND receiver=我
// 3. 合并并按时间排序
// 4. 分页返回
router.get('/:userId', authMiddleware, messageController.getMessageHistory);

// POST / - 发送新消息
//   receiver: "接收者ID",
//   content: "消息内容",
//   type: "text" | "image" | "file"
//   _id: "消息ID",
//   sender: {...},
//   receiver: {...},
//   content: "消息内容",
//   createdAt: "2024-01-01"
// 1. 验证接收者存在
// 2. 创建消息记录
// 3. 通过 WebSocket 推送给接收者
// 4. 返回消息信息
router.post('/', authMiddleware, messageController.sendMessage);

// POST /upload - 上传消息附件
// - 处理 multipart/form-data
// - 限制文件大小和类型
// - 保存到指定目录
// - image: 文件
//   url: "/uploads/xxx.jpg",
//   filename: "xxx.jpg"
router.post('/upload', authMiddleware, uploadService.singleUpload('image'), messageController.uploadAttachment);

// PUT /read - 标记消息为已读
//   senderId: "发送者ID"
// 将所有来自该发送者的未读消息标记为已读
// Message.updateMany(
//   { sender: senderId, receiver: me, status: 'unread' },
//   { status: 'read', readAt: new Date() }
// )
router.put('/read', authMiddleware, messageController.markAsRead);

// DELETE /:id - 删除消息
router.delete('/:id', authMiddleware, messageController.deleteMessage);

// 分享功能路由

// POST /share - 分享博客给好友
//   receiverId: "接收者ID",
//   blogId: "博客ID"
//   message: "分享成功",
//   data: { 消息信息 }
// 1. 获取博客信息
// 2. 创建分享消息
// 3. 通过 WebSocket 推送
router.post('/share', authMiddleware, messageController.shareBlog);

// 导出路由
// router.use('/messages', messageRoutes);
// GET  /messages/contacts     → 联系人列表
// GET  /messages/:userId      → 消息历史
// POST /messages              → 发送消息
// POST /messages/upload       → 上传附件
// PUT  /messages/read         → 标记已读
module.exports = router;
