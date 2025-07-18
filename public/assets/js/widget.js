(function () {
  if (localStorage.getItem('hideWidget') === 'true') {
  document.addEventListener('DOMContentLoaded', () => {
    button.style.display = 'none';
  });
}


  const MIN_WIDTH = 370;
  const MIN_HEIGHT = 350;

  const TALL_SIZES = {
    weather:   { width: 700, height: 500 },
    discord:   { width: 450, height: 600 },
    scientific:{ width: 370, height: 450 },
    graphing:  { width: 900, height: 600 },
    geometry:  { width: 900, height: 600 },
    matrix:    { width: 370, height: 450 },
    threeD:    { width: 900, height: 600 }
  };

  let currentTab = null;
  let tallModeActive = false;
  let userResizedSinceTall = false;
  let isOpen = false;
  let resizing = false;
  let startX, startY, startWidth, startHeight;
  let clockTimeout;
  let iframe = document.createElement("iframe");

  const style = document.createElement("style");
  style.textContent = `
    .weather-widget-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 24px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .weather-widget-popup {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 400px;
      height: 300px;
      min-width: ${MIN_WIDTH}px;
      min-height: ${MIN_HEIGHT}px;
      border: 1px solid #ccc;
      border-radius: 10px;
      overflow: hidden;
      display: none;
      z-index: 9998;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      background: white;
      flex-direction: column;
    }
    .weather-widget-popup.show { display: flex; }
    .weather-widget-popup iframe, .weather-widget-popup widgetbot {
      flex: 1; width: 100%; height: 100%; border: 0;
    }
    .weather-widget-clock {
      text-align: center;
      font-family: monospace;
      font-size: 14px;
      padding: 6px 0;
      background: #000;
      color: #fff;
      border-top: 1px solid #333;
    }
    .weather-widget-resizer {
      position: absolute;
      width: 20px;
      height: 20px;
      top: 0;
      left: 0;
      background: rgba(0,0,0,0.1);
      cursor: nwse-resize;
      z-index: 2;
    }
    .weather-widget-shield {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: transparent;
      z-index: 10;
      display: none;
    }
    .widget-toolbar {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      background: #f0f0f0;
      padding: 4px;
      border-bottom: 1px solid #ccc;
      flex-wrap: wrap;
    }
    .widget-toolbar button {
      background: none;
      border: none;
      color: #333;
      font-size: 18px;
      cursor: pointer;
      margin-right: 8px;
      margin-bottom: 4px;
    }
    .widget-toolbar button.active { color: #3498db; }
    .math-sub-toolbar {
      display: none;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .math-sub-toolbar button { font-size: 16px; }
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.className = "weather-widget-btn";
  button.innerHTML = "💬";
  document.body.appendChild(button);

  const popup = document.createElement("div");
  popup.className = "weather-widget-popup";

  const toolbar = document.createElement("div");
  toolbar.className = "widget-toolbar";

  const weatherBtn = document.createElement("button");
  weatherBtn.innerHTML = `<i class="fas fa-cloud"></i>`;
  toolbar.appendChild(weatherBtn);

  const mathBtn = document.createElement("button");
  mathBtn.innerHTML = `<i class="fas fa-square-root-alt"></i>`;
  toolbar.appendChild(mathBtn);

  const discordBtn = document.createElement("button");
  discordBtn.innerHTML = `<i class="fab fa-discord"></i>`;
  toolbar.appendChild(discordBtn);

  const mathToolbar = document.createElement("div");
  mathToolbar.className = "math-sub-toolbar";

  const calcBtns = {
    scientific: { label: "Scientific", url: "https://www.desmos.com/scientific" },
    graphing: { label: "Graphing", url: "https://www.desmos.com/calculator" },
    geometry: { label: "Geometry", url: "https://www.desmos.com/geometry" },
    matrix: { label: "Matrix", url: "https://www.desmos.com/matrix" },
    threeD: { label: "3D", url: "https://www.desmos.com/3d" }
  };

  const calcBtnElements = {};
  for (const key in calcBtns) {
    const btn = document.createElement("button");
    btn.textContent = calcBtns[key].label;
    mathToolbar.appendChild(btn);
    calcBtnElements[key] = btn;

    btn.onclick = () => {
      maybeShrinkIfTall();
      swapToIframe();
      iframe.src = calcBtns[key].url;
      setActiveCalcBtn(key);
      resizeToTall(key);
      currentTab = key;
    };
  }

  toolbar.appendChild(mathToolbar);
  popup.appendChild(toolbar);
  popup.appendChild(iframe);

  const shield = document.createElement("div");
  shield.className = "weather-widget-shield";
  popup.appendChild(shield);

  const clock = document.createElement("div");
  clock.className = "weather-widget-clock";
  popup.appendChild(clock);

  const resizer = document.createElement("div");
  resizer.className = "weather-widget-resizer";
  popup.appendChild(resizer);

  document.body.appendChild(popup);

  function setActiveMain(btn) {
    [weatherBtn, mathBtn, discordBtn].forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  function setActiveCalcBtn(key) {
    for (const k in calcBtnElements) {
      calcBtnElements[k].classList.remove("active");
    }
    if (key && calcBtnElements[key]) {
      calcBtnElements[key].classList.add("active");
    }
  }

  async function setWeatherLocation() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const lat = data.latitude.toFixed(4);
      const lon = data.longitude.toFixed(4);
      iframe.src = `https://www.ventusky.com/?p=${lat};${lon};8&l=radar`;
    } catch {
      iframe.src = `https://www.ventusky.com/?p=40.7;-74.0;5&l=radar`;
    }
  }

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    clockTimeout = setTimeout(updateClock, 1000 - (now.getTime() % 1000));
  }

  function resizeToTall(tab) {
    const size = TALL_SIZES[tab];
    if (size) {
      popup.style.width = `${size.width}px`;
      popup.style.height = `${size.height}px`;
      tallModeActive = true;
      userResizedSinceTall = false;
    }
  }

  function maybeShrinkIfTall() {
    if (tallModeActive && !userResizedSinceTall) {
      popup.style.width = "400px";
      popup.style.height = "300px";
    }
    tallModeActive = false;
    userResizedSinceTall = false;
  }

  function createWidgetBotEmbed() {
    const embed = document.createElement("widgetbot");
    embed.setAttribute("server", "1195939403990831114");
    embed.setAttribute("channel", "1393296737560694825");
    embed.setAttribute("width", "100%");
    embed.setAttribute("height", "100%");
    embed.style.border = "none";

    const scriptId = "widgetbot-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/@widgetbot/html-embed";
      document.head.appendChild(script);
    }

    return embed;
  }

