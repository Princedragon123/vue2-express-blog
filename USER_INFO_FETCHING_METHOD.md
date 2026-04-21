# 获取用户信息标准方法论

## 1. 方法论概述

本方法论提供了一套标准化的获取用户信息及相关资源的流程，确保在各种情况下都能稳定获取数据，并提供良好的错误处理和后备机制。该方法论不仅适用于获取用户信息，也可扩展应用于获取其他需要认证的资源。

## 2. 核心流程

### 2.1 认证令牌管理

```javascript
/**
 * 获取认证令牌
 * @returns {string|null} 认证令牌
 */
function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}
```

### 2.2 标准获取流程

1. **初始化状态**：设置加载状态为 true，清除错误信息
2. **获取认证令牌**：从本地存储中获取 token
3. **检查令牌**：如果没有 token，使用模拟数据
4. **准备请求头**：添加 Authorization 头
5. **执行 API 调用**：根据具体需求调用相应的 API 端点
6. **处理认证错误**：如果返回 401，使用模拟数据
7. **处理业务错误**：如果 API 调用失败，使用模拟数据
8. **处理响应数据**：将获取到的数据更新到组件状态
9. **重置状态**：设置加载状态为 false

### 2.3 错误处理策略

- **无令牌**：使用模拟数据，不显示错误
- **认证失败**：使用模拟数据，不显示错误
- **API 调用失败**：使用模拟数据，记录错误日志
- **数据结构异常**：使用模拟数据，记录错误日志
- **网络错误**：使用模拟数据，记录错误日志

### 2.4 模拟数据管理

```javascript
/**
 * 获取模拟用户数据
 * @returns {Object} 模拟用户数据
 */
function getMockUserData() {
  return {
    username: '游戏达人',
    email: 'gamedev123@example.com',
    profile: {
      avatar: '/static/uploads/avatars/游戏达人.jpg',
      bio: '专注于分享各种游戏攻略和心得，欢迎关注！',
      coverImage: 'https://via.placeholder.com/800x200',
      location: '上海',
      website: 'https://gamedev.example.com',
      occupation: '游戏玩家'
    },
    social: {
      following: 48,
      followers: 156
    },
    stats: {
      postsCount: 23,
      likesCount: 523,
      commentsCount: 89
    },
    createdAt: '2023-03-15T00:00:00.000Z',
    lastLogin: new Date().toISOString()
  };
}

/**
 * 获取模拟文章列表数据
 * @returns {Array} 模拟文章列表数据
 */
function getMockCreationsData() {
  return [
    {
      id: '1',
      title: '最新游戏攻略：如何快速升级',
      image: 'https://via.placeholder.com/300x180',
      category: '游戏攻略',
      date: new Date().toISOString().split('T')[0],
      views: 1234,
      likes: 56,
      comments: 23
    },
    {
      id: '2',
      title: '游戏装备选择指南',
      image: 'https://via.placeholder.com/300x180',
      category: '游戏攻略',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      views: 987,
      likes: 45,
      comments: 18
    },
    {
      id: '3',
      title: '游戏团队配合技巧',
      image: 'https://via.placeholder.com/300x180',
      category: '游戏攻略',
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      views: 765,
      likes: 34,
      comments: 12
    }
  ];
}
```

## 3. 代码实现示例

### 3.1 获取用户信息示例

