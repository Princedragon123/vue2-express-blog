// ============================================================
// authController.js - 认证控制器
// ============================================================
// 
// 【文件职责】
// 处理用户认证相关的所有HTTP请求，包括：
// 1. 用户注册
// 2. 用户登录
// 3. 获取当前用户信息
// 4. 用户登出
// 5. Token刷新
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 密码加密：bcrypt自动处理，保存时加密                                │
// │  2. JWT令牌：生成、验证、刷新                                           │
// │  3. 数据验证：yup schema验证                                            │
// │  4. 错误处理：区分验证错误和服务器错误                                   │
// │  5. 安全措施：不返回密码、检查用户状态                                   │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 密码如何加密存储？
// A: 使用bcrypt，在User模型的pre save中间件中自动加密
// 
// Q2: JWT是什么？有什么优缺点？
// A: JSON Web Token，无状态认证。优点：跨服务、可扩展；缺点：无法主动失效
// 
// Q3: 为什么不返回密码字段？
// A: 安全考虑，即使加密也不应该返回给前端
// 
// Q4: 如何防止暴力破解？
// A: 可以添加登录次数限制、验证码、IP限制等
// 
// Q5: Token刷新机制是什么？
// A: Token过期前用旧Token换新Token，避免用户频繁登录
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
// 【User】用户模型
// 包含用户的所有信息和密码加密逻辑
const User = require('../models/User');

// 【validation】验证工具
// registerValidation: 注册数据验证
// loginValidation: 登录数据验证
const { registerValidation, loginValidation } = require('../utils/validation');

// 【jwt】JWT工具
// generateToken: 生成JWT令牌
// verifyToken: 验证JWT令牌
const jwt = require('../utils/jwt');

