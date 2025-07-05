use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use tauri::{command, State, Manager, Emitter};
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde_json::json;
use urlencoding::decode;

// OAuth 服务器状态
type OAuthServerState = Arc<Mutex<HashMap<u16, tokio::task::JoinHandle<()>>>>;

#[command]
async fn start_oauth_server(
    port: u16,
    state: State<'_, OAuthServerState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let mut servers = state.lock().map_err(|e| e.to_string())?;
    
    // 如果服务器已经在运行，先停止它
    if let Some(handle) = servers.remove(&port) {
        handle.abort();
    }
    
    let app_clone = app.clone();
    let handle = tokio::spawn(async move {
        if let Err(e) = run_oauth_server(port, app_clone).await {
            eprintln!("OAuth server error: {}", e);
        }
    });
    
    servers.insert(port, handle);
    Ok(())
}

#[command]
async fn stop_oauth_server(
    state: State<'_, OAuthServerState>,
) -> Result<(), String> {
    let mut servers = state.lock().map_err(|e| e.to_string())?;
    
    // 停止所有服务器
    for (_, handle) in servers.drain() {
        handle.abort();
    }
    
    Ok(())
}

async fn run_oauth_server(port: u16, app: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind(format!("127.0.0.1:{}", port)).await?;
    println!("OAuth callback server listening on port {}", port);
    
    while let Ok((mut stream, _)) = listener.accept().await {
        let app_clone = app.clone();
        tokio::spawn(async move {
            let mut buffer = [0; 1024];
            if let Ok(n) = stream.read(&mut buffer).await {
                let request = String::from_utf8_lossy(&buffer[..n]);
                
                // 解析 HTTP 请求
                if let Some(first_line) = request.lines().next() {
                    if let Some(path) = first_line.split_whitespace().nth(1) {
                        if path.starts_with("/callback/") {
                            // 解析回调参数
                            if let Some(query_start) = path.find('?') {
                                let query = &path[query_start + 1..];
                                let params: HashMap<String, String> = query
                                    .split('&')
                                    .filter_map(|pair| {
                                        let mut parts = pair.split('=');
                                        if let (Some(key), Some(value)) = (parts.next(), parts.next()) {
                                            Some((key.to_string(), urlencoding::decode(value).unwrap_or_default().to_string()))
                                        } else {
                                            None
                                        }
                                    })
                                    .collect();
                                
                                // 提取提供商
                                let provider = path.split('/').nth(2).unwrap_or("unknown");
                                
                                // 发送事件到前端
                                let payload = json!({
                                    "provider": provider,
                                    "code": params.get("code"),
                                    "state": params.get("state"),
                                    "error": params.get("error"),
                                    "error_description": params.get("error_description")
                                });
                                
                                if let Err(e) = app_clone.emit("oauth-callback", payload) {
                                    eprintln!("Failed to emit oauth-callback event: {}", e);
                                }
                            }
                        }
                        
                        // 发送响应
                        let response = "HTTP/1.1 200 OK\r\n\r\n<html><body><h1>认证完成</h1><p>您可以关闭此窗口</p><script>window.close();</script></body></html>";
                        let _ = stream.write_all(response.as_bytes()).await;
                    }
                }
            }
        });
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(OAuthServerState::new(Mutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![start_oauth_server, stop_oauth_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
