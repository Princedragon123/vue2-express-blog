# 聊天系统功能实现逻辑

## 1. 系统架构

### 1.1 整体架构
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    前端 (Vue)   │──────▶│   Node.js +     │──────▶│    MongoDB      │
│  - Vue组件      │◀──────│   WebSocket     │◀──────│  - 用户集合     │
│  - WebSocket服务│       │  - 实时通信     │       │  - 消息集合     │
│  - 状态管理     │       │  - API接口      │       │  - 好友关系集合 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### 1.2 核心组件
- **前端**：Vue.js构建用户界面，WebSocketService处理实时通信
- **后端**：Node.js提供API接口，WebSocket处理实时消息
- **数据库**：MongoDB存储用户、消息和好友关系数据

## 2. 核心文件说明

### 2.1 后端核心文件

#### server.js（服务器入口）
```javascript
// 创建HTTP服务器
const server = http.createServer(app);
// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });
// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/chat-app');
// 配置路由
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/friendships', require('./routes/friendships'));
// 配置WebSocket事件处理
require('./socket')(wss);
```

#### socket.js（WebSocket事件处理）
```javascript
// 存储用户ID和WebSocket连接的映射
const clients = new Map();

// 处理新连接
wss.on('connection', (ws) => {
  // 处理消息
  ws.on('message', async (message) => {
    // 解析消息
    const parsedMessage = JSON.parse(message);
    // 根据消息类型处理
    switch (parsedMessage.type) {
      case 'init': // 初始化用户连接
      case 'private_message': // 私聊消息
      case 'send_friend_request': // 好友请求
      case 'respond_friend_request': // 响应好友请求
    }
  });
});
```

### 2.2 前端核心文件

#### App.vue（主应用组件）
```javascript
// 初始化应用
initApp() {
  // 连接WebSocket
  WebSocketService.connect();
  // 监听消息
  WebSocketService.on('message_received', this.handleMessageReceived);
  WebSocketService.on('friend_request_received', this.handleFriendRequestReceived);
  // 加载用户
  this.loadUsers();
}

// 加载用户
async loadUsers() {
  const response = await fetch('http://localhost:3000/api/users');
  const users = await response.json();
  this.users = users;
  // 使用第一个用户
  if (users.length > 0) {
    this.currentUser = users[0];
    // 初始化WebSocket连接
    WebSocketService.send('init', { user_id: users[0]._id });
  }
}
```

#### WebSocketService.js（WebSocket封装）
```javascript
class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = {}; // 存储消息类型和回调函数的映射
  }

  // 连接WebSocket
  connect() {
    this.socket = new WebSocket('ws://localhost:3000');
    this.socket.onopen = () => console.log('WebSocket连接已建立');
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  // 发送消息
  send(type, data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
    }
  }

  // 注册消息处理器
  on(type, callback) {
    if (!this.callbacks[type]) this.callbacks[type] = [];
    this.callbacks[type].push(callback);
  }

  // 处理接收到的消息
  handleMessage(message) {
    if (this.callbacks[message.type]) {
      this.callbacks[message.type].forEach(callback => callback(message.data));
    }
  }
}
```

## 3. 关键功能实现

### 3.1 用户初始化与切换

**功能说明**：用户连接到系统时，需要将用户ID与WebSocket连接关联，以便系统能正确地将消息发送给指定用户。

**实现逻辑**：

1. **前端发送初始化消息**：
```javascript
// 应用初始化或用户切换时
WebSocketService.send('init', { user_id: currentUser._id });
```

2. **后端处理初始化**：
```javascript
case 'init':
  const { user_id } = parsedMessage.data;
  // 将用户ID和WebSocket连接存储到Map中
  clients.set(user_id, ws);
  console.log(`用户 ${user_id} 已连接`);
  break;
```

**引用位置**：
- 前端：App.vue第197行（应用初始化）和第243行（用户切换）
- 后端：socket.js第17-21行

### 3.2 实时聊天功能

**功能说明**：用户之间可以发送和接收实时私聊消息，消息会存储到数据库并实时推送给接收者。

**实现逻辑**：

1. **前端发送消息**：
```javascript
// 发送消息
WebSocketService.send('private_message', {
  from_user: currentUser._id,
  to_user: selectedUser._id,
  content: messageInput,
  timestamp: new Date().toISOString()
});
```

2. **后端处理消息**：
```javascript
case 'private_message':
  // 存储消息到数据库
  const newMessage = new Message({
    from_user, to_user, content, timestamp: timestamp || Date.now()
  });
  await newMessage.save();
  
  // 转发消息给接收者
  if (clients.has(to_user)) {
    const recipientWs = clients.get(to_user);
    recipientWs.send(JSON.stringify({
      type: 'message_received',
      data: newMessage
    }));
  }
  break;
```

3. **前端接收消息**：
```javascript
// 接收消息
WebSocketService.on('message_received', (message) => {
  this.messages.push(message);
});
```

