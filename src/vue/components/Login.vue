<!-- 
=============================================================================
  Login.vue - 登录页面组件（学习版·表单知识点）
=============================================================================

【组件职责】
  这是用户登录页面，负责：
  1. 用户登录表单
  2. 表单验证
  3. 登录请求处理
  4. 登录状态保存

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. v-model 双向数据绑定                                                │
  │  2. 表单验证：前端验证逻辑                                               │
  │  3. async/await 异步请求                                                │
  │  4. $refs 访问 DOM 元素                                                 │
  │  5. 认证状态管理：auth 工具的使用                                        │
  │  6. 路由跳转：$router.push()                                            │
  └─────────────────────────────────────────────────────────────────────────┘

【表单字段说明】
  ┌──────────────┬────────────────────────────────────────────────┐
  │  字段名       │  说明                                          │
  ├──────────────┼────────────────────────────────────────────────┤
  │  email       │  用户名或邮箱                                  │
  │  password    │  密码（最少6位）                                │
  │  rememberMe  │  记住我（token 存储位置）                       │
  └──────────────┴────────────────────────────────────────────────┘

【登录流程】
  1. 用户输入用户名/邮箱和密码
  2. 前端验证表单
  3. 发送登录请求到后端
  4. 后端验证成功返回 token 和用户信息
  5. 前端保存登录状态（localStorage 或 sessionStorage）
  6. 根据用户角色跳转到对应页面

=============================================================================
  JavaScript 表单知识点
=============================================================================

