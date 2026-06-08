// 这是WebSocket系统的前端核心，负责：
// 1. 连接后端WebSocket服务器
// 2. 发送事件给后端
// 3. 监听后端推送的事件
// 4. 自动重连机制
// A: 整个应用只需要一个WebSocket连接，避免重复连接浪费资源
// A: 类定义后立即创建实例并导出：export default new SocketService()
// A: 支持async/await语法，方便在Vue组件中使用
// A: socket.io自动重连，重连成功后重新发送login事件
// A: 重连后是新socket，服务器不知道这个连接是谁的
// A: 组件销毁时调用off()移除事件监听器

// 导入依赖模块
// 提供自动重连、事件监听等功能
import io from 'socket.io-client';

// SocketService 类
// 确保一个类只有一个实例，并提供全局访问点
// 1. 避免重复连接：每个组件都创建连接会浪费资源
// 2. 统一管理：所有组件共享同一个连接和状态
// 3. 简化代码：不需要在组件间传递socket实例
// class SocketService { ... }
// export default new SocketService(); // 立即创建实例
// Q: 单例模式有什么缺点？
// A: 全局状态难以测试，可能导致意外的副作用
class SocketService {
  // 构造函数
  constructor() {

    this.socket = null;
    this.isConnected = false;
    // 当前重连次数
    this.reconnectAttempts = 0;  
    // 最大重连次数
    this.maxReconnectAttempts = 5;
    // 重连间隔（毫秒）
    this.reconnectDelay = 1000;
    // 当前登录的用户ID
    this.currentUserId = null;
  }
  
