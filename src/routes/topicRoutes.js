// topicRoutes.js
// 定义话题相关的 API 路由，包括：
// 1. 话题的创建和查询
// 2. 话题关注/取消关注
// 3. 获取话题下的文章
// 4. 话题搜索功能
// A: 话题是内容聚合，用户可以关注话题；
//    标签是文章属性，用于分类检索。
// A: 可以根据 followerCount 或 articleCount 排序，
//    也可以结合时间因素计算热度分数。
// A: 可以在首页看到关注话题的最新文章，
//    类似于订阅功能。

// 模块导入

// 导入 express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 导入话题控制器
// 控制器处理话题相关的业务逻辑
const topicController = require('../controllers/topicController');

// 导入认证中间件
// 用于验证用户身份，保护需要登录的路由
const { authMiddleware } = require('../middlewares/auth');

// 路由定义

// 创建话题
// 路由: POST /api/topics
// 功能: 创建一个新话题
// 认证: 需要登录（authMiddleware）
// POST /api/topics
// Headers: { Authorization: Bearer <token> }
// Body: {
//   name: 'Vue3学习',
//   description: 'Vue3相关技术分享',
//   coverImage: 'https://...'
//   success: true,
//   data: {
//     _id: '...',
//     name: 'Vue3学习',
//     description: 'Vue3相关技术分享',
//     followerCount: 0,
//     articleCount: 0,
//     createdBy: '用户ID'
// 1. 验证话题名称是否已存在
// 2. 创建话题记录
// 3. 创建者自动关注该话题
router.post('/', authMiddleware, topicController.createTopic);

// 获取话题列表
// 路由: GET /api/topics
// 功能: 获取所有话题列表
// 认证: 不需要登录（公开）
// GET /api/topics?page=1&limit=20&sortBy=followers
// - page: 页码
// - limit: 每页数量
// - sortBy: 排序方式（followers/articleCount/latest）
//   success: true,
//   data: {
//     topics: [
//         _id: '...',
//         name: '前端开发',
//         description: '...',
//         followerCount: 1000,
//         articleCount: 500
//     ],
//     total: 50
// 话题列表是公开内容，任何人都应该能浏览
// 这样可以吸引未登录用户注册
router.get('/', topicController.getTopics);

// 获取话题详情
// 路由: GET /api/topics/:id
// 功能: 获取指定话题的详细信息
// 认证: 不需要登录（公开）
// GET /api/topics/507f1f77bcf86cd799439011
//   success: true,
//   data: {
//     _id: '...',
//     name: 'Vue3学习',
//     description: '...',
//     coverImage: '...',
//     followerCount: 100,
//     articleCount: 50,
//     createdBy: { username: '...', avatar: '...' },
//     isFollowing: false  // 当前用户是否关注（登录时返回）
router.get('/:id', topicController.getTopicById);

// 关注话题
// 路由: POST /api/topics/:id/follow
// 功能: 当前用户关注指定话题
// 认证: 需要登录（authMiddleware）
// POST /api/topics/507f1f77bcf86cd799439011/follow
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   message: '关注成功'
// 1. 检查是否已关注
// 2. 创建 TopicFollower 关联记录
// 3. 话题的 followerCount +1
// 关注是创建"用户-话题"关联关系，属于创建操作
// 所以使用 POST 方法
router.post('/:id/follow', authMiddleware, topicController.followTopic);

// 取消关注话题
// 路由: DELETE /api/topics/:id/follow
// 功能: 当前用户取消关注指定话题
// 认证: 需要登录（authMiddleware）
// DELETE /api/topics/507f1f77bcf86cd799439011/follow
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   message: '取消关注成功'
// 1. 查找并删除 TopicFollower 记录
// 2. 话题的 followerCount -1
// DELETE /topics/:id/follow 表示删除"关注"这个关系
// 而不是删除话题本身
router.delete('/:id/follow', authMiddleware, topicController.unfollowTopic);

// 获取话题下的文章
// 路由: GET /api/topics/:id/articles
// 功能: 获取指定话题下的所有文章
// 认证: 不需要登录（公开）
// GET /api/topics/507f1f77bcf86cd799439011/articles?page=1&limit=10
//   success: true,
//   data: {
//     articles: [
//         _id: '...',
//         title: 'Vue3入门教程',
//         content: '...',
//         author: { username: '...', avatar: '...' },
//         likeCount: 100,
//         commentCount: 20
//     ],
//     total: 50
// 通过话题ID查找关联的文章
// 可以按时间、热度等排序
router.get('/:id/articles', topicController.getTopicArticles);

// 搜索话题
// 路由: GET /api/topics/search
// 功能: 根据关键词搜索话题
// 认证: 不需要登录（公开）
// GET /api/topics/search?keyword=vue
//   success: true,
//   data: [
//     { _id: '...', name: 'Vue.js', followerCount: 1000 },
//     { _id: '...', name: 'Vue3', followerCount: 500 }
//   ]
// 使用正则表达式进行模糊匹配
// db.topics.find({ name: /vue/i })
// 此路由应该放在 /:id 之前定义
// 否则 'search' 会被当作 :id 参数处理
// 但这里放在后面，需要在控制器中特殊处理
// 或者更好的做法是将此路由移到 /:id 之前
router.get('/search', topicController.searchTopics);

// 获取用户关注的话题
// 路由: GET /api/topics/user/following
// 功能: 获取当前用户关注的所有话题
// 认证: 需要登录（authMiddleware）
// GET /api/topics/user/following
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   data: [
//       _id: '...',
//       name: 'Vue.js',
//       description: '...',
//       followerCount: 1000
//   ]
// 1. 通过用户ID查找 TopicFollower 表
// 2. 关联查询获取话题详情
// 3. 返回话题列表
// 此路由路径包含 'user'，避免与 /:id 冲突
// 实际访问路径是 /api/topics/user/following
router.get('/user/following', authMiddleware, topicController.getUserFollowingTopics);

// 导出路由
// 将路由模块导出，供 index.js 中挂载使用
// 使用方式: app.use('/api/topics', require('./topicRoutes'))
module.exports = router;
