<template>
  <div class="batch-operations" v-if="totalItems > 0">
    <div class="batch-select">
      <input type="checkbox" id="selectAll" :checked="isAllSelected" @change="$emit('toggle-select-all')">
      <label for="selectAll">全选</label>
    </div>
    <div class="batch-actions">
      <button class="batch-btn danger" @click="$emit('batch-delete')" :disabled="selectedCount === 0">
        <i class="fas fa-trash"></i> 批量删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchOperations',
  
  props: {
    totalItems: {
      type: Number,
      default: 0
    },
    selectedCount: {
      type: Number,
      default: 0
    },
    isAllSelected: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.batch-operations {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

.batch-select {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-primary);
}

.batch-select input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary-pink);
}

.batch-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-btn {
  padding: 10px 20px;
  border: 1px solid var(--primary-pink);
  border-radius: 6px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.batch-btn:hover:not(:disabled) {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(236, 72, 153, 0.2);
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.batch-btn.danger:hover:not(:disabled) {
  border-color: #dc3545;
  color: #dc3545;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
}
</style>
