// ============================================================
// topicController.js - 话题控制器
// ============================================================
// 
// 【文件职责】
// 处理话题相关的业务逻辑，包括：
// 1. 创建话题
// 2. 获取话题列表
// 3. 获取话题详情
// 4. 关注/取消关注话题
// 5. 获取话题下的文章
// 6. 搜索话题
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 话题系统设计                                                        │
// │  2. 关注关系管理                                                        │
// │  3. 全文搜索：$text + $search                                           │
// │  4. 关联查询：populate                                                  │
// │  5. 计数器更新                                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【话题系统数据模型】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【Topic 话题模型】                                                      │
// │  ├── name: 话题名称                                                     │
// │  ├── description: 话题描述                                              │
// │  ├── coverImage: 封面图片                                               │
// │  └── followersCount: 关注人数                                           │
// │                                                                         │
// │  【TopicFollower 话题关注模型】                                          │
// │  ├── userId: 关注者ID                                                   │
// │  └── topicId: 话题ID                                                    │
// │                                                                         │
// │  【Blog 文章模型】                                                       │
// │  └── topic: 关联的话题ID                                                │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【话题关注流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  用户点击关注话题                                                       │
// │     │                                                                   │
// │     ├── 1. 检查话题是否存在                                            │
// │     │   └── Topic.findById(id)                                         │
// │     │                                                                   │
// │     ├── 2. 检查是否已关注                                              │
// │     │   └── TopicFollower.findOne({ userId, topicId })                 │
// │     │                                                                   │
// │     ├── 3. 创建关注记录                                                │
// │     │   └── TopicFollower.create({ userId, topicId })                  │
// │     │                                                                   │
// │     ├── 4. 更新话题关注数                                              │
// │     │   └── topic.followersCount += 1                                  │
// │     │                                                                   │
// │     └── 5. 返回成功                                                    │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【MongoDB 全文搜索】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  【前提条件】                                                            │
// │  在模型中定义文本索引：                                                  │
// │  TopicSchema.index({ name: 'text', description: 'text' })              │
// │                                                                         │
// │  【搜索语法】                                                            │
// │  Topic.find({                                                           │
// │    $text: {                                                             │
// │      $search: '搜索关键词'                                              │
// │    }                                                                    │
// │  })                                                                     │
// │  .sort({ score: { $meta: 'textScore' } })  // 按相关度排序              │
// │                                                                         │
// │  【原理】                                                                │
// │  MongoDB 会为建立了 text 索引的字段创建全文索引                         │
// │  搜索时会计算相关度分数（textScore）                                    │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================

// ============================================================
// 【模块导入】
// ============================================================

const Topic = require('../models/Topic');
const TopicFollower = require('../models/TopicFollower');
const Blog = require('../models/Blog');

// ============================================================
// 【话题控制器】
// ============================================================

