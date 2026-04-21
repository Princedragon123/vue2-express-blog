# 📡 **WebSocket 私信功能完整教学**

---

## 🎯 **教学目标**

学习如何实现 **a 用户发送消息到 b 用户** 的完整流程，包括：
- 后端 WebSocket 服务设置
- 前端 WebSocket 连接
- 用户登录到 WebSocket
- 发送和接收消息

---

## 📋 **准备工作**

### **1. 安装依赖**

```bash
# 安装后端依赖
npm install socket.io

# 安装前端依赖
npm install socket.io-client
```

---

## 🏗️ **后端实现**

### **步骤1：创建 WebSocket 服务**

**文件：`src/services/socketService.js`**

```javascript
// 导入 socket.io（后端 WebSocket 库）
const socketIo = require('socket.io');

// WebSocket 服务对象
const socketService = {
    // 初始化 WebSocket 服务
    // 参数：server - HTTP 服务器实例
    init: (server) => {
        // 创建 socket.io 实例
        // 参数1：server - HTTP 服务器实例
        // 参数2：配置对象
        const io = socketIo(server, {
            cors: {
                origin: '*', // 生产环境中应该设置为具体的域名，比如 'http://localhost:8081'
                methods: ['GET', 'POST'] // 允许的 HTTP 方法
            }
        });
        
        // 存储用户连接信息（用户ID -> socket 实例）
        // Map 结构：键是用户ID，值是 socket 实例
        const connectedUsers = new Map();
        
        // 监听连接事件
        // 当有新的客户端连接时触发
        io.on('connection', (socket) => {
            // socket.id 是每个连接的唯一标识
            console.log('用户连接:', socket.id);
            
            // 监听用户登录事件
            // 当客户端发送 'login' 事件时触发
            socket.on('login', (userId) => {
                console.log('用户登录:', userId);
                // 存储用户ID和socket的映射关系
                // 这样我们就知道哪个用户对应的是哪个 socket 连接
                connectedUsers.set(userId, socket);
                // 将用户加入以自己ID命名的房间
                // 房间是 socket.io 的一个功能，可以用来向特定用户发送消息
                socket.join(userId);
                // 打印当前在线用户列表
                console.log('当前在线用户:', Array.from(connectedUsers.keys()));
            });
            
            // 监听发送消息事件
            // 当客户端发送 'sendMessage' 事件时触发
            socket.on('sendMessage', (message) => {
                console.log('收到消息:', message);
                
                // 检查接收者是否在线
                // message.receiver 是接收者的用户ID
                if (connectedUsers.has(message.receiver)) {
                    // 获取接收者的 socket 实例
                    const receiverSocket = connectedUsers.get(message.receiver);
                    // 向接收者发送 'newMessage' 事件
                    receiverSocket.emit('newMessage', message);
                    console.log('消息已发送给接收者:', message.receiver);
                } else {
                    // 接收者不在线
                    console.log('接收者不在线:', message.receiver);
                }
                
                // 发送给自己（确认消息发送成功）
                // 这样发送者也能看到自己发送的消息
                socket.emit('messageSent', message);
                console.log('消息已确认发送给发送者');
            });
            
            // 监听用户断开连接事件
            // 当客户端断开连接时触发
            socket.on('disconnect', () => {
                console.log('用户断开连接:', socket.id);
                
                // 从 connectedUsers 中移除该 socket
                // 遍历 Map，找到对应的用户ID
                for (const [userId, userSocket] of connectedUsers.entries()) {
                    if (userSocket.id === socket.id) {
                        // 从 Map 中删除
                        connectedUsers.delete(userId);
                        console.log('用户离线:', userId);
                        console.log('当前在线用户:', Array.from(connectedUsers.keys()));
                        break;
                    }
                }
            });
        });
        
        // 保存 io 实例，以便在其他地方使用
        socketService.io = io;
        
        console.log('WebSocket 服务初始化成功');
    },
    
    // 发送消息给指定用户
    // 参数1：userId - 接收者的用户ID
    // 参数2：message - 消息内容
    sendMessage: (userId, message) => {
        if (socketService.io) {
            // 使用 to() 方法向指定房间发送消息
            // 这里的房间名就是用户ID
            socketService.io.to(userId).emit('newMessage', message);
        }
    }
};

// 导出 WebSocket 服务
module.exports = socketService;
```

