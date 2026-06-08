// messageController.js - 私信控制器
// 处理私信相关的所有HTTP请求，包括：
// 1. 获取联系人列表
// 2. 获取消息历史
// 3. 发送新消息
// 4. 上传消息附件
// 5. 标记消息已读
// 6. 删除消息
// 7. 分享博客
// A: 检查关注关系，只有相互关注或有消息历史才能发消息
// A: 保存到数据库后，调用socketService.sendMessage推送
// A: 消息存入数据库，用户上线后通过getMessageHistory获取
// A: Notification用于通知列表，Message用于聊天记录
// A: 防止骚扰，引导用户相互关注

// 导入依赖模块
// 存储私信内容、发送者、接收者、状态等
const Message = require('../models/Message');

// 用于验证用户存在性和获取用户信息
const User = require('../models/User');

// 用于检查关注关系，控制私信权限
const Follow = require('../models/Follow');

// 用于实时推送消息和通知
const socketService = require('../services/socketService');

// 处理文件上传，生成文件URL
const uploadService = require('../services/uploadService');

// 创建私信通知，显示在通知列表
const Notification = require('../models/Notification');

// 私信控制器对象
// 使用对象字面量方式定义控制器
// 每个方法对应一个路由处理函数
const messageController = {
    
    // 获取联系人列表
    // - page: 页码（默认1）
    // - limit: 每页数量（默认10）
    // 1. 获取相互关注的用户ID
    // 2. 获取有消息往来的用户ID
    // 3. 合并去重得到联系人列表
    // 4. 查询联系人详细信息
    // 5. 添加关注状态
    // 6. 分页返回
    // Q: 为什么用Set存储联系人ID？
    // A: Set自动去重，避免重复显示同一用户
    // Q: 联系人列表的排序规则是什么？
    // A: 可以按最后消息时间排序（当前未实现）
    getContacts: async (req, res) => {
        try {
            // 分页参数
            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;
            
            // 步骤1：找出相互关注的用户ID
            const mutualFollowingIds = [];
            
            // 获取当前用户关注的用户
            // following: 被关注者的ID列表
            const following = await Follow.find({ follower: req.user.id }).select('following');
            const followingIds = following.map(f => f.following.toString());
            
            // 获取关注当前用户的用户
            // follower: 关注者的ID列表
            const followers = await Follow.find({ following: req.user.id }).select('follower');
            const followerIds = followers.map(f => f.follower.toString());
            
            // 找出相互关注的用户（交集）
            // 同时存在于followingIds和followerIds中
            for (const followingId of followingIds) {
                if (followerIds.includes(followingId)) {
                    mutualFollowingIds.push(followingId);
                }
            }
            
            // 步骤2：获取有消息往来的用户ID
            // 查询当前用户参与的所有消息
            // $or: 发送者或接收者是当前用户
            const messages = await Message.find({
                $or: [
                    { sender: req.user.id },
                    { receiver: req.user.id }
                ]
            }).sort({ createdAt: -1 });
            
            // 步骤3：合并去重得到联系人列表
            // 使用Set自动去重
            const contactIds = new Set();
            
            // 添加消息往来的用户
            messages.forEach(msg => {
                // 如果发送者不是自己，添加到联系人
                if (msg.sender.toString() !== req.user.id) {
                    contactIds.add(msg.sender.toString());
                }
                // 如果接收者不是自己，添加到联系人
                if (msg.receiver.toString() !== req.user.id) {
                    contactIds.add(msg.receiver.toString());
                }
            });
            
            // 添加相互关注的用户
            mutualFollowingIds.forEach(id => {
                contactIds.add(id.toString());
            });
            
            // 移除当前用户自己（防止自己出现在联系人列表）
            contactIds.delete(req.user.id.toString());
            
            // 步骤4：查询联系人详细信息
            // $in: 匹配数组中的任意一个ID
            // select('-password'): 排除密码字段
            const contacts = await User.find({
                _id: { $in: Array.from(contactIds) }
            }).select('-password');
            
            // 步骤5：添加关注状态
            // 为每个联系人添加isFollowing字段
            const contactsWithFollowingStatus = contacts.map(contact => {
                const contactObj = contact.toObject();
                // 检查当前用户是否关注了该联系人
                contactObj.isFollowing = followingIds.includes(contactObj._id.toString());
                return contactObj;
            });
            
            // 步骤6：分页返回
            const paginatedContacts = contactsWithFollowingStatus.slice(skip, skip + parseInt(limit));
            
            res.json({ 
                success: true, 
                data: paginatedContacts,
                pagination: {
                    total: contactsWithFollowingStatus.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(contactsWithFollowingStatus.length / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('获取联系人列表失败:', error);
            res.status(500).json({ success: false, message: '获取联系人列表失败' });
        }
    },
    
    // 获取与特定用户的消息历史
    // - userId: 目标用户ID
    // - page: 页码（默认1）
    // - limit: 每页数量（默认20）
    // 1. 验证目标用户存在
    // 2. 查询双方的消息记录
    // 3. 标记对方消息为已读
    // 4. 分页返回
    // Q: 为什么用$or查询？
    // A: 获取双向消息（我发给他的 + 他发给我的）
    // Q: 为什么标记已读？
    // A: 用户查看消息后，自动更新消息状态
    getMessageHistory: async (req, res) => {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const skip = (page - 1) * limit;
            
            // 步骤1：验证目标用户存在
            const targetUser = await User.findById(userId);
            if (!targetUser) {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            
            // 步骤2：查询消息历史
            // $or: 获取双向消息
            // sort({ createdAt: 1 }): 按时间升序排列（旧→新）
            // populate: 填充发送者和接收者信息
            const messages = await Message.find({
                $or: [
                    { sender: req.user.id, receiver: userId },    // 我发给他的
                    { sender: userId, receiver: req.user.id }     // 他发给我的
                ]
            }).sort({ createdAt: 1 })
              .populate('sender', '-password')
              .populate('receiver', '-password');
            
            // 步骤3：分页处理
            // 消息按时间升序，但分页要从最新开始
            // 所以先倒序，取分页数据，再倒回来
            const paginatedMessages = messages.slice().reverse().slice(skip, skip + parseInt(limit)).reverse();
            
            // 步骤4：标记对方消息为已读
            // updateMany: 批量更新
            // 条件：发送者是对方，接收者是我，状态不是已读
            await Message.updateMany({
                sender: userId,
                receiver: req.user.id,
                status: { $ne: 'read' }
            }, {
                status: 'read',
                readAt: Date.now()
            });
            
            res.json({ 
                success: true, 
                data: paginatedMessages,
                pagination: {
                    total: messages.length,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(messages.length / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('获取消息历史失败:', error);
            res.status(500).json({ success: false, message: '获取消息历史失败' });
        }
    },
    
    // 发送新消息（核心方法）
    //   receiver: "接收者ID",
    //   content: "消息内容",
    //   type: "消息类型（text/image/blog）",
    //   attachment: { 附件信息 }
    // 1. 验证必填字段
    // 2. 验证接收者存在
    // 3. 检查私信权限（关注关系）
    // 4. 创建消息记录
    // 5. WebSocket实时推送
    // 6. 创建通知
    // A: 相互关注可自由发消息；单方向关注只能发一条；陌生人不能发
    // A: 确保消息持久化，离线用户也能收到
    // A: sendMessage推送到聊天界面，sendNotification推送到通知列表
    sendMessage: async (req, res) => {
        try {
            const { receiver, content, type = 'text', attachment } = req.body;
            
            // 步骤1：验证必填字段
            if (!receiver || !content) {
                return res.status(400).json({ success: false, message: '请提供接收者和消息内容' });
            }
            
            // 步骤2：验证接收者存在
            const targetUser = await User.findById(receiver);
            if (!targetUser) {
                return res.status(404).json({ success: false, message: '接收者不存在' });
            }
            
            // 步骤3：检查私信权限
            // 检查当前用户是否关注了接收者
            const isFollowing = await Follow.findOne({ 
                follower: req.user.id, 
                following: receiver 
            });
            // 检查接收者是否关注了当前用户
            const isFollowed = await Follow.findOne({ 
                follower: receiver, 
                following: req.user.id 
            });
            
            // 转换为布尔值（!!将truthy/falsy转为true/false）
            const following = !!isFollowing;
            const followed = !!isFollowed;
            
            // 检查是否有消息往来历史
            const hasMessageHistory = await Message.findOne({
                $or: [
                    { sender: req.user.id, receiver: receiver },
                    { sender: receiver, receiver: req.user.id }
                ]
            });
            
            // 权限检查1：既不关注也不被关注，且没有消息历史
            if (!following && !followed && !hasMessageHistory) {
                return res.status(403).json({ 
                    success: false, 
                    message: '请先关注对方才能发送消息' 
                });
            }
            
            // 权限检查2：单方向关注且没有消息历史
            if ((following !== followed) && !hasMessageHistory) {
                // 获取已发送消息数量
                const sentMessageCount = await Message.countDocuments({
                    sender: req.user.id,
                    receiver: receiver
                });
                
                // 单方向关注只能发一条消息
                if (sentMessageCount >= 1) {
                    return res.status(403).json({ 
                        success: false, 
                        message: '只有相互关注的用户才能发送多条消息，当前只能发送一条消息' 
                    });
                }
            }
            
            // 步骤4：创建消息记录
            const message = new Message({
                sender: req.user.id,
                receiver,
                content,
                type,           // text/image/blog
                attachment: attachment || {}
            });
            
            await message.save();
            
            // 填充发送者和接收者信息
            // 用于前端显示头像和用户名
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', '_id username profile.avatar')
                .populate('receiver', '_id username profile.avatar');
            
            // 步骤5：WebSocket实时推送
            // 推送给接收者，立即显示在聊天界面
            socketService.sendMessage(receiver, populatedMessage);
            
            // 步骤6：创建私信通知
            // 检查接收者的通知设置
            const receiverUser = await User.findById(receiver);
            if (receiverUser && (!receiverUser.notifications || receiverUser.notifications.message !== false)) {
                const notification = new Notification({
                    receiver,
                    sender: req.user.id,
                    type: 'message',
                    // 截取前50个字符作为预览
                    content: `发送了一条新消息: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    resourceId: message._id,
                    resourceType: 'message'
                });
                await notification.save();
                // 推送通知
                socketService.sendNotification(receiver, notification);
            }
            
            res.json({ success: true, message: '消息发送成功', data: populatedMessage });
        } catch (error) {
            console.error('发送消息失败:', error);
            res.status(500).json({ success: false, message: '发送消息失败' });
        }
    },
    
    // 上传消息附件
    // - file: 附件文件
    //   url: "文件访问URL",
    //   name: "原始文件名",
    //   size: "文件大小（字节）",
    //   contentType: "MIME类型"
    // Q: 为什么先上传再发送消息？
    // A: 消息需要包含附件URL，必须先上传获取URL
    uploadAttachment: async (req, res) => {
        try {
            // 检查是否有文件上传
            if (!req.file) {
                return res.status(400).json({ success: false, message: '请选择要上传的文件' });
            }
            
            // 生成文件访问URL
            // req.file.filename: multer生成的文件名
            // 'messages': 存储目录
            const fileUrl = uploadService.generateFileUrl(req, req.file.filename, 'messages');
            
            res.json({ 
                success: true, 
                message: '附件上传成功', 
                data: { 
                    url: fileUrl,
                    name: req.file.originalname,
                    size: req.file.size,
                    contentType: req.file.mimetype
                } 
            });
        } catch (error) {
            console.error('上传附件失败:', error);
            res.status(500).json({ success: false, message: '上传附件失败' });
        }
    },
    
    // 标记消息为已读
    //   messageIds: ["消息ID数组"],  // 方式1：指定消息ID
    //   userId: "用户ID"              // 方式2：标记该用户的所有消息
    // Q: 为什么提供两种方式？
    // A: messageIds精确标记，userId批量标记更方便
    markAsRead: async (req, res) => {
        try {
            const { messageIds, userId } = req.body;
            
            // 至少提供一个参数
            if (!messageIds && !userId) {
                return res.status(400).json({ success: false, message: '请提供消息ID或用户ID' });
            }
            
            // 构建查询条件
            const query = {
                receiver: req.user.id,      // 接收者是我
                status: { $ne: 'read' }     // 状态不是已读
            };
            
            if (messageIds) {
                // 方式1：指定消息ID
                query._id = { $in: messageIds };
            } else if (userId) {
                // 方式2：指定发送者
                query.sender = userId;
            }
            
            // 批量更新
            await Message.updateMany(query, {
                status: 'read',
                readAt: Date.now()
            });
            
            res.json({ success: true, message: '消息已标记为已读' });
        } catch (error) {
            console.error('标记消息为已读失败:', error);
            res.status(500).json({ success: false, message: '标记消息失败' });
        }
    },
    
    // 删除消息
    // - 发送者可以删除
    // - 接收者可以删除
    // - 其他人不能删除
    // 这只是删除自己的记录，对方的记录仍然存在
    // 如需双方都删除，需要额外逻辑
    deleteMessage: async (req, res) => {
        try {
            const { id } = req.params;
            
            // 查找消息
            const message = await Message.findById(id);
            
            if (!message) {
                return res.status(404).json({ success: false, message: '消息不存在' });
            }
            
            // 权限检查：发送者或接收者才能删除
            if (message.sender.toString() !== req.user.id && message.receiver.toString() !== req.user.id) {
                return res.status(403).json({ success: false, message: '无权删除该消息' });
            }
            
            // 删除消息
            await Message.findByIdAndDelete(id);
            
            res.json({ success: true, message: '消息删除成功' });
        } catch (error) {
            console.error('删除消息失败:', error);
            res.status(500).json({ success: false, message: '删除消息失败' });
        }
    },
    
    // 分享博客
    //   recipients: ["接收者ID数组"],
    //   blogId: "博客ID",
    //   blogTitle: "博客标题",
    //   blogAuthor: "博客作者"
    // 1. 验证接收者和博客信息
    // 2. 遍历接收者，检查权限
    // 3. 创建分享消息
    // 4. WebSocket推送
    // Q: 为什么用for循环而不是Promise.all？
    // A: 需要逐个检查权限和跳过，顺序处理更清晰
    shareBlog: async (req, res) => {
        try {
            const { recipients, blogId, blogTitle, blogAuthor } = req.body;
            
            // 步骤1：验证必填字段
            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({ success: false, message: '请选择至少一位接收者' });
            }
            
            if (!blogId || !blogTitle) {
                return res.status(400).json({ success: false, message: '请提供博客信息' });
            }
            
            // 验证接收者存在
            const validRecipients = await User.find({ _id: { $in: recipients } });
            if (validRecipients.length === 0) {
                return res.status(404).json({ success: false, message: '没有找到有效的接收者' });
            }
            
            // 步骤2：批量发送分享消息
            const shareMessages = [];
            
            // 遍历每个接收者
            for (const recipient of recipients) {
                // 检查私信权限（与sendMessage相同）
                const isFollowing = await Follow.findOne({ 
                    follower: req.user.id, 
                    following: recipient 
                });
                const isFollowed = await Follow.findOne({ 
                    follower: recipient, 
                    following: req.user.id 
                });
                
                // 跳过无权限的用户
                if (!isFollowing && !isFollowed) {
                    continue;
                }
                
                // 检查单方向关注的消息限制
                const sentMessageCount = await Message.countDocuments({
                    sender: req.user.id,
                    receiver: recipient
                });
                
                if (isFollowing !== isFollowed && sentMessageCount >= 1) {
                    continue;
                }
                
                // 步骤3：创建分享消息
                const message = new Message({
                    sender: req.user.id,
                    receiver: recipient,
                    content: `分享了博客: ${blogTitle}`,
                    type: 'blog',    // 博客分享类型
                    attachment: {
                        blogId,
                        blogTitle,
                        blogAuthor,
                        sharedBy: req.user.id
                    }
                });
                
                await message.save();
                shareMessages.push(message);
                
                // 步骤4：WebSocket推送
                socketService.sendMessage(recipient, message);
            }
            
            // 检查是否有成功发送的消息
            if (shareMessages.length === 0) {
                return res.status(403).json({ success: false, message: '没有符合条件的接收者' });
            }
            
            res.json({ success: true, message: '博客分享成功', data: shareMessages });
        } catch (error) {
            console.error('分享博客失败:', error);
            res.status(500).json({ success: false, message: '分享博客失败' });
        }
    }
};

// 导出私信控制器
module.exports = messageController;
