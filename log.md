curl 'http://127.0.0.1:3001/api/auth/login' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://127.0.0.1:3001' \
  -H 'Referer: http://127.0.0.1:3001/auth/login' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'X-Request-ID: 1751748470588-lz6xqqgf4' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw '{"email":"user@example.com","password":"Password123","rememberMe":false}'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "user": {
                "id": 1,
                "email": "user@example.com",
                "username": "username",
                "avatar": null,
                "nickname": "昵称",
                "bio": null,
                "status": "active",
                "provider": "local",
                "providerId": null,
                "emailVerified": false,
                "emailVerificationToken": null,
                "passwordResetToken": null,
                "passwordResetExpires": null,
                "lastLoginAt": "2025-07-05T20:47:28.000Z",
                "lastLoginIp": null,
                "roles": [
                    {
                        "id": 1,
                        "name": "超级管理员",
                        "code": "admin",
                        "description": "系统超级管理员，拥有所有权限",
                        "isActive": true,
                        "isSystem": true,
                        "permissions": [
                            {
                                "id": 1,
                                "name": "创建用户",
                                "code": "CREATE_USER",
                                "action": "create",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.577Z",
                                "updatedAt": "2025-07-05T17:05:06.577Z"
                            },
                            {
                                "id": 2,
                                "name": "查看用户",
                                "code": "READ_USER",
                                "action": "read",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.598Z",
                                "updatedAt": "2025-07-05T17:05:06.598Z"
                            },
                            {
                                "id": 3,
                                "name": "更新用户",
                                "code": "UPDATE_USER",
                                "action": "update",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.608Z",
                                "updatedAt": "2025-07-05T17:05:06.608Z"
                            },
                            {
                                "id": 4,
                                "name": "删除用户",
                                "code": "DELETE_USER",
                                "action": "delete",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.617Z",
                                "updatedAt": "2025-07-05T17:05:06.617Z"
                            },
                            {
                                "id": 5,
                                "name": "管理用户",
                                "code": "MANAGE_USER",
                                "action": "manage",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.626Z",
                                "updatedAt": "2025-07-05T17:05:06.626Z"
                            },
                            {
                                "id": 6,
                                "name": "创建博客",
                                "code": "CREATE_BLOG",
                                "action": "create",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.634Z",
                                "updatedAt": "2025-07-05T17:05:06.634Z"
                            },
                            {
                                "id": 7,
                                "name": "查看博客",
                                "code": "READ_BLOG",
                                "action": "read",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.643Z",
                                "updatedAt": "2025-07-05T17:05:06.643Z"
                            },
                            {
                                "id": 8,
                                "name": "更新博客",
                                "code": "UPDATE_BLOG",
                                "action": "update",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.652Z",
                                "updatedAt": "2025-07-05T17:05:06.652Z"
                            },
                            {
                                "id": 9,
                                "name": "删除博客",
                                "code": "DELETE_BLOG",
                                "action": "delete",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.661Z",
                                "updatedAt": "2025-07-05T17:05:06.661Z"
                            },
                            {
                                "id": 10,
                                "name": "管理博客",
                                "code": "MANAGE_BLOG",
                                "action": "manage",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.672Z",
                                "updatedAt": "2025-07-05T17:05:06.672Z"
                            },
                            {
                                "id": 11,
                                "name": "创建分类",
                                "code": "CREATE_CATEGORY",
                                "action": "create",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.680Z",
                                "updatedAt": "2025-07-05T17:05:06.680Z"
                            },
                            {
                                "id": 12,
                                "name": "查看分类",
                                "code": "READ_CATEGORY",
                                "action": "read",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.688Z",
                                "updatedAt": "2025-07-05T17:05:06.688Z"
                            },
                            {
                                "id": 13,
                                "name": "更新分类",
                                "code": "UPDATE_CATEGORY",
                                "action": "update",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.697Z",
                                "updatedAt": "2025-07-05T17:05:06.697Z"
                            },
                            {
                                "id": 14,
                                "name": "删除分类",
                                "code": "DELETE_CATEGORY",
                                "action": "delete",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.708Z",
                                "updatedAt": "2025-07-05T17:05:06.708Z"
                            },
                            {
                                "id": 15,
                                "name": "管理分类",
                                "code": "MANAGE_CATEGORY",
                                "action": "manage",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.718Z",
                                "updatedAt": "2025-07-05T17:05:06.718Z"
                            },
                            {
                                "id": 16,
                                "name": "创建评论",
                                "code": "CREATE_COMMENT",
                                "action": "create",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.726Z",
                                "updatedAt": "2025-07-05T17:05:06.726Z"
                            },
                            {
                                "id": 17,
                                "name": "查看评论",
                                "code": "READ_COMMENT",
                                "action": "read",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.734Z",
                                "updatedAt": "2025-07-05T17:05:06.734Z"
                            },
                            {
                                "id": 18,
                                "name": "更新评论",
                                "code": "UPDATE_COMMENT",
                                "action": "update",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.741Z",
                                "updatedAt": "2025-07-05T17:05:06.741Z"
                            },
                            {
                                "id": 19,
                                "name": "删除评论",
                                "code": "DELETE_COMMENT",
                                "action": "delete",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.750Z",
                                "updatedAt": "2025-07-05T17:05:06.750Z"
                            },
                            {
                                "id": 20,
                                "name": "管理评论",
                                "code": "MANAGE_COMMENT",
                                "action": "manage",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.758Z",
                                "updatedAt": "2025-07-05T17:05:06.758Z"
                            },
                            {
                                "id": 21,
                                "name": "创建角色",
                                "code": "CREATE_ROLE",
                                "action": "create",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.767Z",
                                "updatedAt": "2025-07-05T17:05:06.767Z"
                            },
                            {
                                "id": 22,
                                "name": "查看角色",
                                "code": "READ_ROLE",
                                "action": "read",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.774Z",
                                "updatedAt": "2025-07-05T17:05:06.774Z"
                            },
                            {
                                "id": 23,
                                "name": "更新角色",
                                "code": "UPDATE_ROLE",
                                "action": "update",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.783Z",
                                "updatedAt": "2025-07-05T17:05:06.783Z"
                            },
                            {
                                "id": 24,
                                "name": "删除角色",
                                "code": "DELETE_ROLE",
                                "action": "delete",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.792Z",
                                "updatedAt": "2025-07-05T17:05:06.792Z"
                            },
                            {
                                "id": 25,
                                "name": "管理角色",
                                "code": "MANAGE_ROLE",
                                "action": "manage",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.800Z",
                                "updatedAt": "2025-07-05T17:05:06.800Z"
                            },
                            {
                                "id": 26,
                                "name": "创建权限",
                                "code": "CREATE_PERMISSION",
                                "action": "create",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.807Z",
                                "updatedAt": "2025-07-05T17:05:06.807Z"
                            },
                            {
                                "id": 27,
                                "name": "查看权限",
                                "code": "READ_PERMISSION",
                                "action": "read",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.816Z",
                                "updatedAt": "2025-07-05T17:05:06.816Z"
                            },
                            {
                                "id": 28,
                                "name": "更新权限",
                                "code": "UPDATE_PERMISSION",
                                "action": "update",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.824Z",
                                "updatedAt": "2025-07-05T17:05:06.824Z"
                            },
                            {
                                "id": 29,
                                "name": "删除权限",
                                "code": "DELETE_PERMISSION",
                                "action": "delete",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.833Z",
                                "updatedAt": "2025-07-05T17:05:06.833Z"
                            },
                            {
                                "id": 30,
                                "name": "管理权限",
                                "code": "MANAGE_PERMISSION",
                                "action": "manage",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.841Z",
                                "updatedAt": "2025-07-05T17:05:06.841Z"
                            },
                            {
                                "id": 31,
                                "name": "系统管理",
                                "code": "MANAGE_SYSTEM",
                                "action": "manage",
                                "resource": "system",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.849Z",
                                "updatedAt": "2025-07-05T17:05:06.849Z"
                            },
                            {
                                "id": 32,
                                "name": "创建云函数",
                                "code": "CREATE_CLOUD_FUNCTION",
                                "action": "create",
                                "resource": "cloud_function",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.856Z",
                                "updatedAt": "2025-07-05T17:05:06.856Z"
                            },
                            {
                                "id": 33,
                                "name": "查看云函数",
                                "code": "READ_CLOUD_FUNCTION",
                                "action": "read",
                                "resource": "cloud_function",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.864Z",
                                "updatedAt": "2025-07-05T17:05:06.864Z"
                            },
                            {
                                "id": 34,
                                "name": "更新云函数",
                                "code": "UPDATE_CLOUD_FUNCTION",
                                "action": "update",
                                "resource": "cloud_function",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.874Z",
                                "updatedAt": "2025-07-05T17:05:06.874Z"
                            },
                            {
                                "id": 35,
                                "name": "删除云函数",
                                "code": "DELETE_CLOUD_FUNCTION",
                                "action": "delete",
                                "resource": "cloud_function",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.880Z",
                                "updatedAt": "2025-07-05T17:05:06.880Z"
                            },
                            {
                                "id": 36,
                                "name": "管理云函数",
                                "code": "MANAGE_CLOUD_FUNCTION",
                                "action": "manage",
                                "resource": "cloud_function",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.888Z",
                                "updatedAt": "2025-07-05T17:05:06.888Z"
                            },
                            {
                                "id": 37,
                                "name": "创建文件",
                                "code": "CREATE_FILE",
                                "action": "create",
                                "resource": "file",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.896Z",
                                "updatedAt": "2025-07-05T17:05:06.896Z"
                            },
                            {
                                "id": 38,
                                "name": "查看文件",
                                "code": "READ_FILE",
                                "action": "read",
                                "resource": "file",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.902Z",
                                "updatedAt": "2025-07-05T17:05:06.902Z"
                            },
                            {
                                "id": 39,
                                "name": "更新文件",
                                "code": "UPDATE_FILE",
                                "action": "update",
                                "resource": "file",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.909Z",
                                "updatedAt": "2025-07-05T17:05:06.909Z"
                            },
                            {
                                "id": 40,
                                "name": "删除文件",
                                "code": "DELETE_FILE",
                                "action": "delete",
                                "resource": "file",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.916Z",
                                "updatedAt": "2025-07-05T17:05:06.916Z"
                            },
                            {
                                "id": 41,
                                "name": "管理文件",
                                "code": "MANAGE_FILE",
                                "action": "manage",
                                "resource": "file",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-05T17:05:06.923Z",
                                "updatedAt": "2025-07-05T17:05:06.923Z"
                            }
                        ],
                        "createdAt": "2025-07-05T17:05:06.938Z",
                        "updatedAt": "2025-07-05T17:05:06.938Z"
                    }
                ],
                "createdAt": "2025-07-05T17:06:31.418Z",
                "updatedAt": "2025-07-05T20:47:27.000Z"
            },
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1MTc0ODQ3MCwiZXhwIjoxNzUyMzUzMjcwfQ.WpyF-1oZlSdtNUE3dNnOgWxCrEey38RYqwyOcsfwknw",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1MTc0ODQ3MCwiZXhwIjoxNzU0MzQwNDcwfQ.mZfOay5ocY1PJSZuRCi8eSKjGV5KH3nPk1C6O5UKQbI",
            "expiresIn": "7d"
        },
        "message": "操作成功",
        "timestamp": "2025-07-05T20:47:50.864Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-05T20:47:50.865Z"
}
chunk-NXESFFTV.js?v=4e7b7b4b:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
rbac.ts:180 RBAC system initialized with default roles and permissions
tokenManager.ts:288 Stored access token is expired
tokenManager.ts:293 Tokens loaded from storage
oauthService.ts:92 Failed to setup OAuth callback listener: TypeError: Cannot read properties of undefined (reading 'transformCallback')
    at transformCallback (core.js?v=4e7b7b4b:72:39)
    at listen (event.js?v=4e7b7b4b:77:18)
    at OAuthService.setupCallbackListener (oauthService.ts:83:30)
    at new OAuthService (oauthService.ts:26:10)
    at OAuthService.getInstance (oauthService.ts:34:31)
    at oauthService.ts:565:35