### 3.3 好友功能

**功能说明**：用户可以添加好友、接收和响应好友请求。

**实现逻辑**：

1. **发送好友请求**：
```javascript
// 前端发送请求
WebSocketService.send('send_friend_request', {
  from_user: currentUser._id,
  to_user: selectedUser._id
});

// 后端处理请求
case 'send_friend_request':
  // 检查是否已存在关系
  const existingRequest = await Friendship.findOne({
    $or: [
      { from_user: req_from_user, to_user: req_to_user },
      { from_user: req_to_user, to_user: req_from_user }
    ]
  });
  // 创建新请求
  const newRequest = new Friendship({
    from_user: req_from_user,
    to_user: req_to_user,
    status: 'pending'
  });
  await newRequest.save();
  // 通知接收者
  if (clients.has(req_to_user)) {
    const recipientWs = clients.get(req_to_user);
    recipientWs.send(JSON.stringify({
      type: 'friend_request_received',
      data: { ... }
    }));
  }
  break;
```

2. **响应好友请求**：
```javascript
// 前端响应请求
WebSocketService.send('respond_friend_request', {
  request_id: request_id,
  status: 'accepted'
});

// 后端处理响应
case 'respond_friend_request':
  // 更新请求状态
  const updatedRequest = await Friendship.findByIdAndUpdate(
    request_id, { status, updated_at: Date.now() }, { new: true }
  );
  // 通知发送者
  if (clients.has(updatedRequest.from_user.toString())) {
    const senderWs = clients.get(updatedRequest.from_user.toString());
    senderWs.send(JSON.stringify({
      type: 'friend_request_responded',
      data: { ... }
    }));
  }
  break;
```

## 4. 数据库设计

### 4.1 用户集合 (users)
```javascript
{
  "_id": ObjectId,
  "username": String,
  "avatar": String
}
```

### 4.2 消息集合 (messages)
```javascript
{
  "_id": ObjectId,
  "from_user": ObjectId,  // 发送者ID
  "to_user": ObjectId,    // 接收者ID
  "content": String,      // 消息内容
  "timestamp": Date,      // 发送时间
  "read_status": Boolean  // 已读状态
}
```

### 4.3 好友关系集合 (friendships)
```javascript
{
  "_id": ObjectId,
  "from_user": ObjectId,  // 请求发送者ID
  "to_user": ObjectId,    // 请求接收者ID
  "status": String,       // 状态: pending/accepted/rejected
  "created_at": Date,     // 创建时间
  "updated_at": Date      // 更新时间
}
```

## 5. WebSocket通信协议

### 5.1 消息格式
```json
{
  "type": "消息类型",
  "data": { /* 消息数据 */ }
}
```

### 5.2 主要消息类型

| 消息类型 | 方向 | 功能描述 |
|---------|------|---------|
| init | 前端→后端 | 用户初始化连接 |
| private_message | 前端→后端 | 发送私聊消息 |
| message_received | 后端→前端 | 接收私聊消息 |
| send_friend_request | 前端→后端 | 发送好友请求 |
| friend_request_received | 后端→前端 | 接收好友请求 |
| respond_friend_request | 前端→后端 | 响应好友请求 |
| friend_request_responded | 后端→前端 | 好友请求响应通知 |

## 6. 运行流程

### 6.1 系统启动
1. 启动MongoDB服务
2. 运行后端：`npm start`
3. 运行数据种子：`npm run seed`
4. 运行前端：`npm run dev`
5. 访问应用：http://localhost:8080

### 6.2 用户使用流程
1. 用户打开应用，系统自动连接到WebSocket并使用第一个用户
2. 用户可以切换用户（点击"切换用户"按钮）
3. 用户可以选择聊天对象，发送和接收实时消息
4. 用户可以管理好友（添加好友、响应好友请求）

## 7. 扩展功能

### 7.1 消息已读状态
- 实现消息已读状态标记
- 发送已读通知给发送者

### 7.2 文件传输
- 支持发送图片和文件
- 实现文件上传和下载功能

### 7.3 用户认证
- 实现用户注册和登录功能
- 添加用户认证和授权机制

### 7.4 群聊功能
- 支持创建和加入群聊
- 实现群消息发送和接收

## 8. 技术特点

1. **实时通信**：使用WebSocket实现用户之间的实时消息传递
2. **前后端分离**：前端和后端独立开发，通过API和WebSocket通信
3. **数据持久化**：所有消息和好友关系都存储在MongoDB中
4. **响应式设计**：使用Vue.js构建响应式用户界面
5. **模块化设计**：代码结构清晰，便于维护和扩展

## 9. 开发工具

### 9.1 前端开发
- **Vue DevTools**：浏览器扩展，用于调试Vue组件
- **Storybook**：组件开发和测试工具

### 9.2 后端开发
- **Postman**：API测试工具
- **MongoDB Compass**：MongoDB可视化管理工具

---

**文档版本**：1.0
**更新日期**：2026-01-19