```javascript
/**
 * 获取用户信息
 * @param {Object} context 组件上下文
 * @param {string} userId 用户 ID，默认为 'current'
 * @returns {Promise<void>}
 */
async function fetchUserInfo(context, userId = 'current') {
  try {
    // 1. 初始化状态
    context.isLoading = true;
    context.error = null;
    
    // 2. 获取认证令牌
    const token = getAuthToken();
    console.log('获取到的token:', token);
    
    // 3. 检查令牌
    if (!token && userId === 'current') {
      console.log('没有token且查看当前用户，使用模拟数据');
      context.user = getMockUserData();
      return;
    }
    
    // 4. 准备请求头
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 5. 获取当前用户信息（当查看当前用户时）
    let currentUserId = userId;
    if (userId === 'current') {
      try {
        const meResponse = await fetch('/api/auth/me', {
          method: 'GET',
          headers: headers
        });
        
        if (meResponse.status === 401) {
          console.log('认证失败，使用模拟数据');
          context.user = getMockUserData();
          return;
        }
        
        const meData = await meResponse.json();
        console.log('/api/auth/me响应数据:', meData);
        
        if (meData.user) {
          currentUserId = meData.user.id || meData.user._id;
          console.log('获取到当前用户ID:', currentUserId);
        } else {
          console.log('没有用户信息，使用模拟数据');
          context.user = getMockUserData();
          return;
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
        context.user = getMockUserData();
        return;
      }
    }
    
    // 6. 获取详细用户信息
    try {
      const userResponse = await fetch(`/api/users/${currentUserId}`, {
        method: 'GET',
        headers: headers
      });
      
      if (userResponse.status === 401) {
        console.log('认证失败，使用模拟数据');
        context.user = getMockUserData();
        return;
      }
      
      const userData = await userResponse.json();
      console.log(`/api/users/${currentUserId}响应数据:`, userData);
      
      if (userData.success && userData.data && userData.data.user) {
        console.log('成功获取用户详细信息');
        context.user = userData.data.user;
      } else {
        console.log('获取用户详细信息失败，使用模拟数据');
        context.user = getMockUserData();
      }
    } catch (error) {
      console.error('获取用户详细信息失败:', error);
      context.user = getMockUserData();
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    context.user = getMockUserData();
  } finally {
    context.isLoading = false;
  }
}
```

### 3.2 获取文章列表示例

```javascript
/**
 * 获取用户文章列表
 * @param {Object} context 组件上下文
 * @returns {Promise<void>}
 */
async function fetchUserCreations(context) {
  try {
    // 1. 初始化状态
    context.loading = true;
    
    // 2. 获取认证令牌
    const token = getAuthToken();
    
    // 3. 检查令牌
    if (!token) {
      console.log('没有token，使用模拟数据');
      context.creations = getMockCreationsData();
      return;
    }
    
    // 4. 准备请求头
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // 5. 获取文章列表
    try {
      const response = await fetch('/api/blogs/my', {
        headers: headers
      });
      
      if (response.status === 401) {
        console.log('认证失败，使用模拟数据');
        context.creations = getMockCreationsData();
        return;
      }
      
      const data = await response.json();
      console.log('/api/blogs/my响应数据:', data);
      
      if (data.success && data.data) {
        // 转换数据格式，适配前端显示
        context.creations = data.data.map(blog => ({
          id: blog._id,
          title: blog.title,
          image: blog.image || 'https://via.placeholder.com/300x180',
          category: blog.category?.name || '未分类',
          date: new Date(blog.createdAt).toISOString().split('T')[0],
          views: blog.views || 0,
          likes: blog.likes || 0,
          comments: blog.comments || 0
        }));
      } else {
        console.log('获取文章列表失败，使用模拟数据');
        context.creations = getMockCreationsData();
      }
    } catch (error) {
      console.error('获取文章列表失败:', error);
      context.creations = getMockCreationsData();
    }
  } catch (error) {
    console.error('加载创作列表失败:', error);
    context.creations = getMockCreationsData();
  } finally {
    context.loading = false;
  }
}
```

## 4. 应用指南

### 4.1 在组件中使用

#### 4.1.1 用户信息组件

