// 提供数据验证功能，包括：
// 1. 用户注册验证
// 2. 用户登录验证
// 3. 字段格式验证
// A: Yup 提供声明式验证，代码更清晰，易于维护
// A: Yup 支持 async test，可以验证数据库唯一性
// A: Yup 的 message 参数就是错误提示

// 导入依赖模块

// Yup：JavaScript 数据验证库
const yup = require('yup');

// 用户注册验证模式
// - username: 用户名（3-20个字符）
// - email: 邮箱（有效邮箱格式）
// - password: 密码（至少6个字符）
// - confirmPassword: 确认密码（必须与密码一致）
// await registerValidation.validate(req.body)
exports.registerValidation = yup.object().shape({
    // 用户名验证
    username: yup.string()
        .required('用户名不能为空')           // 必填
        .min(3, '用户名长度不能少于3个字符')  // 最小长度
        .max(20, '用户名长度不能超过20个字符'), // 最大长度
    
    // 邮箱验证
    email: yup.string()
        .required('邮箱不能为空')             // 必填
        .email('请输入有效的邮箱地址'),       // 邮箱格式
    
    // 密码验证
    password: yup.string()
        .required('密码不能为空')             // 必填
        .min(6, '密码长度不能少于6个字符'),   // 最小长度
    
    // 确认密码验证
    confirmPassword: yup.string()
        .required('请确认密码')               // 必填
        .oneOf([yup.ref('password')], '两次输入的密码不一致')  // 必须与密码一致
});

// 用户登录验证模式
// - email: 邮箱或用户名（支持两种登录方式）
// - password: 密码
// - 如果输入包含 @，验证邮箱格式
// - 否则作为用户名，不需要邮箱格式
exports.loginValidation = yup.object().shape({
    // 邮箱/用户名验证
    email: yup.string()
        .required('用户名或邮箱不能为空')
        // 自定义验证：test(name, message, function)
        .test(
            'is-email-or-username',           // 测试名称
            '请输入有效的用户名或邮箱地址',    // 错误信息
            function(value) {
                // 如果包含 @ 符号，验证邮箱格式
                if (value && value.includes('@')) {
                    // yup.string().email().isValidSync(value)
                    // 检查是否为有效邮箱格式
                    return yup.string().email().isValidSync(value);
                }
                // 否则作为用户名，不需要邮箱格式
                return true;
            }
        ),
    
    // 密码验证
    password: yup.string()
        .required('密码不能为空')
});

// 使用示例
// const { registerValidation, loginValidation } = require('../utils/validation');
// // 注册验证
// try {
//   await registerValidation.validate(req.body);
//   // 验证通过，继续处理
// } catch (error) {
//   return res.status(400).json({ message: error.message });
// // 登录验证
// try {
//   await loginValidation.validate(req.body);
//   // 验证通过，继续处理
// } catch (error) {
//   return res.status(400).json({ message: error.message });
// // 在路由中使用
// router.post('/register', async (req, res) => {
//   try {
//     // 验证请求数据
//     await registerValidation.validate(req.body);
//     // 创建用户
//     const user = await User.create(req.body);
//     res.json({ success: true, user });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
// });
