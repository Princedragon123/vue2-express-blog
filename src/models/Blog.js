
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, '标题不能为空'],
        trim: true,
        minlength: [5, '标题至少5个字符'],
        maxlength: [100, '标题最多100个字符']
    },

    content: {
        type: String
    },

    plainTextContent: {
        type: String,
        trim: true
    },


    articleType: {
        type: String,
        enum: {
            values: ['long', 'short'],
            message: '文章类型只能是 long 或 short'
        },
        default: 'long'
    },
    // ✅ 新增：文章状态（公开/私密，无草稿）
    status: {
        type: String,
        enum: ['published', 'private'], // 仅保留这两个！
        default: 'published', // 默认公开
        required: true
    },


    image: {
        type: String,
        required: [true, '封面图不能为空']
    },


    video: {
        type: String
    },


    mediaFiles: [{
        // 媒体文件URL
        url: {
            type: String,
            required: true
        },
        // 媒体类型：图片或视频
        mediaType: {
            type: String,
            enum: {
                values: ['image', 'video'],
                message: '媒体类型只能是 image 或 video'
            },
            default: 'image'
        }
    }],


    shortContent: {
        type: String,
        trim: true,
        maxlength: [2000, '短文章内容最多2000个字符']
    },

    hashtags: [{
        type: String,
        trim: true
    }],

    // 位置信息
    location: {
        type: String,
        trim: true
    },


    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '作者不能为空']
    },

    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic'
    },
    tags: [{
        type: String,
        trim: true
    }],

    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    bookmarks: {
        type: Number,
        default: 0
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },

    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
});


blogSchema.index({
    title: 'text',
    content: 'text',
    shortContent: 'text',
    plainTextContent: 'text',
    tags: 'text',
    hashtags: 'text',
    excerpt: 'text'
});


blogSchema.index({ topic: 1, createdAt: -1, articleType: 1 });

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

module.exports = Blog;
