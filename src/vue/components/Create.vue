<template>
  <article class="create-page" aria-label="创作页面">
    <main class="create-page__main" role="main">
      <header class="create-page__header">
        <h1 class="create-page__title">{{ isEditMode ? '编辑攻略' : '创作攻略' }}</h1>
        <p class="create-page__subtitle">
          {{ isEditMode ? '修改你的攻略内容' : '分享你的经验和知识' }}
        </p>
      </header>

      <form class="create-form" @submit.prevent="submitForm">
        <!-- 文章类型选择 -->
        <section class="create-form__section" aria-label="文章类型选择">
          <label class="create-form__label">文章类型</label>
          <div class="type-selector">
            <button
              type="button"
              class="type-btn"
              :class="{ 'type-btn--active': formData.articleType === 'long' }"
              :disabled="isEditMode"
              @click="setArticleType('long')"
            >
              <span class="type-btn__icon">📝</span>
              <span class="type-btn__text">长文章</span>
              <small class="type-btn__hint">知乎风格</small>
            </button>
            <button
              type="button"
              class="type-btn"
              :class="{ 'type-btn--active': formData.articleType === 'short' }"
              :disabled="isEditMode"
              @click="setArticleType('short')"
            >
              <span class="type-btn__icon">📱</span>
              <span class="type-btn__text">短文章</span>
              <small class="type-btn__hint">小红书风格</small>
            </button>
          </div>
          <p v-if="isEditMode" class="create-form__hint" style="color: #666">
            编辑模式下不支持切换文章类型
          </p>
        </section>

        <!-- 文章标题 -->
        <section class="create-form__section" aria-label="文章标题">
          <label for="title" class="create-form__label">文章标题</label>
          <input
            id="title"
            type="text"
            class="create-form__input"
            placeholder="请输入文章标题"
            v-model="formData.title"
          />
        </section>

        <!-- 分类（仅新建） -->
        <section v-if="!isEditMode" class="create-form__section" aria-label="分类选择">
          <label for="category" class="create-form__label">选择分类</label>
          <select id="category" class="create-form__select" v-model="formData.category">
            <option value="">请选择分类</option>
            <option value="游戏攻略">游戏攻略</option>
            <option value="旅游攻略">旅游攻略</option>
            <option value="美食攻略">美食攻略</option>
            <option value="科技攻略">科技攻略</option>
            <option value="健身攻略">健身攻略</option>
            <option value="美妆攻略">美妆攻略</option>
            <option value="学习攻略">学习攻略</option>
          </select>
        </section>

        <!-- 话题信息 -->
        <section v-if="formData.topic" class="create-form__section" aria-label="话题信息">
          <label class="create-form__label">当前话题</label>
          <div class="topic-locked">
            <span class="topic-locked__name">{{ formData.topicName || formData.topic }}</span>
            <span class="topic-locked__hint">
              <span>🔒</span>
              {{ isEditMode ? '话题已锁定，不可修改' : '话题已锁定，来自当前页面' }}
            </span>
          </div>
        </section>

        <!-- 长文章表单 -->
        <template v-if="formData.articleType === 'long'">
          <section class="create-form__section" aria-label="封面图片">
            <label class="create-form__label">封面图片（可选）</label>
            <ImageUploader
              ref="imageUploader"
              :image-url="formData.imageUrl"
              @update:imageUrl="formData.imageUrl = $event"
              @notify="showNotification"
            />
          </section>

          <section class="create-form__section" aria-label="文章内容">
            <QuillEditorWrapper
              ref="quillEditor"
              v-model="formData.content"
              @notify="showNotification"
              @uploading="isSubmitting = $event"
            />
          </section>

          <section class="create-form__section" aria-label="标签">
            <TagInput
              v-model="formData.tags"
              label="标签"
              placeholder="例如：#游戏 #攻略 #技巧"
              input-id="tags"
            />
          </section>
        </template>

        <!-- 短文章表单 -->
        <template v-else-if="formData.articleType === 'short'">
          <section class="create-form__section" aria-label="封面图片">
            <label class="create-form__label">封面图片</label>
            <ImageUploader
              ref="imageUploader"
              :image-url="formData.imageUrl"
              @update:imageUrl="formData.imageUrl = $event"
              @notify="showNotification"
            />
          </section>

          <section class="create-form__section" aria-label="媒体文件">
            <label class="create-form__label">媒体文件</label>
            <p class="create-form__hint">支持多张图片或视频，最多9张</p>
            <MediaUploader
              :media-files="formData.mediaFiles"
              :max-count="9"
              @add-media="onAddMedia"
              @remove-media="onRemoveMedia"
              @notify="showNotification"
            />
          </section>

          <section class="create-form__section" aria-label="文章内容">
            <label for="shortContent" class="create-form__label">文章内容</label>
            <p class="create-form__hint">最多2000字</p>
            <textarea
              id="shortContent"
              v-model="formData.shortContent"
              class="create-form__textarea"
              placeholder="分享你的经验和知识..."
              rows="5"
              maxlength="2000"
            ></textarea>
            <div class="char-count">{{ formData.shortContent.length }}/2000</div>
          </section>

          <section class="create-form__section" aria-label="话题标签">
            <TagInput
              v-model="formData.hashtags"
              label="话题标签"
              hint="例如：#游戏攻略 #旅游体验"
              placeholder="输入话题标签，用空格分隔"
              input-id="hashtags"
            />
          </section>

          <section class="create-form__section" aria-label="位置信息">
            <label for="location" class="create-form__label">位置信息（可选）</label>
            <input
              id="location"
              type="text"
              class="create-form__input"
              placeholder="例如：北京故宫"
              v-model="formData.location"
            />
          </section>
        </template>

        <!-- 操作按钮 -->
        <section class="create-form__actions" aria-label="操作按钮">
          <button type="button" class="btn btn--secondary" @click="cancelCreate">取消</button>
          <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">🔄</span>
            <span v-else>{{ isEditMode ? '📝' : '🚀' }}</span>
            {{ isSubmitting ? (isEditMode ? '更新中...' : '发布中...') : (isEditMode ? '更新攻略' : '发布攻略') }}
          </button>
        </section>
      </form>
    </main>
  </article>
