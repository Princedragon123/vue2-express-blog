// chessSocket.js - 井字棋游戏 WebSocket 客户端封装
// 封装井字棋游戏的 WebSocket 通信，提供：
// 1. Promise 化的 API 调用
// 2. 事件监听管理
// 3. 错误处理
// 4. 超时机制
// 5. 消息队列
// 6. 心跳检测
// - 复用全局 socket 实例（来自 socket.js）
// - Promise 封装异步操作
// - 事件监听器自动清理
// - 超时自动拒绝

import socketService from './socket';

// 配置常量
const CONFIG = {
  REQUEST_TIMEOUT: 10000, // 请求超时时间 10秒
  HEARTBEAT_INTERVAL: 30000, // 心跳间隔 30秒
  MAX_RECONNECT_ATTEMPTS: 5, // 最大重连次数
  MESSAGE_QUEUE_LIMIT: 100, // 消息队列上限
};

// ChessSocket 类
class ChessSocket {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // 存储事件监听器，便于清理
    this.pendingRequests = new Map(); // 存储待处理的请求
    this.messageQueue = []; // 消息队列
    this.heartbeatTimer = null; // 心跳定时器
    this.isInitialized = false;
    this.requestId = 0; // 请求ID计数器
  }

  // 初始化：绑定全局 socket 实例
  init() {
    if (this.isInitialized) return;
    
    this.socket = socketService.socket;
    if (!this.socket) {
      console.warn('[ChessSocket] 全局 socket 实例未初始化，请先调用 socketService.connect()');
      return;
    }

    this.isInitialized = true;
    this._setupMessageQueue();
    this._startHeartbeat();
    
    // 如果 socket 已经连接，立即处理队列
    if (this.socket.connected) {
      this._flushMessageQueue();
    }
  }

  // 设置消息队列处理
  _setupMessageQueue() {
    if (!this.socket) return;

    // 连接成功时发送队列中的消息
    this.socket.on('connect', () => {
      console.log('[ChessSocket] 连接成功，处理消息队列');
      this._flushMessageQueue();
    });

    // 重连成功时也处理队列
    this.socket.on('reconnect', () => {
      console.log('[ChessSocket] 重连成功，处理消息队列');
      this._flushMessageQueue();
    });
  }

  // 发送队列中的消息
  _flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket && this.socket.connected) {
      const message = this.messageQueue.shift();
      this.socket.emit(message.event, message.data);
    }
  }

  // 启动心跳检测
  _startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('chess:ping', { timestamp: Date.now() });
      }
    }, CONFIG.HEARTBEAT_INTERVAL);
  }

  // 停止心跳检测
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 创建带超时的请求（简化版）
  _createRequest(event, data, responseEvent) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('WebSocket 未连接'));
        return;
      }

      let isCompleted = false;

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          this.socket.off(responseEvent, responseHandler);
          this.socket.off('chess:error', errorHandler);
          console.warn(`[ChessSocket] 请求超时: ${event}`);
          reject(new Error('请求超时'));
        }
      }, CONFIG.REQUEST_TIMEOUT);

      // 响应处理
      const responseHandler = (response) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          this.socket.off(responseEvent, responseHandler);
          this.socket.off('chess:error', errorHandler);
          console.log(`[ChessSocket] 收到响应: ${responseEvent}`, response);
          resolve(response);
        }
      };

      // 错误处理
      const errorHandler = (error) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          this.socket.off(responseEvent, responseHandler);
          this.socket.off('chess:error', errorHandler);
          console.error(`[ChessSocket] 收到错误:`, error);
          reject(new Error(error.message || '请求失败'));
        }
      };

      // 注册监听器
      this.socket.on(responseEvent, responseHandler);
      this.socket.on('chess:error', errorHandler);

      // 发送请求
      console.log(`[ChessSocket] 发送请求: ${event}`, data);
      this.socket.emit(event, data);
    });
  }

  // 创建房间
  createRoom(userId, userRole) {
    return this._createRequest(
      'chess:createRoom',
      { userId, userRole },
      'chess:roomCreated'
    );
  }

  // 加入房间
  joinRoom(userId, userRole, roomId) {
    return this._createRequest(
      'chess:joinRoom',
      { userId, userRole, roomId },
      'chess:roomJoined'
    );
  }

  // 离开房间
  leaveRoom(userId, roomId) {
    if (!this.socket) return;
    
    if (this.socket.connected) {
      this.socket.emit('chess:leaveRoom', { userId, roomId });
    } else {
      this.messageQueue.push({
        event: 'chess:leaveRoom',
        data: { userId, roomId },
      });
    }
  }

  // 画圈/画叉
  makeMove(userId, roomId, position) {
    if (!this.socket || !this.socket.connected) {
      console.warn('[ChessSocket] WebSocket 未连接，无法画圈/画叉');
      return;
    }
    console.log('[ChessSocket] 画圈/画叉:', { userId, roomId, position });
    this.socket.emit('chess:makeMove', { userId, roomId, position });
  }

  // 再来一局
  rematch(userId, roomId) {
    if (!this.socket || !this.socket.connected) {
      console.warn('[ChessSocket] WebSocket 未连接，无法再来一局');
      return;
    }
    console.log('[ChessSocket] 再来一局:', { userId, roomId });
    this.socket.emit('chess:rematch', { userId, roomId });
  }

  // 重连
  reconnect(userId, roomId) {
    return this._createRequest(
      'chess:reconnect',
      { userId, roomId },
      'chess:reconnected'
    );
  }

  // 事件监听封装

  onRoomCreated(callback) {
    this._on('chess:roomCreated', callback);
  }

  onOpponentJoined(callback) {
    this._on('chess:opponentJoined', callback);
  }

  onGameStarted(callback) {
    this._on('chess:gameStarted', callback);
  }

  onMoveMade(callback) {
    this._on('chess:moveMade', callback);
  }

  onGameOver(callback) {
    this._on('chess:gameOver', callback);
  }

  onOpponentLeft(callback) {
    this._on('chess:opponentLeft', callback);
  }

  onOpponentDisconnected(callback) {
    this._on('chess:opponentDisconnected', callback);
  }

  onOpponentReconnected(callback) {
    this._on('chess:opponentReconnected', callback);
  }

  onError(callback) {
    this._on('chess:error', callback);
  }

  // 内部方法：注册事件监听
  _on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  // 清理所有资源
  cleanup() {
    // 停止心跳
    this._stopHeartbeat();

    // 清理所有待处理请求
    for (const [requestId, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeoutId);
    }
    this.pendingRequests.clear();

    // 清空消息队列
    this.messageQueue = [];

    if (!this.socket) return;
    
    // 移除所有 chess 相关的事件监听
    this.socket.off('chess:roomCreated');
    this.socket.off('chess:roomJoined');
    this.socket.off('chess:opponentJoined');
    this.socket.off('chess:gameStarted');
    this.socket.off('chess:moveMade');
    this.socket.off('chess:gameOver');
    this.socket.off('chess:opponentLeft');
    this.socket.off('chess:opponentDisconnected');
    this.socket.off('chess:opponentReconnected');
    this.socket.off('chess:reconnected');
    this.socket.off('chess:roomList');
    this.socket.off('chess:error');
    this.socket.off('chess:ping');
    this.socket.off('chess:pong');

    this.isInitialized = false;
  }
}

// 单例导出
export default new ChessSocket();
