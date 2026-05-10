<template>
  <div class="form-section">
    <h2 class="section-title">个人信息</h2>
    <div class="form-group">
      <label for="username" class="form-label">用户名</label>
      <input 
        type="text" 
        id="username" 
        :value="username" 
        @input="$emit('update:username', $event.target.value)"
        class="form-input"
        placeholder="请输入用户名"
      >
    </div>
    <div class="form-group">
      <label for="bio" class="form-label">个人简介</label>
      <textarea 
        id="bio" 
        :value="bio" 
        @input="$emit('update:bio', $event.target.value)"
        class="form-textarea"
        placeholder="介绍一下自己吧..."
        rows="4"
      ></textarea>
    </div>
    <div class="form-group">
      <label for="location" class="form-label">所在地</label>
      <input 
        type="text" 
        id="location" 
        :value="location" 
        @input="$emit('update:location', $event.target.value)"
        class="form-input"
        placeholder="请输入所在地"
      >
    </div>
    <div class="form-group">
      <label for="website" class="form-label">个人网站</label>
      <input 
        type="url" 
        id="website" 
        :value="website" 
        @input="$emit('update:website', $event.target.value)"
        class="form-input"
        placeholder="请输入个人网站地址"
      >
    </div>
    <div class="form-group">
      <label for="occupation" class="form-label">职业</label>
      <input 
        type="text" 
        id="occupation" 
        :value="occupation" 
        @input="$emit('update:occupation', $event.target.value)"
        class="form-input"
        placeholder="请输入职业"
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileForm',
  props: {
    username: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    occupation: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 30px;
}

.section-title {
  margin: 0 0 20px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #ff6b9d;
  box-shadow: 0 0 0 3px rgba(255, 107, 157, 0.1);
}
</style>
