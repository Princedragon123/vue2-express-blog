// blogRoutes.js - 博客路由
// 定义博客相关的 API 路由，包括：
// 1. 博客 CRUD（增删改查）
// 2. 点赞和收藏
// 3. 评论功能
// 4. 搜索功能
// A: 点赞是创建"点赞关系"，不是更新博客资源
// A: GET /blogs?page=1&limit=10
// A: GET /blogs?category=tech&sort=latest

// 导入依赖模块
const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/BlogController');
const { authMiddleware } = require('../middlewares/auth');

// 博客列表相关路由（无参数路径）

// GET / - 获取博客列表
// ?page=1&limit=10&category=tech&sort=latest
//   blogs: [...],
//   total: 100,
//   page: 1,
//   totalPages: 10
router.get('/', BlogController.getBlogs);

// POST / - 创建新文章
//   title: "标题",
//   content: "内容",
//   category: "分类",
//   tags: ["标签1", "标签2"]
router.post('/', authMiddleware, BlogController.createBlog);

// GET /hot - 获取热门博客
router.get('/hot', BlogController.getHotBlogs);

// GET /recommended - 获取推荐博客
// - 基于用户兴趣
// - 基于热度加权
// - 基于协同过滤
router.get('/recommended', BlogController.getRecommendedBlogs);

// GET /bookmarks - 获取用户收藏列表
router.get('/bookmarks', authMiddleware, BlogController.getUserBookmarks);

// GET /my - 获取我的文章列表
router.get('/my', authMiddleware, BlogController.getMyBlogs);

// GET /search - 搜索文章
// ?q=关键词&page=1&limit=10
// 标题、内容、标签等
router.get('/search', BlogController.searchBlogs);

// 博客详情相关路由（带参数 :id）

// GET /:id - 获取博客详情
router.get('/:id', BlogController.getBlogDetail);

// GET /:blogId/comments - 获取博客评论列表
router.get('/:blogId/comments', BlogController.getBlogComments);

// POST /:blogId/comments - 创建评论
//   content: "评论内容",
//   parentId: "父评论ID（可选）",
//   replyTo: "回复用户ID（可选）"
router.post('/:blogId/comments', authMiddleware, BlogController.createComment);

// 评论相关路由

// DELETE /comments/:commentId - 删除评论
router.delete('/comments/:commentId', authMiddleware, BlogController.deleteComment);

// 点赞相关路由

// POST /:id/like - 点赞博客
// 1. 检查是否已点赞
// 2. 创建点赞记录
// 3. 更新博客点赞数 +1
// 4. 发送通知给作者（WebSocket）
router.post('/:id/like', authMiddleware, BlogController.likeBlog);

// DELETE /:id/like - 取消点赞
// 1. 删除点赞记录
// 2. 更新博客点赞数 -1
router.delete('/:id/like', authMiddleware, BlogController.unlikeBlog);

// GET /:id/is-liked - 检查是否已点赞
router.get('/:id/is-liked', authMiddleware, BlogController.checkLikeStatus);

// 收藏相关路由

// GET /:id/is-bookmarked - 检查是否已收藏
router.get('/:id/is-bookmarked', authMiddleware, BlogController.checkBookmarkStatus);

// POST /:id/bookmark - 收藏博客
// 1. 检查是否已收藏
// 2. 创建收藏记录
// 3. 更新博客收藏数 +1
// 4. 发送通知给作者（WebSocket）
router.post('/:id/bookmark', authMiddleware, BlogController.bookmarkBlog);

// DELETE /:id/bookmark - 取消收藏
router.delete('/:id/bookmark', authMiddleware, BlogController.unbookmarkBlog);

// 博客修改/删除路由

// PUT /:id - 更新文章
router.put('/:id', authMiddleware, BlogController.updateBlog);

// DELETE /:id - 删除文章
router.delete('/:id', authMiddleware, BlogController.deleteBlog);

// POST /upload-image - 上传文章图片
router.post('/upload-image', authMiddleware, BlogController.uploadBlogImage);

// POST /upload-video - 上传文章视频
router.post('/upload-video', authMiddleware, BlogController.uploadBlogVideo);

// 导出路由
// router.use('/blogs', blogRoutes);
// GET  /blogs           → 获取列表
// POST /blogs           → 创建文章
// GET  /blogs/hot       → 热门博客
// GET  /blogs/:id       → 博客详情
// POST /blogs/:id/like  → 点赞
// POST /blogs/upload-image → 上传图片
// POST /blogs/upload-video → 上传视频
module.exports = router;
