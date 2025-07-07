curl 'http://localhost:3001/api/auth/exchange-code' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3001' \
  -H 'Referer: http://localhost:3001/auth/callback?code=81inmbjqbolc6uq7eds35w' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'X-Request-ID: 1751920300548-q931h0vpj' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw '{"code":"81inmbjqbolc6uq7eds35w"}'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "user": {
                "id": 2,
                "email": "ai-iot04@158100.com",
                "username": "ai-iot04",
                "avatar": "https://avatars.githubusercontent.com/u/218473613?v=4",
                "nickname": "ai-iot04",
                "bio": null,
                "status": "active",
                "provider": "github",
                "providerId": "218473613",
                "emailVerified": true,
                "lastLoginAt": null,
                "lastLoginIp": null,
                "roles": [
                    {
                        "id": 3,
                        "name": "普通用户",
                        "code": "user",
                        "description": "普通用户，可以查看博客、对自己的评论进行增删改查操作",
                        "isActive": true,
                        "isSystem": true,
                        "permissions": [
                            {
                                "id": 7,
                                "name": "查看博客",
                                "code": "READ_BLOG",
                                "action": "read",
                                "resource": "blog",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 12,
                                "name": "查看分类",
                                "code": "READ_CATEGORY",
                                "action": "read",
                                "resource": "category",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 16,
                                "name": "创建评论",
                                "code": "CREATE_COMMENT",
                                "action": "create",
                                "resource": "comment",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 17,
                                "name": "查看评论",
                                "code": "READ_COMMENT",
                                "action": "read",
                                "resource": "comment",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 18,
                                "name": "更新评论",
                                "code": "UPDATE_COMMENT",
                                "action": "update",
                                "resource": "comment",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 19,
                                "name": "删除评论",
                                "code": "DELETE_COMMENT",
                                "action": "delete",
                                "resource": "comment",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 37,
                                "name": "创建文件",
                                "code": "CREATE_FILE",
                                "action": "create",
                                "resource": "file",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 38,
                                "name": "查看文件",
                                "code": "READ_FILE",
                                "action": "read",
                                "resource": "file",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 39,
                                "name": "更新文件",
                                "code": "UPDATE_FILE",
                                "action": "update",
                                "resource": "file",
                                "description": null,
                                "isActive": true
                            },
                            {
                                "id": 40,
                                "name": "删除文件",
                                "code": "DELETE_FILE",
                                "action": "delete",
                                "resource": "file",
                                "description": null,
                                "isActive": true
                            }
                        ]
                    }
                ],
                "createdAt": "2025-07-07T20:27:55.276Z",
                "updatedAt": "2025-07-07T20:27:55.276Z"
            },
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiYWktaW90MDRAMTU4MTAwLmNvbSIsImlhdCI6MTc1MTkyMDMwMCwiZXhwIjoxNzUyNTI1MTAwfQ.J_Ya1dokj-HSmyCAF2FzgcGDqmk0BsLlGaETl_jA7fU",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiYWktaW90MDRAMTU4MTAwLmNvbSIsImlhdCI6MTc1MTkyMDMwMCwiZXhwIjoxNzU0NTEyMzAwfQ.bRyDWzWukeQj3exxU1lNMt888KLLZQ7ZAeryfhlofVg",
            "expiresIn": "7d"
        },
        "message": "操作成功",
        "timestamp": "2025-07-07T20:31:40.563Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-07T20:31:40.563Z"
}
curl 'http://localhost:3001/api/auth/profile' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiYWktaW90MDRAMTU4MTAwLmNvbSIsImlhdCI6MTc1MTkyMDMwMCwiZXhwIjoxNzUyNTI1MTAwfQ.J_Ya1dokj-HSmyCAF2FzgcGDqmk0BsLlGaETl_jA7fU' \
  -H 'Connection: keep-alive' \
  -H 'If-None-Match: W/"75c-x7K/eJUz4TWYBJdzPdOAkfRvlRw"' \
  -H 'Referer: http://localhost:3001/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'X-Request-ID: 1751920420130-nesj059ku' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "id": 2,
            "email": "ai-iot04@158100.com",
            "username": "ai-iot04",
            "nickname": "ai-iot04",
            "avatar": "https://avatars.githubusercontent.com/u/218473613?v=4",
            "bio": null,
            "status": "active",
            "emailVerified": true,
            "lastLoginAt": null,
            "createdAt": "2025-07-07T20:27:55.276Z",
            "roles": [
                {
                    "id": 3,
                    "name": "普通用户",
                    "code": "user",
                    "description": "普通用户，可以查看博客、对自己的评论进行增删改查操作",
                    "isActive": true,
                    "isSystem": true,
                    "permissions": [
                        {
                            "id": 7,
                            "name": "查看博客",
                            "code": "READ_BLOG",
                            "action": "read",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 12,
                            "name": "查看分类",
                            "code": "READ_CATEGORY",
                            "action": "read",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 16,
                            "name": "创建评论",
                            "code": "CREATE_COMMENT",
                            "action": "create",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 17,
                            "name": "查看评论",
                            "code": "READ_COMMENT",
                            "action": "read",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 18,
                            "name": "更新评论",
                            "code": "UPDATE_COMMENT",
                            "action": "update",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 19,
                            "name": "删除评论",
                            "code": "DELETE_COMMENT",
                            "action": "delete",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 37,
                            "name": "创建文件",
                            "code": "CREATE_FILE",
                            "action": "create",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 38,
                            "name": "查看文件",
                            "code": "READ_FILE",
                            "action": "read",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 39,
                            "name": "更新文件",
                            "code": "UPDATE_FILE",
                            "action": "update",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 40,
                            "name": "删除文件",
                            "code": "DELETE_FILE",
                            "action": "delete",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        }
                    ]
                }
            ]
        },
        "message": "操作成功",
        "timestamp": "2025-07-07T20:33:40.144Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-07T20:33:40.144Z"
}
以上的人是普通用户，只能访问blog路由。