const topicController = {
    
    // ========================================================
    // 【创建话题】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 创建新的话题
    // 
    // 【请求】
    // POST /topics
    // 
    // 【请求体】
    // {
    //   name: '话题名称',
    //   description: '话题描述',
    //   coverImage: '封面图片URL'
    // }
    // --------------------------------------------------------
    createTopic: async (req, res) => {
        try {
            const { name, description, coverImage } = req.body;

            // 【参数验证】
            if (!name || !description) {
                return res.status(400).json({ success: false, message: '话题名称和描述不能为空' });
            }

            // 【检查话题是否已存在】
            const existingTopic = await Topic.findOne({ name });
            if (existingTopic) {
                return res.status(400).json({ success: false, message: '话题已存在' });
            }

            // 【创建话题】
            const topic = new Topic({
                name,
                description,
                coverImage
            });

            await topic.save();

            res.json({ success: true, data: topic });
        } catch (error) {
            console.error('创建话题失败:', error);
            res.status(500).json({ success: false, message: '创建话题失败' });
        }
    },

    // ========================================================
    // 【获取话题列表】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 分页获取话题列表，支持按不同字段排序
    // 
    // 【请求】
    // GET /topics?page=1&limit=10&sort=followersCount
    // 
    // 【查询参数】
    // - page: 页码
    // - limit: 每页数量
    // - sort: 排序字段（默认按关注人数排序）
    // --------------------------------------------------------
    getTopics: async (req, res) => {
        try {
            const { page = 1, limit = 10, sort = 'followersCount' } = req.query;

            // 【分页计算】
            const skip = (Number(page) - 1) * Number(limit);

            // 【构建排序对象】
            // 动态排序：sortObj[sort] = -1 表示按该字段降序
            const sortObj = {};
            sortObj[sort] = -1;

            // 【并行查询】
            // Promise.all - 同时执行多个异步操作
            // 比分别 await 更高效
            const [topics, total] = await Promise.all([
                Topic.find()
                    .sort(sortObj)
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),  // lean() - 返回普通JS对象，更快
                Topic.countDocuments()
            ]);

            res.json({
                success: true,
                data: topics,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('获取话题列表失败:', error);
            res.status(500).json({ success: false, message: '获取话题列表失败' });
        }
    },

    // ========================================================
    // 【获取话题详情】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 获取话题详情，包括话题下的文章和当前用户是否关注
    // 
    // 【请求】
    // GET /topics/:id
    // 
    // 【路由参数】
    // - id: 话题ID
    // --------------------------------------------------------
    getTopicById: async (req, res) => {
        try {
            const { id } = req.params;

            // 【获取话题详情】
            // lean() - 返回普通JS对象，可以后续添加属性
            const topic = await Topic.findById(id).lean();
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            // 【获取话题下的文章】
            const articles = await Blog.find({ topic: id, status: 'published' })
                .populate('author', 'username profile')  // 填充作者信息
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            // 【检查当前用户是否关注了该话题】
            let isFollowing = false;
            if (req.user) {
                const follow = await TopicFollower.findOne({ 
                    userId: req.user.id, 
                    topicId: id 
                });
                // !! - 转换为布尔值
                isFollowing = !!follow;
            }

            res.json({
                success: true,
                data: {
                    ...topic,       // 展开话题属性
                    articles,       // 添加文章列表
                    isFollowing     // 添加关注状态
                }
            });
        } catch (error) {
            console.error('获取话题详情失败:', error);
            res.status(500).json({ success: false, message: '获取话题详情失败' });
        }
    },

    // ========================================================
    // 【关注话题】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 用户关注指定话题
    // 
    // 【请求】
    // POST /topics/:id/follow
    // 
    // 【路由参数】
    // - id: 话题ID
    // --------------------------------------------------------
    followTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // 【检查话题是否存在】
            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            // 【检查是否已经关注】
            const existingFollow = await TopicFollower.findOne({ userId, topicId: id });
            if (existingFollow) {
                return res.status(400).json({ success: false, message: '已经关注了该话题' });
            }

            // 【创建关注记录】
            const follow = new TopicFollower({
                userId,
                topicId: id
            });

            await follow.save();

            // 【更新话题关注人数】
            topic.followersCount += 1;
            await topic.save();

            res.json({ success: true, message: '关注话题成功' });
        } catch (error) {
            console.error('关注话题失败:', error);
            res.status(500).json({ success: false, message: '关注话题失败' });
        }
    },

    // ========================================================
    // 【取消关注话题】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 用户取消关注指定话题
    // 
    // 【请求】
    // DELETE /topics/:id/follow
    // 
    // 【路由参数】
    // - id: 话题ID
    // --------------------------------------------------------
    unfollowTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // 【检查话题是否存在】
            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            // 【检查是否已经关注】
            const existingFollow = await TopicFollower.findOne({ userId, topicId: id });
            if (!existingFollow) {
                return res.status(400).json({ success: false, message: '还没有关注该话题' });
            }

            // 【删除关注记录】
            await existingFollow.remove();

            // 【更新话题关注人数】
            if (topic.followersCount > 0) {
                topic.followersCount -= 1;
                await topic.save();
            }

            res.json({ success: true, message: '取消关注话题成功' });
        } catch (error) {
            console.error('取消关注话题失败:', error);
            res.status(500).json({ success: false, message: '取消关注话题失败' });
        }
    },

    // ========================================================
    // 【获取话题下的文章】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 分页获取指定话题下的文章列表
    // 
    // 【请求】
    // GET /topics/:id/articles?page=1&limit=10
    // --------------------------------------------------------
    getTopicArticles: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // 【检查话题是否存在】
            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            // 【分页计算】
            const skip = (Number(page) - 1) * Number(limit);

            // 【并行查询】
            const [articles, total] = await Promise.all([
                Blog.find({ topic: id, status: 'published' })
                    .populate('author', 'username profile')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Blog.countDocuments({ topic: id, status: 'published' })
            ]);

            res.json({
                success: true,
                data: articles,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('获取话题文章失败:', error);
            res.status(500).json({ success: false, message: '获取话题文章失败' });
        }
    },

    // ========================================================
    // 【搜索话题】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 使用全文搜索功能搜索话题
    // 
    // 【请求】
    // GET /topics/search?query=关键词&page=1&limit=10
    // 
    // 【查询参数】
    // - query: 搜索关键词
    // 
    // 【技术要点】
    // 使用 MongoDB 的 $text 和 $search 进行全文搜索
    // 需要在 Topic 模型中创建文本索引
    // --------------------------------------------------------
    searchTopics: async (req, res) => {
        try {
            const { query, page = 1, limit = 10 } = req.query;

            // 【空搜索处理】
            if (!query) {
                return res.json({ 
                    success: true, 
                    data: [], 
                    pagination: { total: 0, page: 1, limit: 10, pages: 0 } 
                });
            }

            // 【分页计算】
            const skip = (Number(page) - 1) * Number(limit);

            // 【构建搜索条件】
            // $text - 全文搜索操作符
            // $search - 搜索关键词
            const searchQuery = {
                $text: {
                    $search: query
                }
            };

            // 【执行搜索】
            const [topics, total] = await Promise.all([
                Topic.find(searchQuery)
                    // $meta: 'textScore' - 获取相关度分数
                    // 按相关度降序排列
                    .sort({ score: { $meta: 'textScore' } })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Topic.countDocuments(searchQuery)
            ]);

            res.json({
                success: true,
                data: topics,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            console.error('搜索话题失败:', error);
            res.status(500).json({ success: false, message: '搜索话题失败' });
        }
    },

    // ========================================================
    // 【获取用户关注的话题】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 获取当前用户关注的所有话题ID列表
    // 
    // 【请求】
    // GET /topics/following
    // 
    // 【返回】
    // { success: true, data: ['话题ID1', '话题ID2', ...] }
    // --------------------------------------------------------
    getUserFollowingTopics: async (req, res) => {
        try {
            const userId = req.user.id;

            // 【查询关注记录】
            const follows = await TopicFollower.find({ userId }).lean();
            
            // 【提取话题ID列表】
            // map - 遍历数组，提取每个元素的 topicId 属性
            const topicIds = follows.map(follow => follow.topicId);

            res.json({
                success: true,
                data: topicIds
            });
        } catch (error) {
            console.error('获取用户关注话题失败:', error);
            res.status(500).json({ success: false, message: '获取用户关注话题失败' });
        }
    }
};

// ============================================================
// 【模块导出】
// ============================================================
module.exports = topicController;
