
// 测试JWT生成和验证
const jwt = require('jsonwebtoken');

// 密钥（和项目里的一样）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('🐱 JWT生成和验证演示\n');

// 1️⃣ 生成JWT
console.log('1️⃣ 生成JWT令牌...');
const payload = {
    id: '60d0fe4f5311236168a109ca',
    username: 'zhangsan',
    role: 'user'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('✅ 生成的JWT令牌:');
console.log(token);
console.log('\n');

// 2️⃣ 解析JWT（不验证）
console.log('2️⃣ 解析JWT（不验证签名）...');
const decoded = jwt.decode(token, { complete: true });
console.log('📦 Header:', JSON.stringify(decoded.header, null, 2));
console.log('📋 Payload:', JSON.stringify(decoded.payload, null, 2));
console.log('🔐 Signature:', decoded.signature);
console.log('\n');

// 3️⃣ 验证JWT
console.log('3️⃣ 验证JWT...');
try {
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT验证成功!');
    console.log('验证后的数据:', JSON.stringify(verified, null, 2));
} catch (error) {
    console.log('❌ JWT验证失败:', error.message);
}
console.log('\n');

// 4️⃣ 演示：为什么JWT是唯一的
console.log('4️⃣ 演示：生成多个token，看看是不是唯一的...');
const token1 = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

// 等待100毫秒，让时间不同
setTimeout(() => {
    const token2 = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Token 1:', token1);
    console.log('Token 2:', token2);
    console.log('是否相同?', token1 === token2 ? '✅ 相同' : '❌ 不同');
    console.log('\n');
    
    // 5️⃣ 为什么不同？让我们看看时间戳
    console.log('5️⃣ 查看payload里的时间戳...');
    const decoded1 = jwt.decode(token1);
    const decoded2 = jwt.decode(token2);
    console.log('Token 1 的 iat (签发时间):', new Date(decoded1.iat * 1000));
    console.log('Token 2 的 iat (签发时间):', new Date(decoded2.iat * 1000));
    console.log('时间不同，所以token不同!');
}, 100);
