// Like.js - 点赞模型
// 定义点赞（Like）的数据结构，支持对博客和评论的点赞


const mongoose = require('mongoose');


const likeSchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 不指定 ref，因为可能是 Blog 或 Comment
    // 需要根据 contentType 来确定关联哪个模型
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    
    // enum - 枚举验证，限制只能取指定的值
    // 'blog' - 博客点赞
    // 'comment' - 评论点赞
    contentType: {
        type: String,
        enum: ['blog', 'comment'],
        required: true
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 确保用户对同一类型的内容只能点赞一次
// 索引键：(user, contentId, contentType)
likeSchema.index({ user: 1, contentId: 1, contentType: 1 }, { unique: true });

// 'Like' → 'likes' 集合
const Like = mongoose.models.Like || mongoose.model('Like', likeSchema);

module.exports = Like;
