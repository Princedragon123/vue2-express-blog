// ============================================================
// NotificationController.js - 通知控制器
// ============================================================
// 
// 【文件职责】
// 处理通知相关的业务逻辑，包括：
// 1. 创建通知
// 2. 获取通知列表
// 3. 标记已读
// 4. 删除通知
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Mongoose CRUD 操作                                                  │
// │  2. populate 关联查询                                                   │
// │  3. 分页查询：skip + limit                                              │
// │  4. WebSocket 实时推送                                                  │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【通知类型】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  类型        │ 触发场景              │ 资源类型          │ 内容示例     │
// │  ──────────┼─────────────────────┼──────────────────┼───────────── │
// │  like       │ 有人点赞你的文章      │ blog             │ 点赞了你的文章│
// │  comment    │ 有人评论你的文章      │ blog             │ 评论了你的文章│
// │  reply      │ 有人回复你的评论      │ comment          │ 回复了你的评论│
// │  collect    │ 有人收藏你的文章      │ blog             │ 收藏了你的文章│
// │  follow     │ 有人关注你            │ user             │ 关注了你     │
// │  mention    │ 有人@提及你           │ comment          │ 在评论中提及你│
// │  message    │ 有人给你发私信        │ message          │ 给你发送了私信│
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【通知创建流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   用户A 点赞文章                                                        │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       ▼                                                                 │
// │   BlogController.likeBlog()                                            │
// │   ────────────────────                                                  │
// │       │                                                                 │
// │       ├── 1. 更新文章点赞数                                             │
// │       │                                                                 │
// │       ├── 2. 调用 socketService.sendNotification()                     │
// │       │   socketService 会：                                           │
// │       │   - 创建通知记录（数据库）                                      │
// │       │   - 实时推送给接收者（WebSocket）                               │
// │       │                                                                 │
// │       ▼                                                                 │
// │   接收者收到通知                                                        │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       ├── 数据库：Notification 集合中有新记录                          │
// │       │                                                                 │
// │       └── WebSocket：前端实时收到 'notification' 事件                  │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么通知要存数据库而不是只发 WebSocket？
// A: 用户离线时也能收到通知，保证消息不丢失
// 
// Q2: populate 是什么？
// A: 类似 SQL 的 JOIN，根据 ObjectId 查询关联文档
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// 通知模型
const Notification = require('../models/Notification');

// 用户模型
const User = require('../models/User');

// 博客模型
const Blog = require('../models/Blog');

// 评论模型
const Comment = require('../models/Comment');

// ============================================================
// 创建通知
// ============================================================
// 【用途】手动创建通知（一般由其他控制器调用）
// 【方法】POST /notifications
// 【请求体】
//   - receiver: 接收者ID
//   - sender: 发送者ID
//   - type: 通知类型
//   - content: 通知内容
//   - resourceId: 关联资源ID
//   - resourceType: 资源类型
// ============================================================
const createNotification = async (req, res) => {
    try {
        const { receiver, sender, type, content, resourceId, resourceType } = req.body;
        
        // ========================================================
        // 步骤1：验证参数
        // ========================================================
        if (!receiver || !sender || !type || !resourceId || !resourceType) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        // ========================================================
        // 步骤2：检查接收者是否存在
        // ========================================================
        const receiverUser = await User.findById(receiver);
        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: '接收者不存在'
            });
        }
        
        // ========================================================
        // 步骤3：检查发送者是否存在
        // ========================================================
        const senderUser = await User.findById(sender);
        if (!senderUser) {
            return res.status(404).json({
                success: false,
                message: '发送者不存在'
            });
        }
        
        // ========================================================
        // 步骤4：检查资源是否存在
        // ========================================================
        let resourceExists = false;
        if (resourceType === 'blog') {
            const blog = await Blog.findById(resourceId);
            resourceExists = !!blog;
        } else if (resourceType === 'comment') {
            const comment = await Comment.findById(resourceId);
            resourceExists = !!comment;
        }
        
        if (!resourceExists) {
            return res.status(404).json({
                success: false,
                message: '相关资源不存在'
            });
        }
        
        // ========================================================
        // 步骤5：创建通知记录
        // ========================================================
        const notification = new Notification({
            receiver,
            sender,
            type,
            content,
            resourceId,
            resourceType
        });
        
        await notification.save();
        
        // ========================================================
        // 步骤6：通过 WebSocket 实时推送
        // ========================================================
        // 【req.io】从请求对象获取 Socket.io 实例
        // 【to(receiver)】发送给特定用户（房间）
        // 【emit】触发客户端的 'new_notification' 事件
        if (req.io) {
            req.io.to(receiver.toString()).emit('new_notification', {
                _id: notification._id,
                sender: {
                    _id: senderUser._id,
                    username: senderUser.username,
                    profile: {
                        avatar: senderUser.profile?.avatar
                    }
                },
                type,
                content,
                resourceId,
                resourceType,
                isRead: false,
                createdAt: notification.createdAt
            });
        }
        
        // 返回创建的通知
        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('创建通知失败:', error);
        res.status(500).json({
            success: false,
            message: '创建通知失败，请稍后重试'
        });
    }
};