【1. v-model 双向绑定原理】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【v-model 是什么？】                                                    │
  │  v-model 是 v-bind:value + @input 的语法糖                              │
  │                                                                         │
  │  【等价写法】                                                            │
  │  <input v-model="value">                                               │
  │  等价于                                                                 │
  │  <input :value="value" @input="value = $event.target.value">          │
  │                                                                         │
  │  【不同表单元素的行为】                                                   │
  │  - text/textarea：绑定 value 属性，监听 input 事件                      │
  │  - checkbox/radio：绑定 checked 属性，监听 change 事件                  │
  │  - select：绑定 value 属性，监听 change 事件                            │
  │                                                                         │
  │  【面试题】Q: v-model 在组件上如何工作？                                  │
  │  A: 组件需要接收 value prop，并触发 input 事件                          │
  │     Vue 2: value prop + $emit('input')                                 │
  │     Vue 3: modelValue prop + $emit('update:modelValue')                │
  │                                                                         │
  │  【修饰符】                                                              │
  │  v-model.lazy    // 改用 change 事件（失焦后更新）                      │
  │  v-model.number  // 自动转为数字                                        │
  │  v-model.trim    // 自动去除首尾空格                                    │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 表单验证策略】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【前端验证时机】                                                        │
  │  1. 实时验证：用户输入时验证（@input）                                   │
  │  2. 失焦验证：用户离开输入框时验证（@blur）                              │
  │  3. 提交验证：用户点击提交时验证（@submit）                              │
  │                                                                         │
  │  【本项目使用】失焦验证 + 提交验证                                       │
  │                                                                         │
  │  【常用验证规则】                                                        │
  │  必填：value.trim() !== ''                                             │
  │  邮箱：/^[^\s@]+@[^\s@]+\.[^\s@]+$/                                     │
  │  手机：/^1[3-9]\d{9}$/                                                  │
  │  密码：/^.{6,20}$/（6-20位）                                            │
  │  用户名：/^[a-zA-Z0-9_]{3,16}$/                                         │
  │                                                                         │
  │  【面试题】Q: 前端验证和后端验证哪个更重要？                              │
  │  A: 都重要，但职责不同：                                                │
  │     - 前端验证：提升用户体验，减少无效请求                               │
  │     - 后端验证：确保数据安全，是最后一道防线                             │
  │     - 前端验证可以被绑过，后端验证不能省略                               │
  │                                                                         │
  │  【面试题】Q: 如何防止表单重复提交？                                      │
  │  A: 1. 提交时禁用按钮（:disabled="isLoading"）                          │
  │     2. 使用防抖/节流                                                   │
  │     3. 后端添加请求频率限制                                             │
  │     4. 添加 loading 状态提示                                            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 正则表达式常用语法】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【元字符】                                                              │
  │  \d    数字 [0-9]                                                      │
  │  \w    单词字符 [a-zA-Z0-9_]                                           │
  │  \s    空白字符（空格、制表符、换行等）                                  │
  │  .     任意字符（除换行符）                                             │
  │  ^     字符串开头                                                      │
  │  $     字符串结尾                                                      │
  │                                                                         │
  │  【量词】                                                                │
  │  *      0 次或多次                                                    │
  │  +      1 次或多次                                                    │
  │  ?      0 次或 1 次                                                   │
  │  {n}    恰好 n 次                                                     │
  │  {n,}   至少 n 次                                                     │
  │  {n,m}  n 到 m 次                                                     │
  │                                                                         │
  │  【常用正则】                                                            │
  │  邮箱：/^[^\s@]+@[^\s@]+\.[^\s@]+$/                                     │
  │  手机：/^1[3-9]\d{9}$/                                                  │
  │  URL：/^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/                       │
  │  身份证：/^\d{17}[\dXx]$/                                               │
  │                                                                         │
  │  【面试题】Q: 如何验证密码强度？                                         │
  │  A: 弱：/^[a-zA-Z]{6,}$/（纯字母）                                     │
  │     中：/^(?=.*[a-z])(?=.*\d)[a-z\d]{8,}$/（字母+数字）                │
  │     强：/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/│
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 错误处理最佳实践】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【try/catch/finally】                                                   │
  │  try {                                                                  │
  │    // 可能出错的代码                                                    │
  │    const res = await api.login()                                       │
  │  } catch (error) {                                                      │
  │    // 错误处理                                                          │
  │    if (error.response) {                                                │
  │      // 服务器返回错误（4xx, 5xx）                                      │
  │    } else if (error.request) {                                          │
  │      // 请求发出但无响应（网络问题）                                    │
  │    } else {                                                             │
  │      // 请求配置错误                                                    │
  │    }                                                                    │
  │  } finally {                                                            │
  │    // 无论成功失败都执行（如关闭 loading）                              │
  │    this.isLoading = false                                               │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: finally 什么时候用？                                        │
  │  A: 无论成功还是失败都需要执行的代码，如：                               │
  │     - 关闭 loading 状态                                                 │
  │     - 关闭文件/数据库连接                                               │
  │     - 清理临时资源                                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  HTML 表单知识点
=============================================================================

【1. HTML5 表单新特性】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【新 input 类型】                                                       │
  │  <input type="email">     邮箱验证                                     │
  │  <input type="tel">       电话号码                                     │
  │  <input type="url">       URL 验证                                     │
  │  <input type="number">    数字输入                                     │
  │  <input type="date">      日期选择                                     │
  │  <input type="color">     颜色选择                                     │
  │  <input type="range">     滑块                                         │
  │  <input type="search">    搜索框                                       │
  │                                                                         │
  │  【新属性】                                                              │
  │  required      必填字段                                                │
  │  pattern       正则验证                                                │
  │  placeholder   占位提示                                                │
  │  autofocus     自动聚焦                                                │
  │  autocomplete  自动完成                                                │
  │  minlength/maxlength  长度限制                                         │
  │                                                                         │
  │  【验证属性】                                                            │
  │  <input type="email" required>                    // 必填+邮箱格式     │
  │  <input pattern="[A-Za-z]{3}" title="三个字母">    // 正则验证         │
  │  <input minlength="6" maxlength="20">             // 长度限制          │
  │                                                                         │
  │  【面试题】Q: HTML5 表单验证有什么优势？                                  │
  │  A: 1. 无需 JavaScript 即可实现基础验证                                 │
  │     2. 浏览器原生支持，性能好                                           │
  │     3. 移动端键盘会根据类型自动调整                                     │
  │     4. 但自定义能力有限，复杂验证仍需 JS                                │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 表单提交行为】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【默认行为】                                                            │
  │  点击提交按钮，表单会：                                                  │
  │  1. 触发 submit 事件                                                   │
  │  2. 收集表单数据                                                        │
  │  3. 发送请求到 action 指定的 URL                                        │
  │  4. 页面跳转或刷新                                                      │
  │                                                                         │
  │  【阻止默认行为】                                                        │
  │  方法1: @submit.prevent="handleSubmit"  // Vue 修饰符                  │
  │  方法2: event.preventDefault()          // JS 方法                     │
  │  方法3: <form action="javascript:void(0)">  // 空动作                  │
  │                                                                         │
  │  【面试题】Q: 为什么要阻止表单默认提交？                                  │
  │  A: 现代 SPA 应用通常使用 AJAX 提交，不希望页面刷新                     │
  │     阻止默认行为后可以用 JS 控制提交过程                                 │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 无障碍访问（a11y）】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【label 关联】                                                          │
  │  方法1: <label for="email">邮箱</label>                                │
  │         <input id="email">                                             │
  │                                                                         │
  │  方法2: <label>邮箱 <input></label>                                    │
  │                                                                         │
  │  【好处】                                                                │
  │  1. 点击 label 自动聚焦输入框                                           │
  │  2. 屏幕阅读器可以读出标签                                              │
  │  3. 提升可访问性                                                        │
  │                                                                         │
  │  【aria 属性】                                                           │
  │  <input aria-label="搜索">              // 无 label 时使用             │
  │  <input aria-describedby="hint">        // 关联提示文本                │
  │  <div role="alert">{{ error }}</div>    // 错误提示                    │
  │                                                                         │
  │  【面试题】Q: 为什么要注意无障碍访问？                                    │
  │  A: 1. 法律要求（某些国家/地区）                                        │
  │     2. 帮助视障用户使用网站                                             │
  │     3. 提升 SEO（搜索引擎优化）                                         │
  │     4. 体现社会责任                                                     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  CSS 表单样式知识点
=============================================================================

【1. 表单元素样式化】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【常见样式问题】                                                        │
  │  1. 不同浏览器默认样式不同                                              │
  │  2. 某些元素难以自定义样式（select、checkbox）                          │
  │  3. 聚焦样式不统一                                                      │
  │                                                                         │
  │  【重置默认样式】                                                        │
  │  input, button, select, textarea {                                     │
  │    margin: 0;                                                          │
  │    padding: 0;                                                         │
  │    border: none;                                                       │
  │    outline: none;                                                      │
  │    background: transparent;                                            │
  │    font: inherit;                                                      │
  │  }                                                                      │
  │                                                                         │
  │  【自定义聚焦样式】                                                      │
  │  input:focus {                                                         │
  │    outline: 2px solid var(--primary-color);                            │
  │    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);                      │
  │  }                                                                      │
  │                                                                         │
  │  【验证状态样式】                                                        │
  │  input:valid { border-color: green; }                                  │
  │  input:invalid { border-color: red; }                                  │
  │  input:focus:invalid { /* 聚焦时才显示 */ }                            │
  │                                                                         │
  │  【面试题】Q: 如何自定义 checkbox 样式？                                  │
  │  A: 1. 隐藏原生 checkbox                                               │
  │     2. 用伪元素创建自定义样式                                           │
  │     3. 用 :checked 伪类处理选中状态                                     │
  │                                                                         │
  │     input[type="checkbox"] {                                           │
  │       appearance: none;                                                │
  │       width: 20px;                                                     │
  │       height: 20px;                                                    │
  │       border: 2px solid #ccc;                                          │
  │     }                                                                   │
  │     input[type="checkbox"]:checked {                                   │
  │       background: var(--primary-color);                                │
  │     }                                                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 输入框组合样式（input-group）】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【结构】                                                                │
  │  <div class="input-group">                                             │
  │    <span class="input-group-text">@</span>                             │
  │    <input class="form-control">                                        │
  │    <button class="btn">提交</button>                                   │
  │  </div>                                                                 │
  │                                                                         │
  │  【样式要点】                                                            │
  │  .input-group {                                                        │
  │    display: flex;                                                      │
  │    align-items: stretch;                                               │
  │  }                                                                      │
  │  .input-group-text {                                                   │
  │    display: flex;                                                      │
  │    align-items: center;                                                │
  │    padding: 0.375rem 0.75rem;                                          │
  │    background: #f8f9fa;                                                │
  │    border: 1px solid #ced4da;                                          │
  │  }                                                                      │
  │  .input-group .form-control {                                          │
  │    flex: 1;                                                            │
  │    border-radius: 0;  /* 去掉圆角，让元素紧贴 */                        │
  │  }                                                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 响应式表单】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【移动端优化】                                                          │
  │  1. 输入框足够大（至少 44px 高度）                                      │
  │  2. 标签和输入框分行显示                                                │
  │  3. 按钮全宽显示                                                        │
  │  4. 使用合适的 input type 触发对应键盘                                  │
  │                                                                         │
  │  【示例】                                                                │
  │  @media (max-width: 576px) {                                           │
  │    .form-group {                                                       │
  │      flex-direction: column;  /* 标签和输入框分行 */                   │
  │    }                                                                    │
  │    .btn-submit {                                                       │
  │      width: 100%;  /* 按钮全宽 */                                       │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 移动端表单有什么注意事项？                                  │
  │  A: 1. 使用合适的 input type 触发正确键盘                               │
  │     2. 避免固定宽度，使用相对单位                                       │
  │     3. 点击区域足够大（44px+）                                          │
  │     4. 减少不必要的输入，提供快捷选项                                   │
  │     5. 避免使用 hover 效果（移动端无 hover）                            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  安全知识点
=============================================================================

【1. XSS 防护】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是 XSS？】                                                        │
  │  跨站脚本攻击，攻击者注入恶意脚本到网页中                               │
  │                                                                         │
  │  【防护措施】                                                            │
  │  1. 对用户输入进行转义                                                 │
  │  2. 使用 CSP（内容安全策略）                                            │
  │  3. Vue 自动转义（{{ }}），v-html 需谨慎                               │
  │  4. 设置 HttpOnly Cookie                                               │
  │                                                                         │
  │  【面试题】Q: Vue 如何防止 XSS？                                         │
  │  A: Vue 默认转义 {{ }} 中的内容                                        │
  │     只有 v-html 会渲染 HTML，应避免使用或先 sanitization               │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. CSRF 防护】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是 CSRF？】                                                       │
  │  跨站请求伪造，攻击者诱导用户在已登录网站执行恶意操作                   │
  │                                                                         │
  │  【防护措施】                                                            │
  │  1. CSRF Token（本项目使用）                                           │
  │  2. SameSite Cookie 属性                                               │
  │  3. 验证 Referer 头                                                    │
  │  4. 关键操作需要二次验证                                               │
  │                                                                         │
  │  【面试题】Q: Token 存储在哪里更安全？                                    │
  │  A: 1. HttpOnly Cookie：防止 XSS 读取，但需防 CSRF                     │
  │     2. localStorage：易受 XSS 攻击                                     │
  │     3. 内存中：最安全但刷新后丢失                                      │
  │     推荐方案：短期 token + refresh token                               │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  面试常问
=============================================================================

  Q: localStorage 和 sessionStorage 有什么区别？
  A: localStorage 永久存储，除非手动删除；
     sessionStorage 会话存储，关闭浏览器后清除。
     "记住我"功能用 localStorage，否则用 sessionStorage。

  Q: 为什么需要前端验证？
  A: 1. 提升用户体验，快速反馈错误
     2. 减少无效请求，节省服务器资源
     3. 但前端验证不能替代后端验证（安全问题）

  Q: 如何实现密码强度检测？
  A: 使用正则表达式检测：
     - 长度是否足够
     - 是否包含大小写字母
     - 是否包含数字
     - 是否包含特殊字符
     根据匹配项数量判断强度等级

  Q: JWT Token 应该存储在哪里？
  A: 1. localStorage：简单但易受 XSS 攻击
     2. HttpOnly Cookie：防 XSS 但需防 CSRF
     3. 内存 + HttpOnly Cookie + Refresh Token：最安全

  Q: 如何处理表单的防抖和节流？
  A: 防抖：停止输入一段时间后才触发
     节流：固定时间间隔触发一次
     表单验证常用防抖，提交按钮常用节流

=============================================================================
-->
<template>
  <div class="login-container">
    <!-- 科幻扫描线效果 -->
    <div class="scanlines"></div>
    
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="row w-100 justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <!-- 登录注册卡片 -->
          <div class="card login-card shadow-lg">
            <!-- 卡片装饰元素 -->
            <div class="card-decoration top-left">
              <i class="fas fa-star"></i>
            </div>
            <div class="card-decoration top-right">
              <i class="fas fa-heart"></i>
            </div>
            <div class="card-decoration bottom-left">
              <i class="fas fa-moon"></i>
            </div>
            <div class="card-decoration bottom-right">
              <i class="fas fa-sun"></i>
            </div>
            
            <div class="card-body p-5">
              <!-- 标题和Logo -->
              <div class="text-center mb-5">
                <h2 class="mb-1">
                  <span class="logo-text">
                    <i class="fas fa-magic text-primary"></i> kk博客
                  </span>
                </h2>
                <p class="text-muted">欢迎回到kk博客，继续您的创作之旅</p>
              </div>
              
              <!-- 切换标签 -->
              <div class="nav nav-pills justify-content-center mb-5" id="auth-tabs" role="tablist">
                <button class="nav-link active px-4 py-2 cel-button" id="login-tab" type="button">
                  <i class="fas fa-sign-in-alt me-2"></i>登录
                </button>
                <button class="nav-link px-4 py-2 cel-button" id="register-tab" type="button" @click="goToRegister">
                  <i class="fas fa-user-plus me-2"></i>注册
                </button>
              </div>

              <!-- 表单内容 -->
              <div class="tab-content" id="auth-tabs-content">
                <!-- 登录表单 -->
                <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
                  <!-- 
                    @submit.prevent="login"
                    【.prevent 修饰符】阻止表单默认提交行为
                    【作用】使用自定义的 login 方法处理提交
                  -->
                  <form @submit.prevent="login">
                    <!-- 用户名或邮箱 -->
                    <div class="mb-4 form-group">
                      <label for="loginEmail" class="form-label cel-label">用户名或邮箱</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-user"></i>
                        </span>
                        <!-- 
                          v-model="formData.email"
                          【双向数据绑定】输入框的值与 formData.email 同步
                          【效果】用户输入时自动更新 data 中的值
                        -->
                        <input type="text" id="loginEmail" v-model="formData.email" class="form-control cel-input" placeholder="请输入用户名或邮箱" required>
                      </div>
                      <!-- 错误提示：v-if 条件渲染 -->
                      <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
                    </div>

                    <!-- 密码 -->
                    <div class="mb-4 form-group">
                      <label for="loginPassword" class="form-label cel-label">密码</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-lock"></i>
                        </span>
                        <!-- 
                          ref="passwordInput"
                          【$refs 用法】通过 this.$refs.passwordInput 访问 DOM 元素
                          【场景】切换密码显示/隐藏时修改 input.type
                        -->
                        <input type="password" id="loginPassword" v-model="formData.password" class="form-control cel-input" placeholder="请输入您的密码" required ref="passwordInput">
                        <!-- 密码显示/隐藏切换按钮 -->
                        <button class="btn btn-outline-secondary border-cel" type="button" @click="togglePassword" ref="toggleButton">
                          <i class="fas fa-eye" ref="eyeIcon"></i>
                        </button>
                      </div>
                      <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
                    </div>

                    <!-- 记住我和忘记密码 -->
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <div class="form-check">
                        <!-- 
                          v-model="formData.rememberMe"
                          【复选框绑定】true 表示选中，false 表示未选中
                          【作用】决定 token 存储位置
                        -->
                        <input class="form-check-input cel-checkbox" type="checkbox" id="rememberMe" v-model="formData.rememberMe">
                        <label class="form-check-label cel-label" for="rememberMe">
                          记住我
                        </label>
                      </div>
                    </div>

                    <!-- 登录失败，显示错误信息 -->
                    <div class="error-message" v-if="errors.login">{{ errors.login }}</div>

                    <!-- 登录按钮 -->
                    <!-- 
                      :disabled="isLoading"
                      【动态禁用】加载中时禁用按钮，防止重复提交
                    -->
                    <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-login" :disabled="isLoading">
                      <i class="fas fa-sign-in-alt me-2"></i>{{ isLoading ? '登录中...' : '登录' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <!-- 页脚信息 -->
          <div class="text-center mt-4 text-muted">
            <p class="cel-text">&copy; 2025 kk博客. 保留所有权利.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',  // 组件名称
  
  // ============================================================
  // data 数据区
  // ============================================================
  // 【学习重点】表单数据的响应式管理
  // 
  // 【特点】
  // - 数据变化会自动更新视图
  // - v-model 实现双向绑定
  // ============================================================
  data() {
    return {
      // ============================================================
      // 表单数据
      // ============================================================
      // 【formData】
      // 类型：Object
      // 作用：存储表单输入的数据
      // ============================================================
      formData: {
        // 【email】
        // 类型：String
        // 初始值：''
        // 作用：存储用户输入的用户名或邮箱
        // 验证：必填，如果是邮箱格式需要验证有效性
        email: '',
        
        // 【password】
        // 类型：String
        // 初始值：''
        // 作用：存储用户输入的密码
        // 验证：必填，最少6位
        password: '',
        
        // 【rememberMe】
        // 类型：Boolean
        // 初始值：true
        // 作用：控制 token 存储位置
        // true：存储在 localStorage（永久）
        // false：存储在 sessionStorage（会话）
        rememberMe: true
      },
      
      // ============================================================
      // 错误信息
      // ============================================================
      // 【errors】
      // 类型：Object
      // 作用：存储表单验证和登录错误信息
      // 数据结构：{ email: '错误信息', password: '错误信息', login: '错误信息' }
      // ============================================================
      errors: {},
      
      // 【isLoading】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记是否正在登录中
      // 使用场景：禁用按钮、显示加载状态
      isLoading: false,
      
      // 【passwordVisible】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记密码是否可见
      // 使用场景：切换密码显示/隐藏
      passwordVisible: false
    };
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  // 【作用】组件挂载后初始化表单验证
  // ============================================================
  mounted() {
    // 初始化表单验证
    this.initFormValidation();
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  methods: {
    // ============================================================
    // 密码显示/隐藏切换
    // ============================================================
    // 【作用】切换密码输入框的显示状态
    // 【使用 $refs】访问 DOM 元素
    // 【流程】
    // 1. 切换 passwordVisible 状态
    // 2. 修改 input 的 type 属性
    // 3. 切换图标样式
    // ============================================================
    togglePassword() {
      this.passwordVisible = !this.passwordVisible;
      // 通过 $refs 访问 DOM 元素
      const passwordInput = this.$refs.passwordInput;
      const icon = this.$refs.eyeIcon;
      
      if (this.passwordVisible) {
        // 显示密码：改为 text 类型
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        // 隐藏密码：改为 password 类型
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    },
    
    // ============================================================
    // 初始化表单验证
    // ============================================================
    // 【作用】为所有输入框添加失焦验证
    // 【场景】用户离开输入框时验证输入内容
    // ============================================================
    initFormValidation() {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
          // 监听失焦事件
          input.addEventListener('blur', () => {
            this.validateInput(input);
          });
        });
      });
    },
    
    // ============================================================
    // 验证单个输入框
    // ============================================================
    // 【作用】验证单个输入框的内容
    // 【参数】input：DOM 元素
    // 【效果】添加/移除验证样式，显示错误信息
    // ============================================================
    validateInput(input) {
      const fieldName = input.id.replace('login', '').toLowerCase();
      const value = this.formData[fieldName];
      
      if (input.checkValidity()) {
        // 验证通过：添加成功样式
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        this.errors[fieldName] = '';
      } else {
        // 验证失败：添加错误样式
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        this.errors[fieldName] = input.validationMessage;
      }
    },
    
    // ============================================================
    // 表单验证
    // ============================================================
    // 【作用】验证整个表单
    // 【返回值】Boolean（true 表示验证通过）
    // 【验证规则】
    // - email：必填，邮箱格式验证（如果包含@）
    // - password：必填，最少6位
    // ============================================================
    validateForm() {
      this.errors = {};
      
      // 验证用户名或邮箱
      if (!this.formData.email) {
        this.errors.email = '请输入用户名或邮箱';
      } else if (this.formData.email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        // 如果包含@符号，则验证邮箱格式
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码 - 调整为6位，与后端一致
      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }
      
      // 返回是否有错误
      return Object.keys(this.errors).length === 0;
    },
    
    // ============================================================
    // 登录方法
    // ============================================================
    // 【作用】处理用户登录
    // 【流程】
    // 1. 验证表单
    // 2. 发送登录请求
    // 3. 保存登录状态
    // 4. 跳转到对应页面
    // ============================================================
    async login() {
      // 1. 验证表单
      if (!this.validateForm()) {
        return;
      }
      
      // 2. 设置加载状态
      this.isLoading = true;
      
      try {
        // 3. 发送登录请求
        // 使用this.$http.auth.login调用，这样可以利用api.js中配置的baseURL和拦截器
        const response = await this.$http.auth.login(this.formData);
        
        if (response.success && response.message === '登录成功') {
          // 4. 登录成功，保存登录状态
          
          // 导入认证状态管理
          const auth = require('../utils/auth').default;
          
          // 使用认证状态管理保存登录状态
          // 参数：用户信息、token、是否记住我
          auth.loginSuccess(response.user, response.token, this.formData.rememberMe);
          
          // 5. 根据用户角色选择不同的跳转页面
          let redirectPath;
          if (response.user && response.user.role === 'admin') {
            // 管理员用户跳转到管理员仪表盘
            redirectPath = '/admin';
          } else {
            // 普通用户跳转到博客首页
            redirectPath = '/blog';
          }
          this.$router.push(redirectPath);
        } else {
          // 登录失败，显示错误信息
          this.errors.login = response.message || '登录失败，请检查邮箱和密码';
        }
      } catch (error) {
        // 更详细的错误处理
        console.error('登录错误:', error);
        if (error.response) {
          // 服务器返回错误响应
          this.errors.login = error.response.data.message || '登录失败，请检查邮箱和密码';
        } else if (error.request) {
          // 请求已发出但没有收到响应
          this.errors.login = '网络错误，无法连接到服务器，请检查网络连接';
        } else {
          // 请求配置错误
          this.errors.login = '请求配置错误，请稍后重试';
        }
      } finally {
        // 无论成功失败，都关闭加载状态
        this.isLoading = false;
      }
    },
    
    // ============================================================
    // 跳转到注册页面
    // ============================================================
    // 【作用】切换到注册页面
    // 【场景】用户点击"注册"标签
    // ============================================================
    goToRegister() {
      if (this.$route.path !== '/register') {
        this.$router.push('/register');
      }
    }
  }
}
</script>

<style scoped>
/* 赛璐璐风格基础样式 */
/* 使用全局CSS变量，与其他组件保持一致 */

/* 登录容器 */
.login-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
    overflow: hidden;
}

/* 渐变背景装饰 */
.login-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="25" cy="75" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
    background-size: 100px 100px;
    z-index: 0;
}

