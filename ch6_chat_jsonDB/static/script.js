/* ========= Mermaid 初始化 ========= */
/**
 * Mermaid 是把文字語法轉成流程圖/序列圖的工具。
 * 這裡設定 startOnLoad=false，代表不要在頁面載入時自動渲染，
 * 我們會在訊息插入後「手動」觸發渲染（見 renderCode）。
 */
mermaid.initialize({ startOnLoad: false });

/* ===== 使用者暱稱 ===== */
/**
 * 儲存/讀取使用者暱稱：
 * - 先從 sessionStorage 拿 "chat_username"
 * - 如果不存在，就產生一個暱稱（使用者 + 隨機數字），並存回 sessionStorage
 * 注意：sessionStorage 在同一分頁有效，關閉分頁就會清掉（跟 localStorage 不同）
 */
let username = sessionStorage.getItem("chat_username");
if (!username) {
  username = "使用者" + Math.floor(Math.random() * 1000);
  sessionStorage.setItem("chat_username", username);
}

/* ===== 發訊息 ===== */
/**
 * 綁定按鈕與輸入框事件：
 * - 點擊送出鍵呼叫 send()
 * - 在輸入框按 Enter（且沒有按 Shift）也觸發 send()
 */
$("#send-button").on("click", send);
$("#message-input").on("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // 阻止換行的預設行為
    send();
  }
});

/* ========= 滑到底部 ========= */
/**
 * 把訊息容器捲到最底（顯示最新訊息）
 * - 直接把 scrollTop 指到 scrollHeight
 */
function scrollBottom() {
  const m = document.getElementById("chat-messages");
  m.scrollTop = m.scrollHeight;
}

/* ===== Markdown / Mermaid / Highlight ===== */
/**
 * 將純文字訊息格式化為 HTML：
 * 1) 用 marked 把 Markdown 轉 HTML
 * 2) 用 DOMPurify 清理（避免 XSS）
 * 3) 把 ```mermaid``` 程式區塊改造成 Mermaid 容器，留待後續 mermaid.init 渲染
 * 4) 把一般程式碼區塊包上「複製」按鈕，並加上 hljs 標記，後續讓 highlight.js 上色
 */
function format(txt) {
  txt = txt.trim();
  let html = marked.parse(txt);
  html = DOMPurify.sanitize(html); // 安全第一

  // 把 <pre><code class="language-mermaid"> ... </code></pre> 轉成 Mermaid 容器
  html = html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (m, c) => {
    // 反轉 HTML 實體，還原成原始 mermaid 語法
    const raw = c.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    // 包一個可複製的按鈕＋實際要被 mermaid 解析的 <pre class="mermaid">
    return `<div class="mermaid-container">
      <button class="copy-btn" onclick="copyText(this,'${encodeURIComponent(raw)}')">複製</button>
      <pre class="mermaid">${raw}</pre>
    </div>`;
  });

  // 把其它語言的程式碼區塊加上複製按鈕與 hljs 樣式（mermaid 已處理，這裡略過）
  html = html.replace(/<pre><code class="language-([\w]+)">([\s\S]*?)<\/code><\/pre>/g, (m, l, c) => {
    if (l === "mermaid") return m; // 已在上一步處理
    return `<div class="code-block">
      <button class="copy-btn" onclick="copyText(this,'${encodeURIComponent(c)}')">複製</button>
      <pre><code class="language-${l} hljs">${c}</code></pre>
    </div>`;
  });

  return html;
}

// ===== 執行 Highlight.js 與 Mermaid 渲染 =====
/**
 * renderCode 在訊息插入 DOM 後呼叫：
 * - 使用 requestAnimationFrame 確保 DOM 已更新
 * - 對所有 <pre><code> 執行 highlight.js 的上色
 * - 對所有 .mermaid 元素呼叫 mermaid.init 進行圖表渲染
 */
function renderCode() {
  requestAnimationFrame(() => {
    document.querySelectorAll("pre code").forEach((b) => hljs.highlightElement(b));
    mermaid.init(undefined, ".mermaid");
  });
}

// ===== 複製按鈕功能 =====
/**
 * 複製按鈕的共用函式：
 * - 參數 encoded：用 encodeURIComponent 編碼過的文字內容
 * - 寫到剪貼簿後，把按鈕文字改為「已複製！」，1.5 秒後改回「複製」
 */
