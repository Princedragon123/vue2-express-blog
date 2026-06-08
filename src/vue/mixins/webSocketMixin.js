// 提供WebSocket相关的Vue组件复用逻辑，包括：
// 1. 自动初始化WebSocket连接
// 2. 事件监听器管理
// 3. Vue生命周期集成
// A: Vue的代码复用机制，可以将通用逻辑混入多个组件
// A: data/methods合并（组件优先），生命周期钩子都执行
// A: Vue不支持继承，Mixin更灵活，可以混入多个
// A: 命名冲突、来源不明确、调试困难
// A: Composition API（组合式API）
// A: 防止内存泄漏，组件销毁后不再需要监听事件

// 导出Mixin对象
// import webSocketMixin from '../mixins/webSocketMixin';
// export default {
//   mixins: [webSocketMixin],
//   mounted() {
//     this.initWebSocket();
//     this.addSocketListener('newMessage', this.handleNewMessage);
export default {
  data() {
    return {
      // WebSocket连接状态
      socketConnected: false,
      

      socketListeners: []
    };
  },
  methods: {
    async initWebSocket() {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');  
        // 如果没有用户信息，说明未登录
        if (!userStr) {
          console.warn('[WebSocketMixin] 用户未登录，跳过初始化');
          return false;
        }
        
        // 解析用户信息
        const user = JSON.parse(userStr);
        
        const currentUserId = user._id || user.id;
        
        if (!currentUserId) {
          console.warn('[WebSocketMixin] 无法获取用户ID');
          return false;
        }
        

        if (!this.$socket.isConnected) {
          // 连接并登录
          await this.$socket.connectAndLogin(currentUserId);
        }
        
        // 步骤4：更新连接状态
        this.socketConnected = this.$socket.isConnected;
        return this.socketConnected;
        
      } catch (error) {
        console.error('[WebSocketMixin] 初始化失败:', error);
        return false;
      }
    },
    addSocketListener(event, handler) {
      if (this.$socket) {
        // 调用底层 socket.js 的 on 方法
        this.$socket.on(event, handler);
        
        // 记录监听器，用于后续清理
        this.socketListeners.push({ event, handler });
      }
    },

    removeSocketListeners() {
      if (this.$socket && this.socketListeners.length > 0) {
        // 遍历所有监听器，逐个移除
        this.socketListeners.forEach(({ event, handler }) => {
          // 调用底层 socket.js 的 off 方法
          // 传入具体的handler，只移除这个回调
          this.$socket.off(event, handler);
        });
        
        // 清空监听器列表
        this.socketListeners = [];
      }
    },
   
    disconnectSocket() {
      if (this.$socket && this.socketConnected) {
        // 先移除所有监听器
        this.removeSocketListeners();
        
        // 断开连接
        this.$socket.disconnect();
        
        // 更新状态
        this.socketConnected = false;
      }
    }
  },
  
  // 生命周期钩子
  // Mixin的生命周期钩子会与组件的生命周期钩子合并
  // 两者都会执行，先执行Mixin的，再执行组件的
  // 1. Mixin的beforeCreate
  // 2. 组件的beforeCreate
  // 3. Mixin的created
  // 4. 组件的created
  // 5. Mixin的beforeMount
  // 6. 组件的beforeMount
  // 7. Mixin的mounted
  // 8. 组件的mounted
  // ... 以此类推
  // Q: Mixin和组件都有mounted，执行顺序是什么？
  // A: 先执行Mixin的，再执行组件的
  
  // beforeDestroy 钩子
  // 1. 组件即将销毁，不再需要监听事件
  // 2. 防止组件销毁后仍然收到事件
  // 3. 防止内存泄漏
  // Q: 为什么不在destroyed中清理？
  // A: destroyed时组件已销毁，可能无法正确访问this
  // Q: Vue 3中用什么替代beforeDestroy？
  // A: beforeUnmount
  beforeDestroy() {
    // 组件销毁前，自动清理所有监听器
    this.removeSocketListeners();
  }
};
