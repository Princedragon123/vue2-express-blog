// chessRoutes.js - 井字棋战绩统计路由
// 提供井字棋战绩查询的 RESTful API，包括：
// 1. 获取用户战绩统计
// 2. 获取战绩排行榜
// 成功：{ code: 200, message: 'success', data: {...} }
// 失败：{ code: 400/404/500, message: '错误信息' }

const express = require('express');
const router = express.Router();
const ChessRecord = require('../models/ChessRecord');
const User = require('../models/User');

// 获取用户战绩统计
// 1. 验证 userId 是否存在
// 2. 查询或创建战绩记录
// 3. 返回战绩数据
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证参数
    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '用户ID不能为空',
      });
    }

    // 查询或创建战绩记录
    const record = await ChessRecord.getOrCreate(userId);

    // 返回战绩数据
    res.status(200).json({
      code: 200,
      message: 'success',
      data: record,
    });
  } catch (error) {
    console.error('[Chess] 获取战绩失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取战绩失败',
      error: error.message,
    });
  }
});

// 获取战绩排行榜
// 1. 解析 limit 参数
// 2. 限制最大值为50
// 3. 查询排行榜数据
// 4. 返回结果
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // 限制最大返回数量
    const maxLimit = Math.min(parseInt(limit) || 10, 50);

    console.log('[Chess] 开始获取排行榜, limit:', maxLimit);

    // 查询排行榜
    const leaderboard = await ChessRecord.getLeaderboard(maxLimit);
    console.log('[Chess] 查询到', leaderboard.length, '条战绩记录');

    // 如果没有数据，返回空数组
    if (!leaderboard || leaderboard.length === 0) {
      console.log('[Chess] 排行榜为空');
      return res.status(200).json({
        code: 200,
        message: 'success',
        data: [],
      });
    }

    // 获取所有用户的用户名（带错误处理）
    try {
      const userIds = leaderboard.map(record => record.userId).filter(id => id);
      
      if (userIds.length > 0) {
        const users = await User.find({ _id: { $in: userIds } }).select('username profile.avatar').lean();
        
        // 创建用户ID到用户信息的映射
        const userMap = {};
        users.forEach(user => {
          if (user && user._id) {
            userMap[user._id.toString()] = {
              username: user.username || '未知用户',
              avatar: (user.profile && user.profile.avatar) ? user.profile.avatar : 'https://picsum.photos/150/150',
            };
          }
        });

        // 将用户名信息附加到排行榜数据中
        const enrichedLeaderboard = leaderboard.map(record => {
          const recordObj = record.toObject ? record.toObject() : record;
          const userInfo = userMap[record.userId] || {};
          
          return {
            ...recordObj,
            username: userInfo.username || '未知用户',
            avatar: userInfo.avatar || 'https://picsum.photos/150/150',
          };
        });

        console.log('[Chess] 排行榜数据准备完成');
        
        // 返回排行榜数据
        return res.status(200).json({
          code: 200,
          message: 'success',
          data: enrichedLeaderboard,
        });
      }
    } catch (userError) {
      console.error('[Chess] 获取用户信息失败，使用默认数据:', userError.message);
      // 如果获取用户信息失败，返回基本数据（不包含用户名）
      const basicLeaderboard = leaderboard.map(record => ({
        ...(record.toObject ? record.toObject() : record),
        username: '未知用户',
        avatar: 'https://picsum.photos/150/150',
      }));

      return res.status(200).json({
        code: 200,
        message: 'success',
        data: basicLeaderboard,
      });
    }

  } catch (error) {
    console.error('[Chess] 获取排行榜失败:', error);
    console.error('[Chess] 错误堆栈:', error.stack);
    
    res.status(500).json({
      code: 500,
      message: '获取排行榜失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
    });
  }
});

// 导出路由
module.exports = router;
