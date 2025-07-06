
白屏的是这个界面：http://localhost:3001/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MDAwNjAsImV4cCI6MTc1MjQwNDg2MH0.fsSvR1LVBKUHlyQhO1hTYnS2xg0qNfnJC2kpS9WwRmI&refresh=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MDAwNjAsImV4cCI6MTc1NDM5MjA2MH0.PnNpJbrVjLxgY_izdeU--pRuLklsvvC5KHCJFwch7Ns

chunk-NXESFFTV.js?v=7f606430:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
tokenManager.ts:300 Stored access token is expired
tokenManager.ts:305 Tokens loaded from storage
rbac.ts:180 RBAC system initialized with default roles and permissions
index.ts:37 Uncaught ReferenceError: useAuthStore is not defined
    at useAuth (index.ts:37:52)
    at OAuthCallback (OAuthCallback.tsx:8:21)
    at renderWithHooks (chunk-NXESFFTV.js?v=7f606430:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=7f606430:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=7f606430:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=7f606430:15966:22)
    at HTMLUnknownElement.callCallback2 (chunk-NXESFFTV.js?v=7f606430:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-NXESFFTV.js?v=7f606430:3705:24)
    at invokeGuardedCallback (chunk-NXESFFTV.js?v=7f606430:3739:39)
    at beginWork$1 (chunk-NXESFFTV.js?v=7f606430:19818:15)
useAuth @ index.ts:37
OAuthCallback @ OAuthCallback.tsx:8
renderWithHooks @ chunk-NXESFFTV.js?v=7f606430:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=7f606430:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=7f606430:14881
beginWork @ chunk-NXESFFTV.js?v=7f606430:15966
callCallback2 @ chunk-NXESFFTV.js?v=7f606430:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=7f606430:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=7f606430:3739
beginWork$1 @ chunk-NXESFFTV.js?v=7f606430:19818
performUnitOfWork @ chunk-NXESFFTV.js?v=7f606430:19251
workLoopConcurrent @ chunk-NXESFFTV.js?v=7f606430:19242
renderRootConcurrent @ chunk-NXESFFTV.js?v=7f606430:19217
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=7f606430:18728
workLoop @ chunk-NXESFFTV.js?v=7f606430:197
flushWork @ chunk-NXESFFTV.js?v=7f606430:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=7f606430:384
index.ts:37 Uncaught ReferenceError: useAuthStore is not defined
    at useAuth (index.ts:37:52)
    at OAuthCallback (OAuthCallback.tsx:8:21)
    at renderWithHooks (chunk-NXESFFTV.js?v=7f606430:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=7f606430:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=7f606430:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=7f606430:15966:22)
    at HTMLUnknownElement.callCallback2 (chunk-NXESFFTV.js?v=7f606430:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-NXESFFTV.js?v=7f606430:3705:24)
    at invokeGuardedCallback (chunk-NXESFFTV.js?v=7f606430:3739:39)
    at beginWork$1 (chunk-NXESFFTV.js?v=7f606430:19818:15)
useAuth @ index.ts:37
OAuthCallback @ OAuthCallback.tsx:8
renderWithHooks @ chunk-NXESFFTV.js?v=7f606430:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=7f606430:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=7f606430:14881
beginWork @ chunk-NXESFFTV.js?v=7f606430:15966
callCallback2 @ chunk-NXESFFTV.js?v=7f606430:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=7f606430:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=7f606430:3739
beginWork$1 @ chunk-NXESFFTV.js?v=7f606430:19818
performUnitOfWork @ chunk-NXESFFTV.js?v=7f606430:19251
workLoopSync @ chunk-NXESFFTV.js?v=7f606430:19190
renderRootSync @ chunk-NXESFFTV.js?v=7f606430:19169
recoverFromConcurrentError @ chunk-NXESFFTV.js?v=7f606430:18786
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=7f606430:18734
workLoop @ chunk-NXESFFTV.js?v=7f606430:197
flushWork @ chunk-NXESFFTV.js?v=7f606430:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=7f606430:384
chunk-NXESFFTV.js?v=7f606430:14080 The above error occurred in the <OAuthCallback> component:

    at OAuthCallback (http://localhost:3001/src/pages/auth/OAuthCallback.tsx?t=1751800011256:24:20)
    at Suspense
    at LazyWrapper (http://localhost:3001/src/router/lazyRoutes.tsx?t=1751800011256:19:24)
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
chunk-NXESFFTV.js?v=7f606430:19466 Uncaught ReferenceError: useAuthStore is not defined
    at useAuth (index.ts:37:52)
    at OAuthCallback (OAuthCallback.tsx:8:21)
    at renderWithHooks (chunk-NXESFFTV.js?v=7f606430:11596:26)
    at updateFunctionComponent (chunk-NXESFFTV.js?v=7f606430:14630:28)
    at mountLazyComponent (chunk-NXESFFTV.js?v=7f606430:14881:23)
    at beginWork (chunk-NXESFFTV.js?v=7f606430:15966:22)
    at beginWork$1 (chunk-NXESFFTV.js?v=7f606430:19806:22)
    at performUnitOfWork (chunk-NXESFFTV.js?v=7f606430:19251:20)
    at workLoopSync (chunk-NXESFFTV.js?v=7f606430:19190:13)
    at renderRootSync (chunk-NXESFFTV.js?v=7f606430:19169:15)
useAuth @ index.ts:37
OAuthCallback @ OAuthCallback.tsx:8
renderWithHooks @ chunk-NXESFFTV.js?v=7f606430:11596
updateFunctionComponent @ chunk-NXESFFTV.js?v=7f606430:14630
mountLazyComponent @ chunk-NXESFFTV.js?v=7f606430:14881
beginWork @ chunk-NXESFFTV.js?v=7f606430:15966
beginWork$1 @ chunk-NXESFFTV.js?v=7f606430:19806
performUnitOfWork @ chunk-NXESFFTV.js?v=7f606430:19251
workLoopSync @ chunk-NXESFFTV.js?v=7f606430:19190
renderRootSync @ chunk-NXESFFTV.js?v=7f606430:19169
recoverFromConcurrentError @ chunk-NXESFFTV.js?v=7f606430:18786
performConcurrentWorkOnRoot @ chunk-NXESFFTV.js?v=7f606430:18734
workLoop @ chunk-NXESFFTV.js?v=7f606430:197
flushWork @ chunk-NXESFFTV.js?v=7f606430:176
performWorkUntilDeadline @ chunk-NXESFFTV.js?v=7f606430:384
