curl 'http://localhost:3001/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE3OTk1OTcsImV4cCI6MTc1MjQwNDM5N30.xhue51sIk-t6XBd7uoN9sQZXSEffEIEpl5E4mxVpE0A&refresh=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE3OTk1OTcsImV4cCI6MTc1NDM5MTU5N30.HT3X93N7EA0zkpnMWerhbEj00wzs8w7dOb82nrmzzQY' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://127.0.0.1:3001/' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'

  chunk-NXESFFTV.js?v=7f606430:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
tokenManager.ts:300 Stored access token is expired
tokenManager.ts:305 Tokens loaded from storage
rbac.ts:180 RBAC system initialized with default roles and permissions
lazyRoutes.tsx:21  GET http://localhost:3001/src/pages/auth/OAuthCallback.tsx net::ERR_ABORTED 500 (Internal Server Error)
_c12 @ lazyRoutes.tsx:21
lazyInitializer @ chunk-DRWLMN53.js?v=7f606430:869
mountLazyComponent @ chunk-NXESFFTV.js?v=7f606430:14870
beginWork @ chunk-NXESFFTV.js?v=7f606430:15966
beginWork$1 @ chunk-NXESFFTV.js?v=7f606430:19806
performUnitOfWork @ chunk-NXESFFTV.js?v=7f606430:19251
workLoopSync @ chunk-NXESFFTV.js?v=7f606430:19190
renderRootSync @ chunk-NXESFFTV.js?v=7f606430:19169
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=7f606430:18728
workLoop @ chunk-NXESFFTV.js?v=7f606430:197
flushWork @ chunk-NXESFFTV.js?v=7f606430:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=7f606430:384
chunk-DRWLMN53.js?v=7f606430:903 Uncaught TypeError: Failed to fetch dynamically imported module: http://localhost:3001/src/pages/auth/OAuthCallback.tsx
chunk-DRWLMN53.js?v=7f606430:903 Uncaught TypeError: Failed to fetch dynamically imported module: http://localhost:3001/src/pages/auth/OAuthCallback.tsx
chunk-NXESFFTV.js?v=7f606430:14080 The above error occurred in one of your React components:

    at Lazy
    at Suspense
    at LazyWrapper (http://localhost:3001/src/router/lazyRoutes.tsx:19:24)
    at RenderedRoute (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=7f606430:5455:26)
    at Routes (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=7f606430:6188:3)
    at main
    at div
    at div
    at div
    at MainLayout (http://localhost:3001/src/components/layout/MainLayout.tsx:27:3)
    at AppInitializer (http://localhost:3001/src/components/app/AppInitializer.tsx:25:27)
    at Router (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=7f606430:6131:13)
    at BrowserRouter (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=7f606430:9149:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-NXESFFTV.js?v=7f606430:14080
update.callback @ chunk-NXESFFTV.js?v=7f606430:14100
callCallback @ chunk-NXESFFTV.js?v=7f606430:11296
commitUpdateQueue @ chunk-NXESFFTV.js?v=7f606430:11313
commitLayoutEffectOnFiber @ chunk-NXESFFTV.js?v=7f606430:17141
commitLayoutMountEffects_complete @ chunk-NXESFFTV.js?v=7f606430:18030
commitLayoutEffects_begin @ chunk-NXESFFTV.js?v=7f606430:18019
commitLayoutEffects @ chunk-NXESFFTV.js?v=7f606430:17970
commitRootImpl @ chunk-NXESFFTV.js?v=7f606430:19406
commitRoot @ chunk-NXESFFTV.js?v=7f606430:19330
finishConcurrentRender @ chunk-NXESFFTV.js?v=7f606430:18813
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=7f606430:18768
workLoop @ chunk-NXESFFTV.js?v=7f606430:197
flushWork @ chunk-NXESFFTV.js?v=7f606430:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=7f606430:384
chunk-NXESFFTV.js?v=7f606430:19466 Uncaught TypeError: Failed to fetch dynamically imported module: http://localhost:3001/src/pages/auth/OAuthCallback.tsx
