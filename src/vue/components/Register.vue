<!-- 
=============================================================================
  Register.vue - 注册页面组件（学习版）
=============================================================================

【组件职责】
  这是用户注册页面，负责：
  1. 用户注册表单
  2. 表单验证（用户名、邮箱、密码、确认密码）
  3. 注册请求处理
  4. 注册成功后跳转登录页

【学习重点】
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  1. 表单验证：多字段验证逻辑                                             │
  │  2. 密码确认：两次密码一致性验证                                         │
  │  3. 复选框绑定：v-model 绑定布尔值                                       │
  │  4. 异步请求：async/await 处理注册                                       │
  │  5. 错误处理：多种错误类型的处理                                         │
  │  6. 生命周期：beforeUnmount 清理资源                                     │
  └─────────────────────────────────────────────────────────────────────────┘

【表单字段说明】
  ┌──────────────┬────────────────────────────────────────────────┐
  │  字段名       │  验证规则                                      │
  ├──────────────┼────────────────────────────────────────────────┤
  │  username    │  必填，最少3位                                 │
  │  email       │  必填，邮箱格式                                │
  │  password    │  必填，最少6位                                 │
  │  confirmPassword │  必填，与 password 一致                    │
  │  agreeTerms  │  必须勾选                                      │
  └──────────────┴────────────────────────────────────────────────┘

【注册流程】
  1. 用户填写注册信息
  2. 前端验证表单
  3. 发送注册请求到后端
  4. 后端创建用户
  5. 注册成功跳转登录页

【面试常问】
  Q: 为什么注册成功后不直接登录？
  A: 1. 安全考虑：让用户确认账号信息
     2. 邮箱验证：可能需要验证邮箱
     3. 用户习惯：明确区分注册和登录流程

