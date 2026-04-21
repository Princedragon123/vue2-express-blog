// ============================================================
// browseHistoryController.js - 浏览历史控制器
// ============================================================
// 
// 【文件职责】
// 处理用户浏览历史记录的管理，包括：
// 1. 添加浏览记录
// 2. 获取浏览历史
// 3. 清空浏览历史
// 4. 删除特定记录
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. upsert 操作：更新或创建                                              │
// │  2. 分页查询：skip + limit                                              │
// │  3. populate 关联查询                                                   │
// │  4. 批量删除：deleteMany                                                │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【浏览历史功能流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  用户浏览文章                                                           │
// │     │                                                                   │
// │     ├── 前端调用 addHistory API                                        │
// │     │                                                                   │
// │     ├── 后端检查是否已有记录                                           │
// │     │   ├── 有记录 → 更新时间戳（重新浏览）                             │
// │     │   └── 无记录 → 创建新记录                                        │
// │     │                                                                   │
// │     └── 返回成功                                                        │
// │                                                                         │
// │  用户查看历史                                                           │
// │     │                                                                   │
// │     ├── 前端调用 getHistory API                                        │
// │     │                                                                   │
// │     ├── 后端查询用户的历史记录                                         │
// │     │   ├── populate 填充文章信息                                      │
// │     │   └── 按时间倒序排列                                             │
// │     │                                                                   │
// │     └── 返回分页数据                                                    │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【upsert 操作详解】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  findOneAndUpdate(                                                      │
// │    { user: userId, blog: blogId },  // 查询条件                         │
// │    { timestamp: Date.now() },       // 更新内容                         │
// │    { upsert: true, new: true }      // 选项                             │
// │  )                                                                      │
// │                                                                         │
// │  【选项说明】                                                            │
// │  - upsert: true  - 如果找不到则创建新文档                               │
// │  - new: true     - 返回更新后的文档（而非更新前）                       │
// │                                                                         │
// │  【场景示例】                                                            │
// │  用户第一次浏览文章A → 创建新记录                                       │
// │  用户再次浏览文章A → 更新时间戳                                         │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// ============================================================

// ============================================================
// 【模块导入】
// ============================================================

const BrowseHistory = require('../models/BrowseHistory');

// ============================================================
// 【浏览历史控制器】
// ============================================================

const browseHistoryController = {
    
    // ========================================================
    // 【添加浏览记录】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 记录用户浏览文章的历史
    // 如果已存在记录则更新时间戳，否则创建新记录
    // 
    // 【请求】
    // POST /history
    // 
    // 【请求体】
    // { blogId: '文章ID' }
    // 
    // 【返回】
    // { success: true, message: '浏览记录添加成功', data: history }
    // --------------------------------------------------------
    addHistory: async (req, res) => {
        try {
            const { blogId } = req.body;
            const userId = req.user.id;
            
            // 【参数验证】
            if (!blogId) {
                return res.status(400).json({ success: false, message: '缺少文章ID' });
            }
            
            // 【upsert 操作】
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
    
    // ========================================================
    // 【获取用户浏览历史】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 分页获取当前用户的浏览历史记录
    // 
    // 【请求】
    // GET /history?page=1&limit=20
    // 
    // 【查询参数】
    // - page: 页码，默认1
    // - limit: 每页数量，默认20
    // 
    // 【返回】
    // {
    //   success: true,
    //   message: '获取浏览记录成功',
    //   data: {
    //     history: [历史记录数组],
    //     pagination: { total, page, limit, totalPages }
    //   }
    // }
    // --------------------------------------------------------
    getHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20 } = req.query;
            
            // 【分页计算】
            const skip = (page - 1) * limit;
            
            // 【查询历史记录】
            // populate - 填充关联字段
            // 'blog' - 关联的字段名
            // 'title image' - 只返回这两个字段
            const history = await BrowseHistory.find({ user: userId })
                .populate('blog', 'title image')  // 填充文章信息
                .sort({ timestamp: -1 })           // 按时间倒序
                .skip(skip)
                .limit(parseInt(limit));
            
            // 【统计总数】
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
    
    // ========================================================
    // 【清空用户浏览历史】
    // ========================================================
    // --------------------------------------------------------
    // 【功能说明】
    // 清空当前用户的所有浏览历史记录
    // 
    // 【请求】
    // DELETE /history
    // 
    // 【返回】
    // { success: true, message: '浏览记录清空成功' }
    // --------------------------------------------------------
    clearHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // 【批量删除】
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
