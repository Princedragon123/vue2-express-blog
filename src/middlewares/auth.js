// ============================================================
// auth.js - 认证中间件
// ============================================================
// 
// 【文件职责】
// 保护需要登录才能访问的路由，包括：
// 1. 验证 JWT Token
// 2. 提取用户信息到 req.user
// 3. 检查用户状态（是否被封禁）
// 4. 提供可选认证（不强制登录）
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Express 中间件：req, res, next 三参数函数                           │
// │  2. JWT 验证：从 Header 提取并验证 Token                                │
// │  3. 请求增强：将用户信息挂载到 req.user                                 │
// │  4. 权限控制：检查用户状态，决定是否放行                                │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【中间件执行流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   客户端请求                                                            │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ GET /auth/me                                                    │
// │       │ Header: Authorization: Bearer <token>                          │
// │       ▼                                                                 │
// │   authMiddleware                                                        │
// │   ─────────────                                                        │
// │       │                                                                 │
// │       ├── 1. 提取 Token                                                 │
// │       │   const token = req.header('Authorization')                    │
// │       │                   .replace('Bearer ', '')                      │
// │       │                                                                 │
// │       ├── 2. 验证 Token                                                 │
// │       │   const decoded = jwt.verifyToken(token)                       │
// │       │   // 解析出 { id: userId, iat: 签发时间, exp: 过期时间 }        │
// │       │                                                                 │
// │       ├── 3. 查询用户                                                   │
// │       │   const user = await User.findById(decoded.id)                 │
// │       │                   .select('-password')  // 排除密码字段         │
// │       │                                                                 │
// │       ├── 4. 检查用户状态                                               │
// │       │   if (user.status === 'banned') {                              │
// │       │     return res.status(403).json({...})                         │
// │       │   }                                                             │
// │       │                                                                 │
// │       ├── 5. 挂载用户信息                                               │
// │       │   req.user = user  // 后续中间件/控制器可用                    │
// │       │                                                                 │
// │       └── 6. 放行请求                                                   │
// │           next()  // 调用下一个中间件或控制器                           │
// │                                                                         │
// │       ▼                                                                 │
// │   控制器处理                                                            │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ const user = req.user  // 从中间件获取用户信息                 │
// │       │ res.json({ user })                                             │
// │       ▼                                                                 │
// │   响应客户端                                                            │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【两种中间件对比】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【authMiddleware - 强制认证】                                           │
// │  - 没有 Token → 401 错误                                               │
// │  - Token 无效 → 401 错误                                               │
// │  - 用户不存在 → 401 错误                                               │
// │  - 用户被封禁 → 403 错误                                               │
// │  - 正常 → 放行，req.user 有值                                          │
// │                                                                         │
// │  【optionalAuthMiddleware - 可选认证】                                   │
// │  - 没有 Token → 放行，req.user 为 undefined                            │
// │  - Token 无效 → 放行，req.user 为 undefined                            │
// │  - 用户不存在 → 放行，req.user 为 undefined                            │
// │  - 用户被封禁 → 403 错误                                               │
// │  - 正常 → 放行，req.user 有值                                          │
// │                                                                         │
// │  【使用场景】                                                            │
// │  - authMiddleware: 登录、修改密码、发文章等必须登录的操作               │
// │  - optionalAuthMiddleware: 查看文章详情，登录用户可以看到更多信息      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么把用户信息挂载到 req.user？
// A: 后续中间件和控制器可以直接访问，无需重复查询数据库
// 
// Q2: 为什么要排除 password 字段？
// A: 安全考虑，密码不应该出现在请求对象中
// 
// Q3: Token 过期了怎么办？
// A: 前端捕获 401 错误，调用 refresh-token 接口刷新
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// JWT 工具
// 【职责】生成和验证 JWT Token
const jwt = require('../utils/jwt');

// 用户模型
// 【职责】查询用户信息
const User = require('../models/User');


exports.authMiddleware = async (req, res, next) => {
    try {
        // ========================================================
        // 步骤1：从请求头获取 Token
        // ========================================================
        // 【Header 格式】Authorization: Bearer <token>
        // 【可选链】?. 防止 header 不存在时报错
        // 【replace】移除 'Bearer ' 前缀，只保留 token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // 如果没有 Token，返回 401 未授权
        if (!token) {
            return res.status(401).json({ message: '未授权访问，请先登录' });
        }
        
        // ========================================================
        // 步骤2：验证 Token
        // ========================================================
        // 【verifyToken】
        // - 验证签名是否有效
        // - 检查是否过期
        // - 解析出 payload（用户ID等）
        // 
        // 【抛出异常的情况】
        // - Token 格式错误
        // - 签名无效
        // - Token 已过期
        const decoded = jwt.verifyToken(token);
        
        // ========================================================
        // 步骤3：查找用户
        // ========================================================
        // 【findById】根据 ID 查询用户
        // 【select('-password')】排除密码字段，不返回给前端
        const user = await User.findById(decoded.id).select('-password');
        
        // 如果用户不存在，返回错误
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        
        // ========================================================
        // 步骤4：检查用户状态
        // ========================================================
        // 【封禁检查】如果用户被封禁，禁止访问
        if (user.status === 'banned') {
            return res.status(403).json({ 
                message: `该账号已被封禁，原因：${user.banReason || '未提供原因'}。请联系管理员邮箱进行申诉。` 
            });
        }
        
        // ========================================================
        // 步骤5：将用户信息添加到请求对象
        // ========================================================
        // 【关键】后续中间件和控制器可以通过 req.user 访问用户信息
        // 【好处】不需要在每个控制器中重复查询数据库
        req.user = user;
        
        // ========================================================
        // 步骤6：继续处理请求
        // ========================================================
        // 【next()】调用下一个中间件或路由处理器
        next();
    } catch (error) {
        // Token 无效或过期，返回 401 错误
        res.status(401).json({ message: '令牌无效或已过期，请重新登录' });
    }
};


exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '仅管理员可访问' });
  }
  next();
};

exports.optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return next(); // 没有 Token，直接放行
        }
        
        const decoded = jwt.verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return next(); // 用户不存在，也放行
        }
        
        if (user.status === 'banned') {
            return res.status(403).json({ 
                message: `该账号已被封禁，原因：${user.banReason || '未提供原因'}。请联系管理员邮箱进行申诉。` 
            });
        }
        
        req.user = user; // 有用户信息，挂载到 req
        next();
    } catch (error) {
        // Token 无效或过期，直接放行，不报错
        next();
    }
};