curl 'http://localhost:3001/api/auth/profile' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE5MjAyMTEsImV4cCI6MTc1MjUyNTAxMX0.5MAPI-4G1_dXbhs0l21-eoxnUNpRvGrJhi1ovpevakg' \
  -H 'Connection: keep-alive' \
  -H 'If-None-Match: W/"16e5-sGrpq3ilqbjz74ExMBACRplB0kk"' \
  -H 'Referer: http://localhost:3001/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0' \
  -H 'X-Request-ID: 1751920466571-ujsx8ghgs' \
  -H 'sec-ch-ua: "Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "id": 1,
            "email": "1181584752@qq.com",
            "username": "xiaoshenming",
            "nickname": "小明",
            "avatar": null,
            "bio": null,
            "status": "active",
            "emailVerified": false,
            "lastLoginAt": "2025-07-06T14:37:43.000Z",
            "createdAt": "2025-07-06T14:31:55.784Z",
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
                            "isActive": true
                        },
                        {
                            "id": 2,
                            "name": "查看用户",
                            "code": "READ_USER",
                            "action": "read",
                            "resource": "user",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 3,
                            "name": "更新用户",
                            "code": "UPDATE_USER",
                            "action": "update",
                            "resource": "user",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 4,
                            "name": "删除用户",
                            "code": "DELETE_USER",
                            "action": "delete",
                            "resource": "user",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 5,
                            "name": "管理用户",
                            "code": "MANAGE_USER",
                            "action": "manage",
                            "resource": "user",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 6,
                            "name": "创建博客",
                            "code": "CREATE_BLOG",
                            "action": "create",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 7,
                            "name": "查看博客",
                            "code": "READ_BLOG",
                            "action": "read",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 8,
                            "name": "更新博客",
                            "code": "UPDATE_BLOG",
                            "action": "update",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 9,
                            "name": "删除博客",
                            "code": "DELETE_BLOG",
                            "action": "delete",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 10,
                            "name": "管理博客",
                            "code": "MANAGE_BLOG",
                            "action": "manage",
                            "resource": "blog",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 11,
                            "name": "创建分类",
                            "code": "CREATE_CATEGORY",
                            "action": "create",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 12,
                            "name": "查看分类",
                            "code": "READ_CATEGORY",
                            "action": "read",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 13,
                            "name": "更新分类",
                            "code": "UPDATE_CATEGORY",
                            "action": "update",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 14,
                            "name": "删除分类",
                            "code": "DELETE_CATEGORY",
                            "action": "delete",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 15,
                            "name": "管理分类",
                            "code": "MANAGE_CATEGORY",
                            "action": "manage",
                            "resource": "category",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 16,
                            "name": "创建评论",
                            "code": "CREATE_COMMENT",
                            "action": "create",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 17,
                            "name": "查看评论",
                            "code": "READ_COMMENT",
                            "action": "read",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 18,
                            "name": "更新评论",
                            "code": "UPDATE_COMMENT",
                            "action": "update",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 19,
                            "name": "删除评论",
                            "code": "DELETE_COMMENT",
                            "action": "delete",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 20,
                            "name": "管理评论",
                            "code": "MANAGE_COMMENT",
                            "action": "manage",
                            "resource": "comment",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 21,
                            "name": "创建角色",
                            "code": "CREATE_ROLE",
                            "action": "create",
                            "resource": "role",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 22,
                            "name": "查看角色",
                            "code": "READ_ROLE",
                            "action": "read",
                            "resource": "role",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 23,
                            "name": "更新角色",
                            "code": "UPDATE_ROLE",
                            "action": "update",
                            "resource": "role",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 24,
                            "name": "删除角色",
                            "code": "DELETE_ROLE",
                            "action": "delete",
                            "resource": "role",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 25,
                            "name": "管理角色",
                            "code": "MANAGE_ROLE",
                            "action": "manage",
                            "resource": "role",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 26,
                            "name": "创建权限",
                            "code": "CREATE_PERMISSION",
                            "action": "create",
                            "resource": "permission",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 27,
                            "name": "查看权限",
                            "code": "READ_PERMISSION",
                            "action": "read",
                            "resource": "permission",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 28,
                            "name": "更新权限",
                            "code": "UPDATE_PERMISSION",
                            "action": "update",
                            "resource": "permission",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 29,
                            "name": "删除权限",
                            "code": "DELETE_PERMISSION",
                            "action": "delete",
                            "resource": "permission",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 30,
                            "name": "管理权限",
                            "code": "MANAGE_PERMISSION",
                            "action": "manage",
                            "resource": "permission",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 31,
                            "name": "系统管理",
                            "code": "MANAGE_SYSTEM",
                            "action": "manage",
                            "resource": "system",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 32,
                            "name": "创建云函数",
                            "code": "CREATE_CLOUD_FUNCTION",
                            "action": "create",
                            "resource": "cloud_function",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 33,
                            "name": "查看云函数",
                            "code": "READ_CLOUD_FUNCTION",
                            "action": "read",
                            "resource": "cloud_function",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 34,
                            "name": "更新云函数",
                            "code": "UPDATE_CLOUD_FUNCTION",
                            "action": "update",
                            "resource": "cloud_function",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 35,
                            "name": "删除云函数",
                            "code": "DELETE_CLOUD_FUNCTION",
                            "action": "delete",
                            "resource": "cloud_function",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 36,
                            "name": "管理云函数",
                            "code": "MANAGE_CLOUD_FUNCTION",
                            "action": "manage",
                            "resource": "cloud_function",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 37,
                            "name": "创建文件",
                            "code": "CREATE_FILE",
                            "action": "create",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 38,
                            "name": "查看文件",
                            "code": "READ_FILE",
                            "action": "read",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 39,
                            "name": "更新文件",
                            "code": "UPDATE_FILE",
                            "action": "update",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 40,
                            "name": "删除文件",
                            "code": "DELETE_FILE",
                            "action": "delete",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        },
                        {
                            "id": 41,
                            "name": "管理文件",
                            "code": "MANAGE_FILE",
                            "action": "manage",
                            "resource": "file",
                            "description": null,
                            "isActive": true
                        }
                    ]
                }
            ]
        },
        "message": "操作成功",
        "timestamp": "2025-07-07T20:34:26.583Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-07T20:34:26.583Z"
}
这种才是管理员，才能访问/admin路由