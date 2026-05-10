<template>
  <div class="carousel-controls">
    <button 
      v-if="show && totalItems > 1" 
      class="carousel-nav carousel-prev"
      :class="{ disabled: !canGoPrev }"
      @click="$emit('prev')"
      aria-label="上一张"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
    </button>
    
    <button 
      v-if="show && totalItems > 1" 
      class="carousel-nav carousel-next"
      :class="{ disabled: !canGoNext }"
      @click="$emit('next')"
      aria-label="下一张"
    >
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'CarouselControls',
  
  props: {
    show: {
      type: Boolean,
      default: true
    },
    totalItems: {
      type: Number,
      default: 0
    },
    canGoPrev: {
      type: Boolean,
      default: true
    },
    canGoNext: {
      type: Boolean,
      default: true
    }
  }
};
</script>

<style scoped>
.carousel-controls {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, opacity 0.2s;
  z-index: 10;
  opacity: 0.7;
  pointer-events: auto;
}

.carousel-nav:hover {
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 1;
}

.carousel-nav.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.carousel-nav.disabled:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.carousel-prev {
  left: 16px;
}

.carousel-next {
  right: 16px;
}

.nav-icon {
  width: 24px;
  height: 24px;
  color: white;
  stroke-width: 2;
}
</style>
