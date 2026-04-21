<!-- 
=============================================================================
  Create.vue - 创作页组件（学习版·文件上传知识点）
=============================================================================

【组件职责】
  这是文章创作/编辑页面，支持两种文章类型：
  1. 长文章：知乎风格，使用富文本编辑器
  2. 短文章：小红书风格，支持多图/视频

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. v-model 双向数据绑定                                                │
  │  2. v-if/v-else 条件渲染                                                │
  │  3. @submit.prevent 阻止默认提交                                        │
  │  4. :class 动态类名绑定                                                 │
  │  5. @click 事件处理                                                     │
  │  6. $refs 访问DOM元素                                                   │
  │  7. FormData 文件上传                                                   │
  │  8. 富文本编辑器集成                                                    │
  │  9. 拖拽上传实现                                                        │
  └─────────────────────────────────────────────────────────────────────────┘

【数据流向】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  用户填写表单 → 表单验证 → 上传图片到服务器 → 获取图片URL               │
  │       ↓                                                                 │
  │  构建提交数据 → POST/PUT请求 → 服务器保存 → 返回结果                    │
  │       ↓                                                                 │
  │  成功：跳转到文章详情页                                                 │
  │  失败：显示错误提示                                                     │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  JavaScript 文件上传知识点
=============================================================================

