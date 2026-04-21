# 密码重置功能 - 已删除代码存储

## 删除原因
密码重置功能需要真实的邮箱发送服务（如 QQ 邮箱、Gmail 等），需要配置：
1. 邮箱 SMTP 服务
2. 邮箱授权码
3. 邮件发送服务（如 nodemailer）
4. 后端路由和控制器实现

由于项目无法提供真实的邮箱服务，该功能无法正常使用，因此删除所有相关代码。

---

## 删除的文件

### 1. ForgotPassword.vue（忘记密码页面）
**文件路径**: `d:\bloglogin\src\vue\components\ForgotPassword.vue`

**功能说明**:
- 用户输入注册邮箱
- 发送密码重置链接到邮箱
- 模拟 API 请求（未实现真实功能）

**代码已备份在本文件下方**

---

### 2. ResetPassword.vue（重置密码页面）
**文件路径**: `d:\bloglogin\src\vue\components\ResetPassword.vue`

**功能说明**:
- 用户通过邮箱链接访问
- 输入新密码并确认
- 验证 token 有效性
- 模拟 API 请求（未实现真实功能）

**代码已备份在本文件下方**

---

### 3. Developer.vue（开发者页面）
**文件路径**: `d:\bloglogin\src\vue\components\Developer.vue`

**删除原因**: 该组件没有被任何地方引用，也没有在路由中注册，属于未使用的开发废案。

**功能说明**:
- 开发者中心页面
- API 文档展示
- 开发资源下载
- API 密钥管理
- 社区支持

**代码已备份在本文件下方**

---

## 删除的路由配置

### router/index.js 中删除的路由

```javascript
// 删除以下路由配置
{
  path: '/forgot-password',
  name: 'ForgotPassword',
  component: ForgotPassword
},
{
  path: '/reset-password',
  name: 'ResetPassword',
  component: ResetPassword
}
```

---

## 删除的其他引用

### 1. Login.vue 中删除的链接
```html
<!-- 删除"忘记密码？"链接 -->
<router-link to="/forgot-password" class="text-primary text-decoration-none cel-link">忘记密码？</router-link>
```

### 2. App.vue 中删除的路径检查
```javascript
// 删除 forgot-password 路径检查
return currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password'
```

### 3. auth.js 中删除的路径检查
```javascript
// 删除 forgot-password 路径检查
currentPath !== '/forgot-password'
```

### 4. router/index.js 中删除的公开路由
```javascript
// 从 publicRoutes 数组中删除
'/forgot-password',
'/reset-password'
```

---

## 如何实现真实的密码重置功能

如果将来需要实现密码重置功能，需要以下步骤：

### 1. 后端实现

#### 安装依赖
```bash
npm install nodemailer
```

#### 创建邮件服务 (emailService.js)
```javascript
const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  service: 'QQ', // 或 'Gmail', '163' 等
  auth: {
    user: 'your-email@qq.com',
    pass: 'your-authorization-code' // 邮箱授权码，不是密码
  }
});

// 发送密码重置邮件
exports.sendResetEmail = async (email, resetToken) => {
  const resetUrl = `http://your-domain.com/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: 'your-email@qq.com',
    to: email,
    subject: '密码重置 - KK博客',
    html: `
      <h1>密码重置</h1>
      <p>您收到这封邮件是因为您申请了密码重置。</p>
      <p>请点击以下链接重置密码：</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>此链接30分钟内有效。</p>
      <p>如果您没有申请密码重置，请忽略此邮件。</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
};
```

#### 添加路由 (authRoutes.js)
```javascript
// 忘记密码 - 发送重置邮件
router.post('/forgot-password', authController.forgotPassword);

// 重置密码 - 验证 token 并重置
router.post('/reset-password', authController.resetPassword);
```

#### 添加控制器方法 (authController.js)
```javascript
// 忘记密码
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: '该邮箱未注册' });
    }
    
    // 生成重置 token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 设置 token 过期时间（30分钟）
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    
    await user.save();
    
    // 发送邮件
    await emailService.sendResetEmail(email, resetToken);
    
    res.json({ success: true, message: '密码重置邮件已发送' });
  } catch (error) {
    res.status(500).json({ success: false, message: '发送邮件失败' });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // 查找用户并验证 token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: '重置链接已过期或无效' });
    }
    
    // 更新密码
    user.password = newPassword; // 会在 pre save 钩子中自动加密
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '密码重置失败' });
  }
};
```

### 2. User 模型添加字段
```javascript
// 在 User.js 模型中添加
resetPasswordToken: {
  type: String,
  select: false
},
resetPasswordExpires: {
  type: Date,
  select: false
}
```

### 3. 前端修改

#### ForgotPassword.vue 修改
```javascript
// 替换 simulateApiRequest 为真实 API 调用
async sendResetLink() {
  if (!this.validateForm()) return;
  
  this.isLoading = true;
  this.errorMessage = '';
  
  try {
    const response = await this.$http.post('/auth/forgot-password', {
      email: this.formData.email
    });
    
    if (response.success) {
      this.successMessage = '密码重置链接已发送到您的邮箱，请检查收件箱';
      this.formData.email = '';
    }
  } catch (error) {
    this.errorMessage = error.response?.data?.message || '发送失败，请稍后重试';
  } finally {
    this.isLoading = false;
  }
}
```

#### ResetPassword.vue 修改
```javascript
// 替换模拟方法为真实 API 调用
async validateResetToken() {
  this.isLoading = true;
  try {
    const response = await this.$http.get(`/auth/validate-reset-token?token=${this.resetToken}`);
    this.tokenExpired = !response.success;
  } catch (error) {
    this.tokenExpired = true;
    this.errorMessage = '重置链接已过期或无效';
  } finally {
    this.isLoading = false;
  }
}

async resetPassword() {
  if (!this.validateForm()) return;
  
  this.isLoading = true;
  this.errorMessage = '';
  
  try {
    const response = await this.$http.post('/auth/reset-password', {
      token: this.resetToken,
      newPassword: this.formData.newPassword
    });
    
    if (response.success) {
      this.successMessage = '密码重置成功，请使用新密码登录';
      setTimeout(() => {
        this.$router.push('/login');
      }, 3000);
    }
  } catch (error) {
    this.errorMessage = error.response?.data?.message || '重置失败，请稍后重试';
  } finally {
    this.isLoading = false;
  }
}
```

---

## 常见邮箱 SMTP 配置

### QQ 邮箱
```javascript
{
  service: 'QQ',
  auth: {
    user: 'your-email@qq.com',
    pass: '授权码' // 需要在 QQ 邮箱设置中开启 SMTP 服务并获取授权码
  }
}
```

### 163 邮箱
```javascript
{
  service: '163',
  auth: {
    user: 'your-email@163.com',
    pass: '授权码'
  }
}
```

### Gmail
```javascript
{
  service: 'Gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: '应用专用密码' // 需要在 Google 账户设置中生成应用专用密码
  }
}
```

---

## 删除时间
**删除日期**: 2026-04-02

**删除原因**: 
1. 密码重置功能需要真实的邮箱服务，项目无法提供
2. 前端界面只是模拟，后端没有实现
3. Developer.vue 组件未被使用，属于开发废案

---

## 备份代码

### ForgotPassword.vue 完整代码
见项目 Git 历史记录或联系开发者获取

### ResetPassword.vue 完整代码
见项目 Git 历史记录或联系开发者获取

### Developer.vue 完整代码
见项目 Git 历史记录或联系开发者获取
