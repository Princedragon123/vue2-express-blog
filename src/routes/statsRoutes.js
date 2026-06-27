// 用户数据看板路由
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authMiddleware } = require('../middlewares/auth');

// GET /api/stats/dashboard - 获取用户数据看板
router.get('/dashboard', authMiddleware, statsController.getUserDashboard);

// GET /api/stats/top-articles - 获取最受欢迎文章 TOP5
router.get('/top-articles', authMiddleware, statsController.getTopArticles);

module.exports = router;
