// ============================================================
// adminController.js - 管理员控制器
// ============================================================
// 
// 【文件职责】
// 处理管理员相关的业务逻辑，包括：
// 1. 仪表盘统计
// 2. 博客管理（查看、删除、状态更新）
// 3. 用户管理（查看、封禁、解封、删除）
// 4. 分类管理
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 权限控制：所有操作都需要管理员权限                                   │
// │  2. 数据统计：countDocuments 统计数量                                   │
// │  3. 级联删除：删除用户时删除所有相关数据                                 │
// │  4. 分页查询：skip + limit                                              │
// │  5. 条件筛选：构建动态查询条件                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【管理后台权限模型】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【用户角色】                                                            │
// │  ├── user   - 普通用户：只能操作自己的数据                              │
// │  └── admin  - 管理员：可以操作所有用户的数据                            │
// │                                                                         │
// │  【权限检查流程】                                                        │
// │  1. 用户登录 → JWT token 包含 role 字段                                 │
// │  2. 请求到达 → auth 中间件解析 token                                    │
// │  3. 控制器检查 → if (req.user.role !== 'admin') return 403             │
// │                                                                         │
// │  【安全注意事项】                                                        │
// │  ├── 管理员不能封禁/删除自己                                            │
// │  ├── 管理员不能封禁/删除其他管理员                                      │
// │  └── 删除用户需要二次确认                                               │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【级联删除示意图】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  删除用户                                                               │
// │     │                                                                   │
// │     ├── 删除用户发布的文章（Blog）                                      │
// │     │                                                                   │
// │     ├── 删除用户的评论（Comment）                                       │
// │     │                                                                   │
// │     ├── 删除用户的收藏（Bookmark）                                      │
// │     │                                                                   │
// │     ├── 删除用户的点赞（Like）                                          │
// │     │                                                                   │
// │     ├── 删除用户的浏览历史（BrowseHistory）                             │
// │     │                                                                   │
// │     ├── 删除用户的通知（Notification）                                  │
// │     │     ├── 作为接收者的通知                                          │
// │     │     └── 作为发送者的通知                                          │
// │     │                                                                   │
// │     ├── 删除用户的私信（Message）                                       │
// │     │     ├── 作为发送者的消息                                          │
// │     │     └── 作为接收者的消息                                          │
// │     │                                                                   │
// │     └── 删除用户的关注关系（Follow）                                    │
// │           ├── 作为关注者的关系                                          │
// │           └── 作为被关注者的关系                                        │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================

// ============================================================
// 【模块导入】
// ============================================================

const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const BrowseHistory = require('../models/BrowseHistory');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Follow = require('../models/Follow');

// ============================================================
// 【管理员控制器对象】
// ============================================================

