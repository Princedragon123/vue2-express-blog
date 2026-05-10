<template>
  <header class="messages-header" role="banner">
    <h1 class="messages-header__title">私信与通知</h1>
  </header>
</template>

<script>
export default {
  name: 'MessagesHeader'
}
</script>

<style scoped>
.messages-header {
  text-align: center;
  margin-bottom: 20px;
}

.messages-header__title {
  font-size: 2rem;
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}
</style>
