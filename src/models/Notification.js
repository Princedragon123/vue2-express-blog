// Notification.js - 用户通知模型
// 定义用户通知数据结构，包括：
// 1. 通知类型（点赞、评论、关注等）
// 2. 发送者和接收者信息
// 3. 关联资源信息
// 4. 已读状态
// A: Notification.countDocuments({ receiver: userId, isRead: false })
// A: Notification.updateMany({ receiver: userId }, { isRead: true })
// A: 需要定期清理旧通知，或设置过期时间（TTL索引）

// 导入依赖模块
const mongoose = require('mongoose');

// 定义通知 Schema
const notificationSchema = new mongoose.Schema({
    // 接收者（引用 User 模型）
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '接收者不能为空']
    },
    
    // 发送者（引用 User 模型）
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '发送者不能为空']
    },
    
    // 通知类型
    // - like: 点赞通知
    // - comment: 评论通知
    // - reply: 回复通知
    // - collect: 收藏通知
    // - follow: 关注通知
    // - mention: @提及通知
    // - message: 私信通知
    // Q: 为什么用枚举而不是字符串？
    // A: 限制取值范围，防止无效数据，便于查询
    type: {
        type: String,
        enum: {
            values: ['like', 'comment', 'reply', 'collect', 'follow', 'mention', 'message'],
            message: '通知类型无效'
        },
        required: [true, '通知类型不能为空']
    },
    
    // 通知内容
    content: {
        type: String,
        trim: true
    },
    
    // 相关资源ID（多态关联）
    // - 点赞通知：resourceId = 文章ID, resourceType = 'blog'
    // - 评论通知：resourceId = 评论ID, resourceType = 'comment'
    // - 关注通知：resourceId = 关注者ID, resourceType = 'user'
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, '资源ID不能为空']
    },
    
    // 资源类型（多态关联）
    // Q: 为什么需要 resourceType？
    // A: 因为 resourceId 可能关联不同类型的文档，
    //    需要 resourceType 来确定如何 populate
    resourceType: {
        type: String,
        enum: {
            values: ['blog', 'comment', 'user', 'message'],
            message: '资源类型无效'
        },
        required: [true, '资源类型不能为空']
    },
    
    // 是否已读
    // - 用户点击通知时
    // - 用户打开通知列表时
    // - 用户点击"全部标记已读"时
    isRead: {
        type: Boolean,
        default: false
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引（可选，提升查询性能）

// 复合索引：接收者 + 已读状态 + 时间
notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

// 索引：接收者 + 时间
notificationSchema.index({ receiver: 1, createdAt: -1 });

// 创建通知模型
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// 导出通知模型
// const Notification = require('./models/Notification');
// // 创建通知
// const notification = new Notification({
//   receiver: authorId,
//   sender: userId,
//   type: 'like',
//   content: '点赞了你的文章',
//   resourceId: blogId,
//   resourceType: 'blog'
// });
// await notification.save();
// // 查询未读通知
// const unreadCount = await Notification.countDocuments({
//   receiver: userId,
//   isRead: false
// });
// // 标记已读
// await Notification.updateMany(
//   { receiver: userId, isRead: false },
//   { isRead: true }
// );
module.exports = Notification;
