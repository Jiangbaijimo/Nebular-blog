react-dom.development.js:29895 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
rbac.ts:180 RBAC system initialized with default roles and permissions
tokenManager.ts:278 Stored access token is expired
tokenManager.ts:283 Tokens loaded from storage
sqliteManager.ts:80  SQLite数据库初始化失败: TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (core.js:190:39)
    at _Database.load (index.js:32:29)
    at SQLiteManager.initialize (sqliteManager.ts:72:32)
    at new SQLiteManager (sqliteManager.ts:66:29)
    at sqliteManager.ts:770:30
initialize @ sqliteManager.ts:80
await in initialize
SQLiteManager @ sqliteManager.ts:66
(匿名) @ sqliteManager.ts:770
core.js:190  Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (core.js:190:39)
    at _Database.load (index.js:32:29)
    at SQLiteManager.initialize (sqliteManager.ts:72:32)
    at new SQLiteManager (sqliteManager.ts:66:29)
    at sqliteManager.ts:770:30
invoke @ core.js:190
load @ index.js:32
initialize @ sqliteManager.ts:72
SQLiteManager @ sqliteManager.ts:66
(匿名) @ sqliteManager.ts:770
offlineCacheService.ts:50  离线缓存服务初始化失败: TypeError: sqliteManager.execute is not a function
    at OfflineCacheService.initializeCacheTable (offlineCacheService.ts:67:25)
    at OfflineCacheService.initialize (offlineCacheService.ts:39:18)
    at fetchData (HomePage.tsx:23:35)
    at HomePage.tsx:42:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at commitPassiveMountOnFiber (react-dom.development.js:24965:13)
    at commitPassiveMountEffects_complete (react-dom.development.js:24930:9)
    at commitPassiveMountEffects_begin (react-dom.development.js:24917:7)
    at commitPassiveMountEffects (react-dom.development.js:24905:3)
    at flushPassiveEffectsImpl (react-dom.development.js:27078:3)
initialize @ offlineCacheService.ts:50
await in initialize
fetchData @ HomePage.tsx:23
(匿名) @ HomePage.tsx:42
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
(匿名) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
offlineCacheService.ts:50  离线缓存服务初始化失败: TypeError: sqliteManager.execute is not a function
    at OfflineCacheService.initializeCacheTable (offlineCacheService.ts:67:25)
    at OfflineCacheService.initialize (offlineCacheService.ts:39:18)
    at fetchData (HomePage.tsx:23:35)
    at HomePage.tsx:42:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at invokePassiveEffectMountInDEV (react-dom.development.js:25193:13)
    at invokeEffectsInDev (react-dom.development.js:27390:11)
    at commitDoubleInvokeEffectsInDEV (react-dom.development.js:27369:7)
    at flushPassiveEffectsImpl (react-dom.development.js:27095:5)
    at flushPassiveEffects (react-dom.development.js:27023:14)
initialize @ offlineCacheService.ts:50
await in initialize
fetchData @ HomePage.tsx:23
(匿名) @ HomePage.tsx:42
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
(匿名) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
HomePage.tsx:35  Failed to fetch data: TypeError: sqliteManager.execute is not a function
    at OfflineCacheService.initializeCacheTable (offlineCacheService.ts:67:25)
    at OfflineCacheService.initialize (offlineCacheService.ts:39:18)
    at fetchData (HomePage.tsx:23:35)
    at HomePage.tsx:42:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at commitPassiveMountOnFiber (react-dom.development.js:24965:13)
    at commitPassiveMountEffects_complete (react-dom.development.js:24930:9)
    at commitPassiveMountEffects_begin (react-dom.development.js:24917:7)
    at commitPassiveMountEffects (react-dom.development.js:24905:3)
    at flushPassiveEffectsImpl (react-dom.development.js:27078:3)
fetchData @ HomePage.tsx:35
await in fetchData
(匿名) @ HomePage.tsx:42
commitHookEffectListMount @ react-dom.development.js:23189
commitPassiveMountOnFiber @ react-dom.development.js:24965
commitPassiveMountEffects_complete @ react-dom.development.js:24930
commitPassiveMountEffects_begin @ react-dom.development.js:24917
commitPassiveMountEffects @ react-dom.development.js:24905
flushPassiveEffectsImpl @ react-dom.development.js:27078
flushPassiveEffects @ react-dom.development.js:27023
(匿名) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
HomePage.tsx:35  Failed to fetch data: TypeError: sqliteManager.execute is not a function
    at OfflineCacheService.initializeCacheTable (offlineCacheService.ts:67:25)
    at OfflineCacheService.initialize (offlineCacheService.ts:39:18)
    at fetchData (HomePage.tsx:23:35)
    at HomePage.tsx:42:5
    at commitHookEffectListMount (react-dom.development.js:23189:26)
    at invokePassiveEffectMountInDEV (react-dom.development.js:25193:13)
    at invokeEffectsInDev (react-dom.development.js:27390:11)
    at commitDoubleInvokeEffectsInDEV (react-dom.development.js:27369:7)
    at flushPassiveEffectsImpl (react-dom.development.js:27095:5)
    at flushPassiveEffects (react-dom.development.js:27023:14)
fetchData @ HomePage.tsx:35
await in fetchData
(匿名) @ HomePage.tsx:42
commitHookEffectListMount @ react-dom.development.js:23189
invokePassiveEffectMountInDEV @ react-dom.development.js:25193
invokeEffectsInDev @ react-dom.development.js:27390
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:27369
flushPassiveEffectsImpl @ react-dom.development.js:27095
flushPassiveEffects @ react-dom.development.js:27023
(匿名) @ react-dom.development.js:26808
workLoop @ scheduler.development.js:266
flushWork @ scheduler.development.js:239
performWorkUntilDeadline @ scheduler.development.js:533
[新] 使用 Edge 中的 Copilot 来解释控制台错误: 单击
         
         以说明错误。
        了解更多信息
        不再显示
