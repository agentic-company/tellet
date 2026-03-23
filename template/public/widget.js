/**
 * tellet Embeddable Chat Widget
 *
 * Usage:
 * <script src="https://your-tellet-app.com/widget.js"
 *         data-agent="support"
 *         data-api="https://your-tellet-app.com"></script>
 */
(function () {
  var script = document.currentScript;
  var agentId = script && script.getAttribute("data-agent") || "support";
  var apiBase = script && script.getAttribute("data-api") || window.location.origin;
  var accentColor = script && script.getAttribute("data-color") || "#8b5cf6";

  // Inject styles
  var style = document.createElement("style");
  style.textContent = [
    "#tellet-widget-btn{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:" + accentColor + ";color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px " + accentColor + "33;transition:transform .2s}",
    "#tellet-widget-btn:hover{transform:scale(1.05)}",
    "#tellet-widget-panel{position:fixed;bottom:96px;right:24px;z-index:99999;width:380px;max-height:500px;border-radius:16px;background:#09090b;border:1px solid #27272a;box-shadow:0 25px 50px rgba(0,0,0,.5);display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa}",
    "#tellet-widget-panel.open{display:flex}",
    ".tw-hdr{padding:12px 16px;border-bottom:1px solid #27272a;background:#18181b;display:flex;align-items:center;gap:8px}",
    ".tw-av{width:28px;height:28px;border-radius:50%;background:" + accentColor + "22;color:" + accentColor + ";display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}",
    ".tw-nm{font-size:13px;font-weight:600}.tw-st{font-size:11px;color:#52525b}",
    ".tw-msgs{flex:1;overflow-y:auto;padding:12px 16px;min-height:200px;max-height:340px}",
    ".tw-empty{text-align:center;padding:32px 0;color:#a1a1aa;font-size:13px}",
    ".tw-m{display:flex;margin-bottom:8px}.tw-m.u{justify-content:flex-end}",
    ".tw-b{max-width:85%;padding:8px 12px;border-radius:12px;font-size:13px;line-height:1.5}",
    ".tw-m.u .tw-b{background:" + accentColor + ";color:#fff}",
    ".tw-m.a .tw-b{background:#18181b;border:1px solid #27272a;color:#fafafa}",
    ".tw-inp{padding:12px;border-top:1px solid #27272a;display:flex;gap:8px}",
    ".tw-inp input{flex:1;padding:8px 12px;border-radius:8px;background:#18181b;border:1px solid #27272a;color:#fafafa;font-size:13px;outline:none}",
    ".tw-inp input:focus{border-color:" + accentColor + "}.tw-inp input::placeholder{color:#52525b}",
    ".tw-inp button{padding:8px 12px;border-radius:8px;background:" + accentColor + ";color:#fff;border:none;cursor:pointer;font-size:13px}.tw-inp button:disabled{opacity:.5;cursor:default}"
  ].join("");
  document.head.appendChild(style);

  // Build DOM safely
  var btn = document.createElement("button");
  btn.id = "tellet-widget-btn";
  var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "24");
  icon.setAttribute("height", "24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.5");
  icon.setAttribute("viewBox", "0 0 24 24");
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("d", "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z");
  icon.appendChild(path);
  btn.appendChild(icon);
  document.body.appendChild(btn);

  var panel = document.createElement("div");
  panel.id = "tellet-widget-panel";

  // Header
  var hdr = document.createElement("div");
  hdr.className = "tw-hdr";
  var av = document.createElement("div");
  av.className = "tw-av";
  av.textContent = "AI";
  hdr.appendChild(av);
  var info = document.createElement("div");
  var nm = document.createElement("div");
  nm.className = "tw-nm";
  nm.textContent = "AI Assistant";
  var st = document.createElement("div");
  st.className = "tw-st";
  st.textContent = "Online";
  info.appendChild(nm);
  info.appendChild(st);
  hdr.appendChild(info);
  panel.appendChild(hdr);

  // Messages
  var msgs = document.createElement("div");
  msgs.className = "tw-msgs";
  var empty = document.createElement("div");
  empty.className = "tw-empty";
  empty.textContent = "Ask me anything!";
  msgs.appendChild(empty);
  panel.appendChild(msgs);

  // Input
  var inp = document.createElement("div");
  inp.className = "tw-inp";
  var inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.placeholder = "Type a message...";
  var sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  inp.appendChild(inputEl);
  inp.appendChild(sendBtn);
  panel.appendChild(inp);

  document.body.appendChild(panel);

  var open = false;
  var streaming = false;
  var conversationId = null;

  btn.onclick = function () {
    open = !open;
    panel.classList.toggle("open", open);
  };

  function addMessage(role, text) {
    if (msgs.querySelector(".tw-empty")) {
      msgs.removeChild(msgs.querySelector(".tw-empty"));
    }
    var row = document.createElement("div");
    row.className = "tw-m " + (role === "user" ? "u" : "a");
    var bubble = document.createElement("div");
    bubble.className = "tw-b";
    bubble.textContent = text;
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text || streaming) return;
    inputEl.value = "";
    streaming = true;
    sendBtn.disabled = true;

    addMessage("user", text);
    var bubble = addMessage("assistant", "...");

    fetch(apiBase + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, agent_id: agentId, conversation_id: conversationId }),
    })
      .then(function (res) { return res.body.getReader(); })
      .then(function (reader) {
        var decoder = new TextDecoder();
        var content = "";
        function read() {
          reader.read().then(function (result) {
            if (result.done) { streaming = false; sendBtn.disabled = false; return; }
            var lines = decoder.decode(result.value).split("\n");
            for (var i = 0; i < lines.length; i++) {
              if (lines[i].indexOf("data: ") === 0) {
                try {
                  var data = JSON.parse(lines[i].slice(6));
                  if (data.text) { content += data.text; bubble.textContent = content; }
                  if (data.conversation_id) conversationId = data.conversation_id;
                } catch (e) {}
              }
            }
            msgs.scrollTop = msgs.scrollHeight;
            read();
          });
        }
        read();
      })
      .catch(function () {
        bubble.textContent = "Something went wrong.";
        streaming = false;
        sendBtn.disabled = false;
      });
  }

  sendBtn.onclick = send;
  inputEl.onkeydown = function (e) { if (e.key === "Enter") send(); };
})();
