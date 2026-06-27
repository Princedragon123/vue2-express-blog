<template>
  <article class="topic-list-page" aria-label="话题列表">
    <main class="topic-list-page__main" role="main">
      <header class="topic-list-page__header">
        <h1 class="topic-list-page__title">话题圈</h1>
        <p class="topic-list-page__subtitle">发现感兴趣的话题，参与讨论</p>
      </header>

      <div class="topic-list-page__container">
        <!-- 搜索 + 创建 -->
        <section class="topic-list-page__toolbar">
          <input
            type="text"
            class="search-input"
            placeholder="搜索话题..."
            v-model="searchQuery"
            @input="onSearch"
          >
          <button class="create-btn" @click="showCreateModal = true">➕ 创建话题</button>
        </section>

        <!-- 分类 -->
        <nav class="topic-categories" aria-label="话题分类">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="category-btn"
            :class="{ 'category-btn--active': activeCategory === cat.key }"
            @click="setCategory(cat.key)"
          >{{ cat.label }}</button>
        </nav>

        <!-- 话题列表 -->
        <section class="topic-list" aria-label="话题列表">
          <article
            class="topic-item"
            v-for="topic in topics"
            :key="topic._id"
            @click="goToTopicDetail(topic._id)"
          >
            <div class="topic-item__info">
              <h3 class="topic-item__name">{{ topic.name }}</h3>
              <p class="topic-item__desc">{{ topic.description }}</p>
              <div class="topic-item__stats">
                <span>👥 {{ topic.followersCount }} 关注</span>
                <span>📄 {{ topic.articlesCount }} 文章</span>
              </div>
            </div>
            <div class="topic-item__actions">
              <button
                class="follow-btn"
                :class="{ 'follow-btn--active': isFollowing(topic._id) }"
                @click.stop="toggleFollow(topic)"
              >{{ isFollowing(topic._id) ? '已关注' : '+ 关注' }}</button>
            </div>
          </article>
        </section>

        <section v-if="hasMore" class="load-more">
          <button class="btn btn--primary" @click="loadMore">加载更多</button>
        </section>

        <div v-if="topics.length === 0 && !searchQuery" class="empty-state">
          <span class="empty-state__icon">💬</span>
          <p>暂无话题，快来创建第一个吧！</p>
        </div>
      </div>

      <!-- 创建话题弹窗 -->
      <div class="modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
        <div class="modal">
          <header class="modal__header">
            <h2>创建新话题</h2>
            <button class="modal__close" @click="showCreateModal = false">✕</button>
          </header>
          <form class="modal__body" @submit.prevent="createTopic">
            <div class="form-group">
              <label for="topic-name">话题名称</label>
              <input id="topic-name" v-model="newTopic.name" placeholder="请输入话题名称" required>
            </div>
            <div class="form-group">
              <label for="topic-desc">话题描述</label>
              <textarea id="topic-desc" v-model="newTopic.description" placeholder="请输入话题描述" rows="4" required></textarea>
            </div>
            <footer class="modal__footer">
              <button type="button" class="btn btn--secondary" @click="showCreateModal = false">取消</button>
              <button type="submit" class="btn btn--primary" :disabled="isCreating">{{ isCreating ? '创建中...' : '创建话题' }}</button>
            </footer>
          </form>
        </div>
      </div>
    </main>
  </article>
</template>

<script>
import { showNotification } from '../utils/notification';
import { debounce } from '../utils/helpers';

