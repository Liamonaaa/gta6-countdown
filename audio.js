// YouTube IFrame API: bg playlist with mute/volume + prev/next

const VOL_KEY = "gta6-vol";
const IDX_KEY = "gta6-idx";

const TRACKS = [
  { id: "06YQ1cHfIKQ", title: "GTA VI · Vibes" },
  { id: "VQRLujxTm3c", title: "Trailer 2 · Vice City" },
  { id: "QdBZY2fkU-0", title: "Trailer 1 · Reveal" },
  { id: "hH2gvfKZbL0", title: "Hot Together · Theme" },
  { id: "lOXwIWA7nFQ", title: "Leonida Cuts" }
];

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");
const prevBtn = document.getElementById("apPrev");
const nextBtn = document.getElementById("apNext");
const titleEl = document.getElementById("apTitle");

let player = null;
let ready = false;
let volume = parseInt(localStorage.getItem(VOL_KEY) ?? "55", 10);
let unmuted = false;
let idx = parseInt(localStorage.getItem(IDX_KEY) ?? "0", 10);
if (!Number.isInteger(idx) || idx < 0 || idx >= TRACKS.length) idx = 0;

if (volSlider) volSlider.value = volume;
if (panel) panel.dataset.muted = "true";
updateTitle();

(function loadYT() {
  if (window.YT && window.YT.Player) { initPlayer(); return; }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = initPlayer;

function initPlayer() {
  if (!window.YT || !window.YT.Player) return;
  if (player || !document.getElementById("bgPlayer")) return;
  player = new YT.Player("bgPlayer", {
    events: {
      onReady: () => {
        ready = true;
        try {
          player.setVolume(volume);
          player.mute();
          player.loadVideoById(TRACKS[idx].id);
        } catch {}
        applyAudioState();
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) {
          advance(1);
        }
      },
      onError: () => {
        advance(1);
      }
    }
  });
}

function applyAudioState() {
  if (!player || !ready) return;
  try {
    player.setVolume(volume);
    if (unmuted) player.unMute();
    else player.mute();
  } catch {}
  if (panel) panel.dataset.muted = unmuted ? "false" : "true";
}

function updateTitle() {
  if (titleEl) titleEl.textContent = TRACKS[idx]?.title ?? "—";
}

function go(newIdx) {
  idx = ((newIdx % TRACKS.length) + TRACKS.length) % TRACKS.length;
  localStorage.setItem(IDX_KEY, String(idx));
  updateTitle();
  if (player && ready) {
    try {
      player.loadVideoById(TRACKS[idx].id);
      if (!unmuted) player.mute();
      else player.unMute();
    } catch {}
  }
}

function advance(delta) {
  go(idx + delta);
}

muteBtn?.addEventListener("click", () => {
  unmuted = !unmuted;
  applyAudioState();
});

volSlider?.addEventListener("input", () => {
  volume = parseInt(volSlider.value, 10);
  localStorage.setItem(VOL_KEY, String(volume));
  if (player && ready) {
    try { player.setVolume(volume); } catch {}
  }
  if (volume === 0 && unmuted) { unmuted = false; applyAudioState(); }
});

prevBtn?.addEventListener("click", () => advance(-1));
nextBtn?.addEventListener("click", () => advance(1));
