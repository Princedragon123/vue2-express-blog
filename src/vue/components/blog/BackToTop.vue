<template>
  <transition name="fade">
    <button
      v-show="visible"
      class="blog-page__back-to-top back-to-top"
      @click="$emit('click')"
      aria-label="回到顶部"
    >
      <i class="fa fa-chevron-up" aria-hidden="true"></i>
    </button>
  </transition>
</template>

<script>
export default {
  name: 'BackToTop',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #ec4899;
  color: #ffffff;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
  z-index: 100;
}

.back-to-top:hover {
  background: #db2777;
  transform: translateY(-5px);
  box-shadow: 0 15px 20px rgba(0, 0, 0, 0.15);
}

.back-to-top:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .back-to-top {
    display: none;
  }
}
</style>
