const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const uploadService = require('../services/uploadService');
const emojiController = require('../controllers/emojiController');

// 上传收藏表情包
router.post(
  '/upload',
  authMiddleware,
  uploadService.singleUpload('emoji'),
  emojiController.uploadEmoji
);

// 获取收藏表情包
router.get(
  '/favorites',
  authMiddleware,
  emojiController.getFavorites
);

// 删除收藏表情包
router.delete(
  '/favorites/:emojiId',
  authMiddleware,
  emojiController.deleteEmoji
);

module.exports = router;
