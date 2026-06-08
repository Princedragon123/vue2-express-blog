// adminRoutes.js - 管理员路由
// 定义管理员相关的 API 路由，包括：
// 1. 仪表盘统计
// 2. 博客管理
// 3. 用户管理
// 4. 分类管理
// A: 便于统一管理和权限控制
// A: authMiddleware 验证登录 + 控制器检查角色

// 导入依赖模块

// Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 管理员控制器
const adminController = require('../controllers/adminController');

// 认证中间件
const { authMiddleware } = require('../middlewares/auth');

// 仪表盘统计路由

// 获取系统统计数据
//   - userCount: 用户总数
//   - blogCount: 博客总数
//   - commentCount: 评论总数
//   - todayUsers: 今日新增用户
//   - todayBlogs: 今日新增博客
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// 博客管理路由

// 获取所有博客（支持筛选、搜索）
//   - keyword: 搜索关键词
//   - page: 页码
//   - limit: 每页数量
router.get('/blogs', authMiddleware, adminController.getAllBlogs);

// 删除博客
//   - :blogId (URL 参数) - 博客 ID
router.delete('/blogs/:blogId', authMiddleware, adminController.deleteBlog);

// 用户管理路由

// 获取用户列表
//   - keyword: 搜索关键词
//   - status: 状态筛选（active/banned）
//   - page: 页码
//   - limit: 每页数量
router.get('/users', authMiddleware, adminController.getUserList);

// 查看用户详情
//   - :userId (URL参数) - 用户ID
router.get('/users/:userId', authMiddleware, adminController.getUserDetails);

// 更新用户信息
//   - :userId (URL参数) - 用户ID
//   - username: 用户名
//   - email: 邮箱
//   - role: 角色
router.put('/users/:userId', authMiddleware, adminController.updateUser);

// 封禁用户
//   - :userId (URL参数) - 用户ID
//   - reason: 封禁原因
//   - duration: 封禁时长（天）
router.put('/users/:userId/ban', authMiddleware, adminController.banUser);

// 解封用户
//   - :userId (URL参数) - 用户ID
router.put('/users/:userId/unban', authMiddleware, adminController.unbanUser);

// 删除用户
//   - :userId (URL参数) - 用户ID
router.delete('/users/:userId', authMiddleware, adminController.deleteUser);

// 导出路由
module.exports = router;
