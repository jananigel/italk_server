# italk-server

即時聊天服務的 Node.js/Express 後端，負責提供 REST API 與 Socket.IO 雙向通訊。伺服器以記憶體維護聊天室狀態，沒有外部資料庫依賴，適合示範或作為前端聊天介面的後端起點。

## 技術棧與架構
- **Node.js + Express 4**：處理 HTTP API、靜態資源與中介層 (morgan、cookie-parser、cors)。
- **Socket.IO 1.7**：雙向即時連線，處理加入聊天室、公開/私訊、線上名單同步。
- **In-memory chat room service** (`services/chat-room.js`)：用 `Map` 保存使用者，提供加入/離開/查詢等操作。
- **設定管理** (`config/index.js`)：統一處理 `PORT` 與 `CORS_ORIGINS`，供 Express 與 Socket.IO 共用。

主要流程如下：`bin/www` 啟動 HTTP 伺服器 → 載入 `app.js` 的 Express 應用 → `sockets/index.js` 把 Socket.IO 附掛在同一個 server 上 → 所有事件交給聊天室服務處理。

## 專案結構速覽
```
app.js            Express 主要設定 (路由、middleware、錯誤處理)
bin/www           Server 入口，設定埠號並啟動 Socket.IO
routes/           /api 與 /api/users 等 REST 路由
services/         聊天室核心邏輯 (加入/移除/列出使用者)
sockets/          Socket.IO 事件註冊，公私訊與使用者同步
utils/            共用工具 (目前為時間格式化)
public/           可供靜態檔案 (若有前端測試頁)
```

## 環境需求
- Node.js 18+ (建議)
- npm 9+

## 安裝與啟動
```bash
npm install
npm start    # 以 node 啟動 bin/www，預設監聽 8000
```

環境變數：
- `PORT`：HTTP 與 Socket.IO 共用的埠號，預設 `8000`。
- `CORS_ORIGINS`：允許的前端來源，多筆以逗號分隔，預設為 `http://localhost:5173`。

啟動後可檢查：
- `GET /`：簡易狀態訊息
- `GET /api`：專案名稱、版本、uptime
- `GET /api/health`：健康檢查

## REST API
| Method | Path         | 說明 | 回應範例 |
| ------ | ------------ | ---- | -------- |
| GET    | `/api`       | 專案資訊 | `{ "name": "italk-server", "version": "0.0.0", "status": "online", "uptime": 12.34 }` |
| GET    | `/api/health`| 健康檢查 | `{ "status": "ok", "uptime": 12.34, "timestamp": "2024-05-14T02:24:00.000Z" }` |
| GET    | `/api/users` | 目前線上清單 (記憶體) | `{ "count": 2, "users": [{"username": "alice", "sessionid": "..."}] }` |

> 注意：使用者資料儲存在記憶體，重新啟動伺服器會清空名單。

## Socket.IO 事件
所有事件走 `sockets/index.js`，以下為主要事件與 payload：

### 客戶端 → 伺服器
| 事件 | 參數 | 用途 |
| ---- | ---- | ---- |
| `add user` | `(username: string)` | 嘗試加入聊天室；重複或非法名稱會收到 `Error msg`。|
| `public msg` | `(message: string)` | 廣播訊息給所有人。未登入會收到 `Error msg`。|
| `private msg` | `(sendTo: string, message: string)` | 送私訊，伺服器會回傳給對方與自己確認。|

### 伺服器 → 客戶端
| 事件 | Payload | 說明 |
| ---- | ------- | ---- |
| `add user` | `{ sessionid, username, users }` | 加入成功的回覆 (僅回傳給該使用者)。|
| `refresh list` | `{ sessionid, username, users }` | 有人加入時廣播最新名單，前端可覆蓋線上清單。|
| `public msg` | `{ userid, username, time, publicmsg }` | 公開訊息廣播。|
| `private msg` | `{ userid, username, time, privatemsg }` | 私訊內容；同時回給發送者與目標。|
| `user left` | `{ leftuser, leftid, time, users }` | 有人離線時廣播。|
| `Error msg` | `{ type, username? }` | 可能的錯誤：`invalidName`, `nameRepeat`, `notAuthorized`, `userNotFound`。|

時間字串 (`time`) 由 `utils/time.js` 產生，格式為 `MM/DD/YYYY HH:mm` (24 小時制)。

## 前後端溝通流程
1. **建立 Socket 連線**：前端使用 `socket.io-client` 連線至 `http://<host>:<port>`，需確保 `CORS_ORIGINS` 包含前端網址。
2. **登入聊天室**：連線後立即送出 `socket.emit('add user', username)`，等待 `add user` 回覆。若收到 `Error msg` 需提示使用者重新輸入。
3. **同步清單**：收到 `add user` 或 `refresh list` 時更新線上使用者面板。若需要初始資料，也可在介面載入時呼叫 `GET /api/users` 取得一次完整名單。
4. **傳送訊息**：
   - 公開訊息：`socket.emit('public msg', text)`，所有人收到 `public msg` 事件。
   - 私訊：`socket.emit('private msg', targetUsername, text)`；成功後雙方都會收到同一筆 `private msg`。
5. **離線偵測**：`user left` 事件會帶最新名單，前端可直接覆蓋 UI。
6. **錯誤處理**：監聽 `Error msg`，根據 `type` 顯示對應提醒，例如：
   ```js
   socket.on('Error msg', ({ type, username }) => {
     const messages = {
       invalidName: '使用者名稱不可為空',
       nameRepeat: '名稱已被使用',
       notAuthorized: '請先加入聊天室',
       userNotFound: `找不到使用者 ${username}`
     };
     alert(messages[type] || '未知錯誤');
   });
   ```

### 前端整合示例 (JavaScript)
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', { withCredentials: true });

socket.on('connect', () => {
  socket.emit('add user', 'alice');
});

socket.on('add user', ({ users }) => {
  renderUserList(users);
});

socket.on('public msg', (payload) => {
  renderMessage(payload);
});

function sendPublic(text) {
  socket.emit('public msg', text);
}

function sendPrivate(target, text) {
  socket.emit('private msg', target, text);
}

async function fetchUsers() {
  const res = await fetch('http://localhost:8000/api/users');
  const data = await res.json();
  renderUserList(data.users);
}
```

## 開發與除錯
- 使用 `npm start` 直接執行。如果需要熱重新載入，可自行以 `npx nodemon ./bin/www` 執行。
- 伺服器會透過 `morgan` 在終端輸出 HTTP 請求 log，Socket.IO 連線/事件則由 `console.log` 簡易紀錄。
- `sockets/test-socket.js` 示範了如何以 Node 客戶端連線，可用來快速驗證後端行為。

## 後續延伸
- 接上永續儲存 (Redis / DB) 以保存聊天室歷史與使用者狀態。
- 增加驗證與權限，避免任意名稱重複衝突。
- 部署時設定正式的 `CORS_ORIGINS` 與 TLS，確保前端可以安全地與後端溝通。
