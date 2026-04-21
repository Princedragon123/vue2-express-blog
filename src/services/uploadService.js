// ============================================================
// uploadService.js - 文件上传服务（学习版·Multer）
// ============================================================
// 
// 【文件职责】
// 处理文件上传功能，包括：
// 1. 配置文件存储位置和命名
// 2. 限制文件类型和大小
// 3. 提供上传中间件
// 4. 文件 URL 生成和删除
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. Multer：Express 文件上传中间件                                      │
// │  2. diskStorage：自定义文件存储配置                                     │
// │  3. 文件过滤：限制上传类型                                              │
// │  4. 静态文件服务：express.static 提供访问                               │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【文件上传流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   客户端上传文件                                                        │
// │   ────────────                                                          │
// │       │                                                                 │
// │       │ POST /blogs/upload-image                                        │
// │       │ Content-Type: multipart/form-data                              │
// │       │ Body: image=@photo.jpg                                          │
// │       ▼                                                                 │
// │   Multer 中间件                                                         │
// │   ────────────                                                          │
// │       │                                                                 │
// │       ├── 1. 检查文件类型                                               │
// │       │   fileFilter: 是否允许？                                        │
// │       │                                                                 │
// │       ├── 2. 检查文件大小                                               │
// │       │   limits: 是否超限？                                            │
// │       │                                                                 │
// │       ├── 3. 确定存储目录                                               │
// │       │   destination: src/uploads/blogs/                              │
// │       │                                                                 │
// │       ├── 4. 生成文件名                                                 │
// │       │   filename: image-1234567890-123456789.jpg                     │
// │       │                                                                 │
// │       └── 5. 保存文件到磁盘                                             │
// │                                                                         │
// │       ▼                                                                 │
// │   控制器处理                                                            │
// │   ────────                                                              │
// │       │                                                                 │
// │       │ req.file = {                                                    │
// │       │   fieldname: 'image',                                          │
// │       │   originalname: 'photo.jpg',                                   │
// │       │   filename: 'image-1234567890-123456789.jpg',                  │
// │       │   path: 'src/uploads/blogs/image-xxx.jpg',                     │
// │       │   size: 102400                                                 │
// │       │ }                                                               │
// │       ▼                                                                 │
// │   返回文件 URL                                                          │
// │   { url: '/static/uploads/blogs/image-xxx.jpg' }                       │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【目录结构】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  src/uploads/                                                           │
// │  ├── avatars/          # 用户头像                                       │
// │  │   └── avatar-xxx.jpg                                                │
// │  ├── backgrounds/      # 背景图片                                       │
// │  │   └── coverImage-xxx.jpg                                            │
// │  ├── blogs/            # 博客图片                                       │
// │  │   └── blog-xxx.jpg                                                  │
// │  └── videos/           # 视频文件                                       │
// │      └── video-xxx.mp4                                                 │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么用 Multer 而不是直接读取请求体？
// A: Multer 自动处理 multipart/form-data，解析文件和字段
// 
// Q2: 如何防止恶意文件上传？
// A: fileFilter 限制类型，limits 限制大小，检查文件内容
// 
// Q3: 文件名为什么要加时间戳？
// A: 防止重名覆盖，增加唯一性
// ============================================================

// ============================================================
// 导入依赖模块
// ============================================================

// Multer：Express 文件上传中间件
// 【作用】处理 multipart/form-data 类型的请求
const multer = require('multer');

// path：Node.js 路径处理模块
// 【作用】处理文件路径和扩展名
const path = require('path');

// fs：Node.js 文件系统模块
// 【作用】创建目录、检查文件存在、删除文件
const fs = require('fs');

// ============================================================
// 辅助函数
// ============================================================

/**
 * 确保上传目录存在
 * @param {string} dirPath - 目录路径
 * 
 * 【用途】如果目录不存在，自动创建
 * 【recursive: true】递归创建父目录
 */
const ensureUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// ============================================================
// 创建存储引擎
// ============================================================
// 【diskStorage】自定义存储配置
// - destination: 存储目录
// - filename: 文件名
// ============================================================
const storage = multer.diskStorage({
    // ========================================================
    // destination - 确定存储目录
    // ========================================================
    // 【参数】
    // - req: 请求对象
    // - file: 文件信息
    // - cb: 回调函数 cb(错误, 目录路径)
    // 
    // 【根据 fieldname 判断目录】
    // - avatar → avatars/
    // - coverImage → backgrounds/
    // - image/blog → blogs/
    // - video → videos/
    // ========================================================
    destination: (req, file, cb) => {
        let uploadDir = 'src/uploads';
        
        // 根据文件字段名判断上传目录
        if (file.fieldname === 'avatar') {
            uploadDir = 'src/uploads/avatars';
        } else if (file.fieldname === 'coverImage') {
            uploadDir = 'src/uploads/backgrounds';
        } else if (file.fieldname === 'image' || file.fieldname === 'blog') {
            uploadDir = 'src/uploads/blogs';
        } else if (file.fieldname === 'video') {
            uploadDir = 'src/uploads/videos';
        }
        
        // 确保目录存在
        ensureUploadDir(uploadDir);
        
        // 回调，返回目录路径
        cb(null, uploadDir);
    },
    
    // ========================================================
    // filename - 确定文件名
    // ========================================================
    // 【命名规则】
    // 字段名-时间戳-随机数.扩展名
    // 
    // 【示例】
    // avatar-1704067200000-123456789.jpg
    // 
    // 【好处】
    // - 唯一性：时间戳 + 随机数
    // - 可读性：包含字段名
    // - 保留扩展名：不影响文件类型
    // ========================================================
    filename: (req, file, cb) => {
        // 生成唯一后缀：时间戳-随机数
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        // 获取文件扩展名
        const fileExtension = path.extname(file.originalname);
        
        // 组合文件名
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// ============================================================
// 文件过滤器
// ============================================================
// 【作用】限制可上传的文件类型
// 【参数】
// - req: 请求对象
// - file: 文件信息（包含 mimetype）
// - cb: 回调函数 cb(错误, 是否允许)
// ============================================================
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
        // 图片文件
        'image/jpeg',   // JPEG 图片
        'image/png',    // PNG 图片
        'image/gif',    // GIF 图片
        'image/webp',   // WebP 图片
        
        // 视频文件
        'video/mp4',    // MP4 视频
        'video/webm',   // WebM 视频
        'video/ogg',    // OGG 视频
        'video/quicktime',  // MOV 视频
        'video/x-msvideo'   // AVI 视频
    ];
    
    // 检查文件类型是否在允许列表中
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);  // 允许上传
    } else {
        cb(new Error('只允许上传图片文件（JPEG、PNG、GIF、WEBP）和视频文件（MP4、WebM、OGG、MOV、AVI）'), false);
    }
};

