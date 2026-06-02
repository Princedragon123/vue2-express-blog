
// axios: HTTP 请求库
import axios from 'axios';

// 认证状态管理
import store from '../store';

// 通知工具
import { showNotification } from './notification';

// 👇 新增：导入路由！！！ 核心修复
import router from '@/router/index';

const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalDev ? '' : '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json'
  }
});

const refreshInstance = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    const token = store.getters.getToken;
    if (token && !config.noAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    console.error('API 请求错误:', error);
    // Promise.reject(error)：把错误传递给调用者的 catch
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // 状态码2xx时，处理业务逻辑
    const data = response.data;
    if (data.success) {
      return data;
    } else {
      // 业务失败，抛出后端返回的错误信息
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  async (error) => {
    console.error('API响应错误:', error);
    if (error.response) {
      const { status, data } = error.response;
      
      // 统一处理后端返回的message
      const errorMsg = data?.message || '未知错误';

      switch (status) {
        case 400:
          // 新增：处理400状态码，直接显示后端返回的错误信息
          showNotification(errorMsg, 'error');
          break;
        case 401: {
          const originalRequest = error.config; 
          if (!originalRequest._retry) {
            originalRequest._retry = true;  
            try {
              const token = store.getters.getToken;
              if (!token) {
                store.dispatch('logout', router);
                showNotification('登录已过期，请重新登录', 'error');
                return Promise.reject(error);
              }
              const refreshResponse = await refreshInstance.post('/api/auth/refresh-token', {}, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              store.dispatch('loginSuccess', {
                user: refreshResponse.data.user,
                token: refreshResponse.data.token,
                rememberMe: localStorage.getItem('token') !== null
              });
              
              originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.token}`;
              
              return api(originalRequest);
              
            } catch (refreshError) {
              console.error('Token刷新失败:', refreshError);
              store.dispatch('logout', router);
              showNotification('登录已过期，请重新登录', 'error');
              return Promise.reject(refreshError);
            }
          }
          store.dispatch('logout');
          return Promise.reject(error);
        }
        case 403:
          showNotification('权限不足，无法访问该资源', 'error');
          break;
        case 404:
          showNotification('请求的资源不存在', 'error');
          break;
        case 500:
          showNotification('服务器内部错误，请稍后重试', 'error');
          break;
        default:
          // 其他状态码，统一显示后端返回的错误信息
          showNotification(`请求失败: ${errorMsg}`, 'error');
      }
    } else if (error.request) {
      showNotification('网络错误，无法连接到服务器', 'error');
    } else {
      showNotification('请求配置错误', 'error');
    }
    
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
  // 表情包相关 API
  // ========================================================
  emojis: {
    // 上传表情包
    upload: (formData) => api.post('/api/emojis/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    
    // 获取收藏表情包
    getFavorites: () => api.get('/api/emojis/favorites'),
    
    // 删除收藏表情包
    deleteFavorite: (emojiId) => api.delete(`/api/emojis/favorites/${emojiId}`)
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

export default apiMethods;
