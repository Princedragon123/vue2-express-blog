<template>
  <div class="form-section">
    <label class="form-label">文章内容</label>
    <div 
      ref="quillEditorContainer" 
      class="quill-editor"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    ></div>
    <input type="file" ref="contentImageInput" class="content-image-input" accept="image/*" style="display: none;" @change="handleContentImageUpload">
    <!-- change提交事件触发 -->
  </div>
</template>

<script>
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default {
  name: 'QuillEditorWrapper',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入内容...'
    }
  },
  data() {
    return {
      quillEditor: null,
      dropZoneActive: false
    };
  },
  methods: {
    initQuillEditor() {
      this.destroyQuillEditor();
      if (!this.$refs.quillEditorContainer) {
        console.error('富文本编辑器容器元素不存在');
        return;
      }
      const toolbarOptions = [
         // 数组是普通按钮
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
         // 对象下拉配置
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['image']
      ];
      this.quillEditor = new Quill(this.$refs.quillEditorContainer, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              'image': this.handleQuillImageUpload
            }
          }
        },
        placeholder: this.placeholder
      });
      if (this.value) {
        this.quillEditor.root.innerHTML = this.value;
      }
      this.quillEditor.on('text-change', () => {
        this.$emit('input', this.quillEditor.root.innerHTML);
      });
      
      // 添加粘贴事件监听
      this.quillEditor.root.addEventListener('paste', this.handlePaste);
    },
    destroyQuillEditor() {
      if (this.quillEditor) {
        // 移除粘贴事件监听
        this.quillEditor.root.removeEventListener('paste', this.handlePaste);
        this.quillEditor.off();
        if (this.$refs.quillEditorContainer) {
          this.$refs.quillEditorContainer.innerHTML = '';
          while (this.$refs.quillEditorContainer.firstChild) {
            this.$refs.quillEditorContainer.removeChild(this.$refs.quillEditorContainer.firstChild);
          }
        }
        const toolbarElements = document.querySelectorAll('.ql-toolbar.ql-snow');
        toolbarElements.forEach(toolbar => {
          const editorContainer = this.$refs.quillEditorContainer;
          if (editorContainer && (toolbar.parentNode === editorContainer || editorContainer.contains(toolbar))) {
            toolbar.remove();
          }
        });
        this.quillEditor = null;
      }
    },
    handleQuillImageUpload() {
      this.$refs.contentImageInput.click();
    },
    handleContentImageUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.uploadImage(file);
      }
    },
    handleDragOver(event) {
      this.dropZoneActive = true;
      this.$refs.quillEditorContainer.classList.add('drag-over');
    },
    handleDragLeave(event) {
      this.dropZoneActive = false;
      this.$refs.quillEditorContainer.classList.remove('drag-over');
    },
    handleDrop(event) {
      this.dropZoneActive = false;
      this.$refs.quillEditorContainer.classList.remove('drag-over');
      
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const imageFile = Array.from(files).find(file => file.type.startsWith('image/'));
        if (imageFile) {
          this.uploadImage(imageFile);
        }
      }
    },
    handlePaste(event) {
      const items = event.clipboardData && event.clipboardData.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          // 拦截粘贴事件，阻止默认粘贴行为
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            this.uploadImage(file);
          }
          break;
        }
      }
    },
    uploadImage(file) {
      const formData = new FormData();
      formData.append('image', file);
      this.$emit('uploading', true);
      this.$http.post('/api/blogs/upload-image', formData)
        .then(data => {
          if (data.success) {
            const range = this.quillEditor.getSelection(true);
            this.quillEditor.insertEmbed(range.index, 'image', data.data.url);
            this.quillEditor.setSelection(range.index + 1);
            this.$emit('notify', '图片插入成功！', 'success');
          } else {
            this.$emit('notify', `图片上传失败: ${data.message}`, 'error');
          }
        })
        .catch(() => {
          this.$emit('notify', '上传图片失败，请稍后重试', 'error');
        })
        .finally(() => {
          this.$emit('uploading', false);
          // 清空input，避免重复选择同一文件不触发change事件
          if (this.$refs.contentImageInput) {
            this.$refs.contentImageInput.value = '';
          }
        });
    },
    setContent(html) {
      if (this.quillEditor && html) {
        this.quillEditor.root.innerHTML = html;
      }
    },
    getContent() {
      return this.quillEditor ? this.quillEditor.root.innerHTML : '';
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initQuillEditor();
    });
  },
  beforeDestroy() {
    this.destroyQuillEditor();
  }
};
</script>

<style scoped>
.quill-editor {
  min-height: 400px;
  border: 4px solid var(--background-dark) !important;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 0 auto;
  max-width: 100%;
  position: relative;
}

.quill-editor:focus {
  outline: none;
  border-color: var(--primary-pink) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3), 0 0 0 3px rgba(236, 72, 153, 0.2);
}

