// Service Worker for Blog App
// 实现缓存策略和离线支持

const CACHE_NAME = 'blog-app-v1';
const STATIC_CACHE = 'blog-static-v1';
const DYNAMIC_CACHE = 'blog-dynamic-v1';
const IMAGE_CACHE = 'blog-images-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html', // 离线页面
];

// 需要缓存的API路径模式
const API_CACHE_PATTERNS = [
  /\/api\/blogs/,
  /\/api\/categories/,
  /\/api\/tags/,
];

// 图片资源模式
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /\/api\/upload\//,
  /\/images\//,
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本的缓存
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 HTTP(S) 请求
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // 跳过 Tauri 相关请求
  if (url.protocol === 'tauri:' || url.hostname === 'tauri.localhost') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// 处理请求的主要逻辑
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. 静态资源 - Cache First 策略
    if (isStaticAsset(request)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // 2. 图片资源 - Cache First 策略
    if (isImageRequest(request)) {
      return await cacheFirst(request, IMAGE_CACHE);
    }
    
    // 3. API 请求 - Network First 策略
    if (isApiRequest(request)) {
      return await networkFirst(request, DYNAMIC_CACHE);
    }
    
    // 4. 其他请求 - Network First 策略
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('Service Worker: Request failed', error);
    
    // 返回离线页面或缓存的响应
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network Error', { status: 503 });
  }
}

// Cache First 策略 - 优先从缓存获取
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 后台更新缓存
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  // 缓存中没有，从网络获取
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    // 缓存响应
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First 策略 - 优先从网络获取
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存响应
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 后台更新缓存
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// 判断是否为静态资源
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.startsWith('/assets/') ||
         url.pathname.startsWith('/js/') ||
         url.pathname.startsWith('/css/');
}

// 判断是否为图片请求
function isImageRequest(request) {
  const url = new URL(request.url);
  return IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// 判断是否为 API 请求
function isApiRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// 监听消息事件
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('All caches cleared');
}

// 缓存指定的 URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
  console.log('URLs cached:', urls);
}

// 定期清理过期缓存
setInterval(async () => {
  try {
    await cleanupExpiredCache();
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // 每24小时清理一次

// 清理过期缓存
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = response.headers.get('date');
        if (cacheDate) {
          const age = Date.now() - new Date(cacheDate).getTime();
          // 删除超过7天的缓存
          if (age > 7 * 24 * 60 * 60 * 1000) {
            await cache.delete(request);
            console.log('Deleted expired cache:', request.url);
          }
        }
      }
    }
  }
}

console.log('Service Worker: Loaded');