<template>
  <div class="contacts-sidebar">
    <div class="contacts-header">
      <h3>联系人</h3>
      <div class="search-box">
        <input type="text" :value="searchQuery" @input="$emit('update:searchQuery', $event.target.value)" placeholder="搜索联系人..." class="search-input">
      </div>
    </div>

    <div class="contacts-list">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="contacts.length === 0" class="empty-state">
        <span class="nav-icon">✉️</span>
        <p>暂无联系人</p>
        <p>关注用户后可以开始私信</p>
      </div>

      <div
        v-for="contact in filteredContacts"
        :key="contact._id"
        class="contact-item"
        :class="{ active: selectedContact && selectedContact._id === contact._id }"
        @click="$emit('select', contact)"
      >
        <img :src="getContactAvatar(contact)" :alt="contact.username" class="contact-avatar" @error="handleAvatarError($event, contact.username, 40)">
        <div class="contact-info">
          <div class="contact-name">{{ contact.username }}</div>
          <div class="last-message">{{ getLastMessage(contact._id) }}</div>
        </div>
        <div class="contact-actions">
          <div v-if="getUnreadCount(contact._id) > 0" class="unread-badge">{{ getUnreadCount(contact._id) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import avatarMixin from '../../mixins/avatarMixin';

export default {
  name: 'ContactList',
  mixins: [avatarMixin],
  props: {
    contacts: {
      type: Array,
      default: () => []
    },
    filteredContacts: {
      type: Array,
      default: () => []
    },
    selectedContact: {
      type: Object,
      default: null
    },
    searchQuery: {
      type: String,
      default: ''
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    lastMessages: {
      type: Object,
      default: () => ({})
    },
    unreadCounts: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    getContactAvatar(contact) {
      return this.getAvatar(contact, 40);
    },
    getLastMessage(userId) {
      return this.lastMessages[userId] || '无消息';
    },
    getUnreadCount(userId) {
      return this.unreadCounts[userId] || 0;
    }
  }
};
</script>

<style scoped>
.contacts-sidebar {
  width: 300px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff 0%, var(--background-light) 100%);
  flex-shrink: 0;
}

.contacts-header {
  padding: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.contacts-header h3 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--background-dark);
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  background: #fff;
}

.search-input:focus {
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.contacts-list::-webkit-scrollbar {
  display: none;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 5px;
}

.contact-item:hover {
  background-color: var(--background-light);
  transform: translateX(3px);
}

.contact-item.active {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 2px solid var(--background-dark);
  flex-shrink: 0;
}

.contact-item.active .contact-avatar {
  border-color: white;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.contact-item.active .contact-name {
  color: white;
}

.last-message {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-item.active .last-message {
  color: rgba(255, 255, 255, 0.8);
}

.contact-actions {
  display: flex;
  align-items: center;
}

.unread-badge {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(255, 107, 157, 0.3);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary-pink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .contacts-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    max-height: 40vh;
  }
}
</style>
