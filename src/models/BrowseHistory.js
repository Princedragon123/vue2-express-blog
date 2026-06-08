// BrowseHistory.js - 浏览历史模型
// 定义浏览历史（BrowseHistory）的数据结构，记录用户浏览过的文章


const mongoose = require('mongoose');


const browseHistorySchema = new mongoose.Schema({
    
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    
    // 注意：这里用 timestamp 而非 createdAt
    // 因为用户可能多次浏览同一文章，需要更新时间
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// 确保每个用户对每篇文章只有一条浏览记录
// 当用户再次浏览时，更新 timestamp 而非创建新记录
browseHistorySchema.index({ user: 1, blog: 1 }, { unique: true });

// 'BrowseHistory' → 'browsehistories' 集合
const BrowseHistory = mongoose.models.BrowseHistory || mongoose.model('BrowseHistory', browseHistorySchema);

module.exports = BrowseHistory;
