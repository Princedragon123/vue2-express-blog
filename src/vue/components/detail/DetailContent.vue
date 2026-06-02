<template>
  <div>
    <div class="detail-image">
      <img :src="image" :alt="title" class="cover-img">
    </div>

    <div class="detail-content">
      <div v-html="content"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailContent',
  props: {
    image: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.detail-image {
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 25px;
}

.cover-img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
}

.detail-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  line-height: 1.8;
  font-size: 16px;
  color: #333;
}

@media (max-width: 768px) {
  .detail-content {
    padding: 20px;
  }
}
</style>
