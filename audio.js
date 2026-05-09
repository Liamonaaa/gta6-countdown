// Three sources, each with its own background video and audio.
// vibes    -> bg = 06YQ1cHfIKQ, audio = same iframe
// trailer1 -> bg = QdBZY2fkU-0, audio = same iframe
// trailer2 -> bg = VQRLujxTm3c (muted), audio = hH2gvfKZbL0 (songPlayer)

const VOL_KEY = "gta6-vol";
const SRC_KEY = "gta6-src";

const SOURCES = ["vibes", "trailer1", "trailer2"];
const LABELS = { vibes: "VIBES", trailer1: "TRAILER 1", trailer2: "TRAILER 2" };
const BG_VIDEO = {
  vibes: "06YQ1cHfIKQ",
  trailer1: "QdBZY2fkU-0",
  trailer2: "VQRLujxTm3c"
};

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");
const prevBtn = document.getElementById("apPrev");
const nextBtn = document.getElementById("apNext");
const labelEl = document.getElementById("apLabel");
const bgWrap = document.getElementById("bgVideoWrap");

let bgPlayer = null;
let songPlayer = null;
let bgReady = false;
let songReady = false;
let currentBgId = "06YQ1cHfIKQ";

let active = localStorage.getItem(SRC_KEY) || "vibes";
if (!SOURCES.includes(active)) active = "vibes";
let volume = parseInt(localStorage.getItem(VOL_KEY) ?? "55", 10);
let unmuted = true;

if (volSlider) volSlider.value = volume;
if (panel) {
  panel.dataset.muted = "false";
  panel.dataset.src = active;
}

// Browsers block autoplay-with-sound until a gesture. Retry on first
// user interaction so the muted->unmuted attempt actually takes.
const retryUnmute = () => {
  if (unmuted) applyAudioState();
};
document.addEventListener("pointerdown", retryUnmute, { once: true });
document.addEventListener("keydown", retryUnmute, { once: true });
document.addEventListener("touchstart", retryUnmute, { once: true });
if (labelEl) labelEl.textContent = LABELS[active];

(function loadYT() {
  if (window.YT && window.YT.Player) { initPlayers(); return; }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = initPlayers;

function initPlayers() {
  if (!window.YT || !window.YT.Player) return;

  if (!bgPlayer && document.getElementById("bgPlayer")) {
    bgPlayer = new YT.Player("bgPlayer", {
      events: {
        onReady: () => {
          bgReady = true;
          try {
            bgPlayer.setVolume(volume);
            bgPlayer.mute();
            bgPlayer.playVideo();
          } catch {}
          syncBgVideo(true);
          applyAudioState();
        },
        onStateChange: e => {
          if (e.data === YT.PlayerState.PLAYING) {
            bgWrap?.classList.add("playing");
          } else if (
            e.data === YT.PlayerState.BUFFERING ||
            e.data === YT.PlayerState.CUED ||
            e.data === YT.PlayerState.UNSTARTED
          ) {
            bgWrap?.classList.remove("playing");
          }
          if (e.data === YT.PlayerState.ENDED) {
            // active source video finished -> move to the next source
            if (active !== "trailer2") advance(1);
            else { try { bgPlayer.playVideo(); } catch {} }
          }
        }
      }
    });
  }

  if (!songPlayer && document.getElementById("songPlayer")) {
    songPlayer = new YT.Player("songPlayer", {
      events: {
        onReady: () => {
          songReady = true;
          try {
            songPlayer.setVolume(volume);
            songPlayer.mute();
            songPlayer.playVideo();
          } catch {}
          applyAudioState();
        },
        onStateChange: e => {
          if (e.data === YT.PlayerState.ENDED) {
            if (active === "trailer2") advance(1);
            else { try { songPlayer.playVideo(); } catch {} }
          }
        }
      }
    });
  }
}

function syncBgVideo(force) {
  const desired = BG_VIDEO[active];
  if (!force && desired === currentBgId) return;
  currentBgId = desired;
  if (!bgPlayer || !bgReady) return;
  bgWrap?.classList.remove("playing");
  try {
    bgPlayer.loadVideoById(desired);
  } catch {}
}

function applyAudioState() {
  syncBgVideo(false);

  // bgPlayer audio: only when active is vibes or trailer1
  if (bgPlayer && bgReady) {
    try {
      bgPlayer.setVolume(volume);
      if (unmuted && (active === "vibes" || active === "trailer1")) bgPlayer.unMute();
      else bgPlayer.mute();
    } catch {}
  }

  // songPlayer audio: only when active is trailer2
  if (songPlayer && songReady) {
    try {
      songPlayer.setVolume(volume);
      if (unmuted && active === "trailer2") songPlayer.unMute();
      else songPlayer.mute();
    } catch {}
  }

  if (panel) {
    panel.dataset.muted = unmuted ? "false" : "true";
    panel.dataset.src = active;
  }
  if (labelEl) labelEl.textContent = LABELS[active];
}

muteBtn?.addEventListener("click", () => {
  unmuted = !unmuted;
  applyAudioState();
});

volSlider?.addEventListener("input", () => {
  volume = parseInt(volSlider.value, 10);
  localStorage.setItem(VOL_KEY, String(volume));
  if (bgPlayer && bgReady) { try { bgPlayer.setVolume(volume); } catch {} }
  if (songPlayer && songReady) { try { songPlayer.setVolume(volume); } catch {} }
  if (volume === 0 && unmuted) { unmuted = false; applyAudioState(); }
});

function advance(delta) {
  const i = SOURCES.indexOf(active);
  active = SOURCES[((i + delta) % SOURCES.length + SOURCES.length) % SOURCES.length];
  localStorage.setItem(SRC_KEY, active);
  if (active === "trailer2" && songPlayer && songReady) {
    try { songPlayer.seekTo(0, true); } catch {}
  }
  applyAudioState();
}

prevBtn?.addEventListener("click", () => advance(-1));
nextBtn?.addEventListener("click", () => advance(1));
