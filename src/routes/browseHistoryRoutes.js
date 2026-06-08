// browseHistoryRoutes.js - 浏览记录路由
// 定义浏览记录相关的 API 路由，包括：
// 1. 添加浏览记录
// 2. 获取浏览历史
// 3. 删除单条记录
// 4. 清空所有记录
// A: 可以在保存前检查是否已存在相同记录，
//    如果存在则更新 viewedAt 时间，而不是新建记录。
// A: 1. 设置 TTL 索引自动删除过期记录
//    2. 限制每个用户最大记录数
//    3. 定期清理旧数据
// A: 浏览记录是自动记录的，用户被动产生；
//    收藏是用户主动操作，表示对内容感兴趣。

// 模块导入

// 导入 express 框架
const express = require('express');

// 导入浏览记录控制器
// 控制器处理浏览记录的业务逻辑
const browseHistoryController = require('../controllers/browseHistoryController');

// 导入认证中间件
// 用于验证用户身份
const { authMiddleware } = require('../middlewares/auth');

// 创建路由器实例
const router = express.Router();

// 路由级中间件

// 应用认证中间件到所有路由
// 这意味着下面定义的所有路由都需要先通过认证
// 1. 不需要在每个路由单独添加 authMiddleware
// 2. 代码更简洁，避免重复
// 3. 确保所有路由都被保护，不会遗漏
router.use(authMiddleware);

// 路由定义

// 添加浏览记录
// 路由: POST /api/browse-history
// 功能: 记录用户浏览了一篇文章
// 认证: 需要登录（通过 router.use 已应用）
// POST /api/browse-history
// Headers: { Authorization: Bearer <token> }
// Body: {
//   blogId: '507f1f77bcf86cd799439011',  // 文章ID
//   duration: 120  // 停留时长（秒），可选
//   success: true,
//   message: '浏览记录已保存'
// 1. 从 token 获取当前用户ID
// 2. 检查是否已存在该文章的浏览记录
//    - 存在：更新 viewedAt 时间
//    - 不存在：创建新记录
// 3. 返回成功响应
// - 用户打开文章详情页时
// - 可以在页面加载后异步调用，不阻塞内容显示
router.post('/', browseHistoryController.addHistory);

// 获取浏览历史
// 路由: GET /api/browse-history
// 功能: 获取当前用户的浏览历史列表
// 认证: 需要登录（通过 router.use 已应用）
// GET /api/browse-history?page=1&limit=20
// Headers: { Authorization: Bearer <token> }
// - page: 页码，默认为1
// - limit: 每页数量，默认为20
//   success: true,
//   data: {
//     history: [
//         _id: '...',
//         blog: {
//           _id: '...',
//           title: '文章标题',
//           author: { username: '...' }
//         viewedAt: '2024-01-01T12:00:00.000Z'
//     ],
//     total: 100
// 通常按浏览时间倒序排列（最近浏览的在前）
// .sort({ viewedAt: -1 })
// 使用 populate 关联查询文章详情
// .populate('blog', 'title author coverImage')
router.get('/', browseHistoryController.getHistory);

// 清空浏览历史
// 路由: DELETE /api/browse-history
// 功能: 清空当前用户的所有浏览记录
// 认证: 需要登录（通过 router.use 已应用）
// DELETE /api/browse-history
// Headers: { Authorization: Bearer <token> }
//   success: true,
//   message: '浏览历史已清空',
//   data: { deletedCount: 50 }
// 1. 获取当前用户ID
// 2. 删除该用户的所有浏览记录
//    BrowseHistory.deleteMany({ user: userId })
// 3. 返回删除数量
// 只能删除自己的浏览记录
// 不能删除其他用户的记录
router.delete('/', browseHistoryController.clearHistory);

// 导出路由
// 将路由模块导出，供 index.js 中挂载使用
// 使用方式：app.use('/api/browse-history', require('./browseHistoryRoutes'))
module.exports = router;
