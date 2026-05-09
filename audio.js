// YouTube IFrame API audio control
// 3 players: trailer (visible bg), theme (GTA VI song), bonus (extra song)

const VOL_KEY = "gta6-vol";
const SRC_KEY = "gta6-src";

const SOURCES = ["trailer", "theme", "bonus"];
const PLAYER_IDS = { trailer: "bgPlayer", theme: "themePlayer", bonus: "bonusPlayer" };

const players = {};
const ready = {};

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");
const srcButtons = document.querySelectorAll(".ap-src");

let active = localStorage.getItem(SRC_KEY) || "theme";
if (!SOURCES.includes(active)) active = "theme";
let volume = parseInt(localStorage.getItem(VOL_KEY) ?? "55", 10);
let unmuted = false;

if (volSlider) volSlider.value = volume;
setActiveUI(active);

(function loadYT() {
  if (window.YT && window.YT.Player) { initPlayers(); return; }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = initPlayers;

function initPlayers() {
  if (!window.YT || !window.YT.Player) return;
  SOURCES.forEach(src => {
    const id = PLAYER_IDS[src];
    if (players[src] || !document.getElementById(id)) return;
    players[src] = new YT.Player(id, {
      events: {
        onReady: () => {
          ready[src] = true;
          try {
            players[src].setVolume(volume);
            players[src].mute();
            players[src].playVideo();
          } catch {}
          applyAudioState();
        },
        onStateChange: e => {
          if (e.data === YT.PlayerState.ENDED) {
            try { players[src].playVideo(); } catch {}
          }
        }
      }
    });
  });
}

function applyAudioState() {
  SOURCES.forEach(src => {
    const p = players[src];
    if (!p || !ready[src]) return;
    try {
      p.setVolume(volume);
      if (unmuted && active === src) p.unMute();
      else p.mute();
    } catch {}
  });
  panel.dataset.active = active;
  panel.dataset.muted = unmuted ? "false" : "true";
}

function setActiveUI(src) {
  srcButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.src === src);
  });
  if (panel) panel.dataset.active = src;
}

muteBtn?.addEventListener("click", () => {
  unmuted = !unmuted;
  applyAudioState();
});

volSlider?.addEventListener("input", () => {
  volume = parseInt(volSlider.value, 10);
  localStorage.setItem(VOL_KEY, String(volume));
  SOURCES.forEach(src => {
    if (players[src] && ready[src]) {
      try { players[src].setVolume(volume); } catch {}
    }
  });
  if (volume === 0 && unmuted) { unmuted = false; applyAudioState(); }
});

srcButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    active = btn.dataset.src;
    localStorage.setItem(SRC_KEY, active);
    setActiveUI(active);
    applyAudioState();
  });
});
