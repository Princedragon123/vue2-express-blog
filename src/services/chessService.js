// ============================================================
// chessService.js - 井字棋 WebSocket 游戏服务
// ============================================================
// 
// 【文件职责】
// 管理井字棋游戏的 WebSocket 通信和房间逻辑，包括：
// 1. 房间创建、加入、离开
// 2. 游戏状态管理（棋盘、回合、胜负）
// 3. 实时消息推送
// 4. 断线处理
// 
// 【设计原则】
// - 单一职责：每个方法只负责一件事
// - 可复用性：游戏逻辑与 Socket 解耦
// - 安全性：所有操作都进行权限验证
// - 容错性：处理异常连接和非法操作
// ============================================================

const socketIo = require('socket.io');
const ChessRecord = require('../models/ChessRecord');
const socketService = require('./socketService');

// ============================================================
// 游戏常量定义
// ============================================================
const CHESS_CONSTANTS = {
  // 棋盘大小
  BOARD_SIZE: 9,
  
  // 获胜组合（8种）
  WIN_COMBOS: [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 行
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 列
    [0, 4, 8], [2, 4, 6],             // 对角线
  ],
  
  // 房间号长度
  ROOM_ID_LENGTH: 6,
  
  // 允许的角色
  ALLOWED_ROLES: ['svip', 'admin'],
  
  // 游戏状态
  STATUS: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished',
  },
  
  // 棋子类型
  PIECE: {
    X: 'X',
    O: 'O',
  },
  
  // 断线重连配置
  RECONNECT: {
    TIMEOUT: 30000, // 30秒超时
    CHECK_INTERVAL: 5000, // 每5秒检查一次
  },
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成指定长度的随机数字房间号
 * @param {number} length - 房间号长度
 * @returns {string} 房间号
 */
function generateRoomId(length = CHESS_CONSTANTS.ROOM_ID_LENGTH) {
  let roomId = '';
  for (let i = 0; i < length; i++) {
    roomId += Math.floor(Math.random() * 10);
  }
  return roomId;
}

/**
 * 检查棋盘是否有获胜方
 * @param {Array} board - 棋盘数组 (9个元素)
 * @returns {Object|null} { winner: 'X'|'O'|'draw', combo: [index, index, index] } 或 null
 */
function checkWinner(board) {
  for (const combo of CHESS_CONSTANTS.WIN_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  // 检查平局（棋盘已满）
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', combo: null };
  }
  return null;
}

/**
 * 快速检查胜负（只检查最后落子位置相关的组合）
 * @param {Array} board - 棋盘数组
 * @param {number} lastPosition - 最后落子位置
 * @returns {Object|null} { winner: 'X'|'O', combo: [index, index, index] } 或 null
 */
function checkWinnerFast(board, lastPosition) {
  const piece = board[lastPosition];
  if (!piece) return null;
  
  // 只检查包含最后落子位置的获胜组合
  const relevantCombos = CHESS_CONSTANTS.WIN_COMBOS.filter(combo => 
    combo.includes(lastPosition)
  );
  
  for (const combo of relevantCombos) {
    const [a, b, c] = combo;
    if (board[a] === piece && board[b] === piece && board[c] === piece) {
      return { winner: piece, combo };
    }
  }
  
  return null;
}

/**
 * 创建空棋盘
 * @returns {Array} 9个null元素的数组
 */
function createEmptyBoard() {
  return Array(CHESS_CONSTANTS.BOARD_SIZE).fill(null);
}