function copyText(btn, encoded) {
  const text = decodeURIComponent(encoded);
  navigator.clipboard
    .writeText(text)
    .then(() => {
      btn.innerText = "已複製！";
      setTimeout(() => (btn.innerText = "複製"), 1500);
    })
    .catch(() => alert("複製失敗"));
}

/**
 * 將一則訊息渲染到聊天區塊：
 * - content：訊息文字（支援 Markdown）
 * - isMe：是否為自己（控制訊息樣式、是否顯示 user-info）
 * - sender：發送者名稱
 * - time：顯示當前本機時間（格式 HH:MM）
 * - 渲染後會呼叫 renderCode() 做語法高亮與 Mermaid 圖表，最後 scrollBottom()
 */
function addMessage(content, isMe, sender) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const html = `
    <div class="message ${isMe ? "user-message" : "other-message"} clearfix">
      ${!isMe ? `<div class="user-info"><span class="user-name">${sender}</span></div>` : ""}
      <div class="message-content">${format(content)}</div>
      <div class="message-time">${time}</div>
    </div>`;
  $("#chat-messages").append(html);
  renderCode();
  scrollBottom();
}

/* ===== 表情選單 ===== */
/**
 * 點擊 emoji 按鈕時：
 * - 若已存在選單就關閉
 * - 否則生成一個簡易表情選單，點擊單一表情符號會插入到輸入框後面
 * - 點擊頁面其它地方會自動關閉選單（one-shot 事件）
 */
$(".emoji-btn").on("click", function () {
  const emojis = ["😊", "😂", "😍", "👍", "❤️", "😉", "🎉", "👋"];
  if ($(".emoji-menu").length) {
    $(".emoji-menu").remove();
    return;
  }
  let menu = '<div class="emoji-menu p-2 bg-white rounded shadow">';
  emojis.forEach((e) => (menu += `<span class="emoji-item p-1" style="cursor:pointer;font-size:1.5rem;">${e}</span>`));
  menu += "</div>";
  $(this).after(menu);
  $(".emoji-item").on("click", function () {
    $("#message-input").val($("#message-input").val() + $(this).text());
    $(".emoji-menu").remove();
  });
  $(document).one("click", (e) => {
    if (!$(e.target).hasClass("emoji-btn")) $(".emoji-menu").remove();
  });
});

/* ===== 連線 ===== */
/**
 * 連線到同源（同 domain）的 Socket.IO 伺服器。
 * 預設會自動偵測路徑 /socket.io
 */
const socket = io(); // 連到同主機的 Socket.IO

/* ===== 線上人數 ===== */
/**
 * 後端廣播 "user_count" 事件時，更新畫面上的線上人數
 * 預期 payload: { count: number }
 */
socket.on("user_count", (d) => $("#online-count").text(d.count));

/* ===== 更新連線狀態 ===== */
/**
 * 顯示連線狀態的小條（例如：已連線、斷線、連線錯誤）
 * - ok=true 時顯示綠底並在 3 秒後淡出
 * - ok=false 時顯示紅底並常駐
 */
function updateStatus(ok, msg = "已連線") {
  const el = $("#connection-status");
  if (ok) {
    el.text(msg).css("background-color", "#d4edda");
    setTimeout(() => el.fadeOut(), 3000);
  } else {
    el.stop().show().text(msg).css("background-color", "#f8d7da");
  }
}

// 監聽 Socket.IO 的連線事件，更新狀態條
socket.on("connect", () => updateStatus(true));
socket.on("disconnect", () => updateStatus(false, "連線中斷"));
socket.on("connect_error", () => updateStatus(false, "連線錯誤"));

/* ===== 初次加入 ===== */
/**
 * 一進到頁面就向伺服器送出 "join" 事件，附帶目前的 username。
 * 伺服器會用這個來記錄使用者名稱與狀態。
 */
socket.emit("join", { username });

/* ===== 工具函式：插入系統訊息 ===== */
/**
 * 在聊天訊息區中插入一條系統訊息（例如：某人加入/離開）
 */
function addSystem(text) {
  $("#chat-messages").append(`<div class="connection-status">${text}</div>`);
  scrollBottom();
}

/* ===== 系統事件 ===== */
/**
 * 後端廣播的系統事件（使用者加入/離開）
 */
socket.on("user_joined", (d) => addSystem(`${d.username} 加入了聊天`));
socket.on("user_left", (d) => addSystem(`${d.username} 離開了聊天`));

