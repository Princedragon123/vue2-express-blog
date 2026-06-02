// 文件上传服务（Multer）
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const ensureUploadDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// 存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = 'src/uploads';
        
        if (file.fieldname === 'avatar') {
            uploadDir = 'src/uploads/avatars';
        } else if (file.fieldname === 'coverImage') {
            uploadDir = 'src/uploads/backgrounds';
        } else if (file.fieldname === 'image' || file.fieldname === 'blog') {
            uploadDir = 'src/uploads/blogs';
        } else if (file.fieldname === 'video') {
            uploadDir = 'src/uploads/videos';
        } else if (file.fieldname === 'emoji') {
            uploadDir = 'src/uploads/emojis';
        }
        
        ensureUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片和视频文件'), false);
    }
};

// 上传实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024
    },
    fileFilter: fileFilter
});

// 上传服务
const uploadService = {
    singleUpload: (fieldName) => {
        return upload.single(fieldName);
    },
    
    multipleUpload: (fieldName, maxCount) => {
        return upload.array(fieldName, maxCount);
    },
    
    generateFileUrl: (req, filename, directory) => {
        let fileUrl = `/static/uploads/${filename}`;
        if (directory) {
            fileUrl = `/static/uploads/${directory}/${filename}`;
        }
        return fileUrl;
    },
    
    deleteFile: (fileUrl) => {
        try {
            if (!fileUrl) return false;
            
            let relativePath;
            if (fileUrl.startsWith('/static/uploads/')) {
                relativePath = fileUrl.replace('/static/uploads/', '');
            } else if (fileUrl.startsWith('/uploads/')) {
                relativePath = fileUrl.replace('/uploads/', '');
            } else {
                return false;
            }
            
            const filePath = path.join(__dirname, '..', 'uploads', relativePath);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('删除文件失败:', error);
            return false;
        }
    }
};

module.exports = uploadService;