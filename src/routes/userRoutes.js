// ============================================================
// userRoutes.js - 用户路由（学习版·RESTful API）
// ============================================================
// 
// 【文件职责】
// 定义用户相关的 API 路由，包括：
// 1. 用户信息获取和更新
// 2. 关注/取消关注
// 3. 头像/背景图上传
// 4. 隐私和通知设置
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. RESTful 设计：资源 + HTTP 方法语义                                   │
// │  2. 认证中间件：保护需要登录的路由                                       │
// │  3. 文件上传：Multer 中间件处理                                          │
// │  4. 路由参数：:userId 动态参数                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【RESTful 设计原则】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【资源】用户（User）                                                    │
// │                                                                         │
// │  操作          │ HTTP方法 │ 路由                    │ 说明              │
// │  ─────────────┼─────────┼────────────────────────┼────────────────── │
// │  获取用户信息  │ GET     │ /users/:userId         │ 读取单个用户      │
// │  更新用户信息  │ PUT     │ /users/:userId         │ 更新用户资料      │
// │  关注用户      │ POST    │ /users/:userId/follow  │ 创建关注关系      │
// │  取消关注      │ DELETE  │ /users/:userId/follow  │ 删除关注关系      │
// │  获取关注列表  │ GET     │ /users/:userId/following│ 读取关注列表     │
// │  获取粉丝列表  │ GET     │ /users/:userId/followers│ 读取粉丝列表     │
// │  上传头像      │ POST    │ /users/upload-avatar   │ 上传文件          │
// │  修改密码      │ PUT     │ /users/change-password │ 更新密码          │
// │                                                                         │
// │  【关键点】                                                              │
// │  - GET：读取资源，不修改数据                                            │
// │  - POST：创建资源或执行操作                                             │
// │  - PUT：更新资源                                                        │
// │  - DELETE：删除资源                                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【路由保护策略】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【需要认证 authMiddleware】                                             │
// │  - 关注/取消关注：需要登录才能操作                                      │
// │  - 上传头像/背景：需要登录                                              │
// │  - 更新设置：需要登录                                                   │
// │  - 修改密码：需要登录                                                   │
// │                                                                         │
// │  【可选认证 optionalAuthMiddleware】                                     │
// │  - 查看用户主页：登录用户可以看到是否已关注                             │
// │                                                                         │
// │  【无需认证】                                                            │
// │  - 获取关注/粉丝列表：公开信息                                          │
// │  - 搜索用户：公开信息                                                   │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么关注用 POST，取消关注用 DELETE？
// A: 关注是创建关系，取消关注是删除关系，符合 RESTful 语义
// 
// Q2: 为什么上传头像路由没有 :userId？
// A: 从 req.user 获取当前用户ID，更安全，防止伪造
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 用户控制器
const UserController = require('../controllers/userController');

// 认证中间件
const { authMiddleware, optionalAuthMiddleware } = require('../middlewares/auth');

// 上传服务
const uploadService = require('../services/uploadService');

// ============================================================
// 关注相关路由
// ============================================================

// 关注用户（需要认证）
// 【方法】POST
// 【路径】/users/:userId/follow
// 【参数】
//   - :userId (URL参数) - 要关注的用户ID
// 【认证】需要登录
router.post('/:userId/follow', authMiddleware, UserController.followUser);

// 取消关注用户（需要认证）
// 【方法】DELETE
// 【路径】/users/:userId/follow
// 【参数】
//   - :userId (URL参数) - 要取消关注的用户ID
// 【认证】需要登录
router.delete('/:userId/follow', authMiddleware, UserController.unfollowUser);

// 获取用户关注列表
// 【方法】GET
// 【路径】/users/:userId/following
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】无需认证（公开信息）
router.get('/:userId/following', UserController.getFollowingList);

