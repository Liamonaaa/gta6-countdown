// Three sources, each with its own background video and audio.
// vibes    -> bg = 06YQ1cHfIKQ (YT iframe), audio = same iframe
// trailer1 -> bg = QdBZY2fkU-0 (YT iframe), audio = same iframe
// trailer2 -> bg = VQRLujxTm3c (YT iframe, muted), audio = local audio/theme.webm

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
const songEl = document.getElementById("songPlayer");

let bgPlayer = null;
let bgReady = false;
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
if (labelEl) labelEl.textContent = LABELS[active];

if (songEl) {
  songEl.volume = volume / 100;
  songEl.muted = true;
  songEl.loop = false; // we manage end-of-track via "ended" listener
  songEl.addEventListener("ended", () => {
    if (active === "trailer2") advance(1);
    else { try { songEl.currentTime = 0; songEl.play().catch(() => {}); } catch {} }
  });
  // Best-effort initial play; browsers may keep it paused until gesture
  songEl.play().catch(() => {});
}

function isActivePlayerMuted() {
  if (active === "trailer2") {
    return !songEl || songEl.muted || songEl.paused;
  }
  return !bgPlayer || (bgPlayer.isMuted && bgPlayer.isMuted());
}

(function loadYT() {
  if (window.YT && window.YT.Player) { initBg(); return; }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
})();

window.onYouTubeIframeAPIReady = initBg;

function initBg() {
  if (!window.YT || !window.YT.Player) return;
  if (bgPlayer || !document.getElementById("bgPlayer")) return;
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
          if (active !== "trailer2") advance(1);
          else { try { bgPlayer.playVideo(); } catch {} }
        }
      }
    }
  });
}

function syncBgVideo(force) {
  const desired = BG_VIDEO[active];
  if (!force && desired === currentBgId) return;
  currentBgId = desired;
  if (!bgPlayer || !bgReady) return;
  bgWrap?.classList.remove("playing");
  try { bgPlayer.loadVideoById(desired); } catch {}
}

function applyAudioState() {
  syncBgVideo(false);

  if (bgPlayer && bgReady) {
    try {
      bgPlayer.setVolume(volume);
      if (unmuted && (active === "vibes" || active === "trailer1")) bgPlayer.unMute();
      else bgPlayer.mute();
    } catch {}
  }

  if (songEl) {
    songEl.volume = volume / 100;
    if (unmuted && active === "trailer2") {
      songEl.muted = false;
      songEl.play().catch(() => {});
    } else {
      songEl.muted = true;
    }
  }

  if (panel) {
    panel.dataset.muted = unmuted ? "false" : "true";
    panel.dataset.src = active;
  }
  if (labelEl) labelEl.textContent = LABELS[active];
}

muteBtn?.addEventListener("click", () => {
  // First click after page load: state says unmuted but the browser
  // blocked autoplay-with-sound. This click is the user gesture that
  // unblocks audio - just apply the state instead of toggling silent.
  if (unmuted && isActivePlayerMuted()) {
    applyAudioState();
    return;
  }
  unmuted = !unmuted;
  applyAudioState();
});

volSlider?.addEventListener("input", () => {
  volume = parseInt(volSlider.value, 10);
  localStorage.setItem(VOL_KEY, String(volume));
  if (bgPlayer && bgReady) { try { bgPlayer.setVolume(volume); } catch {} }
  if (songEl) songEl.volume = volume / 100;
  if (volume === 0 && unmuted) { unmuted = false; applyAudioState(); }
});

function advance(delta) {
  const i = SOURCES.indexOf(active);
  active = SOURCES[((i + delta) % SOURCES.length + SOURCES.length) % SOURCES.length];
  localStorage.setItem(SRC_KEY, active);
  if (active === "trailer2" && songEl) {
    try { songEl.currentTime = 0; songEl.play().catch(() => {}); } catch {}
  }
  applyAudioState();
}

prevBtn?.addEventListener("click", () => advance(-1));
nextBtn?.addEventListener("click", () => advance(1));
