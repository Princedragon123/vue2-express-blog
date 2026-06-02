// ============================================================
// jwt.js - JWT 认证工具（学习版·Token）
// ============================================================
// 
// 【文件职责】
// 提供 JWT（JSON Web Token）相关功能，包括：
// 1. 生成 Token
// 2. 验证 Token
// 3. 解析 Token（不验证）
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. JWT 结构：Header.Payload.Signature                                  │
// │  2. 签名验证：确保 Token 未被篡改                                        │
// │  3. 过期时间：控制 Token 有效期                                          │
// │  4. 角色区分：不同角色不同过期时间                                       │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【JWT 结构详解】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  JWT = Header.Payload.Signature                                        │
// │                                                                         │
// │  【示例 Token】                                                          │
// │  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                                  │
// │  eyJpZCI6IjEyMzQ1NiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjAwMDAw                 │
// │  MDAH0.abc123def456                                                     │
// │                                                                         │
// │  【Header（头部）】                                                       │
// │  {                                                                      │
// │    "alg": "HS256",    // 签名算法                                        │
// │    "typ": "JWT"       // Token 类型                                      │
// │  }                                                                      │
// │                                                                         │
// │  【Payload（载荷）】                                                      │
// │  {                                                                      │
// │    "id": "123456",    // 用户 ID                                         │
// │    "role": "user",    // 用户角色                                        │
// │    "iat": 1600000000, // 签发时间                                        │
// │    "exp": 1600604800  // 过期时间                                        │
// │  }                                                                      │
// │                                                                         │
// │  【Signature（签名）】                                                    │
// │  HMACSHA256(                                                            │
// │    base64UrlEncode(header) + "." + base64UrlEncode(payload),            │
// │    secret                                                               │
// │  )                                                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Token 生成流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   用户登录成功                                                          │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ const token = generateToken(userId, role)                      │
// │       ▼                                                                 │
// │   创建 Payload                                                          │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ payload = {                                                    │
// │       │   id: userId,                                                  │
// │       │   role: role,                                                  │
// │       │   isDev: role === 'admin'                                      │
// │       │ }                                                              │
// │       ▼                                                                 │
// │   设置过期时间                                                          │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ expiresIn: role === 'admin' ? '30m' : '7d'                     │
// │       │ 管理员 30 分钟，普通用户 7 天                                    │
// │       ▼                                                                 │
// │   签名生成 Token                                                        │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       │ jwt.sign(payload, secret, { expiresIn })                       │
// │       ▼                                                                 │
// │   返回 Token                                                            │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ return token                                                   │
// │       ▼                                                                 │
// │   客户端存储                                                            │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ localStorage.setItem('token', token)                           │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Token 验证流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   客户端请求                                                            │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ Header: Authorization: Bearer <token>                          │
// │       ▼                                                                 │
// │   中间件提取 Token                                                      │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       │ const token = req.header('Authorization').replace('Bearer ', '')│
// │       ▼                                                                 │
// │   验证 Token                                                            │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ const decoded = verifyToken(token)                             │
// │       │                                                                 │
// │       ├─── 成功 ──→ decoded = { id, role, iat, exp }                   │
// │       │                                                                 │
// │       └─── 失败 ──→ 抛出异常                                            │
// │                     - Token 格式错误                                    │
// │                     - 签名无效                                          │
// │                     - Token 已过期                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: JWT 和 Session 有什么区别？
// A: JWT 无状态，服务器不存储；Session 有状态，服务器存储
// 
// Q2: Token 过期了怎么办？
// A: 使用 refresh_token 刷新，或重新登录
// 
// Q3: 如何防止 Token 被盗用？
// A: 使用 HTTPS、短期 Token、IP 绑定等
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// jsonwebtoken：JWT 生成和验证库
// 【作用】
// - sign(): 生成 Token
// - verify(): 验证 Token
// - decode(): 解析 Token（不验证）
const jwt = require('jsonwebtoken');

// dotenv：环境变量管理
require('dotenv').config();

// ============================================================
// 配置参数
// ============================================================

// JWT 密钥
// 【用途】用于签名和验证 Token
// 【安全】必须保密，存储在环境变量中
// 【示例】JWT_SECRET=your-super-secret-key-here
const JWT_SECRET = process.env.JWT_SECRET;

// 普通用户 Token 过期时间
// 【默认】7 天
// 【格式】'1d' = 1天, '2h' = 2小时, '3600s' = 3600秒
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 开发者/管理员 Token 过期时间
// 【默认】30 分钟（更短，更安全）
// 【原因】管理员权限大，Token 有效期应更短
const DEV_JWT_EXPIRES_IN = process.env.DEV_JWT_EXPIRES_IN || '30m';

