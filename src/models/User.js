// User.js - 用户模型
// 定义用户数据结构，包括：
// 1. 用户基本信息（用户名、邮箱、密码）
// 2. 用户角色和状态
// 3. 个人资料（头像、简介等）
// 4. 统计信息（文章数、点赞数等）
// 5. 隐私和通知设置
// 6. 密码加密和验证方法
// A: bcrypt 是专门为密码设计的，有盐值，防彩虹表，计算慢更安全
// A: 随机字符串，与密码混合后哈希，防止相同密码哈希值相同
// A: 避免每次保存都重新哈希密码，只有修改密码时才哈希
// A: 生成随机 token，设置过期时间，发送邮件

// 导入依赖模块
// mongoose: MongoDB 对象建模工具
const mongoose = require('mongoose');
// bcryptjs: 密码加密库
// bcryptjs 是纯 JavaScript 实现，不需要编译，跨平台兼容性更好
const bcrypt = require('bcryptjs');

// 定义用户 Schema
// definition: 字段定义对象
// options: 可选配置（如 timestamps, versionKey 等）
const userSchema = new mongoose.Schema({
    // 用户名
    // required: true - 必填
    // unique: true - 唯一（自动创建索引）
    // trim: true - 自动去除首尾空格
    // minlength: 3 - 最小长度3个字符
    // maxlength: 20 - 最大长度20个字符
    // Q: unique: true 能保证数据唯一吗？
    // A: 不能完全保证，需要在应用层也做检查
    username: {
        type: String,
        required: [true, '用户名不能为空'],
        unique: true,
        trim: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [20, '用户名最多20个字符']
    },
    
    // 邮箱
    // lowercase: true - 自动转为小写
    email: {
        type: String,
        required: [true, '邮箱不能为空'],
        unique: true,
        trim: true,
        lowercase: true
    },
    
    // 密码
    // 1. 用户输入明文密码
    // 2. pre('save') 中间件自动哈希
    // 3. 存储哈希值到数据库
    // - 永远不要存储明文密码
    // - 使用 bcrypt 等专门算法
    // - 密码最小长度6位
    password: {
        type: String,
        required: [true, '密码不能为空'],
        minlength: [6, '密码至少6个字符']
    },
    
    // 用户角色
    // - user: 普通用户，只能操作自己的资源
    // - admin: 管理员，可以管理所有用户和内容
    role: {
        type: String,
        enum: {
            values: ['user', 'admin','svip'],
            message: '角色只能是 user 或 admin 或 svip'
        },
        default: 'user'
    },
    
    // 用户状态
    // - active: 正常活跃用户
    // - banned: 被封禁用户
    // 1. 管理员设置 status = 'banned'
    // 2. 填写 banReason 封禁原因
    // 3. 用户登录时检查状态，拒绝登录
    status: {
        type: String,
        enum: {
            values: ['active', 'banned'],
            message: '状态只能是 active 或 banned'
        },
        default: 'active'
    },
    
    // 封禁原因
    banReason: {
        type: String,
        trim: true
    },
    
    // 个人资料（嵌套对象）
    profile: {
        // 头像URL
        avatar: {
            type: String,
            default: 'https://picsum.photos/150/150'
        },
        
        // 个人简介
        bio: {
            type: String,
            trim: true,
            maxlength: [500, '简介最多500个字符']
        },
        
        // 个人主页背景图
        coverImage: {
            type: String,
            default: 'https://picsum.photos/800/200'
        },
        
        // 所在地
        location: {
            type: String,
            trim: true
        },
        
        // 个人网站
        website: {
            type: String,
            trim: true
        },
        
        // 职业
        occupation: {
            type: String,
            trim: true
        }
    },

    // 统计信息
    // - postsCount: 发布文章时 +1
    // - likesCount: 被点赞时 +1
    // - commentsCount: 被评论时 +1
    // - bookmarksCount: 被收藏时 +1
    stats: {
        postsCount: {
            type: Number,
            default: 0
        },
        likesCount: {
            type: Number,
            default: 0
        },
        commentsCount: {
            type: Number,
            default: 0
        },
        bookmarksCount: {
            type: Number,
            default: 0
        }
    },

    // 收藏表情包
    favoriteEmojis: {
        type: Array,
        default: []
    },
    
    // 最后登录时间
    lastLogin: {
        type: Date,
        default: Date.now
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
    },
    
    // 隐私设置
    privacy: {
        publicPosts: {
            type: Boolean,
            default: true
        },
        publicLikes: {
            type: Boolean,
            default: true
        },
        publicBookmarks: {
            type: Boolean,
            default: true
        },
        publicFollowList: {
            type: Boolean,
            default: true
        }
    },
    
    // 通知设置
    // 发送通知前检查用户设置，决定是否推送
    notifications: {
        message: {
            type: Boolean,
            default: true
        },
        follow: {
            type: Boolean,
            default: true
        },
        like: {
            type: Boolean,
            default: true
        },
        comment: {
            type: Boolean,
            default: true
        }
    }
});

// 中间件：密码哈希
// 1. 用户调用 user.save()
// 2. 先执行 pre('save') 中间件
// 3. 中间件完成后再保存到数据库
// Q: 为什么用 function 而不是箭头函数？
// A: 箭头函数没有自己的 this，无法访问文档实例
// Q: isModified 是什么？
// A: Mongoose 方法，检查字段是否被修改
// Q: 为什么检查密码是否修改？
// A: 避免每次保存都重新哈希，提高性能
userSchema.pre('save', async function() {
    // 如果密码未修改，跳过哈希
    if (!this.isModified('password')) {
        return;
    }
    
    try {
        // 步骤1：生成盐（salt）
        const salt = await bcrypt.genSalt(10);
        
        // 步骤2：哈希密码
        // hash = bcrypt.hash(明文密码 + 盐)
        // - 单向：无法从哈希值还原密码
        // - 相同密码每次哈希结果不同（因为有盐）
        this.password = await bcrypt.hash(this.password, salt);
        
    } catch (error) {
        throw error;
    }
});

// 实例方法：密码验证
// bcrypt.compare(明文密码, 哈希密码)
// - 从哈希密码中提取盐
// - 对明文密码使用相同盐哈希
// - 比较两个哈希值
// Q: 为什么不直接比较字符串？
// A: 哈希值每次不同，必须用 bcrypt.compare
// Q: 返回值是什么？
// A: Promise<boolean>，true 表示匹配
userSchema.methods.comparePassword = async function(candidatePassword) {
    // candidatePassword: 用户输入的明文密码
    // this.password: 数据库中存储的哈希密码
    return await bcrypt.compare(candidatePassword, this.password);
};

// 创建用户模型
// modelName: 模型名称（首字母大写）
// schema: Schema 实例
// 1. 创建名为 'users' 的集合（自动转小写复数）
// 2. 绑定 Schema 定义的验证规则
// 3. 添加各种查询方法（find, findOne, save 等）
// Q: 为什么集合名是 users 而不是 User？
// A: Mongoose 自动将模型名转为小写复数形式
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 导出用户模型
// const User = require('./models/User');
// const user = new User({ username, email, password });
// await user.save();
module.exports = User;
