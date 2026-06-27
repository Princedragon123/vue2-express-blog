// 提供 JWT（JSON Web Token）相关功能，包括：
// 1. 生成 Token
// 2. 验证 Token
// 3. 解析 Token（不验证）
// A: JWT 无状态，服务器不存储；Session 有状态，服务器存储
// A: 使用 refresh_token 刷新，或重新登录
// A: 使用 HTTPS、短期 Token、IP 绑定等

// 导入依赖模块

// jsonwebtoken：JWT 生成和验证库
// - sign(): 生成 Token
// - verify(): 验证 Token
// - decode(): 解析 Token（不验证）
const jwt = require('jsonwebtoken');

// dotenv：环境变量管理
require('dotenv').config();

// 配置参数

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET;

// 普通用户 Token 过期时间
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 开发者/管理员 Token 过期时间
const DEV_JWT_EXPIRES_IN = process.env.DEV_JWT_EXPIRES_IN || '30m';

// 生成 JWT Token
// - userId: 用户 ID（MongoDB ObjectId）
// - role: 用户角色（'user' | 'admin'）
// - JWT Token 字符串
// const token = generateToken('507f1f77bcf86cd799439011', 'user');
// // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
exports.generateToken = (userId, role = 'user') => {
    try {
        // 创建 Payload（载荷）
        // - id: 用户 ID，用于后续查询用户
        // - role: 用户角色，用于权限判断
        // - isDev: 是否为开发者令牌（方便前端判断）
        // 因为 Payload 可以被解码查看
        const payload = {
            id: userId,
            role: role,
            isDev: role === 'admin',
            isSvip: role === 'svip'
        };

        // 生成 Token
        // jwt.sign(payload, secret, options)
        // - payload: 载荷数据
        // - secret: 签名密钥
        // - options: 配置选项
        //   - expiresIn: 过期时间
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

// 验证 JWT Token
// - token: JWT Token 字符串
// - ignoreExpiration: 是否忽略过期检查（默认false，用于refresh-token场景）
// - 解码后的 Payload 对象
// - Token 格式错误
// - 签名无效
// - Token 已过期（除非ignoreExpiration=true）
// const decoded = verifyToken(token);
// // { id: '507f1f77bcf86cd799439011', role: 'user', iat: 1600000000, exp: 1600604800 }
exports.verifyToken = (token, ignoreExpiration = false) => {
    try {
        // 验证 Token
        // jwt.verify(token, secret, options)
        // 1. Token 格式是否正确
        // 2. 签名是否有效（使用相同的 secret）
        // 3. Token 是否过期（检查 exp 字段，除非ignoreExpiration=true）
        // 验证成功：返回 Payload 对象
        // 验证失败：抛出异常
        const decoded = jwt.verify(token, JWT_SECRET, {
            ignoreExpiration  // refresh-token场景设为true，允许过期Token通过
        });

        return decoded;
    } catch (error) {
        console.error('JWT 令牌验证失败:', error.message);
        throw error;
    }
};

// 解析 JWT Token（不验证）
// - token: JWT Token 字符串
// - 解码后的 Payload 对象（不验证签名和过期时间）
// - 前端解析 Token 获取用户信息
// - 不需要验证的场景
// - 不验证签名，可能被篡改
// - 不要用于安全相关的判断
// const decoded = decodeToken(token);
// // { id: '507f1f77bcf86cd799439011', role: 'user', iat: 1600000000, exp: 1600604800 }
exports.decodeToken = (token) => {
    try {
        // 解析 Token
        // jwt.decode(token)
        // - 不验证签名
        // - 不检查过期时间
        // - 只解析 Base64 编码的 Payload
        // 解析成功：返回 Payload 对象
        // 解析失败：返回 null 或抛出异常
        return jwt.decode(token);
    } catch (error) {
        console.error('JWT 令牌解析失败:', error.message);
        throw error;
    }
};

// 使用示例
// const jwt = require('../utils/jwt');
// // 生成 Token
// const token = jwt.generateToken(user._id, user.role);
// res.json({ token });
// // 验证 Token
// try {
//   const decoded = jwt.verifyToken(token);
//   req.user = await User.findById(decoded.id);
// } catch (error) {
//   res.status(401).json({ message: 'Token 无效' });
// // 解析 Token（前端）
// const decoded = jwt.decodeToken(token);
// console.log('用户ID:', decoded.id);
// console.log('用户角色:', decoded.role);
// console.log('过期时间:', new Date(decoded.exp * 1000));