=============================================================================
-->
<template>
  <div class="register-container">
    <!-- 科幻扫描线效果 -->
    
    <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
      <div class="row w-100 justify-content-center">
        <div class="col-md-8 col-lg-6 col-xl-5">
          <!-- 登录注册卡片 -->
          <div class="card cel-card login-card shadow-lg">
            <!-- 卡片装饰元素 -->
            <div class="card-decoration top-left">
              <i class="fas fa-star"></i>
            </div>
            <div class="card-decoration top-right">
              <i class="fas fa-heart"></i>
            </div>
            <div class="card-decoration bottom-left">
              <i class="fas fa-moon"></i>
            </div>
            <div class="card-decoration bottom-right">
              <i class="fas fa-sun"></i>
            </div>
            
            <div class="card-body p-5">
              <!-- 标题和Logo -->
              <div class="text-center mb-5">
                <h2 class="mb-1">
                  <span class="logo-text">
                    <i class="fas fa-magic text-primary"></i> kk博客
                  </span>
                </h2>
                <p class="text-muted">欢迎加入魔法校园，开始您的创作之旅</p>
              </div>
              
              <!-- 切换标签 -->
              <div class="nav nav-pills justify-content-center mb-5" id="auth-tabs" role="tablist">
                <button class="nav-link px-4 py-2 cel-button" id="login-tab" type="button" @click="goToLogin">
                  <i class="fas fa-sign-in-alt me-2"></i>登录
                </button>
                <button class="nav-link active px-4 py-2 cel-button" id="register-tab" type="button">
                  <i class="fas fa-user-plus me-2"></i>注册
                </button>
              </div>

              <!-- 表单内容 -->
              <div class="tab-content" id="auth-tabs-content">
                <!-- 注册表单 -->
                <div class="tab-pane fade show active" id="register" role="tabpanel" aria-labelledby="register-tab">
                  <!-- 
                    @submit.prevent="register"
                    【.prevent 修饰符】阻止表单默认提交行为
                  -->
                  <form @submit.prevent="register">
                    <!-- 用户名 -->
                    <div class="mb-4 form-group">
                      <label for="registerUsername" class="form-label cel-label">用户名</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-user"></i>
                        </span>
                        <!-- v-model 双向绑定用户名 -->
                        <input type="text" id="registerUsername" v-model="formData.username" class="form-control cel-input" placeholder="请设置用户名" required>
                        <div class="input-glow"></div>
                      </div>
                      <!-- 错误提示 -->
                      <div class="error-message" v-if="errors.username">{{ errors.username }}</div>
                    </div>

                    <!-- 邮箱 -->
                    <div class="mb-4 form-group">
                      <label for="registerEmail" class="form-label cel-label">邮箱</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-envelope"></i>
                        </span>
                        <!-- type="email" HTML5 邮箱验证 -->
                        <input type="email" id="registerEmail" v-model="formData.email" class="form-control cel-input" placeholder="请输入邮箱" required>
                        <div class="input-glow"></div>
                      </div>
                      <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
                    </div>

                    <!-- 密码 -->
                    <div class="mb-4 form-group">
                      <label for="registerPassword" class="form-label cel-label">密码</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-lock"></i>
                        </span>
                        <!-- ref 用于访问 DOM 元素切换显示/隐藏 -->
                        <input type="password" id="registerPassword" v-model="formData.password" class="form-control cel-input" placeholder="请设置密码（至少6位）" required ref="passwordInput">
                        <!-- 密码显示/隐藏切换按钮 -->
                        <button class="btn btn-outline-secondary border-cel" type="button" @click="togglePassword" ref="toggleButton">
                          <i class="fas fa-eye" ref="eyeIcon"></i>
                        </button>
                        <div class="input-glow"></div>
                      </div>
                      <div class="form-text text-muted mt-1">密码至少8位，包含字母和数字</div>
                      <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
                    </div>

                    <!-- 确认密码 -->
                    <div class="mb-4 form-group">
                      <label for="confirmPassword" class="form-label cel-label">确认密码</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light border-cel">
                          <i class="fas fa-lock"></i>
                        </span>
                        <!-- 确认密码需要与密码一致 -->
                        <input type="password" id="confirmPassword" v-model="formData.confirmPassword" class="form-control cel-input" placeholder="请再次输入密码" required ref="confirmPasswordInput">
                        <button class="btn btn-outline-secondary border-cel" type="button" @click="toggleConfirmPassword" ref="toggleConfirmButton">
                          <i class="fas fa-eye" ref="confirmEyeIcon"></i>
                        </button>
                        <div class="input-glow"></div>
                      </div>
                      <div class="error-message" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</div>
                    </div>

                    <!-- 同意条款 -->
                    <div class="form-check mb-4">
                      <!-- 复选框绑定：v-model 绑定布尔值 -->
                      <input class="form-check-input cel-checkbox" type="checkbox" id="terms" v-model="formData.agreeTerms" required>
                      <label class="form-check-label cel-label" for="terms">
                        我已阅读并同意 <a href="#" class="text-primary text-decoration-none cel-link">用户协议</a> 和 <a href="#" class="text-primary text-decoration-none cel-link">隐私政策</a>
                      </label>
                      <div class="error-message" v-if="errors.agreeTerms">{{ errors.agreeTerms }}</div>
                    </div>

                    <!-- 注册失败，显示错误信息 -->
                    <div class="error-message" v-if="errors.register">{{ errors.register }}</div>

                    <!-- 注册按钮 -->
                    <!-- :disabled 动态禁用，防止重复提交 -->
                    <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-register" :disabled="isLoading">
                      <i class="fas fa-user-plus me-2"></i>{{ isLoading ? '注册中...' : '注册' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <!-- 页脚信息 -->
          <div class="text-center mt-4 text-muted">
            <p class="cel-text">&copy; 2025 kk博客. 保留所有权利.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Register',  // 组件名称
  
  // ============================================================
  // data 数据区
  // ============================================================
  data() {
    return {
      // ============================================================
      // 表单数据
      // ============================================================
      formData: {
        // 【username】
        // 类型：String
        // 作用：存储用户输入的用户名
        // 验证：必填，最少3位
        username: '',
        
        // 【email】
        // 类型：String
        // 作用：存储用户输入的邮箱
        // 验证：必填，邮箱格式
        email: '',
        
        // 【password】
        // 类型：String
        // 作用：存储用户输入的密码
        // 验证：必填，最少6位
        password: '',
        
        // 【confirmPassword】
        // 类型：String
        // 作用：存储用户输入的确认密码
        // 验证：必填，与 password 一致
        confirmPassword: '',
        
        // 【agreeTerms】
        // 类型：Boolean
        // 作用：标记用户是否同意服务条款
        // 验证：必须为 true
        agreeTerms: false
      },
      
      // 【errors】
      // 类型：Object
      // 作用：存储表单验证错误信息
      errors: {},
      
      // 【isLoading】
      // 类型：Boolean
      // 作用：标记是否正在注册中
      isLoading: false,
      
      // 【passwordVisible】
      // 类型：Boolean
      // 作用：标记密码是否可见
      passwordVisible: false,
      
      // 【confirmPasswordVisible】
      // 类型：Boolean
      // 作用：标记确认密码是否可见
      confirmPasswordVisible: false,
      
      // 特效相关
      celShading: null
    };
  },
  
  // ============================================================
  // mounted 生命周期钩子
  // ============================================================
  mounted() {
    // 初始化效果
    this.initEffects();
    // 初始化表单验证
    this.initFormValidation();
    // 初始化密码确认验证
    this.initPasswordConfirmValidation();
  },
  
  // ============================================================
  // beforeUnmount 生命周期钩子
  // ============================================================
  // 【作用】组件销毁前清理资源
  // 【重要】防止内存泄漏
  // ============================================================
  beforeUnmount() {
    // 销毁效果
    if (this.celShading) {
      this.celShading.destroy();
    }
  },
  
  // ============================================================
  // methods 方法区
  // ============================================================
  methods: {
    // 初始化所有效果
    initEffects() {
      this.initCelShading();
    },
    
    // ============================================================
    // 密码显示/隐藏切换
    // ============================================================
    togglePassword() {
      this.passwordVisible = !this.passwordVisible;
      const passwordInput = this.$refs.passwordInput;
      const icon = this.$refs.eyeIcon;
      
      if (this.passwordVisible) {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    },
    
    // ============================================================
    // 确认密码显示/隐藏切换
    // ============================================================
    toggleConfirmPassword() {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
      const confirmPasswordInput = this.$refs.confirmPasswordInput;
      const icon = this.$refs.confirmEyeIcon;
      
      if (this.confirmPasswordVisible) {
        confirmPasswordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        confirmPasswordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    },
    
    // 初始化赛璐璐效果
    initCelShading() {
      const CelShadingEffects = window.CelShadingEffects || class {
        constructor() {
          this.magicParticles = [];
          this.isRunning = false;
          this.holographicElements = [];
          this.init();
        }
        
        init() {
          this.initFormInteractions();
          this.initHolographicEffects();
          this.initParticleSystem();
          this.isRunning = true;
          this.animate();
        }
        
        initHolographicEffects() {
          const card = document.querySelector('.cel-card');
          if (card) {
            const hologram = document.createElement('div');
            hologram.className = 'hologram-effect';
            hologram.style.position = 'absolute';
            hologram.style.top = '0';
            hologram.style.left = '0';
            hologram.style.width = '100%';
            hologram.style.height = '100%';
            hologram.style.background = 'linear-gradient(45deg, transparent 49%, rgba(0, 206, 201, 0.1) 50%, transparent 51%)';
            hologram.style.backgroundSize = '20px 20px';
            hologram.style.pointerEvents = 'none';
            hologram.style.zIndex = '11';
            hologram.style.animation = 'hologram-shift 3s linear infinite';
            card.appendChild(hologram);
            this.holographicElements.push(hologram);
          }
        }
        
        initParticleSystem() {
          const buttons = document.querySelectorAll('.cel-button');
          buttons.forEach(button => {
            button.addEventListener('click', (e) => {
              this.createButtonParticles(e);
            });
          });
        }
        
        createButtonParticles(event) {
          const button = event.currentTarget;
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          
          for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.position = 'absolute';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '100';
            const colors = ['#ff6b9d', '#74b9ff', '#a29bfe', '#00b894', '#fdcb6e', '#ffeaa7'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            button.appendChild(particle);
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            particle.animate([
              { transform: 'translate(0, 0)', opacity: 1 },
              { transform: `translate(${vx}px, ${vy}px)`, opacity: 0 }
            ], {
              duration: Math.random() * 500 + 500,
              easing: 'ease-out'
            }).onfinish = () => {
              particle.remove();
            };
          }
        }
        
        initFormInteractions() {
          this.initInputEffects();
        }
        
        initInputEffects() {
          const inputs = document.querySelectorAll('.cel-input');
          inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
              this.onInputFocus(e);
            });
            input.addEventListener('blur', (e) => {
              this.onInputBlur(e);
            });
          });
        }
        
        onInputFocus(event) {
          const input = event.target;
          const formGroup = input.closest('.form-group');
          if (formGroup) {
            formGroup.style.transform = 'scale(1.02)';
            formGroup.style.transition = 'transform 0.2s ease';
          }
        }
        
        onInputBlur(event) {
          const input = event.target;
          const formGroup = input.closest('.form-group');
          if (formGroup) {
            formGroup.style.transform = 'scale(1)';
          }
        }
        
        animate() {
          if (!this.isRunning) return;
          this.updateParticles();
          this.updateHolographicEffects();
          requestAnimationFrame(() => this.animate());
        }
        
        updateParticles() {
          this.magicParticles = this.magicParticles.filter(particle => {
            if (particle.life <= 0) {
              if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
              }
              return false;
            }
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            if (particle.element) {
              particle.element.style.left = `${particle.x}px`;
              particle.element.style.top = `${particle.y}px`;
              particle.element.style.opacity = particle.life / particle.maxLife;
            }
            return true;
          });
        }
        
        updateHolographicEffects() {}
        
        destroy() {
          this.isRunning = false;
          this.magicParticles.forEach(particle => {
            if (particle.element.parentNode) {
              particle.element.parentNode.removeChild(particle.element);
            }
          });
          this.magicParticles = [];
          this.holographicElements.forEach(element => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
          this.holographicElements = [];
        }
      };
      
      this.celShading = new CelShadingEffects();
    },
    
    // ============================================================
    // 初始化表单验证
    // ============================================================
    initFormValidation() {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
          input.addEventListener('blur', () => {
            this.validateInput(input);
          });
        });
      });
    },
    
    // ============================================================
    // 初始化密码确认验证
    // ============================================================
    // 【作用】实时验证两次密码是否一致
    // ============================================================
    initPasswordConfirmValidation() {
      const registerPassword = document.getElementById('registerPassword');
      const confirmPassword = document.getElementById('confirmPassword');
      
      if (registerPassword && confirmPassword) {
        confirmPassword.addEventListener('input', () => {
          this.validatePasswordMatch(registerPassword, confirmPassword);
        });
      }
    },
    
    // ============================================================
    // 验证密码匹配
    // ============================================================
    // 【作用】检查两次输入的密码是否一致
    // 【参数】password1, password2：DOM 元素
    // ============================================================
    validatePasswordMatch(password1, password2) {
      if (password1.value !== password2.value) {
        password2.setCustomValidity('密码不匹配');
        this.errors.confirmPassword = '两次输入的密码不一致';
      } else {
        password2.setCustomValidity('');
        this.errors.confirmPassword = '';
      }
    },
    
    // 验证单个输入框
    validateInput(input) {
      const fieldName = input.id.replace('register', '').toLowerCase();
      
      if (input.checkValidity()) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        this.errors[fieldName] = '';
      } else {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        this.errors[fieldName] = input.validationMessage;
      }
    },
    
    // ============================================================
    // 表单验证
    // ============================================================
    // 【作用】验证整个注册表单
    // 【返回值】Boolean（true 表示验证通过）
    // ============================================================
    validateForm() {
      this.errors = {};
      
      // 验证用户名
      if (!this.formData.username) {
        this.errors.username = '请输入用户名';
      } else if (this.formData.username.length < 3) {
        this.errors.username = '用户名长度不能少于3位';
      }
      
      // 验证邮箱
      if (!this.formData.email) {
        this.errors.email = '请输入邮箱';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码
      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }
      
      // 验证确认密码
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.formData.confirmPassword !== this.formData.password) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      }
      
      // 验证同意条款
      if (!this.formData.agreeTerms) {
        this.errors.agreeTerms = '请同意服务条款和隐私政策';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    // ============================================================
    // 注册方法
    // ============================================================
    // 【作用】处理用户注册
    // 【流程】
    // 1. 验证表单
    // 2. 发送注册请求
    // 3. 处理响应结果
    // ============================================================
    async register() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        // 发送注册请求
        const response = await this.$http.post('/api/auth/register', {
          username: this.formData.username,
          email: this.formData.email,
          password: this.formData.password
        });
        
        if (response.success) {
          // 注册成功，跳转到登录页
          this.$router.push('/login');
        } else {
          // 注册失败，显示错误信息
          if (response.errors) {
            this.errors = response.errors;
          } else {
            this.errors.register = response.message || '注册失败，请稍后重试';
          }
        }
      } catch (error) {
        // 错误处理
        if (error.response) {
          this.errors.register = error.response.message || '注册失败，请稍后重试';
        } else if (error.request) {
          this.errors.register = '网络错误，无法连接到服务器，请检查网络连接';
        } else {
          this.errors.register = '请求配置错误，请稍后重试';
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    // ============================================================
    // 跳转到登录页面
    // ============================================================
    goToLogin() {
      if (this.$route.path !== '/login') {
        this.$router.push('/login');
      }
    }
  }
}
</script>

