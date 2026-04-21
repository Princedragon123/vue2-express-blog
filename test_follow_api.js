
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

async function testFollowAPIs() {
  console.log('🚀 开始测试关注相关API...\n');

  try {
    // 1. 先登录第一个用户
    console.log('1️⃣ 登录第一个用户（测试关注者）...');
    const loginResponse1 = await api.post('/auth/login', {
      email: 'testuser002@test.com',
      password: '123456'
    });
    
    const token1 = loginResponse1.data.token;
    const userId1 = loginResponse1.data.user.id;
    console.log('✅ 登录成功！用户ID:', userId1, '\n');

    // 2. 注册第二个用户（测试被关注者）
    console.log('2️⃣ 注册第二个用户（测试被关注者）...');
    const registerResponse2 = await api.post('/auth/register', {
      username: 'testuser003',
      email: 'testuser003@test.com',
      password: '123456'
    });
    
    const userId2 = registerResponse2.data.user.id;
    console.log('✅ 注册成功！用户ID:', userId2, '\n');

    // 设置第一个用户的认证头
    api.defaults.headers.common['Authorization'] = `Bearer ${token1}`;

    // 3. 测试关注用户
    console.log('3️⃣ 测试关注用户API...');
    const followResponse = await api.post(`/users/${userId2}/follow`);
    console.log('✅ 关注成功！\n');

    // 4. 测试检查关注状态
    console.log('4️⃣ 测试检查关注状态API...');
    const checkFollowResponse = await api.get(`/users/check-follow/${userId2}`);
    console.log('✅ 检查关注状态成功！', checkFollowResponse.data, '\n');

    // 5. 测试获取关注列表
    console.log('5️⃣ 测试获取关注列表API...');
    const followingResponse = await api.get(`/users/${userId1}/following`);
    console.log('✅ 获取关注列表成功！关注数量:', followingResponse.data.data?.length || 0, '\n');

    // 6. 测试获取粉丝列表
    console.log('6️⃣ 测试获取粉丝列表API...');
    const followersResponse = await api.get(`/users/${userId2}/followers`);
    console.log('✅ 获取粉丝列表成功！粉丝数量:', followersResponse.data.data?.length || 0, '\n');

    // 7. 测试取消关注
    console.log('7️⃣ 测试取消关注API...');
    const unfollowResponse = await api.delete(`/users/${userId2}/follow`);
    console.log('✅ 取消关注成功！\n');

    // 8. 再次检查关注状态
    console.log('8️⃣ 再次检查关注状态...');
    const checkFollowResponse2 = await api.get(`/users/check-follow/${userId2}`);
    console.log('✅ 检查关注状态成功！', checkFollowResponse2.data, '\n');

    console.log('🎉 所有关注相关API测试成功！！！');

  } catch (error) {
    console.error('❌ 关注API测试失败:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

testFollowAPIs();
