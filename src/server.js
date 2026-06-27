// Express 框架
const express = require('express');
const http = require('http');
const path = require('path');

require('dotenv').config({ path: __dirname + '/../.env' });

const connectDB = require('./config/database');
const routes = require('./routes');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const socketService = require('./services/socketService');
const chessService = require('./services/chessService');

const app = express();

// 1. 先设置 CORS（在 helmet 之前）
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim());
        if (allowedOrigins.includes('*') || !origin || allowedOrigins.some(allowed => origin.indexOf(allowed) >= 0)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// 2. 然后设置 Helmet（但放宽一些限制）
app.use(helmet({
    contentSecurityPolicy: false, // 禁用 CSP 避免问题
    crossOriginResourcePolicy: { policy: "cross-origin" } // 允许跨域资源
}));

app.use(xss());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SEO 路由（robots.txt + sitemap.xml）
const seoRoutes = require('./routes/seoRoutes');
app.use(seoRoutes);

app.use('/api', routes);

// 3. 静态资源也要应用 CORS
app.use('/static/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/static', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
}, express.static(path.join(__dirname, 'public')));

app.use('/static/images', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
}, express.static(path.join(__dirname, '../static/images')));

app.get('/test-static', (req, res) => {
    res.send('静态文件服务测试');
});

if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '../dist');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('API服务器正在运行');
    });
}

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API测试成功' });
});

const server = http.createServer(app);
socketService.init(server);
chessService.init(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
});

connectDB().catch(error => {
    console.error('数据库连接失败:', error.message);
});

module.exports = { app, server };