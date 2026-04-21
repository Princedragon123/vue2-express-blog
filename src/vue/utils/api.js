// ============================================================
// api.js - 统一API调用工具（学习版·Axios封装）
// ============================================================
// 
// 【文件职责】
// 封装所有API调用，包括：
// 1. 创建 Axios 实例
// 2. 请求拦截器（添加token）
// 3. 响应拦截器（错误处理、token刷新）
// 4. 统一的API方法封装
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Axios 实例：统一配置 baseURL、timeout、headers                      │
// │  2. 请求拦截器：在请求发送前统一处理（如添加token）                      │
// │  3. 响应拦截器：在响应返回后统一处理（如错误处理）                       │
// │  4. Token 自动刷新：401时自动刷新token并重试请求                        │
// │  5. 模块化API：按功能分组封装API方法                                    │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【Axios 拦截器执行流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   调用 api.get('/api/user/profile')                                    │
// │       │                                                                 │
// │       ▼                                                                 │
// │   ┌─────────────────────────────────────────────────────────┐          │
// │   │  请求拦截器                                             │          │
// │   │  ───────────                                           │          │
// │   │  1. 从 auth 获取 token                                 │          │
// │   │  2. 添加 Authorization 头                              │          │
// │   │  3. 处理 FormData                                      │          │
// │   │  4. 返回 config                                        │          │
// │   └─────────────────────────────────────────────────────────┘          │
// │       │                                                                 │
// │       ▼                                                                 │
// │   发送请求到服务器                                                      │
// │   ────────────────                                                     │
// │       │                                                                 │
// │       ▼                                                                 │
// │   服务器返回响应                                                        │
// │   ────────────────                                                     │
// │       │                                                                 │
// │       ▼                                                                 │
// │   ┌─────────────────────────────────────────────────────────┐          │
// │   │  响应拦截器                                             │          │
// │   │  ───────────                                           │          │
// │   │  成功（2xx）：                                         │          │
// │   │    - 检查 data.success                                 │          │
// │   │    - 返回 data 或 reject                               │          │
// │   │                                                        │          │
// │   │  失败（非2xx）：                                       │          │
// │   │    - 401: 尝试刷新token                                │          │
// │   │    - 403: 显示权限不足                                 │          │
// │   │    - 404: 显示资源不存在                               │          │
// │   │    - 500: 显示服务器错误                               │          │
// │   └─────────────────────────────────────────────────────────┘          │
// │       │                                                                 │
// │       ▼                                                                 │
// │   返回数据给调用者                                                      │
// │   ────────────────                                                     │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么用拦截器而不是每次请求手动添加token？
// A: 拦截器统一处理，避免重复代码，便于维护
// 
// Q2: 如何实现token无感刷新？
// A: 401时自动刷新token，然后用新token重试原请求
// 
// Q3: 为什么要创建两个axios实例？
// A: 一个用于普通请求，一个用于刷新token（避免刷新请求也触发拦截器）
// 
// Q4: FormData为什么要删除Content-Type？
// A: 让浏览器自动设置正确的boundary
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================
// axios: HTTP 请求库
import axios from 'axios';

// 认证状态管理
import auth from './auth';

// 通知工具
import { showNotification } from './notification';

