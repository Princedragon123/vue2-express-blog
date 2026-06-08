// TopicFollower.js - 话题关注模型
// 记录用户与话题的关注关系，用于：
// 1. 判断用户是否关注某话题
// 2. 获取用户关注的话题列表
// 3. 获取话题的关注者列表
// 4. 统计话题关注数
// A: 用户和话题是多对多关系，需要中间表存储关联
// A: 复合唯一索引 { userId: 1, topicId: 1 }
// A: 使用 $inc 操作符原子性更新

// 导入依赖模块

// Mongoose：MongoDB 对象建模工具
const mongoose = require('mongoose');

// 定义话题关注模式
const topicFollowerSchema = new mongoose.Schema({
    // 用户 ID
    // - 查询用户关注的话题
    // - 判断用户是否关注某话题
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // 话题 ID
    // - 查询话题的关注者
    // - 统计话题关注数
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    
    // 关注时间
    // - 按关注时间排序
    // - 分析用户关注趋势
    followedAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引

// 复合唯一索引
topicFollowerSchema.index({ userId: 1, topicId: 1 }, { unique: true });

// 用户关注时间索引
topicFollowerSchema.index({ userId: 1, followedAt: -1 });

// 话题关注时间索引
topicFollowerSchema.index({ topicId: 1, followedAt: -1 });

// 创建话题关注模型
const TopicFollower = mongoose.models.TopicFollower || mongoose.model('TopicFollower', topicFollowerSchema);

// 导出话题关注模型
// const TopicFollower = require('../models/TopicFollower');
// // 关注话题
// await TopicFollower.create({
//   userId: req.user._id,
//   topicId: topicId
// });
// // 取消关注
// await TopicFollower.deleteOne({
//   userId: req.user._id,
//   topicId: topicId
// });
// // 检查是否关注
// const isFollowing = await TopicFollower.findOne({
//   userId: req.user._id,
//   topicId: topicId
// });
// // 获取用户关注的话题
// const topics = await TopicFollower.find({ userId })
//   .populate('topicId')
//   .sort({ followedAt: -1 });
// // 获取话题的关注者
// const followers = await TopicFollower.find({ topicId })
//   .populate('userId')
//   .sort({ followedAt: -1 });
module.exports = TopicFollower;
