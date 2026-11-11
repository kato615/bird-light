const CACHE_NAME = 'niaoyuguang-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装：缓存基础资源
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活：删掉旧版本的缓存
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败时回退到缓存（解决“改了页面看不到新版”的问题）
self.addEventListener('fetch', function (e) {
  // 只处理同源的 GET 请求
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(function (response) {
        // 联网成功：顺便更新缓存
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(function () {
        // 联网失败：从缓存里拿
        return caches.match(e.request).then(function (cached) {
          if (cached) return cached;
          // 如果连缓存都没有，回退到主页（离线兜底）
          return caches.match('./index.html');
        });
      })
  );
});