setupCallbackListener @ oauthService.ts:92
await in setupCallbackListener
OAuthService @ oauthService.ts:26
getInstance @ oauthService.ts:34
（匿名） @ oauthService.ts:565
oauthService.ts:94 OAuth callback listener is not available, OAuth functionality may be limited
setupCallbackListener @ oauthService.ts:94
await in setupCallbackListener
OAuthService @ oauthService.ts:26
getInstance @ oauthService.ts:34
（匿名） @ oauthService.ts:565
tokenManager.ts:288 Stored access token is expired
tokenManager.ts:293 Tokens loaded from storage
tokenManager.ts:288 Stored access token is expired
tokenManager.ts:293 Tokens loaded from storage
tokenManager.ts:327 Failed to save tokens to storage: TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (core.js?v=4e7b7b4b:190:39)
    at TokenManager.saveTokensToStorage (tokenManager.ts:305:15)
    at TokenManager.setTokens (tokenManager.ts:48:18)
    at handleSubmit (Login.tsx:111:26)
saveTokensToStorage @ tokenManager.ts:327
await in saveTokensToStorage
setTokens @ tokenManager.ts:48
handleSubmit @ Login.tsx:111
await in handleSubmit
callCallback2 @ chunk-NXESFFTV.js?v=4e7b7b4b:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=4e7b7b4b:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=4e7b7b4b:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-NXESFFTV.js?v=4e7b7b4b:3742
executeDispatch @ chunk-NXESFFTV.js?v=4e7b7b4b:7046
processDispatchQueueItemsInOrder @ chunk-NXESFFTV.js?v=4e7b7b4b:7066
processDispatchQueue @ chunk-NXESFFTV.js?v=4e7b7b4b:7075
dispatchEventsForPlugins @ chunk-NXESFFTV.js?v=4e7b7b4b:7083
（匿名） @ chunk-NXESFFTV.js?v=4e7b7b4b:7206
batchedUpdates$1 @ chunk-NXESFFTV.js?v=4e7b7b4b:18966
batchedUpdates @ chunk-NXESFFTV.js?v=4e7b7b4b:3585
dispatchEventForPluginEventSystem @ chunk-NXESFFTV.js?v=4e7b7b4b:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NXESFFTV.js?v=4e7b7b4b:5484
dispatchEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5478
dispatchDiscreteEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5455
tokenManager.ts:55 Failed to set tokens: TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (core.js?v=4e7b7b4b:190:39)
    at TokenManager.saveTokensToStorage (tokenManager.ts:305:15)
    at TokenManager.setTokens (tokenManager.ts:48:18)
    at handleSubmit (Login.tsx:111:26)
