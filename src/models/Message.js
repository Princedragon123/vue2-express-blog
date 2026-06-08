// Message.js - 私信消息模型
// 定义私信消息数据结构，包括：
// 1. 发送者和接收者信息
// 2. 消息内容和类型
// 3. 附件信息（图片、文件）
// 4. 消息状态（已发送、已送达、已读）
// A: 用户B打开聊天时，更新 status 为 'read'，记录 readAt 时间
// A: Message.find({ $or: [{sender: A, receiver: B}, {sender: B, receiver: A}] })
// A: 所有消息都存数据库，用户上线时查询未读消息

// 导入依赖模块
const mongoose = require('mongoose');

// 定义消息 Schema
const messageSchema = new mongoose.Schema({
    // 发送者（引用 User 模型）
    // 存储发送者的用户ID，通过 populate 填充详细信息
    // Message.find().populate('sender', 'username avatar')
    // // 只返回发送者的 username 和 avatar
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '发送者不能为空']
    },
    
    // 接收者（引用 User 模型）
    // sender 和 receiver 都引用 User 模型
    // 形成用户之间的对话关系
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '接收者不能为空']
    },
    
    // 消息内容
    // required: true - 必填
    // trim: true - 去除首尾空格
    // 存储前应进行 XSS 过滤，防止注入攻击
    content: {
        type: String,
        required: [true, '消息内容不能为空'],
        trim: true
    },
    
    // 消息类型
    // - text: 纯文本消息
    // - image: 图片消息
    // - file: 文件消息
    // - text: content 存储文本内容
    // - image: content 存储图片描述，attachment.url 存储图片地址
    // - file: content 存储文件说明，attachment 存储文件信息
    type: {
        type: String,
        enum: {
            values: ['text', 'image', 'file'],
            message: '消息类型只能是 text、image 或 file'
        },
        default: 'text'
    },
    
    // 附件信息（嵌套对象）
    // Q: 为什么用嵌套对象而不是单独字段？
    // A: 附件信息是一个整体，组织在一起更清晰
    attachment: {
        // 文件路径或URL
        url: {
            type: String
        },
        // 原始文件名
        name: {
            type: String
        },
        // 文件大小（字节）
        size: {
            type: Number
        },
        // MIME类型
        contentType: {
            type: String
        }
    },
    
    // 消息状态
    // - sent: 已发送（消息已存入数据库）
    // - delivered: 已送达（消息已推送给接收者）
    // - read: 已读（接收者已查看消息）
    // - sent: 消息创建时
    // - delivered: WebSocket 推送成功时
    // - read: 接收者打开聊天界面时
    status: {
        type: String,
        enum: {
            values: ['sent', 'delivered', 'read'],
            message: '状态只能是 sent、delivered 或 read'
        },
        default: 'sent'
    },
    
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // 阅读时间
    // Q: 为什么需要 readAt？
    // A: 可以显示"已读于 xx:xx"，提供更好的用户体验
    readAt: {
        type: Date
    }
});

// 创建索引（可选，提升查询性能）
// 1. 获取两个用户之间的聊天记录
// 2. 获取用户的未读消息
// 3. 获取最近的会话列表

// 复合索引：发送者 + 接收者 + 时间
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// 索引：接收者 + 状态
messageSchema.index({ receiver: 1, status: 1 });

// 创建消息模型
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// 导出消息模型
// const Message = require('./models/Message');
// // 创建消息
// const msg = new Message({
//   sender: userA_id,
//   receiver: userB_id,
//   content: '你好！'
// });
// await msg.save();
// // 查询聊天记录
// const messages = await Message.find({
//   $or: [
//     { sender: userA_id, receiver: userB_id },
//     { sender: userB_id, receiver: userA_id }
//   ]
// }).sort({ createdAt: 1 }).populate('sender receiver', 'username avatar');
module.exports = Message;
