// src/utils/errorHandler.js
// 错误处理工具函数

/**
 * 处理控制器错误
 * @param {Object} res - Express响应对象
 * @param {Error} error - 错误对象
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 */
exports.handleControllerError = (res, error, message = '操作失败', statusCode = 500) => {
  console.error(`${message}:`, error);
  if (error.stack) {
    console.error('错误堆栈:', error.stack);
  }
  res.status(statusCode).json({ success: false, message });
};

/**
 * 处理验证错误
 * @param {Object} res - Express响应对象
 * @param {Object} error - 验证错误对象
 */
exports.handleValidationError = (res, error) => {
  console.error('验证错误:', error);
  const message = error.message || '数据验证失败';
  res.status(400).json({ success: false, message });
};

/**
 * 处理未找到资源的错误
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
exports.handleNotFoundError = (res, message = '资源不存在') => {
  res.status(404).json({ success: false, message });
};

/**
 * 处理权限错误
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
exports.handlePermissionError = (res, message = '没有权限执行此操作') => {
  res.status(403).json({ success: false, message });
};

/**
 * 处理参数错误
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
exports.handleBadRequestError = (res, message = '请求参数错误') => {
  res.status(400).json({ success: false, message });
};