// Axios 封装 + 所有 API 方法
// 统一管理 HTTP 请求、Token 注入、401 自动刷新

import axios from 'axios';
import store from '../store';
import { showNotification } from './notification';

// 创建主 API 实例
const api = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// 用于刷新 Token 的独立实例（避免拦截器死循环）
const refreshInstance = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Token 刷新锁 - 防止并发刷新
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err) {
  refreshSubscribers.forEach(cb => cb(null, err));
  refreshSubscribers = [];
}

async function refreshAuthToken() {
  const token = store.getters.getToken;
  if (!token) throw new Error('无 Token');

  const response = await refreshInstance.post('/api/auth/refresh-token', {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.data || !response.data.success) {
    throw new Error(response.data?.message || 'Token 刷新失败');
  }

  const rememberMe = !!localStorage.getItem('token');
  store.dispatch('loginSuccess', {
    user: response.data.user,
    token: response.data.token,
    rememberMe
  });

  return response.data.token;
}

// 请求拦截器 - 自动添加 Authorization
api.interceptors.request.use(
  (config) => {
    const token = store.getters.getToken;
    if (token && !config.noAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData 时不设置 Content-Type，让浏览器自动处理（含 boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理 + 401 自动刷新
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.success) return data;
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMsg = data?.message || '未知错误';

      switch (status) {
        case 400:
          showNotification(errorMsg, 'error');
          break;

        case 401: {
          const originalRequest = error.config;
          // 防止无限重试
          if (originalRequest._retry) {
            return Promise.reject(error);
          }
          originalRequest._retry = true;

          // 如果正在刷新，排队等待
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((newToken, err) => {
                if (err) return reject(err);
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                resolve(api(originalRequest));
              });
            });
          }

          isRefreshing = true;
          try {
            const newToken = await refreshAuthToken();
            onRefreshed(newToken);
            isRefreshing = false;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            onRefreshFailed(refreshError);
            isRefreshing = false;
            // 延迟导入路由以避免循环依赖
            const router = (await import('../router')).default;
            store.dispatch('logout', router);
            showNotification('登录已过期，请重新登录', 'error');
            return Promise.reject(refreshError);
          }
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

// API 方法封装
const apiMethods = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),

  auth: {
    login: (data) => api.post('/api/auth/login', data),
    register: (data) => api.post('/api/auth/register', data),
    getCurrentUser: () => api.get('/api/auth/me'),
    logout: () => api.post('/api/auth/logout')
  },

  blogs: {
    getList: (params) => api.get('/api/blogs', { params }),
    getDetail: (id) => api.get(`/api/blogs/${id}`),
    create: (data) => api.post('/api/blogs', data),
    update: (id, data) => api.put(`/api/blogs/${id}`, data),
    delete: (id) => api.delete(`/api/blogs/${id}`),
    like: (id) => api.post(`/api/blogs/${id}/like`),
    unlike: (id) => api.delete(`/api/blogs/${id}/like`),
    checkLikeStatus: (id) => api.get(`/api/blogs/${id}/is-liked`),
    checkBookmarkStatus: (id) => api.get(`/api/blogs/${id}/is-bookmarked`),
    bookmark: (id) => api.post(`/api/blogs/${id}/bookmark`),
    unbookmark: (id) => api.delete(`/api/blogs/${id}/bookmark`),
    getComments: (id, params) => api.get(`/api/blogs/${id}/comments`, { params }),
    createComment: (id, data) => api.post(`/api/blogs/${id}/comments`, data),
    deleteComment: (id) => api.delete(`/api/blogs/comments/${id}`),
    uploadImage: (formData) => api.post('/api/blogs/upload-image', formData),
    uploadVideo: (formData) => api.post('/api/blogs/upload-video', formData)
  },

  messages: {
    getContacts: (params) => api.get('/api/messages/contacts', { params }),
    getHistory: (userId, params) => api.get(`/api/messages/${userId}`, { params }),
    send: (data) => api.post('/api/messages', data),
    share: (data) => api.post('/api/messages/share', data),
    uploadAttachment: (formData) => api.post('/api/messages/upload', formData),
    markAsRead: (data) => api.put('/api/messages/read', data),
    delete: (id) => api.delete(`/api/messages/${id}`)
  },

  notifications: {
    getList: (params) => api.get('/api/notifications', { params }),
    create: (data) => api.post('/api/notifications', data),
    markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
    markAllAsRead: () => api.put('/api/notifications/read-all'),
    delete: (id) => api.delete(`/api/notifications/${id}`)
  },

  users: {
    getInfo: (id) => api.get(`/api/users/${id}`),
    update: (data) => api.put('/api/users/profile', data),
    follow: (id) => api.post(`/api/users/${id}/follow`),
    unfollow: (id) => api.delete(`/api/users/${id}/follow`),
    checkFollow: (id) => api.get(`/api/users/check-follow/${id}`),
    getFollowing: (id, params) => api.get(`/api/users/${id}/following`, { params }),
    getFollowers: (id, params) => api.get(`/api/users/${id}/followers`, { params }),
    getLikedPosts: (id) => api.get(`/api/users/${id}/liked-posts`),
    getBookmarkedPosts: (id) => api.get(`/api/users/${id}/bookmarked-posts`)
  },

  emojis: {
    upload: (formData) => api.post('/api/emojis/upload', formData),
    getFavorites: () => api.get('/api/emojis/favorites'),
    deleteFavorite: (id) => api.delete(`/api/emojis/favorites/${id}`)
  },

  history: {
    add: (blogId) => api.post('/api/history', { blogId })
  },

  admin: {
    getDashboardStats: () => api.get('/api/admin/stats'),
    getAllBlogs: (params) => api.get('/api/admin/blogs', { params }),
    deleteBlog: (id) => api.delete(`/api/admin/blogs/${id}`),
    updateBlogStatus: (id, data) => api.put(`/api/admin/blogs/${id}/status`, data),
    getAllUsers: (params) => api.get('/api/admin/users', { params }),
    getUserDetail: (id) => api.get(`/api/admin/users/${id}`),
    updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
    banUser: (id) => api.put(`/api/admin/users/${id}/ban`),
    unbanUser: (id) => api.put(`/api/admin/users/${id}/unban`),
    deleteUser: (id, data) => api.delete(`/api/admin/users/${id}`, { data }),
    getCategories: () => api.get('/api/admin/categories')
  },

  // 用户数据看板相关 API
  stats: {
    // 获取用户数据看板
    getDashboard: () => api.get('/api/stats/dashboard'),

    // 获取最受欢迎文章 TOP5
    getTopArticles: () => api.get('/api/stats/top-articles')
  }
};

export default apiMethods;
