<template>
  <div class="create">
    <div class="create__container">
      <header class="create__header">
        <h1 class="create__title">{{ isEditMode ? '编辑文章' : '写文章' }}</h1>
        <p class="create__subtitle">{{ isEditMode ? '修改你的内容' : '分享你的经验和知识' }}</p>
      </header>

      <form class="create__form" @submit.prevent="submitForm">
        <!-- Type selector -->
        <div class="create__field">
          <label class="create__label">文章类型</label>
          <div class="create__type-row">
            <button type="button" :class="['create__type-btn', { 'create__type-btn--active': formData.articleType === 'long' }]" :disabled="isEditMode" @click="setArticleType('long')">
              <span class="create__type-icon">§</span>
              <span class="create__type-name">长文章</span>
            </button>
            <button type="button" :class="['create__type-btn', { 'create__type-btn--active': formData.articleType === 'short' }]" :disabled="isEditMode" @click="setArticleType('short')">
              <span class="create__type-icon">¶</span>
              <span class="create__type-name">短文章</span>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="create__field">
          <label class="create__label">标题</label>
          <input type="text" class="input" placeholder="输入文章标题" v-model="formData.title">
        </div>

        <!-- Category (new only) -->
        <div class="create__field" v-if="!isEditMode">
          <label class="create__label">分类</label>
          <select class="input" v-model="formData.category">
            <option value="">选择分类</option>
            <option value="游戏攻略">游戏攻略</option>
            <option value="旅游攻略">旅游攻略</option>
            <option value="美食攻略">美食攻略</option>
            <option value="科技攻略">科技攻略</option>
            <option value="健身攻略">健身攻略</option>
            <option value="美妆攻略">美妆攻略</option>
            <option value="学习攻略">学习攻略</option>
          </select>
        </div>

        <!-- Topic -->
        <div class="create__field" v-if="formData.topic">
          <label class="create__label">话题</label>
          <div class="create__topic-locked">
            <span class="create__topic-name">{{ formData.topicName || formData.topic }}</span>
            <span class="create__topic-hint">已锁定</span>
          </div>
        </div>

        <!-- Long article -->
        <template v-if="formData.articleType === 'long'">
          <div class="create__field">
            <label class="create__label">封面图片</label>
            <ImageUploader ref="imageUploader" :image-url="formData.imageUrl" @update:imageUrl="formData.imageUrl = $event" @notify="showNotification" />
          </div>
          <div class="create__field">
            <QuillEditorWrapper ref="quillEditor" v-model="formData.content" @notify="showNotification" @uploading="isSubmitting = $event" />
          </div>
          <div class="create__field">
            <TagInput v-model="formData.tags" label="标签" placeholder="#游戏 #攻略 #技巧" input-id="tags" />
          </div>
        </template>

        <!-- Short article -->
        <template v-else>
          <div class="create__field">
            <label class="create__label">封面图片</label>
            <ImageUploader ref="imageUploader" :image-url="formData.imageUrl" @update:imageUrl="formData.imageUrl = $event" @notify="showNotification" />
          </div>
          <div class="create__field">
            <label class="create__label">媒体文件</label>
            <MediaUploader :media-files="formData.mediaFiles" :max-count="9" @add-media="onAddMedia" @remove-media="onRemoveMedia" @notify="showNotification" />
          </div>
          <div class="create__field">
            <label class="create__label">内容</label>
            <textarea class="input create__textarea" v-model="formData.shortContent" placeholder="分享你的经验..." rows="5" maxlength="2000"></textarea>
            <div class="create__char-count">{{ formData.shortContent.length }}/2000</div>
          </div>
          <div class="create__field">
            <TagInput v-model="formData.hashtags" label="话题标签" placeholder="#游戏攻略 #旅游体验" input-id="hashtags" />
          </div>
          <div class="create__field">
            <label class="create__label">位置</label>
            <input type="text" class="input" placeholder="例如：北京故宫" v-model="formData.location">
          </div>
        </template>

        <!-- Actions -->
        <div class="create__actions">
          <button type="button" class="btn btn-secondary" @click="cancelCreate">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? '提交中...' : (isEditMode ? '更新' : '发布') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import QuillEditorWrapper from './create/QuillEditorWrapper.vue';
