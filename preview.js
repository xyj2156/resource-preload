import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// 获取项目根目录
const projectDir = process.cwd();

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  // 解析请求的URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // 处理根路径
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 构建文件路径
  const filePath = path.join(projectDir, pathname);

  // 防止路径遍历攻击
  if (!filePath.startsWith(projectDir)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 文件不存在，返回404
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      res.end('<h1>404 Not Found</h1>');
      return;
    }

    // 获取文件扩展名
    const ext = path.parse(filePath).ext;
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // 读取文件并发送响应
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(content);
    });
  });
});

// 服务器端口配置
const PORT = process.env.PORT || 2156;

server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${projectDir}`);
  console.log('Press Ctrl+C to stop the server');
});

// 优雅关闭服务器
process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
