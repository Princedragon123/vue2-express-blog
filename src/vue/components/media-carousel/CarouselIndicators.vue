<template>
  <div v-if="show && totalItems > 1" class="carousel-indicators">
    <button
      v-for="(_, index) in totalItems"
      :key="index"
      class="carousel-indicator"
      :class="{ active: currentIndex === index }"
      @click="$emit('go-to', index)"
      :aria-label="`跳转到第 ${index + 1} 张`"
    />
  </div>
</template>

<script>
export default {
  name: 'CarouselIndicators',
  
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
.carousel-indicators {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 10;
  padding: 8px;
}

.carousel-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.carousel-indicator.active {
  background-color: white;
  width: 20px;
  border-radius: 10px;
}
</style>
