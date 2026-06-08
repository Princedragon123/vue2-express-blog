// store/index.js - Vuex 状态管理（全局数据仓库）
// 管理整个应用的全局状态，包括：
// 1. 用户登录状态
// 2. Token 令牌
// 3. 用户信息
// 4. 加载状态和错误信息
// A: 直接修改无法追踪，调试困难，不符合单向数据流
// A: mutation 是同步的，action 是异步的；action 最终还是 commit mutation
// A: getter 有缓存，依赖不变不会重新计算；state 每次都重新取值


// Vue 框架
import Vue from 'vue';

// Vuex 状态管理库
import Vuex from 'vuex';

// 这一步做了什么？
// 1. 在 Vue 原型上挂载 $store，所有组件都能用 this.$store
// 2. 注册 Vuex 的内部机制（响应式、模块系统等）
// 必须在 new Vuex.Store() 之前调用！
Vue.use(Vuex);


// getStoredItem - 从 localStorage 或 sessionStorage 获取数据
// 用户登录时可以选择"记住我"：
// - 勾选 → 存到 localStorage（关闭浏览器后还在）
// - 不勾选 → 存到 sessionStorage（关闭浏览器就没了）
// 因为 localStorage 是持久化的，优先读取
function getStoredItem(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    // 如果浏览器禁用了存储（隐私模式等），返回 null
    return null;
  }
}

// clearStorage - 清除所有认证相关的存储数据
function clearStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

// Vuex.Store 是一个构造函数，接收一个配置对象
// 配置对象包含四大核心：state、getters、mutations、actions

