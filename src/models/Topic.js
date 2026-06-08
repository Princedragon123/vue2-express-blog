// Topic.js - 话题模型
// 定义话题（Topic）的数据结构，用于：
// 1. 文章分类和聚合
// 2. 用户关注话题
// 3. 话题下的文章列表
// 4. 热门话题推荐
// A: 分类是层级结构，话题是扁平标签；话题可以关注，分类不行
// A: 按 followersCount 或 articlesCount 降序排序
// A: name 字段设置 unique: true

// 导入依赖模块

// Mongoose：MongoDB 对象建模工具
const mongoose = require('mongoose');

// 定义话题模式
const topicSchema = new mongoose.Schema({
    // 话题名称
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    
    // 话题描述
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    
    // 话题封面图片
    coverImage: {
        type: String
    },
    
    // 关注人数
    followersCount: {
        type: Number,
        default: 0
    },
    
    // 文章数量
    articlesCount: {
        type: Number,
        default: 0
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

// 文本索引
topicSchema.index({ name: 'text', description: 'text' });

// 排序索引
topicSchema.index({ followersCount: -1, articlesCount: -1, createdAt: -1 });

// 创建话题模型
const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

// 导出话题模型
// const Topic = require('../models/Topic');
// // 创建话题
// await Topic.create({
//   name: 'Vue.js',
//   description: 'Vue.js 渐进式 JavaScript 框架'
// });
// // 搜索话题
// const topics = await Topic.find({
//   $text: { $search: 'vue' }
// }).sort({ followersCount: -1 });
// // 获取热门话题
// const hotTopics = await Topic.find()
//   .sort({ followersCount: -1 })
//   .limit(10);
// // 关注话题
// await Topic.findByIdAndUpdate(topicId, {
//   $inc: { followersCount: 1 }
// });
module.exports = Topic;
