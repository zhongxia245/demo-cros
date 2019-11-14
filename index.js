const http = require("http");

http
  .createServer((req, res) => {
    let url = req.url;

    // 加上 允许的域名，则支持跨域请求了
    res.setHeader("Access-Control-Allow-Origin", "http://192.168.10.8:8080");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    console.log(`>>>>:${req.method}=>${url}`);

    switch (url) {
      case "/":
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(`Hello World`);
        break;
      case "/api/get":
        res.end(JSON.stringify({ data: { name: "zhongxia" }, success: true }));
        console.log(`<<<<:response => ${url}`);
        break;
      case "/api/post":
        // 这边处理一下，避免服务端做两次逻辑处理
        if (req.method === "OPTIONS") {
          res.end("true");
        } else {
          res.writeHead(200, {
            "Set-Cookie": "name=zhongxia"
          });
          res.end(
            JSON.stringify({ data: { name: "zhongxia" }, success: true })
          );
        }
        break;
      default:
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(`Not Found API URL ${url}`);
    }
  })
  .listen(8888);

// 终端打印如下信息
console.log("Server running at http://127.0.0.1:8888/");
