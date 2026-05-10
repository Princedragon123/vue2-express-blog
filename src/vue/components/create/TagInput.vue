<template>
  <div class="form-section">
    <label :for="inputId" class="form-label">{{ label }}</label>
    <p v-if="hint" class="form-hint">{{ hint }}</p>
    <input
      type="text"
      :id="inputId"
      class="form-input"
      :placeholder="placeholder"
      :value="value"
      @input="$emit('input', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  name: 'TagInput',
  props: {
    value: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: '标签'
    },
    hint: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '例如：#游戏 #攻略 #技巧'
    },
    inputId: {
      type: String,
      default: 'tags'
    }
  },
  methods: {
    parseTags(tagString) {
      if (!tagString) return [];
      let processed = tagString
        .replace(/,/g, ' ')
        .replace(/，/g, ' ')
        .replace(/、/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      let tags = processed.split(' ').filter(tag => tag.trim());
      tags = tags.map(tag => {
        tag = tag.trim();
        if (tag.startsWith('#')) {
          return tag.slice(1);
        }
        return tag;
      }).filter(tag => tag);
      return tags;
    },
    formatTags(tags) {
      if (!tags || !Array.isArray(tags)) return '';
      return tags.map(tag => `#${tag}`).join(' ');
    }
  }
};
</script>

<style scoped>
.form-section {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
  background-color: white;
  font-family: var(--font-family);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}
</style>
