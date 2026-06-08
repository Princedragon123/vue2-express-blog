// userController.js - 用户控制器
// 处理用户相关的业务逻辑，包括：
// 1. 关注/取消关注
// 2. 获取关注/粉丝列表
// 3. 用户信息获取和更新
// 4. 头像/背景图上传
// 5. 隐私和通知设置
// A: 先查询是否存在关注记录，存在则直接返回
// A: 查询对方是否也关注了自己

// 导入依赖模块

// 用户模型
const User = require('../models/User');

// 博客模型
const Blog = require('../models/Blog');

// 通知模型
const Notification = require('../models/Notification');

// 点赞模型
const Like = require('../models/Like');

// 收藏模型
const Bookmark = require('../models/Bookmark');

// 关注模型
const Follow = require('../models/Follow');

// 认证中间件
const { authMiddleware } = require('../middlewares/auth');

// 隐私检查工具
const { canViewUserInfo } = require('../utils/privacy');

// 分页工具
const { parsePaginationParams, generatePaginationResponse } = require('../utils/pagination');

// 错误处理工具
const { handleControllerError, handleNotFoundError, handlePermissionError, handleBadRequestError } = require('../utils/errorHandler');

// WebSocket 服务
const socketService = require('../services/socketService');

// 用户控制器对象
const UserController = {
    
    // 关注用户
    // 1. 检查是否自己关注自己
    // 2. 检查目标用户是否存在
    // 3. 检查是否已经关注
    // 4. 创建关注记录
    // 5. 检查是否相互关注
    // 6. 创建通知并推送
    followUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id || req.user._id;
            
            // 检查是否是关注自己
            if (currentUserId.toString() === userId) {
                return res.status(400).json({ success: false, message: '不能关注自己' });
            }
            
            // 检查用户是否存在
            const userToFollow = await User.findById(userId);
            if (!userToFollow) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否已经关注
            const existingFollow = await Follow.findOne({ 
                follower: currentUserId, 
                following: userId 
            });
            if (existingFollow) {
                // 如果已经关注了，直接返回当前状态
                const isMutualFollowing = await Follow.findOne({ 
                    follower: userId, 
                    following: currentUserId 
                });
                return res.json({ 
                    success: true, 
                    message: '已经关注该用户',
                    data: {
                        isFollowing: true,
                        isMutualFollowing: !!isMutualFollowing
                    }
                });
            }
            
            // 创建关注记录
            const follow = new Follow({
                follower: currentUserId,
                following: userId
            });
            await follow.save();
            
            // 检查是否是相互关注
            const isMutualFollowing = await Follow.findOne({ 
                follower: userId, 
                following: currentUserId 
            });
            
            // 创建关注通知
            if (userToFollow && (!userToFollow.notifications || userToFollow.notifications.follow !== false)) {
                const notification = new Notification({
                    receiver: userId,
                    sender: currentUserId,
                    type: 'follow',
                    content: '关注了你',
                    resourceId: currentUserId,
                    resourceType: 'user'
                });
                await notification.save();
                socketService.sendNotification(userId, notification);
            }
            
            res.json({ 
                success: true, 
                message: '关注成功',
                data: {
                    isFollowing: true,
                    isMutualFollowing: !!isMutualFollowing
                }
            });
        } catch (error) {
            handleControllerError(res, error, '关注用户失败');
        }
    },
    
    // 取消关注用户
    unfollowUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id || req.user._id;
            
            // 检查是否是取消关注自己
            if (currentUserId.toString() === userId) {
                return res.status(400).json({ success: false, message: '不能取消关注自己' });
            }
            
            // 检查用户是否存在
            const userToUnfollow = await User.findById(userId);
            if (!userToUnfollow) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否已经关注
            const existingFollow = await Follow.findOne({ 
                follower: currentUserId, 
                following: userId 
            });
            if (!existingFollow) {
                return res.json({ 
                    success: true, 
                    message: '未关注该用户',
                    data: {
                        isFollowing: false,
                        isMutualFollowing: false
                    }
                });
            }
            
            // 删除关注记录
            await Follow.deleteOne({ 
                follower: currentUserId, 
                following: userId 
            });
            
            res.json({ 
                success: true, 
                message: '取消关注成功',
                data: {
                    isFollowing: false,
                    isMutualFollowing: false
                }
            });
        } catch (error) {
            handleControllerError(res, error, '取消关注用户失败');
        }
    },
    
    // 获取用户关注列表
    // 1. 隐私检查
    // 2. 分页查询
    // 3. populate 关联查询
    // 4. 批量检查关注状态
    getFollowingList: async (req, res) => {
        try {
            let { userId } = req.params;
            const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 10 });
            const currentUserId = req.user ? req.user.id : null;
            
            // 处理 'current' 特殊情况：获取当前登录用户自己的关注列表
            if (userId === 'current') {
                if (!currentUserId) {
                    return res.status(401).json({ success: false, message: '请先登录' });
                }
                userId = currentUserId;
            }
            
            // 检查用户是否存在
            const user = await User.findById(userId).select('privacy');
            
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否可以查看关注列表
            if (!canViewUserInfo(req.user, user, 'publicFollowList')) {
                return res.status(403).json({ success: false, message: '该用户的关注列表已设置为私密，无法查看' });
            }
            
            // 并行执行两个查询：获取分页的关注列表和关注总数
            const [follows, totalFollowing] = await Promise.all([
                // 获取分页的关注列表
                Follow.find({ follower: userId })
                    .populate('following', 'username profile.avatar profile.bio stats')
                    .skip(skip)
                    .limit(parseInt(limit))
                    .sort({ createdAt: -1 }),
                // 获取关注总数
                Follow.countDocuments({ follower: userId })
            ]);
            
            // 处理用户数据，添加isFollowing字段
            const followingUsers = [];
            if (currentUserId) {
                // 获取所有关注用户的ID
                const followingIds = follows.map(follow => follow.following._id);
                // 批量查询当前用户是否关注了这些用户
                const followRelations = await Follow.find({
                    follower: currentUserId,
                    following: { $in: followingIds }
                });
                // 创建关注关系映射
                const followMap = new Map();
                followRelations.forEach(relation => {
                    followMap.set(relation.following.toString(), true);
                });
                // 处理关注列表，添加isFollowing字段
                followingUsers.push(...follows.map(follow => {
                    const userObj = follow.following.toObject();
                    const isFollowing = followMap.has(userObj._id.toString());
                    return {
                        ...userObj,
                        isFollowing
                    };
                }));
            } else {
                // 没有登录用户，直接返回关注列表
                followingUsers.push(...follows.map(follow => {
                    const userObj = follow.following.toObject();
                    return {
                        ...userObj,
                        isFollowing: false
                    };
                }));
            }
            
            res.json({
                success: true,
                data: followingUsers,
                pagination: {
                    total: totalFollowing,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalFollowing / limit)
                }
            });
        } catch (error) {
            handleControllerError(res, error, '获取关注列表失败');
        }
    },
    
    // 获取用户粉丝列表
    getFollowersList: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 10 });
            const currentUserId = req.user ? req.user.id : null;
            
            // 检查用户是否存在
            const user = await User.findById(userId).select('privacy');
            
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否可以查看粉丝列表
            if (!canViewUserInfo(req.user, user, 'publicFollowList')) {
                return res.status(403).json({ success: false, message: '该用户的粉丝列表已设置为私密，无法查看' });
            }
            
            // 并行执行两个查询：获取分页的粉丝列表和粉丝总数
            const [follows, totalFollowers] = await Promise.all([
                // 获取分页的粉丝列表
                Follow.find({ following: userId })
                    .populate('follower', 'username profile.avatar profile.bio')
                    .skip(skip)
                    .limit(parseInt(limit))
                    .sort({ createdAt: -1 }),
                // 获取粉丝总数
                Follow.countDocuments({ following: userId })
            ]);
            
            // 处理用户数据，添加isFollowing字段
            const followerUsers = [];
            if (currentUserId) {
                // 获取所有粉丝的ID
                const followerIds = follows.map(follow => follow.follower._id);
                // 批量查询当前用户是否关注了这些粉丝
                const followRelations = await Follow.find({
                    follower: currentUserId,
                    following: { $in: followerIds }
                });
                // 创建关注关系映射
                const followMap = new Map();
                followRelations.forEach(relation => {
                    followMap.set(relation.following.toString(), true);
                });
                // 处理粉丝列表，添加isFollowing字段
                followerUsers.push(...follows.map(follow => {
                    const userObj = follow.follower.toObject();
                    const isFollowing = followMap.has(userObj._id.toString());
                    return {
                        ...userObj,
                        isFollowing
                    };
                }));
            } else {
                // 没有登录用户，直接返回粉丝列表
                followerUsers.push(...follows.map(follow => {
                    const userObj = follow.follower.toObject();
                    return {
                        ...userObj,
                        isFollowing: false
                    };
                }));
            }
            
            res.json({
                success: true,
                data: followerUsers,
                pagination: {
                    total: totalFollowers,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalFollowers / limit)
                }
            });
        } catch (error) {
            handleControllerError(res, error, '获取粉丝列表失败');
        }
    },
    
    // 获取用户信息
    // - user: 用户基本信息
    // - isFollowing: 是否已关注
    // - isMutualFollowing: 是否相互关注
    // - followingCount: 关注数
    // - followersCount: 粉丝数
    // - latestBlogs: 最新博客
    getUserInfo: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user ? (req.user.id || req.user._id) : null;
            const isAdmin = req.user ? req.user.role === 'admin' : false;
            
            console.log('📥 获取用户信息 - userId:', userId);
            console.log('👤 当前用户:', req.user ? req.user.username : '未登录');
            console.log('🔑 当前用户 ID:', currentUserId);
            
            // 获取用户信息
            const user = await User.findById(userId)
                .select('-password');
            
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查当前用户是否关注了该用户
            let isFollowing = false;
            if (currentUserId) {
                // 检查当前用户是否关注了该用户
                const existingFollow = await Follow.findOne({ 
                    follower: currentUserId, 
                    following: userId 
                });
                isFollowing = !!existingFollow;
            }
            
            // 计算关注数和粉丝数
            const followingCount = await Follow.countDocuments({ follower: userId });
            const followersCount = await Follow.countDocuments({ following: userId });
            
            // 检查是否是相互关注
            let isMutualFollowing = false;
            if (currentUserId && isFollowing) {
                // 检查对方是否也关注了当前用户
                const mutualFollow = await Follow.findOne({
                    follower: userId,
                    following: currentUserId
                });
                isMutualFollowing = !!mutualFollow;
            }
            
            // 检查是否可以查看用户的博客
            let latestBlogs = [];
            let postsPrivacyDenied = false;
            let totalPostsCount = 0;
            
            // 总是获取文章总数（用于显示）
            totalPostsCount = await Blog.countDocuments({ author: userId });
            
            if (canViewUserInfo(req.user, user, 'publicPosts')) {
                // 获取用户发布的最新博客
                latestBlogs = await Blog.find({ author: userId })
                    .sort({ createdAt: -1 })
                    .limit(6);
            } else {
                // 由于隐私设置，无法查看文章
                postsPrivacyDenied = true;
            }
            
            // 处理博客数据
            const processedBlogs = latestBlogs.map(blog => {
                const blogObj = blog.toObject();
                return blogObj;
            });
            
            // 构造返回的用户对象，添加关注数和粉丝数
            const userWithCounts = {
                ...user.toObject(),
                followingCount: followingCount,
                followersCount: followersCount
            };
            
            console.log('📤 返回用户信息 - userId:', userId);
            console.log('🔒 用户隐私设置:', user.privacy);
            console.log('📦 返回的 user 对象:', JSON.stringify(userWithCounts, null, 2));
            
            res.json({
                success: true,
                data: {
                    user: userWithCounts,
                    isFollowing,
                    isMutualFollowing,
                    latestBlogs: processedBlogs,
                    postsPrivacyDenied,
                    totalPostsCount  // 添加文章总数
                }
            });
        } catch (error) {
            handleControllerError(res, error, '获取用户信息失败');
        }
    },
    
    // 更新用户信息
    updateUserInfo: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            // 检查是否是当前用户
            if (currentUserId.toString() !== userId) {
                return res.status(403).json({ success: false, message: '没有权限修改该用户信息' });
            }
            
            // 输入验证和参数类型检查
            const updateData = {};
            
            // 验证并处理bio字段
            if (req.body.bio !== undefined) {
                if (typeof req.body.bio !== 'string') {
                    return res.status(400).json({ success: false, message: '个人简介必须是字符串' });
                }
                if (req.body.bio.length > 500) {
                    return res.status(400).json({ success: false, message: '个人简介不能超过500个字符' });
                }
                updateData['profile.bio'] = req.body.bio;
            }
            
            // 验证并处理location字段
            if (req.body.location !== undefined) {
                if (typeof req.body.location !== 'string') {
                    return res.status(400).json({ success: false, message: '位置必须是字符串' });
                }
                if (req.body.location.length > 100) {
                    return res.status(400).json({ success: false, message: '位置不能超过100个字符' });
                }
                updateData['profile.location'] = req.body.location;
            }
            
            // 验证并处理website字段
            if (req.body.website !== undefined) {
                if (typeof req.body.website !== 'string') {
                    return res.status(400).json({ success: false, message: '网站必须是字符串' });
                }
                // 简单的URL格式验证
                const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
                if (req.body.website && !urlPattern.test(req.body.website)) {
                    return res.status(400).json({ success: false, message: '网站URL格式不正确' });
                }
                updateData['profile.website'] = req.body.website;
            }
            
            // 验证并处理occupation字段
            if (req.body.occupation !== undefined) {
                if (typeof req.body.occupation !== 'string') {
                    return res.status(400).json({ success: false, message: '职业必须是字符串' });
                }
                if (req.body.occupation.length > 100) {
                    return res.status(400).json({ success: false, message: '职业不能超过100个字符' });
                }
                updateData['profile.occupation'] = req.body.occupation;
            }
            
            // 验证并处理coverImage字段
            if (req.body.coverImage !== undefined) {
                if (typeof req.body.coverImage !== 'string') {
                    return res.status(400).json({ success: false, message: '背景图URL必须是字符串' });
                }
                updateData['profile.coverImage'] = req.body.coverImage;
            }
            
            // 如果没有要更新的数据，直接返回
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: '没有要更新的数据' });
            }
            
            // 添加更新时间
            updateData.updatedAt = Date.now();
            
            // 更新用户信息
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');
            
            res.json({ success: true, data: updatedUser, message: '用户信息更新成功' });
        } catch (error) {
            handleControllerError(res, error, '更新用户信息失败');
        }
    },
    
    // 检查是否关注用户
    checkFollowStatus: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user.id;
            
            // 检查用户是否存在
            const userToCheck = await User.findById(userId);
            if (!userToCheck) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否已经关注
            const existingFollow = await Follow.findOne({ 
                follower: currentUserId, 
                following: userId 
            });
            const isFollowing = !!existingFollow;
            
            // 检查是否是相互关注
            let isMutualFollowing = false;
            if (isFollowing) {
                const mutualFollow = await Follow.findOne({
                    follower: userId,
                    following: currentUserId
                });
                isMutualFollowing = !!mutualFollow;
            }
            
            res.json({ success: true, data: { isFollowing, isMutualFollowing } });
        } catch (error) {
            handleControllerError(res, error, '检查关注状态失败');
        }
    },
    
    // 上传头像
    // 1. 检查是否有文件上传
    // 2. 构建新头像URL
    // 3. 更新用户头像
    // 4. 删除旧头像文件
    uploadAvatar: async (req, res) => {
        try {
            const currentUserId = req.user.id;
            
            // 检查是否有文件上传
            if (!req.file) {
                return res.status(400).json({ success: false, message: '请选择要上传的头像' });
            }
            
            // 获取用户当前的头像信息
            const currentUser = await User.findById(currentUserId).select('profile.avatar');
            const oldAvatarUrl = currentUser?.profile?.avatar;
            
            // 构建新头像URL
            const avatarUrl = `/static/uploads/avatars/${req.file.filename}`;
            
            // 更新用户头像
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                {
                    $set: {
                        'profile.avatar': avatarUrl,
                        updatedAt: Date.now()
                    }
                },
                { new: true, runValidators: true }
            ).select('-password');
            
            // 导入上传服务
            const uploadService = require('../services/uploadService');
            
            // 删除旧头像（如果存在）
            if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
                // 直接使用旧头像URL（已经包含 /static 前缀）
                // 删除旧头像文件
                uploadService.deleteFile(oldAvatarUrl);
            }
            
            res.json({ 
                success: true, 
                message: '头像上传成功',
                data: {
                    url: avatarUrl,
                    user: updatedUser
                }
            });
        } catch (error) {
            handleControllerError(res, error, '上传头像失败');
        }
    },
    
    // 上传背景图
    uploadCover: async (req, res) => {
        try {
            const currentUserId = req.user.id;
            
            // 检查是否有文件上传
            if (!req.file) {
                return res.status(400).json({ success: false, message: '请选择要上传的背景图' });
            }
            
            // 获取用户当前的背景图信息
            const currentUser = await User.findById(currentUserId).select('profile.coverImage');
            const oldCoverUrl = currentUser?.profile?.coverImage;
            
            // 构建新背景图URL
            const coverUrl = `/static/uploads/backgrounds/${req.file.filename}`;
            
            // 更新用户背景图
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                {
                    $set: {
                        'profile.coverImage': coverUrl,
                        updatedAt: Date.now()
                    }
                },
                { new: true, runValidators: true }
            ).select('-password -resetPasswordToken -resetPasswordExpires');
            
            // 导入上传服务
            const uploadService = require('../services/uploadService');
            
            // 删除旧背景图（如果存在）
            if (oldCoverUrl && oldCoverUrl !== coverUrl) {
                // 直接使用旧背景图URL（已经包含 /static 前缀）
                // 删除旧背景图文件
                uploadService.deleteFile(oldCoverUrl);
            }
            
            res.json({ 
                success: true, 
                message: '背景图上传成功',
                data: {
                    url: coverUrl,
                    user: updatedUser
                }
            });
        } catch (error) {
            handleControllerError(res, error, '上传背景图失败');
        }
    },
    
    // 搜索用户
    // - username: 用户名
    // - profile.bio: 个人简介
    // - profile.occupation: 职业
    // - profile.location: 位置
    searchUsers: async (req, res) => {
        try {
            const { query } = req.query;
            const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 10 });
            
            if (!query) {
                return res.json({ success: true, ...generatePaginationResponse([], 0, page, limit) });
            }
            
            // 使用正则表达式搜索用户
            const regexSearchQuery = {
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { 'profile.bio': { $regex: query, $options: 'i' } },
                    { 'profile.occupation': { $regex: query, $options: 'i' } },
                    { 'profile.location': { $regex: query, $options: 'i' } }
                ]
            };
            
            // 执行搜索
            const [users, total] = await Promise.all([
                User.find(regexSearchQuery)
                    .select('username profile.avatar profile.bio stats social')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                User.countDocuments(regexSearchQuery)
            ]);
            
            res.json({
                success: true,
                ...generatePaginationResponse(users, total, page, limit)
            });
        } catch (error) {
            handleControllerError(res, error, '搜索用户失败');
        }
    },
    
    // 更新隐私设置
    updatePrivacySettings: async (req, res) => {
        try {
            const currentUserId = req.user.id || req.user._id;
            const { privacy } = req.body;
            
            // 验证隐私设置数据
            if (!privacy) {
                return res.status(400).json({ success: false, message: '请提供隐私设置' });
            }
            
            // 更新隐私设置
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                {
                    $set: {
                        privacy: {
                            publicPosts: privacy.publicPosts !== undefined ? privacy.publicPosts : true,
                            publicLikes: privacy.publicLikes !== undefined ? privacy.publicLikes : true,
                            publicBookmarks: privacy.publicBookmarks !== undefined ? privacy.publicBookmarks : true,
                            publicFollowList: privacy.publicFollowList !== undefined ? privacy.publicFollowList : true
                        },
                        updatedAt: Date.now()
                    }
                },
                { new: true, runValidators: true }
            ).select('-password -resetPasswordToken -resetPasswordExpires');
            
            res.json({ success: true, data: updatedUser, message: '隐私设置更新成功' });
        } catch (error) {
            handleControllerError(res, error, '更新隐私设置失败');
        }
    },
    
    // 更新通知设置
    updateNotificationSettings: async (req, res) => {
        try {
            const currentUserId = req.user._id || req.user.id;
            const { notifications } = req.body;
            
            // 验证通知设置数据
            if (!notifications) {
                return res.status(400).json({ success: false, message: '请提供通知设置' });
            }
            
            // 更新通知设置
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                {
                    $set: {
                        notifications: {
                            message: notifications.message !== undefined ? notifications.message : true,
                            follow: notifications.follow !== undefined ? notifications.follow : true,
                            like: notifications.like !== undefined ? notifications.like : true,
                            comment: notifications.comment !== undefined ? notifications.comment : true
                        },
                        updatedAt: Date.now()
                    }
                },
                { new: true, runValidators: true }
            ).select('-password -resetPasswordToken -resetPasswordExpires');
            
            res.json({ success: true, data: updatedUser, message: '通知设置更新成功' });
        } catch (error) {
            handleControllerError(res, error, '更新通知设置失败');
        }
    },
    
    // 获取用户点赞的文章
    getLikedPosts: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user ? (req.user.id || req.user._id) : null;
            const isAdmin = req.user ? req.user.role === 'admin' : false;
            
            // 检查用户是否存在
            const user = await User.findById(userId).select('privacy');
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否可以查看点赞列表
            if (!canViewUserInfo(req.user, user, 'publicLikes')) {
                return res.status(403).json({ success: false, message: '该用户的点赞列表已设置为私密，无法查看' });
            }
            
            // 查找用户的点赞记录
            const likes = await Like.find({ user: userId, contentType: 'blog' })
                .sort({ createdAt: -1 });
            
            // 提取博客ID列表
            const blogIds = likes.map(like => like.contentId);
            
            // 批量获取博客信息，同时关联作者信息
            const blogs = await Blog.find({ _id: { $in: blogIds } })
                .populate('author', 'username')
                .select('title image author likes comments createdAt');
            
            // 构建博客 ID 到博客信息的映射
            const blogMap = new Map();
            blogs.forEach(blog => {
                blogMap.set(blog._id.toString(), blog);
            });
            
            // 提取点赞文章数据
            const likedPosts = likes.map(like => {
                const blog = blogMap.get(like.contentId.toString());
                if (!blog) {
                    return null;
                }
                
                let authorName = '未知作者';
                if (blog.author) {
                    if (typeof blog.author === 'object' && blog.author.username) {
                        authorName = blog.author.username;
                    } else if (typeof blog.author === 'string') {
                        authorName = blog.author;
                    }
                }
                
                return {
                    _id: blog._id,
                    title: blog.title,
                    image: blog.image,
                    author: authorName,
                    likes: blog.likes,
                    comments: blog.comments,
                    createdAt: blog.createdAt,
                    date: blog.createdAt
                };
            }).filter(Boolean); // 过滤掉 null 值
            
            res.json({ success: true, data: likedPosts });
        } catch (error) {
            handleControllerError(res, error, '获取用户点赞文章失败');
        }
    },
    
    // 获取用户收藏的文章
    getBookmarkedPosts: async (req, res) => {
        try {
            const { userId } = req.params;
            const currentUserId = req.user ? (req.user.id || req.user._id) : null;
            const isAdmin = req.user ? req.user.role === 'admin' : false;
            
            // 检查用户是否存在
            const user = await User.findById(userId).select('privacy');
            if (!user) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 检查是否可以查看收藏列表
            if (!canViewUserInfo(req.user, user, 'publicBookmarks')) {
                return res.status(403).json({ success: false, message: '该用户的收藏列表已设置为私密，无法查看' });
            }
            
            // 查找用户的收藏记录
            const bookmarks = await Bookmark.find({ user: userId })
                .sort({ createdAt: -1 });
            
            // 提取博客 ID 列表
            const blogIds = bookmarks.map(bookmark => bookmark.blog);
            
            // 批量获取博客信息，同时关联作者信息
            const blogs = await Blog.find({ _id: { $in: blogIds } })
                .populate('author', 'username')
                .select('title image author likes comments createdAt');
            
            // 构建博客 ID 到博客信息的映射
            const blogMap = new Map();
            blogs.forEach(blog => {
                blogMap.set(blog._id.toString(), blog);
            });
            
            // 提取收藏文章数据
            const bookmarkedPosts = bookmarks.map(bookmark => {
                const blog = blogMap.get(bookmark.blog.toString());
                if (!blog) {
                    return null;
                }
                
                let authorName = '未知作者';
                if (blog.author) {
                    if (typeof blog.author === 'object' && blog.author.username) {
                        authorName = blog.author.username;
                    } else if (typeof blog.author === 'string') {
                        authorName = blog.author;
                    }
                }
                
                return {
                    _id: blog._id,
                    title: blog.title,
                    image: blog.image,
                    author: authorName,
                    likes: blog.likes,
                    comments: blog.comments,
                    createdAt: blog.createdAt,
                    date: blog.createdAt
                };
            }).filter(Boolean); // 过滤掉 null 值
            
            res.json({ success: true, data: bookmarkedPosts });
        } catch (error) {
            handleControllerError(res, error, '获取用户收藏文章失败');
        }
    },
    
    // 修改用户名
    updateUsername: async (req, res) => {
        try {
            const currentUserId = req.user.id || req.user._id;
            const { username } = req.body;
            
            // 验证用户名
            if (!username || username.trim().length < 2 || username.trim().length > 20) {
                return res.status(400).json({ success: false, message: '用户名长度应在2-20个字符之间' });
            }
            
            // 检查用户名是否已存在
            const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: currentUserId } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: '用户名已被使用' });
            }
            
            // 更新用户名
            const updatedUser = await User.findByIdAndUpdate(
                currentUserId,
                {
                    $set: {
                        username: username.trim(),
                        updatedAt: Date.now()
                    }
                },
                { new: true, runValidators: true }
            ).select('-password -resetPasswordToken -resetPasswordExpires');
            
            res.json({ success: true, data: { user: updatedUser }, message: '用户名修改成功' });
        } catch (error) {
            handleControllerError(res, error, '修改用户名失败');
        }
    },
    
    // 修改密码
    changePassword: async (req, res) => {
        try {
            const currentUserId = req.user.id || req.user._id;
            const { currentPassword, newPassword } = req.body;
            
            // 验证密码
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: '请提供当前密码和新密码' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: '密码长度应至少为6个字符' });
            }
            
            // 检查当前密码是否正确
            const user = await User.findById(currentUserId);
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: '当前密码错误' });
            }
            
            // 更新密码
            user.password = newPassword;
            await user.save();
            
            res.json({ success: true, message: '密码修改成功' });
        } catch (error) {
            handleControllerError(res, error, '修改密码失败');
        }
    }
};

// 导出用户控制器
module.exports = UserController;