---

### **步骤2：启动 WebSocket 服务**

**文件：`src/server.js`**

```javascript
// 导入 WebSocket 服务
const socketService = require('./services/socketService');

// 创建 http 服务器
// app 是 Express 应用实例
const server = http.createServer(app);

// 初始化 WebSocket 服务
// 将 HTTP 服务器实例传递给 socketService
// 这样 WebSocket 服务就可以使用同一个端口
 socketService.init(server);

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
    console.log(`WebSocket 服务已启动，使用端口 ${PORT}`);
});
```

---

## 🎨 **前端实现**

### **步骤1：创建 Socket 服务封装**

**文件：`src/vue/utils/socket.js`**

```javascript
// 导入 socket.io-client（前端 WebSocket 库）
import io from 'socket.io-client';

// 创建 Socket 服务类
class SocketService {
  constructor() {
    // socket 实例，初始为 null
    this.socket = null;
    // 连接状态，初始为 false
    this.isConnected = false;
  }
  
  /**
   * 连接 WebSocket 服务器
   * @param {string} url - WebSocket 服务器地址，默认是 'http://localhost:3001'
   * @returns {Promise} - 连接成功的 Promise
   */
  connect(url = 'http://localhost:3001') {
    return new Promise((resolve, reject) => {
      try {
        // 创建 socket 连接
        // 参数1：url - WebSocket 服务器地址
        // 参数2：配置对象
        this.socket = io(url, {
          reconnection: true, // 自动重连
          reconnectionAttempts: 5, // 重连尝试次数
          reconnectionDelay: 1000, // 重连延迟（毫秒）
          timeout: 20000 // 连接超时（毫秒）
        });
        
        // 连接成功事件
        this.socket.on('connect', () => {
          console.log('WebSocket 连接成功');
          this.isConnected = true;
          // 连接成功，resolve Promise
          resolve();
        });
        
        // 连接错误事件
        this.socket.on('connect_error', (error) => {
          console.error('WebSocket 连接错误:', error);
          this.isConnected = false;
          // 连接失败，reject Promise
          reject(error);
        });
        
        // 断开连接事件
        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket 断开连接:', reason);
          this.isConnected = false;
        });
        
      } catch (error) {
        console.error('WebSocket 连接初始化失败:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 发送消息
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    // 检查 socket 是否存在且已连接
    if (this.socket && this.isConnected) {
      // 发送事件
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket 未连接，无法发送事件');
    }
  }
  
  /**
   * 监听消息
   * @param {string} event - 事件名称
   * @param {Function} callback - 事件回调函数
   */
  on(event, callback) {
    // 检查 socket 是否存在
    if (this.socket) {
      // 监听事件
      this.socket.on(event, callback);
    } else {
      console.warn('WebSocket 未连接，无法监听事件');
    }
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      // 断开连接
      this.socket.disconnect();
      // 重置状态
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  /**
   * 检查连接状态
   * @returns {boolean} - 连接状态
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// 导出单例实例
// 单例模式，确保整个应用只有一个 SocketService 实例
export default new SocketService();
```

---

### **步骤2：在应用中使用 Socket 服务**

**文件：`src/vue/main.js`**

```javascript
// 导入 Socket 服务
import socketService from './utils/socket';

// 连接 WebSocket 服务器
// 连接到 http://localhost:3001
 socketService.connect('http://localhost:3001');

// 全局挂载，方便在组件中使用
// 这样在任何组件中都可以通过 this.$socket 访问 Socket 服务
Vue.prototype.$socket = socketService;

// 全局存储 socketService，方便在 auth.js 中使用
// 因为 auth.js 是普通的工具文件，没有 Vue 实例
window.socketService = socketService;
```

---

### **步骤3：用户登录后通知 WebSocket**

**文件：`src/vue/utils/auth.js`**

```javascript
// 登录成功后
// 参数1：token - JWT 令牌
// 参数2：user - 用户信息对象
login: (token, user) => {
  // 保存 token 和用户信息到本地存储
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // 保存用户ID到本地存储，方便在组件中使用
  localStorage.setItem('userId', user.id);
  
  // 通知 WebSocket 服务器用户登录
  // 检查 window.socketService 是否存在
  if (window.socketService) {
    // 发送 'login' 事件，参数是用户ID
    window.socketService.emit('login', user.id);
    console.log('用户已登录到 WebSocket:', user.id);
  }
}
```

