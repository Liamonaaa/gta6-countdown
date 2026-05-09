// YouTube IFrame API: bg video + theme song with active-source toggle

const VOL_KEY = "gta6-vol";
const SRC_KEY = "gta6-src";

const SOURCES = ["video", "song"];
const PLAYER_IDS = { video: "bgPlayer", song: "songPlayer" };

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");
const toggleBtn = document.getElementById("apToggle");

const players = {};
const ready = {};

let active = localStorage.getItem(SRC_KEY) || "video";
if (!SOURCES.includes(active)) active = "video";
let volume = parseInt(localStorage.getItem(VOL_KEY) ?? "55", 10);
let unmuted = false;

if (volSlider) volSlider.value = volume;
if (panel) {
  panel.dataset.muted = "true";
  panel.dataset.src = active;
}

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
  if (panel) {
    panel.dataset.muted = unmuted ? "false" : "true";
    panel.dataset.src = active;
  }
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

toggleBtn?.addEventListener("click", () => {
  active = active === "video" ? "song" : "video";
  localStorage.setItem(SRC_KEY, active);
  applyAudioState();
});
