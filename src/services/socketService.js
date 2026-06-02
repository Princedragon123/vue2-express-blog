// ============================================================
// socketService.js - WebSocket服务（学习版·核心文件）
// ============================================================
// 
// 【文件职责】
// 这是整个WebSocket系统的后端核心，负责：
// 1. 创建WebSocket服务器
// 2. 管理用户连接状态
// 3. 实时推送消息和通知
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Socket.io：WebSocket的封装库，支持自动重连、房间等                   │
// │  2. 连接管理：Map存储userId→socket映射                                  │
// │  3. 房间机制：socket.join(userId)实现定向推送                           │
// │  4. 事件驱动：io.on('connection')、socket.on('login')等                 │
// │  5. 定向推送：io.to(userId).emit('event', data)                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【前后端通信流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   前端 socket.js                    后端 socketService.js              │
// │   ─────────────                     ─────────────────────              │
// │                                                                         │
// │   io() ──────────────────────────→ io.on('connection')                 │
// │   (建立连接)                       (监听连接)                           │
// │                                                                         │
// │   emit('login', userId) ─────────→ socket.on('login')                  │
// │   (发送登录)                       (处理登录)                           │
// │                                                                         │
// │   on('newMessage') ←────────────── io.to(userId).emit('newMessage')    │
// │   (监听消息)                       (推送消息)                           │
// │                                                                         │
// │   on('notification') ←──────────── io.to(userId).emit('notification')  │
// │   (监听通知)                       (推送通知)                           │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: WebSocket和HTTP有什么区别？
// A: HTTP是单向的（客户端发起），WebSocket是双向的（双方都可发起）
// 
// Q2: 为什么用Socket.io而不是原生WebSocket？
// A: Socket.io提供自动重连、房间、广播等高级功能，更易用
// 
// Q3: 如何实现私聊？
// A: 每个用户加入以自己ID命名的房间，io.to(userId).emit()定向推送
// 
// Q4: 如何判断用户是否在线？
// A: connectedUsers Map中是否存在该userId
// 
// Q5: 用户多设备登录怎么处理？
// A: 踢掉旧连接，保证一个用户只有一个socket
// 
// Q6: 为什么用Map而不是Object？
// A: Map的键可以是任意类型，有size属性，遍历更方便
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
// 【socket.io】WebSocket封装库
// 提供自动重连、房间、广播等功能
const socketIo = require('socket.io');

// 【mongoose】MongoDB ODM
// 用于查询数据库，填充用户信息
const mongoose = require('mongoose');

