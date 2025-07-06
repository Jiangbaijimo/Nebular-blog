chunk-NXESFFTV.js?v=7f606430:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
tokenManager.ts:300 Stored access token is expired
tokenManager.ts:305 Tokens loaded from storage
rbac.ts:180 RBAC system initialized with default roles and permissions
OAuthCallback.tsx:32 开始处理 OAuth 回调
tokenManager.ts:353 Tokens saved to storage
tokenManager.ts:255 Auto refresh scheduled in 604499 seconds
tokenManager.ts:53 Tokens set successfully
oauthService.ts:129 OAuth认证成功: {user: 'xiaoshenming'}
http.ts:428 setAuthTokens called with: {accessToken: 'exists', refreshToken: 'exists', expiresAt: '2025-07-13T16:35:44.789Z'}
http.ts:445 Setting access token with expiresIn: 604799
http.ts:66 TokenManager.setAccessToken called with: {token: 'exists', expiresIn: 604799}
http.ts:75 After setStorageItem, localStorage access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTk3NDQsImV4cCI6MTc1MjQyNDU0NH0.KWZiTk-6qz4FUIXX4JVhgrytOhNE5raULiiCTbEjuYM
http.ts:76 After setStorageItem, getStorageItem result: undefined
http.ts:60 TokenManager.getAccessToken() called, token: exists
http.ts:61 localStorage access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTk3NDQsImV4cCI6MTc1MjQyNDU0NH0.KWZiTk-6qz4FUIXX4JVhgrytOhNE5raULiiCTbEjuYM
http.ts:450 Token verification after setting: exists
OAuthCallback.tsx:41 准备重定向到: /
tokenManager.ts:353 Tokens saved to storage
tokenManager.ts:255 Auto refresh scheduled in 604499 seconds
tokenManager.ts:53 Tokens set successfully
sqliteManager.ts:73 SQLite数据库仅在Tauri环境中可用，当前运行在Web环境中
SQLiteManager @ sqliteManager.ts:73
（匿名） @ sqliteManager.ts:794
http.ts:60 TokenManager.getAccessToken() called, token: exists
http.ts:61 localStorage access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTk3NDQsImV4cCI6MTc1MjQyNDU0NH0.KWZiTk-6qz4FUIXX4JVhgrytOhNE5raULiiCTbEjuYM
http.ts:158 Request interceptor - token from TokenManager: exists
http.ts:161 Authorization header set: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTk3NDQsImV4cCI6MTc1MjQyNDU0NH0.KWZiTk-6qz4FUIXX4JVhgrytOhNE5raULiiCTbEjuYM
Header.tsx:151 登出失败: TypeError: tokenManager.clearToken is not a function
    at handleLogout (Header.tsx:148:20)
handleLogout @ Header.tsx:151
await in handleLogout
onClick @ Header.tsx:441
callCallback2 @ chunk-NXESFFTV.js?v=7f606430:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=7f606430:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=7f606430:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-NXESFFTV.js?v=7f606430:3742
executeDispatch @ chunk-NXESFFTV.js?v=7f606430:7046
processDispatchQueueItemsInOrder @ chunk-NXESFFTV.js?v=7f606430:7066
processDispatchQueue @ chunk-NXESFFTV.js?v=7f606430:7075
dispatchEventsForPlugins @ chunk-NXESFFTV.js?v=7f606430:7083
（匿名） @ chunk-NXESFFTV.js?v=7f606430:7206
batchedUpdates$1 @ chunk-NXESFFTV.js?v=7f606430:18966
batchedUpdates @ chunk-NXESFFTV.js?v=7f606430:3585
dispatchEventForPluginEventSystem @ chunk-NXESFFTV.js?v=7f606430:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NXESFFTV.js?v=7f606430:5484
dispatchEvent @ chunk-NXESFFTV.js?v=7f606430:5478
dispatchDiscreteEvent @ chunk-NXESFFTV.js?v=7f606430:5455
tokenManager.ts:377 Tokens removed from storage
tokenManager.ts:159 Tokens cleared successfully

curl 'http://localhost:3001/api/auth/logout' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTk3NDQsImV4cCI6MTc1MjQyNDU0NH0.KWZiTk-6qz4FUIXX4JVhgrytOhNE5raULiiCTbEjuYM' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3001' \
  -H 'Referer: http://localhost:3001/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'X-Request-ID: 1751819879253-3rfmifxte' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw '{}'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "message": "退出登录成功"
        },
        "message": "操作成功",
        "timestamp": "2025-07-06T16:37:59.579Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-06T16:37:59.579Z"
}