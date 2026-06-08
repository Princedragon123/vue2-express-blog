// NotificationController.js - 通知控制器
// 处理通知相关的业务逻辑，包括：
// 1. 创建通知
// 2. 获取通知列表
// 3. 标记已读
// 4. 删除通知
// A: 用户离线时也能收到通知，保证消息不丢失
// A: 类似 SQL 的 JOIN，根据 ObjectId 查询关联文档

// 导入依赖模块

// 通知模型
const Notification = require('../models/Notification');

// 用户模型
const User = require('../models/User');

// 博客模型
const Blog = require('../models/Blog');

// 评论模型
const Comment = require('../models/Comment');

// 创建通知
//   - receiver: 接收者ID
//   - sender: 发送者ID
//   - type: 通知类型
//   - content: 通知内容
//   - resourceId: 关联资源ID
//   - resourceType: 资源类型
const createNotification = async (req, res) => {
    try {
        const { receiver, sender, type, content, resourceId, resourceType } = req.body;
        
        // 步骤1：验证参数
        if (!receiver || !sender || !type || !resourceId || !resourceType) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        // 步骤2：检查接收者是否存在
        const receiverUser = await User.findById(receiver);
        if (!receiverUser) {
            return res.status(404).json({
                success: false,
                message: '接收者不存在'
            });
        }
        
        // 步骤3：检查发送者是否存在
        const senderUser = await User.findById(sender);
        if (!senderUser) {
            return res.status(404).json({
                success: false,
                message: '发送者不存在'
            });
        }
        
        // 步骤4：检查资源是否存在
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
        
        // 步骤5：创建通知记录
        const notification = new Notification({
            receiver,
            sender,
            type,
            content,
            resourceId,
            resourceType
        });
        
        await notification.save();
        
        // 步骤6：通过 WebSocket 实时推送
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

// 获取用户通知列表
//   - page: 页码（默认1）
//   - limit: 每页数量（默认20）
const getNotifications = async (req, res) => {
    try {
        // 从认证中间件获取用户ID
        const userId = req.user.id;
        
        // 分页参数
        const { page = 1, limit = 20 } = req.query;
        
        // 计算偏移量
        const offset = (page - 1) * limit;
        
        // 查询通知列表
        //   - 'sender': 关联字段
        //   - '_id username profile.avatar': 只返回这些字段
        const notifications = await Notification.find({ receiver: userId })
            .populate('sender', '_id username profile.avatar')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(parseInt(limit));
        
        // 获取未读通知数量
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

// 标记通知为已读
//   - notificationId (URL参数) - 通知ID
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        // 查找通知
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

// 标记所有通知为已读
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 批量更新
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

// 删除通知
//   - notificationId (URL参数) - 通知ID
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        // 查找并删除通知
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

// 导出控制器方法
module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
