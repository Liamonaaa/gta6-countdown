// YouTube IFrame API audio control for the bg video

const VOL_KEY = "gta6-vol";

const panel = document.getElementById("audioPanel");
const muteBtn = document.getElementById("apMute");
const volSlider = document.getElementById("apVolume");

let player = null;
let ready = false;
let volume = parseInt(localStorage.getItem(VOL_KEY) ?? "55", 10);
let unmuted = false;

if (volSlider) volSlider.value = volume;
if (panel) panel.dataset.muted = "true";

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
          player.playVideo();
        } catch {}
        applyAudioState();
      },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) {
          try { player.playVideo(); } catch {}
        }
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
