<template>
  <div class="pagination">
    <button class="page-btn" :disabled="currentPage === 1" @click="$emit('prev')">
      <i class="fas fa-chevron-left"></i> 上一页
    </button>
    <span class="page-info">第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
    <button class="page-btn" :disabled="currentPage === totalPages" @click="$emit('next')">
      下一页 <i class="fas fa-chevron-right"></i>
    </button>
  </div>
</template>

<script>
export default {
  name: 'BlogPagination',
  
  props: {
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    }
  }
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px 0;
}

.page-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 1px solid var(--primary-pink);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}
</style>