function swapToIframe() {
  const bot = popup.querySelector("widgetbot");
  if (bot) bot.style.display = "none";
  iframe.style.display = "block";
  if (!popup.contains(iframe)) popup.insertBefore(iframe, shield);
}

function swapToWidgetBot() {
  if (iframe && iframe.parentNode) iframe.style.display = "none";
  let bot = popup.querySelector("widgetbot");
  if (!bot) {
    bot = createWidgetBotEmbed();
    popup.insertBefore(bot, shield);
  }
  bot.style.display = "block";
}


  button.onclick = () => togglePopup();

  weatherBtn.onclick = () => {
    maybeShrinkIfTall();
    swapToIframe();
    setWeatherLocation();
    setActiveMain(weatherBtn);
    mathToolbar.style.display = "none";
    button.innerHTML = "☁️";
    currentTab = "weather";
    resizeToTall("weather");
  };

  mathBtn.onclick = () => {
    maybeShrinkIfTall();
    swapToIframe();
    iframe.src = calcBtns.scientific.url;
    setActiveMain(mathBtn);
    setActiveCalcBtn("scientific");
    mathToolbar.style.display = "flex";
    button.innerHTML = "🧮";
    currentTab = "scientific";
    resizeToTall("scientific");
  };

  discordBtn.onclick = () => {
    maybeShrinkIfTall();
    swapToWidgetBot();
    setActiveMain(discordBtn);
    mathToolbar.style.display = "none";
    button.innerHTML = "💬";
    currentTab = "discord";
    resizeToTall("discord");
  };

  function togglePopup(show) {
    isOpen = show !== undefined ? show : !isOpen;
    popup.style.display = isOpen ? "flex" : "none";
    if (isOpen && currentTab === null) {
      currentTab = "discord";
      discordBtn.click();
    }
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  }

  function handleClickOutside(e) {
    if (!popup.contains(e.target) && e.target !== button && !shield.contains(e.target)) {
      togglePopup(false);
    }
  }

  resizer.addEventListener("mousedown", (e) => {
    e.preventDefault();
    resizing = true;
    userResizedSinceTall = true;
    shield.style.display = "block";
    const rect = popup.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = rect.width;
    startHeight = rect.height;
    document.body.style.userSelect = "none";

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  });

  function handleResizeMove(e) {
    if (!resizing) return;
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    popup.style.width = `${Math.max(startWidth + dx, MIN_WIDTH)}px`;
    popup.style.height = `${Math.max(startHeight + dy, MIN_HEIGHT)}px`;
  }

  function handleResizeEnd() {
    if (resizing) {
      resizing = false;
      shield.style.display = "none";
      document.body.style.userSelect = "";
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    }
  }

  window.addEventListener('beforeunload', () => {
    clearTimeout(clockTimeout);
    document.removeEventListener('click', handleClickOutside);
  });

  let prevHideWidget = localStorage.getItem('hideWidget');

  setInterval(() => {
    const newHideWidget = localStorage.getItem('hideWidget');
    if (newHideWidget !== prevHideWidget) {
      prevHideWidget = newHideWidget;
      if (newHideWidget === 'true') {
        togglePopup(false);
        button.style.display = 'none';
      } else {
        button.style.display = 'block';
      }
    }
  }, 500);

  updateClock();
})();