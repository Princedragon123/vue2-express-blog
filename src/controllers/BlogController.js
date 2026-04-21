// ============================================================
// BlogController.js - 博客控制器
// ============================================================
// 
// 【文件职责】
// 处理博客相关的所有HTTP请求，包括：
// 1. 博客CRUD操作（创建、读取、更新、删除）
// 2. 评论管理（创建、删除、置顶）
// 3. 点赞和收藏功能
// 4. 搜索功能
// 5. 推荐算法
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Mongoose查询：populate、sort、skip、limit                           │
// │  2. 并行查询：Promise.all 提高性能                                      │
// │  3. 分页实现：skip + limit 模式                                         │
// │  4. 权限验证：检查用户是否有权操作                                      │
// │  5. 通知系统：创建通知并通过WebSocket推送                               │
// │  6. 推荐算法：加权随机推荐                                              │
// │  7. 搜索实现：文本索引 + 正则表达式fallback                             │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: populate是什么？有什么用？
// A: 类似SQL的JOIN，用于填充关联文档的详细信息
// 
// Q2: 为什么用Promise.all？
// A: 并行执行多个查询，提高性能，减少等待时间
// 
// Q3: 分页如何实现？
// A: skip跳过前面的记录，limit限制返回数量
// 
// Q4: 如何防止重复点赞？
// A: 创建Like集合记录点赞关系，查询时检查是否已存在
// 
// Q5: 推荐算法怎么实现的？
// A: 计算新鲜度+热度权重，加权随机抽取
// 
// Q6: 如何处理浏览量统计？
// A: 使用内存Set记录已浏览，避免重复计数
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
// 【mongoose】MongoDB对象建模工具
// 作用：提供Schema定义、模型创建、查询构建等功能
const mongoose = require('mongoose');

// ============================================================
// 导入数据模型
// ============================================================
// 【Blog】博客模型
// 字段：title, content, author, category, likes, views等
const Blog = require('../models/Blog');

// 【User】用户模型
// 字段：username, password, profile, stats 等
const User = require('../models/User');

// 【Comment】评论模型
// 字段：content, author, blog, parentId 等
const Comment = require('../models/Comment');

// 【Bookmark】收藏模型
// 字段：user, blog, createdAt等
const Bookmark = require('../models/Bookmark');

// 【Like】点赞模型
// 字段：user, contentId, contentType 等
const Like = require('../models/Like');

// 【Notification】通知模型
// 字段：receiver, sender, type, content 等
const Notification = require('../models/Notification');

// ============================================================
// 导入工具模块
// =============================================================

// 【隐私检查工具】
// canViewBlog: 检查用户是否可以查看博客
// filterBlogsByPrivacy: 批量过滤私密博客
const { canViewBlog, filterBlogsByPrivacy } = require('../utils/privacy');

// 【分页工具】
// parsePaginationParams: 解析分页参数
// generatePaginationResponse: 生成分页响应
const { parsePaginationParams, generatePaginationResponse } = require('../utils/pagination');

// 【错误处理工具】
// handleControllerError: 统一处理控制器错误
const { handleControllerError } = require('../utils/errorHandler');

// 【过滤服务】
// validateComment: 验证评论内容
const filterService = require('../services/filterService');

// 【上传服务】
// singleUpload: 单文件上传中间件
// generateFileUrl: 生成文件访问 URL
const uploadService = require('../services/uploadService');

// 【WebSocket 服务】
// sendNotification: 实时推送通知
const socketService = require('../services/socketService');

