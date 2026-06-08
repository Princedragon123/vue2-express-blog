

const mongoose = require('mongoose');


const bookmarkSchema = new mongoose.Schema({
    
    // type: ObjectId - MongoDB 的特殊类型，用于存储文档ID
    // ref: 'User' - 指定关联的模型名称，用于 populate 填充
    // required: true - 必填字段
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
    
    // default: Date.now - 插入文档时自动设置为当前时间
    // 注意：不要写成 Date.now()，否则所有记录都是同一时间
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 确保一个用户只能收藏一篇文章一次
// user: 1 表示升序，blog: 1 表示升序
// unique: true 表示这个组合必须唯一
bookmarkSchema.index({ user: 1, blog: 1 }, { unique: true });

// mongoose.model(模型名称, 模式定义)
// 模型名称首字母大写，MongoDB 会自动转为小写复数形式作为集合名
// 'Bookmark' → 'bookmarks' 集合
const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
