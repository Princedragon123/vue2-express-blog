// 定义用户相关的 API 路由，包括：
// 1. 用户信息获取和更新
// 2. 关注/取消关注
// 3. 头像/背景图上传
// 4. 隐私和通知设置
// A: 关注是创建关系，取消关注是删除关系，符合 RESTful 语义
// A: 从 req.user 获取当前用户ID，更安全，防止伪造

// 导入依赖模块

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

// 关注相关路由

// 关注用户（需要认证）
//   - :userId (URL参数) - 要关注的用户ID
router.post('/:userId/follow', authMiddleware, UserController.followUser);

// 取消关注用户（需要认证）
//   - :userId (URL参数) - 要取消关注的用户ID
router.delete('/:userId/follow', authMiddleware, UserController.unfollowUser);

// 获取用户关注列表
//   - :userId (URL参数) - 用户ID
router.get('/:userId/following', UserController.getFollowingList);

// 获取用户粉丝列表
//   - :userId (URL参数) - 用户ID
router.get('/:userId/followers', UserController.getFollowersList);

// 检查是否关注用户（需要认证）
//   - :userId (URL参数) - 要检查的用户ID
router.get('/check-follow/:userId', authMiddleware, UserController.checkFollowStatus);

// 文件上传路由

// 上传头像（需要认证）
//   - avatar: 图片文件
router.post('/upload-avatar', authMiddleware, uploadService.singleUpload('avatar'), UserController.uploadAvatar);

// 上传背景图（需要认证）
//   - coverImage: 图片文件
router.post('/upload-cover', authMiddleware, uploadService.singleUpload('coverImage'), UserController.uploadCover);

// 设置相关路由

// 更新隐私设置（需要认证）
//   - showEmail: boolean
//   - showPhone: boolean
router.put('/update-privacy-settings', authMiddleware, UserController.updatePrivacySettings);

// 更新通知设置（需要认证）
//   - emailNotification: boolean
//   - pushNotification: boolean
router.put('/update-notification-settings', authMiddleware, UserController.updateNotificationSettings);

// 用户信息路由

// 搜索用户
//   - keyword: 搜索关键词
//   - page: 页码
//   - limit: 每页数量
router.get('/search', UserController.searchUsers);

// 获取用户信息
//   - :userId (URL参数) - 用户ID
router.get('/:userId', optionalAuthMiddleware, UserController.getUserInfo);

// 更新用户信息（需要认证）
//   - :userId (URL参数) - 用户ID
//   - username: 用户名
//   - bio: 个人简介
//   - website: 个人网站
router.put('/:userId', authMiddleware, UserController.updateUserInfo);

// 获取用户点赞的文章
//   - :userId (URL参数) - 用户ID
router.get('/:userId/liked-posts', UserController.getLikedPosts);

// 获取用户收藏的文章
//   - :userId (URL参数) - 用户ID
router.get('/:userId/bookmarked-posts', UserController.getBookmarkedPosts);

// 账户安全路由

// 修改用户名（需要认证）
//   - username: 新用户名
router.put('/update-profile', authMiddleware, UserController.updateUsername);

// 修改密码（需要认证）
//   - currentPassword: 当前密码
//   - newPassword: 新密码
router.put('/change-password', authMiddleware, UserController.changePassword);

// 导出路由
module.exports = router;
