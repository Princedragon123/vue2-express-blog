<template>
  <div class="users-filters">
    <div class="search-container">
      <input
        type="text"
        class="search-input"
        placeholder="搜索用户名或邮箱..."
        :value="query"
        @input="$emit('update:query', $event.target.value)"
      />
      <svg-icon name="search" :size="18" class-name="search-icon"></svg-icon>
    </div>
    <div class="filter-container">
      <select
        :value="statusFilter"
        @change="$emit('update:statusFilter', $event.target.value)"
        class="filter-select"
      >
        <option value="all">所有状态</option>
        <option value="active">活跃用户</option>
        <option value="banned">封禁用户</option>
      </select>
      <select
        :value="roleFilter"
        @change="$emit('update:roleFilter', $event.target.value)"
        class="filter-select"
      >
        <option value="all">所有角色</option>
        <option value="user">普通用户</option>
        <option value="svip">svip用户</option>
        <option value="admin">管理员</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: "UserSearch",

  props: {
    query: {
      type: String,
      default: "",
    },
    statusFilter: {
      type: String,
      default: "all",
    },
    roleFilter: {
      type: String,
      default: "all",
    },
  },
};
</script>

<style scoped>
.users-filters {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: var(--background-light);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-pink);
}

.filter-container {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid var(--primary-pink);
  border-radius: 4px;
  font-size: 14px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
}
</style>