// ============================================================
// 创建 Axios 实例
// ============================================================
// 【为什么要创建实例？】
// 1. 统一配置 baseURL、timeout、headers
// 2. 可以创建多个实例，每个实例有不同的配置
// 3. 实例上的拦截器只对该实例生效
// 
// 【配置说明】
// baseURL: 基础URL，所有请求都会加上这个前缀
// timeout: 超时时间（毫秒），超过这个时间请求会被取消
// headers: 默认请求头
// ============================================================
const api = axios.create({
  // 基础URL
  // 【开发环境】http://localhost:3001
  // 【生产环境】应该改为实际服务器地址
  baseURL: 'http://localhost:3001',
  
  // 超时时间：10秒
  // 【作用】防止请求卡住太久
  // 【注意】上传大文件时可能需要更长时间
  timeout: 10000,
  
  // 默认请求头
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================
// 创建刷新token专用的axios实例
// ============================================================
// 【为什么要单独创建？】
// 刷新token的请求不应该触发普通的拦截器
// 否则会形成无限循环：
// 401 → 刷新token → 刷新请求也401 → 再刷新 → ...
// ============================================================
const refreshInstance = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================
// 请求拦截器
// ============================================================
// 【触发时机】调用 api.get()、api.post() 等方法时，在请求发送前执行
// 【作用】统一处理请求配置
// 
// 【interceptors.request.use(成功回调, 失败回调)】
// 成功回调：接收 config 对象，返回修改后的 config
// 失败回调：请求配置出错时执行（很少用到）
// ============================================================
api.interceptors.request.use(
  // ========================================================
  // 成功回调：请求发送前执行
  // ========================================================
  // config: Axios 请求配置对象
  // 包含 url、method、headers、data、params 等
  // ========================================================
  (config) => {
    // ----------------------------------------------------
    // 步骤1：添加认证token
    // ----------------------------------------------------
    // 从认证状态管理获取token
    const token = auth.getToken();
    
    if (token) {
      // 添加 Authorization 请求头
      // 【格式】Bearer <token>
      // 【Bearer】表示这是一个Bearer Token
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ----------------------------------------------------
    // 步骤2：处理 FormData
    // ----------------------------------------------------
    // 【问题】上传文件时使用 FormData
    // 如果手动设置 Content-Type: application/json
    // 会导致服务器无法正确解析文件
    // 
    // 【解决】删除 Content-Type，让浏览器自动设置
    // 浏览器会自动设置正确的 Content-Type 和 boundary
    // ----------------------------------------------------
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // 返回修改后的配置
    return config;
  },
  
  // ========================================================
  // 失败回调：请求配置出错时执行
  // ========================================================
  // 【场景】请求配置有误，根本没发出去
  // 【示例】URL格式错误、请求参数序列化失败等
  // ========================================================
  (error) => {
    console.error('API请求错误:', error);
    // Promise.reject(error)：把错误传递给调用者的 catch
    return Promise.reject(error);
  }
);

// ============================================================
// 响应拦截器
// ============================================================
// 【触发时机】服务器返回响应后，在传递给调用者之前执行
// 【作用】统一处理响应数据和错误
// 
// 【interceptors.response.use(成功回调, 失败回调)】
// 成功回调：HTTP状态码为 2xx 时执行
// 失败回调：HTTP状态码非 2xx 时执行
// ============================================================
api.interceptors.response.use(
  // ========================================================
  // 成功回调：HTTP状态码为 2xx 时执行
  // ========================================================
  // response: Axios 包装的完整响应对象
  // - response.data: 服务器返回的数据
  // - response.status: HTTP状态码
  // - response.headers: 响应头
  // ========================================================
  (response) => {
    // 提取服务器返回的数据
    const data = response.data;
    
    // ----------------------------------------------------
    // 检查业务层面是否成功
    // ----------------------------------------------------
    // 【后端返回格式】
    // 成功：{ success: true, data: {...} }
    // 失败：{ success: false, message: '错误信息' }
    // 
    // 【注意】HTTP 200 不代表业务成功
    // 例如：用户名已存在，HTTP 200，但 success: false
    // ----------------------------------------------------
    if (data.success) {
      // 业务成功：直接返回数据
      return data;
    } else {
      // 业务失败：创建错误并传递
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  
  // ========================================================
  // 失败回调：HTTP状态码非 2xx 时执行
  // ========================================================
  // error: 错误对象
  // - error.response: 服务器返回的响应（存在表示服务器有响应）
  // - error.request: 请求对象（存在表示请求已发出但没收到响应）
  // - error.message: 错误信息
  // ========================================================
  async (error) => {
    console.error('API响应错误:', error);
    
    // ----------------------------------------------------
    // 情况1：服务器返回了响应，但状态码不是 2xx
    // ----------------------------------------------------
    if (error.response) {
      switch (error.response.status) {
        // ================================================
        // 401 未授权：token过期或无效
        // ================================================
        case 401: {
          // 保存原始请求配置
          const originalRequest = error.config;
          
          // 如果还没有尝试过刷新token
          if (!originalRequest._retry) {
            // 标记已尝试过刷新，避免无限循环
            originalRequest._retry = true;
            
            try {
              // --------------------------------------------
              // 发送刷新token请求
              // --------------------------------------------
              const token = auth.getToken();
              const refreshResponse = await refreshInstance.post('/auth/refresh-token', {}, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              // --------------------------------------------
              // 保存新token
              // --------------------------------------------
              auth.loginSuccess(
                refreshResponse.data.user,
                refreshResponse.data.token,
                localStorage.getItem('token') !== null
              );
              
              // --------------------------------------------
              // 更新原始请求的token
              // --------------------------------------------
              originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.token}`;
              
              // --------------------------------------------
              // 重新发送原始请求
              // --------------------------------------------
              return api(originalRequest);
              
            } catch (refreshError) {
              // 刷新token失败
              console.error('Token刷新失败:', refreshError);
              auth.logout();
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
          
          // 已经尝试过刷新但仍然失败
          auth.logout();
          window.location.href = '/login';
          break;
        }
        
        // ================================================
        // 403 禁止访问：权限不足
        // ================================================
        case 403:
          showNotification('权限不足，无法访问该资源', 'error');
          break;
          
        // ================================================
        // 404 资源不存在
        // ================================================
        case 404:
          showNotification('请求的资源不存在', 'error');
          break;
          
        // ================================================
        // 500 服务器错误
        // ================================================
        case 500:
          showNotification('服务器内部错误，请稍后重试', 'error');
          break;
          
        // ================================================
        // 其他错误
        // ================================================
        default:
          showNotification(`请求失败: ${error.response.data.message || '未知错误'}`, 'error');
      }
    }
    // ----------------------------------------------------
    // 情况2：请求已发出，但没有收到响应
    // ----------------------------------------------------
    else if (error.request) {
      // 可能原因：网络断开、服务器挂了、跨域问题
      showNotification('网络错误，无法连接到服务器', 'error');
    }
    // ----------------------------------------------------
    // 情况3：请求配置出错，根本没发出去
    // ----------------------------------------------------
    else {
      showNotification('请求配置错误', 'error');
    }
    
    // 把错误传递给调用者的 catch
    return Promise.reject(error);
  }
);

// ============================================================
// API 方法封装
// ============================================================
// 【模块化设计】按功能分组封装API方法
// 【优点】
// 1. 代码更清晰，便于维护
// 2. IDE自动提示更友好
// 3. 统一管理所有API调用
// ============================================================
const apiMethods = {
  // ========================================================
  // 直接HTTP方法（兼容现有代码）
  // ========================================================
  // 【用途】有些地方可能直接使用 this.$http.get()
  // 这里提供直接访问底层axios实例的方法
  // ========================================================
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  
  // ========================================================
  // 认证相关API
  // ========================================================
  auth: {
    // 登录
    // 【参数】{ username, password }
    // 【返回】{ success, user, token }
    login: (data) => api.post('/api/auth/login', data),
    
    // 注册
    // 【参数】{ username, email, password }
    // 【返回】{ success, user, token }
    register: (data) => api.post('/api/auth/register', data),
    
    // 获取当前用户信息
    // 【返回】{ success, user }
    getCurrentUser: () => api.get('/api/auth/me'),
    
    // 登出
    // 【返回】{ success }
    logout: () => api.post('/api/auth/logout')
  },
  
  // ========================================================
  // 博客相关API
  // ========================================================
  blogs: {
    // 获取博客列表
    // 【参数】{ page, limit, category, author, keyword }
    // 【返回】{ success, blogs, total, page, totalPages }
    getList: (params) => api.get('/api/blogs', { params }),
    
    // 获取博客详情
    // 【参数】博客ID
    // 【返回】{ success, blog }
    getDetail: (id) => api.get(`/api/blogs/${id}`),
    
    // 创建博客
    // 【参数】{ title, content, category, tags, ... }
    // 【返回】{ success, blog }
    create: (data) => api.post('/api/blogs', data),
    
    // 更新博客
    // 【参数】博客ID, 更新数据
    // 【返回】{ success, blog }
    update: (id, data) => api.put(`/api/blogs/${id}`, data),
    
    // 删除博客
    // 【参数】博客ID
    // 【返回】{ success }
    delete: (id) => api.delete(`/api/blogs/${id}`),
    
    // 点赞博客
    like: (id) => api.post(`/api/blogs/${id}/like`),
    
    // 取消点赞
    unlike: (id) => api.delete(`/api/blogs/${id}/like`),
    
    // 检查是否已点赞
    checkLikeStatus: (id) => api.get(`/api/blogs/${id}/is-liked`),
    
    // 检查是否已收藏
    checkBookmarkStatus: (id) => api.get(`/api/blogs/${id}/is-bookmarked`),
    
    // 收藏博客
    bookmark: (id) => api.post(`/api/blogs/${id}/bookmark`),
    
    // 取消收藏
    unbookmark: (id) => api.delete(`/api/blogs/${id}/bookmark`),
    
    // 获取博客评论
    getComments: (id, params) => api.get(`/api/blogs/${id}/comments`, { params }),
    
    // 创建评论
    createComment: (id, data) => api.post(`/api/blogs/${id}/comments`, data),
    
    // 删除评论
    deleteComment: (id) => api.delete(`/api/blogs/comments/${id}`),
    
    // 上传图片
    uploadImage: (formData) => api.post('/api/blogs/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    
    // 上传视频
    uploadVideo: (formData) => api.post('/api/blogs/upload-video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  },
  
  // ========================================================
  // 消息相关API
  // ========================================================
  messages: {
    // 获取联系人列表
    getContacts: (params) => api.get('/api/messages/contacts', { params }),
    
    // 获取消息历史
    getHistory: (userId, params) => api.get(`/api/messages/${userId}`, { params }),
    
    // 发送消息
    send: (data) => api.post('/api/messages', data),
    
    // 分享博客
    share: (data) => api.post('/api/messages/share', data),
    
    // 上传附件
    // 【注意】需要设置 Content-Type: multipart/form-data
    uploadAttachment: (formData) => api.post('/api/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    
    // 标记消息为已读
    markAsRead: (data) => api.put('/api/messages/read', data),
    
    // 删除消息
    delete: (id) => api.delete(`/api/messages/${id}`)
  },
  
  // ========================================================
  // 通知相关API
  // ========================================================
  notifications: {
    // 获取通知列表
    getList: (params) => api.get('/api/notifications', { params }),
    
    // 创建通知
    create: (data) => api.post('/api/notifications', data),
    
    // 标记通知为已读
    markAsRead: (notificationId) => api.put(`/api/notifications/${notificationId}/read`),
    
    // 标记所有通知为已读
    markAllAsRead: () => api.put('/api/notifications/read-all'),
    
    // 删除通知
    delete: (notificationId) => api.delete(`/api/notifications/${notificationId}`)
  },
  
  // ========================================================
  // 用户相关API
  // ========================================================
  users: {
    // 获取用户信息
    getInfo: (id) => api.get(`/api/users/${id}`),
    
    // 更新用户信息
    update: (data) => api.put('/api/users/profile', data),
    
    // 关注用户
    follow: (id) => api.post(`/api/users/${id}/follow`),
    
    // 取消关注
    unfollow: (id) => api.delete(`/api/users/${id}/follow`),
    
    // 检查关注状态
    checkFollow: (id) => api.get(`/api/users/check-follow/${id}`),
    
    // 获取关注列表
    getFollowing: (id, params) => api.get(`/api/users/${id}/following`, { params }),
    
    // 获取粉丝列表
    getFollowers: (id, params) => api.get(`/api/users/${id}/followers`, { params }),
    
    // 获取用户点赞的文章
    getLikedPosts: (id) => api.get(`/api/users/${id}/liked-posts`),
    
    // 获取用户收藏的文章
    getBookmarkedPosts: (id) => api.get(`/api/users/${id}/bookmarked-posts`)
  },
  
  // ========================================================
  // 历史记录相关 API
  // ========================================================
  history: {
    // 添加到历史记录
    add: (blogId) => api.post('/api/history', { blogId })
  },
  
  // ========================================================
  // 管理员相关 API
  // ========================================================
  admin: {
    // 获取仪表盘统计数据
    // 【返回】{ success, data: { totalUsers, activeUsers, totalBlogs } }
    getDashboardStats: () => api.get('/api/admin/stats'),
    
    // 获取所有博客（支持筛选）
    // 【参数】{ page, limit, status, keyword }
    // 【返回】{ success, blogs, total, page, totalPages }
    getAllBlogs: (params) => api.get('/api/admin/blogs', { params }),
    
    // 删除博客
    deleteBlog: (id) => api.delete(`/api/admin/blogs/${id}`),
    
    // 更新博客状态
    updateBlogStatus: (id, data) => api.put(`/api/admin/blogs/${id}/status`, data),
    
    // 获取所有用户
    // 【参数】{ page, limit, keyword }
    // 【返回】{ success, users, total, page, totalPages }
    getAllUsers: (params) => api.get('/api/admin/users', { params }),
    
    // 获取用户详情
    getUserDetail: (id) => api.get(`/api/admin/users/${id}`),
    
    // 更新用户信息
    updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
    
    // 封禁用户
    banUser: (id) => api.put(`/api/admin/users/${id}/ban`),
    
    // 解封用户
    unbanUser: (id) => api.put(`/api/admin/users/${id}/unban`),
    
    // 删除用户
    // 【参数】id - 用户 ID, data - 请求体数据（如 confirmUserId）
    // 【返回】{ success, message }
    deleteUser: (id, data) => api.delete(`/api/admin/users/${id}`, { data }),
    
    // 获取分类列表
    getCategories: () => api.get('/api/admin/categories')
  }
};

// ============================================================
// 导出API方法
// ============================================================
// 【使用方法】
// import api from '@/utils/api';
// 
// // 登录
// const result = await api.auth.login({ username, password });
// 
// // 获取博客列表
// const blogs = await api.blogs.getList({ page: 1, limit: 10 });
// 
// // 发送消息
// await api.messages.send({ to: userId, content: '你好' });
// ============================================================
export default apiMethods;
