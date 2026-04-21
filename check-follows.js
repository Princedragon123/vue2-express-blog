// 检查数据库中的 Follow 数据
const mongoose = require('mongoose');
require('dotenv').config();

const Follow = require('./src/models/Follow');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloglogin';

async function checkFollows() {
  try {
    console.log('连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功！');

    console.log('\n查询所有 Follow 记录:');
    const follows = await Follow.find({});
    console.log('Follow 记录数量:', follows.length);
    
    follows.forEach((follow, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log('  follower:', follow.follower);
      console.log('  following:', follow.following);
      console.log('  createdAt:', follow.createdAt);
    });

    console.log('\n检查完成！');
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

checkFollows();