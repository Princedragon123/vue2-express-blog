// 检查数据库中存储的图片路径格式
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://127.0.0.1:27017/bloglogin')
    .then(() => console.log('数据库连接成功'))
    .catch(err => console.error('数据库连接失败:', err));

// 定义 User 模型
const userSchema = new mongoose.Schema({
    profile: {
        avatar: String,
        coverImage: String
    }
});

const User = mongoose.model('User', userSchema);

// 定义 Blog 模型
const blogSchema = new mongoose.Schema({
    title: String,
    images: [String],
    coverImage: String
});

const Blog = mongoose.model('Blog', blogSchema);

async function checkImagePaths() {
    try {
        // 检查用户头像和背景图路径
        const users = await User.find({}, 'profile.avatar profile.coverImage');
        
        console.log('\n=== 用户头像和背景图路径 ===');
        users.forEach((user, index) => {
            console.log(`\n用户 ${index + 1}:`);
            console.log('  头像:', user.profile?.avatar || '无');
            console.log('  背景图:', user.profile?.coverImage || '无');
        });
        
        // 检查博客图片路径
        const blogs = await Blog.find({}, 'title images coverImage').limit(5);
        
        console.log('\n=== 博客图片路径（前5篇）===');
        blogs.forEach((blog, index) => {
            console.log(`\n博客 ${index + 1}: ${blog.title}`);
            console.log('  封面图:', blog.coverImage || '无');
            console.log('  图片列表:', blog.images?.length > 0 ? blog.images : '无');
        });
        
        mongoose.connection.close();
    } catch (error) {
        console.error('查询失败:', error);
        mongoose.connection.close();
    }
}

checkImagePaths();