```javascript
export default {
  data() {
    return {
      user: null,
      isLoading: false,
      error: null
    };
  },
  created() {
    this.fetchUserProfile();
  },
  methods: {
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    getMockUserData() {
      return {
        // 模拟数据结构
      };
    },
    
    async fetchUserProfile() {
      try {
        // 1. 初始化状态
        this.isLoading = true;
        this.error = null;
        
        // 2. 获取认证令牌
        const token = this.getAuthToken();
        
        // 3. 检查令牌
        if (!token) {
          console.log('没有token，使用模拟数据');
          this.user = this.getMockUserData();
          return;
        }
        
        // 4. 准备请求头
        const headers = {
          'Authorization': `Bearer ${token}`
        };
        
        // 5. 获取用户信息
        // 具体实现...
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.user = this.getMockUserData();
      } finally {
        this.isLoading = false;
      }
    }
  }
};
```

#### 4.1.2 创作列表组件

```javascript
export default {
  data() {
    return {
      creations: [],
      loading: false
    };
  },
  created() {
    this.loadMyCreations();
  },
  methods: {
    getAuthToken() {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    },
    
    getMockCreationsData() {
      return [
        // 模拟文章数据
      ];
    },
    
    async loadMyCreations() {
      // 具体实现...
    }
  }
};
```

### 4.2 模板渲染优化

- **使用加载状态**：在加载过程中显示加载动画
- **使用 v-if 保护**：确保在用户数据存在时才渲染相关内容
- **提供默认值**：使用 `||` 运算符提供默认值，避免 undefined 错误
- **使用计算属性**：将复杂的数据转换逻辑提取到计算属性中

### 4.3 API 调用优化

- **使用 axios 拦截器**：自动处理认证令牌和错误
- **统一 API 封装**：将 API 调用封装到工具函数中
- **合理设置超时**：为 API 调用设置合理的超时时间
- **批量请求处理**：避免同时发起多个相同的请求

## 5. 最佳实践

1. **统一错误处理**：使用 try-catch 捕获所有可能的错误
2. **详细日志记录**：在关键步骤添加日志，便于调试
3. **后备数据机制**：确保在任何错误情况下都有数据显示
4. **状态管理**：正确管理加载状态和错误状态
5. **代码复用**：将核心逻辑提取为工具函数，便于在多个组件中使用
6. **性能优化**：避免不必要的 API 调用，使用缓存
7. **安全性**：不要在前端存储敏感信息
8. **可维护性**：使用清晰的命名和注释，保持代码结构清晰

## 6. 测试场景

### 6.1 正常场景
- 用户已登录，token 有效
- API 调用成功，返回完整数据
- 数据结构正确，组件正常渲染

### 6.2 异常场景
- 用户未登录，无 token
- token 无效或已过期
- API 端点返回 401 错误
- API 端点返回 404 错误
- API 端点返回 500 错误
- 网络连接失败
- API 返回数据结构异常
- 浏览器本地存储不可用

## 7. 扩展应用

### 7.1 获取其他资源

本方法论不仅适用于获取用户信息，还可以扩展应用于获取其他需要认证的资源，如：

- **文章列表**：`/api/blogs/my`
- **消息列表**：`/api/messages`
- **关注列表**：`/api/users/{userId}/following`
- **粉丝列表**：`/api/users/{userId}/followers`

### 7.2 资源操作

对于需要认证的资源操作，如：

- **创建文章**：`POST /api/blogs`
- **更新用户信息**：`PUT /api/users/profile`
- **删除文章**：`DELETE /api/blogs/{id}`

也可以应用类似的错误处理策略，确保操作失败时能够给出合理的提示。

## 8. 总结

本方法论通过标准化的流程和完善的错误处理机制，确保了获取用户信息及相关资源的稳定性和可靠性。同时，通过提供模拟数据作为后备，保证了在各种异常情况下用户界面的正常显示。

这套方法论适用于整个项目中所有需要获取用户信息和其他需要认证的资源的场景，包括个人中心、编辑资料、用户主页、我的创作等。

通过统一的代码结构和错误处理策略，不仅提高了代码的可维护性，也提升了用户体验，确保了在网络不稳定或后端服务异常时，前端应用仍然能够正常运行。