// Comment.js - 评论模型
// 定义评论数据结构，包括：
// 1. 评论内容和作者
// 2. 关联的博客文章
// 3. 嵌套回复功能
// 4. 点赞和置顶功能
// A: 每个评论存储所有祖先ID的数组，或使用物化路径模式
// A: 保留评论引用，避免外键约束问题，支持恢复
// A: 一次查询所有评论，在内存中构建树结构

// 导入依赖模块
const mongoose = require('mongoose');

// 定义评论 Schema
const commentSchema = new mongoose.Schema({
    // 评论内容
    // minlength: 1 - 最少1个字符
    // maxlength: 500 - 最多500个字符
    // 存储前应进行 XSS 过滤
    content: {
        type: String,
        required: [true, '评论内容不能为空'],
        trim: true,
        minlength: [1, '评论内容至少1个字符'],
        maxlength: [500, '评论内容最多500个字符']
    },
    
    // 作者（引用 User 模型）
    // Comment.find().populate('author', 'username avatar')
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '作者不能为空']
    },
    
    // 关联的博客文章（引用 Blog 模型）
    // Comment.find({ blog: blogId })
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: [true, '关联文章不能为空']
    },
    
    // 父评论ID（自引用）
    // - null: 顶级评论（一级评论）
    // - ObjectId: 回复的父评论ID
    // Q: 什么是自引用？
    // A: Schema 引用自身，实现树形结构
    // Q: 如何查询某评论的所有回复？
    // A: Comment.find({ parentId: commentId })
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    
    // 回复的目标用户ID（引用 User 模型）
    // - parentId: 回复的是哪个评论
    // - replyTo: 回复的是哪个用户
    // 用户B回复用户A的评论：
    // parentId: A的评论ID
    // replyTo: 用户A的ID
    // 显示: "用户B 回复 @用户A: ..."
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // 点赞数
    // - 用户点赞评论时 +1
    // - 用户取消点赞时 -1
    // Q: 为什么不实时统计点赞数？
    // A: 预计算存储更高效，避免每次都 count
    likes: {
        type: Number,
        default: 0
    },
    
    // 评论状态
    // - active: 正常显示
    // - deleted: 已删除（不显示，但保留数据）
    // 1. 保留评论引用，避免外键约束问题
    // 2. 支持恢复误删的评论
    // 3. 保留历史记录
    // Comment.find({ blog: blogId, status: 'active' })
    status: {
        type: String,
        enum: {
            values: ['active', 'deleted'],
            message: '状态只能是 active 或 deleted'
        },
        default: 'active'
    },
    
    // 是否置顶
    // 置顶评论优先显示
    // .sort({ isPinned: -1, createdAt: -1 })
    isPinned: {
        type: Boolean,
        default: false
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引

// 复合索引：博客 + 状态 + 时间
commentSchema.index({ blog: 1, status: 1, createdAt: -1 });

// 索引：父评论ID
commentSchema.index({ parentId: 1 });

// 索引：作者
commentSchema.index({ author: 1, createdAt: -1 });

// 创建评论模型
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

// 导出评论模型
// const Comment = require('./models/Comment');
// // 创建顶级评论
// const comment = new Comment({
//   content: '这篇文章写得很好！',
//   author: userId,
//   blog: blogId,
//   parentId: null
// });
// await comment.save();
// // 创建回复
// const reply = new Comment({
//   content: '同意！',
//   author: anotherUserId,
//   blog: blogId,
//   parentId: comment._id,
//   replyTo: userId
// });
// await reply.save();
// // 查询评论树
// const comments = await Comment.find({ blog: blogId, status: 'active' })
//   .populate('author', 'username avatar')
//   .populate('replyTo', 'username')
//   .sort({ isPinned: -1, createdAt: 1 });
module.exports = Comment;
