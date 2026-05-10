<template>
  <div v-if="show && totalItems > 1" class="carousel-counter">
    <span class="current-index">{{ currentIndex + 1 }}</span>
    <span class="separator">/</span>
    <span class="total-count">{{ totalItems }}</span>
  </div>
</template>

<script>
export default {
  name: 'CarouselCounter',
  
  props: {
    show: {
      type: Boolean,
      default: true
    },
    totalItems: {
      type: Number,
      default: 0
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  }
};
</script>

<style scoped>
.carousel-counter {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
}

.current-index {
  font-weight: 600;
}

.separator {
  margin: 0 4px;
  opacity: 0.8;
}
</style>