const adminController = {
    
    // ========================================================
    // 【仪表盘统计功能】
    // ========================================================
    
    // --------------------------------------------------------
    // 获取系统统计数据
    // --------------------------------------------------------
    // 【功能说明】
    // 返回系统的整体统计数据，用于管理后台首页展示
    // 
    // 【请求】
    // GET /admin/stats
    // 
    // 【权限】
    // 需要管理员权限
    // 
    // 【返回数据】
    // {
    //   totalUsers: 100,      // 总用户数
    //   activeUsers: 95,      // 活跃用户数
    //   totalBlogs: 500       // 总博客数
    // }
    // --------------------------------------------------------
    getDashboardStats: async (req, res) => {
        try {
            // 【权限检查】只有管理员才能访问
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            // 【统计查询】使用 countDocuments 统计数量
            // countDocuments() - 返回符合条件的文档数量
            // 不传参数则统计所有文档
            
            // 统计总用户数
            const totalUsers = await User.countDocuments();
            
            // 统计活跃用户数（status 为 'active' 的用户）
            const activeUsers = await User.countDocuments({ status: 'active' });
            
            // 统计总博客数
            const totalBlogs = await Blog.countDocuments();
            
            res.json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    totalBlogs
                }
            });
        } catch (error) {
            console.error('获取系统统计数据失败:', error);
            res.status(500).json({ success: false, message: '获取系统统计数据失败' });
        }
    },
    
    // ========================================================
    // 【博客管理功能】
    // ========================================================
    
    // --------------------------------------------------------
    // 获取所有博客（支持筛选、搜索）
    // --------------------------------------------------------
    // 【功能说明】
    // 分页获取博客列表，支持按状态、分类筛选和关键词搜索
    // 
    // 【请求】
    // GET /admin/blogs?page=1&limit=10&status=published&category=xxx&search=xxx
    // 
    // 【查询参数】
    // - page: 页码，默认1
    // - limit: 每页数量，默认10
    // - category: 分类ID
    // - search: 搜索关键词
    // 
    // 【返回数据】
    // {
    //   success: true,
    //   data: [博客数组],
    //   pagination: {
    //     total: 总数,
    //     page: 当前页,
    //     limit: 每页数量,
    //     pages: 总页数
    //   }
    // }
    // --------------------------------------------------------
    getAllBlogs: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            // 【参数解析】从查询字符串获取分页参数
            const { page = 1, limit = 10, category, search } = req.query;
            
            // 【分页计算】
            // skip = (页码 - 1) × 每页数量
            // 例如：第2页，每页10条 → skip = 10，跳过前10条
            const skip = (page - 1) * limit;
            
            // 【构建查询条件】动态构建 MongoDB 查询对象
            const query = {};
            
            // 分类筛选
            if (category) {
                query.category = category;
            }
            
            // 关键词搜索
            // $or - 满足任一条件即可
            // $regex - 正则表达式匹配
            // $options: 'i' - 忽略大小写
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { excerpt: { $regex: search, $options: 'i' } }
                ];
            }
            
            // 【执行查询】
            const blogs = await Blog.find(query)
                .populate('author', 'username profile.avatar')  // 填充作者信息
                .populate('category', 'name')                    // 填充分类名称
                .sort({ createdAt: -1 })                         // 按创建时间倒序
                .skip(skip)                                       // 跳过指定数量
                .limit(parseInt(limit));                         // 限制返回数量
            
            // 【统计总数】用于计算总页数
            const total = await Blog.countDocuments(query);
            
            res.json({
                success: true,
                data: blogs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))  // 向上取整
                }
            });
        } catch (error) {
            console.error('获取博客列表失败:', error);
            res.status(500).json({ success: false, message: '获取博客列表失败' });
        }
    },
    
    // --------------------------------------------------------
    // 删除博客
    // --------------------------------------------------------
    // 【功能说明】
    // 删除指定博客及其所有相关数据（评论、点赞、收藏）
    // 
    // 【请求】
    // DELETE /admin/blogs/:blogId
    // 
    // 【路由参数】
    // - blogId: 博客ID
    // --------------------------------------------------------
    deleteBlog: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { blogId } = req.params;
            
            // 【检查博客是否存在】
            const blog = await Blog.findById(blogId);
            if (!blog) {
                return res.status(404).json({ success: false, message: '博客不存在' });
            }
            
            // 【删除博客】
            await Blog.findByIdAndDelete(blogId);
            
            // 【级联删除】删除博客相关的所有数据
            
            // 删除相关评论
            await Comment.deleteMany({ blog: blogId });
            
            // 删除相关点赞
            await Like.deleteMany({ blog: blogId });
            
            // 删除相关收藏
            await Bookmark.deleteMany({ blog: blogId });
            
            res.json({ success: true, message: '博客已删除' });
        } catch (error) {
            console.error('删除博客失败:', error);
            res.status(500).json({ success: false, message: '删除博客失败' });
        }
    },
    
    // ========================================================
    // 【用户管理功能】
    // ========================================================
    
    // --------------------------------------------------------
    // 获取用户列表
    // --------------------------------------------------------
    // 【功能说明】
    // 分页获取用户列表，支持按角色、状态筛选和关键词搜索
    // 
    // 【请求】
    // GET /admin/users?page=1&limit=10&role=user&status=active&search=xxx
    // --------------------------------------------------------
    getUserList: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { page = 1, limit = 10, role, status, search } = req.query;
            const skip = (page - 1) * limit;
            
            // 【构建查询条件】
            const query = {};
            
            // 角色筛选
            if (role && ['user', 'admin'].includes(role)) {
                query.role = role;
            }
            
            // 状态筛选
            if (status && ['active', 'banned'].includes(status)) {
                query.status = status;
            }
            
            // 搜索条件
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            
            // 【执行查询】
            // .select() - 排除敏感字段
            // '-password' - 不返回密码
            // '-resetPasswordToken' - 不返回重置密码令牌
            const users = await User.find(query)
                .select('-password -resetPasswordToken -resetPasswordExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await User.countDocuments(query);
            
            res.json({
                success: true,
                data: users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('获取用户列表失败:', error);
            res.status(500).json({ success: false, message: '获取用户列表失败' });
        }
    },
    
    // --------------------------------------------------------
    // 查看用户详情
    // --------------------------------------------------------
    // 【功能说明】
    // 获取指定用户的详细信息
    // 
    // 【请求】
    // GET /admin/users/:userId
    // --------------------------------------------------------
    getUserDetails: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { userId } = req.params;
            
            // 【获取用户详情】
            const user = await User.findById(userId)
                .select('-password -resetPasswordToken -resetPasswordExpires');
            
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 【获取用户发布的文章数】
            const userBlogs = await Blog.countDocuments({ author: userId });
            
            res.json({
                success: true,
                data: {
                    user,
                    blogsCount: userBlogs
                }
            });
        } catch (error) {
            console.error('获取用户详情失败:', error);
            res.status(500).json({ success: false, message: '获取用户详情失败' });
        }
    },
    
    // --------------------------------------------------------
    // 封禁用户
    // --------------------------------------------------------
    // 【功能说明】
    // 封禁指定用户，禁止其登录和使用系统
    // 
    // 【请求】
    // PUT /admin/users/:userId/ban
    // 
    // 【请求体】
    // { reason: '封禁原因' }
    // --------------------------------------------------------
    banUser: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { userId } = req.params;
            const { reason } = req.body;
            
            // 【检查用户是否存在】
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 【安全检查】不能封禁管理员
            if (user.role === 'admin') {
                return res.status(400).json({ success: false, message: '不能封禁管理员账号' });
            }
            
            // 【状态检查】用户是否已被封禁
            if (user.status === 'banned') {
                return res.status(400).json({ success: false, message: '该用户已经被封禁' });
            }
            
            // 【执行封禁】
            await User.findByIdAndUpdate(
                userId,
                { 
                    status: 'banned', 
                    banReason: reason,
                    updatedAt: Date.now() 
                }
            );
            
            res.json({ success: true, message: '用户已被封禁' });
        } catch (error) {
            console.error('封禁用户失败:', error);
            res.status(500).json({ success: false, message: '封禁用户失败' });
        }
    },
    
    // --------------------------------------------------------
    // 解封用户
    // --------------------------------------------------------
    // 【功能说明】
    // 解除用户的封禁状态
    // 
    // 【请求】
    // PUT /admin/users/:userId/unban
    // --------------------------------------------------------
    unbanUser: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { userId } = req.params;
            
            // 【检查用户是否存在】
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 【状态检查】用户是否被封禁
            if (user.status !== 'banned') {
                return res.status(400).json({ success: false, message: '该用户没有被封禁' });
            }
            
            // 【执行解封】
            await User.findByIdAndUpdate(
                userId,
                { 
                    status: 'active', 
                    banReason: null,
                    updatedAt: Date.now() 
                }
            );
            
            res.json({ success: true, message: '用户已被解封' });
        } catch (error) {
            console.error('解封用户失败:', error);
            res.status(500).json({ success: false, message: '解封用户失败' });
        }
    },
    
    // --------------------------------------------------------
    // 更新用户信息
    // --------------------------------------------------------
    // 【功能说明】
    // 管理员更新用户信息（角色、状态、用户名、密码）
    // 
    // 【请求】
    // PUT /admin/users/:userId
    // 
    // 【请求体】
    // {
    //   role: 'user' | 'admin',
    //   status: 'active' | 'banned',
    //   banReason: '封禁原因',
    //   username: '新用户名',
    //   password: '新密码'
    // }
    // --------------------------------------------------------
    updateUser: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { userId } = req.params;
            const { role, status, banReason, username, password } = req.body;
            
            // 【检查用户是否存在】
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 【安全检查】不能将自己的角色改为普通用户
            const currentUserId = req.user.id || req.user._id;
            if (userId === currentUserId.toString() && role === 'user') {
                return res.status(400).json({ success: false, message: '不能将自己的角色改为普通用户' });
            }
            
            // 【准备更新数据】
            const updateData = {
                updatedAt: Date.now()
            };
            
            // 更新角色
            if (role && ['user', 'admin'].includes(role)) {
                updateData.role = role;
            }
            
            // 更新状态
            if (status && ['active', 'banned'].includes(status)) {
                updateData.status = status;
                if (status === 'banned') {
                    updateData.banReason = banReason;
                } else {
                    updateData.banReason = null;
                }
            }
            
            // 更新用户名
            if (username) {
                // 验证用户名长度
                if (username.trim().length < 2 || username.trim().length > 20) {
                    return res.status(400).json({ success: false, message: '用户名长度应在2-20个字符之间' });
                }
                
                // 检查用户名是否已存在
                const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: '用户名已被使用' });
                }
                
                updateData.username = username.trim();
            }
            
            // 更新密码
            if (password) {
                // 验证密码长度
                if (password.length < 6) {
                    return res.status(400).json({ success: false, message: '密码长度应至少为6个字符' });
                }
                
                // 加密密码
                const bcrypt = require('bcryptjs');
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }
            
            // 【执行更新】
            await User.findByIdAndUpdate(userId, updateData);
            
            res.json({ success: true, message: '用户信息已更新' });
        } catch (error) {
            console.error('更新用户信息失败:', error);
            res.status(500).json({ success: false, message: '更新用户信息失败' });
        }
    },
    
    // --------------------------------------------------------
    // 删除用户
    // --------------------------------------------------------
    // 【功能说明】
    // 删除用户及其所有相关数据
    // 
    // 【安全措施】
    // 1. 不能删除管理员
    // 2. 不能删除自己
    // 3. 需要二次确认（输入用户ID）
    // 
    // 【请求】
    // DELETE /admin/users/:userId
    // 
    // 【请求体】
    // { confirmUserId: '用户ID' }
    // --------------------------------------------------------
    deleteUser: async (req, res) => {
        try {
            // 【权限检查】
            if (req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限执行此操作' });
            }
            
            const { userId } = req.params;
            const { confirmUserId } = req.body;
            
            // 【检查用户是否存在】
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 【安全检查】不能删除管理员
            if (user.role === 'admin') {
                return res.status(400).json({ success: false, message: '不能删除管理员账号' });
            }
            
            // 【安全检查】不能删除自己
            const currentUserId = req.user.id || req.user._id;
            if (userId === currentUserId.toString()) {
                return res.status(400).json({ success: false, message: '不能删除自己的账户' });
            }
            
            // 【二次确认】验证用户ID
            if (!confirmUserId || confirmUserId !== userId) {
                return res.status(400).json({ success: false, message: '请输入正确的用户ID进行确认' });
            }
            
            // 【删除用户】
            await User.findByIdAndDelete(userId);

            // 【级联删除】删除用户相关的所有数据
            
            // 删除用户发布的所有文章
            await Blog.deleteMany({ author: userId });

            // 删除用户的所有评论
            await Comment.deleteMany({ user: userId });

            // 删除用户的所有收藏
            await Bookmark.deleteMany({ user: userId });

            // 删除用户的所有点赞
            await Like.deleteMany({ user: userId });

            // 删除用户的浏览历史
            await BrowseHistory.deleteMany({ user: userId });

            // 删除用户的所有通知（作为接收者和发送者）
            // $or - 满足任一条件
            await Notification.deleteMany({
                $or: [{ receiver: userId }, { sender: userId }]
            });

            // 删除用户的私信记录（作为发送者和接收者）
            await Message.deleteMany({
                $or: [{ sender: userId }, { receiver: userId }]
            });

            // 删除用户的关注关系（作为关注者和被关注者）
            await Follow.deleteMany({
                $or: [{ follower: userId }, { following: userId }]
            });

            res.json({ success: true, message: '用户及相关数据已删除' });
        } catch (error) {
            console.error('删除用户失败:', error);
            res.status(500).json({ success: false, message: '删除用户失败' });
        }
    },
    
    
    // ========================================================
    // 【分类管理功能】
    // ========================================================
    
};

// ============================================================
// 【模块导出】
// ============================================================
module.exports = adminController;
