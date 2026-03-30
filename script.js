// ================= GLOBAL STATE =================
const state = {
  openApps: {},
  zIndex: 10,
  notifications: [],
  quickActions: {
    wifi: true,
    bluetooth: false,
    airplane: false,
    dark: false
  }
};

// ================= LOCK SCREEN =================
const lockScreen = document.getElementById("lock-screen");
const unlockBtn = document.getElementById("unlock-button");
const lockTime = document.querySelector(".lock-time");
const lockDate = document.querySelector(".lock-date");

function updateLockScreenTime() {
  const now = new Date();
  lockTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  lockDate.textContent = now.toDateString();
}
setInterval(updateLockScreenTime, 1000);
updateLockScreenTime();

unlockBtn.addEventListener("click", () => {
  lockScreen.style.display = "none";
});

// ================= TASKBAR CLOCK =================
const clock = document.getElementById("clock");

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ================= START MENU =================
const startBtn = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");

startBtn.addEventListener("click", () => {
  startMenu.classList.toggle("active");
});

// ================= NOTIFICATION CENTER =================
const notificationCenter = document.getElementById("notification-center");
const notificationsList = document.getElementById("notifications-list");

document.getElementById("system-tray").addEventListener("click", () => {
  notificationCenter.classList.toggle("active");
});

function sendNotification(text) {
  const note = document.createElement("div");
  note.className = "notification";
  note.textContent = text;

  notificationsList.prepend(note);
  state.notifications.push(text);
}

// ================= QUICK ACTIONS =================
document.querySelectorAll("#quick-actions button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");

    const action = btn.textContent.toLowerCase();

    if (action.includes("wi-fi")) state.quickActions.wifi = !state.quickActions.wifi;
    if (action.includes("bluetooth")) state.quickActions.bluetooth = !state.quickActions.bluetooth;
    if (action.includes("airplane")) state.quickActions.airplane = !state.quickActions.airplane;
    if (action.includes("dark")) {
      state.quickActions.dark = !state.quickActions.dark;
      document.body.classList.toggle("dark-mode");
    }

    sendNotification(`${btn.textContent} toggled`);
  });
});

// ================= APP WINDOW MANAGEMENT =================
const taskbarApps = document.getElementById("taskbar-apps");

window.openWindow = function (id) {
  let win = document.getElementById(id);

  if (!win) return;

  // Prevent duplicate
  if (state.openApps[id]) {
    restoreWindow(id);
    return;
  }

  win.style.display = "block";
  win.style.zIndex = ++state.zIndex;

  state.openApps[id] = {
    minimized: false,
    maximized: false
  };

  createTaskbarIcon(id);
  makeDraggable(win);
  makeResizable(win);

  sendNotification(`${id} opened`);
};

function createTaskbarIcon(id) {
  const btn = document.createElement("button");
  btn.textContent = id;
  btn.onclick = () => restoreWindow(id);
  btn.id = "task-" + id;

  taskbarApps.appendChild(btn);
}

function restoreWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  win.style.display = "block";
  win.style.zIndex = ++state.zIndex;
  state.openApps[id].minimized = false;
}

window.minimizeWindow = function (id) {
  const win = document.getElementById(id);
  if (!win) return;

  win.style.display = "none";
  state.openApps[id].minimized = true;
};

window.maximizeWindow = function (id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (!state.openApps[id].maximized) {
    win.dataset.prev = JSON.stringify({
      width: win.style.width,
      height: win.style.height,
      top: win.style.top,
      left: win.style.left
    });

    win.style.top = "0";
    win.style.left = "0";
    win.style.width = "100%";
    win.style.height = "100%";

    state.openApps[id].maximized = true;
  } else {
    const prev = JSON.parse(win.dataset.prev);
    Object.assign(win.style, prev);
    state.openApps[id].maximized = false;
  }
};

window.closeWindow = function (id) {
  const win = document.getElementById(id);
  const task = document.getElementById("task-" + id);

  if (win) win.style.display = "none";
  if (task) task.remove();

  delete state.openApps[id];

  sendNotification(`${id} closed`);
};

// ================= DRAGGING =================
function makeDraggable(win) {
  const titlebar = win.querySelector(".titlebar");
  let offsetX = 0, offsetY = 0, isDragging = false;

  const start = (e) => {
    isDragging = true;
    win.style.zIndex = ++state.zIndex;

    const rect = win.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
  };

  const move = (e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    win.style.left = clientX - offsetX + "px";
    win.style.top = clientY - offsetY + "px";
  };

  const stop = () => isDragging = false;

  titlebar.addEventListener("mousedown", start);
  titlebar.addEventListener("touchstart", start);

  document.addEventListener("mousemove", move);
  document.addEventListener("touchmove", move);

  document.addEventListener("mouseup", stop);
  document.addEventListener("touchend", stop);
}

// ================= RESIZING =================
function makeResizable(win) {
  const resizer = document.createElement("div");
  resizer.style.width = "10px";
  resizer.style.height = "10px";
  resizer.style.position = "absolute";
  resizer.style.right = "0";
  resizer.style.bottom = "0";
  resizer.style.cursor = "nwse-resize";

  win.appendChild(resizer);

  let isResizing = false;

  const start = (e) => {
    isResizing = true;
    e.preventDefault();
  };

  const resize = (e) => {
    if (!isResizing) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    win.style.width = clientX - win.offsetLeft + "px";
    win.style.height = clientY - win.offsetTop + "px";
  };

  const stop = () => isResizing = false;

  resizer.addEventListener("mousedown", start);
  resizer.addEventListener("touchstart", start);

  document.addEventListener("mousemove", resize);
  document.addEventListener("touchmove", resize);

  document.addEventListener("mouseup", stop);
  document.addEventListener("touchend", stop);
}

// ================= DESKTOP ICONS =================
document.querySelectorAll(".desktop-icon").forEach(icon => {
  icon.addEventListener("click", () => {
    const onclick = icon.getAttribute("onclick");
    if (onclick) eval(onclick);
  });
});

// ================= SYSTEM TRAY ICON STATES =================
const wifiIcon = document.getElementById("wifi");
const soundIcon = document.getElementById("sound");

wifiIcon.addEventListener("click", () => {
  state.quickActions.wifi = !state.quickActions.wifi;
  wifiIcon.textContent = state.quickActions.wifi ? "📶" : "❌";
});

soundIcon.addEventListener("click", () => {
  const muted = soundIcon.textContent === "🔇";
  soundIcon.textContent = muted ? "🔊" : "🔇";
});

// ================= INIT =================
document.querySelectorAll(".window").forEach(win => {
  win.style.display = "none";
});