// ============================================================
// 生成 JWT Token
// ============================================================
// 【参数】
// - userId: 用户 ID（MongoDB ObjectId）
// - role: 用户角色（'user' | 'admin'）
// 
// 【返回】
// - JWT Token 字符串
// 
// 【示例】
// const token = generateToken('507f1f77bcf86cd799439011', 'user');
// // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// ============================================================
exports.generateToken = (userId, role = 'user') => {
    try {
        // ====================================================
        // 创建 Payload（载荷）
        // ====================================================
        // 【payload 内容】
        // - id: 用户 ID，用于后续查询用户
        // - role: 用户角色，用于权限判断
        // - isDev: 是否为开发者令牌（方便前端判断）
        // 
        // 【注意】不要存储敏感信息（如密码）
        // 因为 Payload 可以被解码查看
        const payload = {
            id: userId,
            role: role,
            isDev: role === 'admin',
            isSvip: role === 'svip'
        };

        // ====================================================
        // 生成 Token
        // ====================================================
        // jwt.sign(payload, secret, options)
        // 
        // 【参数说明】
        // - payload: 载荷数据
        // - secret: 签名密钥
        // - options: 配置选项
        //   - expiresIn: 过期时间
        // 
        // 【过期时间设置】
        // - 管理员: 30 分钟（安全性更高）
        // - 普通用户: 7 天（体验更好）
        // 先计算过期时间（声明变量，可读性高）
        const tokenExpire = role === 'admin' ? DEV_JWT_EXPIRES_IN : JWT_EXPIRES_IN;

        // 再赋值给 expiresIn
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: tokenExpire
        });

        return token;
    } catch (error) {
        console.error('JWT 令牌生成失败:', error.message);
        throw error;
    }
};

// ============================================================
// 验证 JWT Token
// ============================================================
// 【参数】
// - token: JWT Token 字符串
// 
// 【返回】
// - 解码后的 Payload 对象
// 
// 【异常】
// - Token 格式错误
// - 签名无效
// - Token 已过期
// 
// 【示例】
// const decoded = verifyToken(token);
// // { id: '507f1f77bcf86cd799439011', role: 'user', iat: 1600000000, exp: 1600604800 }
// ============================================================
exports.verifyToken = (token) => {
    try {
        // ====================================================
        // 验证 Token
        // ====================================================
        // jwt.verify(token, secret)
        // 
        // 【验证内容】
        // 1. Token 格式是否正确
        // 2. 签名是否有效（使用相同的 secret）
        // 3. Token 是否过期（检查 exp 字段）
        // 
        // 【返回值】
        // 验证成功：返回 Payload 对象
        // 验证失败：抛出异常
        const decoded = jwt.verify(token, JWT_SECRET);

        return decoded;
    } catch (error) {
        console.error('JWT 令牌验证失败:', error.message);
        throw error;
    }
};

// ============================================================
// 解析 JWT Token（不验证）
// ============================================================
// 【参数】
// - token: JWT Token 字符串
// 
// 【返回】
// - 解码后的 Payload 对象（不验证签名和过期时间）
// 
// 【用途】
// - 前端解析 Token 获取用户信息
// - 不需要验证的场景
// 
// 【警告】
// - 不验证签名，可能被篡改
// - 不要用于安全相关的判断
// 
// 【示例】
// const decoded = decodeToken(token);
// // { id: '507f1f77bcf86cd799439011', role: 'user', iat: 1600000000, exp: 1600604800 }
// ============================================================
exports.decodeToken = (token) => {
    try {
        // ====================================================
        // 解析 Token
        // ====================================================
        // jwt.decode(token)
        // 
        // 【区别于 verify】
        // - 不验证签名
        // - 不检查过期时间
        // - 只解析 Base64 编码的 Payload
        // 
        // 【返回值】
        // 解析成功：返回 Payload 对象
        // 解析失败：返回 null 或抛出异常
        return jwt.decode(token);
    } catch (error) {
        console.error('JWT 令牌解析失败:', error.message);
        throw error;
    }
};

// ============================================================
// 使用示例
// ============================================================
// const jwt = require('../utils/jwt');
// 
// // 生成 Token
// const token = jwt.generateToken(user._id, user.role);
// res.json({ token });
// 
// // 验证 Token
// try {
//   const decoded = jwt.verifyToken(token);
//   req.user = await User.findById(decoded.id);
// } catch (error) {
//   res.status(401).json({ message: 'Token 无效' });
// }
// 
// // 解析 Token（前端）
// const decoded = jwt.decodeToken(token);
// console.log('用户ID:', decoded.id);
// console.log('用户角色:', decoded.role);
// console.log('过期时间:', new Date(decoded.exp * 1000));
// ============================================================