</template>

<script>
import QuillEditorWrapper from './create/QuillEditorWrapper.vue';
import ImageUploader from './create/ImageUploader.vue';
import MediaUploader from './create/MediaUploader.vue';
import TagInput from './create/TagInput.vue';
import { showNotification } from '../utils/notification';
import { normalizeImageUrl, getAuthToken } from '../utils/helpers';

// 表单默认值
function getDefaultFormData() {
  return {
    title: '',
    category: '',
    topic: '',
    topicName: '',
    imageUrl: '',
    content: '',
    tags: '',
    articleType: 'long',
    mediaFiles: [],
    shortContent: '',
    hashtags: '',
    location: ''
  };
}

export default {
  name: 'Create',
  components: { QuillEditorWrapper, ImageUploader, MediaUploader, TagInput },

  data() {
    return {
      isSubmitting: false,
      isEditMode: false,
      currentBlogId: null,
      formData: getDefaultFormData(),
      originalImageUrl: null
    };
  },

  mounted() {
    // 从 query 参数读取话题
    if (this.$route.query.topic) {
      this.formData.topic = this.$route.query.topic;
      this.formData.topicName = this.$route.query.topicName || '';
    }
    // 编辑模式
    if (this.$route.params.id) {
      this.isEditMode = true;
      this.currentBlogId = this.$route.params.id;
      this.loadBlogDetail(this.currentBlogId);
    }
  },

  beforeDestroy() {
    if (this.$refs.imageUploader) {
      this.$refs.imageUploader.clearFile();
    }
  },

  methods: {
    showNotification,

    onAddMedia(media) {
      this.formData.mediaFiles.push(media);
    },
    onRemoveMedia(index) {
      this.formData.mediaFiles.splice(index, 1);
    },

    // 将标签字符串解析为数组
    parseTags(tagString) {
      if (!tagString) return [];
      return tagString
        .replace(/[,，、]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(Boolean);
    },

    // 将标签数组格式化为显示字符串
    formatTags(tags) {
      if (!tags || !Array.isArray(tags)) return '';
      return tags.map(tag => `#${tag}`).join(' ');
    },

    // 切换文章类型
    setArticleType(type) {
      if (this.isEditMode) {
        showNotification('编辑模式下不支持切换文章类型', 'warning');
        return;
      }
      this.formData.articleType = type;
      // 清空不相关的字段
      if (type === 'long') {
        this.formData.mediaFiles = [];
        this.formData.shortContent = '';
        this.formData.hashtags = '';
        this.formData.location = '';
      } else {
        this.formData.content = '';
        this.formData.tags = '';
      }
    },

    // 取消创建
    cancelCreate() {
      if (this.$refs.imageUploader) {
        this.$refs.imageUploader.clearFile();
      }
      this.formData = getDefaultFormData();
      this.$router.push('/my-creation').catch(() => {});
    },

    // 加载博客详情（编辑模式）
    async loadBlogDetail(blogId) {
      try {
        const token = getAuthToken();
        if (!token) {
          showNotification('请先登录', 'warning');
          return;
        }
        const data = await this.$http.get(`/api/blogs/${blogId}`);
        if (!data.success) {
          showNotification(`加载文章失败: ${data.message}`, 'error');
          return;
        }

        const blog = data.data;
        const imageUrl = normalizeImageUrl(blog.image || '');
        const mediaFiles = (blog.mediaFiles || []).map(media => ({
          url: normalizeImageUrl(media.url),
          mediaType: media.mediaType || 'image'
        }));

        this.formData = {
          title: blog.title || '',
          content: blog.content || '',
          topic: blog.topic ? blog.topic._id : '',
          topicName: blog.topic ? blog.topic.name : '',
          imageUrl,
          tags: this.formatTags(blog.tags),
          articleType: blog.articleType || 'long',
          mediaFiles,
          shortContent: blog.shortContent || '',
          hashtags: this.formatTags(blog.hashtags),
          location: blog.location || ''
        };

        // 富文本编辑器需要 nextTick 后设置内容
        if (this.formData.articleType === 'long') {
          this.$nextTick(() => {
            if (this.$refs.quillEditor) {
              this.$refs.quillEditor.setContent(blog.content || '');
            }
          });
        }

        this.originalImageUrl = imageUrl;
        this.currentBlogId = blogId;
      } catch (error) {
        console.error('加载文章详情失败:', error);
        showNotification('加载文章详情失败，请稍后重试', 'error');
      }
    },

    // 表单验证
    validateForm() {
      if (!this.formData.title.trim()) {
        showNotification('请输入文章标题', 'warning');
        return false;
      }
      if (this.formData.title.trim().length < 5) {
        showNotification('标题长度至少为 5 个字符', 'warning');
        return false;
      }
      if (!this.formData.imageUrl) {
        showNotification('请设置封面图片', 'warning');
        return false;
      }
      if (this.formData.articleType === 'long' && !this.formData.content.trim()) {
        showNotification('请输入文章内容', 'warning');
        return false;
      }
      if (this.formData.articleType === 'short') {
        if (!this.formData.shortContent.trim()) {
          showNotification('请输入文章内容', 'warning');
          return false;
        }
        if (this.formData.mediaFiles.length === 0) {
          showNotification('请上传媒体文件', 'warning');
          return false;
        }
      }
      return true;
    },

    // 构建提交数据
    buildSubmitData(imageUrl) {
      const submitData = {
        title: this.formData.title,
        topic: this.formData.topic,
        articleType: this.formData.articleType,
        image: imageUrl
      };

      // 分类标签合并到 tags
      if (this.formData.category) {
        const existingTags = this.parseTags(this.formData.tags);
        if (!existingTags.includes(this.formData.category)) {
          existingTags.unshift(this.formData.category);
        }
        this.formData.tags = existingTags.join(', ');
      }

      if (this.formData.articleType === 'long') {
        Object.assign(submitData, {
          content: this.formData.content,
          tags: this.parseTags(this.formData.tags),
          video: '', mediaFiles: [], shortContent: '', hashtags: [], location: ''
        });
      } else {
        Object.assign(submitData, {
          mediaFiles: this.formData.mediaFiles,
          shortContent: this.formData.shortContent,
          hashtags: this.parseTags(this.formData.hashtags),
          location: this.formData.location,
          content: '', video: '', tags: []
        });
      }

      return submitData;
    },

    // 上传图片
    async uploadImage() {
      const imageFile = this.$refs.imageUploader
        ? this.$refs.imageUploader.getFile()
        : null;
      if (!imageFile) return null;

      const formData = new FormData();
      formData.append('image', imageFile);
      const result = await this.$http.post('/api/blogs/upload-image', formData);
      if (!result.success) {
        throw new Error(`图片上传失败: ${result.message}`);
      }
      return result.data.url;
    },

    // 获取最终图片 URL
    resolveImageUrl(uploadedUrl) {
      if (uploadedUrl) return uploadedUrl;
      if (this.isEditMode) {
        const currentUrl = this.formData.imageUrl;
        if (currentUrl && currentUrl.startsWith('blob:')) {
          return this.originalImageUrl || '';
        }
        return currentUrl || this.originalImageUrl || '';
      }
      return '';
    },

    // 提交表单
    async submitForm() {
      if (!this.validateForm()) return;

      this.isSubmitting = true;
      try {
        const token = getAuthToken();
        if (!token) {
          showNotification('请先登录', 'warning');
          return;
        }

        // 上传图片
        let uploadedUrl = null;
        try {
          uploadedUrl = await this.uploadImage();
        } catch (error) {
          showNotification(error.message, 'error');
          return;
        }

        const imageUrl = this.resolveImageUrl(uploadedUrl);
        if (!imageUrl) {
          showNotification('封面图片上传失败，请重试', 'error');
          return;
        }

        const submitData = this.buildSubmitData(imageUrl);
        const url = this.isEditMode
          ? `/api/blogs/${this.currentBlogId}`
          : '/api/blogs';
        const method = this.isEditMode ? 'put' : 'post';

        const data = await this.$http[method](url, submitData);
        if (data.success) {
          showNotification(
            this.isEditMode ? '攻略更新成功！' : '攻略发布成功！',
            'success'
          );
          this.cancelCreate();
        } else {
          showNotification(
            `${this.isEditMode ? '更新' : '发布'}失败: ${data.message}`,
            'error'
          );
        }
      } catch (error) {
        console.error('发布失败:', error);
        showNotification(`发布失败: ${error.message}`, 'error');
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fef3c7 0%, #fbcfe8 50%, #e0f2fe 100%);
  font-family: 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive, sans-serif;
}

.create-page__main {
  padding-bottom: 70px;
}

.create-page__header {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 3px solid #fbcfe8;
  border-radius: 16px;
  padding: 40px 0 30px;
  margin: 20px auto 30px;
  max-width: 1200px;
  text-align: center;
  box-shadow: 0 8px 30px rgba(251, 207, 232, 0.25);
}

.create-page__title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #16a34a;
}

.create-page__subtitle {
  margin: 0;
  font-size: 1rem;
  color: #6ee7b7;
}

/* 表单 */
.create-form {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 3px solid #fbcfe8;
  border-radius: 16px;
  padding: 32px;
  margin: 0 auto 30px;
  max-width: 1200px;
  box-shadow: 0 8px 30px rgba(251, 207, 232, 0.25);
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.create-form__section {
  margin-bottom: 24px;
}

.create-form__label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #16a34a;
  font-size: 0.95rem;
}

.create-form__input,
.create-form__select,
.create-form__textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #fbcfe8;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #333;
  background: #fff;
  transition: all 0.3s ease;
}

.create-form__input:focus,
.create-form__select:focus,
.create-form__textarea:focus {
  outline: none;
  border-color: #ec4899;
  box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.08);
}

.create-form__textarea {
  resize: vertical;
  min-height: 180px;
}

.create-form__hint {
  font-size: 0.85rem;
  color: #999;
  margin-top: 6px;
}

.char-count {
  font-size: 0.85rem;
  color: #999;
  text-align: right;
  margin-top: 6px;
}

/* 类型选择器 */
.type-selector {
  display: flex;
  gap: 16px;
}

.type-btn {
  flex: 1;
  padding: 16px 20px;
  border: 3px solid #fbcfe8;
  border-radius: 14px;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  box-shadow: 0 4px 16px rgba(251, 207, 232, 0.2);
}

.type-btn:hover:not(:disabled) {
  border-color: #ec4899;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.15);
}

.type-btn--active {
  border-color: #ec4899;
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.08) 100%);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.2);
}

.type-btn__icon { font-size: 1.5rem; display: block; margin-bottom: 4px; }
.type-btn__text { display: block; font-weight: 600; margin-bottom: 2px; }
.type-btn__hint { font-size: 0.8rem; color: #999; }

.type-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 话题锁定 */
.topic-locked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fef3c7;
  border: 2px solid #fbcfe8;
  border-radius: 12px;
}

.topic-locked__name {
  display: inline-block;
  padding: 4px 14px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.topic-locked__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #999;
}

/* 按钮 */
.create-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
}

.btn {
  border-radius: 30px;
  padding: 12px 32px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.btn--primary {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
}

.btn--primary:hover {
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3);
}

.btn--secondary {
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  color: #333;
  border: 2px solid #fbcfe8;
}

.btn--secondary:hover {
  box-shadow: 0 6px 20px rgba(251, 207, 232, 0.3);
}

@media (max-width: 768px) {
  .create-page__header {
    padding: 24px 0 20px;
    margin: 12px 16px 24px;
  }
  .create-page__title { font-size: 1.5rem; }
  .create-form { padding: 20px; margin: 0 16px 30px; }
  .type-selector { flex-direction: column; }
  .create-form__actions { flex-direction: column; }
  .btn { width: 100%; }
}
</style>
