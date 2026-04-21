// ============================================================
// adminRoutes.js - 管理员路由
// ============================================================
// 
// 【文件职责】
// 定义管理员相关的 API 路由，包括：
// 1. 仪表盘统计
// 2. 博客管理
// 3. 用户管理
// 4. 分类管理
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 管理后台路由设计                                                    │
// │  2. 权限控制：所有路由都需要认证                                        │
// │  3. RESTful 设计：资源 + HTTP 方法                                      │
// │  4. 批量操作：封禁、解封、删除                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【管理后台功能模块】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【仪表盘】                                                              │
// │  GET /admin/stats - 获取统计数据                                        │
// │  ├── 用户总数                                                           │
// │  ├── 博客总数                                                           │
// │  ├── 评论总数                                                           │
// │  └── 今日新增                                                           │
// │                                                                         │
// │  【博客管理】                                                            │
// │  GET    /admin/blogs           - 获取博客列表（支持筛选）               │
// │  DELETE /admin/blogs/:blogId   - 删除博客                               │
// │                                                                         │
// │  【用户管理】                                                            │
// │  GET    /admin/users           - 获取用户列表                           │
// │  GET    /admin/users/:userId   - 获取用户详情                           │
// │  PUT    /admin/users/:userId   - 更新用户信息                           │
// │  PUT    /admin/users/:userId/ban   - 封禁用户                           │
// │  PUT    /admin/users/:userId/unban - 解封用户                           │
// │  DELETE /admin/users/:userId   - 删除用户                               │
// │                                                                         │
// │  【分类管理】                                                            │
// │  GET /admin/categories - 获取分类列表                                   │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【权限控制】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【普通用户】                                                            │
// │  - 只能访问 /api/auth、/api/blogs、/api/users 等公开路由               │
// │  - 无法访问 /api/admin 路由                                             │
// │                                                                         │
// │  【管理员】                                                              │
// │  - 可以访问所有路由                                                     │
// │  - 可以查看、编辑、删除任何用户和博客                                   │
// │                                                                         │
// │  【权限检查流程】                                                        │
// │  1. authMiddleware 验证 Token                                          │
// │  2. adminController 检查 req.user.role === 'admin'                     │
// │  3. 如果不是管理员，返回 403 Forbidden                                  │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么管理员路由都有 /admin 前缀？
// A: 便于统一管理和权限控制
// 
// Q2: 如何防止普通用户访问管理路由？
// A: authMiddleware 验证登录 + 控制器检查角色
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// Express 框架
const express = require('express');

// 创建路由实例
const router = express.Router();

// 管理员控制器
const adminController = require('../controllers/adminController');

// 认证中间件
const { authMiddleware } = require('../middlewares/auth');

// ============================================================
// 仪表盘统计路由
// ============================================================

// 获取系统统计数据
// 【方法】GET
// 【路径】/admin/stats
// 【认证】需要登录 + 管理员权限
// 【返回】
//   - userCount: 用户总数
//   - blogCount: 博客总数
//   - commentCount: 评论总数
//   - todayUsers: 今日新增用户
//   - todayBlogs: 今日新增博客
router.get('/stats', authMiddleware, adminController.getDashboardStats);

// ============================================================
// 博客管理路由
// ============================================================

// 获取所有博客（支持筛选、搜索）
// 【方法】GET
// 【路径】/admin/blogs
// 【查询参数】
//   - keyword: 搜索关键词
//   - page: 页码
//   - limit: 每页数量
// 【认证】需要登录 + 管理员权限
router.get('/blogs', authMiddleware, adminController.getAllBlogs);

// 删除博客
// 【方法】DELETE
// 【路径】/admin/blogs/:blogId
// 【参数】
//   - :blogId (URL 参数) - 博客 ID
// 【认证】需要登录 + 管理员权限
router.delete('/blogs/:blogId', authMiddleware, adminController.deleteBlog);

// ============================================================
// 用户管理路由
// ============================================================

// 获取用户列表
// 【方法】GET
// 【路径】/admin/users
// 【查询参数】
//   - keyword: 搜索关键词
//   - status: 状态筛选（active/banned）
//   - page: 页码
//   - limit: 每页数量
// 【认证】需要登录 + 管理员权限
router.get('/users', authMiddleware, adminController.getUserList);

// 查看用户详情
// 【方法】GET
// 【路径】/admin/users/:userId
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】需要登录 + 管理员权限
router.get('/users/:userId', authMiddleware, adminController.getUserDetails);

// 更新用户信息
// 【方法】PUT
// 【路径】/admin/users/:userId
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【请求体】JSON
//   - username: 用户名
//   - email: 邮箱
//   - role: 角色
// 【认证】需要登录 + 管理员权限
router.put('/users/:userId', authMiddleware, adminController.updateUser);

// 封禁用户
// 【方法】PUT
// 【路径】/admin/users/:userId/ban
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【请求体】JSON
//   - reason: 封禁原因
//   - duration: 封禁时长（天）
// 【认证】需要登录 + 管理员权限
router.put('/users/:userId/ban', authMiddleware, adminController.banUser);

// 解封用户
// 【方法】PUT
// 【路径】/admin/users/:userId/unban
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】需要登录 + 管理员权限
router.put('/users/:userId/unban', authMiddleware, adminController.unbanUser);

// 删除用户
// 【方法】DELETE
// 【路径】/admin/users/:userId
// 【参数】
//   - :userId (URL参数) - 用户ID
// 【认证】需要登录 + 管理员权限
// 【注意】删除用户会同时删除其所有博客和评论
router.delete('/users/:userId', authMiddleware, adminController.deleteUser);

// ============================================================
// 导出路由
// ============================================================
module.exports = router;