setTokens @ tokenManager.ts:55
await in setTokens
handleSubmit @ Login.tsx:111
await in handleSubmit
callCallback2 @ chunk-NXESFFTV.js?v=4e7b7b4b:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=4e7b7b4b:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=4e7b7b4b:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-NXESFFTV.js?v=4e7b7b4b:3742
executeDispatch @ chunk-NXESFFTV.js?v=4e7b7b4b:7046
processDispatchQueueItemsInOrder @ chunk-NXESFFTV.js?v=4e7b7b4b:7066
processDispatchQueue @ chunk-NXESFFTV.js?v=4e7b7b4b:7075
dispatchEventsForPlugins @ chunk-NXESFFTV.js?v=4e7b7b4b:7083
（匿名） @ chunk-NXESFFTV.js?v=4e7b7b4b:7206
batchedUpdates$1 @ chunk-NXESFFTV.js?v=4e7b7b4b:18966
batchedUpdates @ chunk-NXESFFTV.js?v=4e7b7b4b:3585
dispatchEventForPluginEventSystem @ chunk-NXESFFTV.js?v=4e7b7b4b:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NXESFFTV.js?v=4e7b7b4b:5484
dispatchEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5478
dispatchDiscreteEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5455
Login.tsx:119 Login failed: TypeError: Cannot read properties of undefined (reading 'invoke')
    at invoke (core.js?v=4e7b7b4b:190:39)
    at TokenManager.saveTokensToStorage (tokenManager.ts:305:15)
    at TokenManager.setTokens (tokenManager.ts:48:18)
    at handleSubmit (Login.tsx:111:26)
