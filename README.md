# chat_DB

同一個即時聊天室的三種儲存後端版本，屬於課程章節練習（ch6 系列）。前端共用同一套 `templates/index.html`，差別只在訊息存哪裡。

## 三個版本

| 資料夾 | 儲存方式 | 說明 |
| --- | --- | --- |
| `ch6_chat_jsonDB/` | JSON 檔 | 寫入 `chat_history/messages.json`，不需要外部資料庫 |
| `ch6-2_chat_mongoDB/` | 本機 MongoDB | 連線 `mongodb://localhost:27017` |
| `ch6-3_chat_mongoDB_atlas/` | MongoDB Atlas | 從 `.env` 讀取連線字串 |

每個資料夾都是 `app.py` + `requirements.txt` + `templates/index.html`。

## 技術棧

Flask、Flask-SocketIO（eventlet 非同步模式）、PyMongo、python-dotenv。

根目錄的 `pyproject.toml` 是 uv 專案設定（Python 3.12），依賴：`flask`、`flask-socketio`、`eventlet`、`greenlet`、`pymongo`、`dotenv`。

> 根目錄的 `main.py` 只是佔位腳本（印出 `Hello from chat-db!`），**不是**要執行的進入點。

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

Atlas 版（在該資料夾放 `.env`）：

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

啟動後開 `http://localhost:5000`，多開幾個分頁就能看到彼此收發訊息、輸入中提示與即時人數。

## 注意事項

- `MONGO_URI` 只能放 `.env`，別把含帳密的連線字串提交進版本控制。
- `chat_history/messages.json` 是執行時留下的聊天內容，若含個資建議從 repo 移除。
