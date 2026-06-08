// browseHistoryController.js - 浏览历史控制器
// 处理用户浏览历史记录的管理，包括：
// 1. 添加浏览记录
// 2. 获取浏览历史
// 3. 清空浏览历史
// 4. 删除特定记录


const BrowseHistory = require('../models/BrowseHistory');


const browseHistoryController = {
    
    // 记录用户浏览文章的历史
    // 如果已存在记录则更新时间戳，否则创建新记录
    // POST /history
    // { blogId: '文章ID' }
    // { success: true, message: '浏览记录添加成功', data: history }
    addHistory: async (req, res) => {
        try {
            const { blogId } = req.body;
            const userId = req.user.id;
            
            if (!blogId) {
                return res.status(400).json({ success: false, message: '缺少文章ID' });
            }
            
            // findOneAndUpdate - 查找并更新
            // { upsert: true } - 如果不存在则创建
            // { new: true } - 返回更新后的文档
            const history = await BrowseHistory.findOneAndUpdate(
                { user: userId, blog: blogId },  // 查询条件：用户+文章
                { timestamp: Date.now() },        // 更新内容：时间戳
                { upsert: true, new: true }       // 选项：不存在则创建
            );
            
            res.json({
                success: true,
                message: '浏览记录添加成功',
                data: history
            });
        } catch (error) {
            console.error('添加浏览记录失败:', error);
            res.status(500).json({
                success: false,
                message: '添加浏览记录失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    
    // 分页获取当前用户的浏览历史记录
    // GET /history?page=1&limit=20
    // - page: 页码，默认1
    // - limit: 每页数量，默认20
    //   success: true,
    //   message: '获取浏览记录成功',
    //   data: {
    //     history: [历史记录数组],
    //     pagination: { total, page, limit, totalPages }
    getHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            const skip = (page - 1) * limit;
            
            // populate - 填充关联字段
            // 'blog' - 关联的字段名
            // 'title image' - 只返回这两个字段
            const history = await BrowseHistory.find({ user: userId })
                .populate('blog', 'title image')  // 填充文章信息
                .sort({ timestamp: -1 })           // 按时间倒序
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await BrowseHistory.countDocuments({ user: userId });
            
            res.json({
                success: true,
                message: '获取浏览记录成功',
                data: {
                    history,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('获取浏览记录失败:', error);
            res.status(500).json({
                success: false,
                message: '获取浏览记录失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    
    // 清空当前用户的所有浏览历史记录
    // DELETE /history
    // { success: true, message: '浏览记录清空成功' }
    clearHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // deleteMany - 删除所有匹配的文档
            // 参数：查询条件
            await BrowseHistory.deleteMany({ user: userId });
            
            res.json({
                success: true,
                message: '浏览记录清空成功'
            });
        } catch (error) {
            console.error('清空浏览记录失败:', error);
            res.status(500).json({
                success: false,
                message: '清空浏览记录失败',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// 导出浏览历史控制器
module.exports = browseHistoryController;
