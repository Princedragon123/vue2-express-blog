<template>
  <div class="my">
    <div class="my__container">
      <header class="my__header"><h1 class="my__title">我的创作</h1><p class="my__subtitle">管理你发布的所有文章</p></header>
      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else-if="creations.length" class="my__grid">
        <article v-for="c in paginatedCreations" :key="c.id" class="my__card">
          <div class="my__card-img" v-if="c.image"><img :src="c.image" alt="" /></div>
          <div class="my__card-body">
            <span class="my__card-cat">{{ c.category }}</span>
            <h3 class="my__card-title" @click="$router.push(`/zhihu-detail/${c.id}`)">{{ c.title }}</h3>
            <div class="my__card-meta"><span>{{ c.date }}</span><span>{{ c.views }} 浏览</span><span>{{ c.likes }} 赞</span><span>{{ c.comments }} 评论</span></div>
            <div class="my__card-actions">
              <button class="btn btn-secondary" @click="$router.push(`/edit/${c.id}`)">编辑</button>
              <button class="btn btn-ghost" @click="deleteCreation(c.id)">删除</button>
            </div>
          </div>
        </article>
        <div class="my__pagination">
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
          <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button class="btn btn-secondary" :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)">下一页</button>
        </div>
      </div>
      <div v-else class="empty-state"><span class="empty-state__icon">§</span><h3>暂无创作</h3><p>快去发布第一篇攻略吧</p><router-link to="/create" class="btn btn-primary">写文章</router-link></div>
    </div>
  </div>
</template>

<script>
import { showNotification } from '../utils/notification';
import { formatDate } from '../utils/helpers';

export default {
  name: 'MyCreation',
  data() { return { creations: [], loading: true, currentPage: 1, pageSize: 6, totalCreations: 0 }; },
  computed: { totalPages() { return Math.max(1, Math.ceil(this.totalCreations / this.pageSize)); }, paginatedCreations() { const s = (this.currentPage - 1) * this.pageSize; return this.creations.slice(s, s + this.pageSize); } },
  created() { this.loadMyCreations(); },
  methods: {
    async loadMyCreations() { this.loading = true; try { const token = this.$store.getters.getToken; if (!token) { this.creations = []; return; } const d = await this.$http.blogs.getList({ page: 1, limit: 1000 }); if (d.success && d.data) { const seen = new Set(); this.creations = d.data.filter(b => { if (seen.has(b._id)) return false; seen.add(b._id); return true; }).map(b => ({ id: b._id, title: b.title, image: b.image || '', category: b.category || '未分类', date: formatDate(b.createdAt), views: b.views || 0, likes: b.likes || 0, comments: b.comments || 0 })); this.totalCreations = this.creations.length; } } catch {} finally { this.loading = false; } },
    async deleteCreation(id) { if (!confirm('确定删除？不可恢复。')) return; try { await this.$http.blogs.delete(id); this.creations = this.creations.filter(c => c.id !== id); this.totalCreations--; showNotification('已删除', 'success'); } catch { showNotification('删除失败', 'error'); } },
    changePage(p) { if (p < 1 || p > this.totalPages) return; this.currentPage = p; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }
};
</script>

<style scoped>
.my { min-height: 100vh; background: #faf8f5; }
.my__container { max-width: 1000px; margin: 0 auto; padding: 24px 20px 80px; }
.my__header { margin-bottom: 28px; }
.my__title { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.my__subtitle { font-size: 0.9rem; color: #9ca3af; }
.my__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.my__card { background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s; }
.my__card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.my__card-img { height: 160px; overflow: hidden; }
.my__card-img img { width: 100%; height: 100%; object-fit: cover; }
.my__card:hover .my__card-img img { transform: scale(1.03); transition: transform 0.3s; }
.my__card-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.my__card-cat { display: inline-block; padding: 3px 10px; background: #fff1f2; color: #e11d48; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; align-self: flex-start; }
.my__card-title { font-size: 1rem; font-weight: 600; color: #1a1a1a; cursor: pointer; margin: 0; line-height: 1.4; }
.my__card-title:hover { color: #e11d48; }
.my__card-meta { display: flex; gap: 10px; font-size: 0.75rem; color: #9ca3af; flex-wrap: wrap; }
.my__card-actions { display: flex; gap: 8px; margin-top: 4px; }
.my__pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 24px 0; grid-column: 1 / -1; font-size: 0.85rem; color: #6b7280; }
@media (max-width: 768px) { .my__grid { grid-template-columns: 1fr; } .my__container { padding: 16px 12px 80px; } }
</style>