---

### **步骤4：创建消息发送组件**

**文件：`src/vue/components/Messages.vue`**

```vue
<template>
  <div class="messages-container">
    <h2>私信</h2>
    
    <!-- 消息列表 -->
    <div class="message-list">
      <!-- 遍历消息列表 -->
      <div 
        v-for="message in messages" 
        :key="message.id"
        <!-- 根据消息的发送者判断是发送的消息还是接收的消息 -->
        :class="['message-item', message.sender === currentUserId ? 'sent' : 'received']"
      >
        <!-- 消息内容 -->
        <div class="message-content">{{ message.content }}</div>
        <!-- 消息时间 -->
        <div class="message-time">{{ message.timestamp }}</div>
      </div>
    </div>
    
    <!-- 消息输入框 -->
    <div class="message-input">
      <!-- 输入框，双向绑定到 messageContent -->
      <input 
        type="text" 
        v-model="messageContent"
        placeholder="输入消息..."
        <!-- 按回车键发送消息 -->
        @keyup.enter="sendMessage"
      >
      <!-- 发送按钮 -->
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // 当前用户ID，从本地存储获取
      currentUserId: localStorage.getItem('userId'),
      // 接收者ID，这里假设是 '123456'
      // 实际项目中，这个值应该从路由参数或其他地方获取
      receiverId: '123456',
      // 消息内容
      messageContent: '',
      // 消息列表
      messages: []
    };
  },
  
  mounted() {
    // 监听新消息
    // 当收到 'newMessage' 事件时触发
    this.$socket.on('newMessage', (message) => {
      // 检查消息的接收者是否是当前用户
      if (message.receiver === this.currentUserId) {
        // 添加到消息列表
        this.messages.push(message);
        console.log('收到新消息:', message);
      }
    });
    
    // 监听消息发送成功
    // 当收到 'messageSent' 事件时触发
    this.$socket.on('messageSent', (message) => {
      // 添加到消息列表
      this.messages.push(message);
      console.log('消息发送成功:', message);
    });
  },
  
  methods: {
    // 发送消息方法
    sendMessage() {
      // 检查消息内容是否为空
      if (!this.messageContent.trim()) return;
      
      // 创建消息对象
      const messageData = {
        // 临时ID，使用时间戳
        id: Date.now().toString(),
        // 发送者ID
        sender: this.currentUserId,
        // 接收者ID
        receiver: this.receiverId,
        // 消息内容
        content: this.messageContent,
        // 消息时间
        timestamp: new Date().toLocaleString()
      };
      
      console.log('准备发送消息:', messageData);
      
      // 发送消息
      // 发送 'sendMessage' 事件，参数是消息对象
      this.$socket.emit('sendMessage', messageData);
      
      // 清空输入框
      this.messageContent = '';
    }
  }
};
</script>

<style scoped>
.messages-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.message-list {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 20px;
}

.message-item {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  max-width: 80%;
}

/* 发送的消息样式 */
.message-item.sent {
  background-color: #e3f2fd;
  margin-left: auto;
}

/* 接收的消息样式 */
.message-item.received {
  background-color: #f5f5f5;
  margin-right: auto;
}

.message-content {
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  text-align: right;
}

.message-input {
  display: flex;
  gap: 10px;
}

.message-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message-input button {
  padding: 0 20px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.message-input button:hover {
  background-color: #1565c0;
}
</style>
```

---

## 🎬 **完整流程（详细步骤）**

### **1. 服务器启动**
1. 后端服务器启动，执行 `src/server.js`
2. 创建 HTTP 服务器：`const server = http.createServer(app)`
3. 初始化 WebSocket 服务：`socketService.init(server)`
4. WebSocket 服务开始监听 3001 端口
5. 控制台显示："WebSocket 服务初始化成功"

### **2. 前端连接**
1. 前端应用启动，执行 `src/vue/main.js`
2. 连接 WebSocket 服务器：`socketService.connect('http://localhost:3001')`
3. 前端尝试与后端 3001 端口建立 WebSocket 连接
4. 连接成功后，前端控制台显示："WebSocket 连接成功"
5. 后端控制台显示："用户连接: [socket.id]"（socket.id 是自动生成的唯一标识）

