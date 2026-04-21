<!-- 
=============================================================================
  Messages.vue - 私信与通知组件（学习版·WebSocket知识点）
=============================================================================

【组件职责】
  这是私信与通知页面，负责：
  1. 私信功能：联系人列表、聊天界面、消息发送
  2. 通知功能：通知列表、标记已读、删除
  3. WebSocket实时通信
  4. 博客详情模态框

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. WebSocket实时消息接收                                               │
  │  2. 联系人列表与聊天界面联动                                            │
  │  3. 消息分页加载（滚动加载更多）                                         │
  │  4. 通知状态管理（已读/未读）                                            │
  │  5. Mixin混入模式复用代码                                               │
  │  6. 事件监听与清理                                                      │
  └─────────────────────────────────────────────────────────────────────────┘

【数据流向】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  用户输入消息 → sendMessage() → HTTP请求 + WebSocket发送               │
  │       ↓                                                                 │
  │  服务器接收 → 保存数据库 → 通过WebSocket推送给接收者                     │
  │       ↓                                                                 │
  │  接收者客户端 → socket.on('newMessage') → 更新messages数组             │
  │       ↓                                                                 │
  │  Vue响应式更新 → 视图自动刷新                                           │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  JavaScript WebSocket 知识点
=============================================================================

【1. WebSocket 基础概念】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是 WebSocket？】                                                  │
  │  - 一种在单个 TCP 连接上进行全双工通信的协议                            │
  │  - 服务器可以主动向客户端推送数据                                        │
  │  - 解决了 HTTP 只能客户端发起请求的问题                                  │
  │                                                                         │
  │  【WebSocket vs HTTP】                                                   │
  │  ┌──────────────┬───────────────────┬───────────────────────┐          │
  │  │    特性       │      HTTP         │      WebSocket        │          │
  │  ├──────────────┼───────────────────┼───────────────────────┤          │
  │  │  通信方式     │  半双工           │  全双工               │          │
  │  │  连接         │  短连接           │  长连接               │          │
  │  │  谁发起       │  只能客户端       │  双向都可以           │          │
  │  │  实时性       │  差（需轮询）     │  好（实时推送）       │          │
  │  │  开销         │  每次都要握手     │  只需一次握手         │          │
  │  └──────────────┴───────────────────┴───────────────────────┘          │
  │                                                                         │
  │  【面试题】Q: 为什么私信功能用 WebSocket 而不是 HTTP？                    │
  │  A: 1. 实时性：消息需要立即送达，不能等客户端轮询                        │
  │     2. 效率：避免频繁的 HTTP 轮询请求                                   │
  │     3. 服务器主动推送：新消息时服务器主动通知客户端                      │
  │                                                                         │
  │  【面试题】Q: WebSocket 连接断开后如何处理？                             │
  │  A: 1. 监听 close 事件，自动重连                                        │
  │     2. 设置重连间隔（指数退避策略）                                      │
  │     3. 重连失败后提示用户                                                │
  │                                                                         │
  │     // 重连示例                                                         │
  │     let reconnectAttempts = 0;                                         │
  │     socket.on('close', () => {                                         │
  │       setTimeout(() => {                                               │
  │         reconnectAttempts++;                                           │
  │         const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);  │
  │         setTimeout(reconnect, delay);                                  │
  │       }, 1000);                                                        │
  │     });                                                                 │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. Socket.io 事件机制】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【emit 发送事件】                                                       │
  │  socket.emit('eventName', data)                                        │
  │  - eventName: 事件名称                                                  │
  │  - data: 要发送的数据（自动序列化）                                     │
  │                                                                         │
  │  【on 监听事件】                                                         │
  │  socket.on('eventName', (data) => { /* 处理数据 */ })                  │
  │  - eventName: 要监听的事件名称                                          │
  │  - callback: 收到事件时的回调函数                                       │
  │                                                                         │
  │  【本项目使用的事件】                                                    │
  │  ┌─────────────────┬───────────────────────────────────────────┐       │
  │  │    事件名        │  用途                                     │       │
  │  ├─────────────────┼───────────────────────────────────────────┤       │
  │  │  newMessage     │  接收新私信                               │       │
  │  │  notification   │  接收新通知（点赞/评论/关注）              │       │
  │  │  join           │  用户上线，加入房间                       │       │
  │  │  disconnect     │  用户下线                                 │       │
  │  └─────────────────┴───────────────────────────────────────────┘       │
  │                                                                         │
  │  【面试题】Q: emit 和 send 有什么区别？                                  │
  │  A: emit 可以自定义事件名，send 默认使用 'message' 事件                 │
  │     socket.emit('customEvent', data)                                   │
  │     socket.send(data) // 等同于 socket.emit('message', data)           │
  │                                                                         │
  │  【面试题】Q: 如何给特定用户发送消息？                                   │
  │  A: 使用 Socket.io 的 room 机制                                        │
  │     // 服务器端                                                         │
  │     socket.join(userId)  // 用户连接时加入以userId命名的房间            │
  │     io.to(targetUserId).emit('newMessage', message)                    │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. Vue Mixin 混入模式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是 Mixin？】                                                      │
  │  - 一种代码复用机制                                                      │
  │  - 将组件的可复用选项（data、methods、生命周期）提取出来                │
  │  - 多个组件可以共享这些选项                                              │
  │                                                                         │
  │  【本项目使用的 Mixin】                                                  │
  │  - webSocketMixin: 提供 WebSocket 初始化和事件监听方法                  │
  │  - avatarMixin: 提供头像处理方法                                        │
  │                                                                         │
  │  【使用方式】                                                            │
  │  export default {                                                       │
  │    mixins: [webSocketMixin, avatarMixin],                               │
  │    // 组件自己的选项...                                                 │
  │  }                                                                      │
  │                                                                         │
  │  【Mixin 合并策略】                                                      │
  │  ┌──────────────┬─────────────────────────────────────────────┐        │
  │  │   选项类型    │  合并策略                                   │        │
  │  ├──────────────┼─────────────────────────────────────────────┤        │
  │  │  data        │  合并，组件优先                             │        │
  │  │  methods     │  合并，组件优先                             │        │
  │  │  生命周期     │  合并为数组，先执行 mixin 的                │        │
  │  │  computed    │  合并，组件优先                             │        │
  │  │  watch       │  合并为数组，都执行                         │        │
  │  └──────────────┴─────────────────────────────────────────────┘        │
  │                                                                         │
  │  【面试题】Q: Mixin 和 组件的选项冲突时怎么处理？                        │
  │  A: 1. data、methods、computed：组件选项优先覆盖                        │
  │     2. 生命周期钩子：两个都会执行，mixin 的先执行                       │
  │     3. watch：两个都会执行                                              │
  │                                                                         │
  │  【面试题】Q: Mixin 有什么缺点？                                         │
  │  A: 1. 命名冲突：多个 mixin 可能有同名方法                              │
  │     2. 来源不明确：使用时不知道方法来自哪个 mixin                       │
  │     3. Vue 3 推荐使用 Composition API 替代                             │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 消息分页加载】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【实现思路】                                                            │
  │  1. 监听滚动事件                                                        │
  │  2. 判断是否滚动到顶部                                                   │
  │  3. 加载上一页消息                                                       │
  │  4. 保持滚动位置                                                         │
  │                                                                         │
  │  【关键代码】                                                            │
  │  handleScroll() {                                                       │
  │    const container = this.$refs.messagesContainer;                     │
  │    // 滚动到顶部时加载更多                                              │
  │    if (container.scrollTop === 0 && this.hasMoreMessages) {            │
  │      this.loadMoreMessages();                                          │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 加载更多消息后如何保持滚动位置？                            │
  │  A: 记录加载前的滚动高度，加载后调整 scrollTop                          │
  │     const oldHeight = container.scrollHeight;                          │
  │     await loadMoreMessages();                                          │
  │     const newHeight = container.scrollHeight;                          │
  │     container.scrollTop = newHeight - oldHeight;                       │
  │                                                                         │
  │  【面试题】Q: 如何防止滚动加载的重复请求？                               │
  │  A: 使用 isLoadingMore 标志位                                          │
  │     if (this.isLoadingMore || !this.hasMoreMessages) return;           │
  │     this.isLoadingMore = true;                                         │
  │     // 加载完成后设置为 false                                           │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【5. 未读消息计数】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【数据结构】                                                            │
  │  unreadCounts: {                                                        │
  │    'userId1': 3,  // 用户1有3条未读                                     │
  │    'userId2': 1,  // 用户2有1条未读                                     │
  │  }                                                                      │
  │                                                                         │
  │  【更新逻辑】                                                            │
  │  1. 收到新消息时：unreadCounts[senderId]++                             │
  │  2. 打开聊天时：markAsRead() 清零                                       │
  │  3. 总未读数：Object.values(unreadCounts).reduce((a, b) => a + b, 0)   │
  │                                                                         │
  │  【面试题】Q: 未读消息数如何实时更新到导航栏？                            │
  │  A: 1. Vuex/Pinia 全局状态管理                                         │
  │     2. 事件总线（Event Bus）                                            │
  │     3. provide/inject                                                   │
  │     本项目使用 localStorage + 定时刷新                                  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  HTML 结构知识点
=============================================================================

【1. 聊天界面布局】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【布局结构】                                                            │
  │  ┌──────────────────────────────────────────────────────────┐          │
  │  │  messages-container（主容器）                             │          │
  │  │  ┌────────────────┬───────────────────────────────────┐  │          │
  │  │  │ contacts-sidebar │          chat-area              │  │          │
  │  │  │   (300px)       │           (flex: 1)              │  │          │
  │  │  │                 │  ┌─────────────────────────────┐ │  │          │
  │  │  │  联系人列表      │  │ chat-header                 │ │  │          │
  │  │  │                 │  ├─────────────────────────────┤ │  │          │
  │  │  │                 │  │ chat-messages               │ │  │          │
  │  │  │                 │  │ (flex: 1, overflow-y: auto) │ │  │          │
  │  │  │                 │  ├─────────────────────────────┤ │  │          │
  │  │  │                 │  │ chat-input-area             │ │  │          │
  │  │  │                 │  └─────────────────────────────┘ │  │          │
  │  │  └────────────────┴───────────────────────────────────┘  │          │
  │  └──────────────────────────────────────────────────────────┘          │
  │                                                                         │
  │  【Flexbox 布局要点】                                                    │
  │  - display: flex 创建弹性容器                                          │
  │  - flex: 1 占据剩余空间                                                 │
  │  - flex-shrink: 0 防止收缩                                              │
  │  - overflow-y: auto 内容溢出时滚动                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 消息气泡样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【发送的消息（右侧）】                                                   │
  │  .message-item.sent {                                                   │
  │    align-self: flex-end;           // 靠右对齐                          │
  │    background: pink;               // 粉色背景                          │
  │    border-bottom-right-radius: 4px; // 右下角小圆角（对话气泡效果）     │
  │  }                                                                      │
  │                                                                         │
  │  【接收的消息（左侧）】                                                   │
  │  .message-item.received {                                               │
  │    align-self: flex-start;         // 靠左对齐                          │
  │    background: white;              // 白色背景                          │
  │    border-bottom-left-radius: 4px; // 左下角小圆角                      │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 如何实现消息气泡的尖角效果？                                │
  │  A: 使用 CSS 伪元素 ::after 或 ::before                                 │
  │     .message-item.sent::after {                                        │
  │       content: '';                                                     │
  │       position: absolute;                                              │
  │       right: -8px;                                                     │
  │       border: 8px solid transparent;                                   │
  │       border-left-color: pink;                                         │
  │     }                                                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 未读角标实现】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【HTML 结构】                                                           │
  │  <button class="tab-btn">                                               │
  │    通知                                                                 │
  │    <span v-if="unreadCount > 0" class="tab-badge">{{ unreadCount }}</span>│
  │  </button>                                                              │
  │                                                                         │
  │  【CSS 样式】                                                            │
  │  .tab-badge {                                                           │
  │    position: absolute;        // 绝对定位                              │
  │    top: -5px;                 // 向上偏移                              │
  │    right: -5px;               // 向右偏移                              │
  │    background: red;           // 红色背景                              │
  │    border-radius: 10px;       // 圆形                                  │
  │    min-width: 20px;           // 最小宽度                              │
  │    padding: 2px 6px;          // 内边距                                │
  │    font-size: 12px;           // 小字体                                │
  │    color: white;              // 白色文字                              │
  │  }                                                                       │
  │                                                                         │
  │  【面试题】Q: 角标数字超过99如何显示？                                    │
  │  A: {{ unreadCount > 99 ? '99+' : unreadCount }}                       │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  CSS 样式知识点
=============================================================================

【1. Flexbox 布局详解】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【容器属性】                                                            │
  │  display: flex;              // 定义弹性容器                            │
  │  flex-direction: row;        // 主轴方向（默认水平）                    │
  │  justify-content: center;    // 主轴对齐                                │
  │  align-items: center;        // 交叉轴对齐                              │
  │  flex-wrap: wrap;            // 允许换行                                │
  │  gap: 10px;                  // 子元素间距                              │
  │                                                                         │
  │  【子元素属性】                                                          │
  │  flex: 1;                    // 等于 flex-grow: 1                       │
  │  flex-shrink: 0;             // 不允许收缩                              │
  │  align-self: flex-end;       // 单独设置交叉轴对齐                      │
  │  order: 1;                   // 排列顺序                                │
  │                                                                         │
  │  【面试题】Q: flex: 1 是什么意思？                                       │
  │  A: 是 flex-grow: 1; flex-shrink: 1; flex-basis: 0%; 的简写            │
  │     表示元素可以放大、可以缩小、初始大小为0                              │
  │                                                                         │
  │  【面试题】Q: 如何实现左侧固定宽度，右侧自适应？                          │
  │  A: .left { width: 300px; flex-shrink: 0; }                            │
  │     .right { flex: 1; }                                                │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 渐变背景】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【线性渐变】                                                            │
  │  background: linear-gradient(135deg, #fff 0%, #fce7f3 100%);           │
  │  - 135deg: 渐变角度                                                     │
  │  - #fff 0%: 起点颜色                                                    │
  │  - #fce7f3 100%: 终点颜色                                               │
  │                                                                         │
  │  【径向渐变】                                                            │
  │  background: radial-gradient(circle, #fff, #fce7f3);                   │
  │                                                                         │
  │  【面试题】Q: 渐变角度如何理解？                                         │
  │  A: 0deg = 从下到上，90deg = 从左到右，180deg = 从上到下               │
  │     135deg = 从左上角到右下角                                           │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 滚动条样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【隐藏滚动条但保持滚动功能】                                            │
  │  .contacts-list {                                                       │
  │    overflow-y: auto;              // 允许垂直滚动                       │
  │    -ms-overflow-style: none;      // IE/Edge 隐藏滚动条                │
  │    scrollbar-width: none;         // Firefox 隐藏滚动条                │
  │  }                                                                      │
  │  .contacts-list::-webkit-scrollbar {                                   │
  │    display: none;                 // Chrome/Safari 隐藏滚动条          │
  │  }                                                                      │
  │                                                                         │
  │  【自定义滚动条样式】                                                    │
  │  .chat-messages::-webkit-scrollbar {                                   │
  │    width: 6px;                    // 滚动条宽度                         │
  │  }                                                                      │
  │  .chat-messages::-webkit-scrollbar-thumb {                             │
  │    background: pink;              // 滚动条颜色                         │
  │    border-radius: 3px;            // 圆角                               │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么要隐藏滚动条？                                       │
  │  A: 1. 美观：默认滚动条样式不统一                                        │
  │     2. 移动端：原生滚动条占用空间                                        │
  │     3. 自定义：需要自定义滚动条样式                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 过渡动画】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【transition 基础】                                                     │
  │  transition: all 0.3s ease;                                            │
  │  - all: 监听所有属性变化                                                │
  │  - 0.3s: 动画持续时间                                                   │
  │  - ease: 缓动函数（先快后慢）                                           │
  │                                                                         │
  │  【常用缓动函数】                                                        │
  │  - linear: 匀速                                                         │
  │  - ease: 先快后慢                                                       │
  │  - ease-in: 先慢后快                                                    │
  │  - ease-out: 先快后慢                                                   │
  │  - ease-in-out: 两头慢中间快                                            │
  │                                                                         │
  │  【面试题】Q: transition 和 animation 有什么区别？                       │
  │  A: transition: 需要触发条件，只能从A到B                                │
  │     animation: 自动执行，可以定义多个关键帧                              │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【5. 响应式设计】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【媒体查询】                                                            │
  │  @media (max-width: 768px) {                                           │
  │    .contacts-sidebar {                                                 │
  │      width: 100%;        // 移动端全宽                                  │
  │    }                                                                   │
  │    .chat-area {                                                        │
  │      display: none;      // 移动端隐藏聊天区                            │
  │    }                                                                   │
  │  }                                                                      │
  │                                                                         │
  │  【移动端适配方案】                                                      │
  │  1. rem + 动态 html font-size                                          │
  │  2. vw/vh 视口单位                                                      │
  │  3. 媒体查询断点                                                        │
  │  4. Flexbox 弹性布局                                                    │
  │                                                                         │
  │  【面试题】Q: 移动端 1px 边框问题如何解决？                              │
  │  A: 使用 transform: scaleY(0.5) 缩放                                   │
  │     .border-1px::after {                                               │
  │       content: '';                                                     │
  │       position: absolute;                                              │
  │       left: 0;                                                         │
  │       bottom: 0;                                                       │
  │       width: 100%;                                                     │
  │       height: 1px;                                                     │
  │       background: #ddd;                                                │
  │       transform: scaleY(0.5);                                          │
  │     }                                                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  面试题汇总
=============================================================================

【WebSocket 相关】
  Q1: WebSocket 和 HTTP 长轮询有什么区别？
  A: HTTP 长轮询：客户端定时发送请求，服务器有数据才返回
     WebSocket：建立连接后，服务器可主动推送，无需客户端请求

  Q2: 如何保证 WebSocket 消息不丢失？
  A: 1. 消息确认机制（ACK）
     2. 离线消息存储到数据库
     3. 用户上线时拉取离线消息
     4. 消息重发机制

  Q3: WebSocket 连接数有限制吗？
  A: 有，浏览器对同一域名的 WebSocket 连接数有限制（通常6个）
     服务器端也有最大连接数限制，需要考虑负载均衡

【Vue 相关】
  Q4: 为什么在 beforeDestroy 中移除事件监听？
  A: 防止内存泄漏。组件销毁后，如果事件监听器还在，会导致：
     1. 内存无法释放
     2. 回调函数可能报错（引用了已销毁组件的数据）

  Q5: $nextTick 的作用是什么？
  A: 在 DOM 更新后执行回调。本项目用于：
     消息添加后，等待 DOM 更新，再滚动到底部

【性能优化】
  Q6: 如何优化大量消息的渲染性能？
  A: 1. 虚拟滚动（只渲染可见区域的消息）
     2. 分页加载（不要一次性加载所有消息）
     3. 使用 Object.freeze 冻结不需要响应式的数据
     4. 图片懒加载

  Q7: 联系人列表搜索如何优化？
  A: 1. 防抖（debounce）减少计算频率
     2. 使用 computed 缓存计算结果
     3. 大数据量时使用虚拟列表

=============================================================================
-->
<template>
  <div class="messages-container">
    <!-- 页面标题 -->
    <div class="messages-header">
      <h1>私信与通知</h1>
    </div>
    
    <!-- ============================================================ -->
    <!-- 标签页导航 -->
    <!-- ============================================================ -->
    <!-- 【作用】切换通知/私信两个标签页 -->
    <!-- 【:class】动态绑定active类，当前标签显示高亮 -->
    <!-- 【tab-badge】未读数量角标 -->
    <!-- ============================================================ -->
    <div class="messages-tabs">
      <!-- 通知标签 -->
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'notifications' }"
        @click="switchTab('notifications')"
      >
        通知
        <!-- 未读数量角标（有未读时显示） -->
        <span v-if="unreadNotificationCount > 0" class="tab-badge">{{ unreadNotificationCount }}</span>
      </button>
      <!-- 私信标签 -->
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'messages' }"
        @click="switchTab('messages')"
      >
        私信
        <!-- 未读数量角标（有未读时显示） -->
        <span v-if="unreadMessageCount > 0" class="tab-badge">{{ unreadMessageCount }}</span>
      </button>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="messages-content">
      <!-- ============================================================ -->
      <!-- 私信内容区域 -->
      <!-- ============================================================ -->
      <!-- 【v-if】只在私信标签激活时显示 -->
      <!-- 【布局】左侧联系人列表 + 右侧聊天区域 -->
      <!-- ============================================================ -->
      <div v-if="activeTab === 'messages'" class="messages-section">
        
        <!-- 左侧联系人列表 -->
        <div class="contacts-sidebar">
          <div class="contacts-header">
            <h3>联系人</h3>
            <!-- 搜索框 -->
            <div class="search-box">
              <input type="text" v-model="searchQuery" placeholder="搜索联系人..." class="search-input">
            </div>
          </div>
          
          <!-- 联系人列表 -->
          <div class="contacts-list">
            <!-- 加载状态 -->
            <div v-if="isLoadingContacts" class="loading-state">
              <div class="spinner"></div>
              <p>加载中...</p>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="contacts.length === 0" class="empty-state">
              <span class="nav-icon">✉️</span>
              <p>暂无联系人</p>
              <p>关注用户后可以开始私信</p>
            </div>
            
            <!-- 联系人列表项 -->
            <!-- 【v-for】循环渲染联系人 -->
            <!-- 【:class】选中状态高亮 -->
            <div 
              v-for="contact in filteredContacts" 
              :key="contact._id"
              class="contact-item"
              :class="{ active: selectedContact && selectedContact._id === contact._id }"
              @click="selectContact(contact)"
            >
              <!-- 联系人头像 -->
              <img :src="getContactAvatar(contact)" :alt="contact.username" class="contact-avatar" @error="handleAvatarError($event, contact.username, 40)">
              <div class="contact-info">
                <div class="contact-name">{{ contact.username }}</div>
                <!-- 最后一条消息预览 -->
                <div class="last-message">{{ getLastMessage(contact._id) }}</div>
              </div>
              <div class="contact-actions">
                <!-- 未读消息数量角标 -->
                <div v-if="getUnreadCount(contact._id) > 0" class="unread-badge">{{ getUnreadCount(contact._id) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧聊天区域 -->
        <div class="chat-area">
          <!-- 未选择联系人时的提示 -->
          <div v-if="!selectedContact" class="no-contact-selected">
            <span class="nav-icon">💬</span>
            <h3>选择一个联系人开始聊天</h3>
            <p>点击左侧联系人列表中的用户开始私信</p>
          </div>
          
          <!-- 聊天容器 -->
          <div v-else class="chat-container">
            <!-- 聊天头部 -->
            <div class="chat-header">
              <div class="chat-contact-info">
                <img :src="getContactAvatar(selectedContact)" :alt="selectedContact.username" class="chat-contact-avatar" @error="handleAvatarError($event, selectedContact.username, 40)">
                <div class="chat-contact-name">{{ selectedContact.username }}</div>
              </div>
              <div class="chat-actions">
                <button class="btn-secondary" @click="clearChat">
                  <span class="nav-icon">🗑️</span> 清空聊天
                </button>
              </div>
            </div>
            
            <!-- ============================================================ -->
            <!-- 聊天消息区域 -->
            <!-- ============================================================ -->
            <!-- 【ref】用于获取DOM元素，实现滚动控制 -->
            <!-- 【@scroll】监听滚动事件，实现分页加载 -->
            <!-- ============================================================ -->
            <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
              <!-- 加载状态 -->
              <div v-if="isLoadingMessages" class="loading-state">
                <div class="spinner"></div>
                <p>加载消息中...</p>
              </div>
              
              <!-- 空聊天状态 -->
              <div v-else-if="messages.length === 0" class="empty-chat">
                <p>开始与 {{ selectedContact.username }} 聊天吧</p>
              </div>
              
              <!-- 消息列表 -->
              <div v-else class="messages-list">
                <!-- 加载更多指示器 -->
                <div v-if="isLoadingMore" class="loading-more">
                  <div class="spinner small"></div>
                  <p>加载更多消息...</p>
                </div>
                
                <!-- 消息项 -->
                <!-- 【:class】根据发送者设置不同样式 -->
                <!-- sent：我发送的消息（右侧粉色） -->
                <!-- received：对方发送的消息（左侧白色） -->
                <div 
                  v-for="(message, index) in messages" 
                  :key="message._id || index"
                  :class="['message-item', message.sender === currentUserId ? 'sent' : 'received']"
                >
                  <!-- 对方消息：头像在左，内容在右 -->
                  <div v-if="message.sender !== currentUserId" class="message-avatar left">
                    <img :src="getMessageSenderAvatar(message)" :alt="message.senderUsername" class="avatar-img" @error="handleAvatarError($event, message.senderUsername, 30)">
                  </div>
                  <!-- 消息内容 -->
                  <div class="message-content">
                    <div class="message-text">{{ message.content }}</div>
                    <div class="message-time">{{ formatDate(message.createdAt) }}</div>
                  </div>
                  <!-- 我方消息：头像在右，内容在左 -->
                  <div v-if="message.sender === currentUserId" class="message-avatar right">
                    <img :src="getCurrentUserAvatar()" :alt="'我'" class="avatar-img" @error="handleAvatarError($event, 'Me', 30)">
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ============================================================ -->
            <!-- 消息输入区域 -->
            <!-- ============================================================ -->
            <!-- 【@keydown.enter.prevent】按Enter发送消息 -->
            <!-- 【.prevent】阻止默认换行行为 -->
            <!-- 【:disabled】输入为空时禁用发送按钮 -->
            <!-- ============================================================ -->
            <div class="chat-input-area">
              <textarea 
                v-model="messageInput"
                placeholder="输入消息..."
                class="message-input"
                @keydown.enter.prevent="sendMessage"
              ></textarea>
              <button class="btn-primary send-btn" @click="sendMessage" :disabled="!messageInput.trim()">
                <span class="nav-icon">✈️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- ============================================================ -->
      <!-- 通知内容区域 -->
      <!-- ============================================================ -->
      <!-- 【v-else-if】只在通知标签激活时显示 -->
      <!-- 【包含】点赞、评论、收藏、关注等通知 -->
      <!-- ============================================================ -->
      <div v-else-if="activeTab === 'notifications'" class="notifications-section">

        
        <!-- 通知列表 -->
        <div class="notifications-list">
          <!-- 加载状态 -->
          <div v-if="isLoadingNotifications" class="loading-state">
            <div class="spinner"></div>
            <p>加载通知中...</p>
          </div>
          
          <!-- 通知项 -->
          <!-- 【:class】未读通知有特殊样式 -->
          <div 
            class="notification-item" 
            v-for="notification in filteredNotifications" 
            :key="notification._id"
            :class="{ unread: !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <!-- 发送者头像 -->
            <div class="notification-avatar">
              <img :src="getNotificationAvatar(notification)" alt="用户头像" class="avatar-img">
              <!-- 未读指示器 -->
              <div v-if="!notification.isRead" class="unread-indicator"></div>
            </div>
            
            <!-- 通知内容 -->
            <div class="notification-content">
              <div class="notification-text">
                <span class="sender-name">{{ notification.sender.username }}</span>
                <span class="notification-action">{{ getNotificationActionText(notification.type) }}</span>
                <span class="notification-target" v-if="notification.resourceType === 'blog'">你的文章</span>
                <span class="notification-target" v-else-if="notification.resourceType === 'comment'">你的评论</span>
              </div>
              <!-- 通知详情内容 -->
              <div class="notification-detail" v-if="notification.content">
                {{ notification.content }}
              </div>
              <!-- 通知元信息 -->
              <div class="notification-meta">
                <span class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</span>
                <div class="notification-actions">
                  <!-- 删除按钮 -->
                  <button 
                    class="notification-action-btn delete-btn" 
                    @click.stop="deleteNotification(notification._id)"
                  >
                    <span class="nav-icon">🗑️</span> 删除
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 通知图标 -->
            <div class="notification-icon">
              <span class="nav-icon">{{ getNotificationIcon(notification.type) }}</span>
            </div>
          </div>
          
          <!-- 空通知状态 -->
          <div v-if="!isLoadingNotifications && notifications.length === 0" class="empty-notifications">
            <span class="nav-icon">🔔</span>
            <h3>暂无通知</h3>
            <p>当有新的通知时，会显示在这里</p>
          </div>
        </div>
      </div>
    </div>
    

  
  <!-- 博客详情模态框 -->
  <BlogModal 
    v-if="showBlogModal" 
    :visible="showBlogModal" 
    :blog="currentBlog" 
    :user="currentUser"
    @close="closeBlogModal"
  />
  </div>
</template>

<script>
// ============================================================
// Messages.vue - 私信与通知组件脚本
// ============================================================
// 【导入说明】
// - BlogModal: 博客详情弹窗组件
// - showNotification: 通知提示工具函数
// - avatarMixin: 头像处理混入
// - webSocketMixin: WebSocket通信混入
// - auth: 认证状态管理
// ============================================================
import BlogModal from './BlogModal.vue';
import { showNotification } from '../utils/notification';
import avatarMixin from '../mixins/avatarMixin';
import webSocketMixin from '../mixins/webSocketMixin';
import auth from '../utils/auth';

export default {
  name: 'Messages',
  // 【mixins】混入可复用的组件选项
  // avatarMixin: 提供头像处理方法
  // webSocketMixin: 提供WebSocket初始化和事件监听方法
  mixins: [avatarMixin, webSocketMixin],
  components: {
    BlogModal
  },
  data() {
    return {
      // ============================================================
      // 私信相关数据
      // ============================================================
      // 【contacts】
      // 类型：Array
      // 作用：存储联系人列表
      // 数据结构：[{ _id, username, avatar, ... }, ...]
      // ============================================================
      contacts: [],
      
      // 【messages】
      // 类型：Array
      // 作用：存储当前聊天的消息列表
      // 数据结构：[{ _id, content, sender, createdAt, ... }, ...]
      messages: [],
      
      // 【selectedContact】
      // 类型：Object | null
      // 作用：当前选中的联系人
      // 使用场景：显示聊天界面、发送消息
      selectedContact: null,
      
      // 【messageInput】
      // 类型：String
      // 作用：存储用户输入的消息内容
      // 使用场景：v-model双向绑定
      messageInput: '',
      
      // 【isLoadingContacts】
      // 类型：Boolean
      // 作用：标记联系人列表是否正在加载
      isLoadingContacts: false,
      
      // 【isLoadingMessages】
      // 类型：Boolean
      // 作用：标记消息是否正在加载
      isLoadingMessages: false,
      
      // 【isLoadingMore】
      // 类型：Boolean
      // 作用：标记是否正在加载更多消息
      // 使用场景：滚动分页加载
      isLoadingMore: false,
      
      // 【searchQuery】
      // 类型：String
      // 作用：存储搜索关键词
      // 使用场景：过滤联系人列表
      searchQuery: '',
      
      // 【currentUserId】
      // 类型：String
      // 作用：当前登录用户的ID
      // 使用场景：判断消息发送者
      currentUserId: '',
      
      // 【unreadCounts】
      // 类型：Object
      // 作用：存储每个联系人的未读消息数
      // 数据结构：{ userId: count, ... }
      unreadCounts: {},
      
      // 【lastMessages】
      // 类型：Object
      // 作用：存储每个联系人的最后一条消息
      // 数据结构：{ userId: '消息内容', ... }
      lastMessages: {},
      
      // 【unreadMessageCount】
      // 类型：Number
      // 作用：私信总未读数
      // 使用场景：显示角标
      unreadMessageCount: 0,
      
      // 【messagePage】
      // 类型：Number
      // 作用：当前消息页码
      // 使用场景：分页加载消息
      messagePage: 1,
      
      // 【hasMoreMessages】
      // 类型：Boolean
      // 作用：标记是否还有更多消息
      // 使用场景：控制是否显示加载更多
      hasMoreMessages: true,
      
      // ============================================================
      // 通知相关数据
      // ============================================================
      // 【notifications】
      // 类型：Array
      // 作用：存储通知列表
      // 数据结构：[{ _id, type, sender, content, isRead, ... }, ...]
      notifications: [],
      
      // 【isLoadingNotifications】
      // 类型：Boolean
      // 作用：标记通知是否正在加载
      isLoadingNotifications: false,
      
      // 【unreadNotificationCount】
      // 类型：Number
      // 作用：通知未读数
      unreadNotificationCount: 0,
      
      // 【totalNotificationCount】
      // 类型：Number
      // 作用：通知总数
      totalNotificationCount: 0,
      
      // ============================================================
      // 标签页相关数据
      // ============================================================
      // 【activeTab】
      // 类型：String
      // 作用：当前激活的标签页
      // 可选值：'notifications'（通知）、'messages'（私信）
      activeTab: 'notifications',
      
      // ============================================================
      // 博客模态框相关数据
      // ============================================================
      // 【showBlogModal】
      // 类型：Boolean
      // 作用：控制博客详情弹窗显示
      showBlogModal: false,
      
      // 【currentBlog】
      // 类型：Object | null
      // 作用：当前显示的博客数据
      currentBlog: null,
      
      // 【currentUser】
      // 类型：Object | null
      // 作用：当前登录用户信息
      currentUser: null

    };
  },
  computed: {
    // ============================================================
    // 计算属性 - 过滤后的联系人列表
    // ============================================================
    // 【作用】根据搜索关键词过滤联系人
    // 【触发】searchQuery变化时自动重新计算
    // ============================================================
    filteredContacts() {
      if (!this.searchQuery) {
        return this.contacts;
      }
      // 根据用户名过滤（不区分大小写）
      return this.contacts.filter(contact => 
        contact.username.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
    
    // 过滤后的通知列表（目前直接返回全部）
    filteredNotifications() {
      return this.notifications;
    }
  },
  
  // ============================================================
  // 生命周期钩子 - created
  // ============================================================
  // 【调用时机】组件实例创建完成后
  // 【作用】初始化数据
  // 【注意】此时DOM还未挂载，不能访问$refs
  // ============================================================
  created() {
    this.fetchCurrentUser();
    this.fetchContacts();
    this.fetchNotifications();
  },
  
  // ============================================================
  // 生命周期钩子 - mounted
  // ============================================================
  // 【调用时机】组件挂载到DOM后
  // 【作用】初始化WebSocket连接
  // 【注意】此时可以访问$refs
  // ============================================================
  mounted() {
    this.setupWebSocket();
  },
  
  // ============================================================
  // 生命周期钩子 - beforeDestroy
  // ============================================================
  // 【调用时机】组件销毁之前
  // 【作用】清理资源
  // 【清理内容】
  // 1. 恢复页面滚动
  // 2. 移除WebSocket监听器
  // ============================================================
  beforeDestroy() {
    document.body.style.overflow = '';
    this.removeSocketListeners();
  },
  methods: {
    // ============================================================
    // 初始化并设置WebSocket
    // ============================================================
    // 【作用】建立WebSocket连接并设置事件监听
    // 【流程】
    // 1. 确保已获取当前用户ID
    // 2. 初始化WebSocket连接
    // 3. 设置事件监听器
    // 
    // 【面试常问】
    // Q: 为什么需要currentUserId？
    // A: WebSocket需要识别用户身份，用于接收定向消息
    // ============================================================
    async setupWebSocket() {
      try {
        // 确保已获取当前用户ID
        if (!this.currentUserId) {
          await this.fetchCurrentUser();
        }
        // 初始化WebSocket连接（来自webSocketMixin）
        const connected = await this.initWebSocket();
        if (connected) {
          // 设置事件监听器
          this.setupSocketListeners();
        }
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    },
    
    // ============================================================
    // 设置WebSocket事件监听
    // ============================================================
    // 【作用】监听服务器推送的消息和通知
    // 【事件类型】
    // - newMessage: 收到新私信
    // - notification: 收到新通知
    // 
    // 【面试常问】
    // Q: 如何区分消息发送者？
    // A: 通过message.sender字段判断
    // 
    // Q: 收到消息后如何更新UI？
    // A: 如果正在与发送者聊天，直接添加到messages数组；
    //    否则更新未读计数
    // ============================================================
    setupSocketListeners() {
      // 监听新消息事件
      this.addSocketListener('newMessage', (message) => {
        // 获取发送者ID（处理对象和字符串两种格式）
        const senderId = typeof message.sender === 'object' 
          ? message.sender._id.toString() 
          : message.sender.toString();
        
        // 判断是否正在与发送者聊天
        if (this.selectedContact && senderId === this.selectedContact._id) {
          // 正在聊天：直接添加消息到列表
          const newMessage = {
            ...message,
            senderInfo: typeof message.sender === 'object' ? message.sender : null,
            sender: senderId
          };
          this.messages.push(newMessage);
          // 更新最后一条消息
          this.lastMessages[this.selectedContact._id] = message.content;
          // 滚动到底部
          this.scrollToBottom();
        } else {
          // 不在聊天：更新未读计数
          if (!this.lastMessages[senderId]) {
            this.lastMessages[senderId] = message.content;
          }
          if (!this.unreadCounts[senderId]) {
            this.unreadCounts[senderId] = 0;
          }
          this.unreadCounts[senderId]++;
          this.unreadMessageCount++;
        }
      });
      
      // 监听新通知事件
      this.addSocketListener('notification', (notification) => {
        // 将新通知添加到列表开头
        this.notifications.unshift(notification);
        this.unreadNotificationCount++;
        this.totalNotificationCount++;
      });
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}`;
    },
    
    // 获取当前用户信息
    async fetchCurrentUser() {
      try {
        const response = await this.$http.auth.getCurrentUser();
        if (response.data) {
          this.currentUserId = response.data._id.toString();
          this.currentUser = response.data;
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    },
    
    // 获取联系人列表
    async fetchContacts() {
      try {
        this.isLoadingContacts = true;
        const response = await this.$http.messages.getContacts();
        if (response.success) {
          this.contacts = response.data;
          
          // 为每个联系人获取最后一条消息
          for (const contact of this.contacts) {
            await this.fetchLastMessage(contact._id);
          }
        }
      } catch (error) {
        console.error('获取联系人列表失败:', error);
        // 清除模拟数据，显示真实的空状态
        this.contacts = [];
      } finally {
        this.isLoadingContacts = false;
      }
    },
    
    // 获取指定联系人的最后一条消息
    async fetchLastMessage(userId) {
      try {
        const response = await this.$http.messages.getHistory(userId, {
          page: 1,
          limit: 1
        });
        if (response.success && response.data.length > 0) {
          const lastMessage = response.data[0];
          this.lastMessages[userId] = lastMessage.content;
        } else {
          this.lastMessages[userId] = '无消息';
        }
      } catch (error) {
        console.error(`获取联系人 ${userId} 的最后一条消息失败:`, error);
        this.lastMessages[userId] = '无消息';
      }
    },
    
    // 获取与特定用户的消息历史
    async fetchMessages(userId) {
      try {
        this.isLoadingMessages = true;
        const response = await this.$http.messages.getHistory(userId, {
          page: 1,
          limit: 20
        });
        if (response.success) {
          this.messages = response.data.map(message => {
            const processed = { ...message };
            if (typeof message.sender === 'object' && message.sender._id) {
              processed.senderInfo = message.sender;
              processed.sender = message.sender._id.toString();
            } else if (typeof message.sender !== 'string') {
              processed.sender = message.sender.toString();
            }
            return processed;
          });
          
          if (this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            this.lastMessages[userId] = lastMessage.content;
          } else {
            this.lastMessages[userId] = '无消息';
          }
          
          // 确保 DOM 完全渲染后再滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      } catch (error) {
        console.error('获取消息历史失败:', error);
      } finally {
        this.isLoadingMessages = false;
      }
    },
    
    // 选择联系人
    selectContact(contact) {
      this.selectedContact = contact;
      this.resetMessageState();
      this.fetchMessages(contact._id);
      // 标记消息为已读
      this.markAsRead(contact._id);
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.selectedContact || !this.messageInput.trim()) return;
      
      try {
        const response = await this.$http.messages.send({
          receiver: this.selectedContact._id,
          content: this.messageInput.trim()
        });
        
        if (response.success) {
          const newMessage = response.data;
          if (typeof newMessage.sender === 'object' && newMessage.sender._id) {
            newMessage.senderInfo = newMessage.sender;
            newMessage.sender = newMessage.sender._id.toString();
          } else {
            newMessage.sender = newMessage.sender.toString();
          }
          this.messages.push(newMessage);
          
          this.lastMessages[this.selectedContact._id] = newMessage.content;
          
          this.messageInput = '';
          this.scrollToBottom();
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        if (error.response && error.response.status === 403) {
          showNotification('发送消息失败：' + error.response.data.message || '请先关注对方才能发送消息', 'error');
        } else {
          showNotification('发送消息失败，请稍后重试', 'error');
        }
      }
    },
    
    // 处理滚动事件
    handleScroll() {
      const container = this.$refs.messagesContainer;
      if (!container) return;
      
      // 当滚动到顶部附近时加载更多消息（留出 50px 缓冲）
      if (container.scrollTop < 50 && this.hasMoreMessages && !this.isLoadingMore) {
        this.loadMoreMessages();
      }
    },
    
    // 加载更多消息（向上滚动加载历史消息）
    async loadMoreMessages() {
      if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return;
      
      try {
        this.isLoadingMore = true;
        
        // 记录加载前的滚动位置和容器高度
        const container = this.$refs.messagesContainer;
        const oldScrollTop = container.scrollTop;
        const oldScrollHeight = container.scrollHeight;
        
        // 加载下一页（更旧的消息）
        this.messagePage++;
        
        const response = await this.$http.messages.getHistory(this.selectedContact._id, {
          page: this.messagePage,
          limit: 20
        });
        
        if (response.success) {
          const newMessages = response.data;
          if (newMessages.length === 0) {
            this.hasMoreMessages = false;
          } else {
            const processedMessages = newMessages.map(message => {
              const processed = { ...message };
              if (typeof message.sender === 'object' && message.sender._id) {
                processed.senderInfo = message.sender;
                processed.sender = message.sender._id.toString();
              } else if (typeof message.sender !== 'string') {
                processed.sender = message.sender.toString();
              }
              return processed;
            });
            
            // 旧消息插入到数组前面
            this.messages = [...processedMessages, ...this.messages];
            
            // 加载完成后，恢复滚动位置（让用户感觉不到跳动）
            this.$nextTick(() => {
              const newScrollHeight = container.scrollHeight;
              const addedHeight = newScrollHeight - oldScrollHeight;
              container.scrollTop = oldScrollTop + addedHeight;
            });
          }
        }
      } catch (error) {
        console.error('加载更多消息失败:', error);
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    // 重置消息状态
    resetMessageState() {
      this.messages = [];
      this.messagePage = 1;
      this.hasMoreMessages = true;
      this.isLoadingMore = false;
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          // 确保容器已经渲染完成
          container.scrollTop = container.scrollHeight;
          
          // 如果还没滚动到底部，再试一次（兼容某些浏览器）
          setTimeout(() => {
            if (container.scrollTop < container.scrollHeight - 100) {
              container.scrollTop = container.scrollHeight;
            }
          }, 100);
        }
      });
    },
    
    // 标记消息为已读
    async markAsRead(userId) {
      try {
        await this.$http.messages.markAsRead({
          userId: userId
        });
        // 清除未读计数
        this.unreadCounts[userId] = 0;
      } catch (error) {
        console.error('标记消息为已读失败:', error);
      }
    },
    
    // 标记通知为已读
    async markNotificationAsRead(notificationId) {
      try {
        await this.$http.notifications.markAsRead(notificationId);
        // 从通知列表中移除或标记为已读
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      } catch (error) {
        console.error('标记通知为已读失败:', error);
      }
    },
    
    // 清空聊天
    clearChat() {
      if (confirm('确定要清空聊天记录吗？')) {
        this.messages = [];
      }
    },
    
    // 获取联系人头像
    getContactAvatar(contact) {
      return this.getAvatar(contact, 40);
    },
    
    // 获取最后一条消息
    getLastMessage(userId) {
      return this.lastMessages[userId] || '无消息';
    },
    
    // 获取未读消息数
    getUnreadCount(userId) {
      return this.unreadCounts[userId] || 0;
    },
    
    // 获取消息发送者的头像
    getMessageSenderAvatar(message) {
      if (message.senderInfo) {
        return this.getAvatar(message.senderInfo, 30);
      }
      if (message.sender !== this.currentUserId && this.selectedContact) {
        return this.getAvatar(this.selectedContact, 30);
      }
      return this.getAvatar(null, 30);
    },
    
    // 获取当前用户的头像
    getCurrentUserAvatar() {
      const user = auth.getCurrentUser();
      return this.getAvatar(user, 30);
    },
    
    // 获取通知头像
    getNotificationAvatar(notification) {
      return this.getAvatar(notification.sender || notification, 40);
    },
    
    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'notifications' && this.notifications.length === 0) {
        this.fetchNotifications();
      }
    },
    

    
    // 获取通知列表
    async fetchNotifications() {
      try {
        this.isLoadingNotifications = true;
        const response = await this.$http.notifications.getList();
        
        if (response.success) {
          this.notifications = response.data;
          this.unreadNotificationCount = response.meta ? response.meta.unread : 0;
          this.totalNotificationCount = response.meta ? response.meta.total : 0;
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // 清除模拟数据，显示真实的空状态
        this.notifications = [];
        this.unreadNotificationCount = 0;
        this.totalNotificationCount = 0;
      } finally {
        this.isLoadingNotifications = false;
      }
    },
    
    // 处理通知点击
    handleNotificationClick(notification) {
      if (!notification.isRead) {
        this.markNotificationAsRead(notification._id);
      }
      if (notification.resourceType === 'blog' || notification.resourceType === 'comment') {
        this.fetchBlogDetail(notification.resourceId);
      } else if (notification.type === 'follow') {
        this.$router.push(`/profile/${notification.sender._id}`);
      }
    },
    
    // 获取博客详情并打开模态框
    async fetchBlogDetail(blogId) {
      try {
        const response = await this.$http.blogs.getDetail(blogId);
        if (response.success) {
          const blog = response.data;
          // 处理博客数据
          this.currentBlog = {
            ...blog,
            id: blog._id,
            date: new Date(blog.createdAt).toLocaleDateString('zh-CN')
          };
          // 打开模态框
          this.showBlogModal = true;
          // 禁用页面滚动
          document.body.style.overflow = 'hidden';
        }
      } catch (error) {
        console.error('获取博客详情失败:', error);
      }
    },
    
    // 关闭博客模态框
    closeBlogModal() {
      this.showBlogModal = false;
      this.currentBlog = null;
      // 恢复页面滚动
      document.body.style.overflow = '';
    },
    
    // 删除通知
    async deleteNotification(notificationId) {
      try {
        const response = await this.$http.notifications.delete(notificationId);
        
        if (response.success) {
          const deletedNotification = this.notifications.find(n => n._id === notificationId);
          this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
          this.totalNotificationCount--;
          
          if (!deletedNotification.isRead && this.unreadNotificationCount > 0) {
            this.unreadNotificationCount--;
          }
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        // 本地更新
        const deletedNotification = this.notifications.find(n => n._id === notificationId);
        this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
        this.totalNotificationCount--;
        
        if (!deletedNotification.isRead && this.unreadNotificationCount > 0) {
          this.unreadNotificationCount--;
        }
      }
    },
    
    // 获取通知动作文本
    getNotificationActionText(type) {
      switch (type) {
        case 'like': return '点赞了';
        case 'comment': return '评论了';
        case 'reply': return '回复了';
        case 'collect': return '收藏了';
        case 'follow': return '关注了你';
        case 'mention': return '@了你';
        default: return '操作了';
      }
    },
    
    // 获取通知图标
    getNotificationIcon(type) {
      switch (type) {
        case 'like': return '❤️';
        case 'comment': return '💬';
        case 'reply': return '↩️';
        case 'collect': return '📌';
        case 'follow': return '👥';
        case 'mention': return '@';
        default: return '🔔';
      }
    },
    
    // 格式化通知时间
    formatNotificationTime(time) {
      if (!time) return '';
      const now = new Date();
      const notificationTime = new Date(time);
      const diffMs = now - notificationTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return notificationTime.toLocaleDateString('zh-CN');
    },

  }
};
</script>

<style scoped>
/* 私信页面基础样式 */
.messages-container {
  min-height: 100vh;
  font-family: var(--font-family);
  padding: 20px;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

/* 页面标题 */
.messages-header {
  text-align: center;
  margin-bottom: 20px;
}

.messages-header h1 {
  font-size: 2rem;
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

/* 标签页导航 */
.messages-tabs {
  display: flex;
  max-width: 1200px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 15px;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-btn:hover {
  background-color: var(--background-light);
}

.tab-btn.active {
  color: white;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--secondary-pink);
}

.tab-badge {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
}

/* 主要内容区域 */
.messages-content {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
  height: 80vh;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  overflow: hidden;
}

/* 私信部分 */
.messages-section {
  display: flex;
  gap: 0;
  height: 100%;
}

/* 左侧联系人列表 */
.contacts-sidebar {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid var(--background-dark);
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contacts-header {
  padding: 20px;
  border-bottom: 1px solid var(--background-dark);
}

.contacts-header h3 {
  font-size: 1.2rem;
  margin: 0 0 15px;
  color: var(--text-primary);
  font-weight: 600;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 20px;
  font-size: 0.9rem;
  background: var(--background-light);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  /* 隐藏滚动条但保持滚动功能 */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.contacts-list::-webkit-scrollbar {
  display: none;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid var(--background-dark);
}

.contact-item:hover {
  background-color: var(--background-light);
}

.contact-item.active {
  background: linear-gradient(135deg, var(--background-dark) 0%, #f9a8d4 100%);
  border-right: 3px solid var(--primary-pink);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.last-message {
  font-size: 0.85rem;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-item.active .last-message {
  color: var(--secondary-pink);
}

.contact-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.follow-btn {
  padding: 4px 8px;
  border: 1px solid var(--primary-pink);
  border-radius: 12px;
  background: transparent;
  color: var(--primary-pink);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: var(--primary-pink);
  color: white;
}

.follow-btn.followed {
  background: var(--primary-pink);
  color: white;
}

.unread-badge {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
}

/* 右侧聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-contact-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
  color: #999;
}

.no-contact-selected .nav-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  color: var(--primary-pink);
  opacity: 0.6;
}

.empty-notifications .nav-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  color: var(--primary-pink);
  opacity: 0.6;
}

.no-contact-selected h3 {
  font-size: 1.5rem;
  margin: 0 0 10px;
  color: var(--text-primary);
  font-weight: 500;
}

.no-contact-selected p {
  margin: 0;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--background-dark);
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.chat-contact-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
}

.chat-contact-name {
  font-weight: 500;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary {
  padding: 6px 12px;
  border: 1px solid var(--primary-pink);
  border-radius: 4px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--primary-pink);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-secondary:hover {
  border-color: var(--secondary-pink);
  color: var(--secondary-pink);
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  
  /* 隐藏滚动条（Chrome、Safari、Edge） */
  &::-webkit-scrollbar {
    width: 0;
    display: none;
  }
  
  /* 隐藏滚动条（Firefox） */
  scrollbar-width: none;
  
  /* 隐藏滚动条（IE、Edge） */
  -ms-overflow-style: none;
}

.loading-more {
  text-align: center;
  padding: 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.loading-more .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--background-light);
  border-top: 2px solid var(--primary-pink);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 18px;
  word-wrap: break-word;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-item.sent {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: flex-end;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
}

.message-item.received {
  align-self: flex-start;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--background-dark);
  border-bottom-left-radius: 4px;
  display: flex;
  justify-content: flex-start;
  box-shadow: 0 2px 5px rgba(251, 207, 232, 0.2);
}

.message-avatar {
  flex-shrink: 0;
}

.message-item.sent .message-avatar.right {
  order: 2;
  margin-left: 8px;
}

.message-item.sent .message-content {
  order: 1;
}

.message-item.received .message-avatar.left {
  order: 1;
  margin-right: 8px;
}

.message-item.received .message-content {
  order: 2;
}

.message-avatar .avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--primary-pink);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  line-height: 1.4;
}

.message-time {
  font-size: 0.75rem;
  margin-top: 5px;
  opacity: 0.7;
  text-align: right;
}

.chat-input-area {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--background-dark);
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--primary-pink);
  border-radius: 20px;
  font-size: 0.9rem;
  background: var(--background-light);
  resize: none;
  min-height: 40px;
  max-height: 120px;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.send-btn {
  padding: 0 16px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--secondary-pink) 0%, #be185d 100%);
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px 0;
}

.loading-state .spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--background-light);
  border-top: 3px solid var(--primary-pink);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.empty-state .nav-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: var(--primary-pink);
  opacity: 0.6;
}

.empty-chat {
  text-align: center;
  padding: 60px 0;
  color: #999;
}




/* 通知部分 */
.notifications-section {
  padding: 20px;
  height: 100%;
}

/* 通知标签页 */
.notification-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--background-dark);
}

/* 通知列表 */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
}

/* 通知项 */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 1px solid var(--background-dark);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid transparent;
  box-shadow: 0 2px 5px rgba(251, 207, 232, 0.2);
}

.notification-item:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(236, 72, 153, 0.3);
}

.notification-item.unread {
  border-left-color: var(--primary-pink);
  background: linear-gradient(135deg, var(--background-light) 0%, #f9a8d4 100%);
}

/* 通知头像 */
.notification-avatar {
  flex-shrink: 0;
  margin-right: 12px;
  position: relative;
}

.notification-avatar .avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
}

.unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(236, 72, 153, 0.4);
}
/* 通知内容 */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.sender-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 4px;
}

.notification-action {
  color: #666;
  margin-right: 4px;
}

.notification-target {
  color: var(--primary-pink);
  font-weight: 500;
}

.notification-detail {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-action-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notification-action-btn:hover {
  background-color: var(--background-light);
  color: var(--primary-pink);
}

.notification-action-btn.delete-btn:hover {
  color: #f44336;
}

/* 通知图标 */
.notification-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #999;
  padding: 8px;
  border-radius: 8px;
  background-color: #f0f0f0;
}

/* 空通知状态 */
.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: #999;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.empty-notifications i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ccc;
}

.empty-notifications h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #666;
}

.empty-notifications p {
  font-size: 14px;
  margin: 0;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .messages-content {
    flex-direction: column;
  }
  
  .messages-section {
    flex-direction: column;
  }
  
  .contacts-sidebar {
    width: 100%;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .contacts-list {
    max-height: 140px;
  }
  
  .message-item {
    max-width: 85%;
  }
  
  .messages-tabs {
    margin-bottom: 10px;
  }
  
  .tab-btn {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .notifications-section {
    padding: 10px;
  }
  
  .notification-item {
    padding: 12px;
    gap: 12px;
  }
  
  .notification-avatar .avatar-img {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .messages-container {
    padding: 10px;
  }
  
  .messages-header h1 {
    font-size: 1.5rem;
  }
  
  .chat-header {
    padding: 10px 15px;
  }
  
  .chat-messages {
    padding: 10px;
  }
  
  .chat-input-area {
    padding: 10px 15px;
  }
  
  .contact-item {
    padding: 10px 15px;
  }
  
  .contacts-header {
    padding: 15px;
  }
  
  .notification-text {
    font-size: 13px;
  }
  
  .notification-detail {
    font-size: 12px;
  }
  
  .notification-meta {
    font-size: 11px;
  }
  
  .notification-action-btn {
    font-size: 11px;
    padding: 2px 6px;
  }
  
  .notification-icon {
    font-size: 16px;
    padding: 6px;
  }
  
  .empty-notifications {
    padding: 40px 16px;
  }
  
  .empty-notifications i {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .empty-notifications h3 {
    font-size: 16px;
  }
  
  .empty-notifications p {
    font-size: 13px;
  }
}
</style>