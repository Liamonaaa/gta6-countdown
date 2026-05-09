// YouTube IFrame API audio control
// Two players: bgPlayer (trailer video, visible bg) + themePlayer (Vice City theme, audio-only hidden)
// User picks active source. Browsers require user gesture to unmute.

const VOL_KEY = "gta6-vol";
const SRC_KEY = "gta6-src";

let bgPlayer = null;
let themePlayer = null;
let ready = { bg: false, theme: false };

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");
const srcTrailer = document.getElementById("apSrcTrailer");
const srcTheme = document.getElementById("apSrcTheme");

let active = localStorage.getItem(SRC_KEY) || "theme";
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
  bgPlayer = new YT.Player("bgPlayer", {
    events: {
      onReady: () => {
        ready.bg = true;
        try { bgPlayer.setVolume(volume); bgPlayer.mute(); bgPlayer.playVideo(); } catch {}
        applyAudioState();
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) try { bgPlayer.playVideo(); } catch {}
      }
    }
  });
  themePlayer = new YT.Player("themePlayer", {
    events: {
      onReady: () => {
        ready.theme = true;
        try { themePlayer.setVolume(volume); themePlayer.mute(); themePlayer.playVideo(); } catch {}
        applyAudioState();
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) try { themePlayer.playVideo(); } catch {}
      }
    }
  });
}

function applyAudioState() {
  if (!bgPlayer || !themePlayer) return;
  const wantTrailer = active === "trailer";
  try {
    bgPlayer.setVolume(volume);
    themePlayer.setVolume(volume);
    if (unmuted && wantTrailer) {
      bgPlayer.unMute();
      themePlayer.mute();
    } else if (unmuted && !wantTrailer) {
      themePlayer.unMute();
      bgPlayer.mute();
    } else {
      bgPlayer.mute();
      themePlayer.mute();
    }
  } catch {}
  panel.dataset.active = active;
  panel.dataset.muted = unmuted ? "false" : "true";
}

function setActiveUI(src) {
  if (srcTrailer) srcTrailer.classList.toggle("active", src === "trailer");
  if (srcTheme)   srcTheme.classList.toggle("active", src === "theme");
  if (panel)      panel.dataset.active = src;
}

muteBtn?.addEventListener("click", () => {
  unmuted = !unmuted;
  applyAudioState();
});

volSlider?.addEventListener("input", () => {
  volume = parseInt(volSlider.value, 10);
  localStorage.setItem(VOL_KEY, String(volume));
  if (bgPlayer && ready.bg)    try { bgPlayer.setVolume(volume); } catch {}
  if (themePlayer && ready.theme) try { themePlayer.setVolume(volume); } catch {}
  if (volume === 0 && unmuted) { unmuted = false; applyAudioState(); }
});

srcTrailer?.addEventListener("click", () => {
  active = "trailer";
  localStorage.setItem(SRC_KEY, active);
  setActiveUI(active);
  applyAudioState();
});

srcTheme?.addEventListener("click", () => {
  active = "theme";
  localStorage.setItem(SRC_KEY, active);
  setActiveUI(active);
  applyAudioState();
});
