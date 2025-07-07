chunk-NXESFFTV.js?v=85a348f2:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
tokenManager.ts:300 Stored access token is expired
tokenManager.ts:305 Tokens loaded from storage
rbac.ts:180 RBAC system initialized with default roles and permissions
sqliteManager.ts:73 SQLite数据库仅在Tauri环境中可用，当前运行在Web环境中
SQLiteManager @ sqliteManager.ts:73
（匿名） @ sqliteManager.ts:794
login.tsx:309 Uncaught ReferenceError: Link is not defined
    at Login (login.tsx:309:16)
    at renderWithHooks (chunk-NXESFFTV.js?v=85a348f2:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=85a348f2:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=85a348f2:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=85a348f2:15966:22)
    at HTMLUnknownElement.callCallback2 (chunk-NXESFFTV.js?v=85a348f2:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-NXESFFTV.js?v=85a348f2:3705:24)
    at invokeGuardedCallback (chunk-NXESFFTV.js?v=85a348f2:3739:39)
    at beginWork$1 (chunk-NXESFFTV.js?v=85a348f2:19818:15)
    at performUnitOfWork (chunk-NXESFFTV.js?v=85a348f2:19251:20)
Login @ login.tsx:309
renderWithHooks @ chunk-NXESFFTV.js?v=85a348f2:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=85a348f2:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=85a348f2:14881
beginWork @ chunk-NXESFFTV.js?v=85a348f2:15966
callCallback2 @ chunk-NXESFFTV.js?v=85a348f2:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=85a348f2:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=85a348f2:3739
beginWork$1 @ chunk-NXESFFTV.js?v=85a348f2:19818
performUnitOfWork @ chunk-NXESFFTV.js?v=85a348f2:19251
workLoopConcurrent @ chunk-NXESFFTV.js?v=85a348f2:19242
renderRootConcurrent @ chunk-NXESFFTV.js?v=85a348f2:19217
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=85a348f2:18728
workLoop @ chunk-NXESFFTV.js?v=85a348f2:197
flushWork @ chunk-NXESFFTV.js?v=85a348f2:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=85a348f2:384
login.tsx:309 Uncaught ReferenceError: Link is not defined
    at Login (login.tsx:309:16)
    at renderWithHooks (chunk-NXESFFTV.js?v=85a348f2:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=85a348f2:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=85a348f2:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=85a348f2:15966:22)
    at HTMLUnknownElement.callCallback2 (chunk-NXESFFTV.js?v=85a348f2:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-NXESFFTV.js?v=85a348f2:3705:24)
    at invokeGuardedCallback (chunk-NXESFFTV.js?v=85a348f2:3739:39)
    at beginWork$1 (chunk-NXESFFTV.js?v=85a348f2:19818:15)
    at performUnitOfWork (chunk-NXESFFTV.js?v=85a348f2:19251:20)
Login @ login.tsx:309
renderWithHooks @ chunk-NXESFFTV.js?v=85a348f2:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=85a348f2:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=85a348f2:14881
beginWork @ chunk-NXESFFTV.js?v=85a348f2:15966
callCallback2 @ chunk-NXESFFTV.js?v=85a348f2:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=85a348f2:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=85a348f2:3739
beginWork$1 @ chunk-NXESFFTV.js?v=85a348f2:19818
performUnitOfWork @ chunk-NXESFFTV.js?v=85a348f2:19251
workLoopSync @ chunk-NXESFFTV.js?v=85a348f2:19190
renderRootSync @ chunk-NXESFFTV.js?v=85a348f2:19169
recoverFromConcurrentError @ chunk-NXESFFTV.js?v=85a348f2:18786
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=85a348f2:18734
workLoop @ chunk-NXESFFTV.js?v=85a348f2:197
flushWork @ chunk-NXESFFTV.js?v=85a348f2:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=85a348f2:384
chunk-NXESFFTV.js?v=85a348f2:14080 The above error occurred in the <Login> component:

    at Login (http://localhost:3001/src/pages/auth/login.tsx:27:20)
    at Suspense
    at LazyWrapper (http://localhost:3001/src/router/lazyRoutes.tsx:19:24)
    at main
    at div
    at div
    at div
    at MainLayout (http://localhost:3001/src/components/layout/MainLayout.tsx?t=1751919990796:27:3)
    at RenderedRoute (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=85a348f2:5455:26)
    at Routes (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=85a348f2:6188:3)
    at AppInitializer (http://localhost:3001/src/components/app/AppInitializer.tsx:24:27)
    at Router (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=85a348f2:6131:13)
    at BrowserRouter (http://localhost:3001/node_modules/.vite/deps/react-router-dom.js?v=85a348f2:9149:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-NXESFFTV.js?v=85a348f2:14080
update.callback @ chunk-NXESFFTV.js?v=85a348f2:14100
callCallback @ chunk-NXESFFTV.js?v=85a348f2:11296
commitUpdateQueue @ chunk-NXESFFTV.js?v=85a348f2:11313
commitLayoutEffectOnFiber @ chunk-NXESFFTV.js?v=85a348f2:17141
commitLayoutMountEffects_complete @ chunk-NXESFFTV.js?v=85a348f2:18030
commitLayoutEffects_begin @ chunk-NXESFFTV.js?v=85a348f2:18019
commitLayoutEffects @ chunk-NXESFFTV.js?v=85a348f2:17970
commitRootImpl @ chunk-NXESFFTV.js?v=85a348f2:19406
commitRoot @ chunk-NXESFFTV.js?v=85a348f2:19330
finishConcurrentRender @ chunk-NXESFFTV.js?v=85a348f2:18813
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=85a348f2:18768
workLoop @ chunk-NXESFFTV.js?v=85a348f2:197
flushWork @ chunk-NXESFFTV.js?v=85a348f2:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=85a348f2:384
chunk-NXESFFTV.js?v=85a348f2:19466 Uncaught ReferenceError: Link is not defined
    at Login (login.tsx:309:16)
    at renderWithHooks (chunk-NXESFFTV.js?v=85a348f2:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=85a348f2:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=85a348f2:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=85a348f2:15966:22)
    at beginWork$1 (chunk-NXESFFTV.js?v=85a348f2:19806:22)
    at performUnitOfWork (chunk-NXESFFTV.js?v=85a348f2:19251:20)
    at workLoopSync (chunk-NXESFFTV.js?v=85a348f2:19190:13)
    at renderRootSync (chunk-NXESFFTV.js?v=85a348f2:19169:15)
    at recoverFromConcurrentError (chunk-NXESFFTV.js?v=85a348f2:18786:28)
Login @ login.tsx:309
renderWithHooks @ chunk-NXESFFTV.js?v=85a348f2:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=85a348f2:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=85a348f2:14881
beginWork @ chunk-NXESFFTV.js?v=85a348f2:15966
beginWork$1 @ chunk-NXESFFTV.js?v=85a348f2:19806
performUnitOfWork @ chunk-NXESFFTV.js?v=85a348f2:19251
workLoopSync @ chunk-NXESFFTV.js?v=85a348f2:19190
renderRootSync @ chunk-NXESFFTV.js?v=85a348f2:19169
recoverFromConcurrentError @ chunk-NXESFFTV.js?v=85a348f2:18786
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=85a348f2:18734
workLoop @ chunk-NXESFFTV.js?v=85a348f2:197
flushWork @ chunk-NXESFFTV.js?v=85a348f2:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=85a348f2:384
