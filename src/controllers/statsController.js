// 用户数据看板控制器 - 阅读统计、创作分析、粉丝增长

const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const BrowseHistory = require('../models/BrowseHistory');
const { handleControllerError } = require('../utils/errorHandler');

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // 并行查询所有统计数据
    const [
      totalBlogs,
      publishedBlogs,
      totalViews,
      totalLikesReceived,
      totalBookmarksReceived,
      totalCommentsReceived,
      totalFollowers,
      totalFollowing,
      // 最近30天数据
      blogsLast30Days,
      viewsLast30Days,
      likesLast30Days,
      followersLast30Days,
      // 阅读历史统计
      totalReadArticles,
      uniqueTopicsRead,
      // 创作趋势（按月）
      monthlyCreation
    ] = await Promise.all([
      // 总博客数
      Blog.countDocuments({ author: userId }),
      // 已发布博客数
      Blog.countDocuments({ author: userId, $or: [{ status: 'published' }, { status: { $exists: false } }] }),
      // 总浏览量
      Blog.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).then(r => (r[0]?.total || 0)),
      // 总获赞
      Like.countDocuments({ contentId: { $in: await Blog.find({ author: userId }).select('_id').lean().then(bs => bs.map(b => b._id)) }, contentType: 'blog' }),
      // 总收藏
      Bookmark.countDocuments({ blog: { $in: await Blog.find({ author: userId }).select('_id').lean().then(bs => bs.map(b => b._id)) } }),
      // 总评论
      Comment.countDocuments({ blog: { $in: await Blog.find({ author: userId }).select('_id').lean().then(bs => bs.map(b => b._id)) }, status: 'active' }),
      // 粉丝数
      Follow.countDocuments({ following: userId }),
      // 关注数
      Follow.countDocuments({ follower: userId }),
      // 最近30天发布的博客
      Blog.countDocuments({ author: userId, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      // 最近30天新增浏览量
      Blog.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).then(r => (r[0]?.total || 0)),
      // 最近30天新增获赞
      Like.countDocuments({
        contentId: { $in: await Blog.find({ author: userId }).select('_id').lean().then(bs => bs.map(b => b._id)) },
        contentType: 'blog',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      // 最近30天新增粉丝
      Follow.countDocuments({
        following: userId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      // 总阅读文章数
      BrowseHistory.countDocuments({ user: userId }),
      // 阅读过的话题数（从浏览历史中提取）
      BrowseHistory.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $lookup: { from: 'blogs', localField: 'blog', foreignField: '_id', as: 'blogInfo' } },
        { $unwind: { path: '$blogInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$blogInfo.topic' } },
        { $match: { _id: { $ne: null } } }
      ]).then(r => r.length),
      // 创作趋势（近6个月，按月统计）
      Blog.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId), createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 }, views: { $sum: '$views' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    // 计算互动率（有互动的文章比例）
    const interactionRate = totalBlogs > 0
      ? Math.round((totalLikesReceived + totalBookmarksReceived + totalCommentsReceived) / totalBlogs * 100) / 100
      : 0;

    // 计算粉丝增长率
    const followerGrowthRate = totalFollowers > 0
      ? Math.round(followersLast30Days / totalFollowers * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalBlogs,
          publishedBlogs,
          totalViews,
          totalLikesReceived,
          totalBookmarksReceived,
          totalCommentsReceived,
          totalFollowers,
          totalFollowing,
          interactionRate
        },
        last30Days: {
          newBlogs: blogsLast30Days,
          newViews: viewsLast30Days,
          newLikes: likesLast30Days,
          newFollowers: followersLast30Days,
          followerGrowthRate
        },
        reading: {
          totalReadArticles,
          uniqueTopicsRead
        },
        creationTrend: monthlyCreation
      }
    });
  } catch (error) {
    handleControllerError(res, error, '获取用户数据看板失败');
  }
};

// 获取最受欢迎的文章 TOP5
exports.getTopArticles = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const topArticles = await Blog.find({
      author: userId,
      $or: [{ status: 'published' }, { status: { $exists: false } }]
    })
      .sort({ views: -1 })
      .limit(5)
      .select('title views likes comments createdAt')
      .lean();

    res.json({ success: true, data: topArticles });
  } catch (error) {
    handleControllerError(res, error, '获取热门文章失败');
  }
};