// 获取用户粉丝列表
// 【方法】GET
// 【路径】/users/:userId/followers
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】无需认证（公开信息）
router.get('/:userId/followers', UserController.getFollowersList);

// 检查是否关注用户（需要认证）
// 【方法】GET
// 【路径】/users/check-follow/:userId
// 【参数】
//   - :userId (URL参数) - 要检查的用户ID
// 【认证】需要登录
router.get('/check-follow/:userId', authMiddleware, UserController.checkFollowStatus);

// ============================================================
// 文件上传路由
// ============================================================

// 上传头像（需要认证）
// 【方法】POST
// 【路径】/users/upload-avatar
// 【请求体】multipart/form-data
//   - avatar: 图片文件
// 【认证】需要登录
// 【中间件】uploadService.singleUpload('avatar') 处理单个文件上传
router.post('/upload-avatar', authMiddleware, uploadService.singleUpload('avatar'), UserController.uploadAvatar);

// 上传背景图（需要认证）
// 【方法】POST
// 【路径】/users/upload-cover
// 【请求体】multipart/form-data
//   - coverImage: 图片文件
// 【认证】需要登录
router.post('/upload-cover', authMiddleware, uploadService.singleUpload('coverImage'), UserController.uploadCover);

// ============================================================
// 设置相关路由
// ============================================================

// 更新隐私设置（需要认证）
// 【方法】PUT
// 【路径】/users/update-privacy-settings
// 【请求体】JSON
//   - showEmail: boolean
//   - showPhone: boolean
// 【认证】需要登录
router.put('/update-privacy-settings', authMiddleware, UserController.updatePrivacySettings);

// 更新通知设置（需要认证）
// 【方法】PUT
// 【路径】/users/update-notification-settings
// 【请求体】JSON
//   - emailNotification: boolean
//   - pushNotification: boolean
// 【认证】需要登录
router.put('/update-notification-settings', authMiddleware, UserController.updateNotificationSettings);

// ============================================================
// 用户信息路由
// ============================================================

// 搜索用户
// 【方法】GET
// 【路径】/users/search
// 【查询参数】
//   - keyword: 搜索关键词
//   - page: 页码
//   - limit: 每页数量
// 【认证】无需认证
// 【注意】这个路由要放在 /:userId 之前，否则 "search" 会被当作 userId
router.get('/search', UserController.searchUsers);

// 获取用户信息
// 【方法】GET
// 【路径】/users/:userId
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】可选（登录用户可以看到是否已关注）
router.get('/:userId', optionalAuthMiddleware, UserController.getUserInfo);

// 更新用户信息（需要认证）
// 【方法】PUT
// 【路径】/users/:userId
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【请求体】JSON
//   - username: 用户名
//   - bio: 个人简介
//   - website: 个人网站
// 【认证】需要登录（只能更新自己的信息）
router.put('/:userId', authMiddleware, UserController.updateUserInfo);

// 获取用户点赞的文章
// 【方法】GET
// 【路径】/users/:userId/liked-posts
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】无需认证
router.get('/:userId/liked-posts', UserController.getLikedPosts);

// 获取用户收藏的文章
// 【方法】GET
// 【路径】/users/:userId/bookmarked-posts
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】无需认证
router.get('/:userId/bookmarked-posts', UserController.getBookmarkedPosts);

// ============================================================
// 账户安全路由
// ============================================================

// 修改用户名（需要认证）
// 【方法】PUT
// 【路径】/users/update-profile
// 【请求体】JSON
//   - username: 新用户名
// 【认证】需要登录
router.put('/update-profile', authMiddleware, UserController.updateUsername);

// 修改密码（需要认证）
// 【方法】PUT
// 【路径】/users/change-password
// 【请求体】JSON
//   - currentPassword: 当前密码
//   - newPassword: 新密码
// 【认证】需要登录
router.put('/change-password', authMiddleware, UserController.changePassword);

// ============================================================
// 导出路由
// ============================================================
module.exports = router;
