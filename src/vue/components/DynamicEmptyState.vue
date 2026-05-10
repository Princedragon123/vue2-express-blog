<template>
  <div class="empty-state">
    <i class="fas fa-activity"></i>
    <h3>暂无动态</h3>
    <p>你还没有相关的活动记录</p>
    <button class="btn-primary" @click="$emit('go-explore')">
      去逛逛
    </button>
  </div>
</template>

<script>
export default {
  name: 'DynamicEmptyState'
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 10px;
}

.empty-state p {
  font-size: 1rem;
  color: #999;
  margin: 0 0 24px;
}

.btn-primary {
  padding: 12px 30px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff527d 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}
</style>