【1. FormData 对象】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【什么是 FormData？】                                                   │
  │  - 一个用于构造表单数据的接口                                           │
  │  - 可以发送文件、二进制数据                                             │
  │  - Content-Type 自动设置为 multipart/form-data                          │
  │                                                                         │
  │  【基本用法】                                                            │
  │  const formData = new FormData();                                      │
  │  formData.append('username', '张三');   // 添加文本字段                │
  │  formData.append('avatar', file);       // 添加文件                    │
  │  formData.append('images', file1);      // 添加多个文件                │
  │  formData.append('images', file2);                                      │
  │                                                                         │
  │  【发送请求】                                                            │
  │  fetch('/api/upload', {                                                 │
  │    method: 'POST',                                                      │
  │    body: formData  // 直接传FormData，不要手动设置Content-Type         │
  │  });                                                                    │
  │                                                                         │
  │  【面试题】Q: 为什么不能用 JSON 发送文件？                                │
  │  A: JSON 只能表示文本数据，无法表示二进制数据                           │
  │     文件是二进制数据，必须用 FormData 或 Base64 编码                    │
  │                                                                         │
  │  【面试题】Q: FormData 和 JSON 的区别？                                  │
  │  ┌──────────────┬─────────────────┬───────────────────────┐            │
  │  │    特性       │    FormData     │        JSON           │            │
  │  ├──────────────┼─────────────────┼───────────────────────┤            │
  │  │  文件支持     │  支持           │  不支持               │            │
  │  │  二进制数据   │  支持           │  需要 Base64 编码     │            │
  │  │  Content-Type│  multipart/form-data │  application/json │            │
  │  │  数据大小     │  较大           │  较小                 │            │
  │  │  可读性       │  差             │  好                   │            │
  │  └──────────────┴─────────────────┴───────────────────────┘            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. File API 文件操作】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【获取文件对象】                                                        │
  │  const file = document.querySelector('input[type="file"]').files[0];   │
  │                                                                         │
  │  【File 对象属性】                                                       │
  │  file.name      // 文件名：'photo.jpg'                                 │
  │  file.size      // 文件大小（字节）：1024000                            │
  │  file.type      // MIME类型：'image/jpeg'                              │
  │  file.lastModified  // 最后修改时间戳                                   │
  │                                                                         │
  │  【文件大小转换】                                                        │
  │  function formatFileSize(bytes) {                                      │
  │    if (bytes < 1024) return bytes + ' B';                              │
  │    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';  │
  │    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';                  │
  │  }                                                                      │
  │                                                                         │
  │  【文件类型验证】                                                        │
  │  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];        │
  │  if (!allowedTypes.includes(file.type)) {                              │
  │    alert('只支持 JPG、PNG、GIF 格式');                                  │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 如何限制上传文件大小？                                      │
  │  A: const maxSize = 5 * 1024 * 1024; // 5MB                            │
  │     if (file.size > maxSize) {                                         │
  │       alert('文件大小不能超过5MB');                                     │
  │       return;                                                          │
  │     }                                                                   │
  │                                                                         │
  │  【面试题】Q: 如何实现多文件上传？                                        │
  │  A: <input type="file" multiple>  // 添加 multiple 属性                │
  │     const files = Array.from(input.files);  // 获取所有文件            │
  │     files.forEach(file => formData.append('files', file));             │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. URL.createObjectURL 本地预览】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【作用】为 File 对象创建一个临时的 URL                                 │
  │  【格式】blob:http://localhost:8080/xxxxxxxx-xxxx-xxxx                  │
  │  【特点】只在当前页面有效，刷新后失效                                   │
  │                                                                         │
  │  【基本用法】                                                            │
  │  const file = document.querySelector('input').files[0];                │
  │  const url = URL.createObjectURL(file);                                │
  │  document.querySelector('img').src = url;                              │
  │                                                                         │
  │  【内存管理】                                                            │
  │  // 创建 blob URL 会占用内存                                            │
  │  // 不再使用时需要手动释放                                              │
  │  URL.revokeObjectURL(url);                                             │
  │                                                                         │
  │  【本项目实现】                                                          │
  │  processImageFile(file) {                                              │
  │    // 释放之前的临时URL，避免内存泄漏                                   │
  │    if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {   │
  │      URL.revokeObjectURL(this.tempImageUrl);                           │
  │    }                                                                    │
  │    // 创建新的临时URL                                                   │
  │    this.tempImageUrl = URL.createObjectURL(file);                      │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么需要 URL.revokeObjectURL？                           │
  │  A: blob URL 会一直占用内存，直到页面关闭                               │
  │     如果用户频繁上传图片，不释放会导致内存泄漏                           │
  │                                                                         │
  │  【面试题】Q: blob URL 和 data URL 的区别？                              │
  │  ┌──────────────┬─────────────────┬───────────────────────┐            │
  │  │    特性       │    blob URL     │      data URL         │            │
  │  ├──────────────┼─────────────────┼───────────────────────┤            │
  │  │  格式         │  blob:http://...│  data:image/png;base64│            │
  │  │  内存占用     │  小             │  大（Base64编码）     │            │
  │  │  有效期       │  页面关闭前     │  永久                 │            │
  │  │  适用场景     │  临时预览       │  小图片嵌入           │            │
  │  └──────────────┴─────────────────┴───────────────────────┘            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 拖拽上传实现】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【HTML 结构】                                                           │
  │  <div                                                                   │
  │    @dragover.prevent                                                    │
  │    @dragenter.prevent                                                   │
  │    @dragleave.prevent                                                   │
  │    @drop.prevent="handleDrop"                                           │
  │  >                                                                      │
  │    拖拽文件到此处                                                       │
  │  </div>                                                                 │
  │                                                                         │
  │  【事件说明】                                                            │
  │  - dragover: 文件在目标区域上方拖动时触发                               │
  │  - dragenter: 文件进入目标区域时触发                                    │
  │  - dragleave: 文件离开目标区域时触发                                    │
  │  - drop: 文件在目标区域释放时触发                                       │
  │  - .prevent: 阻止浏览器默认行为（打开文件）                             │
  │                                                                         │
  │  【处理拖拽释放】                                                        │
  │  handleDrop(event) {                                                   │
  │    const files = event.dataTransfer.files;                             │
  │    // 处理文件...                                                       │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么要用 .prevent 修饰符？                                │
  │  A: 浏览器默认行为是打开文件（如图片会在新标签页显示）                   │
  │     .prevent 阻止这个默认行为，让拖拽区域正常工作                       │
  │                                                                         │
  │  【面试题】Q: 如何判断拖入的是文件还是其他内容？                         │
  │  A: event.dataTransfer.types.includes('Files')                         │
  │     如果返回 true，说明拖入的是文件                                     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【5. 上传进度显示】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【使用 XMLHttpRequest 监听进度】                                        │
  │  const xhr = new XMLHttpRequest();                                     │
  │  xhr.upload.onprogress = (event) => {                                  │
  │    if (event.lengthComputable) {                                       │
  │      const percent = (event.loaded / event.total * 100).toFixed(0);    │
  │      console.log(`上传进度: ${percent}%`);                             │
  │    }                                                                    │
  │  };                                                                     │
  │  xhr.open('POST', '/api/upload');                                      │
  │  xhr.send(formData);                                                   │
  │                                                                         │
  │  【使用 Axios 监听进度】                                                 │
  │  axios.post('/api/upload', formData, {                                 │
  │    onUploadProgress: (progressEvent) => {                              │
  │      const percent = (progressEvent.loaded / progressEvent.total * 100)│
  │        .toFixed(0);                                                     │
  │      console.log(`上传进度: ${percent}%`);                             │
  │    }                                                                    │
  │  });                                                                    │
  │                                                                         │
  │  【面试题】Q: 为什么 fetch 不能监听上传进度？                            │
  │  A: fetch API 目前不支持上传进度监听                                    │
  │     需要监听进度时，只能用 XMLHttpRequest 或 Axios                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【6. 大文件上传优化】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【问题】直接上传大文件会导致：                                          │
  │  1. 上传时间长，用户等待                                                │
  │  2. 网络不稳定可能导致失败                                              │
  │  3. 服务器内存压力大                                                    │
  │                                                                         │
  │  【解决方案：分片上传】                                                  │
  │  async function uploadLargeFile(file) {                                │
  │    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB 每片                     │
  │    const chunks = Math.ceil(file.size / CHUNK_SIZE);                   │
  │                                                                         │
  │    for (let i = 0; i < chunks; i++) {                                  │
  │      const start = i * CHUNK_SIZE;                                     │
  │      const end = Math.min(start + CHUNK_SIZE, file.size);              │
  │      const chunk = file.slice(start, end);                             │
  │                                                                         │
  │      const formData = new FormData();                                  │
  │      formData.append('file', chunk);                                   │
  │      formData.append('chunkIndex', i);                                 │
  │      formData.append('totalChunks', chunks);                           │
  │      formData.append('fileId', file.name + file.size);                 │
  │                                                                         │
  │      await fetch('/api/upload-chunk', {                                │
  │        method: 'POST',                                                 │
  │        body: formData                                                  │
  │      });                                                                │
  │    }                                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【断点续传】                                                            │
  │  1. 每个分片上传成功后，记录已上传的分片                                │
  │  2. 上传中断后，查询服务器已接收的分片                                  │
  │  3. 只上传未完成的分片                                                  │
  │                                                                         │
  │  【面试题】Q: 分片上传的优点？                                           │
  │  A: 1. 失败后只需重传失败的分片，不用重传整个文件                       │
  │     2. 可以并行上传多个分片，提高速度                                   │
  │     3. 服务器内存压力小                                                 │
  │     4. 支持断点续传                                                     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  HTML 表单知识点
=============================================================================

【1. 表单元素类型】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【常用输入类型】                                                        │
  │  <input type="text">      // 单行文本                                   │
  │  <input type="password">  // 密码                                       │
  │  <input type="email">     // 邮箱（自动验证格式）                       │
  │  <input type="number">    // 数字                                       │
  │  <input type="file">      // 文件上传                                   │
  │  <input type="date">      // 日期选择                                   │
  │  <input type="color">     // 颜色选择                                   │
  │  <input type="range">     // 滑块                                       │
  │                                                                         │
  │  【文本域】                                                              │
  │  <textarea rows="5" cols="30"></textarea>                              │
  │  - rows: 可见行数                                                       │
  │  - cols: 可见列数                                                       │
  │  - 实际内容可以超出                                                     │
  │                                                                         │
  │  【下拉选择】                                                            │
  │  <select>                                                               │
  │    <option value="">请选择</option>                                    │
  │    <option value="game">游戏攻略</option>                              │
  │    <option value="travel">旅游攻略</option>                            │
  │  </select>                                                              │
  │                                                                         │
  │  【面试题】Q: input 和 textarea 的区别？                                 │
  │  A: input: 单行文本，不能换行                                           │
  │     textarea: 多行文本，可以换行                                        │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 表单验证属性】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【HTML5 验证属性】                                                      │
  │  <input required>           // 必填                                     │
  │  <input minlength="5">      // 最小长度                                 │
  │  <input maxlength="20">     // 最大长度                                 │
  │  <input pattern="[A-Za-z]+"> // 正则验证                                │
  │  <input type="email">       // 邮箱格式验证                             │
  │  <input min="0" max="100">  // 数字范围                                 │
  │                                                                         │
  │  【自定义验证消息】                                                      │
  │  <input required oninvalid="this.setCustomValidity('请填写此字段')">   │
  │                                                                         │
  │  【JS 验证方法】                                                         │
  │  input.checkValidity()     // 检查是否有效                              │
  │  input.reportValidity()    // 检查并显示错误提示                        │
  │  form.checkValidity()      // 检查整个表单                              │
  │                                                                         │
  │  【面试题】Q: HTML5 验证和 JS 验证哪个更好？                             │
  │  A: HTML5 验证：简单，但功能有限                                        │
  │     JS 验证：灵活，可以实现复杂逻辑                                     │
  │     实际项目中通常结合使用                                               │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 文件上传控件】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【基本用法】                                                            │
  │  <input type="file">                     // 单文件                      │
  │  <input type="file" multiple>            // 多文件                      │
  │  <input type="file" accept="image/*">    // 只接受图片                  │
  │  <input type="file" accept=".jpg,.png">  // 指定扩展名                  │
  │  <input type="file" capture="camera">    // 调用摄像头                  │
  │                                                                         │
  │  【样式美化】                                                            │
  │  隐藏原生控件                                                │
  │  <input type="file" id="fileInput" style="display: none;">             │
  │   自定义按钮                                                    │
  │  <button onclick="document.getElementById('fileInput').click()">       │
  │    选择文件                                                             │
  │  </button>                                                              │
  │                                                                         │
  │  【面试题】Q: accept 属性能阻止用户选择非图片文件吗？                    │
  │  A: 不能！accept 只是筛选显示的文件类型                                 │
  │     用户可以选择"所有文件"来绕过限制                                    │
  │     必须在 JS 中再次验证 file.type                                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  CSS 样式知识点
=============================================================================

【1. 表单样式化】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【输入框样式】                                                          │
  │  .form-input {                                                          │
  │    width: 100%;               // 全宽                                   │
  │    padding: 12px 16px;        // 内边距                                 │
  │    border: 2px solid #ddd;    // 边框                                   │
  │    border-radius: 8px;        // 圆角                                   │
  │    font-size: 16px;           // 字体大小                               │
  │    transition: border-color 0.3s;  // 过渡动画                          │
  │  }                                                                      │
  │  .form-input:focus {                                                   │
  │    outline: none;             // 移除默认轮廓                           │
  │    border-color: #ec4899;     // 聚焦时边框变色                         │
  │    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);  // 外发光            │
  │  }                                                                      │
  │                                                                         │
  │  【下拉框样式】                                                          │
  │  .form-select {                                                         │
  │    appearance: none;          // 移除默认样式                           │
  │    background-image: url('arrow.svg');  // 自定义箭头                   │
  │    background-position: right 12px center;                             │
  │    background-repeat: no-repeat;                                        │
  │    padding-right: 40px;       // 为箭头留空间                           │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: appearance: none 有什么用？                                │
  │  A: 移除浏览器默认样式，让表单元素可以完全自定义                        │
  │     但也失去了原生交互效果，需要自己实现                                │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【2. 文件上传区域样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【上传区域样式】                                                        │
  │  .upload-area {                                                         │
  │    border: 2px dashed #ddd;   // 虚线边框                               │
  │    border-radius: 12px;       // 圆角                                   │
  │    padding: 40px;             // 内边距                                 │
  │    text-align: center;        // 居中                                   │
  │    cursor: pointer;           // 鼠标手型                               │
  │    transition: all 0.3s;      // 过渡动画                               │
  │  }                                                                      │
  │  .upload-area:hover {                                                  │
  │    border-color: #ec4899;     // 悬停时边框变色                         │
  │    background: #fce7f3;       // 背景色                                 │
  │  }                                                                      │
  │  .upload-area.drag-over {    // 拖拽文件进入时的样式                    │
  │    border-color: #ec4899;                                               │
  │    background: #fce7f3;                                                 │
  │    transform: scale(1.02);    // 轻微放大                               │
  │  }                                                                      │
  │                                                                         │
  │  【图片预览样式】                                                        │
  │  .image-preview {                                                       │
  │    position: relative;        // 相对定位                               │
  │    width: 200px;              // 固定宽度                               │
  │    height: 200px;             // 固定高度                               │
  │    border-radius: 12px;       // 圆角                                   │
  │    overflow: hidden;          // 溢出隐藏                               │
  │  }                                                                      │
  │  .preview-img {                                                         │
  │    width: 100%;               // 全宽                                   │
  │    height: 100%;              // 全高                                   │
  │    object-fit: cover;         // 保持比例裁剪                           │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: object-fit: cover 和 contain 的区别？                      │
  │  A: cover: 保持比例填满容器，可能裁剪                                   │
  │     contain: 保持比例完整显示，可能留白                                 │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【3. 按钮状态样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【按钮状态】                                                            │
  │  .btn-primary {                                                         │
  │    background: linear-gradient(135deg, #ec4899, #f472b6);              │
  │    color: white;                                                        │
  │    padding: 12px 24px;                                                  │
  │    border: none;                                                        │
  │    border-radius: 8px;                                                  │
  │    cursor: pointer;                                                     │
  │    transition: all 0.3s;                                                │
  │  }                                                                      │
  │  .btn-primary:hover {         // 悬停状态                               │
  │    transform: translateY(-2px);                                         │
  │    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);                     │
  │  }                                                                      │
  │  .btn-primary:active {        // 按下状态                               │
  │    transform: translateY(0);                                            │
  │  }                                                                      │
  │  .btn-primary:disabled {      // 禁用状态                               │
  │    opacity: 0.6;              // 降低透明度                             │
  │    cursor: not-allowed;       // 禁止点击                               │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: :disabled 和 [disabled] 有什么区别？                       │
  │  A: :disabled 是伪类选择器，[disabled] 是属性选择器                    │
  │     功能相同，但 :disabled 优先级更高                                   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

【4. 富文本编辑器样式】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  【Quill 编辑器容器】                                                    │
  │  .quill-editor {                                                        │
  │    min-height: 300px;         // 最小高度                               │
  │    border: 2px solid #ddd;                                              │
  │    border-radius: 8px;                                                  │
  │  }                                                                      │
  │  .quill-editor .ql-toolbar {  // 工具栏                                 │
  │    border-bottom: 2px solid #ddd;                                      │
  │    background: #f9fafb;                                                 │
  │  }                                                                      │
  │  .quill-editor .ql-container { // 内容区                                │
  │    min-height: 250px;                                                   │
  │    font-size: 16px;                                                     │
  │  }                                                                      │
  │  .quill-editor .ql-editor {   // 编辑区                                 │
  │    padding: 16px;                                                       │
  │    line-height: 1.6;                                                    │
  │  }                                                                      │
  │                                                                         │
  │  【面试题】Q: 为什么富文本编辑器要防止 XSS？                              │
  │  A: 富文本允许用户输入 HTML，可能包含恶意脚本                           │
  │     需要在服务器端过滤危险标签（<script>、onclick 等）                  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

=============================================================================
  面试题汇总
=============================================================================

【文件上传相关】
  Q1: 如何实现图片压缩后上传？
  A: 使用 Canvas 压缩：
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');
     const img = new Image();
     img.onload = () => {
       canvas.width = img.width * 0.5;  // 缩小一半
       canvas.height = img.height * 0.5;
       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
       canvas.toBlob(blob => {
         // 上传压缩后的 blob
       }, 'image/jpeg', 0.8);  // 质量 80%
     };
     img.src = URL.createObjectURL(file);

  Q2: 如何实现图片裁剪后上传？
  A: 使用 Cropper.js 库，或自己实现 Canvas 裁剪

  Q3: 上传失败如何重试？
  A: 1. 记录失败的文件
     2. 提供重试按钮
     3. 实现断点续传（大文件）

【表单相关】
  Q4: 如何防止表单重复提交？
  A: 1. 提交时禁用按钮（:disabled="isSubmitting"）
     2. 使用防抖/节流
     3. 后端添加请求频率限制

  Q5: 如何实现表单自动保存？
  A: 1. 监听表单变化（watch formData）
     2. 使用防抖延迟保存
     3. 保存到 localStorage 或服务器

【富文本编辑器相关】
  Q6: Quill 编辑器如何自定义工具栏？
  A: 在 modules.toolbar.container 中配置按钮数组

  Q7: 如何处理富文本中的图片？
  A: 1. 监听图片按钮点击
     2. 弹出文件选择器
     3. 上传图片到服务器
     4. 获取 URL 后插入编辑器

=============================================================================
-->


<template>
  <div class="create-page">
    <!-- 主内容区 -->
    <main class="main-content">
      <!-- ============================================================ -->
      <!-- 页面标题区域 -->
      <!-- ============================================================ -->
      <!-- 【动态标题】根据编辑/创建模式显示不同文字 -->
      <!-- 【三元表达式】isEditMode ? '编辑攻略' : '创作攻略' -->
      <!-- ============================================================ -->
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">{{ isEditMode ? '编辑攻略' : '创作攻略' }}</h1>
          <p class="page-subtitle">{{ isEditMode ? '修改你的攻略内容' : '分享你的经验和知识' }}</p>
        </div>
      </div>
      
      <!-- ============================================================ -->
      <!-- 创作表单 -->
      <!-- ============================================================ -->
      <!-- 【@submit.prevent】阻止表单默认提交，调用submitForm方法 -->
      <!-- 【.prevent】是事件修饰符，等同于event.preventDefault() -->
      <!-- ============================================================ -->
      <div class="container">
        <form class="create-form" @submit.prevent="submitForm">
          
          <!-- ============================================================ -->
          <!-- 文章类型选择器 -->
          <!-- ============================================================ -->
          <!-- 【作用】切换长文章/短文章模式 -->
          <!-- 【:class】动态绑定类名，active表示选中状态 -->
          <!-- 【:disabled】编辑模式下禁止切换类型 -->
          <!-- ============================================================ -->
          <div class="form-section">
            <label class="form-label">文章类型</label>
            <div class="article-type-selector">
              <!-- 长文章按钮 -->
              <button 
                type="button" 
                class="type-btn" 
                :class="{ active: formData.articleType === 'long' }"
                @click="setArticleType('long')"
                :disabled="isEditMode"
              >
                <span class="nav-icon">📝</span>
                <span>长文章</span>
                <small>知乎风格</small>
              </button>
              <!-- 短文章按钮 -->
              <button 
                type="button" 
                class="type-btn" 
                :class="{ active: formData.articleType === 'short' }"
                @click="setArticleType('short')"
                :disabled="isEditMode"
              >
                <span class="nav-icon">📱</span>
                <span>短文章</span>
                <small>小红书风格</small>
              </button>
            </div>
            <!-- 编辑模式提示 -->
            <p v-if="isEditMode" class="form-hint" style="color: #666;">编辑模式下不支持切换文章类型</p>
          </div>
          
          <!-- ============================================================ -->
          <!-- 标题输入框 -->
          <!-- ============================================================ -->
          <!-- 【v-model】双向数据绑定，输入内容自动更新到formData.title -->
          <!-- 【placeholder】输入提示文字 -->
          <!-- 【id + for】关联label，点击label聚焦输入框 -->
          <!-- ============================================================ -->
          <div class="form-section">
            <label for="title" class="form-label">文章标题</label>
            <input 
              type="text" 
              id="title" 
              class="form-input" 
              placeholder="请输入文章标题"
              v-model="formData.title"
            >
          </div>
          
          <!-- ============================================================ -->
          <!-- 分类选择器（仅创建模式显示） -->
          <!-- ============================================================ -->
          <!-- 【v-if】只在非编辑模式显示 -->
          <!-- 【说明】编辑模式下分类已转换为 tags，不需要再选择 -->
          <!-- ============================================================ -->
          <div class="form-section" v-if="!isEditMode">
            <label for="category" class="form-label">选择分类</label>
            <select id="category" class="form-select" v-model="formData.category">
              <option value="">请选择分类</option>
              <option value="游戏攻略">游戏攻略</option>
              <option value="旅游攻略">旅游攻略</option>
              <option value="美食攻略">美食攻略</option>
              <option value="科技攻略">科技攻略</option>
              <option value="健身攻略">健身攻略</option>
              <option value="美妆攻略">美妆攻略</option>
              <option value="学习攻略">学习攻略</option>
            </select>
          </div>
          
          <!-- ============================================================ -->
          <!-- 话题展示（仅当有话题时显示） -->
          <!-- ============================================================ -->
          <!-- 【v-if】条件渲染，只在有话题时显示 -->
          <!-- 【场景】从话题页面跳转过来时自动关联话题 -->
          <!-- ============================================================ -->
          <div class="form-section" v-if="formData.topic">
            <label class="form-label">当前话题</label>
            <div class="topic-selector topic-locked">
              <!-- 话题展示 -->
              <div class="topic-display">
                <span class="topic-name">{{ getTopicName(formData.topic) }}</span>
              </div>
              <!-- 锁定提示 -->
              <div class="topic-lock-hint">
                <span class="nav-icon">🔒</span>
                <span v-if="isEditMode">话题已锁定，不可修改</span>
                <span v-else>话题已锁定，来自当前页面</span>
              </div>
            </div>
          </div>
          
          <!-- ============================================================ -->
          <!-- 长文章模式字段 -->
          <!-- ============================================================ -->
          <!-- 【v-if】只在长文章模式下显示 -->
          <!-- 【包含】封面图片、富文本编辑器、标签 -->
          <!-- ============================================================ -->
          <div v-if="formData.articleType === 'long'">
            
            <!-- 封面图片上传 -->
            <div class="form-section">
              <label class="form-label">封面图片（可选）</label>
              <div class="image-upload-section">
                <!-- 图片预览（已选择图片时显示） -->
                <div class="image-preview" v-if="formData.imageUrl || selectedImageFile">
                  <!-- 【:src】动态绑定图片地址 -->
                  <!-- 【三元表达式】优先显示新选择的图片，否则显示已有图片 -->
                  <img :src="selectedImageFile ? tempImageUrl : formData.imageUrl" alt="封面预览" class="preview-img">
                  <!-- 移除按钮 -->
                  <button type="button" class="remove-image-btn" @click="removeImage">
                    移除
                  </button>
                </div>
                <!-- 上传区域（未选择图片时显示） -->
                <div class="image-upload-placeholder" v-else @dragover.prevent @dragenter.prevent @dragleave.prevent @drop.prevent="handleDragUpload" @click="handleImageUploadClick">
                  <span class="nav-icon">📷</span>
                  <p>点击或拖拽图片到此处上传</p>
                  <!-- 隐藏的文件输入框 -->
                  <input type="file" class="image-input" accept="image/*" @change="handleImageUpload">
                </div>
              </div>
            </div>
            

            
            <!-- ============================================================ -->
            <!-- 富文本编辑器容器 -->
            <!-- ============================================================ -->
            <!-- 【ref】用于在JS中获取DOM元素 -->
            <!-- 【用途】Quill编辑器会挂载到这个容器 -->
            <!-- 【注意】容器内容会被Quill完全接管 -->
            <!-- ============================================================ -->
            <div class="form-section">
              <label class="form-label">文章内容</label>
              <div ref="quillEditorContainer" class="quill-editor"></div>
              <!-- 隐藏的图片上传输入框（用于编辑器内插入图片） -->
              <input 
                type="file" 
                ref="contentImageInput" 
                class="content-image-input" 
                accept="image/*" 
                style="display: none;" 
                @change="handleContentImageUpload"
              >
            </div>
            
            <!-- 标签输入 -->
            <div class="form-section">
              <label for="tags" class="form-label">标签</label>
              <input 
                type="text" 
                id="tags" 
                class="form-input" 
                placeholder="例如：#游戏 #攻略 #技巧"
                v-model="formData.tags"
              >
            </div>
          </div>
          
          <!-- ============================================================ -->
          <!-- 短文章模式字段 -->
          <!-- ============================================================ -->
          <!-- 【v-else-if】只在短文章模式下显示 -->
          <!-- 【包含】封面图片、媒体文件、短内容、话题标签、位置 -->
          <!-- ============================================================ -->
          <div v-else-if="formData.articleType === 'short'">
            
            <!-- 封面图片上传 -->
            <div class="form-section">
              <label class="form-label">封面图片</label>
              <div class="image-upload-section">
                <div class="image-preview" v-if="formData.imageUrl || selectedImageFile">
                  <img :src="selectedImageFile ? tempImageUrl : formData.imageUrl" alt="封面预览" class="preview-img">
                  <button type="button" class="remove-image-btn" @click="removeImage">
                    移除
                  </button>
                </div>
                <div class="image-upload-placeholder" v-else @dragover.prevent @dragenter.prevent @dragleave.prevent @drop.prevent="handleDragUpload" @click="handleImageUploadClick">
                  <span class="nav-icon">📷</span>
                  <p>点击或拖拽图片到此处上传</p>
                  <input type="file" class="image-input" accept="image/*" @change="handleImageUpload">
                </div>
              </div>
            </div>
            
            <!-- ============================================================ -->
            <!-- 媒体文件上传（短文章专用） -->
            <!-- ============================================================ -->
            <!-- 【支持】图片和视频 -->
            <!-- 【限制】最多9个 -->
            <!-- 【v-for】循环渲染已上传的媒体 -->
            <!-- ============================================================ -->
            <div class="form-section">
              <label class="form-label">媒体文件</label>
              <p class="form-hint">支持多张图片或视频，最多9张</p>
              <div class="media-upload-section">
                <!-- 已上传媒体预览列表 -->
                <div class="media-preview-list">
                  <!-- 【v-for】循环渲染每个媒体文件 -->
                  <!-- 【:key】Vue要求每个循环项有唯一key -->
                  <div v-for="(media, index) in formData.mediaFiles" :key="index" class="media-preview-item">
                    <!-- 图片预览 -->
                    <img v-if="media.mediaType === 'image'" :src="media.url" :alt="`媒体 ${index + 1}`" class="media-preview-img">
                    <!-- 视频预览 -->
                    <video v-else class="media-preview-video" controls>
                      <source :src="media.url" type="video/mp4">
                    </video>
                    <!-- 移除按钮 -->
                    <button type="button" class="remove-media-btn" @click="removeMedia(index)">
                    移除
                  </button>
                  </div>
                </div>
                
                <!-- 上传按钮（未达到上限时显示） -->
                <div v-if="formData.mediaFiles.length < 9" class="media-upload-placeholder" @click="$event.currentTarget.querySelector('.media-input').click()">
                  <span class="nav-icon">🖼️</span>
                  <p>添加图片或视频</p>
                  <input 
                    type="file" 
                    class="media-input" 
                    accept="image/*,video/*" 
                    multiple
                    @change="handleMediaUpload"
                  >
                </div>
              </div>
            </div>
            
            <!-- ============================================================ -->
            <!-- 短内容输入框 -->
            <!-- ============================================================ -->
            <!-- 【maxlength】限制最大字符数 -->
            <!-- 【rows】文本框行数 -->
            <!-- 【字符计数】显示当前字数/最大字数 -->
            <!-- ============================================================ -->
            <div class="form-section">
              <label for="shortContent" class="form-label">文章内容</label>
              <p class="form-hint">最多2000字</p>
              <textarea 
                id="shortContent" 
                v-model="formData.shortContent" 
                class="form-textarea" 
                placeholder="分享你的经验和知识..."
                rows="5"
                maxlength="2000"
              ></textarea>
              <!-- 字符计数 -->
              <div class="char-count">{{ formData.shortContent.length }}/2000</div>
            </div>
            
            <!-- 话题标签 -->
            <div class="form-section">
              <label for="hashtags" class="form-label">话题标签</label>
              <p class="form-hint">例如：#游戏攻略 #旅游体验</p>
              <input 
                type="text" 
                id="hashtags" 
                class="form-input" 
                placeholder="输入话题标签，用空格分隔"
                v-model="formData.hashtags"
              >
            </div>
            
            <!-- 位置信息 -->
            <div class="form-section">
              <label for="location" class="form-label">位置信息（可选）</label>
              <input 
                type="text" 
                id="location" 
                class="form-input" 
                placeholder="例如：北京故宫"
                v-model="formData.location"
              >
            </div>
          </div>
          
          <!-- ============================================================ -->
          <!-- 发布按钮区域 -->
          <!-- ============================================================ -->
          <!-- 【:disabled】提交中禁用按钮，防止重复提交 -->
          <!-- 【动态文字】根据状态显示不同文字 -->
          <!-- ============================================================ -->
          <div class="form-section form-actions">
            <button type="button" class="btn btn-secondary" @click="cancelCreate">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <!-- 提交中显示加载图标 -->
              <span class="nav-icon" v-if="isSubmitting">🔄</span>
              <!-- 正常状态显示对应图标 -->
              <span class="nav-icon" v-else>{{ isEditMode ? '📝' : '🚀' }}</span>
              <!-- 动态按钮文字 -->
              {{ isSubmitting ? (isEditMode ? '更新中...' : '发布中...') : (isEditMode ? '更新攻略' : '发布攻略') }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script>
// ============================================================
// Create.vue - 文章创作/编辑页面组件
// ============================================================
// 【组件职责】
// 1. 提供文章创作界面（长文章/短文章两种模式）
// 2. 支持文章编辑功能
// 3. 处理图片、媒体文件上传
// 4. 集成富文本编辑器（Quill）
// 
// 【学习重点】
// 1. 表单双向绑定（v-model）
// 2. 条件渲染（v-if/v-else）
// 3. 文件上传处理（FormData）
// 4. 富文本编辑器集成
// 5. 表单验证逻辑
// 6. 编辑模式与创建模式的切换
// 
// 【面试常问】
// Q1: 如何处理大文件上传？
// Q2: 富文本编辑器如何防止XSS攻击？
// Q3: 编辑模式和创建模式如何复用代码？
// Q4: 图片预览是如何实现的？
// ============================================================

import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default {
  name: 'Create',
  components: {
  },
  data() {
    return {
      // ============================================================
      // 状态控制相关数据
      // ============================================================
      // 【isSubmitting】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记表单是否正在提交中
      // 使用场景：禁用提交按钮、显示加载状态
      // 注意：防止用户重复点击提交
      // ============================================================
      isSubmitting: false,
      
      // 【isEditMode】
      // 类型：Boolean
      // 初始值：false
      // 作用：标记当前是否为编辑模式
      // 使用场景：区分创建/编辑操作、控制UI显示
      // 判断依据：路由参数中是否有文章ID
      // ============================================================
      isEditMode: false,
      
      // 【currentBlogId】
      // 类型：String | null
      // 初始值：null
      // 作用：存储当前编辑的文章ID
      // 使用场景：编辑模式下更新文章
      // 获取时机：从路由参数 $route.params.id 获取
      // ============================================================
      currentBlogId: null,
      
      // ============================================================
      // 表单数据对象
      // ============================================================
      // 【formData】
      // 类型：Object
      // 作用：存储所有表单输入数据
      // 使用场景：v-model双向绑定、提交数据
      // ============================================================
      formData: {
        // 【title】
        // 类型：String
        // 作用：文章标题
        // 验证：必填，至少5个字符
        title: '',
        
        // 【category】
        // 类型：String
        // 作用：文章分类
        // 可选值：游戏攻略、旅游攻略、美食攻略等
        category: '',
        
        // 【topic】
        // 类型：String
        // 作用：关联的话题ID
        // 来源：从URL参数或选择器获取
        topic: '',
        
        // 【topicName】
        // 类型：String
        // 作用：话题名称（用于显示）
        topicName: '',
        
        // 【imageUrl】
        // 类型：String
        // 作用：封面图片URL
        // 来源：上传后返回的URL或编辑时加载的URL
        imageUrl: '',
        
        // 【content】
        // 类型：String
        // 作用：长文章内容（HTML格式）
        // 来源：Quill编辑器输出
        content: '',
        
        // 【tags】
        // 类型：String
        // 作用：长文章标签（#标签 格式）
        // 示例：'#游戏 #攻略 #技巧'
        tags: '',
        
        // 【articleType】
        // 类型：String
        // 初始值：'long'
        // 作用：文章类型
        // 可选值：'long'（长文章）、'short'（短文章）
        // 影响：决定显示哪些表单字段
        articleType: 'long',
        
        // 【mediaFiles】
        // 类型：Array
        // 作用：短文章的媒体文件列表
        // 数据结构：[{ url: '图片URL', mediaType: 'image/video' }, ...]
        // 限制：最多9个文件
        mediaFiles: [],
        
        // 【shortContent】
        // 类型：String
        // 作用：短文章内容（纯文本）
        // 限制：最多2000字
        shortContent: '',
        
        // 【hashtags】
        // 类型：String
        // 作用：短文章话题标签
        // 示例：'#游戏攻略 #旅游体验'
        hashtags: '',
        
        // 【location】
        // 类型：String
        // 作用：位置信息（短文章专用）
        // 示例：'北京故宫'
        location: ''
      },
      
      // ============================================================
      // 图片上传相关数据
      // ============================================================
      // 【selectedImageFile】
      // 类型：File | null
      // 初始值：null
      // 作用：存储用户选择的封面图片文件对象
      // 使用场景：上传前预览、提交时上传
      // 注意：需要转换为FormData上传
      // ============================================================
      selectedImageFile: null,
      
      // 【tempImageUrl】
      // 类型：String | null
      // 初始值：null
      // 作用：临时图片预览URL（blob URL）
      // 生成方式：URL.createObjectURL(file)
      // 注意：组件销毁时需要释放，避免内存泄漏
      // ============================================================
      tempImageUrl: null,
      
      // 【originalImageUrl】
      // 类型：String | null
      // 初始值：null
      // 作用：编辑模式下保存原始图片URL
      // 使用场景：用户取消选择新图片时恢复
      // ============================================================
      originalImageUrl: null,

      // ============================================================
      // 富文本编辑器实例
      // ============================================================
      // 【quillEditor】
      // 类型：Quill实例 | null
      // 初始值：null
      // 作用：Quill富文本编辑器实例
      // 使用场景：获取/设置编辑器内容、插入图片
      // 生命周期：在mounted中初始化，beforeDestroy中销毁
      // ============================================================
      quillEditor: null
    };
  },
  
  // ============================================================
  // 生命周期钩子 - mounted
  // ============================================================
  // 【调用时机】组件挂载完成后执行
  // 【作用】
  // 1. 检查是否为编辑模式
  // 2. 处理URL中的话题参数
  // 3. 加载文章详情（编辑模式）
  // 4. 初始化富文本编辑器
  // 
  // 【面试常问】
  // Q: 为什么用mounted而不是created？
  // A: 因为需要操作DOM元素（Quill编辑器容器）
  // ============================================================
  mounted() {
    // ============================================================
    // 处理URL中的topic参数
    // ============================================================
    // 【场景】用户从话题页面点击"发布文章"
    // 【URL示例】/create?topic=123&topicName=游戏攻略
    // 【作用】自动关联当前话题
    // ============================================================
    if (this.$route.query.topic) {
      this.formData.topic = this.$route.query.topic;
      if (this.$route.query.topicName) {
        this.formData.topicName = this.$route.query.topicName;
      }
    }
    
    // ============================================================
    // 处理编辑模式
    // ============================================================
    // 【判断依据】路由参数中是否有文章ID
    // 【URL示例】/create/123（编辑ID为123的文章）
    // 【流程】
    // 1. 设置编辑模式标志
    // 2. 保存文章ID
    // 3. 加载文章详情
    // ============================================================
    if (this.$route.params.id) {
      this.isEditMode = true;
      this.currentBlogId = this.$route.params.id;
      this.loadBlogDetail(this.currentBlogId);
    } else {
      // 创建模式：初始化富文本编辑器
      // $nextTick确保DOM已更新
      this.$nextTick(() => {
        this.initQuillEditor();
      });
    }
  },
  
  methods: {
    // ============================================================
    // 标签解析方法
    // ============================================================
    // 【作用】将标签字符串解析为数组
    // 【输入示例】'#游戏 #攻略, 技巧、心得'
    // 【输出示例】['游戏', '攻略', '技巧', '心得']
    // 
    // 【支持的格式】
    // 1. #标签名
    // 2. 逗号分隔
    // 3. 空格分隔
    // 4. 顿号分隔
    // 
    // 【面试常问】
    // Q: 为什么要支持多种分隔符？
    // A: 提升用户体验，让用户无需记住特定格式
    // ============================================================
    parseTags(tagString) {
      if (!tagString) return [];
      
      // 统一处理：先把所有可能的分隔符换成空格
      let processed = tagString
        .replace(/,/g, ' ')  // 英文逗号换空格
        .replace(/，/g, ' ')  // 中文逗号换空格
        .replace(/、/g, ' ')  // 顿号换空格
        .replace(/\s+/g, ' ') // 多个空格合并成一个
        .trim();
      
      // 分割成标签数组，过滤空标签
      let tags = processed.split(' ').filter(tag => tag.trim());
      
      // 处理#号：如果标签以#开头，去掉#；如果没有#，保持原样
      tags = tags.map(tag => {
        tag = tag.trim();
        if (tag.startsWith('#')) {
          return tag.slice(1);  // 去掉#号
        }
        return tag;
      }).filter(tag => tag); // 再次过滤空标签
      
      return tags;
    },
    
    // ============================================================
    // 标签格式化方法
    // ============================================================
    // 【作用】将标签数组格式化为字符串
    // 【输入示例】['游戏', '攻略', '技巧']
    // 【输出示例】'#游戏 #攻略 #技巧'
    // 【使用场景】编辑模式下显示已有标签
    // ============================================================
    formatTags(tags) {
      if (!tags || !Array.isArray(tags)) return '';
      return tags.map(tag => `#${tag}`).join(' ');
    },
    
    // ============================================================
    // 初始化 Quill 富文本编辑器
    // ============================================================
    // 【作用】创建并配置Quill编辑器实例
    // 【调用时机】
    // 1. 组件mounted时（创建模式）
    // 2. 切换到长文章模式时
    // 3. 编辑模式加载文章后
    // 
    // 【Quill配置说明】
    // - theme: 'snow' - 使用雪白主题
    // - modules.toolbar - 工具栏按钮配置
    // - placeholder - 占位提示文字
    // 
    // 【工具栏功能】
    // 1. 文本格式：粗体、斜体、下划线、删除线
    // 2. 段落格式：标题、引用、代码块、列表
    // 3. 样式：字体大小、颜色、对齐方式
    // 4. 插入：图片
    // 
    // 【面试常问】
    // Q1: 为什么先销毁现有实例？
    // A: 避免重复初始化导致的事件监听器重复绑定
    // 
    // Q2: text-change事件有什么用？
    // A: 实时同步编辑器内容到Vue数据
    // ============================================================
    initQuillEditor() {
      // 先销毁现有的编辑器实例，避免重复初始化
      this.destroyQuillEditor();
      
      // 确保容器元素存在
      if (!this.$refs.quillEditorContainer) {
        console.error('富文本编辑器容器元素不存在');
        return;
      }
      
      // ============================================================
      // 工具栏配置
      // ============================================================
      // 每个数组代表一组按钮
      // ['bold', 'italic'] - 粗体和斜体按钮
      // [{ 'header': 1 }] - 下拉选择标题级别
      // ============================================================
      const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // 文本样式：粗体, 斜体, 下划线, 删除线
        ['blockquote', 'code-block'],                     // 块级元素：引用, 代码块
        [{ 'header': 1 }, { 'header': 2 }],              // 标题级别：H1, H2
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],    // 列表：有序列表, 无序列表
        [{ 'script': 'sub' }, { 'script': 'super' }],     // 上下标：下标, 上标
        [{ 'indent': '-1' }, { 'indent': '+1' }],         // 缩进：减少缩进, 增加缩进
        [{ 'direction': 'rtl' }],                         // 文本方向：从右到左
        [{ 'size': ['small', false, 'large', 'huge'] }],  // 字体大小
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // 标题级别选择器
        [{ 'color': [] }, { 'background': [] }],          // 颜色：文字颜色, 背景颜色
        [{ 'font': [] }],                                 // 字体选择
        [{ 'align': [] }],                                // 对齐方式
        ['clean'],                                        // 清除格式
        ['image']                                         // 插入图片
      ];
      
      // 创建Quill实例
      this.quillEditor = new Quill(this.$refs.quillEditorContainer, {
        theme: 'snow',  // 使用snow主题（白色简洁风格）
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              // 自定义图片上传处理
              'image': this.handleQuillImageUpload
            }
          }
        },
        placeholder: '请输入文章内容...'
      });
      
      // ============================================================
      // 监听内容变化
      // ============================================================
      // 【事件】text-change
      // 【触发时机】编辑器内容发生任何变化时
      // 【作用】将编辑器HTML内容同步到Vue数据
      // 【注意】root.innerHTML获取的是HTML格式内容
      // ============================================================
      this.quillEditor.on('text-change', () => {
        this.formData.content = this.quillEditor.root.innerHTML;
      });
    },
    
    // ============================================================
    // 处理 Quill 编辑器的图片上传
    // ============================================================
    // 【作用】点击工具栏图片按钮时触发
    // 【流程】
    // 1. 触发隐藏的文件输入框
    // 2. 用户选择图片后调用handleContentImageUpload
    // ============================================================
    handleQuillImageUpload() {
      this.$refs.contentImageInput.click();
    },
    
    // ============================================================
    // 获取话题名称
    // ============================================================
    // 【作用】根据话题ID获取话题名称
    // 【参数】topicId - 话题ID
    // 【返回值】话题名称
    // ============================================================
    getTopicName(topicId) {
      // 优先使用formData.topicName，如果没有则返回topicId
      return this.formData.topicName || topicId;
    },

    // ============================================================
    // 显示通知消息
    // ============================================================
    // 【作用】在页面右上角显示操作结果提示
    // 【参数】
    // - message: 提示消息内容
    // - type: 提示类型（success/error/warning/info）
    // 
    // 【实现原理】
    // 1. 创建DOM元素
    // 2. 设置样式和动画
    // 3. 添加到body
    // 4. 定时移除
    // 
    // 【面试常问】
    // Q: 为什么不用Vue组件实现？
    // A: 通知需要在任何地方都能调用，DOM方式更灵活
    // ============================================================
    showNotification(message, type = 'info') {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      // 创建图标元素
      const icon = document.createElement('span');
      icon.className = 'nav-icon';
      
      // 根据类型设置不同图标
      switch (type) {
        case 'success':
          icon.textContent = '✅';  // 成功：绿色勾
          break;
        case 'error':
          icon.textContent = '❌';  // 错误：红色叉
          break;
        case 'warning':
          icon.textContent = '⚠️';  // 警告：黄色感叹号
          break;
        default:
          icon.textContent = 'ℹ️';  // 信息：蓝色i
      }
      
      // 创建消息文本元素
      const messageText = document.createElement('span');
      messageText.textContent = message;
      
      // 组装通知元素
      notification.appendChild(icon);
      notification.appendChild(messageText);
      
      // 设置基础样式
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%) translateY(-20px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 320px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
      `;
      
      // 设置图标样式
      icon.style.cssText = `
        font-size: 18px;
        flex-shrink: 0;
      `;
      
      // 根据类型设置背景色
      switch (type) {
        case 'success':
          notification.style.backgroundColor = '#4caf50';  // 绿色
          icon.style.color = '#e8f5e8';
          break;
        case 'error':
          notification.style.backgroundColor = '#f44336';  // 红色
          icon.style.color = '#ffebee';
          break;
        case 'warning':
          notification.style.backgroundColor = '#ff9800';  // 橙色
          icon.style.color = '#fff3e0';
          break;
        default:
          notification.style.backgroundColor = '#2196f3';  // 蓝色
          icon.style.color = '#e3f2fd';
      }
      
      // 添加到页面
      document.body.appendChild(notification);
      
      // 显示动画：从右侧滑入
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0) translateY(0)';
      }, 100);
      
      // 3.5秒后隐藏通知
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%) translateY(-20px)';
        // 动画结束后移除元素
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 400);
      }, 3500);
    },

    // ============================================================
    // 处理封面图片上传（点击上传）
    // ============================================================
    // 【作用】处理用户通过文件选择器上传的图片
    // 【触发】用户点击上传区域选择文件
    // 【参数】event - 文件选择事件
    // ============================================================
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.processImageFile(file);
      }
    },
    
    // ============================================================
    // 处理拖拽上传
    // ============================================================
    // 【作用】处理用户拖拽图片到上传区域
    // 【触发】用户拖拽文件到上传区域并释放
    // 【参数】event - 拖拽事件
    // 【验证】只接受图片类型文件
    // ============================================================
    handleDragUpload(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        // 验证文件类型是否为图片
        if (file.type.startsWith('image/')) {
          this.processImageFile(file);
        } else {
          this.showNotification('请拖拽图片文件', 'error');
        }
      }
    },
    
    // ============================================================
    // 处理图片文件（核心方法）
    // ============================================================
    // 【作用】统一处理图片文件，生成预览
    // 【流程】
    // 1. 释放之前的临时URL（避免内存泄漏）
    // 2. 生成新的blob URL用于预览
    // 3. 保存文件对象用于后续上传
    // 
    // 【重要知识点】
    // URL.createObjectURL(file)
    // - 作用：为File对象创建一个blob URL
    // - 格式：blob:http://localhost:8080/xxxx-xxxx
    // - 特点：只在当前页面有效，刷新后失效
    // - 注意：需要手动释放，否则会内存泄漏
    // 
    // 【面试常问】
    // Q: 为什么要在创建新URL前释放旧URL？
    // A: blob URL会占用内存，不释放会导致内存泄漏
    // ============================================================
    processImageFile(file) {
      // 释放之前的临时URL，避免内存泄漏
      if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.tempImageUrl);
      }
      
      // 生成新的临时URL用于本地预览
      // blob URL格式：blob:http://localhost:8080/唯一标识
      this.tempImageUrl = URL.createObjectURL(file);
      
      // 保存选中的文件对象（用于后续上传）
      this.selectedImageFile = file;
      
      // 更新formData.imageUrl为临时URL，以便在页面上显示预览
      this.formData.imageUrl = this.tempImageUrl;
      
      // 显示成功提示
      this.showNotification('封面图片已选择，预览成功！', 'success');
    },
    
    // ============================================================
    // 处理封面图片上传区域的点击事件
    // ============================================================
    // 【作用】点击上传区域时触发文件选择器
    // 【参数】event - 点击事件
    // 【实现】查找隐藏的input元素并触发点击
    // ============================================================
    handleImageUploadClick(event) {
      // 查找最近的image-input元素
      const inputElement = event.currentTarget.querySelector('.image-input');
      if (inputElement) {
        inputElement.click();
      }
    },
    
    // 处理视频上传

    

    
    removeImage() {
      if (confirm('确定要移除封面图片吗？')) {
        if (this.isEditMode) {
          // 在编辑模式下，用户点击移除图片时，直接清空图片
          // 这样用户可以选择不上传新图片，或者重新选择其他图片
          this.formData.imageUrl = '';
          this.selectedImageFile = null;
          // 释放临时图片URL，避免内存泄漏
          if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.tempImageUrl);
            this.tempImageUrl = null;
          }
          this.showNotification('封面图片已移除，您可以选择新的图片或保持为空', 'info');
        } else {
          // 在创建模式下，直接清空图片
          this.formData.imageUrl = '';
          this.selectedImageFile = null;
          // 释放临时图片URL，避免内存泄漏
          if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(this.tempImageUrl);
            this.tempImageUrl = null;
          }
          this.showNotification('封面图片已移除', 'info');
        }
      }
    },
    

    
    // 插入图片到内容
    insertImage() {
      this.$refs.contentImageInput.click();
    },
    
    // ============================================================
    // 处理内容中的图片上传（Quill编辑器）
    // ============================================================
    // 【作用】处理Quill编辑器中插入的图片
    // 【流程】
    // 1. 获取用户选择的图片文件
    // 2. 创建FormData对象
    // 3. 调用后端API上传图片
    // 4. 获取返回的图片URL
    // 5. 在编辑器光标位置插入图片
    // 
    // 【FormData】
    // - 作用：构造表单数据，用于文件上传
    // - 格式：multipart/form-data
    // - 注意：不能直接用JSON发送文件
    // 
    // 【面试常问】
    // Q: 为什么用FormData而不是JSON？
    // A: JSON不支持二进制数据，文件上传必须用FormData
    // ============================================================
    handleContentImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // 创建FormData对象用于文件上传
        const formData = new FormData();
        formData.append('image', file);
        
        // 显示加载状态
        this.isSubmitting = true;
        
        // 调用后端 API 上传图片
        this.$http.post('/api/blogs/upload-image', formData)
        .then(data => {
          if (data.success) {
            // 在 Quill 编辑器中插入图片
            // getSelection() 获取当前光标位置
            const range = this.quillEditor.getSelection();
            // insertEmbed 在指定位置插入嵌入内容（图片）
            this.quillEditor.insertEmbed(range.index, 'image', data.data.url);
            this.showNotification('图片插入成功！', 'success');
          } else {
            this.showNotification(`图片上传失败: ${data.message}`, 'error');
          }
        })
        .catch(error => {
          console.error('上传图片失败:', error);
          this.showNotification('上传图片失败，请稍后重试', 'error');
        })
        .finally(() => {
          this.isSubmitting = false;
          // 重置文件输入，允许再次选择同一文件
          event.target.value = '';
        });
      }
    },
    
    // ============================================================
    // 设置文章类型
    // ============================================================
    // 【作用】切换长文章/短文章模式
    // 【参数】type - 'long' 或 'short'
    // 
    // 【切换时的处理】
    // 1. 编辑模式禁止切换
    // 2. 长文章：初始化Quill编辑器，清空短文章字段
    // 3. 短文章：销毁Quill编辑器，清空长文章字段
    // 
    // 【面试常问】
    // Q: 为什么切换类型要清空字段？
    // A: 避免数据混乱，两种模式字段不同
    // ============================================================
    setArticleType(type) {
      // 编辑模式下不允许切换文章类型
      if (this.isEditMode) {
        this.showNotification('编辑模式下不支持切换文章类型', 'warning');
        return;
      }
      
      // 更新文章类型
      this.formData.articleType = type;
      
      // 切换类型时重置相关字段
      if (type === 'long') {
        // 切换到长文章：清空短文章相关字段
        this.formData.mediaFiles = [];
        this.formData.shortContent = '';
        this.formData.hashtags = '';
        this.formData.location = '';
        // 初始化富文本编辑器
        // $nextTick确保DOM已更新
        this.$nextTick(() => {
          this.initQuillEditor();
        });
      } else if (type === 'short') {
        // 切换到短文章：清空长文章相关字段
        this.formData.content = '';
        this.formData.tags = '';
        // 销毁富文本编辑器
        this.destroyQuillEditor();
        // 强制清理所有Quill相关的DOM元素
        this.$nextTick(() => {
          // 查找并移除所有Quill工具栏和容器元素
          const quillElements = document.querySelectorAll('.ql-toolbar.ql-snow, .ql-container.ql-snow');
          quillElements.forEach(element => {
            element.remove();
          });
        });
      }
    },
    
    // ============================================================
    // 销毁富文本编辑器
    // ============================================================
    // 【作用】清理Quill编辑器实例和相关DOM
    // 【调用时机】
    // 1. 切换到短文章模式时
    // 2. 重新初始化编辑器前
    // 3. 组件销毁时
    // 
    // 【清理步骤】
    // 1. 移除事件监听器
    // 2. 清空容器内容
    // 3. 移除工具栏DOM
    // 4. 重置实例引用
    // 
    // 【面试常问】
    // Q: 为什么不直接设为null？
    // A: 需要清理事件监听器和DOM，否则会内存泄漏
    // ============================================================
    destroyQuillEditor() {
      if (this.quillEditor) {
        // 移除所有事件监听器
        this.quillEditor.off();
        // 清理DOM元素
        if (this.$refs.quillEditorContainer) {
          // 清空容器内容
          this.$refs.quillEditorContainer.innerHTML = '';
          // 移除所有子元素
          while (this.$refs.quillEditorContainer.firstChild) {
            this.$refs.quillEditorContainer.removeChild(this.$refs.quillEditorContainer.firstChild);
          }
        }
        // 查找并移除可能存在的工具栏元素
        const toolbarElements = document.querySelectorAll('.ql-toolbar.ql-snow');
        toolbarElements.forEach(toolbar => {
          // 检查工具栏是否是当前编辑器的一部分
          const editorContainer = this.$refs.quillEditorContainer;
          if (editorContainer && (toolbar.parentNode === editorContainer || editorContainer.contains(toolbar))) {
            toolbar.remove();
          }
        });
        // 重置编辑器实例
        this.quillEditor = null;
      }
    },
    
    // ============================================================
    // 处理媒体文件上传（短文章）
    // ============================================================
    // 【作用】处理短文章的图片/视频上传
    // 【触发】用户点击添加媒体按钮
    // 【限制】最多9个文件
    // 【支持】图片和视频
    // ============================================================
    handleMediaUpload(event) {
      const files = event.target.files;
      if (files.length > 0) {
        // 计算剩余可上传数量
        const remainingSlots = 9 - this.formData.mediaFiles.length;
        // 只上传允许的数量
        const filesToUpload = Array.from(files).slice(0, remainingSlots);
        
        // 逐个上传文件
        filesToUpload.forEach(file => {
          this.uploadMediaFile(file);
        });
      }
    },
    
    // ============================================================
    // 上传单个媒体文件
    // ============================================================
    // 【作用】将媒体文件上传到服务器
    // 【流程】
    // 1. 创建FormData
    // 2. 调用上传API
    // 3. 将返回的URL添加到mediaFiles数组
    // 
    // 【数据结构】
    // mediaFiles: [{
    //   url: '图片/视频URL',
    //   mediaType: 'image' 或 'video'
    // }]
    // ============================================================
    uploadMediaFile(file) {
      const formData = new FormData();
      
      // 根据文件类型选择上传接口
      if (file.type.startsWith('video/')) {
        // 视频文件：使用专门的视频上传接口
        formData.append('video', file);
        this.$http.post('/api/blogs/upload-video', formData)
        .then(data => {
          if (data.success) {
            this.formData.mediaFiles.push({
              url: data.data.url,
              mediaType: 'video',
              name: data.data.name,
              size: data.data.size
            });
            this.showNotification('视频上传成功！', 'success');
          } else {
            this.showNotification(`视频上传失败：${data.message}`, 'error');
          }
        })
        .catch(error => {
          console.error('上传视频失败:', error);
          this.showNotification('上传视频失败，请稍后重试', 'error');
        })
        .finally(() => {
          this.isSubmitting = false;
        });
      } else {
        // 图片文件：使用图片上传接口
        formData.append('image', file);
        this.$http.post('/api/blogs/upload-image', formData)
        .then(data => {
          if (data.success) {
            this.formData.mediaFiles.push({
              url: data.data.url,
              mediaType: 'image'
            });
            this.showNotification('图片上传成功！', 'success');
          } else {
            this.showNotification(`图片上传失败：${data.message}`, 'error');
          }
        })
        .catch(error => {
          console.error('上传图片失败:', error);
          this.showNotification('上传图片失败，请稍后重试', 'error');
        })
        .finally(() => {
          this.isSubmitting = false;
        });
      }
    },
    
    // ============================================================
    // 移除媒体文件
    // ============================================================
    // 【作用】从列表中移除指定的媒体文件
    // 【参数】index - 文件在数组中的索引
    // 【注意】只是从数组中移除，不会删除服务器上的文件
    // ============================================================
    removeMedia(index) {
      if (confirm('确定要移除这个媒体文件吗？')) {
        // splice从数组中删除指定索引的元素
        // 参数1：起始索引
        // 参数2：删除数量
        this.formData.mediaFiles.splice(index, 1);
        this.showNotification('媒体文件已移除', 'info');
      }
    },
    
    // ============================================================
    // 取消创建/编辑
    // ============================================================
    // 【作用】清空表单并返回创作列表页
    // 【流程】
    // 1. 释放临时图片URL
    // 2. 重置表单数据
    // 3. 清空选中的文件
    // 4. 跳转到创作列表页
    // ============================================================
    cancelCreate() {
      // 释放临时图片URL，避免内存泄漏
      if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.tempImageUrl);
        this.tempImageUrl = null;
      }
      
      // 清空表单（重置为初始状态）
      this.formData = {
        title: '',
        category: '',
        topic: '',
        topicName: '',
        imageUrl: '',
        content: '',
        tags: '',
        articleType: 'long',
        mediaFiles: [],
        shortContent: '',
        hashtags: '',
        location: ''
      };
      
      // 清空选中的文件
      this.selectedImageFile = null;
      
      // 导航回创作页面
      this.$router.push('/my-creation');
    },
    
    // ============================================================
    // 加载文章详情（编辑模式）
    // ============================================================
    // 【作用】编辑模式下加载文章数据填充表单
    // 【参数】blogId - 文章ID
    // 【流程】
    // 1. 检查登录状态
    // 2. 调用API获取文章详情
    // 3. 处理图片URL
    // 4. 填充表单数据
    // 5. 初始化编辑器（长文章）
    // 
    // 【面试常问】
    // Q: 为什么要处理图片URL？
    // A: 后端返回的可能是相对路径，需要转换为完整URL
    // ============================================================
    async loadBlogDetail(blogId) {
      try {
        // 获取认证令牌
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.showNotification('请先登录', 'warning');
          return;
        }
        
        // 调用 API 获取文章详情
        const data = await this.$http.get(`/api/blogs/${blogId}`);
        
        console.log('📝 加载文章详情 - 后端返回的数据:', data);
        console.log('📝 文章 topic 数据:', data.data?.topic);
        
        if (data.success) {
          const blog = data.data;
          
          // ============================================================
          // 处理封面图片URL
          // ============================================================
          // 【场景】后端返回的图片路径可能是：
          // 1. 完整URL：http://xxx.com/uploads/xxx.jpg
          // 2. 相对路径：/uploads/xxx.jpg
          // 3. 文件名：xxx.jpg
          // 需要统一转换为前端可访问的URL
          // ============================================================
          let imageUrl = blog.image;
          if (imageUrl) {
            if (imageUrl && imageUrl.startsWith('/static/uploads/')) {
              // 如果图片URL以/static/uploads/开头，说明是正确的服务器路径
              // 前端会自动请求到正确的API服务器地址
            } else if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
              // 如果图片URL不是完整的URL，也不是以/static/uploads/开头
              // 可能是相对路径，需要添加/static/uploads/前缀
              imageUrl = `/static/uploads/${imageUrl.replace(/^\/+|^\/*/, '')}`;
            }
          }
          
          // ============================================================
          // 处理媒体文件URL（短文章）
          // ============================================================
          const mediaFiles = blog.mediaFiles || [];
          const processedMediaFiles = mediaFiles.map(media => {
            let mediaUrl = media.url;
            if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
              if (!mediaUrl.startsWith('/static/uploads/')) {
                mediaUrl = `/static/uploads/${mediaUrl.replace(/^\/+|^\/*/, '')}`;
              }
            }
            return {
              url: mediaUrl,
              mediaType: media.mediaType || 'image'
            };
          });
          
          // 填充表单数据
          this.formData = {
            title: blog.title,
            content: blog.content,
            topic: blog.topic ? blog.topic._id : '',
            topicName: blog.topic ? blog.topic.name : '',
            imageUrl: imageUrl,
            tags: this.formatTags(blog.tags),
            articleType: blog.articleType || 'long',
            mediaFiles: processedMediaFiles,
            shortContent: blog.shortContent || '',
            hashtags: this.formatTags(blog.hashtags),
            location: blog.location || ''
          };
          
          // 如果是长文章，初始化富文本编辑器并加载内容
          if (this.formData.articleType === 'long') {
            this.$nextTick(() => {
              this.initQuillEditor();
              if (this.quillEditor) {
                // 设置编辑器内容
                this.quillEditor.root.innerHTML = blog.content || '';
              }
            });
          }
          
          // 保存原始图片URL，用于在用户取消选择图片时恢复
          this.originalImageUrl = imageUrl;
          // 保存当前博客ID
          this.currentBlogId = blogId;
        } else {
          this.showNotification(`加载文章失败: ${data.message}`, 'error');
        }
      } catch (error) {
        console.error('加载文章详情失败:', error);
        this.showNotification('加载文章详情失败，请稍后重试', 'error');
      }
    },
    
    // ============================================================
    // 提交表单（核心方法）
    // ============================================================
    // 【作用】创建或更新文章
    // 【流程】
    // 1. 表单验证
    // 2. 上传封面图片（如果有新图片）
    // 3. 准备提交数据
    // 4. 调用API（POST创建 / PUT更新）
    // 5. 处理响应结果
    // 
    // 【验证规则】
    // - 标题：必填，至少5个字符
    // - 分类：必填
    // - 封面图片：必填
    // - 长文章：内容必填
    // - 短文章：内容和媒体文件必填
    // 
    // 【面试常问】
    // Q1: 编辑模式和创建模式有什么区别？
    // A: 编辑用PUT请求，创建用POST请求
    // 
    // Q2: 为什么先上传图片再提交表单？
    // A: 表单提交需要图片URL，必须先上传获取URL
    // 
    // Q3: blob URL为什么不能直接提交？
    // A: blob URL只在当前页面有效，服务器无法访问
    // ============================================================
    async submitForm() {
      // ============================================================
      // 步骤1：表单验证
      // ============================================================
      
      // 验证标题
      if (!this.formData.title.trim()) {
        this.showNotification('请输入文章标题', 'warning');
        return;
      }
      
      // 验证标题长度（至少 5 个字符）
      if (this.formData.title.trim().length < 5) {
        this.showNotification('标题长度至少为 5 个字符', 'warning');
        return;
      }
      
      // 强制要求设置封面图片（长文章和短文章都需要）
      if (!this.formData.imageUrl) {
        this.showNotification('请设置封面图片', 'warning');
        return;
      }
      
      // 根据文章类型进行验证
      if (this.formData.articleType === 'long') {
        // 长文章验证
        if (!this.formData.content.trim()) {
          this.showNotification('请输入文章内容', 'warning');
          return;
        }
      } else if (this.formData.articleType === 'short') {
        // 短文章验证
        if (!this.formData.shortContent.trim()) {
          this.showNotification('请输入文章内容', 'warning');
          return;
        }
        if (this.formData.mediaFiles.length === 0) {
          this.showNotification('请上传媒体文件', 'warning');
          return;
        }
      }
      
      // 设置提交状态
      this.isSubmitting = true;
      
      try {
        // ============================================================
        // 步骤2：获取认证令牌
        // ============================================================
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          this.showNotification('请先登录', 'warning');
          this.isSubmitting = false;
          return;
        }
        
        // ============================================================
        // 步骤3：上传封面图片（仅当用户选择了新图片时）
        // ============================================================
        let uploadData = null;
        if (this.selectedImageFile) {
          // 创建FormData用于文件上传
          const imageFormData = new FormData();
          imageFormData.append('image', this.selectedImageFile);
          
          // 调用上传API
          uploadData = await this.$http.post('/api/blogs/upload-image', imageFormData);
          if (!uploadData.success) {
            throw new Error(`图片上传失败: ${uploadData.message}`);
          }
        }
        
        // ============================================================
        // 步骤4：准备提交数据
        // ============================================================
        let imageUrl = this.formData.imageUrl;
        
        // 处理封面图片URL
        if (uploadData) {
          // 如果上传了新图片，使用新图片的URL
          imageUrl = uploadData.data.url;
        } else if (this.isEditMode) {
          // 编辑模式：确保使用的不是blob URL
          if (imageUrl && imageUrl.startsWith('blob:')) {
            // blob URL是临时的，使用原始图片URL
            imageUrl = this.originalImageUrl || '';
          } else if (!imageUrl) {
            // 如果imageUrl为空，使用原始图片URL
            imageUrl = this.originalImageUrl || '';
          }
        } else {
          // 创建模式：如果没有上传图片，使用空字符串
          if (!uploadData) {
            imageUrl = '';
          }
        }
        
        // 确保imageUrl不为空
        if (!imageUrl) {
          this.showNotification('封面图片上传失败，请重试', 'error');
          this.isSubmitting = false;
          return;
        }
        
        // 构建提交数据对象
        const submitData = {
          title: this.formData.title,
          topic: this.formData.topic,
          articleType: this.formData.articleType,
          image: imageUrl  // 封面图片 URL
        };
        
        // 如果有分类，转换为 tags
        if (this.formData.category) {
          // 从分类选择器获取的分类，添加到 tags 数组
          const categoryTag = this.formData.category;
          const existingTags = this.parseTags(this.formData.tags);
          
          // 如果 tags 数组里没有这个分类，就添加进去
          if (!existingTags.includes(categoryTag)) {
            existingTags.unshift(categoryTag); // 添加到最前面
          }
          
          // 更新 tags
          this.formData.tags = existingTags.join(', ');
        }
        
        // 根据文章类型添加相应字段
        if (this.formData.articleType === 'long') {
          // 长文章字段
          submitData.content = this.formData.content;
          submitData.video = '';
          submitData.tags = this.parseTags(this.formData.tags);
          // 确保短文章相关字段为空，避免后端验证问题
          submitData.mediaFiles = [];
          submitData.shortContent = '';
          submitData.hashtags = [];
          submitData.location = '';
        } else if (this.formData.articleType === 'short') {
          // 短文章字段
          submitData.mediaFiles = this.formData.mediaFiles;
          submitData.shortContent = this.formData.shortContent;
          submitData.hashtags = this.parseTags(this.formData.hashtags);
          submitData.location = this.formData.location;
          // 确保长文章相关字段为空，避免后端验证问题
          submitData.content = '';
          submitData.video = '';
          submitData.tags = [];
        }
        
        // ============================================================
        // 步骤 5：调用后端 API 提交表单
        // ============================================================
        let data;
        if (this.isEditMode) {
          // 编辑模式：PUT 请求更新文章
          data = await this.$http.put(`/api/blogs/${this.currentBlogId}`, submitData);
        } else {
          // 创建模式：POST 请求创建文章
          data = await this.$http.post('/api/blogs', submitData);
        }
        
        // ============================================================
        // 步骤6：处理响应结果
        // ============================================================
        if (data.success) {
          if (this.isEditMode) {
            this.showNotification('攻略更新成功！', 'success');
          } else {
            this.showNotification('攻略发布成功！', 'success');
          }
          // 清空表单并跳转
          this.cancelCreate();
        } else {
          if (this.isEditMode) {
            this.showNotification(`更新失败: ${data.message}`, 'error');
          } else {
            this.showNotification(`发布失败: ${data.message}`, 'error');
          }
        }
      } catch (error) {
        console.error('发布失败:', error);
        this.showNotification(`发布失败: ${error.message}`, 'error');
      } finally {
        this.isSubmitting = false;
      }
    }
  },
  
  // ============================================================
  // 生命周期钩子 - beforeDestroy
  // ============================================================
  // 【调用时机】组件销毁之前
  // 【作用】清理资源，防止内存泄漏
  // 
  // 【清理内容】
  // 1. 释放blob URL
  // 2. 销毁Quill编辑器
  // 
  // 【面试常问】
  // Q: 为什么要在beforeDestroy而不是destroyed？
  // A: beforeDestroy时组件还在，可以访问this.$refs
  // 
  // Q: 不释放blob URL会怎样？
  // A: 会造成内存泄漏，页面卡顿
  // ============================================================
  beforeDestroy() {
    // 释放临时图片URL，避免内存泄漏
    // URL.revokeObjectURL 释放由 URL.createObjectURL 创建的URL
    if (this.tempImageUrl && this.tempImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.tempImageUrl);
    }
  }
}
</script>

<style scoped>
/* 创作页面 */
.create-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  font-family: var(--font-family);
}

/* 主内容区 */
.main-content {
  padding-bottom: 70px; /* 为底部导航栏预留空间 */
}

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 20px auto 30px;
  max-width: 1200px;
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: var(--text-secondary);
}

/* 创作表单 */
.create-form {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 30px;
}

/* 表单区块 */
.form-section {
  margin-bottom: 25px;
}

/* 表单标签 */
.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

/* 表单输入框 */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
  background-color: white;
  font-family: var(--font-family);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

/* 话题选择器 */
.topic-selector {
  position: relative;
}

.topic-search {
  margin-bottom: 10px;
}

.topic-lock-hint {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--background-dark);
}

.topic-lock-hint i {
  color: var(--accent-green);
}

.topic-selector.topic-locked .form-select {
  background-color: var(--background-light);
  cursor: not-allowed;
}

.topic-selector.topic-locked .form-select:focus {
  border-color: var(--background-dark);
  box-shadow: none;
}

/* 话题展示样式 */
.topic-display {
  padding: 12px 15px;
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  background-color: var(--background-light);
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
}

.topic-name {
  display: inline-block;
  padding: 4px 12px;
  background-color: var(--primary-pink);
  color: white;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* 表单文本域 */
.form-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: var(--font-family);
}

/* Quill 编辑器样式 - 赛璐璐风格 */
.quill-editor {
  min-height: 400px;
  border: 4px solid var(--background-dark) !important;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 0 auto;
  max-width: 100%;
}

.quill-editor:focus {
  outline: none;
  border-color: var(--primary-pink) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3), 0 0 0 3px rgba(236, 72, 153, 0.2);
}

/* Quill 编辑器工具栏样式 - 赛璐璐风格 */
::v-deep .ql-toolbar.ql-snow {
  border: 4px solid var(--background-dark) !important;
  border-bottom: 4px solid var(--background-dark) !important;
  border-radius: 10px 10px 0 0 !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  padding: 15px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  z-index: 100;
  position: relative;
}

/* Quill 编辑器内容区域样式 - 赛璐璐风格 */
::v-deep .ql-container.ql-snow {
  border: 4px solid var(--background-dark) !important;
  border-top: none !important;
  border-radius: 0 0 10px 10px !important;
  min-height: 400px !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  background-color: white !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

/* Quill 编辑器内容样式 - 赛璐璐风格 */
::v-deep .ql-editor {
  padding: 20px !important;
  min-height: 400px !important;
  font-family: var(--font-family) !important;
  color: var(--text-primary) !important;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.1);
  line-height: 1.8 !important;
}

/* Quill 编辑器图片样式 - 赛璐璐风格 */
::v-deep .ql-editor img {
  max-width: 100% !important;
  height: auto !important;
  border-radius: 8px !important;
  margin: 20px auto !important;
  border: 4px solid var(--background-dark) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  display: block;
}

/* Quill 编辑器表格样式 - 赛璐璐风格 */
::v-deep .ql-editor table {
  width: 100% !important;
  border-collapse: collapse !important;
  margin: 20px 0 !important;
  border: 4px solid var(--background-dark) !important;
}

::v-deep .ql-editor table th,
::v-deep .ql-editor table td {
  border: 2px solid var(--background-dark) !important;
  padding: 12px !important;
  text-align: left !important;
  font-family: var(--font-family) !important;
  font-size: 16px !important;
}

::v-deep .ql-editor table th {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

/* Quill 编辑器按钮样式 - 赛璐璐风格 */
::v-deep .ql-toolbar.ql-snow button {
  border: 2px solid var(--background-dark) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  cursor: pointer !important;
  padding: 10px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep .ql-toolbar.ql-snow button:hover {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
}

::v-deep .ql-toolbar.ql-snow button.ql-active {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

/* Quill 编辑器下拉菜单样式 - 赛璐璐风格 */
::v-deep .ql-toolbar.ql-snow .ql-picker {
  border: 2px solid var(--background-dark) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  cursor: pointer !important;
  padding: 10px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  min-width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
}

::v-deep .ql-toolbar.ql-snow .ql-picker:hover {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
}

::v-deep .ql-toolbar.ql-snow .ql-picker-label {
  padding: 0 10px !important;
  font-size: 16px !important;
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  display: flex;
  align-items: center;
}

::v-deep .ql-toolbar.ql-snow .ql-picker-options {
  border: 4px solid var(--background-dark) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  font-family: var(--font-family) !important;
  font-size: 16px !important;
  margin-top: 5px !important;
}

/* Quill 编辑器下拉菜单选项样式 - 赛璐璐风格 */
::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item {
  padding: 10px 15px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  color: var(--text-primary) !important;
}

::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item:hover,
::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item.ql-selected {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
}

/* 确保下拉菜单选项在聚焦时保持可见 */
::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item:focus {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  outline: none !important;
}

/* Quill 编辑器字体样式 - 赛璐璐风格 */
::v-deep .ql-editor h1,
::v-deep .ql-editor h2,
::v-deep .ql-editor h3,
::v-deep .ql-editor h4,
::v-deep .ql-editor h5,
::v-deep .ql-editor h6 {
  font-family: var(--font-family) !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  margin: 25px 0 15px 0 !important;
}

::v-deep .ql-editor h1 {
  font-size: 2.5rem !important;
}

::v-deep .ql-editor h2 {
  font-size: 2.2rem !important;
}

::v-deep .ql-editor h3 {
  font-size: 1.8rem !important;
}

::v-deep .ql-editor h4 {
  font-size: 1.5rem !important;
}

::v-deep .ql-editor h5 {
  font-size: 1.3rem !important;
}

::v-deep .ql-editor h6 {
  font-size: 1.1rem !important;
}

::v-deep .ql-editor p {
  font-family: var(--font-family) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  margin: 15px 0 !important;
  color: var(--text-primary) !important;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.1);
}

/* Quill 编辑器列表样式 - 赛璐璐风格 */
::v-deep .ql-editor ol,
::v-deep .ql-editor ul {
  margin: 15px 0 !important;
  padding-left: 40px !important;
}

::v-deep .ql-editor li {
  font-family: var(--font-family) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  margin: 8px 0 !important;
  color: var(--text-primary) !important;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.1);
}

/* Quill 编辑器引用样式 - 赛璐璐风格 */
::v-deep .ql-editor blockquote {
  border-left: 4px solid var(--primary-pink) !important;
  padding-left: 20px !important;
  margin: 20px 0 !important;
  font-style: italic !important;
  font-family: var(--font-family) !important;
  color: var(--text-secondary) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}

/* Quill 编辑器代码块样式 - 赛璐璐风格 */
::v-deep .ql-editor pre.ql-syntax {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  border: 4px solid var(--background-dark) !important;
  border-radius: 6px !important;
  padding: 20px !important;
  font-family: 'Courier New', monospace !important;
  font-size: 16px !important;
  color: var(--text-primary) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 20px 0 !important;
}

/* Quill 编辑器工具栏分组 */
::v-deep .ql-toolbar.ql-snow .ql-formats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 !important;
  padding: 0 !important;
}

/* 确保工具栏按钮对齐 */
::v-deep .ql-toolbar.ql-snow .ql-formats button {
  margin: 0 !important;
  padding: 10px !important;
}

/* 确保下拉菜单对齐 */
::v-deep .ql-toolbar.ql-snow .ql-formats .ql-picker {
  margin: 0 !important;
}

/* 确保表单样式正确应用 */
.create-form {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  border: 4px solid var(--background-dark) !important;
  border-radius: 12px !important;
  padding: 30px !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3) !important;
  margin-bottom: 30px !important;
}

.form-section {
  margin-bottom: 25px !important;
}

.form-label {
  display: block !important;
  margin-bottom: 8px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 0.95rem !important;
}

.form-input,
.form-select,
.form-textarea {
  width: 100% !important;
  padding: 12px 15px !important;
  border: 2px solid var(--background-dark) !important;
  border-radius: 10px !important;
  font-size: 0.95rem !important;
  color: var(--text-primary) !important;
  transition: all 0.3s ease !important;
  background-color: white !important;
  font-family: var(--font-family) !important;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none !important;
  border-color: var(--primary-pink) !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
}

/* 图片上传区域 */
.image-upload-section {
  position: relative;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
}

.remove-image-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

/* 图片上传占位符 */
.image-upload-placeholder {
  border: 4px dashed var(--background-dark);
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.image-upload-placeholder:hover {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  transform: translateY(-2px);
}

.image-upload-placeholder i {
  font-size: 2rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.image-upload-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-family: var(--font-family);
}

.image-input {
  display: none;
}

/* 视频上传区域 */
.video-upload-section {
  position: relative;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.video-upload-placeholder {
  border: 4px dashed var(--background-dark);
  border-radius: 10px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.video-upload-placeholder:hover {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  transform: translateY(-2px);
}

.video-upload-placeholder i {
  font-size: 2rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.video-upload-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-family: var(--font-family);
}

.video-input {
  display: none;
}

/* 媒体上传区域 */
.media-upload-section {
  margin-top: 15px;
}

.media-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.media-preview-item {
  position: relative;
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  transition: all 0.3s ease;
}

.media-preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.media-preview-img,
.media-preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-media-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
}

.remove-media-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
}

.media-upload-placeholder {
  border: 4px dashed var(--background-dark);
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  width: calc(33.333% - 7px);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.media-upload-placeholder:hover {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  transform: translateY(-2px);
}

.media-upload-placeholder i {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.media-upload-placeholder p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  font-family: var(--font-family);
}

.media-input {
  display: none;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  border-radius: 30px;
  padding: 12px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-pink), var(--secondary-pink));
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-pink), #be185d);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 2px solid var(--background-dark);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, #fff 100%);
  box-shadow: 0 4px 12px rgba(251, 207, 232, 0.3);
}

/* 表单提示 */
.form-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 5px;
  margin-bottom: 15px;
  font-family: var(--font-family);
}

/* 字符计数 */
.char-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: right;
  margin-top: 5px;
  font-family: var(--font-family);
}

/* 文章类型选择器 */
.article-type-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.type-btn {
  flex: 1;
  padding: 15px 20px;
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  font-family: var(--font-family);
}

.type-btn:hover {
  border-color: var(--primary-pink);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.type-btn.active {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  color: var(--primary-pink);
  box-shadow: 0 12px 30px rgba(236, 72, 153, 0.3);
}

.type-btn i {
  font-size: 1.5rem;
  margin-bottom: 8px;
  display: block;
}

.type-btn span {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.type-btn small {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.type-btn:disabled:hover {
  border-color: var(--background-dark);
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  transform: none;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .create-form {
    padding: 20px;
  }

  .article-type-selector {
    flex-direction: column;
  }

  .type-btn {
    width: 100%;
  }

  .media-preview-item,
  .media-upload-placeholder {
    width: calc(50% - 5px);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .media-preview-item,
  .media-upload-placeholder {
    width: 100%;
  }
}
</style>