### **3. 用户登录**
1. **用户 A 登录**：
   - 用户 A 在登录页面输入用户名和密码
   - 点击登录按钮
   - 前端发送登录请求到后端 API
   - 后端验证成功，返回 JWT token 和用户信息
   - 前端调用 `auth.login(token, user)` 方法
   - `auth.login()` 方法保存 token 和用户信息到本地存储
   - `auth.login()` 方法通知 WebSocket 服务器用户登录：`socketService.emit('login', user.id)`

2. **后端处理登录**：
   - 后端 WebSocket 服务接收到 `login` 事件
   - 存储用户 A 的 ID 和 socket 实例：`connectedUsers.set(userId, socket)`
   - 将用户 A 加入以自己 ID 命名的房间：`socket.join(userId)`
   - 后端控制台显示："用户登录: [userId]"
   - 后端控制台显示："当前在线用户: [userId]"

3. **用户 B 登录**：
   - 重复上面的步骤，用户 B 也登录成功
   - 后端控制台显示："用户登录: [userId2]"
   - 后端控制台显示："当前在线用户: [userId, userId2]"

### **4. 发送消息（用户 A -> 用户 B）**
1. **用户 A 发送消息**：
   - 用户 A 在消息输入框中输入："你好，B！"
   - 点击发送按钮
   - 前端调用 `sendMessage()` 方法
   - `sendMessage()` 方法创建消息对象：
     ```javascript
     {
       id: "1234567890", // 时间戳
       sender: "userId", // 用户 A 的 ID
       receiver: "userId2", // 用户 B 的 ID
       content: "你好，B！",
       timestamp: "2024-01-01 12:00:00"
     }
     ```
   - 前端发送 `sendMessage` 事件：`this.$socket.emit('sendMessage', messageData)`

2. **后端处理消息**：
   - 后端 WebSocket 服务接收到 `sendMessage` 事件
   - 后端控制台显示："收到消息: [消息对象]"
   - 后端检查接收者（用户 B）是否在线：`if (connectedUsers.has(message.receiver))`
   - 因为用户 B 已登录，所以返回 true
   - 后端获取用户 B 的 socket 实例：`const receiverSocket = connectedUsers.get(message.receiver)`
   - 后端向用户 B 发送 `newMessage` 事件：`receiverSocket.emit('newMessage', message)`
   - 后端控制台显示："消息已发送给接收者: [userId2]"
   - 后端同时向用户 A 发送 `messageSent` 事件：`socket.emit('messageSent', message)`
   - 后端控制台显示："消息已确认发送给发送者"

### **5. 接收消息**
1. **用户 A 接收确认**：
   - 用户 A 的前端接收到 `messageSent` 事件
   - 前端将消息添加到消息列表：`this.messages.push(message)`
   - 用户 A 的界面上显示自己发送的消息："你好，B！"
   - 用户 A 的控制台显示："消息发送成功: [消息对象]"

2. **用户 B 接收消息**：
   - 用户 B 的前端接收到 `newMessage` 事件
   - 前端检查消息的接收者是否是自己：`if (message.receiver === this.currentUserId)`
   - 因为消息的接收者是用户 B，所以返回 true
   - 前端将消息添加到消息列表：`this.messages.push(message)`
   - 用户 B 的界面上显示收到的消息："你好，B！"
   - 用户 B 的控制台显示："收到新消息: [消息对象]"

### **6. 回复消息（用户 B -> 用户 A）**
1. **用户 B 回复消息**：
   - 用户 B 在消息输入框中输入："你好，A！"
   - 点击发送按钮
   - 前端调用 `sendMessage()` 方法
   - 前端发送 `sendMessage` 事件

2. **后端处理回复**：
   - 后端 WebSocket 服务接收到 `sendMessage` 事件
   - 后端向用户 A 发送 `newMessage` 事件
   - 后端向用户 B 发送 `messageSent` 事件

3. **用户 A 和 B 接收消息**：
   - 用户 B 看到自己发送的消息："你好，A！"
   - 用户 A 看到收到的消息："你好，A！"

---

## 📝 **测试步骤（详细）**

### **1. 启动服务**
```bash
# 启动后端
npm run dev

# 启动前端
npm run dev:webpack
```

### **2. 打开两个浏览器窗口**
- **窗口1**：访问 http://localhost:8081/login
  - 登录用户 A（假设用户 A 的 ID 是 "user1"）