.quill-editor.drag-over {
  border-color: var(--primary-pink) !important;
  background-color: rgba(236, 72, 153, 0.05);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3), inset 0 0 0 2px var(--primary-pink);
}

.quill-editor.drag-over::before {
  content: '松开鼠标插入图片';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-pink);
  background-color: rgba(255, 255, 255, 0.95);
  padding: 15px 30px;
  border-radius: 20px;
  border: 3px solid var(--primary-pink);
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
  z-index: 1000;
}

::v-deep .ql-toolbar.ql-snow {
  border: 4px solid var(--background-dark) !important;
  border-bottom: 4px solid var(--background-dark) !important;
  border-radius: 10px 10px 0 0 !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  padding: 15px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  z-index: 100;
  position: relative;
}

::v-deep .ql-container.ql-snow {
  border: 4px solid var(--background-dark) !important;
  border-top: none !important;
  border-radius: 0 0 10px 10px !important;
  min-height: 400px !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  background-color: white !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

::v-deep .ql-editor {
  padding: 20px !important;
  min-height: 400px !important;
  font-family: var(--font-family) !important;
  color: var(--text-primary) !important;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.1);
  line-height: 1.8 !important;
}

::v-deep .ql-editor img {
  max-width: 100% !important;
  height: auto !important;
  border-radius: 8px !important;
  margin: 20px auto !important;
  border: 4px solid var(--background-dark) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  display: block;
}

::v-deep .ql-toolbar.ql-snow button {
  border: 2px solid var(--background-dark) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  cursor: pointer !important;
  padding: 10px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep .ql-toolbar.ql-snow button:hover {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
}

::v-deep .ql-toolbar.ql-snow button.ql-active {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

::v-deep .ql-toolbar.ql-snow .ql-picker {
  border: 2px solid var(--background-dark) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  cursor: pointer !important;
  padding: 10px !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 16px !important;
  min-width: 100px;
  height: 40px;
  display: flex;
  align-items: center;
}

::v-deep .ql-toolbar.ql-snow .ql-picker:hover {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(236, 72, 153, 0.3);
}

::v-deep .ql-toolbar.ql-snow .ql-picker-label {
  padding: 0 10px !important;
  font-size: 16px !important;
  font-family: var(--font-family) !important;
  font-weight: 600 !important;
  display: flex;
  align-items: center;
}

::v-deep .ql-toolbar.ql-snow .ql-picker-options {
  border: 4px solid var(--background-dark) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3) !important;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  font-family: var(--font-family) !important;
  font-size: 16px !important;
  margin-top: 5px !important;
}

::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item {
  padding: 10px 15px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  color: var(--text-primary) !important;
}

::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item:hover,
::v-deep .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item.ql-selected {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%) !important;
  color: white !important;
}

::v-deep .ql-editor h1,
::v-deep .ql-editor h2,
::v-deep .ql-editor h3,
::v-deep .ql-editor h4,
::v-deep .ql-editor h5,
::v-deep .ql-editor h6 {
  font-family: var(--font-family) !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  margin: 25px 0 15px 0 !important;
}

::v-deep .ql-editor h1 { font-size: 2.5rem !important; }
::v-deep .ql-editor h2 { font-size: 2.2rem !important; }
::v-deep .ql-editor h3 { font-size: 1.8rem !important; }
::v-deep .ql-editor h4 { font-size: 1.5rem !important; }
::v-deep .ql-editor h5 { font-size: 1.3rem !important; }
::v-deep .ql-editor h6 { font-size: 1.1rem !important; }

::v-deep .ql-editor p {
  font-family: var(--font-family) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  margin: 15px 0 !important;
  color: var(--text-primary) !important;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.1);
}

::v-deep .ql-editor ol,
::v-deep .ql-editor ul {
  margin: 15px 0 !important;
  padding-left: 40px !important;
}

::v-deep .ql-editor li {
  font-family: var(--font-family) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
  margin: 8px 0 !important;
  color: var(--text-primary) !important;
}

::v-deep .ql-editor blockquote {
  border-left: 4px solid var(--primary-pink) !important;
  padding-left: 20px !important;
  margin: 20px 0 !important;
  font-style: italic !important;
  font-family: var(--font-family) !important;
  color: var(--text-secondary) !important;
  font-size: 18px !important;
  line-height: 1.8 !important;
}

::v-deep .ql-editor pre.ql-syntax {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%) !important;
  border: 4px solid var(--background-dark) !important;
  border-radius: 6px !important;
  padding: 20px !important;
  font-family: 'Courier New', monospace !important;
  font-size: 16px !important;
  color: var(--text-primary) !important;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 20px 0 !important;
}

::v-deep .ql-toolbar.ql-snow .ql-formats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 !important;
  padding: 0 !important;
}

.content-image-input {
  display: none;
}
</style>
