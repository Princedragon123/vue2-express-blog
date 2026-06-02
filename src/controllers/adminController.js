// ============================================================
// adminController.js - 管理员控制器【优化完整版】
// ============================================================

// 【模块统一导入】
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const BrowseHistory = require('../models/BrowseHistory');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Follow = require('../models/Follow');

// ====================== 公共工具方法 ======================
// 获取登录管理员真实ID
const getAdminId = (user) => String(user._id || user.id);

// 统一服务器错误响应
const serverError = (res, err, tip = '服务器异常') => {
  console.error(`${tip}：`, err);
  return res.status(500).json({ success: false, message: tip });
};

// 分页参数格式化
const formatPageParams = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 10, 50); // 限制最大50条，防恶意查全表
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ============================================================
// 【管理员控制器对象】
// ============================================================
const adminController = {
    // ========================================================
    // 【仪表盘统计功能】
    // ========================================================
    getDashboardStats: async (req, res) => {
        try {
            // 统计总用户数
            const totalUsers = await User.countDocuments();
            // 统计活跃用户数
            const activeUsers = await User.countDocuments({ status: 'active' });
            // 统计总博客数
            const totalBlogs = await Blog.countDocuments();

            res.json({
                success: true,
                data: { totalUsers, activeUsers, totalBlogs }
            });
        } catch (error) {
            return serverError(res, error, '获取系统统计数据失败');
        }
    },

    // ========================================================
    // 【博客管理功能】
    // ========================================================
    getAllBlogs: async (req, res) => {
        try {
            const { search } = req.query;
            const { page, limit, skip } = formatPageParams(req.query);

            const query = {};
            // 关键词模糊搜索
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { excerpt: { $regex: search, $options: 'i' } }
                ];
            }

            // 联查作者信息
            const blogs = await Blog.find(query)
                .populate('author', 'username profile.avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Blog.countDocuments(query);

            res.json({
                success: true,
                data: blogs,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return serverError(res, error, '获取博客列表失败');
        }
    },

    // 删除博客 + 级联清理关联数据
    deleteBlog: async (req, res) => {
        try {
            const { blogId } = req.params;
            const blog = await Blog.findById(blogId);
            if (!blog) {
                return res.status(404).json({ success: false, message: '博客不存在' });
            }

            // 删除主博客
            await Blog.findByIdAndDelete(blogId);
            // 级联删除关联数据
            await Comment.deleteMany({ blog: blogId });
            await Like.deleteMany({ blog: blogId });
            await Bookmark.deleteMany({ blog: blogId });

            res.json({ success: true, message: '博客及关联数据已删除' });
        } catch (error) {
            return serverError(res, error, '删除博客失败');
        }
    },

    // ========================================================
    // 【用户管理功能】
    // ========================================================
    getUserList: async (req, res) => {
        try {
            const { role, status, search } = req.query;
            const { page, limit, skip } = formatPageParams(req.query);

            const query = {};
            // 角色筛选
            if (role && ['user', 'svip', 'admin'].includes(role)) {
                query.role = role;
            }
            // 状态筛选
            if (status && ['active', 'banned'].includes(status)) {
                query.status = status;
            }
            // 账号模糊搜索
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // 隐藏敏感字段
            const users = await User.find(query)
                .select('-password -resetPasswordToken -resetPasswordExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await User.countDocuments(query);

            res.json({
                success: true,
                data: users,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            });
        } catch (error) {
            return serverError(res, error, '获取用户列表失败');
        }
    },

    // 查看用户详情
    getUserDetails: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId)
                .select('-password -resetPasswordToken -resetPasswordExpires');

            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }

            const blogsCount = await Blog.countDocuments({ author: userId });
            res.json({
                success: true,
                data: { user, blogsCount }
            });
        } catch (error) {
            return serverError(res, error, '获取用户详情失败');
        }
    },

    // 封禁用户
    banUser: async (req, res) => {
        try {
            const adminId = getAdminId(req.user);
            const { userId } = req.params;
            const { reason } = req.body;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            // 安全校验：禁止封禁任何管理员
            if (user.role === 'admin') {
                return res.status(400).json({ success: false, message: '禁止封禁管理员账号' });
            }
            if (user.status === 'banned') {
                return res.status(400).json({ success: false, message: '该用户已处于封禁状态' });
            }

            await User.findByIdAndUpdate(userId, {
                status: 'banned',
                banReason: reason,
                updatedAt: Date.now()
            });

            res.json({ success: true, message: '用户封禁成功' });
        } catch (error) {
            return serverError(res, error, '封禁用户失败');
        }
    },

    // 解封用户
    unbanUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            if (user.status !== 'banned') {
                return res.status(400).json({ success: false, message: '该用户未被封禁' });
            }

            await User.findByIdAndUpdate(userId, {
                status: 'active',
                banReason: null,
                updatedAt: Date.now()
            });

            res.json({ success: true, message: '用户解封成功' });
        } catch (error) {
            return serverError(res, error, '解封用户失败');
        }
    },

    // 管理员编辑用户信息
    updateUser: async (req, res) => {
        try {
            const adminId = getAdminId(req.user);
            const { userId } = req.params;
            const { role, status, banReason, username, password } = req.body;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            // 禁止修改其他管理员信息
            if (user.role === 'admin' && userId !== adminId) {
                return res.status(400).json({ success: false, message: '无权修改其他管理员信息' });
            }
            // 禁止把自己降级为普通用户
            if (userId === adminId && role === 'user') {
                return res.status(400).json({ success: false, message: '禁止将自身账号降级为普通用户' });
            }

            const updateData = { updatedAt: Date.now() };
            // 更新角色
            if (role && ['user', 'svip', 'admin'].includes(role)) {
                updateData.role = role;
            }
            // 更新账号状态
            if (status && ['active', 'banned'].includes(status)) {
                updateData.status = status;
                updateData.banReason = status === 'banned' ? banReason : null;
            }
            // 更新用户名
            if (username) {
                const trimName = username.trim();
                if (trimName.length < 2 || trimName.length > 20) {
                    return res.status(400).json({ success: false, message: '用户名长度2-20位' });
                }
                const repeatUser = await User.findOne({ username: trimName, _id: { $ne: userId } });
                if (repeatUser) {
                    return res.status(400).json({ success: false, message: '用户名已存在' });
                }
                updateData.username = trimName;
            }
            // 加密更新密码
            if (password) {
                if (password.length < 6) {
                    return res.status(400).json({ success: false, message: '密码至少6位' });
                }
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }

            await User.findByIdAndUpdate(userId, updateData);
            res.json({ success: true, message: '用户信息修改成功' });
        } catch (error) {
            return serverError(res, error, '修改用户信息失败');
        }
    },

    // 彻底删除用户 + 级联清空所有关联数据
    deleteUser: async (req, res) => {
        try {
            const adminId = getAdminId(req.user);
            const { userId } = req.params;
            const { confirmUserId } = req.body;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            // 安全限制
            if (user.role === 'admin') {
                return res.status(400).json({ success: false, message: '禁止删除管理员账号' });
            }
            if (userId === adminId) {
                return res.status(400).json({ success: false, message: '禁止删除自身账号' });
            }
            if (!confirmUserId || confirmUserId !== userId) {
                return res.status(400).json({ success: false, message: '请正确输入用户ID确认删除' });
            }

            // 删除主用户
            await User.findByIdAndDelete(userId);
            // 级联删除全量关联数据
            await Blog.deleteMany({ author: userId });
            await Comment.deleteMany({ user: userId });
            await Bookmark.deleteMany({ user: userId });
            await Like.deleteMany({ user: userId });
            await BrowseHistory.deleteMany({ user: userId });
            await Notification.deleteMany({ $or: [{ receiver: userId }, { sender: userId }] });
            await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
            await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

            res.json({ success: true, message: '用户及全部关联数据已永久删除' });
        } catch (error) {
            return serverError(res, error, '删除用户失败');
        }
    }
};

// ============================================================
// 【模块导出】
// ============================================================
module.exports = adminController;