<style scoped>
/* 赛璐璐风格基础样式 */
/* 使用全局CSS变量，与其他组件保持一致 */

/* 注册容器 */
.register-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
    overflow: hidden;
}

/* 渐变背景装饰 */
.register-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="25" cy="75" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
    background-size: 100px 100px;
    animation: float 20s infinite linear;
    z-index: 0;
}

@keyframes float {
    0% {
        transform: translateY(0) translateX(0);
    }
    100% {
        transform: translateY(-100px) translateX(-100px);
    }
}


/* 卡片样式 */
.login-card {
    border: 2px solid var(--primary-color);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
}

/* 卡片装饰 */
.card-decoration {
    position: absolute;
    font-size: 20px;
    opacity: 0.3;
    z-index: 1;
}

.card-decoration.top-left {
    top: 15px;
    left: 15px;
}

.card-decoration.top-right {
    top: 15px;
    right: 15px;
}

.card-decoration.bottom-left {
    bottom: 15px;
    left: 15px;
}

.card-decoration.bottom-right {
    bottom: 15px;
    right: 15px;
}

/* Logo 文字 */
.logo-text {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* 导航标签 */
.nav-pills .nav-link {
    border-radius: 25px;
    margin: 0 5px;
    transition: all 0.3s ease;
}

.nav-pills .nav-link.active {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
}

/* 输入框样式 */
.cel-input {
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: 12px 15px;
    transition: all 0.3s ease;
}

.cel-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

/* 输入框组 */
.input-group-text {
    border: 2px solid #e0e0e0;
    border-right: none;
    border-radius: 10px 0 0 10px;
}

/* 按钮样式 */
.cel-button {
    border-radius: 25px;
    padding: 12px 30px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.cel-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-register {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    border: none;
}

.btn-register:hover {
    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
}

/* 错误信息 */
.error-message {
    color: #e74c3c;
    font-size: 12px;
    margin-top: 5px;
}

/* 复选框样式 */
.cel-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

/* 链接样式 */
.cel-link {
    text-decoration: none;
    transition: color 0.3s ease;
}

.cel-link:hover {
    color: var(--secondary-color);
}

/* 标签样式 */
.cel-label {
    font-weight: 500;
    color: #333;
}

/* 文本样式 */
.cel-text {
    font-size: 14px;
}

/* 输入框发光效果 */
.input-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.input-group:focus-within .input-glow {
    opacity: 1;
    box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3);
}

/* 边框样式 */
.border-cel {
    border-color: #e0e0e0;
}

/* 响应式 */
@media (max-width: 768px) {
    .login-card {
        margin: 20px;
    }
    
    .logo-text {
        font-size: 24px;
    }
}
</style>
