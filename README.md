# chat_DB

同一個即時聊天室的三種儲存後端版本，属于课程章節練習（ch6 系列）。前端共用同一套 `templates/index.html`，差別只在訊息存哪裡。

## 三個版本

| 資料夾 | 儲存方式 | 說明 |
| --- | --- | --- |
| `ch6_chat_jsonDB/` | JSON 檔 | 寫入 `chat_history/messages.json`，不用外部資料庫 |
| `ch6-2_chat_mongoDB/` | 本機 MongoDB | 連 `mongodb://localhost:27017` |
| `ch6-3_chat_mongoDB_atlas/` | MongoDB Atlas | 從 `.env` 讀連線字串 |

每個資料夾都是 `app.py` + `requirements.txt` + `templates/index.html`。

## 技術棧

Flask、Flask-SocketIO（eventlet 非同步模式）、PyMongo、python-dotenv。

根目錄的 `pyproject.toml` 是 uv 專案設定（Python 3.12），依賴：`flask`、`flask-socketio`、`eventlet`、`greenlet`、`pymongo`、`dotenv`。

> 根目錄的 `main.py` 只是佔檔腳本（印 `Hello from chat-db!`），**不是**要跑的进入口。

## 執行

JSON 版：

```bash
cd ch6_chat_jsonDB
pip install -r requirements.txt
python app.py
```

本機 MongoDB 版：

```bash
# 先啟動 MongoDB
cd ch6-2_chat_mongoDB
pip install -r requirements.txt
python app.py
```

Atlas 版（需在該目錄放 `.env`）：

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
MONGO_DB=chatapp
MONGO_COLLECTION=messages
```

```bash
cd ch6-3_chat_mongoDB_atlas
pip install -r requirements.txt
python app.py
```

啟動後開 `http://localhost:5000`，開多個分頁即可看到彼此收发消息（含輸入中提示與人數.broadcast）。

## 注意事項

- `MONGO_URI` 一定要放 `.env`，別把含帳密的連線字串提交进版本控制。
- `chat_history/messages.json` 是執行時產生的聊天內容，若含个資建議从 repo 移除。
