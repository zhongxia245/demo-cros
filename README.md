# CROS 跨域问题详解

总结一下这篇文章的大概内容？

1. 为什么会有跨域问题？
2. 如何解决跨域问题？
3. CROS 为什么能解决跨域？
   1. 简单请求
   2. 预检请求
4. 带凭证的请求，如何设置？
   1. 服务端如何在跨域请求时，往自己域名写入 cookie
   2. 客户端请求如何带上接口域名下的 cookie



## 一、为什么会有跨域问题？

> 浏览器为了保证用户信息安全，所有的浏览器都遵循同源策略。

现在大部分网站登录后，都会在浏览器 cookie 存一个标识，标识这个用户。 如果没有同源策略，我自己做一个页面，然后随便去拿其他网站的 cookie，然后伪装成这个用户，做一些恶意操作（发布不良消息，提现，删除好友，七七八八的）， 这样就很不安全了。



### 1.1、同源策略是什么？

> 协议、域名、端口号完全相同时，才是同源



### 1.2、同源策略限制了哪些内容？

1. cookie，local storage ,indexDB 无法读取

2. DOM 无法获取

3. Ajax 请求无法获取

   浏览器会发送请求，服务端也会收到请求，并处理完成返回数据，只是返回后，浏览器发现请求头并没有说明这个接口允许该域名去请求，因此给拦截掉，并报错。【Chrome 浏览器的机制是这样的】



## 二、如何解决跨域问题？

解决跨域的方法有很多，但是最常用的是现在的 CROS, 和早期的 JSONP。

1. CROS 【下文会详细讲】

2. JSONP

   利用 html 中，script 资源请求不存在跨域的问题，然后去做接口请求。然后把数据放在回调函数的参数内。



### 2.1、CROS 的跨域原理

CORS跨域的原理实际上是浏览器与服务器通过一些HTTP协议头来做一些约定和限制。可以查看 [HTTP访问控制（CORS）](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)



**与跨域相关的协议头**

![img](http://asset.izhongxia.com/ipic/2019-11-14-065520.jpg)



## 三、CROS 为什么能解决跨域

Chrome 浏览器跨域的报错是这样的，见下图

![image-20191114114835143](http://asset.izhongxia.com/ipic/2019-11-14-065518.png)



### 3.1、为什么设置了 CROS 可以跨域呢？

跨域请求，并不是浏览器没有发出请求，而是浏览器发出请求了，服务端也返回了数据，但是返回到浏览器后，被浏览器拦截了。【Chrome 浏览器下是如此】



通过设置响应头，告诉浏览器，该资源可以吐给指定的 origin。

`Access-Control-Allow-Origin` 响应头指定了该响应的资源是否被允许与给定的origin共享。



```js
// 加上允许跨域请求的地址
res.setHeader("Access-Control-Allow-Origin", "http://192.168.10.8:8080");
```





### 3.2、简单请求和预检请求

简单请求，只需要设置了 ``Access-Control-Allow-Origin`` 即可完成跨域请求。



那么什么是简单请求呢？

1. GET  / HEAD

2. POST 并且Content-Type的值在下列之一： 

   ```text
   - text/plain
   - multipart/form-data
   - application/x-www-form-urlencoded
   ```

3. 并且请求头中只有下面这些

   ```text
   - Accept
   - Accept-Language
   - Content-Language
   - Content-Type （需要注意额外的限制）
   - DPR
   - Downlink
   - Save-Data
   - Viewport-Width
   - Width
   ```

> content-type: "application/json" 这个就不是简单请求了。



### 3.3、预检请求有什么不一样？

预检请求就是先发一个请求到服务端，问我发一个非常规请求，你可以处理吗？



<img src="http://asset.izhongxia.com/ipic/2019-11-14-065725.png" alt="image-20191114145723213" style="zoom:50%;" />



这个预检请求的作用在这里就是告诉服务器：我会在后面请求的请求头中以POST方法发送数据类型是application/json的请求，询问服务器是否允许。



服务端如何没有做任何处理的时候，会报这个错误。

![image-20191114145509167](http://asset.izhongxia.com/ipic/2019-11-14-065514.png)



```js
// 这个时候只要在响应头添加一个 Access-Control-Allow-Headers = content-type 即可
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
```



有个问题，做预检请求的时候，浏览器会发出两个同样地址请求，一个 OPTIONS 和 一个 POST 的请求。

预检请求发送到服务端，如果没有处理的请求下，服务端还是会去走一整套的流程，从数据库那数据，处理，在返回。

<img src="http://asset.izhongxia.com/ipic/2019-11-14-070240.png" alt="image-20191114150237589" style="zoom: 67%;" />



如何避免服务端做重复处理呢？

```js
case "/api/post":
  // 这边处理一下，避免服务端做两次逻辑处理
  if (req.method === "OPTIONS") {
    res.end("true");
  } else {
    res.end(
      JSON.stringify({ data: { name: "zhongxia" }, success: true })
    );
  }
  break;
```



## 四、带凭证信息的请求

经过观察发现，跨域请求，并不会带上 cookie

> 注意，这里的 cookie，并不是这个跨域的这个域名，而是会带上接口的那个域名。
>
> 服务端写入 cookie，也是写到 接口的那个域名下。



![image-20191114154256989](http://asset.izhongxia.com/ipic/2019-11-14-074300.png)



服务端写入 cookie,也没用写到 跨域的那个域名下。

<img src="http://asset.izhongxia.com/ipic/2019-11-14-074617.png" alt="image-20191114154613831" style="zoom:50%;" />



### 4.1、 如何让服务端接口能写入 cookie

```js
// 允许跨域的接口请求，往自己域名写入 cookie
res.setHeader("Access-Control-Allow-Credentials", "true");
```



### 4.2、如何让客户端发起请求，能带上 cookie

```js
$.ajax({
    method: "POST",
    url: "http://127.0.0.1:8888/api/post",
    xhrFields: {  
      withCredentials: true   // 加上这个，发送请求，就能带上接口域名下的 cookie
    },
    headers: {
      "Content-Type": "application/json" //告诉服务器实际发送的数据类型
    },
    error: err => {
      console.log(err);
    },
    success: data => {
      $("#result1").html(JSON.stringify(data, null, 2));
    }
});
```



![image-20191114155846790](http://asset.izhongxia.com/ipic/2019-11-14-075850.png)

> 当前域名是 : 127.0.0.1:8888 , 请求的接口域名是：192.168.10.8:8080 ， 存在跨域
>
> 跨域请求带上的 cookie，是接口域名的 cookie。







## 参考文档

1. [《同源策略、跨域、jsonp》](https://www.jianshu.com/p/30d6c94439a2)
2. [《CORS跨域原理浅析》](https://zhuanlan.zhihu.com/p/29980092)