- **窗口2**：访问 http://localhost:8081/login
  - 登录用户 B（假设用户 B 的 ID 是 "user2"）

### **3. 测试私信功能**
1. **窗口1（用户 A）**：
   - 访问 http://localhost:8081/messages
   - 在消息输入框中输入："你好，B！"
   - 点击发送按钮
   - 查看是否显示自己发送的消息

2. **窗口2（用户 B）**：
   - 访问 http://localhost:8081/messages
   - 查看是否收到用户 A 发送的消息："你好，B！"
   - 在消息输入框中输入："你好，A！"
   - 点击发送按钮
   - 查看是否显示自己发送的消息

3. **窗口1（用户 A）**：
   - 查看是否收到用户 B 回复的消息："你好，A！"

### **4. 检查控制台**
- **后端控制台**：
  - 查看用户连接、登录、消息发送等日志
  - 应该看到类似：
    ```
    用户连接: socket123
    用户登录: user1
    当前在线用户: [ 'user1' ]
    用户连接: socket456
    用户登录: user2
    当前在线用户: [ 'user1', 'user2' ]
    收到消息: { id: '...', sender: 'user1', receiver: 'user2', content: '你好，B！', ... }
    消息已发送给接收者: user2
    消息已确认发送给发送者
    收到消息: { id: '...', sender: 'user2', receiver: 'user1', content: '你好，A！', ... }
    消息已发送给接收者: user1
    消息已确认发送给发送者
    ```

- **前端控制台**：
  - 查看 WebSocket 连接状态、消息接收等日志
  - 应该看到类似：
    ```
    WebSocket 连接成功
    用户已登录到 WebSocket: user1
    消息发送成功: { id: '...', sender: 'user1', receiver: 'user2', content: '你好，B！', ... }
    收到新消息: { id: '...', sender: 'user2', receiver: 'user1', content: '你好，A！', ... }
    ```

---

## 🎯 **常见问题（详细）**

### **问题1：WebSocket 连接失败**
**原因**：
- 服务器未启动
- 端口号不对
- CORS 配置错误

**解决方法**：
- 检查后端服务是否运行：`npm run dev`
- 确认端口号是否正确：默认是 3001
- 检查 CORS 配置：确保 `origin` 设置正确

### **问题2：消息发送不出去**
**原因**：
- WebSocket 未连接
- 用户未登录到 WebSocket
- 接收者 ID 错误

**解决方法**：
- 检查 WebSocket 连接状态：`console.log(this.$socket.getConnectionStatus())`
- 确认用户已登录到 WebSocket：查看后端控制台是否显示 "用户登录: [userId]"
- 检查接收者 ID 是否正确：确保 `receiverId` 是有效的用户 ID

### **问题3：接收不到消息**
**原因**：
- 接收者未登录到 WebSocket
- 前端未监听 `newMessage` 事件
- 消息格式错误

**解决方法**：
- 确认接收者已登录到 WebSocket：查看后端控制台是否显示接收者的登录信息
- 检查前端是否监听了 `newMessage` 事件：确保 `this.$socket.on('newMessage', ...)` 代码正确
- 检查消息格式是否正确：确保消息对象包含 `sender`、`receiver`、`content` 等字段

---

## 🌟 **总结**

**WebSocket 私信功能的核心流程**：
1. **建立连接**：前端连接到 WebSocket 服务器
2. **用户登录**：通知服务器用户已上线，服务器记录用户连接
3. **发送消息**：前端发送消息到服务器
4. **转发消息**：服务器将消息转发给接收者
5. **接收消息**：接收者前端显示消息

**技术要点**：
- 使用 `socket.io` 和 `socket.io-client` 实现 WebSocket 通信
- 使用 `Map` 存储用户连接信息，方便查找用户的 socket 实例
- 使用事件驱动的通信模型，通过 `emit` 和 `on` 方法发送和接收消息
- 使用房间（room）功能，方便向特定用户发送消息
- 实现消息的实时传递，无需刷新页面

**实际应用**：
- 私信功能：用户之间实时聊天
- 通知功能：实时收到点赞、评论等通知
- 在线状态：显示用户是否在线
- 实时数据：股票行情、游戏状态等

现在主人已经完全掌握了 WebSocket 私信功能的完整实现啦！🐱✨
