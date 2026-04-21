
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试用的token（从之前的登录响应中获取）
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YzNjMjYzNmZiNDZhZmU2MjBlZjllYyIsImlhdCI6MTc0MjkzNDg5OSwiZXhwIjoxNzQzNTM5Njk5fQ.test';

// 测试用的博客ID（从博客列表获取）
const TEST_BLOG_ID = '69afd1e9ad615c9dd2de8d5a';

// 测试用的用户ID
const TEST_USER_ID = '69c3c2636fb46afe620ef9ec';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

async function testAllAPIs() {
  console.log('🚀 开始全面API测试...\n');

  try {
    // 1. 先登录获取真实token
    console.log('1️⃣ 测试登录API...');
    const loginResponse = await api.post('/auth/login', {
      email: 'testuser002@test.com',
      password: '123456'
    });
    
    console.log('✅ 登录成功！');
    const authToken = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('   Token:', authToken.substring(0, 50) + '...');
    console.log('   User ID:', userId, '\n');

    // 设置认证头
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // 2. 测试获取当前用户信息
    console.log('2️⃣ 测试获取当前用户信息API...');
    const meResponse = await api.get('/auth/me');
    console.log('✅ 获取当前用户信息成功！\n');

    // 3. 测试获取博客列表
    console.log('3️⃣ 测试获取博客列表API...');
    const blogsResponse = await api.get('/blogs');
    const blogId = blogsResponse.data.data[0]._id;
    console.log('✅ 获取博客列表成功！博客数量:', blogsResponse.data.data.length);
    console.log('   第一个博客ID:', blogId, '\n');

    // 4. 测试点赞博客
    console.log('4️⃣ 测试点赞博客API...');
    const likeResponse = await api.post(`/blogs/${blogId}/like`);
    console.log('✅ 点赞博客成功！\n');

    // 5. 测试检查点赞状态
    console.log('5️⃣ 测试检查点赞状态API...');
    const checkLikeResponse = await api.get(`/blogs/${blogId}/is-liked`);
    console.log('✅ 检查点赞状态成功！', checkLikeResponse.data, '\n');

    // 6. 测试收藏博客
    console.log('6️⃣ 测试收藏博客API...');
    const bookmarkResponse = await api.post(`/blogs/${blogId}/bookmark`);
    console.log('✅ 收藏博客成功！\n');

    // 7. 测试检查收藏状态
    console.log('7️⃣ 测试检查收藏状态API...');
    const checkBookmarkResponse = await api.get(`/blogs/${blogId}/is-bookmarked`);
    console.log('✅ 检查收藏状态成功！', checkBookmarkResponse.data, '\n');

    // 8. 测试获取用户信息
    console.log('8️⃣ 测试获取用户信息API...');
    const userInfoResponse = await api.get(`/users/${userId}`);
    console.log('✅ 获取用户信息成功！\n');

    // 9. 测试取消点赞
    console.log('9️⃣ 测试取消点赞API...');
    const unlikeResponse = await api.delete(`/blogs/${blogId}/like`);
    console.log('✅ 取消点赞成功！\n');

    // 10. 测试取消收藏
    console.log('🔟 测试取消收藏API...');
    const unbookmarkResponse = await api.delete(`/blogs/${blogId}/bookmark`);
    console.log('✅ 取消收藏成功！\n');

    console.log('🎉 所有API测试成功！！！');

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testAllAPIs();