  // 连接WebSocket服务器（核心方法）
  // url: WebSocket服务器地址
  // 默认值：'http://8.148.151.114:3001'
  // Promise - 连接成功resolve，失败reject
  // 用户登录后，在webSocketMixin.js的initWebSocket()中调用
  // 1. 创建socket.io实例
  // 2. 监听connect事件
  // 3. 监听connect_error事件
  // 4. 监听disconnect事件
  // 5. 监听reconnect事件
  // Q: 为什么用Promise封装？
  // A: 支持async/await，方便在Vue组件中使用
  // Q: reconnection: true是什么意思？
  // A: 启用socket.io的自动重连功能
  connect(url = '') {
    const socketUrl = url || (window.location.protocol + '//' + window.location.host);
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(socketUrl, {
          // 是否自动重连
          reconnection: true,       
          // 最大重连次数
          reconnectionAttempts: this.maxReconnectAttempts,   
          // 重连间隔（毫秒）
          reconnectionDelay: this.reconnectDelay,    
          // 连接超时时间（毫秒）
          timeout: 20000
        });
        
        // 监听连接成功事件
        // 1. 更新连接状态
        // 2. 重置重连次数
        // 3. resolve Promise
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(); // Promise成功
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('[Socket] 连接错误:', error);
          this.isConnected = false;
          reject(error); // Promise失败
        });
        
        // 监听断开连接事件
        // 1. 网络断开
        // 2. 服务器关闭
        // 3. 用户主动断开
        // - 'io server disconnect': 服务器主动断开
        // - 'io client disconnect': 客户端主动断开
        // - 'ping timeout': 心跳超时
        // - 'transport close': 连接关闭
        // - 'transport error': 连接错误
        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
        });
        
        // 监听重连成功事件
        this.socket.on('reconnect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // 重连后自动重新登录
          if (this.currentUserId) {
            this.socket.emit('login', this.currentUserId);
          }
        });
        
        // 监听重连尝试事件
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          this.reconnectAttempts = attemptNumber;
        });
        
        // 监听重连失败事件
        this.socket.on('reconnect_failed', () => {
          console.error('[Socket] 重连失败，已达到最大重连次数');
          this.isConnected = false;
        });
        
      } catch (error) {
        console.error('[Socket] 连接初始化失败:', error);
        reject(error);
      }
    });
  }
  
  // 断开WebSocket连接
  // 用户退出登录时
  // 正常情况下不需要手动调用
  // 浏览器关闭时会自动断开
  // Q: 什么时候需要主动断开？
  // A: 用户退出登录、切换账号时
  disconnect() {
    if (this.socket) {
      console.log('[Socket] 主动断开连接');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUserId = null;
    }
  }
  
  // 用户登录
  // userId: 当前登录用户的ID
  // 1. 保存userId（用于重连后重新登录）
  // 2. 发送login事件给服务器
  // 1. 建立userId → socket的映射
  // 2. 将用户加入以userId命名的房间
  // Q: 为什么需要login事件？
  // A: socket.io不知道连接的是谁，需要前端主动告知
  // Q: 为什么保存currentUserId？
  // A: 重连后需要重新登录，需要知道用户ID
  login(userId) {
    if (this.socket && this.isConnected) {
      // 保存用户ID（用于重连后重新登录）
      this.currentUserId = userId;
      
      // 发送登录事件
      this.socket.emit('login', userId);
    } else {
      console.warn('[Socket] 未连接，无法登录');
    }
  }
  
  // 连接并登录（合并方法）
  // userId: 用户ID
  // url: 服务器地址
  // 在webSocketMixin.js中调用
  // await socketService.connectAndLogin('user123');
  connectAndLogin(userId, url = 'http://localhost:3001') {
    return this.connect(url).then(() => {
      this.login(userId);
    });
  }
  
  // 监听WebSocket事件
  // event: 事件名称
  // callback: 回调函数
  // - 'newMessage': 收到新私聊消息
  // - 'notification': 收到系统通知
  // - 'messageSent': 消息发送成功确认
  // socketService.on('newMessage', (message) => {
  //   console.log('收到新消息:', message);
  //   this.messages.push(message);
  // });
  // Q: on和emit有什么区别？
  // A: on是监听事件（接收），emit是发送事件（发出）
  // Q: 一个事件可以有多个监听器吗？
  // A: 可以，多次调用on注册不同的回调
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      console.log(`[Socket] 监听事件: ${event}`);
    } else {
      console.warn('[Socket] 未连接，无法监听事件');
    }
  }
  
  // 发送WebSocket事件
  // event: 事件名称
  // data: 事件数据
  // socketService.emit('sendMessage', {
  //   receiver: 'user456',
  //   content: '你好！'
  // });
  // 当前项目中，消息发送是通过HTTP API
  // WebSocket主要用于接收消息和通知
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[Socket] 未连接，无法发送事件');
    }
  }
  
  // 移除WebSocket事件监听
  // event: 事件名称
  // callback: 回调函数（可选）
  // 1. 防止内存泄漏
  // 2. 防止组件销毁后仍然收到事件
  // 3. 避免重复处理事件
  // Q: 不传callback会怎样？
  // A: 移除该事件的所有监听器
  // Q: 什么时候需要移除监听器？
  // A: 组件销毁时（beforeDestroy钩子）
  off(event, callback) {
    if (this.socket) {
      if (callback) {
        // 移除特定回调
        this.socket.off(event, callback);
      } else {
        // 移除该事件的所有监听器
        this.socket.off(event);
      }
    }
  }
  
  // 检查WebSocket连接状态
  // true: 已连接
  // false: 未连接
  // 在发送消息前检查连接状态
  getConnectionStatus() {
    return this.isConnected;
  }
  
  // 获取Socket实例
  // 一般情况下不需要使用
  // 只有需要直接操作socket.io时才使用
  getSocket() {
    return this.socket;
  }
}

// 导出单例实例
// 1. 定义类
// 2. 立即创建实例
// 3. 导出实例
// 所有导入这个文件的组件都共享同一个实例
// import socket from '@/utils/socket.js';
// socket.connect();
// socket.on('newMessage', handler);
// Q: 为什么不导出类本身？
// A: 导出实例确保全局只有一个连接
// Q: 如何验证是单例？
// A: 在不同组件中导入，比较是否是同一个对象
export default new SocketService();
