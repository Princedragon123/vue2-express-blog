<template>
  <div class="blogs-filters">
    <div class="search-container">
      <input 
        type="text" 
        class="search-input" 
        placeholder="搜索文章标题或内容..."
        :value="query"
        @input="$emit('update:query', $event.target.value)"
      >
      <svg-icon name="search" :size="18" class-name="search-icon"></svg-icon>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogSearch',
  
  props: {
    query: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.blogs-filters {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 35px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 320px;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 20px;
  border: 2px solid var(--primary-pink);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: var(--background-light);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.search-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-pink);
  font-size: 16px;
}
</style>