handleSubmit @ Login.tsx:119
await in handleSubmit
callCallback2 @ chunk-NXESFFTV.js?v=4e7b7b4b:3680
invokeGuardedCallbackDev @ chunk-NXESFFTV.js?v=4e7b7b4b:3705
invokeGuardedCallback @ chunk-NXESFFTV.js?v=4e7b7b4b:3739
invokeGuardedCallbackAndCatchFirstError @ chunk-NXESFFTV.js?v=4e7b7b4b:3742
executeDispatch @ chunk-NXESFFTV.js?v=4e7b7b4b:7046
processDispatchQueueItemsInOrder @ chunk-NXESFFTV.js?v=4e7b7b4b:7066
processDispatchQueue @ chunk-NXESFFTV.js?v=4e7b7b4b:7075
dispatchEventsForPlugins @ chunk-NXESFFTV.js?v=4e7b7b4b:7083
（匿名） @ chunk-NXESFFTV.js?v=4e7b7b4b:7206
batchedUpdates$1 @ chunk-NXESFFTV.js?v=4e7b7b4b:18966
batchedUpdates @ chunk-NXESFFTV.js?v=4e7b7b4b:3585
dispatchEventForPluginEventSystem @ chunk-NXESFFTV.js?v=4e7b7b4b:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ chunk-NXESFFTV.js?v=4e7b7b4b:5484
dispatchEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5478
dispatchDiscreteEvent @ chunk-NXESFFTV.js?v=4e7b7b4b:5455
