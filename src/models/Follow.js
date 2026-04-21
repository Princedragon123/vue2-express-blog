// ============================================================
// Follow.js - 关注关系模型
// ============================================================
// 
// 【文件职责】
// 定义用户关注关系数据结构，包括：
// 1. 关注者信息
// 2. 被关注者信息
// 3. 唯一性约束（防止重复关注）
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 双向引用：follower 和 following 都引用 User 模型                    │
// │  2. 复合唯一索引：防止重复关注                                          │
// │  3. 关注/粉丝查询：通过不同字段查询                                     │
// │  4. 关注状态判断：检查文档是否存在                                      │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【关注关系图解】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   用户A 关注 用户B                                                      │
// │   ─────────────────                                                    │
// │       │                                                                 │
// │       ▼                                                                 │
// │   创建 Follow 文档                                                      │
// │   ┌─────────────────────────────────────┐                              │
// │   │  follower: 用户A的ID                │                              │
// │   │  following: 用户B的ID               │                              │
// │   └─────────────────────────────────────┘                              │
// │       │                                                                 │
// │       ▼                                                                 │
// │   数据库中的关系                                                        │
// │   ─────────────                                                        │
// │   用户A 的关注列表：包含用户B                                           │
// │   用户B 的粉丝列表：包含用户A                                           │
// │                                                                         │
// │   【查询方式】                                                          │
// │   - 查用户A的关注：Follow.find({ follower: A })                         │
// │   - 查用户B的粉丝：Follow.find({ following: B })                        │
// │   - 查是否关注：Follow.findOne({ follower: A, following: B })           │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【follower vs following 的区别】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【follower】关注者                                                      │
// │  - 发起关注动作的用户                                                   │
// │  - "我关注了谁" → 查 follower = 我                                     │
// │                                                                         │
// │  【following】被关注者                                                   │
// │  - 被关注的用户                                                         │
// │  - "谁关注了我" → 查 following = 我                                    │
// │                                                                         │
// │  【记忆技巧】                                                            │
// │  follower: 跟随者（我跟着别人）                                         │
// │  following: 我正在关注的（别人跟着我）                                  │
// │                                                                         │
// │  【示例】                                                                │
// │  用户A 关注 用户B：                                                     │
// │  { follower: A, following: B }                                         │
// │  - A的关注列表：查 follower = A                                         │
// │  - B的粉丝列表：查 following = B                                        │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 如何实现"互相关注"检测？
// A: 检查两个 Follow 文档是否都存在
//    Follow.findOne({ follower: A, following: B }) &&
//    Follow.findOne({ follower: B, following: A })
// 
// Q2: 如何获取关注/粉丝数量？
// A: Follow.countDocuments({ follower: userId }) // 关注数
//    Follow.countDocuments({ following: userId }) // 粉丝数
// 
// Q3: 为什么用复合唯一索引？
// A: 防止同一用户重复关注同一用户
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
const mongoose = require('mongoose');

// ============================================================
// 定义关注关系 Schema
// ============================================================
const followSchema = new mongoose.Schema({
    // ========================================================
    // 关注者ID（引用 User 模型）
    // ========================================================
    // 【含义】谁发起了关注
    // 【示例】用户A关注用户B，follower = 用户A的ID
    // 
    // 【查询示例】
    // // 获取用户A的关注列表
    // Follow.find({ follower: userA_id })
    //   .populate('following', 'username avatar')
    // ========================================================
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '关注者不能为空']
    },
    
    // ========================================================
    // 被关注者ID（引用 User 模型）
    // ========================================================
    // 【含义】被谁关注
    // 【示例】用户A关注用户B，following = 用户B的ID
    // 
    // 【查询示例】
    // // 获取用户B的粉丝列表
    // Follow.find({ following: userB_id })
    //   .populate('follower', 'username avatar')
    // ========================================================
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

// ============================================================
// 创建复合唯一索引
// ============================================================
// 【语法】schema.index({ field1: 1, field2: 1 }, { unique: true })
// 
// 【作用】
// 1. 确保同一用户不能重复关注同一用户
// 2. 提升查询性能
// 
// 【索引说明】
// - follower: 1 表示升序索引
// - following: 1 表示升序索引
// - unique: true 表示组合必须唯一
// 
// 【效果】
// 允许：{ follower: A, following: B }
// 允许：{ follower: A, following: C }
// 允许：{ follower: B, following: A }
// 禁止：{ follower: A, following: B }（重复）
// 
// 【面试常问】
// Q: 复合索引的顺序重要吗？
// A: 重要！遵循最左前缀原则
//    这个索引支持：
//    - 查询 { follower: A } ✓
//    - 查询 { follower: A, following: B } ✓
//    - 查询 { following: B } ✗（不走索引）
// ============================================================
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// ============================================================
// 创建关注模型
// ============================================================
// 【集合名】follows（自动转为小写复数）
// ============================================================
const Follow = mongoose.model('Follow', followSchema);

// ============================================================
// 导出关注模型
// ============================================================
// 【使用示例】
// const Follow = require('./models/Follow');
// 
// // 关注用户
// const follow = new Follow({
//   follower: userA_id,
//   following: userB_id
// });
// await follow.save();
// 
// // 取消关注
// await Follow.findOneAndDelete({
//   follower: userA_id,
//   following: userB_id
// });
// 
// // 检查是否关注
// const isFollowing = await Follow.findOne({
//   follower: userA_id,
//   following: userB_id
// });
// 
// // 获取关注列表
// const followingList = await Follow.find({ follower: userId })
//   .populate('following', 'username avatar');
// 
// // 获取粉丝列表
// const followersList = await Follow.find({ following: userId })
//   .populate('follower', 'username avatar');
// 
// // 获取关注数
// const followingCount = await Follow.countDocuments({ follower: userId });
// 
// // 获取粉丝数
// const followersCount = await Follow.countDocuments({ following: userId });
// ============================================================
module.exports = Follow;
