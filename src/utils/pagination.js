// 提供分页相关的工具函数，包括：
// 1. 解析分页参数
// 2. 生成分页响应
// 3. 执行分页查询
// A: Promise.all 并行执行，效率更高
// A: 使用索引、避免大 skip、使用游标分页
// A: 设置默认值、限制最大值、验证类型

// 解析分页参数
// - query: 请求查询参数（req.query）
// - options: 分页选项
//   - page: 默认页码
//   - limit: 默认每页数量
//   - maxLimit: 最大每页数量
// - page: 当前页码
// - limit: 每页数量
// - skip: 跳过记录数
// parsePaginationParams({ page: '2', limit: '20' })
// // { page: 2, limit: 20, skip: 20 }
exports.parsePaginationParams = (query, options = {}) => {
  // 默认配置
  const { 
    page = 1,      // 默认第1页
    limit = 10,    // 默认每页10条
    maxLimit = 100 // 最大每页100条（防止恶意请求）
  } = options;
  
  // 解析并验证分页参数
  // parseInt() - 将字符串转为数字
  // || page - 如果解析失败（NaN），使用默认值
  const pageNum = parseInt(query.page) || page;
  
  // Math.min() - 取最小值，确保不超过最大限制
  // 防止用户请求 limit=10000 导致性能问题
  const limitNum = Math.min(parseInt(query.limit) || limit, maxLimit);
  
  // 计算跳过记录数
  // skip = (page - 1) * limit
  // 第1页: (1-1) * 10 = 0
  // 第2页: (2-1) * 10 = 10
  // 第3页: (3-1) * 10 = 20
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// 生成分页响应
// - data: 数据列表
// - total: 总记录数
// - page: 当前页码
// - limit: 每页记录数
// - data: 数据列表
// - pagination: 分页元数据
// generatePaginationResponse([...], 95, 2, 10)
// // {
// //   data: [...],
// //   pagination: { total: 95, page: 2, limit: 10, pages: 10 }
// // }
exports.generatePaginationResponse = (data, total, page, limit) => {
  return {
    // 数据列表
    data,
    // 分页元数据
    pagination: {
      total,                          // 总记录数
      page: parseInt(page),           // 当前页码
      limit: parseInt(limit),         // 每页数量
      pages: Math.ceil(total / limit) // 总页数（向上取整）
    }
  };
};

// 执行带分页的数据库查询
// - model: Mongoose 模型
// - query: 查询条件
// - options: 查询选项
//   - query: 请求查询参数
//   - sort: 排序条件
//   - populate: 填充关联
//   - select: 字段选择
// - Promise<{ data, pagination }>
// const result = await paginate(Blog, { status: 'published' }, {
//   query: req.query,
//   sort: { createdAt: -1 },
//   populate: 'author'
// });
exports.paginate = async (model, query, options = {}) => {
  // 解析分页参数
  const { page, limit, skip } = exports.parsePaginationParams(
    options.query || {}, 
    options
  );
  
  // 构建查询
  const queryBuilder = model.find(query);
  
  // 应用排序
  // sort: { createdAt: -1 } - 按创建时间降序
  // sort: { views: -1, createdAt: -1 } - 多字段排序
  if (options.sort) {
    queryBuilder.sort(options.sort);
  }
  
  // 应用填充（关联查询）
  // populate: 'author' - 填充作者信息
  // populate: ['author', 'category'] - 填充多个关联
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      // 多个关联，逐个填充
      options.populate.forEach(populate => {
        queryBuilder.populate(populate);
      });
    } else {
      // 单个关联
      queryBuilder.populate(options.populate);
    }
  }
  
  // 应用字段选择
  // select: 'title content author' - 只返回指定字段
  // select: '-password -__v' - 排除指定字段
  if (options.select) {
    queryBuilder.select(options.select);
  }
  
  // 执行查询（并行）
  // Promise.all - 并行执行多个 Promise
  // 比两次 await 更高效（同时查询数据和计数）
  const [items, total] = await Promise.all([
    // 查询数据列表
    queryBuilder
      .skip(skip)      // 跳过前 skip 条
      .limit(limit)    // 只取 limit 条
      .lean(),         // 返回纯 JS 对象（更快）
    
    // 统计总数
    model.countDocuments(query)
  ]);
  
  // 生成分页响应
  return exports.generatePaginationResponse(items, total, page, limit);
};

// 使用示例
// const { paginate } = require('../utils/pagination');
// // 在控制器中使用
// exports.getBlogs = async (req, res) => {
//   try {
//     const result = await paginate(Blog, { status: 'published' }, {
//       query: req.query,
//       sort: { createdAt: -1 },
//       populate: [{ path: 'author', select: 'username avatar' }],
//       select: 'title summary coverImage author createdAt views likes'
//     });
//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ message: '获取失败' });
// };
// // 手动使用
// const { page, limit, skip } = parsePaginationParams(req.query);
// const blogs = await Blog.find().skip(skip).limit(limit);
// const total = await Blog.countDocuments();
// const result = generatePaginationResponse(blogs, total, page, limit);
