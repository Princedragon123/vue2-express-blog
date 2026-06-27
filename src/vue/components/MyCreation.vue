<template>
  <div class="my-creation-page">
    <main class="my-creation-page__main">
      <header class="my-creation-page__header">
        <h1 class="my-creation-page__title">我的创作</h1>
        <p class="my-creation-page__subtitle">查看和管理你发布的所有攻略文章</p>
      </header>

      <div class="my-creation-page__container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 文章列表 -->
        <div v-else-if="creations.length > 0" class="creation-grid">
          <article
            class="creation-card"
            v-for="creation in paginatedCreations"
            :key="creation.id"
          >
            <div class="creation-card__image" v-if="creation.image">
              <img :src="creation.image" alt="封面" class="creation-card__img">
            </div>
            <div class="creation-card__body">
              <span class="creation-card__category">{{ creation.category }}</span>
              <h3 class="creation-card__title" @click="viewCreation(creation.id)">{{ creation.title }}</h3>
              <div class="creation-card__meta">
                <span>{{ creation.date }}</span>
                <span>👁 {{ creation.views }}</span>
                <span>❤️ {{ creation.likes }}</span>
                <span>💬 {{ creation.comments }}</span>
              </div>
              <div class="creation-card__actions">
                <button class="action-btn action-btn--edit" @click="editCreation(creation.id)">✏️ 编辑</button>
                <button class="action-btn action-btn--delete" @click="deleteCreation(creation.id)">🗑️ 删除</button>
              </div>
            </div>
          </article>

          <!-- 分页 -->
          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">← 上一页</button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页（共 {{ totalCreations }} 条）</span>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页 →</button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <span class="empty-state__icon">📝</span>
          <h3>暂无创作</h3>
          <p>快去发布你的第一篇攻略吧！</p>
          <button class="btn btn--primary" @click="$router.push('/create')">🚀 发布攻略</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';
import { formatDate } from '../utils/helpers';

export default {
  name: 'MyCreation',

  data() {
    return {
      creations: [],
      loading: true,
      currentPage: 1,
      pageSize: 6,
      totalCreations: 0
    };
  },

  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.totalCreations / this.pageSize));
    },
    paginatedCreations() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.creations.slice(start, start + this.pageSize);
    }
  },

  created() {
    this.loadMyCreations();
  },

  methods: {
    async loadMyCreations() {
      this.loading = true;
      try {
        const token = this.$store.getters.getToken;
        if (!token) { this.creations = []; this.totalCreations = 0; return; }

        const data = await this.$http.blogs.getList({ page: 1, limit: 1000 });
        if (data.success && data.data) {
          // 去重 + 格式转换
          const seen = new Set();
          this.creations = data.data
            .filter(blog => {
              if (seen.has(blog._id)) return false;
              seen.add(blog._id);
              return true;
            })
            .map(blog => ({
              id: blog._id,
              title: blog.title,
              image: blog.image || '',
              category: blog.category || '未分类',
              date: formatDate(blog.createdAt),
              views: blog.views || 0,
              likes: blog.likes || 0,
              comments: blog.comments || 0
            }));
          this.totalCreations = this.creations.length;
        }
      } catch (error) {
        console.error('加载创作列表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    viewCreation(id) { this.$router.push(`/zhihu-detail/${id}`); },
    editCreation(id) { this.$router.push(`/edit/${id}`); },

    async deleteCreation(id) {
      if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return;
      try {
        const response = await this.$http.blogs.delete(id);
        if (response.success) {
          this.creations = this.creations.filter(c => c.id !== id);
          this.totalCreations = this.creations.length;
          if (this.paginatedCreations.length === 0 && this.currentPage > 1) this.currentPage--;
          showNotification('删除成功', 'success');
        }
      } catch {
        showNotification('删除失败，请重试', 'error');
      }
    },

    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};
</script>

<style scoped>
.my-creation-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.my-creation-page__main {
  padding-bottom: 70px;
}

.my-creation-page__container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.my-creation-page__header {
  text-align: center;
  padding: 40px 0 30px;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  margin: 20px 20px 24px;
}

.my-creation-page__title { font-size: 1.8rem; font-weight: 700; color: #333; margin: 0 0 8px; }
.my-creation-page__subtitle { font-size: 0.95rem; color: #999; margin: 0; }

/* 卡片网格 */
.creation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.creation-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}
.creation-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); }

.creation-card__image {
  width: 100%;
  height: 180px;
  overflow: hidden;
}
.creation-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.creation-card:hover .creation-card__img { transform: scale(1.05); }

.creation-card__body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.creation-card__category {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #fef3c7, #fcd34d);
  color: #92400e;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  align-self: flex-start;
}

.creation-card__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  line-height: 1.4;
}
.creation-card__title:hover { color: #ec4899; }

.creation-card__meta {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #9ca3af;
  flex-wrap: wrap;
}

.creation-card__actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: none;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}
.action-btn--edit { background: #dbeafe; color: #1e40af; }
.action-btn--edit:hover { background: #bfdbfe; }
.action-btn--delete { background: #fee2e2; color: #991b1b; }
.action-btn--delete:hover { background: #fecaca; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.empty-state__icon { font-size: 3rem; display: block; margin-bottom: 16px; opacity: 0.6; }
.empty-state h3 { margin: 0 0 8px; font-size: 1.2rem; color: #333; }
.empty-state p { color: #999; margin: 0 0 20px; }

/* 加载状态 */
.loading-state { text-align: center; padding: 60px 20px; color: #999; }
.spinner {
  width: 40px; height: 40px;
  border: 3px solid #f3f3f3;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px 0 40px;
}
.page-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { color: #666; font-size: 0.9rem; }

@media (max-width: 768px) {
  .creation-grid { grid-template-columns: 1fr; gap: 12px; }
  .my-creation-page__header { margin: 12px; padding: 24px 0 20px; border-radius: 12px; }
  .my-creation-page__title { font-size: 1.4rem; }
  .my-creation-page__container { padding: 0 12px; }
  .creation-card { flex-direction: column; }
  .creation-card__image { height: 160px; }
}
</style>
