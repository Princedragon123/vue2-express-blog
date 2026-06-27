// Vuex 状态管理 - 认证、用户、加载状态
// Vue 2 + Vuex 3

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

// 安全地从浏览器存储获取数据
function getStoredItem(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

// 清除所有认证存储
function clearStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

// JWT 载荷缓存 - 避免每次 getter 访问都重复解析
let cachedPayload = null;
let cachedToken = null;

function parsePayload(token) {
  if (!token) return null;
  // 同 token 返回缓存
  if (token === cachedToken && cachedPayload) return cachedPayload;
  try {
    cachedPayload = JSON.parse(atob(token.split('.')[1]));
    cachedToken = token;
    return cachedPayload;
  } catch {
    cachedPayload = null;
    cachedToken = null;
    return null;
  }
}

export default new Vuex.Store({
  state: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  },

  getters: {
    isLoggedIn: state => !!state.token,
    currentUser: state => state.user,
    getToken: state => state.token,
    getError: state => state.error,
    isLoading: state => state.isLoading,

    // 从 JWT 解析用户角色（带缓存）
    getUserRole: state => {
      if (!state.token) return null;
      const payload = parsePayload(state.token);
      return payload ? payload.role : null;
    },

    // 检查 Token 是否过期
    isTokenExpired: state => {
      if (!state.token) return true;
      const payload = parsePayload(state.token);
      return payload && payload.exp ? payload.exp < Date.now() / 1000 : true;
    },

    // 获取用户 ID
    getUserId: state => {
      if (!state.token) return null;
      const payload = parsePayload(state.token);
      return payload ? payload.id : null;
    }
  },

  mutations: {
    SET_USER(state, user) { state.user = user; },
    SET_TOKEN(state, token) {
      state.token = token;
      // token 变更时清除 JWT 缓存
      if (token !== cachedToken) {
        cachedPayload = null;
        cachedToken = null;
      }
    },
    SET_AUTH(state, value) { state.isAuthenticated = value; },
    SET_LOADING(state, value) { state.isLoading = value; },
    SET_ERROR(state, error) { state.error = error; },

    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      cachedPayload = null;
      cachedToken = null;
    }
  },

  actions: {
    // 从浏览器存储恢复登录状态
    init({ commit }) {
      const token = getStoredItem('token');
      const userStr = getStoredItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          commit('SET_USER', user);
          commit('SET_TOKEN', token);
          commit('SET_AUTH', true);
        } catch {
          commit('CLEAR_AUTH');
          clearStorage();
        }
      } else {
        commit('CLEAR_AUTH');
      }
    },

    // 登录成功 - 保存到 Vuex 和浏览器存储
    loginSuccess({ commit }, { user, token, rememberMe }) {
      commit('SET_USER', user);
      commit('SET_TOKEN', token);
      commit('SET_AUTH', true);
      commit('SET_ERROR', null);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
    },

    // 登出
    logout({ commit }, router) {
      commit('CLEAR_AUTH');
      clearStorage();
      if (router) {
        router.push('/login');
      }
    },

    setLoading({ commit }, value) { commit('SET_LOADING', value); },
    setError({ commit }, error) { commit('SET_ERROR', error); },
    clearError({ commit }) { commit('SET_ERROR', null); }
  }
});
