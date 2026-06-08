// Follow.js - 关注关系模型
// 定义用户关注关系数据结构，包括：
// 1. 关注者信息
// 2. 被关注者信息
// 3. 唯一性约束（防止重复关注）
// A: 检查两个 Follow 文档是否都存在
//    Follow.findOne({ follower: A, following: B }) &&
//    Follow.findOne({ follower: B, following: A })
// A: Follow.countDocuments({ follower: userId }) // 关注数
//    Follow.countDocuments({ following: userId }) // 粉丝数
// A: 防止同一用户重复关注同一用户

// 导入依赖模块
const mongoose = require('mongoose');

// 定义关注关系 Schema
const followSchema = new mongoose.Schema({
    // 关注者ID（引用 User 模型）
    // // 获取用户A的关注列表
    // Follow.find({ follower: userA_id })
    //   .populate('following', 'username avatar')
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '关注者不能为空']
    },
    
    // 被关注者ID（引用 User 模型）
    // // 获取用户B的粉丝列表
    // Follow.find({ following: userB_id })
    //   .populate('follower', 'username avatar')
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '被关注者不能为空']
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 创建复合唯一索引
// 1. 确保同一用户不能重复关注同一用户
// 2. 提升查询性能
// - follower: 1 表示升序索引
// - following: 1 表示升序索引
// - unique: true 表示组合必须唯一
// 允许：{ follower: A, following: B }
// 允许：{ follower: A, following: C }
// 允许：{ follower: B, following: A }
// 禁止：{ follower: A, following: B }（重复）
// Q: 复合索引的顺序重要吗？
// A: 重要！遵循最左前缀原则
//    这个索引支持：
//    - 查询 { follower: A } ✓
//    - 查询 { follower: A, following: B } ✓
//    - 查询 { following: B } ✗（不走索引）
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// 创建关注模型
const Follow = mongoose.models.Follow || mongoose.model('Follow', followSchema);

// 导出关注模型
// const Follow = require('./models/Follow');
// // 关注用户
// const follow = new Follow({
//   follower: userA_id,
//   following: userB_id
// });
// await follow.save();
// // 取消关注
// await Follow.findOneAndDelete({
//   follower: userA_id,
//   following: userB_id
// });
// // 检查是否关注
// const isFollowing = await Follow.findOne({
//   follower: userA_id,
//   following: userB_id
// });
// // 获取关注列表
// const followingList = await Follow.find({ follower: userId })
//   .populate('following', 'username avatar');
// // 获取粉丝列表
// const followersList = await Follow.find({ following: userId })
//   .populate('follower', 'username avatar');
// // 获取关注数
// const followingCount = await Follow.countDocuments({ follower: userId });
// // 获取粉丝数
// const followersCount = await Follow.countDocuments({ following: userId });
module.exports = Follow;