// ============================================================
// WebSocket服务对象
// ============================================================
// 使用对象字面量定义服务
// 包含初始化、发送消息、发送通知三个核心方法
const socketService = {
    
    // ============================================================
    // io实例（WebSocket服务器）
    // ============================================================
    // 【作用】保存io实例，供其他方法使用
    // 【用法】socketService.io.to(userId).emit('event', data)
    // 【注意】在init()方法中赋值
    io: null,
    
    // ============================================================
    // 初始化WebSocket服务（核心方法）
    // ============================================================
    // 【路由】无（服务器启动时调用）
    // 【作用】创建WebSocket服务器，设置事件监听
    // 
    // 【参数说明】
    // server: HTTP服务器实例
    // 
    // 【调用时机】
    // 在 app.js 或 server.js 中：
    // const server = app.listen(3001);
    // socketService.init(server);
    // 
    // 【流程】
    // 1. 创建socket.io实例
    // 2. 配置CORS跨域
    // 3. 创建用户连接映射表
    // 4. 监听connection事件
    // 5. 监听login事件
    // 6. 监听sendMessage事件
    // 7. 监听disconnect事件
    // 
    // 【面试常问】
    // Q: 为什么WebSocket需要依附HTTP服务器？
    // A: WebSocket通过HTTP升级协议建立连接
    // 
    // Q: CORS配置为什么重要？
    // A: 防止跨域攻击，生产环境必须限制来源
    // ============================================================
    init: (server) => {
        // ============================================================
        // 步骤1：创建socket.io实例
        // ============================================================
        // socketIo(server, options)
        // server: HTTP服务器实例
        // options: 配置选项
        const io = socketIo(server, {
            // ========================================================
            // CORS配置（跨域资源共享）
            // ========================================================
            // 【开发环境】origin: '*' 允许所有来源
            // 【生产环境】应该限制具体域名
            cors: {
                // 允许的来源
                // 开发环境：允许所有来源
                origin: '*',
                
                // 生产环境应该改为（取消注释使用）：
                // origin: [
                //     'https://yourdomain.com',           // 正式域名
                //     'https://www.yourdomain.com',       // www子域名
                //     'https://app.yourdomain.com',       // 应用子域名
                //     'http://localhost:8080'             // 本地开发（可选）
                // ],
                
                // 允许的HTTP方法
                methods: ['GET', 'POST'],
                
                // 生产环境还可以添加：
                // credentials: true,    // 允许携带Cookie
                // allowedHeaders: ['Content-Type', 'Authorization']
            }
        });
        
        // ============================================================
        // 步骤2：创建用户连接映射表
        // ============================================================
        // 【数据结构】Map { userId → socket实例 }
        // 【为什么用Map？】
        // 1. 键可以是任意类型（Object的键只能是字符串）
        // 2. 有size属性，方便获取在线人数
        // 3. 遍历更方便
        // 
        // 【作用】
        // 通过userId快速找到对应的socket，实现定向推送
        // 
        // 【示例】
        // connectedUsers.get('user123') → 返回该用户的socket
        // connectedUsers.has('user123') → 判断用户是否在线
        // connectedUsers.delete('user123') → 删除用户连接
        const connectedUsers = new Map();
        
        // ============================================================
        // 步骤3：监听连接事件
        // ============================================================
        // 【触发时机】前端执行 io() 建立连接时
        // 【参数】socket: 每个客户端的独立socket对象
        // 
        // 【面试常问】
        // Q: 每个用户都有一个socket吗？
        // A: 是的，每个连接都有独立的socket.id
        // 
        // Q: 一个用户多个设备登录会怎样？
        // A: 每个设备都有独立的socket，需要在login事件中处理
        // ============================================================
        io.on('connection', (socket) => {
            console.log(`[WebSocket] 新客户端连接，socketId: ${socket.id}`);
            
            // ========================================================
            // 监听用户登录事件
            // ========================================================
            // 【触发时机】前端执行 socket.emit('login', userId)
            // 【参数】userId: 登录用户的ID
            // 【作用】建立 userId → socket 的映射关系
            // 
            // 【面试常问】
            // Q: 为什么需要login事件？
            // A: socket.io不知道连接的是谁，需要前端主动告知
            // 
            // Q: 为什么踢掉旧连接？
            // A: 保证一个用户只有一个socket，避免重复推送
            // ========================================================
            socket.on('login', (userId) => {
                console.log(`[WebSocket] 用户登录: ${userId}`);
                
                // 检查该用户是否已有连接
                // 【场景】用户在另一个设备/浏览器登录
                if (connectedUsers.has(userId)) {
                    const oldSocket = connectedUsers.get(userId);
                    // 如果socket.id不同，说明是新连接
                    if (oldSocket.id !== socket.id) {
                        console.log(`[WebSocket] 踢掉旧连接: ${oldSocket.id}`);
                        // 断开旧连接
                        oldSocket.disconnect(true);
                    }
                }
                
                // ====================================================
                // 核心：存储用户ID和socket的映射关系
                // ====================================================
                // 这是实现私聊的关键！
                // 通过这个映射，我们可以根据userId找到对应的socket
                connectedUsers.set(userId, socket);
                
                // ====================================================
                // 核心：将用户加入以自己ID命名的房间
                // ====================================================
                // 【房间机制】Socket.io 的房间功能
                // 【作用】可以通过 io.to(userId).emit() 给特定用户发消息
                // 
                // 【面试常问】
                // Q: 什么是房间？
                // A: 房间是Socket.io的分组机制，可以向房间内所有用户广播
                // 
                // Q: 为什么每个用户都要加入自己的房间？
                // A: 方便定向推送，io.to(userId).emit() 只发给该用户
                // ====================================================
                socket.join(userId);
                
                // 在socket对象上保存userId
                // 【作用】断开连接时可以知道是谁断开了
                socket.userId = userId;
                
                console.log(`[WebSocket] 当前在线用户数: ${connectedUsers.size}`);
            });
            
            // ========================================================
            // 监听发送消息事件
            // ========================================================
            // 【注意】这个事件在当前项目中可能没被使用
            // 【原因】消息是通过 HTTP API 发送的，然后后端调用 sendMessage 方法推送
            // 【保留原因】如果前端想直接通过WebSocket发消息，可以用这个
            // 
            // 【面试常问】
            // Q: 为什么用HTTP发送消息而不是WebSocket？
            // A: HTTP更可靠，可以保存到数据库，支持重试
            // 
            // Q: 什么时候用WebSocket发消息？
            // A: 对实时性要求极高，且可以容忍少量丢失的场景
            // ========================================================
            socket.on('sendMessage', (message) => {
                console.log(`[WebSocket] 收到消息:`, message);
                
                // 检查接收者是否在线
                if (connectedUsers.has(message.receiver)) {
                    const receiverSocket = connectedUsers.get(message.receiver);
                    // 推送消息给接收者
                    receiverSocket.emit('newMessage', message);
                    console.log(`[WebSocket] 消息已推送给: ${message.receiver}`);
                }
                
                // 发送确认给自己
                socket.emit('messageSent', message);
            });
            
            // ========================================================
            // 监听断开连接事件（基础层 - 职责：用户在线状态管理）
            // ========================================================
            // 【职责范围】
            // - 清理 connectedUsers 映射表（影响私聊、消息推送）
            // - 不处理游戏房间逻辑（由 chessService 负责）
            //
            // 【执行顺序】Socket.IO 保证按注册顺序触发
            // 1. 先执行这里（清理在线状态）
            // 2. 再执行 chessService.handleDisconnect（处理游戏房间）
            //
            // 【面试常问】
            // Q: 如何处理用户异常断开？
            // A: 监听disconnect事件，清理连接映射
            // 
            // Q: 用户断开后消息会丢失吗？
            // A: 不会，消息已保存在数据库，用户上线后可以获取
            // ========================================================
            socket.on('disconnect', () => {
                console.log(`[WebSocket] 用户断开连接: ${socket.userId}`);

                // 从映射表中删除该用户
                // 【重要】不删除会导致：
                // 1. 内存泄漏
                // 2. 无法正确判断用户是否在线
                // 3. 可能向已断开的用户推送消息
                if (socket.userId) {
                    connectedUsers.delete(socket.userId);
                    console.log(`[WebSocket] 用户 ${socket.userId} 已从在线列表移除`);
                }

                console.log(`[WebSocket] 当前在线用户数: ${connectedUsers.size}`);
            });
        });
        
        // ============================================================
        // 步骤4：保存io实例
        // ============================================================
        // 保存到socketService对象上，供其他方法使用
        // 【用法】socketService.io.to(userId).emit('event', data)
        socketService.io = io;
        
        console.log('[WebSocket] 服务初始化完成');
    },
    
    // ============================================================
    // 发送消息给指定用户
    // ============================================================
    // 【作用】向特定用户推送私信
    // 
    // 【参数说明】
    // userId: 接收者的用户ID
    // message: 消息对象（包含发送者、内容、时间等）
    // 
    // 【调用时机】
    // 在 messageController.js 中，消息保存到数据库后调用
    // 
    // 【调用示例】
    // socketService.sendMessage('user123', {
    //     sender: 'user456',
    //     content: '你好！',
    //     createdAt: new Date()
    // });
    // 
    // 【面试常问】
    // Q: 用户离线时调用会怎样？
    // A: io.to(userId).emit() 会静默失败，消息已保存在数据库
    // 
    // Q: 为什么用房间而不是直接emit？
    // A: 房间机制更灵活，支持群聊、广播等场景
    // ============================================================
    sendMessage: (userId, message) => {
        try {
            if (socketService.io) {
                // io.to(userId) 表示发送给特定房间
                // 房间名就是用户ID（在login时加入的）
                // 【核心】这是实现私聊的关键！
                socketService.io.to(userId).emit('newMessage', message);
                console.log(`[WebSocket] 消息已推送给用户: ${userId}`);
            }
        } catch (error) {
            console.error('[WebSocket] 发送消息失败:', error);
        }
    },
    
    // ============================================================
    // 发送系统通知（带sender信息填充）
    // ============================================================
    // 【作用】推送点赞、评论、关注、私信等通知
    // 
    // 【参数说明】
    // userId: 接收通知的用户ID
    // notification: 通知对象
    // 
    // 【为什么要填充sender信息？】
    // notification.sender 可能只是一个 ObjectId（用户ID）
    // 前端需要显示发送者的头像和用户名
    // 所以这里查询数据库，把完整的用户信息填充进去
    // 
    // 【调用示例】
    // socketService.sendNotification('user123', {
    //     sender: 'user456',        // 可能只是ID
    //     type: 'like',
    //     content: '点赞了你的文章'
    // });
    // 
    // 推送时变成：
    // {
    //     sender: {
    //         _id: 'user456',
    //         username: '张三',
    //         avatar: '/uploads/avatars/xxx.jpg'
    //     },
    //     type: 'like',
    //     content: '点赞了你的文章'
    // }
    // 
    // 【面试常问】
    // Q: 为什么不直接推送notification？
    // A: 前端需要显示发送者头像和用户名，需要填充
    // 
    // Q: 为什么用async/await？
    // A: 查询数据库是异步操作
    // 
    // Q: 如何优化性能？
    // A: 可以在前端缓存用户信息，减少数据库查询
    // ============================================================
    sendNotification: async (userId, notification) => {
        try {
            if (socketService.io) {
                // ====================================================
                // 填充发送者信息
                // ====================================================
                // 如果notification.sender是ObjectId，需要填充用户信息
                // 【判断】检查是否是有效的MongoDB ObjectId
                if (notification.sender && mongoose.Types.ObjectId.isValid(notification.sender.toString())) {
                    // 获取User模型
                    const User = mongoose.model('User');
                    
                    // 查询数据库，获取发送者的基本信息
                    // select('_id username profile.avatar') 只查询需要的字段
                    // 【性能优化】只查询需要的字段，减少数据传输
                    const sender = await User.findById(notification.sender)
                        .select('_id username profile.avatar');
                    
                    if (sender) {
                        // 转换为普通对象（如果是Mongoose文档）
                        // toObject() 将Mongoose文档转为普通JS对象
                        notification = notification.toObject ? notification.toObject() : { ...notification };
                        
                        // 填充发送者信息
                        notification.sender = {
                            _id: sender._id,
                            username: sender.username,
                            // 头像可能不存在，提供默认值
                            avatar: sender.profile?.avatar || ''
                        };
                    }
                }
                
                // ====================================================
                // 推送通知给用户
                // ====================================================
                // io.to(userId).emit('notification', notification)
                // 发送给特定房间的用户
                socketService.io.to(userId).emit('notification', notification);
                console.log(`[WebSocket] 通知已推送给用户: ${userId}`);
            }
        } catch (error) {
            console.error('[WebSocket] 发送通知失败:', error);
        }
    }
};

// ============================================================
// 导出WebSocket服务
// ============================================================
// 【用法】
// const socketService = require('./services/socketService');
// socketService.init(server);           // 初始化
// socketService.sendMessage(userId, message);    // 发送消息
// socketService.sendNotification(userId, notification);  // 发送通知
// 
// 【设计模式】单例模式
// 整个应用只有一个socketService实例
// 所有模块共享同一个WebSocket连接

// 导出 io 实例供其他服务复用（如 chessService）
module.exports = socketService;
module.exports.io = socketService.io;