// ============================================================
// 获取用户通知列表
// ============================================================
// 【用途】获取当前用户的通知列表
// 【方法】GET /notifications
// 【查询参数】
//   - page: 页码（默认1）
//   - limit: 每页数量（默认20）
// 【认证】需要登录
// ============================================================
const getNotifications = async (req, res) => {
    try {
        // 从认证中间件获取用户ID
        const userId = req.user.id;
        
        // 分页参数
        const { page = 1, limit = 20 } = req.query;
        
        // 计算偏移量
        // 【公式】offset = (page - 1) * limit
        const offset = (page - 1) * limit;
        
        // ========================================================
        // 查询通知列表
        // ========================================================
        // 【find】查询条件：receiver = 当前用户
        // 【populate】关联查询发送者信息
        //   - 'sender': 关联字段
        //   - '_id username profile.avatar': 只返回这些字段
        // 【sort】按创建时间倒序
        // 【skip】跳过 offset 条记录
        // 【limit】限制返回 limit 条记录
        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', '_id username profile.avatar')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(parseInt(limit));
        
        // ========================================================
        // 获取未读通知数量
        // ========================================================
        const unreadCount = await Notification.countDocuments({ 
            receiver: userId, 
            isRead: false 
        });
        
        // 获取总通知数量
        const totalCount = await Notification.countDocuments({ receiver: userId });
        
        // 返回结果
        res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                total: totalCount,
                unread: unreadCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)  // 总页数
            }
        });
    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取通知列表失败，请稍后重试'
        });
    }
};

// ============================================================
// 标记通知为已读
// ============================================================
// 【用途】将单条通知标记为已读
// 【方法】PUT /notifications/:notificationId/read
// 【参数】
//   - notificationId (URL参数) - 通知ID
// 【认证】需要登录
// ============================================================
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        // 查找通知
        // 【条件】通知ID匹配 + 接收者是当前用户
        const notification = await Notification.findOne({
            _id: notificationId,
            receiver: userId
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '通知不存在'
            });
        }
        
        // 标记为已读
        notification.isRead = true;
        await notification.save();
        
        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('标记通知为已读失败:', error);
        res.status(500).json({
            success: false,
            message: '标记通知为已读失败，请稍后重试'
        });
    }
};

// ============================================================
// 标记所有通知为已读
// ============================================================
// 【用途】将用户所有通知标记为已读
// 【方法】PUT /notifications/read-all
// 【认证】需要登录
// ============================================================
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 批量更新
        // 【updateMany】更新多条记录
        // 【条件】receiver = 当前用户 AND isRead = false
        // 【$set】设置 isRead = true
        await Notification.updateMany(
            { receiver: userId, isRead: false },
            { $set: { isRead: true } }
        );
        
        res.status(200).json({
            success: true,
            message: '所有通知已标记为已读'
        });
    } catch (error) {
        console.error('标记所有通知为已读失败:', error);
        res.status(500).json({
            success: false,
            message: '标记所有通知为已读失败，请稍后重试'
        });
    }
};

// ============================================================
// 删除通知
// ============================================================
// 【用途】删除单条通知
// 【方法】DELETE /notifications/:notificationId
// 【参数】
//   - notificationId (URL参数) - 通知ID
// 【认证】需要登录
// ============================================================
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        // 查找并删除通知
        // 【findOneAndDelete】查找并删除，返回被删除的文档
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            receiver: userId
        });
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '通知不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            message: '通知删除成功'
        });
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({
            success: false,
            message: '删除通知失败，请稍后重试'
        });
    }
};

// ============================================================
// 导出控制器方法
// ============================================================
module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
