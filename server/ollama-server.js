// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-console */
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable import/no-commonjs */
const http = require('http');
const { URLSearchParams } = require('url');
const file = require('fs');
const path = require('path');

function getQueryParams(urlString) {
  // 创建 URL 实例
  // 获取查询字符串
  const queryString = urlString.split('?')[1] ?? '';
  // 创建 URLSearchParams 实例
  const urlParams = new URLSearchParams(queryString);
  // 初始化一个空对象用于存储解析后的参数
  const queryObject = {};

  // 遍历 URLSearchParams 实例中的每个参数
  for (const [key, value] of urlParams.entries()) {
    queryObject[key] = value;
  }
  return queryObject;
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 设置允许跨域的请求源，* 表示允许所有源
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 设置允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  // 设置允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // 处理预请求（OPTIONS 请求）
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  process.stdout.write(`Req ${req.method} ${req.url.split('?')[0]} `);
  if (
    (req.method === 'POST' || req.method === 'GET') &&
    req.url.startsWith('/api/generate-mind-map')
  ) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const requestData =
          req.method === 'POST' ? JSON.parse(body) : getQueryParams(req.url);

        console.log(requestData);
        const {
          // model = 'gemma2:2b',
          model = 'deepseek-r1:1.5b',
          prompt,
        } = requestData;

        // 构建 Ollama 请求
        const ollamaOptions = {
          hostname: 'localhost',
          port: 11434,
          path: '/api/generate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const ollamaReq = http.request(ollamaOptions, ollamaRes => {
          // 设置响应头
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });
          ollamaRes.setEncoding('utf8');
          ollamaRes.on('data', chunk => {
            const chunkJson = JSON.parse(chunk);
            res.write(chunkJson.response);
          });

          ollamaRes.on('end', () => {
            res.end();
          });
        });

        ollamaReq.on('error', error => {
          console.error('Ollama 请求出错:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Internal Server Error');
        });
        const systemPrompt = file.readFileSync(
          path.resolve(__dirname, './mind-gen-prompt.md'),
        );
        const promptWithSystem = `${systemPrompt}\n\n要求: ${prompt}`;
        // 发送请求体
        const ollamaRequestBody = JSON.stringify({
          model,
          prompt: promptWithSystem,
          stream: true,
          options: {
            temperature: 0.1,
            top_k: 20,
          },
        });
        ollamaReq.write(ollamaRequestBody);
        ollamaReq.end();
      } catch (error) {
        console.error('解析请求体出错:', error);
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

// 启动服务器
const port = 3000;
server.listen(port, () => {
  console.log(
    `Server started. You can request with http://localhost:${port}/api/generate?prompt=Hello`,
  );
});
