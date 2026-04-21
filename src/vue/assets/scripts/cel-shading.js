// 赛璐璐风格的魔法和科幻效果
class CelShadingEffects {
    constructor() {
        this.magicParticles = [];
        this.isRunning = false;
        this.holographicElements = [];
        
        this.init();
    }
    
    // 初始化所有效果
    init() {
        // 移除魔法光环效果
        // this.initMagicGlow();
        this.initFormInteractions();
        this.initHolographicEffects();
        this.initParticleSystem();
        
        this.isRunning = true;
        this.animate();
    }
    
    // 初始化魔法光晕效果
    initMagicGlow() {
        const card = document.querySelector('.cel-card');
        if (card) {
            // 为卡片添加额外的魔法光晕
            setInterval(() => {
                this.createMagicRing(card);
            }, 3000);
        }
    }
    
    // 创建魔法光环
    createMagicRing(element) {
        const ring = document.createElement('div');
        ring.className = 'magic-ring';
        
        const rect = element.getBoundingClientRect();
        const x = rect.width / 2;
        const y = rect.height / 2;
        
        ring.style.position = 'absolute';
        ring.style.left = `${x}px`;
        ring.style.top = `${y}px`;
        ring.style.width = '0';
        ring.style.height = '0';
        ring.style.border = '3px solid transparent';
        ring.style.borderRadius = '50%';
        ring.style.transform = 'translate(-50%, -50%)';
        ring.style.pointerEvents = 'none';
        ring.style.zIndex = '10';
        
        // 随机魔法颜色
        const colors = ['#ff6b9d', '#74b9ff', '#a29bfe', '#00b894', '#fdcb6e'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        ring.style.borderColor = color;
        
        element.appendChild(ring);
        
        // 动画
        ring.animate([
            { width: '0', height: '0', opacity: 1, borderWidth: '3px' },
            { width: `${Math.max(rect.width, rect.height) * 2}px`, height: `${Math.max(rect.width, rect.height) * 2}px`, opacity: 0, borderWidth: '1px' }
        ], {
            duration: 2000,
            easing: 'ease-out'
        }).onfinish = () => {
            ring.remove();
        };
    }
    
    // 初始化全息投影效果
    initHolographicEffects() {
        const card = document.querySelector('.cel-card');
        if (card) {
            // 创建全息投影效果
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
            
            // 添加CSS动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes hologram-shift {
                    0% {
                        background-position: 0 0;
                    }
                    100% {
                        background-position: 20px 20px;
                    }
                }
            `;
            document.head.appendChild(style);
            
            this.holographicElements.push(hologram);
        }
    }
    
    // 初始化粒子系统
    initParticleSystem() {
        // 为按钮添加点击粒子效果
        const buttons = document.querySelectorAll('.cel-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createButtonParticles(e);
            });
        });
    }
    
    // 创建按钮点击粒子效果
    createButtonParticles(event) {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 创建10个粒子
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
            
            // 随机颜色和方向
            const colors = ['#ff6b9d', '#74b9ff', '#a29bfe', '#00b894', '#fdcb6e', '#ffeaa7'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            button.appendChild(particle);
            
            // 随机方向和距离
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 50 + 20;
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            
            // 动画
            particle.animate([
                { transform: 'translate(0, 0)', opacity: 1 },
                { transform: `translate(${vx}px, ${vy}px)`, opacity: 0 }
            ], {
                duration: Math.random() * 500 + 800,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }
    
    // 初始化表单交互
    initFormInteractions() {
        this.initPasswordToggle();
        this.initFormValidation();
        this.initInputEffects();
    }
    
    // 密码显示/隐藏功能
    initPasswordToggle() {
        const toggleButton = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('loginPassword');
        
        if (toggleButton && passwordInput) {
            toggleButton.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // 切换图标
                const icon = toggleButton.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
                
                // 移除点击特效
                // this.createMagicRing(toggleButton);
            });
        }
    }
    
    // 表单验证
    initFormValidation() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // 密码确认验证
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (registerPassword && confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(registerPassword, confirmPassword);
            });
        }
    }
    
    // 验证密码匹配
    validatePasswordMatch(password1, password2) {
        if (password1.value !== password2.value) {
            password2.setCustomValidity('密码不匹配');
            this.showInputError(password2, '密码不匹配');
        } else {
            password2.setCustomValidity('');
            this.hideInputError(password2);
        }
    }
    
    // 显示输入错误
    showInputError(input, message) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            let errorElement = formGroup.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.style.color = 'red';
                errorElement.style.fontSize = '0.875rem';
                errorElement.style.marginTop = '0.25rem';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }
    
    // 隐藏输入错误
    hideInputError(input) {
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
    
    // 处理登录
    handleLogin() {
        console.log('handleLogin 被调用');
        
        const button = document.querySelector('.btn-login');
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        console.log('用户名:', username);
        console.log('密码:', password);
        
        if (button) {
            this.showLoadingState(button, '登录中...');
            
            // 模拟登录过程
            setTimeout(() => {
                // 验证用户名和密码
                const validUsers = [
                    { username: 'user@example.com', password: 'user123456' },
                    { username: 'user', password: 'user123456' }
                ];
                
                const isValid = validUsers.some(user => 
                    user.username === username && user.password === password
                );
                
                console.log('验证结果:', isValid);
                
                this.hideLoadingState(button, '<i class="fas fa-sign-in-alt me-2"></i>登录');
                
                if (isValid) {
                    // 保存登录状态到localStorage
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('username', username);
                    
                    console.log('登录成功，准备跳转');
                    
                    // 跳转到首页
                    window.location.href = 'blog.html';
                } else {
                    alert('用户名或密码错误！\n\n测试账号：\n用户名：user@example.com 或 user\n密码：user123456');
                }
            }, 800);
        }
    }
    
    // 处理注册
    handleRegister() {
        const button = document.querySelector('.btn-register');
        if (button) {
            this.showLoadingState(button, '注册中...');
            
            // 模拟注册过程
            setTimeout(() => {
                this.hideLoadingState(button, '<i class="fas fa-user-plus me-2"></i>注册');
                alert('注册成功！欢迎加入校园魔法博客！');
            }, 2000);
        }
    }
    
    // 显示加载状态
    showLoadingState(button, text) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${text}`;
    }
    
    // 隐藏加载状态
    hideLoadingState(button, originalHtml) {
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
    
    // 初始化输入框效果
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
    
    // 输入框获得焦点
    onInputFocus(event) {
        const input = event.target;
        const formGroup = input.closest('.form-group');
        
        // 添加魔法效果
        if (formGroup) {
            formGroup.style.transform = 'scale(1.02)';
            formGroup.style.transition = 'transform 0.2s ease';
        }
        
        // 创建魔法粒子
        this.createInputParticles(input, 'focus');
    }
    
    // 输入框失去焦点
    onInputBlur(event) {
        const input = event.target;
        const formGroup = input.closest('.form-group');
        
        if (formGroup) {
            formGroup.style.transform = 'scale(1)';
        }
        
        // 验证输入
        if (input.required && !input.value) {
            this.showInputError(input, '此项为必填');
        } else if (input.type === 'email' && input.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                this.showInputError(input, '请输入有效的邮箱地址');
            } else {
                this.hideInputError(input);
            }
        } else {
            this.hideInputError(input);
        }
    }
    
    // 创建输入框粒子效果
    createInputParticles(input, type) {
        const rect = input.getBoundingClientRect();
        const parent = input.parentElement;
        
        const colors = type === 'focus' ? ['#74b9ff', '#a29bfe'] : ['#ff6b9d', '#fdcb6e'];
        
        // 创建5个粒子
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'input-particle';
            
            particle.style.position = 'absolute';
            particle.style.left = `${rect.width - 10}px`;
            particle.style.top = `${rect.height / 2}px`;
            particle.style.width = '3px';
            particle.style.height = '3px';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '10';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            parent.appendChild(particle);
            
            // 随机方向
            const angle = Math.random() * Math.PI - Math.PI / 2;
            const distance = Math.random() * 30 + 10;
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            
            // 动画
            particle.animate([
                { transform: 'translate(0, 0)', opacity: 1 },
                { transform: `translate(${vx}px, ${vy}px)`, opacity: 0 }
            ], {
                duration: Math.random() * 300 + 500,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }
    
    // 主动画循环
    animate() {
        if (!this.isRunning) return;
        
        // 更新粒子
        this.updateParticles();
        
        // 更新全息效果
        this.updateHolographicEffects();
        
        requestAnimationFrame(() => this.animate());
    }
    
    // 更新粒子
    updateParticles() {
        // 移除过期粒子
        this.magicParticles = this.magicParticles.filter(particle => {
            if (particle.life <= 0) {
                if (particle.element.parentNode) {
                    particle.element.parentNode.removeChild(particle.element);
                }
                return false;
            }
            
            // 更新粒子位置和生命周期
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            // 更新DOM元素
            if (particle.element) {
                particle.element.style.left = `${particle.x}px`;
                particle.element.style.top = `${particle.y}px`;
                particle.element.style.opacity = particle.life / particle.maxLife;
            }
            
            return true;
        });
    }
    
    // 更新全息效果
    updateHolographicEffects() {
        // 可以在这里添加动态的全息效果更新
    }
    
    // 暂停效果
    pause() {
        this.isRunning = false;
    }
    
    // 恢复效果
    resume() {
        this.isRunning = true;
        this.animate();
    }
    
    // 销毁所有效果
    destroy() {
        this.isRunning = false;
        
        // 移除所有粒子
        this.magicParticles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.magicParticles = [];
        
        // 移除全息元素
        this.holographicElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.holographicElements = [];
    }
}

// 页面加载完成后初始化所有效果
document.addEventListener('DOMContentLoaded', () => {
    // 初始化赛璐璐风格效果
    window.celShading = new CelShadingEffects();
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});