// ============================================================
// 井字棋服务对象
// ============================================================
const chessService = {
  
  // Socket.io 实例
  io: null,
  
  // 房间存储 Map: roomId -> roomData
  rooms: new Map(),
  
  // 用户当前所在房间 Map: userId -> roomId
  userRooms: new Map(),
  
  // 断线暂存 Map: userId -> { roomId, disconnectedAt, socketId }
  disconnectedUsers: new Map(),
  
  // 断线检查定时器
  reconnectCheckTimer: null,
  
  // ============================================================
  // 初始化服务
  // ============================================================
  init: (server) => {
    // 复用 socketService 的 io 实例，而不是创建新的
    // 这样前端连接的实例和后端监听的实例是同一个
    if (socketService.io) {
      chessService.io = socketService.io;
      console.log('[Chess] 复用 socketService 的 io 实例');
    } else {
      // 如果 socketService 还没初始化，创建新的（这种情况不应该发生）
      const io = socketIo(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });
      chessService.io = io;
      console.log('[Chess] 创建新的 io 实例（警告：socketService 未初始化）');
    }
    
    // 启动断线重连检查定时器
    chessService.startReconnectCheck();
    
    chessService.io.on('connection', (socket) => {
      console.log(`[Chess] 新客户端连接，socketId: ${socket.id}`);
      
      // 监听创建房间
      socket.on('chess:createRoom', (data) => {
        chessService.handleCreateRoom(socket, data);
      });
      
      // 监听加入房间
      socket.on('chess:joinRoom', (data) => {
        chessService.handleJoinRoom(socket, data);
      });
      
      // 监听离开房间
      socket.on('chess:leaveRoom', (data) => {
        chessService.handleLeaveRoom(socket, data);
      });
      
      // 监听落子
      socket.on('chess:makeMove', (data) => {
        chessService.handleMakeMove(socket, data);
      });
      
      // 监听再来一局
      socket.on('chess:rematch', (data) => {
        chessService.handleRematch(socket, data);
      });
      
      // 监听重连
      socket.on('chess:reconnect', (data) => {
        chessService.handleReconnect(socket, data);
      });
      
      // 监听心跳ping
      socket.on('chess:ping', (data) => {
        socket.emit('chess:pong', {
          timestamp: data?.timestamp || Date.now(),
          serverTime: Date.now(),
        });
      });
      
      // 监听断开连接
      socket.on('disconnect', () => {
        chessService.handleDisconnect(socket);
      });
    });
    
    console.log('[Chess] 井字棋服务初始化完成');
  },
  
  // ============================================================
  // 断线重连检查定时器
  // ============================================================
  startReconnectCheck: () => {
    chessService.reconnectCheckTimer = setInterval(() => {
      const now = Date.now();
      
      for (const [userId, disconnectInfo] of chessService.disconnectedUsers.entries()) {
        // 检查是否超时
        if (now - disconnectInfo.disconnectedAt > CHESS_CONSTANTS.RECONNECT.TIMEOUT) {
          console.log(`[Chess] 用户 ${userId} 重连超时，清理房间`);
          
          const room = chessService.rooms.get(disconnectInfo.roomId);
          if (room) {
            // 通知对手
            const opponentSocketId = userId === room.hostId ? room.guestSocketId : room.hostSocketId;
            if (opponentSocketId) {
              chessService.io.to(opponentSocketId).emit('chess:opponentLeft', { roomId: disconnectInfo.roomId });
            }
            
            // 清理房间
            chessService.cleanupRoom(disconnectInfo.roomId);
          }
          
          chessService.disconnectedUsers.delete(userId);
        }
      }
    }, CHESS_CONSTANTS.RECONNECT.CHECK_INTERVAL);
  },
  
  // ============================================================
  // 获取房间列表
  // ============================================================
  // ============================================================
  // 创建房间
  // ============================================================
  handleCreateRoom: (socket, { userId, userRole }) => {
    // 权限验证
    if (!CHESS_CONSTANTS.ALLOWED_ROLES.includes(userRole)) {
      socket.emit('chess:error', { message: '仅 SVIP 会员可以创建房间' });
      return;
    }
    
    // 检查用户是否已在房间中
    if (chessService.userRooms.has(userId)) {
      const existingRoomId = chessService.userRooms.get(userId);
      socket.emit('chess:error', { message: '你已在房间中，请先离开当前房间' });
      return;
    }
    
    // 生成唯一房间号
    let roomId;
    let attempts = 0;
    do {
      roomId = generateRoomId();
      attempts++;
    } while (chessService.rooms.has(roomId) && attempts < 100);
    
    if (chessService.rooms.has(roomId)) {
      socket.emit('chess:error', { message: '创建房间失败，请稍后重试' });
      return;
    }
    
    // 创建房间数据
    const room = {
      roomId,
      hostId: userId,
      hostSocketId: socket.id,
      guestId: null,
      guestSocketId: null,
      board: createEmptyBoard(),
      currentPlayer: userId, // 房主先手
      status: CHESS_CONSTANTS.STATUS.WAITING,
      winner: null,
      winCombo: null,
      gameCount: 0,
      createdAt: new Date(),
    };
    
    // 存储房间和用户映射
    chessService.rooms.set(roomId, room);
    chessService.userRooms.set(userId, roomId);
    
    // 将 socket 加入房间
    socket.join(roomId);
    
    // 通知创建成功
    socket.emit('chess:roomCreated', {
      roomId,
      youAre: CHESS_CONSTANTS.PIECE.X,
      isHost: true,
    });
    
    console.log(`[Chess] 用户 ${userId} 创建房间 ${roomId}`);
  },
  
  // ============================================================
  // 加入房间
  // ============================================================
  handleJoinRoom: (socket, { userId, userRole, roomId }) => {
    // 权限验证
    if (!CHESS_CONSTANTS.ALLOWED_ROLES.includes(userRole)) {
      socket.emit('chess:error', { message: '仅 SVIP 会员可以加入房间' });
      return;
    }
    
    // 检查房间是否存在
    const room = chessService.rooms.get(roomId);
    if (!room) {
      socket.emit('chess:error', { message: '房间不存在' });
      return;
    }
    
    // 检查房间是否已满
    if (room.guestId) {
      socket.emit('chess:error', { message: '房间已满' });
      return;
    }
    
    // 检查是否是自己创建的房间
    if (room.hostId === userId) {
      socket.emit('chess:error', { message: '不能加入自己的房间' });
      return;
    }
    
    // 检查用户是否已在其他房间
    if (chessService.userRooms.has(userId)) {
      socket.emit('chess:error', { message: '你已在其他房间中' });
      return;
    }
    
    // 加入房间
    room.guestId = userId;
    room.guestSocketId = socket.id;
    room.status = CHESS_CONSTANTS.STATUS.PLAYING;
    
    chessService.userRooms.set(userId, roomId);
    socket.join(roomId);
    
    // 通知房主有人加入
    chessService.io.to(room.hostSocketId).emit('chess:opponentJoined', {
      roomId,
      opponentId: userId,
    });
    
    // 通知双方游戏开始
    const hostPiece = CHESS_CONSTANTS.PIECE.X;
    const guestPiece = CHESS_CONSTANTS.PIECE.O;
    
    chessService.io.to(room.hostSocketId).emit('chess:gameStarted', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      youAre: hostPiece,
      opponentId: userId,
    });
    
    socket.emit('chess:gameStarted', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      youAre: guestPiece,
      opponentId: room.hostId,
    });
    
    console.log(`[Chess] 用户 ${userId} 加入房间 ${roomId}`);
  },
  
  // ============================================================
  // 离开房间
  // ============================================================
  handleLeaveRoom: (socket, { userId, roomId }) => {
    const room = chessService.rooms.get(roomId);
    if (!room) return;
    
    // 通知对手
    const opponentSocketId = userId === room.hostId ? room.guestSocketId : room.hostSocketId;
    if (opponentSocketId) {
      chessService.io.to(opponentSocketId).emit('chess:opponentLeft', { roomId });
    }
    
    // 清理房间
    chessService.cleanupRoom(roomId);
    
    console.log(`[Chess] 用户 ${userId} 离开房间 ${roomId}`);
  },
  
  // ============================================================
  // 落子
  // ============================================================
  handleMakeMove: (socket, { userId, roomId, position }) => {
    const room = chessService.rooms.get(roomId);
    if (!room) {
      socket.emit('chess:error', { message: '房间不存在' });
      return;
    }
    
    // 快速检查：游戏状态和回合
    if (room.status !== CHESS_CONSTANTS.STATUS.PLAYING || room.currentPlayer !== userId) {
      socket.emit('chess:error', { message: room.status !== CHESS_CONSTANTS.STATUS.PLAYING ? '游戏未开始或已结束' : '还没轮到你' });
      return;
    }
    
    // 快速检查：位置合法性
    if (position < 0 || position >= CHESS_CONSTANTS.BOARD_SIZE || room.board[position] !== null) {
      socket.emit('chess:error', { message: position < 0 || position >= CHESS_CONSTANTS.BOARD_SIZE ? '无效的位置' : '该位置已有棋子' });
      return;
    }
    
    // 执行落子
    const piece = userId === room.hostId ? CHESS_CONSTANTS.PIECE.X : CHESS_CONSTANTS.PIECE.O;
    room.board[position] = piece;
    
    // 检查胜负（优化版：只检查最后落子位置相关的组合）
    const result = checkWinnerFast(room.board, position);
    
    if (result) {
      // 游戏结束 - 有获胜者
      room.status = CHESS_CONSTANTS.STATUS.FINISHED;
      room.winner = result.winner;
      room.winCombo = result.combo;
      
      // 计算游戏步数
      const moves = room.board.filter(cell => cell !== null).length;
      
      // 异步保存战绩，不阻塞游戏流程
      chessService.saveGameRecordAsync(room, result.winner, moves);
      
      // 通知双方
      chessService.io.to(roomId).emit('chess:gameOver', {
        roomId,
        winner: result.winner,
        winCombo: result.combo,
        board: room.board,
      });
      
      console.log(`[Chess] 房间 ${roomId} 游戏结束，获胜者: ${result.winner}`);
    } else if (room.board.every(cell => cell !== null)) {
      // 游戏结束 - 平局
      room.status = CHESS_CONSTANTS.STATUS.FINISHED;
      room.winner = 'draw';
      
      // 计算游戏步数
      const moves = room.board.length;
      
      // 异步保存战绩，不阻塞游戏流程
      chessService.saveGameRecordAsync(room, 'draw', moves);
      
      // 通知双方
      chessService.io.to(roomId).emit('chess:gameOver', {
        roomId,
        winner: 'draw',
        winCombo: null,
        board: room.board,
      });
      
      console.log(`[Chess] 房间 ${roomId} 游戏结束，平局`);
    } else {
      // 切换回合
      room.currentPlayer = room.currentPlayer === room.hostId ? room.guestId : room.hostId;
      
      // 只发送变化，不发送整个棋盘（优化传输速度）
      chessService.io.to(roomId).emit('chess:moveMade', {
        roomId,
        position,
        player: userId,
        piece,
        currentPlayer: room.currentPlayer,
        // 不发送整个board，前端根据position和piece更新
      });
    }
  },
  
  // ============================================================
  // 再来一局
  // ============================================================
  handleRematch: (socket, { userId, roomId }) => {
    const room = chessService.rooms.get(roomId);
    if (!room) return;
    
    // 重置游戏状态
    room.board = createEmptyBoard();
    room.status = CHESS_CONSTANTS.STATUS.PLAYING;
    room.winner = null;
    room.winCombo = null;
    room.gameCount++;
    
    // 先手轮换：偶数局房主先手，奇数局客人先手
    room.currentPlayer = room.gameCount % 2 === 0 ? room.hostId : room.guestId;
    
    // 通知房主
    chessService.io.to(room.hostSocketId).emit('chess:gameStarted', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      youAre: CHESS_CONSTANTS.PIECE.X,
      opponentId: room.guestId,
      gameCount: room.gameCount,
    });
    
    // 通知客人
    chessService.io.to(room.guestSocketId).emit('chess:gameStarted', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      youAre: CHESS_CONSTANTS.PIECE.O,
      opponentId: room.hostId,
      gameCount: room.gameCount,
    });
    
    console.log(`[Chess] 房间 ${roomId} 重新开始第 ${room.gameCount + 1} 局`);
  },
  
  // ============================================================
  // 断开连接处理
  // ============================================================
  // ============================================================
  // 处理断开连接（游戏层 - 职责：游戏房间状态管理）
  // ============================================================
  // 【职责范围】
  // - 暂存断线用户的房间状态（30秒超时等待重连）
  // - 通知对手对方已断线
  // - 不处理用户在线状态（由 socketService 负责）
  //
  // 【与 socketService 的协调】
  // socketService.disconnect 先执行（清理在线状态）
  // chessService.handleDisconnect 后执行（处理游戏房间）
  // 两者职责清晰，互不干扰 ✅
  handleDisconnect: (socket) => {
    console.log(`[Chess] 处理断开连接: socketId=${socket.id}`);

    // 查找用户所在的房间
    for (const [userId, roomId] of chessService.userRooms.entries()) {
      const room = chessService.rooms.get(roomId);
      if (!room) continue;

      // 检查是否是该房间的参与者
      if (room.hostSocketId === socket.id || room.guestSocketId === socket.id) {
        // 暂存断线状态，不立即清理房间（允许30秒内重连）
        chessService.disconnectedUsers.set(userId, {
          roomId,
          disconnectedAt: Date.now(),
          socketId: socket.id,
        });

        // 通知对手对方断线
        const opponentSocketId = socket.id === room.hostSocketId ? room.guestSocketId : room.hostSocketId;
        if (opponentSocketId) {
          chessService.io.to(opponentSocketId).emit('chess:opponentDisconnected', {
            roomId,
            disconnectedUserId: userId,
            message: '对手已断开连接，等待重连中...',
          });
          console.log(`[Chess] 已通知对手 ${opponentSocketId} 用户 ${userId} 断线`);
        }

        console.log(`[Chess] 用户 ${userId} 断开连接，暂存状态等待重连 (房间: ${roomId})`);
        break;
      }
    }
  },
  
  // ============================================================
  // 重连处理
  // ============================================================
  handleReconnect: (socket, { userId, roomId }) => {
    // 检查是否有断线暂存记录
    const disconnectInfo = chessService.disconnectedUsers.get(userId);
    if (!disconnectInfo) {
      socket.emit('chess:error', { message: '没有可重连的房间' });
      return;
    }
    
    // 检查房间是否还存在
    const room = chessService.rooms.get(roomId);
    if (!room) {
      chessService.disconnectedUsers.delete(userId);
      socket.emit('chess:error', { message: '房间已不存在' });
      return;
    }
    
    // 更新 socket ID
    if (userId === room.hostId) {
      room.hostSocketId = socket.id;
    } else if (userId === room.guestId) {
      room.guestSocketId = socket.id;
    }
    
    // 重新加入 socket.io 房间
    socket.join(roomId);
    
    // 清除断线暂存
    chessService.disconnectedUsers.delete(userId);
    
    // 通知对手对方已重连
    const opponentSocketId = userId === room.hostId ? room.guestSocketId : room.hostSocketId;
    if (opponentSocketId) {
      chessService.io.to(opponentSocketId).emit('chess:opponentReconnected', { roomId });
    }
    
    // 发送当前游戏状态给重连用户
    socket.emit('chess:reconnected', {
      roomId,
      board: room.board,
      currentPlayer: room.currentPlayer,
      youAre: userId === room.hostId ? CHESS_CONSTANTS.PIECE.X : CHESS_CONSTANTS.PIECE.O,
      opponentId: userId === room.hostId ? room.guestId : room.hostId,
      status: room.status,
      gameCount: room.gameCount,
    });
    
    console.log(`[Chess] 用户 ${userId} 重连成功，房间 ${roomId}`);
  },
  
  // ============================================================
  // 清理房间
  // ============================================================
  cleanupRoom: (roomId) => {
    const room = chessService.rooms.get(roomId);
    if (!room) return;
    
    // 删除用户房间映射
    if (room.hostId) chessService.userRooms.delete(room.hostId);
    if (room.guestId) chessService.userRooms.delete(room.guestId);
    
    // 删除房间
    chessService.rooms.delete(roomId);
    
    // 离开 socket.io 房间
    chessService.io.socketsLeave(roomId);
  },
  
  // ============================================================
  // 保存战绩（同步版本，已废弃）
  // ============================================================
  saveGameRecord: async (room, winner, moves) => {
    try {
      // 确定房主和客人的结果
      let hostResult, guestResult;
      
      if (winner === 'draw') {
        hostResult = 'draw';
        guestResult = 'draw';
      } else if (winner === room.hostId) {
        hostResult = 'win';
        guestResult = 'lose';
      } else {
        hostResult = 'lose';
        guestResult = 'win';
      }
      
      // 更新房主战绩
      const hostRecord = await ChessRecord.getOrCreate(room.hostId);
      await hostRecord.updateGameResult(
        hostResult,
        room.guestId,
        room.roomId,
        CHESS_CONSTANTS.PIECE.X,
        moves
      );
      
      // 更新客人战绩
      const guestRecord = await ChessRecord.getOrCreate(room.guestId);
      await guestRecord.updateGameResult(
        guestResult,
        room.hostId,
        room.roomId,
        CHESS_CONSTANTS.PIECE.O,
        moves
      );
      
      console.log(`[Chess] 战绩已保存: 房主 ${hostResult}, 客人 ${guestResult}`);
    } catch (error) {
      console.error('[Chess] 保存战绩失败:', error);
    }
  },
  
  // ============================================================
  // 保存战绩（异步版本，不阻塞游戏流程）
  // ============================================================
  saveGameRecordAsync: (room, winner, moves) => {
    // 使用 setImmediate 将数据库操作放到下一个事件循环
    setImmediate(async () => {
      try {
        // 确定房主和客人的结果
        let hostResult, guestResult;
        
        if (winner === 'draw') {
          hostResult = 'draw';
          guestResult = 'draw';
        } else if (winner === room.hostId) {
          hostResult = 'win';
          guestResult = 'lose';
        } else {
          hostResult = 'lose';
          guestResult = 'win';
        }
        
        // 更新房主战绩
        const hostRecord = await ChessRecord.getOrCreate(room.hostId);
        await hostRecord.updateGameResult(
          hostResult,
          room.guestId,
          room.roomId,
          CHESS_CONSTANTS.PIECE.X,
          moves
        );
        
        // 更新客人战绩
        const guestRecord = await ChessRecord.getOrCreate(room.guestId);
        await guestRecord.updateGameResult(
          guestResult,
          room.hostId,
          room.roomId,
          CHESS_CONSTANTS.PIECE.O,
          moves
        );
        
        console.log(`[Chess] 战绩已保存: 房主 ${hostResult}, 客人 ${guestResult}`);
      } catch (error) {
        console.error('[Chess] 保存战绩失败:', error);
      }
    });
  },
};

module.exports = chessService;
