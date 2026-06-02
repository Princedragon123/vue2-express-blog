const User = require('../models/User');
const uploadService = require('../services/uploadService');

const emojiController = {
  // 上传收藏表情包
  uploadEmoji: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '请先登录' });
      }

      if (!req.file) {
        return res.status(400).json({ message: '请选择文件' });
      }

      const fileUrl = uploadService.generateFileUrl(req, req.file.filename, 'emojis');
      const newEmoji = {
        id: Date.now(),
        url: fileUrl,
        name: req.file.originalname
      };

      // 保存到用户数据
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      if (!user.favoriteEmojis) {
        user.favoriteEmojis = [];
      }
      
      user.favoriteEmojis.unshift(newEmoji);
      await user.save();

      res.json({
        message: '上传成功',
        emoji: newEmoji
      });
    } catch (error) {
      console.error('上传表情包失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取收藏表情包
  getFavorites: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '请先登录' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({
        emojis: user.favoriteEmojis || []
      });
    } catch (error) {
      console.error('获取收藏表情包失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 删除收藏表情包
  deleteEmoji: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: '请先登录' });
      }

      const { emojiId } = req.params;
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      if (!user.favoriteEmojis) {
        user.favoriteEmojis = [];
      }

      const index = user.favoriteEmojis.findIndex(e => e.id == emojiId);
      if (index > -1) {
        user.favoriteEmojis.splice(index, 1);
        await user.save();
      }

      res.json({ message: '删除成功' });
    } catch (error) {
      console.error('删除表情包失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = emojiController;