// ============================================================
// 用户注册
// ============================================================
// 【路由】POST /api/auth/register
// 【作用】创建新用户账号
// 
// 【请求体】
// {
//   username: "用户名",
//   email: "邮箱",
//   password: "密码"
// }
// 
// 【流程】
// 1. 数据验证（yup schema）
// 2. 检查邮箱/用户名是否已存在
// 3. 创建用户（密码自动加密）
// 4. 生成JWT令牌
// 5. 返回用户信息和令牌
// 
// 【面试常问】
// Q1: 为什么用$or查询？
// A: 一次查询同时检查邮箱和用户名，减少数据库请求
// 
// Q2: 密码什么时候加密？
// A: User模型的pre save中间件自动加密
// 
// Q3: 为什么返回token？
// A: 注册成功后自动登录，提升用户体验
// ============================================================
exports.register = async (req, res) => {
    try {
        // 解构请求体数据
        const { username, email, password } = req.body;
        
        // ============================================================
        // 步骤1：数据验证
        // ============================================================
        // 使用yup schema验证数据格式
        // 验证项：用户名格式、邮箱格式、密码强度
        await registerValidation.validate({
            username,
            email,
            password,
            confirmPassword: password 
        });
        
        // ============================================================
        // 步骤2：检查用户是否已存在
        // ============================================================
        // $or操作符：匹配任意一个条件
        // 一次查询同时检查邮箱和用户名
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            // 区分是邮箱还是用户名重复
            if (existingUser.email === email) {
                return res.status(400).json({ success: false, message: '该邮箱已被注册' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ success: false, message: '该用户名已被使用' });
            }
        }
        
        // ============================================================
        // 步骤3：创建新用户
        // ============================================================
        // 密码会在User模型的pre save中间件中自动加密
        const newUser = new User({
            username,
            email,
            password // 明文密码，保存时会自动加密
        });
        
        // 保存到数据库
        await newUser.save();
        
        // ============================================================
        // 步骤4：生成JWT令牌
        // ============================================================
        // JWT包含用户ID，用于后续认证
        const token = jwt.generateToken(newUser._id);
        
        // ============================================================
        // 步骤5：返回用户信息和令牌
        // ============================================================
        // 注意：不返回密码字段！
        res.status(201).json({
            success: true,
            message: '注册成功',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.profile?.avatar,
                profile: newUser.profile
            },
            token
        });
    } catch (error) {
        // ============================================================
        // 错误处理
        // ============================================================
        // 验证错误（yup）
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        // 其他错误
        console.error('注册失败:', error.message);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// ============================================================
// 用户登录
// ============================================================
// 【路由】POST /api/auth/login
// 【作用】验证用户身份并返回令牌
// 
// 【请求体】
// {
//   email: "邮箱或用户名",
//   password: "密码"
// }
// 
// 【流程】
// 1. 数据验证
// 2. 查找用户（支持邮箱或用户名登录）
// 3. 验证密码
// 4. 检查用户状态（是否被封禁）
// 5. 更新最后登录时间
// 6. 生成JWT令牌
// 7. 返回用户信息和令牌
// 
// 【面试常问】
// Q1: 为什么支持邮箱和用户名登录？
// A: 提升用户体验，用户可能忘记邮箱
// 
// Q2: 为什么不直接说"用户不存在"？
// A: 安全考虑，避免攻击者枚举用户
// 
// Q3: 如何防止暴力破解？
// A: 可添加登录次数限制、验证码
// ============================================================
exports.login = async (req, res) => {
    try {
        // 解构请求体数据
        const { email, password } = req.body;
        
        // ============================================================
        // 步骤1：数据验证
        // ============================================================
        await loginValidation.validate({ email, password });
        
        // ============================================================
        // 步骤2：查找用户
        // ============================================================
        // 支持邮箱或用户名登录
        // $or: 匹配邮箱或用户名
        const user = await User.findOne({
            $or: [
                { email },           // 邮箱匹配
                { username: email }  // 用户名匹配（email字段可能是用户名）
            ]
        });
        
        if (!user) {
            return res.status(400).json({ success: false, message: '邮箱或密码错误' });
        }
        
        // ============================================================
        // 步骤3：验证密码
        // ============================================================
        // comparePassword是User模型的方法，使用bcrypt比较
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '邮箱或密码错误' });
        }
        
        // ============================================================
        // 步骤4：检查用户状态
        // ============================================================
        // 检查用户是否被封禁
        if (user.status === 'banned') {
            return res.status(403).json({ 
                success: false, 
                message: `该账号已被封禁，原因：${user.banReason || '未提供原因'}。请联系管理员邮箱进行申诉。` 
            });
        }
        
        // ============================================================
        // 步骤5：更新最后登录时间
        // ============================================================
        user.lastLogin = Date.now();
        await user.save();
        
        // ============================================================
        // 步骤6：生成JWT令牌
        // ============================================================
        // 包含用户ID和角色
        const token = jwt.generateToken(user._id, user.role);
        
        // ============================================================
        // 步骤7：返回用户信息和令牌
        // ============================================================
        res.status(200).json({
            success: true,
            message: '登录成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.profile?.avatar,
                profile: user.profile
            },
            token
        });
    } catch (error) {
        // 验证错误
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        // 其他错误
        console.error('登录失败:', error.message);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// ============================================================
// 获取当前用户信息
// ============================================================
// 【路由】GET /api/auth/me
// 【作用】获取当前登录用户的详细信息
// 
// 【认证】需要JWT令牌
// 
// 【流程】
// 1. 检查请求中是否有用户信息（由中间件添加）
// 2. 从数据库查询完整用户信息
// 3. 排除敏感字段（密码、重置令牌等）
// 4. 返回用户信息
// 
// 【面试常问】
// Q: 为什么不直接用req.user？
// A: req.user只包含JWT中的基本信息，可能不是最新的
// 
// Q: select('-password')是什么意思？
// A: 排除password字段，不返回给前端
// ============================================================
exports.getMe = async (req, res) => {
    try {
        // 检查请求中是否有用户信息
        // req.user由authMiddleware中间件添加
        if (!req.user) {
            return res.status(401).json({ success: false, message: '未授权访问，请先登录' });
        }
        
        // 从数据库获取完整的用户信息
        const currentUserId = req.user.id || req.user._id;
        
        const user = await User.findById(currentUserId)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        // 返回用户信息
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息失败:', error.message);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// ============================================================
// 用户登出
// ============================================================
// 【路由】POST /api/auth/logout
// 【作用】清除用户会话
// 
// 【注意】JWT是无状态的，服务端不保存状态
// 真正的登出需要前端删除token
// 
// 【面试常问】
// Q: JWT如何实现登出？
// A: JWT无法主动失效，需要前端删除token
//    或者维护一个黑名单（但会增加复杂度）
// ============================================================
exports.logout = async (req, res) => {
    try {
        // 清除会话（如果使用session）
        if (req.session) {
            req.session.destroy();
        }
        
        // 返回成功信息
        // 注意：前端需要删除本地存储的token
        res.status(200).json({ success: true, message: '登出成功' });
    } catch (error) {
        console.error('登出失败:', error.message);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// ============================================================
// Token刷新
// ============================================================
// 【路由】POST /api/auth/refresh-token
// 【作用】用旧token换取新token
// 
// 【使用场景】
// 1. Token即将过期时自动刷新
// 2. 保持用户登录状态
// 
// 【流程】
// 1. 从请求头获取当前token
// 2. 验证token（即使过期也能解析出用户ID）
// 3. 查找用户
// 4. 生成新token
// 5. 返回新token和用户信息
// 
// 【面试常问】
// Q: 为什么需要刷新token？
// A: 避免用户频繁登录，提升用户体验
// 
// Q: 如何实现token自动刷新？
// A: 前端在请求返回401时调用刷新接口
// ============================================================
exports.refreshToken = async (req, res) => {
    try {
        // ============================================================
        // 步骤1：从请求头获取token
        // ============================================================
        // Authorization: Bearer <token>
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, message: '未授权访问，请先登录' });
        }
        
        // ============================================================
        // 步骤2：验证token
        // ============================================================
        // 即使token过期，也能解析出用户ID
        const decoded = jwt.verifyToken(token);
        
        // ============================================================
        // 步骤3：查找用户
        // ============================================================
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ success: false, message: '用户不存在' });
        }
        
        // ============================================================
        // 步骤4：生成新token
        // ============================================================
        const newToken = jwt.generateToken(user._id, user.role);
        
        // ============================================================
        // 步骤5：返回新token和用户信息
        // ============================================================
        res.status(200).json({
            success: true,
            message: 'Token刷新成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.profile?.avatar,
                profile: user.profile
            },
            token: newToken
        });
    } catch (error) {
        console.error('Token刷新失败:', error.message);
        res.status(401).json({ success: false, message: '令牌无效或已过期，请重新登录' });
    }
};