// ============================================================
// 博客控制器对象
// ============================================================
// 【设计模式】模块模式
// 将所有相关方法组织在一个对象中，便于管理和导出
// 
// 【面试常问】
// Q: 为什么用对象而不是类？
// A: Node.js中常用模块模式，简单直接，不需要实例化
// ============================================================
const BlogController = {
    // ============================================================
    // 获取博客列表（核心方法）
    // ============================================================
    // 【路由】GET /api/blogs
    // 【作用】获取已发布的博客列表，支持分页和筛选
    // 
    // 【查询参数】
    // - category: 分类名称（可选）
    // - tag: 标签名称（可选）
    // - keyword: 搜索关键词（可选）
    // - page: 页码（默认1）
    // - limit: 每页数量（默认6）
    // 
    // 【返回格式】
    // {
    //   success: true,
    //   data: [博客数组],
    //   pagination: { total, page, limit, pages }
    // }
    // 
    // 【流程】
    // 1. 解析分页参数
    // 2. 构建查询条件
    // 3. 并行查询博客列表和总数
    // 4. 过滤私密博客
    // 5. 返回分页结果
    // 
    // 【面试常问】
    // Q1: populate的作用是什么？
    // A: 填充关联字段，类似SQL的JOIN
    // 
    // Q2: 为什么要用Promise.all？
    // A: 并行执行两个独立查询，提高性能
    // 
    // Q3: $in操作符是什么意思？
    // A: 匹配数组中任意一个值
    // 
    // Q4: $or操作符是什么意思？
    // A: 匹配多个条件中的任意一个
    // ============================================================
    getBlogs: async (req, res) => {
        try {
            // 解构查询参数
            const { tag, keyword } = req.query;
            
            // 解析分页参数
            // parsePaginationParams 返回 { page, limit, skip }
            // skip = (page - 1) * limit，用于跳过前面的记录
            //解析分页数据，返回修正的数据
            const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 6 });
            
            // 构建基础查询条件
            const query = {
                status: 'published' // 只获取已发布的博客
            };
            
            // 处理标签过滤
            if (tag) {
                // $in 操作符：匹配数组中包含指定值的文档
                query.tags = { $in: [tag] };
            }
            
            // 处理关键词搜索
            if (keyword) {
                // $or 操作符：匹配任意一个条件
                // $regex 操作符：正则表达式匹配
                // $options: 'i' 表示不区分大小写
                query.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { content: { $regex: keyword, $options: 'i' } },
                    { tags: { $regex: keyword, $options: 'i' } },
                    { excerpt: { $regex: keyword, $options: 'i' } }
                ];
            }
            
            // 【调试信息】打印最终查询条件
            console.log('🔍 MongoDB 查询条件:', JSON.stringify(query, null, 2));
            
            // 并行执行两个查询
            // Promise.all：等待所有 Promise 完成
            // 优点：两个查询同时进行，减少总等待时间
            const [blogs, total] = await Promise.all([
                // 查询 1：获取分页的博客列表
                Blog.find(query)
                    .populate('author', 'username _id profile.avatar role privacy') // 填充作者信息
                    .sort({ createdAt: -1 }) // 按创建时间倒序排序（最新的在前）
                    .skip(skip) // 跳过前面的记录
                    .limit(parseInt(limit)), // 限制返回数量
                // 查询 2：获取总记录数
                Blog.countDocuments(query)
            ]);
            
            // 过滤私密博客
            // 根据用户的隐私设置，过滤掉不允许查看的博客
            const filteredBlogs = filterBlogsByPrivacy(blogs, req.user);
            
            // 返回分页结果
            res.json({
                success: true,
                ...generatePaginationResponse(filteredBlogs, total, page, limit)
            });
        } catch (error) {
            handleControllerError(res, error, '获取博客列表失败');
        }
    },
    
    // ============================================================
    // 获取热门博客
    // ============================================================
    // 【路由】GET /api/blogs/hot
    // 【作用】获取浏览量最高的博客
    // 
    // 【查询参数】
    // - limit: 返回数量（默认5）
    // 
    // 【排序规则】按浏览量(views)降序
    // 
    // 【面试常问】
    // Q: 如何实现热门排行？
    // A: sort({ views: -1 }) 按浏览量降序排序
    // ============================================================
    getHotBlogs: async (req, res) => {
        try {
            const { limit = 5 } = req.query;
            
            // 查询热门博客
            let hotBlogs = await Blog.find({ status: 'published' })
                .populate('author', 'username _id profile.avatar role privacy')
                .sort({ views: -1 }) // 按浏览量降序
                .limit(parseInt(limit));
            
            // 过滤私密博客
            hotBlogs = filterBlogsByPrivacy(hotBlogs, req.user);
            
            res.json({ success: true, data: hotBlogs });
        } catch (error) {
            handleControllerError(res, error, '获取热门博客失败');
        }
    },
    
    // ============================================================
    // 获取推荐博客（加权随机推荐算法）
    // ============================================================
    // 【路由】GET /api/blogs/recommended
    // 【作用】获取个性化推荐的博客
    // 
    // 【算法核心】
    // 1. 计算每篇文章的权重分数
    // 2. 权重 = 新鲜度(30%) + 热度(70%)
    // 3. 加权随机抽取
    // 
    // 【权重计算】
    // - 新鲜度：1 / log10(天数 + 1)，越新分数越高
    // - 热度：点赞(30%) + 收藏(35%) + 评论(20%) + 浏览(15%)
    // 
    // 【面试常问】
    // Q1: 为什么用加权随机而不是直接排序？
    // A: 排序会导致热门文章永远在前，新文章没机会曝光
    // 
    // Q2: 为什么热度比新鲜度权重高？
    // A: 用户更关心优质内容，而不是最新内容
    // 
    // Q3: 加权随机如何实现？
    // A: 计算总权重，生成随机数，按权重分配区间
    // ============================================================
    getRecommendedBlogs: async (req, res) => {
        try {
            const { limit = 20 } = req.query;
            
            // 步骤 1：获取所有已发布文章作为基础池
            let blogs = await Blog.find({ status: 'published' })
                .populate('author', 'username _id profile.avatar role privacy')
                // .populate('category', 'name'); // 分类功能已删除
            
            // 过滤私密博客
            blogs = filterBlogsByPrivacy(blogs, req.user);
            
            // 步骤2：计算每个文章的权重分数
            const now = new Date();
            const weightedBlogs = blogs.map(blog => {
                // 新鲜度权重（对数衰减）
                // Math.max(1, ...) 确保天数至少为1，避免除以0
                const daysSinceCreated = Math.max(1, (now - new Date(blog.createdAt)) / (1000 * 60 * 60 * 24));
                // 对数衰减：越旧的文章分数越低，但不会为0
                const freshnessScore = 1 / Math.log10(daysSinceCreated + 1);
                
                // 热度权重（综合多个指标）
                // Math.min(...) 限制最大值，避免某个指标过大
                const likesScore = Math.min(blog.likes || 0, 100) / 100;
                const bookmarksScore = Math.min(blog.bookmarks || 0, 100) / 100;
                const commentsScore = Math.min(blog.comments || 0, 50) / 50;
                const viewsScore = Math.min(blog.views || 0, 1000) / 1000;
                
                // 热度综合分数（加权平均）
                const heatScore = (likesScore * 0.3 + bookmarksScore * 0.35 + commentsScore * 0.2 + viewsScore * 0.15);
                
                // 总权重 = 新鲜度(30%) + 热度(70%)
                const totalWeight = freshnessScore * 0.3 + heatScore * 0.7;
                
                // 设置最小权重，避免分数太低的文章完全没机会
                const finalWeight = Math.max(0.15, totalWeight);
                
                return {
                    blog,
                    weight: finalWeight
                };
            });
            
            // 步骤3：加权随机抽取
            const selectedBlogs = [];
            const tempWeightedBlogs = [...weightedBlogs];
            const selectCount = Math.min(parseInt(limit), tempWeightedBlogs.length);
            
            for (let i = 0; i < selectCount; i++) {
                // 计算总权重
                const totalWeight = tempWeightedBlogs.reduce((sum, item) => sum + item.weight, 0);
                
                // 生成随机数 [0, totalWeight)
                let random = Math.random() * totalWeight;
                
                // 根据权重选择文章
                for (let j = 0; j < tempWeightedBlogs.length; j++) {
                    random -= tempWeightedBlogs[j].weight;
                    if (random <= 0) {
                        selectedBlogs.push(tempWeightedBlogs[j].blog);
                        // 从候选池中移除已选文章
                        tempWeightedBlogs.splice(j, 1);
                        break;
                    }
                }
            }
            
            // 计算分页信息
            const total = blogs.length; // 总文章数
            const limitNum = parseInt(limit) || 20;
            const totalPages = Math.ceil(total / limitNum);
            
            res.json({ 
                success: true, 
                data: selectedBlogs,
                total: total,
                totalPages: totalPages,
                page: 1,
                limit: limitNum
            });
        } catch (error) {
            handleControllerError(res, error, '获取推荐博客失败');
        }
    },
    
    // ============================================================
    // 获取博客详情（核心方法）
    // ============================================================
    // 【路由】GET /api/blogs/:id
    // 【作用】获取单篇博客的详细信息
    // 
    // 【路径参数】
    // - id: 博客ID
    // 
    // 【功能】
    // 1. 查询博客详情
    // 2. 隐私权限检查
    // 3. 浏览量统计（防重复）
    // 
    // 【浏览量统计原理】
    // 使用内存Set记录已浏览的用户/会话
    // key = view_${blogId}_${userId或sessionId}
    // 
    // 【面试常问】
    // Q1: 如何防止刷浏览量？
    // A: 使用Set记录已浏览，同一用户/会话只计一次
    // 
    // Q2: 为什么用内存而不是数据库？
    // A: 内存读写快，浏览记录不需要持久化
    // 
    // Q3: 生产环境如何优化？
    // A: 使用Redis替代内存，支持分布式
    // ============================================================
    getBlogDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || req.user?._id;
            
            console.log('📝 获取博客详情 - ID:', id);
            console.log('👤 当前用户:', req.user ? req.user.username : '未登录');
            console.log('👤 用户角色:', req.user ? req.user.role : 'N/A');
            
            // 查询博客详情
            // populate: 填充关联字段
            const blog = await Blog.findById(id)
                .populate('author', 'username _id profile.avatar role privacy')
                // .populate('category', 'name') // 分类功能已删除
                .populate('topic', 'name _id');
            
            // 博客不存在
            if (!blog) {
                console.log('❌ 博客不存在');
                return res.status(404).json({ success: false, message: '博客不存在' });
            }
            
            console.log('✅ 博客找到 - 作者:', blog.author ? blog.author.username : '无作者');
            console.log('🔒 作者隐私设置:', blog.author ? blog.author.privacy : 'N/A');
            
            // 隐私权限检查
            // canViewBlog: 检查用户是否有权查看
            if (!canViewBlog(req.user, blog)) {
                console.log('❌ 权限检查失败 - 无法查看博客');
                return res.status(403).json({ success: false, message: '该博客已设置为私密，无法查看' });
            }
            
            console.log('✅ 权限检查通过');
            
            // ============================================================
            // 浏览量统计（防重复）
            // ============================================================
            // 生成唯一标识：用户ID或会话ID
            const sessionId = req.headers['x-session-id'] || req.ip;
            const viewKey = `view_${blog._id}_${userId || sessionId}`;
            
            // 初始化全局浏览记录（内存存储）
            // 生产环境应使用Redis
            if (!global.viewRecords) {
                global.viewRecords = {
                    set: new Set(),
                    lastCleanup: Date.now()
                };
            }
            
            // 定期清理过期记录（每小时清理一次）
            // 防止内存无限增长
            if (Date.now() - global.viewRecords.lastCleanup > 3600000) {
                global.viewRecords.set.clear();
                global.viewRecords.lastCleanup = Date.now();
            }
            
            // 检查是否已浏览过
            if (!global.viewRecords.set.has(viewKey)) {
                // 增加浏览量
                blog.views += 1;
                await blog.save();
                // 记录已浏览
                global.viewRecords.set.add(viewKey);
                
                // 限制内存使用
                // 当记录数超过100条时清空
                if (global.viewRecords.set.size > 100) {
                    global.viewRecords.set.clear();
                }
            }
            
            res.json({ success: true, data: blog });
        } catch (error) {
            handleControllerError(res, error, '获取博客详情失败');
        }
    },
    
    // ============================================================
    // 获取博客评论列表
    // ============================================================
    // 【路由】GET /api/blogs/:blogId/comments
    // 【作用】获取博客的评论列表，支持分页
    // 
    // 【评论结构】
    // - 顶级评论：直接评论博客
    // - 回复：评论的评论（有parentId）
    // 
    // 【返回格式】
    // {
    //   success: true,
    //   data: [
    //     {
    //       _id, content, author, createdAt,
    //       replies: [回复数组]
    //     }
    //   ],
    //   pagination: { total, page, limit, pages }
    // }
    // 
    // 【面试常问】
    // Q: 如何实现评论回复嵌套？
    // A: 先查顶级评论，再根据parentId查回复，最后组装
    // ============================================================
    getBlogComments: async (req, res) => {
        try {
            const { blogId } = req.params;
            const { page, limit, skip } = parsePaginationParams(req.query, { page: 1, limit: 10 });
            
            // 验证blogId格式
            if (!mongoose.Types.ObjectId.isValid(blogId)) {
                return res.status(400).json({ success: false, message: '无效的博客ID' });
            }
            
            // 转换为ObjectId
            const blogObjectId = new mongoose.Types.ObjectId(blogId);
            
            // 并行查询：顶级评论 + 总数
            const [comments, total] = await Promise.all([
                // 查询顶级评论（parentId为null）
                Comment.find({ blog: blogObjectId, parentId: null, status: 'active' })
                    .populate('author', 'username profile.avatar')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                // 统计总数
                Comment.countDocuments({ blog: blogObjectId, parentId: null, status: 'active' })
            ]);
            
            // 收集顶级评论ID
            const topLevelCommentIds = comments.map(comment => comment._id);
            
            // 查询所有回复
            const allReplies = await Comment.find({ 
                parentId: { $in: topLevelCommentIds }, 
                status: 'active' 
            })
                .populate('author', 'username profile.avatar')
                .sort({ createdAt: 1 });
            
            // 收集被回复用户的ID
            const replyToUserIds = allReplies
                .filter(reply => reply.replyTo)
                .map(reply => reply.replyTo);
            
            // 批量查询被回复用户
            const replyToUsers = {};
            if (replyToUserIds.length > 0) {
                const users = await User.find({ _id: { $in: replyToUserIds } }).select('username');
                users.forEach(user => {
                    replyToUsers[user._id.toString()] = user.username;
                });
            }
            
            // 构建回复映射（按父评论ID分组）
            const repliesByParentId = {};
            allReplies.forEach(reply => {
                const parentId = reply.parentId.toString();
                if (!repliesByParentId[parentId]) {
                    repliesByParentId[parentId] = [];
                }
                
                const replyObj = reply.toObject();
                // 添加被回复用户名
                if (reply.replyTo) {
                    const replyToUserId = reply.replyTo.toString();
                    replyObj.replyToUsername = replyToUsers[replyToUserId];
                }
                
                repliesByParentId[parentId].push(replyObj);
            });
            
            // 组装评论和回复
            const commentsWithReplies = comments.map(comment => {
                const commentObj = comment.toObject();
                const commentId = comment._id.toString();
                commentObj.replies = repliesByParentId[commentId] || [];
                return commentObj;
            });
            
            res.json({ 
                success: true, 
                ...generatePaginationResponse(commentsWithReplies, total, page, limit)
            });
        } catch (error) {
            handleControllerError(res, error, '获取博客评论失败');
        }
    },
    
    // ============================================================
    // 创建评论（核心方法）
    // ============================================================
    // 【路由】POST /api/blogs/:blogId/comments
    // 【作用】创建评论或回复
    // 
    // 【请求体】
    // {
    //   content: "评论内容",
    //   parentId: "父评论ID（回复时）",
    //   replyTo: "被回复用户ID"
    // }
    // 
    // 【功能】
    // 1. 内容验证（过滤敏感词）
    // 2. 创建评论
    // 3. 更新统计数
    // 4. 创建通知（评论/回复/@提及）
    // 5. WebSocket实时推送
    // 
    // 【面试常问】
    // Q1: 如何处理@提及？
    // A: 用正则匹配@用户名，查询用户后创建通知
    // 
    // Q2: 为什么检查通知设置？
    // A: 用户可能关闭了某类通知，需尊重用户选择
    // ============================================================
    createComment: async (req, res) => {
        try {
            const { blogId } = req.params;
            const { content, parentId, replyTo } = req.body;
            const userId = req.user.id;
            
            // 验证评论内容（过滤敏感词）
            const validationResult = filterService.validateComment(content);
            if (!validationResult.valid) {
                return res.status(400).json({ success: false, message: validationResult.message });
            }
            
            // 创建评论对象
            const comment = new Comment({
                content,
                author: userId,
                blog: blogId,
                parentId: parentId || null, // 顶级评论没有parentId
                replyTo: replyTo || null // 回复时记录被回复用户
            });
            
            // 保存评论
            await comment.save();
            
            // 更新博客评论数
            const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { comments: 1 } });
            
            // 更新作者评论统计
            await User.findByIdAndUpdate(blog.author, { $inc: { 'stats.commentsCount': 1 } });
            
            // 填充作者信息
            let populatedComment = await Comment.findById(comment._id)
                .populate('author', 'username profile.avatar');
            
            // 如果是回复，获取被回复用户名
            if (req.body.replyTo) {
                const replyToUser = await User.findById(req.body.replyTo);
                if (replyToUser) {
                    populatedComment = populatedComment.toObject();
                    populatedComment.replyToUsername = replyToUser.username;
                }
            }
            
            // ============================================================
            // 创建通知
            // ============================================================
            if (parentId) {
                // 回复评论：通知被回复的评论作者
                const parentComment = await Comment.findById(parentId);
                if (parentComment && parentComment.author.toString() !== userId.toString()) {
                    // 检查通知设置
                    const parentAuthor = await User.findById(parentComment.author);
                    if (parentAuthor && (!parentAuthor.notifications || parentAuthor.notifications.comment !== false)) {
                        const notification = new Notification({
                            receiver: parentComment.author.toString(),
                            sender: userId,
                            type: 'reply',
                            content: `回复了你的评论: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                            resourceId: parentId,
                            resourceType: 'comment'
                        });
                        await notification.save();
                        // WebSocket实时推送
                        socketService.sendNotification(parentComment.author.toString(), notification);
                    }
                }
            } else {
                // 评论博客：通知博客作者
                const blog = await Blog.findById(blogId);
                if (blog && blog.author.toString() !== userId.toString()) {
                    const blogAuthor = await User.findById(blog.author);
                    if (blogAuthor && (!blogAuthor.notifications || blogAuthor.notifications.comment !== false)) {
                        const notification = new Notification({
                            receiver: blog.author.toString(),
                            sender: userId,
                            type: 'comment',
                            content: `评论了你的博客: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                            resourceId: blogId,
                            resourceType: 'blog'
                        });
                        await notification.save();
                        socketService.sendNotification(blog.author.toString(), notification);
                    }
                }
            }
            
            // ============================================================
            // 处理@提及
            // ============================================================
            // 正则匹配 @用户名
            const mentionedUsers = content.match(/@([\u4e00-\u9fa5a-zA-Z0-9_]+)/g);
            if (mentionedUsers) {
                // 去重
                const uniqueMentions = [...new Set(mentionedUsers)];
                for (const mention of uniqueMentions) {
                    // 提取用户名（去掉@符号）
                    const username = mention.substring(1);
                    // 查找用户
                    const mentionedUser = await User.findOne({ username });
                    if (mentionedUser && mentionedUser._id.toString() !== userId.toString()) {
                        // 检查通知设置
                        if (!mentionedUser.notifications || mentionedUser.notifications.comment !== false) {
                            const notification = new Notification({
                                receiver: mentionedUser._id.toString(),
                                sender: userId,
                                type: 'mention',
                                content: `在评论中@了你: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                                resourceId: blogId,
                                resourceType: 'blog'
                            });
                            await notification.save();
                            socketService.sendNotification(mentionedUser._id.toString(), notification);
                        }
                    }
                }
            }
            
            res.status(201).json({ success: true, data: populatedComment });
        } catch (error) {
            handleControllerError(res, error, '创建评论失败');
        }
    },
    
    // ============================================================
    // 删除评论
    // ============================================================
    // 【路由】DELETE /api/comments/:commentId
    // 【作用】软删除评论（标记为deleted）
    // 
    // 【权限】
    // 1. 评论作者
    // 2. 博客作者
    // 3. 管理员
    // 
    // 【软删除】
    // 不真正删除记录，只修改status字段
    // 优点：可恢复、保留数据完整性
    // ============================================================
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id;
            
            // 查找评论
            const comment = await Comment.findById(commentId);
            
            if (!comment) {
                return res.status(404).json({ success: false, message: '评论不存在' });
            }
            
            // 权限检查
            const blog = await Blog.findById(comment.blog);
            const user = await User.findById(userId);
            
            // 三种角色可以删除：评论作者、博客作者、管理员
            if (comment.author.toString() !== userId.toString() && 
                blog.author.toString() !== userId.toString() && 
                user.role !== 'admin') {
                return res.status(403).json({ success: false, message: '没有权限删除该评论' });
            }
            
            // 软删除：修改状态而非真正删除
            comment.status = 'deleted';
            await comment.save();
            
            // 更新博客评论数
            const updatedBlog = await Blog.findByIdAndUpdate(
                comment.blog, 
                { $inc: { comments: -1 } }, 
                { new: true }
            );
            
            // 确保评论数不为负数
            if (updatedBlog && updatedBlog.comments < 0) {
                updatedBlog.comments = 0;
                await updatedBlog.save();
            }
            
            // 更新作者评论统计
            const updatedUser = await User.findByIdAndUpdate(
                blog.author, 
                { $inc: { 'stats.commentsCount': -1 } }, 
                { new: true }
            );
            
            // 确保统计数不为负数
            if (updatedUser && updatedUser.stats.commentsCount < 0) {
                updatedUser.stats.commentsCount = 0;
                await updatedUser.save();
            }
            
            res.json({ success: true, message: '评论删除成功' });
        } catch (error) {
            handleControllerError(res, error, '删除评论失败');
        }
    },
    
    // ============================================================
    // 点赞博客（核心方法）
    // ============================================================
    // 【路由】POST /api/blogs/:id/like
    // 【作用】为博客点赞
    // 
    // 【防重复机制】
    // 使用Like集合记录点赞关系
    // 点赞前检查是否已存在记录
    // 
    // 【流程】
    // 1. 检查是否已点赞
    // 2. 更新博客点赞数
    // 3. 更新作者获赞统计
    // 4. 创建点赞记录
    // 5. 创建通知（WebSocket推送）
    // 
    // 【面试常问】
    // Q: 如何防止重复点赞？
    // A: 创建Like集合记录用户-博客关系，点赞前检查
    // ============================================================
    likeBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            // 检查是否已点赞
            const existingLike = await Like.findOne({ 
                user: userId, 
                contentId: id, 
                contentType: 'blog' 
            });
            
            if (existingLike) {
                return res.status(400).json({ success: false, message: '已经点赞过该博客' });
            }
            
            // 更新博客点赞数
            const blog = await Blog.findByIdAndUpdate(
                id,
                { $inc: { likes: 1 } },
                { new: true }
            );
            
            if (!blog) {
                return res.status(404).json({ success: false, message: '博客不存在' });
            }
            
            // 更新作者获赞统计
            await User.findByIdAndUpdate(blog.author, { $inc: { 'stats.likesCount': 1 } });
            
            // 创建点赞记录
            const like = new Like({
                user: userId,
                contentId: id,
                contentType: 'blog'
            });
            await like.save();
            
            // 创建点赞通知
            if (blog.author.toString() !== userId.toString()) {
                // 检查通知设置
                const blogAuthor = await User.findById(blog.author);
                if (blogAuthor && (!blogAuthor.notifications || blogAuthor.notifications.like !== false)) {
                    const notification = new Notification({
                        receiver: blog.author.toString(),
                        sender: userId,
                        type: 'like',
                        content: `点赞了你的博客《${blog.title}》`,
                        resourceId: id,
                        resourceType: 'blog'
                    });
                    await notification.save();
                    // WebSocket实时推送
                    socketService.sendNotification(blog.author.toString(), notification);
                }
            }
            
            res.json({ success: true, data: { likes: blog.likes, isLiked: true } });
        } catch (error) {
            handleControllerError(res, error, '点赞博客失败');
        }
    },
    
    // ============================================================
    // 取消点赞博客
    // ============================================================
    // 【路由】DELETE /api/blogs/:id/like
    // 【作用】取消点赞
    // 
    // 【流程】
    // 1. 查找并删除点赞记录
    // 2. 更新博客点赞数
    // 3. 更新作者获赞统计
    // ============================================================
    unlikeBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            // 查找并删除点赞记录
            const like = await Like.findOneAndDelete({ 
                user: userId, 
                contentId: id, 
                contentType: 'blog' 
            });
            
            if (!like) {
                return res.status(404).json({ success: false, message: '未点赞过该博客' });
            }
            
            // 更新博客点赞数
            const blog = await Blog.findByIdAndUpdate(
                id,
                { $inc: { likes: -1 } },
                { new: true }
            );
            
            if (!blog) {
                return res.status(404).json({ success: false, message: '博客不存在' });
            }
            
            // 确保点赞数不为负数
            if (blog.likes < 0) {
                blog.likes = 0;
                await blog.save();
            }
            
            // 更新作者获赞统计
            const user = await User.findByIdAndUpdate(
                blog.author, 
                { $inc: { 'stats.likesCount': -1 } }, 
                { new: true }
            );
            
            // 确保统计数不为负数
            if (user && user.stats.likesCount < 0) {
                user.stats.likesCount = 0;
                await user.save();
            }
            
            res.json({ success: true, data: { likes: blog.likes, isLiked: false } });
        } catch (error) {
            handleControllerError(res, error, '取消点赞博客失败');
        }
    },
    
    // ============================================================
    // 检查点赞状态
    // ============================================================
    // 【路由】GET /api/blogs/:id/like/status
    // 【作用】检查当前用户是否已点赞
    // 
    // 【返回】{ isLiked: true/false }
    // ============================================================
    checkLikeStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            // 查询点赞记录
            const existingLike = await Like.findOne({ 
                user: userId, 
                contentId: id, 
                contentType: 'blog' 
            });
            
            // !! 转换为布尔值
            res.json({ success: true, data: { isLiked: !!existingLike } });
        } catch (error) {
            handleControllerError(res, error, '检查点赞状态失败');
        }
    },
    
    // ============================================================
    // 检查收藏状态
    // ============================================================
    // 【路由】GET /api/blogs/:id/bookmark/status
    // 【作用】检查当前用户是否已收藏
    // ============================================================
    checkBookmarkStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            const existingBookmark = await Bookmark.findOne({ 
                user: userId, 
                blog: id 
            });
            
            res.json({ success: true, data: { isBookmarked: !!existingBookmark } });
        } catch (error) {
            handleControllerError(res, error, '检查收藏状态失败');
        }
    },
    
    // ============================================================
    // 收藏博客（核心方法）
    // ============================================================
    // 【路由】POST /api/blogs/:id/bookmark
    // 【作用】收藏博客
    // 
    // 【流程】
    // 1. 检查博客是否存在
    // 2. 检查是否已收藏
    // 3. 创建收藏记录
    // 4. 更新博客收藏数
    // 5. 更新用户收藏统计
    // 6. 创建通知
    // ============================================================
    bookmarkBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            // 检查博客是否存在
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).json({ success: false, message: '博客不存在' });
            }
            
            // 检查是否已收藏
            const existingBookmark = await Bookmark.findOne({ user: userId, blog: id });
            if (existingBookmark) {
                return res.status(400).json({ success: false, message: '已经收藏过该博客' });
            }
            
            // 创建收藏记录
            const bookmark = new Bookmark({
                user: userId,
                blog: id
            });
            await bookmark.save();
            
            // 更新博客收藏数
            await Blog.findByIdAndUpdate(id, { $inc: { bookmarks: 1 } });
            
            // 更新用户收藏统计
            await User.findByIdAndUpdate(userId, { $inc: { 'stats.bookmarksCount': 1 } });
            
            // 创建收藏通知
            if (blog.author.toString() !== userId.toString()) {
                const blogAuthor = await User.findById(blog.author);
                if (blogAuthor && (!blogAuthor.notifications || blogAuthor.notifications.comment !== false)) {
                    const notification = new Notification({
                        receiver: blog.author.toString(),
                        sender: userId,
                        type: 'collect',
                        content: `收藏了你的博客《${blog.title}》`,
                        resourceId: id,
                        resourceType: 'blog'
                    });
                    await notification.save();
                    socketService.sendNotification(blog.author.toString(), notification);
                }
            }
            
            // 获取更新后的博客信息
            const updatedBlog = await Blog.findById(id);
            
            res.status(201).json({ 
                success: true, 
                data: { bookmarks: updatedBlog.bookmarks, isBookmarked: true }, 
                message: '收藏成功' 
            });
        } catch (error) {
            handleControllerError(res, error, '收藏博客失败');
        }
    },
    
    // ============================================================
    // 取消收藏博客
    // ============================================================
    // 【路由】DELETE /api/blogs/:id/bookmark
    // 【作用】取消收藏
    // ============================================================
    unbookmarkBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id || req.user._id;
            
            // 查找并删除收藏记录
            const bookmark = await Bookmark.findOneAndDelete({ user: userId, blog: id });
            
            if (!bookmark) {
                return res.status(404).json({ success: false, message: '未收藏该博客' });
            }
            
            // 更新博客收藏数
            const blog = await Blog.findByIdAndUpdate(id, { $inc: { bookmarks: -1 } }, { new: true });
            
            // 确保收藏数不为负数
            if (blog && blog.bookmarks < 0) {
                blog.bookmarks = 0;
                await blog.save();
            }
            
            // 更新用户收藏统计
            const user = await User.findByIdAndUpdate(userId, { $inc: { 'stats.bookmarksCount': -1 } }, { new: true });
            
            if (user && user.stats.bookmarksCount < 0) {
                user.stats.bookmarksCount = 0;
                await user.save();
            }
            
            res.json({ 
                success: true, 
                data: { bookmarks: blog.bookmarks, isBookmarked: false }, 
                message: '取消收藏成功' 
            });
        } catch (error) {
            handleControllerError(res, error, '取消收藏失败');
        }
    },
    
    // ============================================================
    // 获取用户收藏列表
    // ============================================================
    // 【路由】GET /api/blogs/bookmarks
    // 【作用】获取当前用户的收藏列表
    // ============================================================
    getUserBookmarks: async (req, res) => {
        try {
            const userId = req.user.id || req.user._id;
            const { page = 1, limit = 6 } = req.query;
            
            const skip = (page - 1) * limit;
            
            // 查询收藏列表
            const bookmarks = await Bookmark.find({ user: userId })
                .populate('blog', 'title image author likes comments createdAt')
                .populate('blog.author', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            // 统计总数
            const total = await Bookmark.countDocuments({ user: userId });
            
            // 提取博客数据
            const bookmarkedBlogs = bookmarks.map(bookmark => bookmark.blog);
            
            res.json({ 
                success: true, 
                data: bookmarkedBlogs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            handleControllerError(res, error, '获取收藏列表失败');
        }
    },

    // ============================================================
    // 获取我的文章列表
    // ============================================================
    // 【路由】GET /api/blogs/my
    // 【作用】获取当前用户的所有文章
    // ============================================================
    getMyBlogs: async (req, res) => {
        try {
            const userId = req.user.id;
            // 获取我的文章时，不限制最大数量，返回所有文章
            const { page, limit, skip } = parsePaginationParams(req.query, { 
                page: 1, 
                limit: 1000,  // 默认获取 1000 条
                maxLimit: 1000  // 最大允许 1000 条
            });
            
            const query = { author: userId };
            
            console.log('🔍 获取我的文章列表 - userId:', userId);
            console.log('📊 查询条件:', query);
            console.log('📄 分页参数 - page:', page, 'limit:', limit, 'skip:', skip);
            
            // 先统计总数
            const total = await Blog.countDocuments(query);
            console.log('📊 数据库中的文章总数:', total);
            
            // 查询所有文章
            const blogs = await Blog.find(query)
                .populate('author', 'username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            console.log('✅ 查询结果 - 返回数量:', blogs.length, '总数量:', total);
            console.log('📝 文章 ID 列表:', blogs.map(b => b._id));
            console.log('📝 文章标题列表:', blogs.map(b => b.title.substring(0, 20)));
            
            res.json({ 
                success: true, 
                ...generatePaginationResponse(blogs, total, page, limit)
            });
        } catch (error) {
            handleControllerError(res, error, '获取我的文章列表失败');
        }
    },

    // 创建新文章
    createBlog: async (req, res) => {
        try {
            const userId = req.user.id;
            // 移除 status，因为草稿功能已删除，所有文章默认都是已发布状态
            const { title, content, shortContent, articleType = 'long', topic, image, mediaFiles, tags, hashtags, location } = req.body;
            
            // 验证必填字段
            if (!title) {
                return res.status(400).json({ success: false, message: '标题不能为空' });
            }
            
            // 验证 title 类型和长度
            if (typeof title !== 'string') {
                return res.status(400).json({ success: false, message: '标题必须是字符串' });
            }
            if (title.length > 200) {
                return res.status(400).json({ success: false, message: '标题不能超过 200 个字符' });
            }
            
            // 验证 articleType
            if (!['long', 'short'].includes(articleType)) {
                return res.status(400).json({ success: false, message: '文章类型必须是 long 或 short' });
            }
            
            // 根据文章类型验证内容
            if (articleType === 'long') {
                if (!content) {
                    return res.status(400).json({ success: false, message: '内容不能为空' });
                }
                if (typeof content !== 'string') {
                    return res.status(400).json({ success: false, message: '内容必须是字符串' });
                }
            }
            
            if (articleType === 'short') {
                if (!shortContent) {
                    return res.status(400).json({ success: false, message: '内容不能为空' });
                }
                if (typeof shortContent !== 'string') {
                    return res.status(400).json({ success: false, message: '内容必须是字符串' });
                }
                if (shortContent.length > 2000) {
                    return res.status(400).json({ success: false, message: '短文章内容不能超过2000个字符' });
                }
            }
            
            // 验证话题是否存在
            let topicId = null;
            if (topic && topic.trim() !== '') {
                if (typeof topic !== 'string') {
                    return res.status(400).json({ success: false, message: '话题必须是字符串' });
                }
                const Topic = require('../models/Topic');
                const topicObj = await Topic.findById(topic);
                if (!topicObj) {
                    return res.status(400).json({ success: false, message: '话题不存在' });
                }
                topicId = topicObj._id;
            }
            
            // 验证tags
            if (tags !== undefined) {
                if (!Array.isArray(tags)) {
                    return res.status(400).json({ success: false, message: '标签必须是数组' });
                }
                if (tags.length > 20) {
                    return res.status(400).json({ success: false, message: '标签数量不能超过20个' });
                }
                // 验证每个标签
                for (const tag of tags) {
                    if (typeof tag !== 'string') {
                        return res.status(400).json({ success: false, message: '每个标签必须是字符串' });
                    }
                    if (tag.length > 50) {
                        return res.status(400).json({ success: false, message: '每个标签不能超过50个字符' });
                    }
                }
            }
            
            // 验证hashtags
            if (hashtags !== undefined) {
                if (!Array.isArray(hashtags)) {
                    return res.status(400).json({ success: false, message: '话题标签必须是数组' });
                }
                if (hashtags.length > 10) {
                    return res.status(400).json({ success: false, message: '话题标签数量不能超过10个' });
                }
            }
            
            // 验证location
            if (location !== undefined) {
                if (typeof location !== 'string') {
                    return res.status(400).json({ success: false, message: '位置必须是字符串' });
                }
                if (location.length > 100) {
                    return res.status(400).json({ success: false, message: '位置不能超过100个字符' });
                }
            }
            
            // 创建新文章（移除 status，默认已发布）
            const newBlog = new Blog({
                title,
                content: articleType === 'long' ? content : '',
                shortContent: articleType === 'short' ? shortContent : '',
                articleType,
                author: userId,
                topic: topicId,
                image: image,
                mediaFiles: articleType === 'short' ? mediaFiles : [],
                tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
                hashtags: Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(' ').filter(tag => tag.trim()) : []),
                location,
                status: 'published'  // 默认已发布状态
            });
            
            // 保存文章到数据库
            await newBlog.save();
            
            // 如果文章关联了话题，更新话题的文章数量
            if (topicId) {
                const Topic = require('../models/Topic');
                await Topic.findByIdAndUpdate(topicId, {
                    $inc: { articlesCount: 1 },
                    updatedAt: Date.now()
                });
            }
            
            // 填充作者信息、话题信息（分类功能已删除）
            const populatedBlog = await Blog.findById(newBlog._id)
                .populate('author', 'username')
                // .populate('category', 'name') // 分类功能已删除
                .populate('topic', 'name');
            
            res.status(201).json({ success: true, data: populatedBlog, message: '文章创建成功' });
        } catch (error) {
            console.error('❌ 创建文章失败 - 详细错误:', error);
            console.error('错误类型:', error.name);
            console.error('错误消息:', error.message);
            console.error('错误堆栈:', error.stack);
            handleControllerError(res, error, '创建文章失败');
        }
    },

    // 更新文章
    updateBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { title, content, shortContent, articleType = 'long', topic, image, mediaFiles, video, tags, hashtags, location, status = 'published' } = req.body;
            
            // 验证必填字段
            if (!title) {
                return res.status(400).json({ success: false, message: '标题不能为空' });
            }
            
            // 根据文章类型验证内容
            if (articleType === 'long' && !content) {
                return res.status(400).json({ success: false, message: '内容不能为空' });
            }
            
            if (articleType === 'short' && !shortContent) {
                return res.status(400).json({ success: false, message: '内容不能为空' });
            }
            
            // 查找文章
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).json({ success: false, message: '文章不存在' });
            }
            
            // 验证权限
            if (blog.author.toString() !== userId.toString()) {
                return res.status(403).json({ success: false, message: '无权限更新此文章' });
            }
            
            // 验证话题是否存在
            let topicId = null;
            if (topic && topic.trim() !== '') {
                const Topic = require('../models/Topic');
                const topicObj = await Topic.findById(topic);
                if (!topicObj) {
                    return res.status(400).json({ success: false, message: '话题不存在' });
                }
                topicId = topicObj._id;
            }
            
            // 检查话题是否变更
            const oldTopicId = blog.topic;
            
            // 更新文章
            blog.title = title;
            blog.content = articleType === 'long' ? content : '';
            blog.shortContent = articleType === 'short' ? shortContent : '';
            blog.articleType = articleType;
            blog.topic = topicId;
            blog.image = image; // 无论文章类型如何，都使用前端传递的 image 字段
            blog.mediaFiles = articleType === 'short' ? mediaFiles : [];
            blog.video = video;
            blog.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []);
            blog.hashtags = Array.isArray(hashtags) ? hashtags : (hashtags ? hashtags.split(' ').filter(tag => tag.trim()) : []);
            blog.location = location;
            blog.status = status;
            blog.updatedAt = new Date();
            
            // 保存更新
            await blog.save();
            
            // 如果话题变更，更新话题的文章数量
            if (oldTopicId && oldTopicId.toString() !== topicId?.toString()) {
                const Topic = require('../models/Topic');
                
                // 减少原话题的文章数量
                await Topic.findByIdAndUpdate(oldTopicId, {
                    $inc: { articlesCount: -1 },
                    updatedAt: Date.now()
                });
                
                // 增加新话题的文章数量
                if (topicId) {
                    await Topic.findByIdAndUpdate(topicId, {
                        $inc: { articlesCount: 1 },
                        updatedAt: Date.now()
                    });
                }
            } else if (!oldTopicId && topicId) {
                // 如果原来没有话题，现在添加了话题，增加新话题的文章数量
                const Topic = require('../models/Topic');
                await Topic.findByIdAndUpdate(topicId, {
                    $inc: { articlesCount: 1 },
                    updatedAt: Date.now()
                });
            } else if (oldTopicId && !topicId) {
                // 如果原来有话题，现在移除了话题，减少原话题的文章数量
                const Topic = require('../models/Topic');
                await Topic.findByIdAndUpdate(oldTopicId, {
                    $inc: { articlesCount: -1 },
                    updatedAt: Date.now()
                });
            }
            
            // 填充作者信息、话题信息（分类功能已删除）
            const populatedBlog = await Blog.findById(blog._id)
                .populate('author', 'username')
                // .populate('category', 'name') // 分类功能已删除
                .populate('topic', 'name');
            
            res.status(200).json({ success: true, data: populatedBlog, message: '文章更新成功' });
        } catch (error) {
            console.error('更新文章失败:', error);
            res.status(500).json({ success: false, message: '更新文章失败' });
        }
    },

    // 删除文章
    deleteBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            // 查找文章
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).json({ success: false, message: '文章不存在' });
            }
            
            // 验证权限
            if (blog.author.toString() !== userId.toString()) {
                return res.status(403).json({ success: false, message: '无权限删除此文章' });
            }
            
            // 保存文章的话题ID，用于后续更新话题的文章数量
            const topicId = blog.topic;
            
            // 删除文章
            await Blog.findByIdAndDelete(id);
            
            // 删除相关评论
            await Comment.deleteMany({ blog: id });
            
            // 删除相关点赞
            await Like.deleteMany({ blog: id });
            
            // 删除相关收藏
            await Bookmark.deleteMany({ blog: id });
            
            // 如果文章关联了话题，更新话题的文章数量
            if (topicId) {
                const Topic = require('../models/Topic');
                await Topic.findByIdAndUpdate(topicId, {
                    $inc: { articlesCount: -1 },
                    updatedAt: Date.now()
                });
            }
            
            res.status(200).json({ success: true, message: '文章删除成功' });
        } catch (error) {
            console.error('删除文章失败:', error);
            res.status(500).json({ success: false, message: '删除文章失败' });
        }
    },
    
    // 搜索文章
    searchBlogs: async (req, res) => {
        try {
            const { query, page = 1, limit = 10, category, articleType, startDate, endDate } = req.query;
            const { filterBlogsByPrivacy } = require('../utils/privacy');
            
            if (!query) {
                return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
            }
            
            // 构建基础筛选条件
            const baseFilter = {
                // 已删除 status: 'published'，使用 filterBlogsByPrivacy 过滤隐私文章
            };
            
            // 分类筛选
            if (category) {
                baseFilter.category = category;
            }
            
            // 文章类型筛选
            if (articleType && ['long', 'short'].includes(articleType)) {
                baseFilter.articleType = articleType;
            }
            
            // 时间范围筛选
            if (startDate || endDate) {
                baseFilter.createdAt = {};
                if (startDate) {
                    baseFilter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    baseFilter.createdAt.$lte = new Date(`${endDate} 23:59:59`);
                }
            }
            
            // 计算跳过的记录数
            const skip = (Number(page) - 1) * Number(limit);
            
            // 尝试使用文本索引搜索
            let blogs, total;
            try {
                const textSearchQuery = {
                    ...baseFilter,
                    $text: { $search: query.trim() }
                };
                
                [blogs, total] = await Promise.all([
                    Blog.find(textSearchQuery)
                        .populate('author', 'username _id profile.avatar')
                        // .populate('category', 'name') // 分类功能已删除
                        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
                        .skip(skip)
                        .limit(Number(limit))
                        .lean(),
                    Blog.countDocuments(textSearchQuery)
                ]);
                
                // 如果文本搜索没有结果，使用正则表达式进行 fallback 搜索
                if (total === 0) {
                    const regexSearchQuery = {
                        ...baseFilter,
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { content: { $regex: query, $options: 'i' } },
                            { shortContent: { $regex: query, $options: 'i' } },
                            { tags: { $regex: query, $options: 'i' } },
                            { hashtags: { $regex: query, $options: 'i' } },
                            { excerpt: { $regex: query, $options: 'i' } }
                        ]
                    };
                    
                    [blogs, total] = await Promise.all([
                        Blog.find(regexSearchQuery)
                            .populate('author', 'username _id profile.avatar')
                            // .populate('category', 'name') // 分类功能已删除
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(Number(limit))
                            .lean(),
                        Blog.countDocuments(regexSearchQuery)
                    ]);
                }
            } catch (textSearchError) {
                // 如果文本搜索失败，使用正则表达式搜索
                console.warn('文本搜索失败，使用正则表达式搜索:', textSearchError.message);
                const regexSearchQuery = {
                    ...baseFilter,
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { content: { $regex: query, $options: 'i' } },
                        { shortContent: { $regex: query, $options: 'i' } },
                        { tags: { $regex: query, $options: 'i' } },
                        { hashtags: { $regex: query, $options: 'i' } },
                        { excerpt: { $regex: query, $options: 'i' } }
                    ]
                };
                
                [blogs, total] = await Promise.all([
                    Blog.find(regexSearchQuery)
                        .populate('author', 'username _id profile.avatar')
                        // .populate('category', 'name') // 分类功能已删除
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(Number(limit))
                        .lean(),
                    Blog.countDocuments(regexSearchQuery)
                ]);
            }
            
            // 过滤隐私文章
            const filteredBlogs = filterBlogsByPrivacy(blogs, req.user);
            
            res.json({
                success: true,
                data: filteredBlogs,
                pagination: {
                    total: filteredBlogs.length, 
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(filteredBlogs.length / Number(limit))
                }
            });
        } catch (error) {
            console.error('搜索文章失败:', error);
            res.status(500).json({ success: false, message: '搜索文章失败' });
        }
    },
    
    // ============================================================
    // 上传文章图片（富文本编辑器用）
    // ============================================================
    // 【路由】POST /api/blogs/upload-image
    // 【作用】上传文章中的图片
    // 
    // 【请求】
    // FormData: image = 文件
    // 
    // 【返回】
    // { url: '图片 URL', alt: '文件名', width: 800, height: 600 }
    // ============================================================
    uploadBlogImage: [
        uploadService.singleUpload('image'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: '请选择要上传的图片' });
                }
                
                const imageUrl = uploadService.generateFileUrl(req, req.file.filename, 'blogs');
                
                res.json({ 
                    success: true, 
                    message: '图片上传成功', 
                    data: { 
                        url: imageUrl,
                        alt: req.file.originalname,
                        width: 800,
                        height: 600
                    } 
                });
            } catch (error) {
                console.error('上传文章图片失败:', error);
                res.status(500).json({ success: false, message: '上传图片失败' });
            }
        }
    ],
    
    // ============================================================
    // 上传文章视频
    // ============================================================
    // 【路由】POST /api/blogs/upload-video
    // 【作用】上传文章中的视频
    // 
    // 【请求】
    // FormData: video = 文件
    // 
    // 【返回】
    // { url: '视频 URL', name: '文件名', size: 大小，duration: 时长 }
    // ============================================================
    uploadBlogVideo: [
        uploadService.singleUpload('video'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: '请选择要上传的视频' });
                }
                
                const videoUrl = uploadService.generateFileUrl(req, req.file.filename, 'videos');
                
                res.json({ 
                    success: true, 
                    message: '视频上传成功', 
                    data: { 
                        url: videoUrl,
                        name: req.file.originalname,
                        size: req.file.size,
                        duration: 0
                    } 
                });
            } catch (error) {
                console.error('上传文章视频失败:', error);
                res.status(500).json({ success: false, message: '上传视频失败' });
            }
        }
    ]
};

// 导出博客控制器
module.exports = BlogController;