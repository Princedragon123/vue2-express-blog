// ============================================================
// webSocketMixin.js - WebSocket混入（学习版·Vue复用机制）
// ============================================================
// 
// 【文件职责】
// 提供WebSocket相关的Vue组件复用逻辑，包括：
// 1. 自动初始化WebSocket连接
// 2. 事件监听器管理
// 3. Vue生命周期集成
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Vue Mixin：代码复用机制，将通用逻辑混入多个组件                      │
// │  2. 生命周期钩子：Mixin的钩子与组件钩子合并执行                          │
// │  3. 事件监听器管理：自动记录和清理，防止内存泄漏                         │
// │  4. localStorage/sessionStorage：读取用户信息                           │
// │  5. $socket：Vue原型上挂载的socket实例                                  │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【什么是Mixin？】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  Mixin 是 Vue 的一种代码复用机制                                        │
// │  可以把通用的属性、方法、生命周期钩子"混入"到多个组件中                  │
// │                                                                         │
// │  【合并规则】                                                            │
// │  - data: 合并，组件优先                                                  │
// │  - methods: 合并，组件优先                                               │
// │  - 生命周期钩子: 都执行，先Mixin后组件                                   │
// │                                                                         │
// │  【使用场景】                                                            │
// │  - 多个组件需要相同的WebSocket功能                                       │
// │  - 避免在每个组件中重复写初始化代码                                      │
// │  - 统一管理事件监听器的生命周期                                          │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【与socket.js的关系】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   socket.js（底层工具类）              webSocketMixin.js（Vue封装）     │
// │   ─────────────────────                ─────────────────────────        │
// │                                                                         │
// │   • 提供基本的连接和通信方法            • 自动初始化（读取用户信息）     │
// │   • 单例模式，全局共享                  • 事件监听器管理（自动清理）     │
// │   • 与框架无关                          • Vue生命周期集成               │
// │                                                                         │
// │   【调用关系】                                                           │
// │   webSocketMixin.js → this.$socket → socket.js                         │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 什么是Mixin？有什么用？
// A: Vue的代码复用机制，可以将通用逻辑混入多个组件
// 
// Q2: Mixin的合并规则是什么？
// A: data/methods合并（组件优先），生命周期钩子都执行
// 
// Q3: 为什么用Mixin而不是继承？
// A: Vue不支持继承，Mixin更灵活，可以混入多个
// 
// Q4: Mixin有什么缺点？
// A: 命名冲突、来源不明确、调试困难
// 
// Q5: Vue 3中用什么替代Mixin？
// A: Composition API（组合式API）
// 
// Q6: 为什么要在beforeDestroy中清理监听器？
// A: 防止内存泄漏，组件销毁后不再需要监听事件
// ============================================================

// ============================================================
// 导出Mixin对象
// ============================================================
// 【格式】export default { data, methods, 生命周期钩子 }
// 【使用方法】
// import webSocketMixin from '../mixins/webSocketMixin';
// 
// export default {
//   mixins: [webSocketMixin],
//   mounted() {
//     this.initWebSocket();
//     this.addSocketListener('newMessage', this.handleNewMessage);
//   }
// }
// ============================================================
export default {
  data() {
    return {
      // WebSocket连接状态
      // 【类型】boolean
      // 【用途】在模板中显示连接状态，或控制某些功能的可用性
      // 【示例】<div v-if="socketConnected">已连接</div>
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
        // 【JSON.parse】将JSON字符串转为对象
        const user = JSON.parse(userStr);
        
        const currentUserId = user._id || user.id;
        
        if (!currentUserId) {
          console.warn('[WebSocketMixin] 无法获取用户ID');
          return false;
        }
        

        if (!this.$socket.isConnected) {
          // 连接并登录
          // 【connectAndLogin】一步完成连接和登录
          await this.$socket.connectAndLogin(currentUserId);
        }
        
        // ====================================================
        // 步骤4：更新连接状态
        // ====================================================
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
        // 【数据结构】{ event: '事件名', handler: 回调函数 }
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
  
  // ============================================================
  // 生命周期钩子
  // ============================================================
  // 【合并规则】
  // Mixin的生命周期钩子会与组件的生命周期钩子合并
  // 两者都会执行，先执行Mixin的，再执行组件的
  // 
  // 【执行顺序】
  // 1. Mixin的beforeCreate
  // 2. 组件的beforeCreate
  // 3. Mixin的created
  // 4. 组件的created
  // 5. Mixin的beforeMount
  // 6. 组件的beforeMount
  // 7. Mixin的mounted
  // 8. 组件的mounted
  // ... 以此类推
  // 
  // 【面试常问】
  // Q: Mixin和组件都有mounted，执行顺序是什么？
  // A: 先执行Mixin的，再执行组件的
  // ============================================================
  
  // ========================================================
  // beforeDestroy 钩子
  // ========================================================
  // 【触发时机】组件销毁之前
  // 【作用】清理资源，防止内存泄漏
  // 
  // 【为什么要在这里清理？】
  // 1. 组件即将销毁，不再需要监听事件
  // 2. 防止组件销毁后仍然收到事件
  // 3. 防止内存泄漏
  // 
  // 【面试常问】
  // Q: 为什么不在destroyed中清理？
  // A: destroyed时组件已销毁，可能无法正确访问this
  // 
  // Q: Vue 3中用什么替代beforeDestroy？
  // A: beforeUnmount
  // ========================================================
  beforeDestroy() {
    // 组件销毁前，自动清理所有监听器
    // 【重要】这是防止内存泄漏的关键！
    this.removeSocketListeners();
  }
};