export default {
  name: 'TopicList',

  data() {
    return {
      topics: [],
      searchQuery: '',
      activeCategory: 'all',
      page: 1,
      limit: 10,
      hasMore: true,
      followingTopics: new Set(),
      showCreateModal: false,
      newTopic: { name: '', description: '' },
      isCreating: false,
      categories: [
        { key: 'all', label: '全部话题' },
        { key: 'hot', label: '热门话题' },
        { key: 'new', label: '最新话题' }
      ]
    };
  },

  mounted() {
    this.fetchTopics();
    this.fetchFollowingTopics();
  },

  methods: {
    async fetchTopics() {
      try {
        let url = `/api/topics?page=${this.page}&limit=${this.limit}`;
        if (this.activeCategory === 'hot') url += '&sort=followersCount';
        else if (this.activeCategory === 'new') url += '&sort=createdAt';

        const data = await this.$http.get(url);
        if (data.success) {
          this.topics = this.page === 1 ? data.data : [...this.topics, ...data.data];
          this.hasMore = data.data.length === this.limit;
        }
      } catch (error) {
        console.error('获取话题列表失败:', error);
      }
    },

    onSearch: debounce(function () {
      if (this.searchQuery.trim()) {
        this.$http.get(`/api/topics/search?query=${encodeURIComponent(this.searchQuery)}`)
          .then(data => { if (data.success) { this.topics = data.data; this.hasMore = false; } })
          .catch(() => {});
      } else {
        this.page = 1;
        this.hasMore = true;
        this.fetchTopics();
      }
    }, 300),

    setCategory(category) {
      this.activeCategory = category;
      this.page = 1;
      this.hasMore = true;
      this.fetchTopics();
    },

    loadMore() { this.page += 1; this.fetchTopics(); },
    goToTopicDetail(id) { this.$router.push(`/topic/${id}`); },

    async fetchFollowingTopics() {
      try {
        const data = await this.$http.get('/api/topics/user/following');
        if (data.success) {
          this.followingTopics = new Set(data.data.map(t => t._id || t));
        }
      } catch { /* 静默 */ }
    },

    isFollowing(topicId) {
      return this.followingTopics.has(topicId);
    },

    async toggleFollow(topic) {
      const token = this.$store.getters.getToken;
      if (!token) { this.$router.replace('/login'); return; }
      try {
        const isFollowing = this.isFollowing(topic._id);
        const method = isFollowing ? 'delete' : 'post';
        const data = await this.$http[method](`/api/topics/${topic._id}/follow`);
        if (data.success) {
          if (isFollowing) { this.followingTopics.delete(topic._id); }
          else { this.followingTopics.add(topic._id); }
          topic.followersCount += isFollowing ? -1 : 1;
        }
      } catch (error) {
        console.error('关注话题失败:', error);
      }
    },

    async createTopic() {
      if (!this.newTopic.name.trim()) return;
      this.isCreating = true;
      try {
        const data = await this.$http.post('/api/topics', this.newTopic);
        if (data.success) {
          this.showCreateModal = false;
          this.newTopic = { name: '', description: '' };
          this.page = 1;
          this.fetchTopics();
          showNotification('话题创建成功！', 'success');
        } else {
          showNotification('创建失败: ' + (data.message || '未知错误'), 'error');
        }
      } catch {
        showNotification('创建话题失败，请稍后重试', 'error');
      } finally {
        this.isCreating = false;
      }
    }
  }
};
</script>

<style scoped>
.topic-list-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.topic-list-page__main { padding-bottom: 60px; }

.topic-list-page__container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.topic-list-page__header {
  text-align: center;
  padding: 36px 0 28px;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  margin: 20px;
}

.topic-list-page__title { font-size: 1.8rem; font-weight: 700; color: #1f2937; margin: 0 0 8px; }
.topic-list-page__subtitle { font-size: 0.95rem; color: #9ca3af; margin: 0; }

/* 搜索栏 */
.topic-list-page__toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #fbcfe8;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.25s ease;
}
.search-input:focus { border-color: #ec4899; box-shadow: 0 0 0 3px rgba(236,72,153,0.08); }

.create-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s ease;
}
.create-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

/* 分类 */
.topic-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.category-btn {
  padding: 8px 18px;
  border: 1.5px solid #fbcfe8;
  border-radius: 20px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.category-btn:hover { border-color: #ec4899; color: #ec4899; }
.category-btn--active { background: #ec4899; border-color: #ec4899; color: #fff; }

/* 话题列表 */
.topic-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }

.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.25s ease;
  cursor: pointer;
}
.topic-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

.topic-item__info { flex: 1; margin-right: 16px; min-width: 0; }
.topic-item__name { margin: 0 0 6px; font-size: 1.1rem; font-weight: 600; color: #1f2937; }
.topic-item__desc {
  margin: 0 0 10px; font-size: 0.85rem; color: #9ca3af;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.topic-item__stats { display: flex; gap: 16px; font-size: 0.8rem; color: #9ca3af; }

/* 关注按钮 */
.follow-btn {
  padding: 8px 20px;
  border: 1.5px solid #ec4899;
  border-radius: 20px;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  color: #ec4899;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.follow-btn:hover,
.follow-btn--active { background: #ec4899; color: #fff; }

/* 弹窗 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: #fff; border-radius: 16px; width: 100%; max-width: 460px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #f3f4f6;
}
.modal__header h2 { margin: 0; font-size: 1.15rem; font-weight: 600; }
.modal__close {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: #f3f4f6; cursor: pointer; display: flex;
  align-items: center; justify-content: center; font-size: 0.9rem;
}
.modal__body { padding: 20px 24px; }
.modal__footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #374151; font-size: 0.9rem; }
.form-group input,
.form-group textarea {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: 0.95rem; transition: all 0.2s ease;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none; border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236,72,153,0.08);
}
.form-group textarea { resize: vertical; min-height: 80px; }

/* 通用 */
.load-more { text-align: center; margin-bottom: 30px; }
.empty-state { text-align: center; padding: 60px 20px; color: #9ca3af; }
.empty-state__icon { font-size: 3rem; display: block; margin-bottom: 12px; opacity: 0.5; }

@media (max-width: 768px) {
  .topic-list-page__header { margin: 12px; padding: 24px 0 20px; border-radius: 12px; }
  .topic-list-page__title { font-size: 1.4rem; }
  .topic-list-page__container { padding: 0 12px; }
  .topic-item { flex-direction: column; }
  .topic-item__actions { margin-top: 12px; }
  .topic-list-page__toolbar { flex-direction: column; }
  .create-btn { text-align: center; }
}
</style>
