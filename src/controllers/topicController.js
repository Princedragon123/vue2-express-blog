// topicController.js - 话题控制器
// 处理话题相关的业务逻辑，包括：
// 1. 创建话题
// 2. 获取话题列表
// 3. 获取话题详情
// 4. 关注/取消关注话题
// 5. 获取话题下的文章
// 6. 搜索话题


const Topic = require('../models/Topic');
const TopicFollower = require('../models/TopicFollower');
const Blog = require('../models/Blog');


const topicController = {
    
    // 创建新的话题
    // POST /topics
    //   name: '话题名称',
    //   description: '话题描述',
    //   coverImage: '封面图片URL'
    createTopic: async (req, res) => {
        try {
            const { name, description, coverImage } = req.body;

            if (!name || !description) {
                return res.status(400).json({ success: false, message: '话题名称和描述不能为空' });
            }

            const existingTopic = await Topic.findOne({ name });
            if (existingTopic) {
                return res.status(400).json({ success: false, message: '话题已存在' });
            }

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

    // 分页获取话题列表，支持按不同字段排序
    // GET /topics?page=1&limit=10&sort=followersCount
    // - page: 页码
    // - limit: 每页数量
    // - sort: 排序字段（默认按关注人数排序）
    getTopics: async (req, res) => {
        try {
            const { page = 1, limit = 10, sort = 'followersCount' } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            // 动态排序：sortObj[sort] = -1 表示按该字段降序
            const sortObj = {};
            sortObj[sort] = -1;

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

    // 获取话题详情，包括话题下的文章和当前用户是否关注
    // GET /topics/:id
    // - id: 话题ID
    getTopicById: async (req, res) => {
        try {
            const { id } = req.params;

            // lean() - 返回普通JS对象，可以后续添加属性
            const topic = await Topic.findById(id).lean();
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            const articles = await Blog.find({ topic: id, status: 'published' })
                .populate('author', 'username profile')  // 填充作者信息
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

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

    // 用户关注指定话题
    // POST /topics/:id/follow
    // - id: 话题ID
    followTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            const existingFollow = await TopicFollower.findOne({ userId, topicId: id });
            if (existingFollow) {
                return res.status(400).json({ success: false, message: '已经关注了该话题' });
            }

            const follow = new TopicFollower({
                userId,
                topicId: id
            });

            await follow.save();

            topic.followersCount += 1;
            await topic.save();

            res.json({ success: true, message: '关注话题成功' });
        } catch (error) {
            console.error('关注话题失败:', error);
            res.status(500).json({ success: false, message: '关注话题失败' });
        }
    },

    // 用户取消关注指定话题
    // DELETE /topics/:id/follow
    // - id: 话题ID
    unfollowTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            const existingFollow = await TopicFollower.findOne({ userId, topicId: id });
            if (!existingFollow) {
                return res.status(400).json({ success: false, message: '还没有关注该话题' });
            }

            await existingFollow.remove();

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

    // 分页获取指定话题下的文章列表
    // GET /topics/:id/articles?page=1&limit=10
    getTopicArticles: async (req, res) => {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const topic = await Topic.findById(id);
            if (!topic) {
                return res.status(404).json({ success: false, message: '话题不存在' });
            }

            const skip = (Number(page) - 1) * Number(limit);

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

    // 使用全文搜索功能搜索话题
    // GET /topics/search?query=关键词&page=1&limit=10
    // - query: 搜索关键词
    // 使用 MongoDB 的 $text 和 $search 进行全文搜索
    // 需要在 Topic 模型中创建文本索引
    searchTopics: async (req, res) => {
        try {
            const { query, page = 1, limit = 10 } = req.query;

            if (!query) {
                return res.json({ 
                    success: true, 
                    data: [], 
                    pagination: { total: 0, page: 1, limit: 10, pages: 0 } 
                });
            }

            const skip = (Number(page) - 1) * Number(limit);

            // $text - 全文搜索操作符
            // $search - 搜索关键词
            const searchQuery = {
                $text: {
                    $search: query
                }
            };

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

    // 获取当前用户关注的所有话题ID列表
    // GET /topics/following
    // { success: true, data: ['话题ID1', '话题ID2', ...] }
    getUserFollowingTopics: async (req, res) => {
        try {
            const userId = req.user.id;

            const follows = await TopicFollower.find({ userId }).lean();
            
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

module.exports = topicController;