import ImageUploader from './create/ImageUploader.vue';
import MediaUploader from './create/MediaUploader.vue';
import TagInput from './create/TagInput.vue';
import { showNotification } from '../utils/notification';
import { normalizeImageUrl, getAuthToken } from '../utils/helpers';

function defaultForm() { return { title: '', category: '', topic: '', topicName: '', imageUrl: '', content: '', tags: '', articleType: 'long', mediaFiles: [], shortContent: '', hashtags: '', location: '' }; }

export default {
  name: 'Create',
  components: { QuillEditorWrapper, ImageUploader, MediaUploader, TagInput },
  data() { return { isSubmitting: false, isEditMode: false, currentBlogId: null, formData: defaultForm(), originalImageUrl: null }; },
  mounted() {
    if (this.$route.query.topic) { this.formData.topic = this.$route.query.topic; this.formData.topicName = this.$route.query.topicName || ''; }
    if (this.$route.params.id) { this.isEditMode = true; this.currentBlogId = this.$route.params.id; this.loadBlogDetail(this.currentBlogId); }
  },
  beforeDestroy() { if (this.$refs.imageUploader) this.$refs.imageUploader.clearFile(); },
  methods: {
    showNotification,
    onAddMedia(m) { this.formData.mediaFiles.push(m); },
    onRemoveMedia(i) { this.formData.mediaFiles.splice(i, 1); },
    parseTags(s) { if (!s) return []; return s.replace(/[,，、]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(t => t.trim().replace(/^#/, '')).filter(Boolean); },
    formatTags(t) { if (!t || !Array.isArray(t)) return ''; return t.map(tag => `#${tag}`).join(' '); },
    setArticleType(type) {
      if (this.isEditMode) { showNotification('编辑模式下不支持切换类型', 'warning'); return; }
      this.formData.articleType = type;
      if (type === 'long') { this.formData.mediaFiles = []; this.formData.shortContent = ''; this.formData.hashtags = ''; this.formData.location = ''; }
      else { this.formData.content = ''; this.formData.tags = ''; }
    },
    cancelCreate() { if (this.$refs.imageUploader) this.$refs.imageUploader.clearFile(); this.formData = defaultForm(); this.$router.push('/my-creation').catch(() => {}); },
    async loadBlogDetail(blogId) {
      try {
        const token = getAuthToken(); if (!token) { showNotification('请先登录', 'warning'); return; }
        const data = await this.$http.get(`/api/blogs/${blogId}`);
        if (!data.success) { showNotification(`加载失败: ${data.message}`, 'error'); return; }
        const blog = data.data;
        const imageUrl = normalizeImageUrl(blog.image || '');
        const mfs = (blog.mediaFiles || []).map(m => ({ url: normalizeImageUrl(m.url), mediaType: m.mediaType || 'image' }));
        this.formData = { title: blog.title || '', content: blog.content || '', topic: blog.topic?._id || '', topicName: blog.topic?.name || '', imageUrl, tags: this.formatTags(blog.tags), articleType: blog.articleType || 'long', mediaFiles: mfs, shortContent: blog.shortContent || '', hashtags: this.formatTags(blog.hashtags), location: blog.location || '' };
        if (this.formData.articleType === 'long') { this.$nextTick(() => { if (this.$refs.quillEditor) this.$refs.quillEditor.setContent(blog.content || ''); }); }
        this.originalImageUrl = imageUrl; this.currentBlogId = blogId;
      } catch (e) { showNotification('加载失败', 'error'); }
    },
    validateForm() {
      if (!this.formData.title.trim()) { showNotification('请输入标题', 'warning'); return false; }
      if (this.formData.title.trim().length < 5) { showNotification('标题至少5个字符', 'warning'); return false; }
      if (!this.formData.imageUrl) { showNotification('请设置封面图片', 'warning'); return false; }
      if (this.formData.articleType === 'long' && !this.formData.content.trim()) { showNotification('请输入内容', 'warning'); return false; }
      if (this.formData.articleType === 'short') { if (!this.formData.shortContent.trim()) { showNotification('请输入内容', 'warning'); return false; } if (this.formData.mediaFiles.length === 0) { showNotification('请上传媒体文件', 'warning'); return false; } }
      return true;
    },
    buildSubmitData(imageUrl) {
      const d = { title: this.formData.title, topic: this.formData.topic, articleType: this.formData.articleType, image: imageUrl };
      if (this.formData.category) { const tags = this.parseTags(this.formData.tags); if (!tags.includes(this.formData.category)) tags.unshift(this.formData.category); this.formData.tags = tags.join(', '); }
      if (this.formData.articleType === 'long') Object.assign(d, { content: this.formData.content, tags: this.parseTags(this.formData.tags), video: '', mediaFiles: [], shortContent: '', hashtags: [], location: '' });
      else Object.assign(d, { mediaFiles: this.formData.mediaFiles, shortContent: this.formData.shortContent, hashtags: this.parseTags(this.formData.hashtags), location: this.formData.location, content: '', video: '', tags: [] });
      return d;
    },
    async submitForm() {
      if (!this.validateForm()) return;
      this.isSubmitting = true;
      try {
        const token = getAuthToken(); if (!token) { showNotification('请先登录', 'warning'); return; }
        let uploadedUrl = null;
        const imgFile = this.$refs.imageUploader?.getFile();
        if (imgFile) { const fd = new FormData(); fd.append('image', imgFile); const r = await this.$http.post('/api/blogs/upload-image', fd); if (!r.success) throw new Error(r.message); uploadedUrl = r.data.url; }
        const imageUrl = uploadedUrl || (this.isEditMode ? (this.formData.imageUrl.startsWith('blob:') ? (this.originalImageUrl || '') : (this.formData.imageUrl || this.originalImageUrl || '')) : '');
        if (!imageUrl) { showNotification('封面图片上传失败', 'error'); return; }
        const submitData = this.buildSubmitData(imageUrl);
        const method = this.isEditMode ? 'put' : 'post';
        const url = this.isEditMode ? `/api/blogs/${this.currentBlogId}` : '/api/blogs';
        const data = await this.$http[method](url, submitData);
        if (data.success) { showNotification(this.isEditMode ? '更新成功' : '发布成功', 'success'); this.cancelCreate(); }
        else { showNotification(`${this.isEditMode ? '更新' : '发布'}失败: ${data.message}`, 'error'); }
      } catch (e) { showNotification(`发布失败: ${e.message}`, 'error'); }
      finally { this.isSubmitting = false; }
    }
  }
};
</script>

<style scoped>
.create { min-height: 100vh; background: #faf8f5; }
.create__container { width: 92%; max-width: 800px; margin: 0 auto; padding: 32px 0 80px; }
.create__header { margin-bottom: 32px; }
.create__title { font-size: 1.6rem; font-weight: 700; color: #1a1a1a; margin: 0 0 6px; }
.create__subtitle { font-size: 0.9rem; color: #9ca3af; margin: 0; }
.create__form { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.create__field { margin-bottom: 24px; }
.create__label { display: block; font-weight: 600; font-size: 0.9rem; color: #3d3d3d; margin-bottom: 8px; }
.create__type-row { display: flex; gap: 12px; }
.create__type-btn { flex: 1; padding: 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; cursor: pointer; text-align: center; transition: all 0.2s; }
.create__type-btn:hover:not(:disabled) { border-color: #e11d48; }
.create__type-btn--active { border-color: #e11d48; background: #fff1f2; }
.create__type-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.create__type-icon { font-size: 1.5rem; display: block; margin-bottom: 4px; }
.create__type-name { font-size: 0.9rem; font-weight: 500; }
.create__textarea { min-height: 160px; resize: vertical; }
.create__char-count { font-size: 0.8rem; color: #9ca3af; text-align: right; margin-top: 4px; }
.create__topic-locked { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; }
.create__topic-name { display: inline-block; padding: 4px 12px; background: #e11d48; color: #fff; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
.create__topic-hint { font-size: 0.8rem; color: #9ca3af; }
.create__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }

@media (max-width: 768px) { .create__form { padding: 24px; } .create__container { padding: 20px 0 80px; } }
</style>