/**
 * 送出訊息流程：
 * 1) 取輸入框文字並去除前後空白；如果是空字串就不送
 * 2) 先在本地畫面插入訊息（右側「我方」訊息）
 * 3) 經由 Socket.IO 送到伺服器，伺服器會再廣播給其他人
 * 4) 清空輸入框並復原高度
 */
function send() {
  const txt = $("#message-input").val().trim();
  if (!txt) return;
  addMessage(txt, true, username); // 本地立即顯示（Optimistic UI）
  socket.emit("send_message", {
    username,
    content: txt,
  });
  $("#message-input").val("").height("auto");
  scrollBottom();
}

/* ===== 聊天事件（接收別人的訊息） ===== */
/**
 * 當伺服器廣播 "chat_message" 時：
 * - d: { content, username, ... }
 * - isMe 判斷：若是自己就用「我方樣式」
 */
socket.on("chat_message", (d) =>
  addMessage(d.content, d.username === username, d.username)
);

/* ===== 顯示「正在輸入中」指示 ===== */
/**
 * 在輸入時顯示「某人正在輸入…」：
 * - 每個使用者建立一個唯一 class 名稱（避免多個人同時輸入相互覆蓋）
 * - 3 秒後自動移除（若有新事件則延長）
 */
function showTyping(user) {
  if (user === username) return; // 自己打字就不要顯示
  const cls = "typing-" + user.replace(/\s+/g, "-");
  if ($("." + cls).length) {
    clearTimeout($("." + cls).data("timer"));
  } else {
    $("#chat-messages").append(
      `<div class="${cls} typing-indicator">${user} 正在輸入...</div>`
    );
  }
  const timer = setTimeout(
    () => $("." + cls).fadeOut(() => $(this).remove()),
    3000
  );
  $("." + cls).data("timer", timer);
  scrollBottom();
}

/* ===== 伺服器廣播的 typing 狀態 ===== */
socket.on("typing", (d) => showTyping(d.username));

/* ===== 輸入框事件：節流發送 typing ===== */
/**
 * 當輸入框內容變更時：
 * - 自動調整高度（自適應多行）
 * - 每 1 秒內只會送出一次 "typing" 事件（透過簡單的節流機制）
 */
let typingTimer;
$("#message-input").on("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
  if (!typingTimer) {
    socket.emit("typing", { username });
    typingTimer = setTimeout(() => (typingTimer = null), 1000);
  }
});

/* ===== 改暱稱 ===== */
/**
 * 點擊改名按鈕：
 * - prompt 取新名稱
 * - 向伺服器送出 "change_username"
 * - 本地也更新 sessionStorage 的 username
 */
$("#change-name-btn").on("click", () => {
  const v = prompt("輸入新名稱：", username);
  if (v && v.trim() && v !== username) {
    socket.emit("change_username", { oldUsername: username, newUsername: v });
    username = v.trim();
    sessionStorage.setItem("chat_username", username);
  }
});

// 伺服器廣播名稱變更事件，插入系統訊息
socket.on("user_changed_name", (d) =>
  addSystem(`${d.oldUsername} 更名為 ${d.newUsername}`)
);

// ===== 初次拉取歷史訊息 =====
/**
 * 頁面載入時，呼叫 /get_history 把既有訊息載回來：
 * - 逐筆用 addMessage 渲染
 * - 若要顯示伺服器時間，註解裡示範了如何把 timestamp 傳入（目前未使用）
 */
fetch("/get_history")
  .then((r) => r.json())
  .then((list) => {
    list.forEach((m) => {
      addMessage(m.content, m.username === username, m.username);
      // 想顯示伺服器時間可改為：
      // addMessage(m.content, m.username === username, m.username, m.timestamp)
    });
  })
  .catch(() => console.warn("載入歷史失敗"));

/* ===== 清空歷史（呼叫 REST API） ===== */
/**
 * 點擊清空按鈕：
 * - 二次確認
 * - POST /clear_history 清後端
 * - 成功後清空前端訊息區，插入一條系統訊息
 */
$("#clear-btn").on("click", () => {
  if (!confirm("確定要清空聊天？")) return;
  fetch("/clear_history", { method: "POST" })
    .then((r) => r.json())
    .then(() => {
      $("#chat-messages").empty();
      addSystem("歷史紀錄已清除");
    })
    .catch(() => alert("清除失敗"));
});

// ===== 頁面初始化時的狀態條 =====
/**
 * 預設顯示「連線中…」，等到 socket.on("connect") 觸發後會被覆蓋成「已連線」
 */
updateStatus(false, "連線中…");