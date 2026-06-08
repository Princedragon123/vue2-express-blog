// auth.js - 认证中间件
// 保护需要登录才能访问的路由，包括：
// 1. 验证 JWT Token
// 2. 提取用户信息到 req.user
// 3. 检查用户状态（是否被封禁）
// 4. 提供可选认证（不强制登录）
// A: 后续中间件和控制器可以直接访问，无需重复查询数据库
// A: 安全考虑，密码不应该出现在请求对象中
// A: 前端捕获 401 错误，调用 refresh-token 接口刷新

// 导入依赖模块

// JWT 工具
const jwt = require('../utils/jwt');

// 用户模型
const User = require('../models/User');


exports.authMiddleware = async (req, res, next) => {
    try {
        // 步骤1：从请求头获取 Token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        // 如果没有 Token，返回 401 未授权
        if (!token) {
            return res.status(401).json({ message: '未授权访问，请先登录' });
        }
        
        // 步骤2：验证 Token
        // - 验证签名是否有效
        // - 检查是否过期
        // - 解析出 payload（用户ID等）
        // - Token 格式错误
        // - 签名无效
        // - Token 已过期
        const decoded = jwt.verifyToken(token);
        
        // 步骤3：查找用户
        const user = await User.findById(decoded.id).select('-password');
        
        // 如果用户不存在，返回错误
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        
        // 步骤4：检查用户状态
        if (user.status === 'banned') {
            return res.status(403).json({ 
                message: `该账号已被封禁，原因：${user.banReason || '未提供原因'}。请联系管理员邮箱进行申诉。` 
            });
        }
        
        // 步骤5：将用户信息添加到请求对象
        req.user = user;
        
        // 步骤6：继续处理请求
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



