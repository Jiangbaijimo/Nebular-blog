这才是退出登录的办法。
curl 'http://localhost:3000/api/auth/logout' \
  -X 'POST' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTIzMjAsImV4cCI6MTc1MjQxNzEyMH0.gLk3Fl90IHX1lHcl2Sjz104DnNpdJIcBo35MYyDGxB0' \
  -H 'Connection: keep-alive' \
  -H 'Content-Length: 0' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/api/docs' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'accept: */*' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'
{
    "success": true,
    "data": {
        "success": true,
        "data": {
            "message": "退出登录成功"
        },
        "message": "操作成功",
        "timestamp": "2025-07-06T14:32:52.974Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-06T14:32:52.974Z"
}
而不是
curl 'http://localhost:3001/api/auth/logout' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3001' \
  -H 'Referer: http://localhost:3001/' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'X-Request-ID: 1751811356492-ug170ucug' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw '{"refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiMTE4MTU4NDc1MkBxcS5jb20iLCJpYXQiOjE3NTE4MTA5NjIsImV4cCI6MTc1NDQwMjk2Mn0.C2YZDiUuA5_dpe_Z5ZlZTahcvQGloAMW6q28F7J4sYA"}'
  {
    "success": false,
    "statusCode": 401,
    "error": "Unauthorized",
    "message": "访问令牌无效或已过期",
    "timestamp": "2025-07-06T14:15:56.815Z",
    "path": "/api/auth/logout",
    "method": "POST"
}

