<template>
  <div class="profile-card">
    <h3>其他设置</h3>
    <div class="other-settings">
      <div class="setting-item">
        <div class="setting-info">
          <h4>简洁模式</h4>
          <p>启用后不显示侧边栏，文章卡片和平板端一样</p>
        </div>
        <div class="setting-toggle">
          <input type="checkbox" id="simple-mode" :checked="isSimpleMode" @change="$emit('toggle-simple-mode')">
          <label for="simple-mode"></label>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <h4>界面风格</h4>
          <p>选择您喜欢的界面风格</p>
        </div>
        <div class="style-selector">
          <button
            v-for="style in styles"
            :key="style.class"
            @click="$emit('change-style', style)"
            :class="{ active: currentStyle === style.class }"
            :title="style.name"
            class="style-btn"
          >
            <i :class="style.icon"></i>
            {{ style.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OtherSettings',
  props: {
    isSimpleMode: {
      type: Boolean,
      default: false
    },
    styles: {
      type: Array,
      default: () => []
    },
    currentStyle: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.setting-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.setting-toggle {
  position: relative;
  width: 50px;
  height: 26px;
}

.setting-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.setting-toggle label {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ddd;
  border-radius: 26px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-toggle label::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.setting-toggle input:checked + label {
  background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2));
}

.setting-toggle input:checked + label::before {
  transform: translateX(24px);
}

.style-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.style-btn {
  padding: 6px 14px;
  border-radius: 15px;
  border: 2px solid #e5e7eb;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.style-btn:hover {
  border-color: var(--primary-color, #667eea);
  color: var(--primary-color, #667eea);
}

.style-btn.active {
  background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2));
  color: white;
  border-color: transparent;
}
</style>
