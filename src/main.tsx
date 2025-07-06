import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./utils/performance/serviceWorker";

// 注册 Service Worker
if (import.meta.env.PROD) {
  registerServiceWorker({
    onUpdate: (registration) => {
      // 显示更新提示
      const updateAvailable = window.confirm(
        '发现新版本，是否立即更新？点击确定将刷新页面。'
      );
      if (updateAvailable && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    onSuccess: () => {
      console.log('Service Worker 注册成功，应用已支持离线访问');
    },
    onError: (error) => {
      console.warn('Service Worker 注册失败:', error);
    },
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