/* 静态扫描线效果 */
.scanlines {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.05) 50%,
        rgba(0, 0, 0, 0) 100%
    );
    background-size: 100% 4px;
    z-index: 10;
    pointer-events: none;
}

/* 赛璐璐风格卡片 */
.login-card {
    background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
    border: 4px solid var(--background-dark);
    box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
    position: relative;
    overflow: hidden;
    z-index: 5;
    transition: all 0.3s ease;
    transform: translateY(0);
    border-radius: 1rem;
}

.login-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px rgba(236, 72, 153, 0.3);
}

/* 卡片装饰元素 */
.card-decoration {
    position: absolute;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    opacity: 0.8;
}

.card-decoration.top-left {
    top: 10px;
    left: 10px;
    color: var(--primary-pink);
}

.card-decoration.top-right {
    top: 10px;
    right: 10px;
    color: var(--primary-pink);
}

.card-decoration.bottom-left {
    bottom: 10px;
    left: 10px;
    color: var(--accent-green);
}

.card-decoration.bottom-right {
    bottom: 10px;
    right: 10px;
    color: var(--accent-yellow);
}

/* Logo文本 */
.logo-text {
    font-weight: 700;
    font-size: 1.8rem;
    background: linear-gradient(135deg, var(--primary-pink), var(--accent-green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    font-family: var(--font-family);
}

/* 导航标签样式 */
.nav-pills .nav-link {
    border-radius: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    transition: all 0.3s ease;
    padding: 0.75rem 1.5rem;
}

.nav-pills .nav-link:hover {
    background: rgba(236, 72, 153, 0.1);
    color: var(--primary-pink);
    transform: translateY(-2px);
}

.nav-pills .nav-link.active {
    background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
    color: white;
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

/* 赛璐璐风格按钮 */
.cel-button {
    background: var(--background-light);
    border: 2px solid var(--primary-pink);
    border-radius: 10px;
    color: var(--text-primary);
    font-weight: bold;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.cel-button:hover {
    background: var(--primary-pink);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(236, 72, 153, 0.4);
}

.cel-button.active {
    background: var(--primary-pink);
    color: white;
}

/* 登录和注册按钮的特殊效果 */
.btn-login, .btn-register {
    position: relative;
    z-index: 1;
    background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    transition: all 0.3s ease;
    overflow: hidden;
}

.btn-login:before, .btn-register:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.5s;
    z-index: -1;
}

.btn-login:hover:before, .btn-register:hover:before {
    left: 100%;
}

.btn-login:hover, .btn-register:hover {
    background: linear-gradient(135deg, var(--secondary-pink), var(--primary-pink));
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
}

.btn-login:after, .btn-register:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.5rem;
    z-index: -1;
    opacity: 0;
    transition: all 0.3s ease;
}

.btn-login:hover:after, .btn-register:hover:after {
    opacity: 1;
    background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
    transform: scale(1.05);
}

.btn-login:active, .btn-register:active {
    transform: translateY(0);
}

/* 赛璐璐风格输入框 */
.cel-input {
    border: 2px solid var(--primary-pink);
    border-radius: 10px;
    background: var(--background-light);
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
    padding: 0.75rem 1rem;
    font-size: 1rem;
}

.cel-input:focus {
    outline: none;
    border-color: var(--primary-pink);
    box-shadow: 0 0 15px rgba(236, 72, 153, 0.3), 0 0 0 3px rgba(236, 72, 153, 0.1);
    transform: translateY(-1px);
}

/* 输入框光晕效果 - 已移除 */

/* 输入组样式 */
.input-group {
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.input-group:focus-within {
    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.input-group .input-group-text {
    background: var(--background-light);
    color: var(--text-primary);
    border: none;
    transition: all 0.3s ease;
}

.input-group .btn {
    transition: all 0.3s ease;
}

.input-group .btn:hover {
    background: var(--primary-pink);
    color: white;
}

/* 赛璐璐风格标签 */
.cel-label {
    font-weight: bold;
    color: var(--text-primary);
    position: relative;
    transition: all 0.2s ease;
}

.cel-label:hover {
    color: var(--primary-pink);
}

.cel-label::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 30px;
    height: 2px;
    background: var(--primary-pink);
}

/* 赛璐璐风格复选框 */
.cel-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary-pink);
    border-radius: 0.25rem;
    accent-color: var(--primary-pink);
    transition: all 0.3s ease;
}

.cel-checkbox:checked {
    background-color: var(--primary-pink);
    border-color: var(--primary-pink);
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23fff'%3e%3cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'/%3e%3c/svg%3e");
}

.cel-checkbox:focus {
    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

/* 赛璐璐风格链接 */
.cel-link {
    position: relative;
    color: var(--primary-pink);
    text-decoration: none;
    transition: all 0.2s ease;
}

.cel-link:hover {
    color: var(--secondary-pink);
    text-decoration: underline;
}

.cel-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--secondary-pink);
    transition: width 0.3s ease;
}

