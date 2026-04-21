// 樱花飘落动画实现 - 性能优化版
class SakuraAnimation {
    constructor(containerId, count = 100) {
        this.container = document.getElementById(containerId);
        this.count = count;
        this.sakuras = [];
        this.isRunning = false;
        
        if (!this.container) {
            console.error('樱花容器未找到');
            return;
        }
        
        this.init();
    }
    
    // 初始化樱花
    init() {
        // 限制最大樱花数量以保证性能
        const maxSakuras = Math.min(this.count, 150);
        
        for (let i = 0; i < maxSakuras; i++) {
            this.createSakura();
        }
        
        this.isRunning = true;
    }
    
    // 创建单个樱花
    createSakura() {
        const sakura = document.createElement('div');
        sakura.className = 'sakura';
        
        // 随机位置、大小、颜色和动画参数
        const size = Math.random() * 8 + 5; // 5-13px
        const x = Math.random() * 100; // 0-100%
        const y = Math.random() * -100; // 从顶部外开始
        const opacity = Math.random() * 0.5 + 0.5; // 0.5-1.0
        const duration = Math.random() * 10 + 10; // 10-20秒
        const delay = Math.random() * 5; // 0-5秒延迟
        const sway = Math.random() * 50 + 20; // 摇摆幅度
        const rotation = Math.random() * 360; // 初始旋转
        
        // 设置基础样式
        sakura.style.width = `${size}px`;
        sakura.style.height = `${size}px`;
        sakura.style.left = `${x}%`;
        sakura.style.top = `${y}%`;
        sakura.style.opacity = opacity;
        sakura.style.animationDuration = `${duration}s`;
        sakura.style.animationDelay = `${delay}s`;
        sakura.style.animationTimingFunction = 'linear';
        sakura.style.animationIterationCount = 'infinite';
        
        // 创建唯一动画名称
        const animationName = `fall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sakura.style.animationName = animationName;
        
        // 动态生成CSS动画
        this.generateSakuraAnimation(animationName, sway, rotation);
        
        this.container.appendChild(sakura);
        this.sakuras.push(sakura);
        
        // 当樱花动画结束时重新创建
        sakura.addEventListener('animationend', () => {
            sakura.remove();
            this.createSakura();
        });
    }
    
    // 动态生成樱花动画
    generateSakuraAnimation(name, sway, rotation) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ${name} {
                0% {
                    transform: translateY(-10vh) translateX(0) rotate(${rotation}deg);
                    opacity: 1;
                }
                25% {
                    transform: translateY(25vh) translateX(${sway}px) rotate(${rotation + 90}deg);
                }
                50% {
                    transform: translateY(50vh) translateX(0) rotate(${rotation + 180}deg);
                }
                75% {
                    transform: translateY(75vh) translateX(${-sway}px) rotate(${rotation + 270}deg);
                }
                100% {
                    transform: translateY(110vh) translateX(0) rotate(${rotation + 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 调整樱花数量
    setCount(newCount) {
        if (newCount === this.count) return;
        
        // 移除多余的樱花
        while (this.sakuras.length > newCount) {
            const sakuraData = this.sakuras.pop();
            sakuraData.element.remove();
        }
        
        // 添加新的樱花
        while (this.sakuras.length < newCount) {
            this.createSakura();
        }
        
        this.count = newCount;
    }
    
    // 暂停动画
    pause() {
        this.isRunning = false;
        this.sakuras.forEach(sakura => {
            sakura.element.style.animationPlayState = 'paused';
        });
    }
    
    // 恢复动画
    resume() {
        this.isRunning = true;
        this.sakuras.forEach(sakura => {
            sakura.element.style.animationPlayState = 'running';
        });
        this.animate();
    }
    
    // 销毁动画
    destroy() {
        this.isRunning = false;
        this.sakuras.forEach(sakura => {
            sakura.element.remove();
        });
        this.sakuras = [];
    }
}

// 页面加载完成后初始化樱花动画
document.addEventListener('DOMContentLoaded', () => {
    // 根据屏幕尺寸调整樱花数量
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenArea = screenWidth * screenHeight;
    let sakuraCount = Math.min(Math.floor(screenArea / 10000), 150); // 每10000px²一个樱花，最多150个
    
    // 初始化樱花动画
    window.sakuraAnimation = new SakuraAnimation('sakura-container', sakuraCount);
    
    // 窗口大小改变时重新调整樱花数量
    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        const newArea = newWidth * newHeight;
        const newCount = Math.min(Math.floor(newArea / 10000), 150);
        
        if (window.sakuraAnimation) {
            window.sakuraAnimation.setCount(newCount);
        }
    });
});