// ============================================================
// 创建 Multer 实例
// ============================================================
// 【配置项】
// - storage: 存储引擎
// - limits: 限制条件
// - fileFilter: 文件过滤器
// ============================================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024  // 限制文件大小为 100MB
    },
    fileFilter: fileFilter
});

// ============================================================
// 上传服务对象
// ============================================================
const uploadService = {
    // ========================================================
    // 单文件上传中间件
    // ========================================================
    // 【用法】router.post('/upload', singleUpload('avatar'), controller)
    // 【效果】req.file 包含上传的文件信息
    // ========================================================
    singleUpload: (fieldName) => {
        return upload.single(fieldName);
    },
    
    // ========================================================
    // 多文件上传中间件
    // ========================================================
    // 【用法】router.post('/upload', multipleUpload('images', 5), controller)
    // 【效果】req.files 包含上传的文件数组
    // 【maxCount】最大文件数量
    // ========================================================
    multipleUpload: (fieldName, maxCount) => {
        return upload.array(fieldName, maxCount);
    },
    
    // ========================================================
    // 生成文件访问 URL
    // ========================================================
    // 【参数】
    // - req: 请求对象（未使用）
    // - filename: 文件名
    // - directory: 子目录（可选）
    // 
    // 【返回】
    // /static/uploads/filename
    // 或 /static/uploads/directory/filename
    // ========================================================
    generateFileUrl: (req, filename, directory) => {
        let fileUrl = `/static/uploads/${filename}`;
        
        if (directory) {
            fileUrl = `/static/uploads/${directory}/${filename}`;
        }
        
        return fileUrl;
    },
    
    // ========================================================
    // 删除文件
    // ========================================================
    // 【参数】fileUrl - 文件 URL
    // 【返回】true/false
    // 
    // 【流程】
    // 1. 检查 URL 是否以 /static/uploads/ 或 /uploads/ 开头
    // 2. 提取相对路径
    // 3. 构建完整路径
    // 4. 检查文件是否存在
    // 5. 删除文件
    // ========================================================
    deleteFile: (fileUrl) => {
        try {
            // 检查 URL 格式
            if (!fileUrl) {
                return false;
            }
            
            // 提取相对路径（兼容两种格式）
            let relativePath;
            if (fileUrl.startsWith('/static/uploads/')) {
                // 格式1: /static/uploads/avatars/xxx.jpg
                relativePath = fileUrl.replace('/static/uploads/', '');
            } else if (fileUrl.startsWith('/uploads/')) {
                // 格式2: /uploads/avatars/xxx.jpg
                relativePath = fileUrl.replace('/uploads/', '');
            } else {
                // 不是本地上传的文件，跳过
                return false;
            }
            
            // 构建完整路径
            const filePath = path.join(__dirname, '..', 'uploads', relativePath);
            
            // 检查文件是否存在
            if (fs.existsSync(filePath)) {
                // 删除文件
                fs.unlinkSync(filePath);
                console.log('成功删除文件:', filePath);
                return true;
            } else {
                console.log('文件不存在:', filePath);
                return false;
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            return false;
        }
    }
};

// ============================================================
// 导出上传服务
// ============================================================
// 【使用示例】
// const uploadService = require('../services/uploadService');
// 
// // 单文件上传
// router.post('/avatar', uploadService.singleUpload('avatar'), (req, res) => {
//   const url = uploadService.generateFileUrl(req, req.file.filename, 'avatars');
//   res.json({ url });
// });
// 
// // 多文件上传
// router.post('/images', uploadService.multipleUpload('images', 5), (req, res) => {
//   const urls = req.files.map(file => 
//     uploadService.generateFileUrl(req, file.filename, 'blogs')
//   );
//   res.json({ urls });
// });
// 
// // 删除文件
// uploadService.deleteFile('/static/uploads/avatars/avatar-xxx.jpg');
// ============================================================
module.exports = uploadService;
