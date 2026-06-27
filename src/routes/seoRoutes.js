// SEO 路由 - 网站地图和爬虫配置
const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// robots.txt - 告诉搜索引擎哪些可以抓取
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://your-domain.com';
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Allow: /blog
Allow: /zhihu-detail/
Allow: /topics
Allow: /topic/
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /create
Disallow: /messages
Disallow: /profile
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`);
});

// sitemap.xml - 告诉搜索引擎有哪些页面
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || 'https://your-domain.com';

    // 取最近 500 篇已发布文章
    const blogs = await Blog.find({
      $or: [{ status: 'published' }, { status: { $exists: false } }]
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('_id title createdAt updatedAt')
      .lean();

    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/blog', priority: '1.0', changefreq: 'daily' },
      { loc: '/topics', priority: '0.8', changefreq: 'weekly' }
    ];

    const urls = [
      ...staticPages.map(p => `
  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`),
      ...blogs.map(blog => `
  <url>
    <loc>${baseUrl}/zhihu-detail/${blog._id}</loc>
    <lastmod>${(blog.updatedAt || blog.createdAt).toISOString()}</lastmod>
    <priority>0.9</priority>
  </url>`)
    ];

    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
