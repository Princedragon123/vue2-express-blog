<template>
  <div class="card login-card shadow-lg">
    <div class="card-decoration top-left">
      <svg-icon name="star" :size="20"></svg-icon>
    </div>
    <div class="card-decoration top-right">
      <svg-icon name="heart" :size="20"></svg-icon>
    </div>
    <div class="card-decoration bottom-left">
      <svg-icon name="moon" :size="20"></svg-icon>
    </div>
    <div class="card-decoration bottom-right">
      <svg-icon name="sun" :size="20"></svg-icon>
    </div>
    <div class="card-body p-5">
      <div class="text-center mb-5">
        <h2 class="mb-1">
          <span class="logo-text">
            <svg-icon name="magic" :size="24" class-name="text-primary"></svg-icon> kk博客
          </span>
        </h2>
        <p class="text-muted">{{ subtitle }}</p>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthCard',
  props: {
    subtitle: {
      type: String,
      default: '欢迎回到kk博客，继续您的创作之旅'
    }
  }
}
</script>

<style scoped>
.login-card {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  position: relative;
  overflow: hidden;
  z-index: 5;
  transition: all 0.3s ease;
  transform: translateY(0);
  border-radius: 1rem;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px rgba(236, 72, 153, 0.3);
}

.card-decoration {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0.8;
}

.card-decoration.top-left {
  top: 10px;
  left: 10px;
  color: var(--primary-pink);
}

.card-decoration.top-right {
  top: 10px;
  right: 10px;
  color: var(--primary-pink);
}

.card-decoration.bottom-left {
  bottom: 10px;
  left: 10px;
  color: var(--accent-green);
}

.card-decoration.bottom-right {
  bottom: 10px;
  right: 10px;
  color: var(--accent-yellow);
}

.logo-text {
  font-weight: 700;
  font-size: 1.8rem;
  background: linear-gradient(135deg, var(--primary-pink), var(--accent-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  font-family: var(--font-family);
}

@media (max-width: 768px) {
  .login-card {
    margin: 0 1rem;
    border-radius: 0.75rem;
  }

  .card-body {
    padding: 2rem 1.5rem !important;
  }

  .logo-text {
    font-size: 1.5rem;
  }

  .card-decoration {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .login-card {
    margin: 0 0.5rem;
  }

  .card-body {
    padding: 1.5rem 1rem !important;
  }
}
</style>