export default new Vuex.Store({

  // Vue.observable: const state = Vue.observable({ token: null })
  // Vuex:           state: { token: null }
  // 写法差不多，但 Vuex 的 state 修改有规范约束
  state: {
    // 用户信息对象
    // 结构：{ id, username, email, role, avatar, profile }
    user: null,
    // JWT Token 字符串
    // 格式：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6...
    token: null,
    // 是否已认证（登录状态）
    // true = 已登录，false = 未登录
    isAuthenticated: false,
    // 加载状态
    // true = 正在请求中，显示 loading 动画
    isLoading: false,
    // 错误信息
    // 有值 = 出错了，显示错误提示
    error: null
  },

  // Vue.observable 没有 getters，只能直接访问 state
  // 比如：auth.state.token !== null（每次都重新判断）
  // Vuex:  getters.isLoggedIn（有缓存，token 不变就不重算）
  getters: {
    // 是否已登录
    // !! 双重否定：把值转成布尔值
    // null → false，有值 → true
    isLoggedIn: state => !!state.token,

    // 获取当前用户信息
    // 用法：this.$store.getters.currentUser.username
    currentUser: state => state.user,

    // 获取 Token
    // 用法：api.js 里用 store.getters.getToken 拼请求头
    getToken: state => state.token,

    // 获取错误信息
    getError: state => state.error,

    // 获取加载状态
    isLoading: state => state.isLoading,

    // 获取用户角色（从 JWT Token 中解析）
    //   1. token.split('.')[1] → 取 Payload 部分
    //   2. atob() → Base64 解码
    //   3. JSON.parse() → 转成对象
    //   4. 取出 role 字段
    // Token: eyJ...xYz.eyJyb2xlIjoiYWRtaW4ifQ.abc
    // 解码后: { "role": "admin", "id": "123" }
    // 返回: "admin"
    getUserRole: state => {
      if (!state.token) return null;
      try {
        //用分割方法根据 点 来分开token，然后拿到第二段内容进行base64解码，拿到的内容转成对象，payload提取
        const payload = JSON.parse(atob(state.token.split('.')[1]));
        return payload.role;
      } catch {
        return null;
      }
    }
  },

  //   1. 函数名全大写 + 下划线（约定俗成）
  //   2. 第一个参数是 state，第二个是传入的值
  //   3. 只能做同步操作，不能写 setTimeout、fetch 等
  //        或在 action 里：commit('SET_TOKEN', 'xxx')
  // Vue.observable: this.state.token = token（直接改，无法追踪）
  // Vuex:           commit('SET_TOKEN', token)（有记录，可调试）
  // 因为 DevTools 需要记录每次 mutation 的前后状态
  // 如果是异步的，记录的时机就不对了
  mutations: {
    // 设置用户信息
    SET_USER(state, user) {
      state.user = user;
    },

    // 设置 Token
    SET_TOKEN(state, token) {
      state.token = token;
    },

    // 设置认证状态
    SET_AUTH(state, value) {
      state.isAuthenticated = value;
    },

    // 设置加载状态
    SET_LOADING(state, value) {
      state.isLoading = value;
    },

    // 设置错误信息
    SET_ERROR(state, error) {
      state.error = error;
    },

    // 清除所有认证数据
    CLEAR_AUTH(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    }
  },

  //   1. 第一个参数是 context 对象（解构出 commit）
  //   2. 第二个参数是调用时传的 payload
  //   3. 不能直接修改 state，必须 commit mutation
  //   4. 可以是异步的（setTimeout、fetch、axios 等）
  // Vue.observable: auth.loginSuccess(user, token)（普通方法，混在一起）
  // Vuex:           dispatch('loginSuccess', payload)（明确区分同步/异步）
  // context = {
  //   state,      // 等同于 store.state
  //   getters,    // 等同于 store.getters
  //   commit,     // 调用 mutation 的方法
  //   dispatch    // 调用其他 action 的方法
  // 通常只解构需要的：{ commit } 或 { commit, state }
  actions: {
    // init - 初始化认证状态
    // 1. App.vue 的 mounted 生命周期
    // 2. 路由守卫 beforeEach 里
    // 从 localStorage/sessionStorage 读取之前保存的登录信息
    // 恢复到 state 里，这样刷新页面也不会丢失登录状态
    // 只需要 commit，不需要 state 和 dispatch
    init({ commit }) {
      const token = getStoredItem('token');
      const userStr = getStoredItem('user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          // 连续 commit 三个 mutation 来恢复状态
          commit('SET_USER', user);
          commit('SET_TOKEN', token);
          commit('SET_AUTH', true);
        } catch {
          // JSON 解析失败，说明数据损坏，清空
          commit('CLEAR_AUTH');
          clearStorage();
        }
      } else {
        // 没有存储数据，清空状态
        commit('CLEAR_AUTH');
      }
    },

    // loginSuccess - 登录成功
    // AuthPage.vue 登录/注册成功后
    // App.vue 刷新用户信息后
    // { commit } - context 解构
    // { user, token, rememberMe } - payload 解构
    //   user: 用户信息对象
    //   token: JWT Token 字符串
    //   rememberMe: 是否记住登录（true → localStorage）
    // 旧：auth.loginSuccess(user, token, rememberMe)
    //     内部用 Vue.set(this.state, 'user', user)
    // 新：dispatch('loginSuccess', { user, token, rememberMe })
    //     内部用 commit('SET_USER', user) — 不需要 Vue.set
    loginSuccess({ commit }, { user, token, rememberMe }) {
      // 1. 更新 Vuex state（内存中的响应式数据）
      commit('SET_USER', user);
      commit('SET_TOKEN', token);
      commit('SET_AUTH', true);
      commit('SET_ERROR', null);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
    },

    // logout - 登出
    // 1. 用户主动点击登出按钮
    // 2. Token 过期自动登出
    // 3. 401 错误时自动登出
    // { commit } - context 解构
    // router - 可选，传了就跳转到登录页
    logout({ commit }, router) {
      // 1. 清空 Vuex state
      commit('CLEAR_AUTH');
      // 2. 清空浏览器存储
      clearStorage();
      // 3. 跳转到登录页（如果传了 router）
      if (router) {
        router.push('/login');
      }
    },

    // setLoading - 设置加载状态
    // 请求开始时 setLoading(true)，请求结束时 setLoading(false)
    setLoading({ commit }, value) {
      commit('SET_LOADING', value);
    },

    // setError - 设置错误信息
    setError({ commit }, error) {
      commit('SET_ERROR', error);
    },

    // clearError - 清除错误信息
    clearError({ commit }) {
      commit('SET_ERROR', null);
    }
  }
});
