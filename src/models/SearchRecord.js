// SearchRecord.js - 搜索记录模型
// 记录用户的搜索行为，用于：
// 1. 热门搜索词统计
// 2. 用户行为分析
// 3. 搜索推荐
// 4. 数据报表
// A: 用于热门搜索、搜索推荐、用户行为分析
// A: 不记录敏感搜索词，定期清理旧数据
// A: 添加索引、定期归档、分表存储

// 导入依赖模块

// Mongoose：MongoDB 对象建模工具
const mongoose = require('mongoose');

// 定义搜索记录模式
const searchRecordSchema = new mongoose.Schema({
  // 搜索关键词
  // - 热门搜索统计
  // - 搜索推荐
  // - 关键词分析
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  
  // 搜索用户
  // - 未登录用户：user = null，通过 IP 追踪
  // - 已登录用户：user = userId，可关联用户画像
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // 搜索时间
  // - 时间范围统计（今日热门、本周热门）
  // - 搜索趋势分析
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 搜索结果数量
  // - 分析搜索效果
  // - 优化搜索算法（无结果的关键词需要优化）
  resultCount: {
    type: Number,
    default: 0
  },
  
  // 搜索 IP
  // - 追踪未登录用户
  // - 防刷统计
  // - 地域分析
  // - 可以对 IP 进行脱敏处理
  // - 定期清理 IP 数据
  ip: {
    type: String,
    default: ''
  }
});

// 创建索引

// 关键词索引
searchRecordSchema.index({ keyword: 1 });

// 时间索引
searchRecordSchema.index({ createdAt: -1 });

// 导出搜索记录模型
// const SearchRecord = require('../models/SearchRecord');
// // 记录搜索
// await SearchRecord.create({
//   keyword: 'vue',
//   user: req.user?._id,
//   ip: req.ip,
//   resultCount: results.length
// });
// // 获取热门搜索
// const hotKeywords = await SearchRecord.aggregate([
//   { $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
//   { $group: { _id: '$keyword', count: { $sum: 1 } } },
//   { $sort: { count: -1 } },
//   { $limit: 10 }
// ]);
module.exports = mongoose.models.SearchRecord || mongoose.model('SearchRecord', searchRecordSchema);