.cel-link:hover::after {
    width: 100%;
}

/* 赛璐璐风格文本 */
.cel-text {
    color: var(--text-secondary);
}

/* 边框样式 */
.border-cel {
    border: 2px solid var(--primary-pink);
}

/* 错误信息 */
.error-message {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 5px;
    animation: shake 0.5s ease;
}

/* 表单验证样式 */
.is-invalid {
    border-color: #ef4444 !important;
}

.is-invalid:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.invalid-feedback {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

.is-valid {
    border-color: #10b981 !important;
}

.is-valid:focus {
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
}

.valid-feedback {
    color: #10b981;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

/* 表单切换动画 */
.tab-content .tab-pane {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 密码显示/隐藏按钮 */
#togglePassword, #toggleConfirmPassword {
    cursor: pointer;
    transition: all 0.2s ease;
}

#togglePassword:hover, #toggleConfirmPassword:hover {
    color: #6366f1;
}

/* 粒子效果样式 */
.magic-particle {
    position: absolute;
    pointer-events: none;
    z-index: 100;
    border-radius: 50%;
}

.input-particle {
    position: absolute;
    pointer-events: none;
    z-index: 10;
    border-radius: 50%;
}

/* 全息效果 */
.hologram-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent 49%, rgba(0, 206, 201, 0.1) 50%, transparent 51%);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 11;
    animation: hologram-shift 3s linear infinite;
}

@keyframes hologram-shift {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 20px 20px;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .login-card {
        margin: 0 1rem;
        border-radius: 0.75rem;
    }
    
    .card-body {
        padding: 2rem 1.5rem !important;
    }
    
    .logo-text {
        font-size: 1.5rem;
    }
    
    .card-decoration {
        width: 30px;
        height: 30px;
        font-size: 16px;
    }
    
    .nav-pills {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .nav-pills .nav-link {
        width: 100%;
    }
}

@media (max-width: 480px) {
    .login-card {
        margin: 0 0.5rem;
    }
    
    .card-body {
        padding: 1.5rem 1rem !important;
    }
    
    .cel-input {
        padding: 0.625rem 0.875rem;
    }
    
    .btn-primary {
        padding: 0.625rem 1.25rem;
    }
    
    .nav-pills .nav-link {
        padding: 10px 20px !important;
    }
}

/* 动画定义 */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
</style>