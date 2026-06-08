// authRoutes.js - 认证路由
// 定义用户认证相关的 API 路由，包括：
// 1. 用户注册
// 2. 用户登录
// 3. 获取当前用户信息
// 4. 用户登出
// 5. Token 刷新
// A: 因为登录时用户还没有 Token，需要先验证密码再生成 Token
// A: 刷新时旧 Token 可能已过期，需要特殊处理
// A: 登录时根据 rememberMe 参数选择不同的 Token 过期时间

// 导入依赖模块

// Express 框架
const express = require('express');

// 创建路由实例
// 一个迷你应用，可以定义路由和中间件
// 最后挂载到主应用上
const router = express.Router();

// 认证控制器
const authController = require('../controllers/authController');

// 认证中间件
const { authMiddleware } = require('../middlewares/auth');

// 路由定义

// POST /register - 用户注册
//   username: "用户名",
//   email: "邮箱",
//   password: "密码"
// 成功: { user: {...}, token: "jwt_token" }
// 失败: { message: "错误信息" }
router.post('/register', authController.register);

// POST /login - 用户登录
//   username: "用户名",
//   password: "密码",
//   rememberMe: true/false
// 成功: { user: {...}, token: "jwt_token" }
// 失败: { message: "用户名或密码错误" }
router.post('/login', authController.login);

// GET /me - 获取当前用户信息
// Authorization: Bearer <token>
// 成功: { user: {...} }
// 失败: { message: "未授权" }
// 1. 从 Header 中提取 Token
// 2. 验证 Token 有效性
// 3. 解析用户信息到 req.user
// 4. 如果验证失败，返回 401 错误
router.get('/me', authMiddleware, authController.getMe);

// POST /logout - 用户登出
// Authorization: Bearer <token>
// 成功: { message: "登出成功" }
// - 服务端：将 Token 加入黑名单（可选）
// - 客户端：删除本地存储的 Token
router.post('/logout', authMiddleware, authController.logout);

// POST /refresh-token - Token 刷新
// Authorization: Bearer <old_token>
// 成功: { token: "new_jwt_token" }
// 失败: { message: "Token 无效" }
// 因为旧 Token 可能已过期，需要特殊处理
// 1. 客户端检测到 Token 快过期
// 2. 发送 refresh-token 请求
// 3. 服务端验证旧 Token（允许过期）
// 4. 生成新 Token 返回
router.post('/refresh-token', authController.refreshToken);

// 导出路由
// router.use('/auth', authRoutes);
// /auth/register
// /auth/login
// /auth/me
// /auth/logout
// /auth/refresh-token
module.exports = router;
