const app = document.querySelector(".app");
const wallTrack = document.querySelector("#wallTrack");
const themeButton = document.querySelector("#themeButton");
const motionButton = document.querySelector("#motionButton");
const shuffleButton = document.querySelector("#shuffleButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const castButton = document.querySelector("#castButton");
const settingsButton = document.querySelector("#settingsButton");
const settingsPanel = document.querySelector("#settingsPanel");
const closeSettings = document.querySelector("#closeSettings");
const castPanel = document.querySelector("#castPanel");
const closeCast = document.querySelector("#closeCast");
const nativeAirplayButton = document.querySelector("#nativeAirplayButton");
const castStatus = document.querySelector("#castStatus");
const airplayVideo = document.querySelector("#airplayVideo");
const musicForm = document.querySelector("#musicForm");
const connectMusicButton = document.querySelector("#connectMusicButton");
const syncMusicButton = document.querySelector("#syncMusicButton");
const clearMusicButton = document.querySelector("#clearMusicButton");
const countRange = document.querySelector("#countRange");
const gapRange = document.querySelector("#gapRange");
const scaleRange = document.querySelector("#scaleRange");
const countOutput = document.querySelector("#countOutput");
const gapOutput = document.querySelector("#gapOutput");
const scaleOutput = document.querySelector("#scaleOutput");
const musicStatus = document.querySelector("#musicStatus");
const presetButtons = Array.from(document.querySelectorAll("[data-count]"));

const storageKey = "music-wall-state-v1";
const localMusicCacheKey = "music-wall-local-music-v1";
const palette = [
  ["#e95039", "#151413", "#f0c66a", "#227b6a"],
  ["#0f0f0e", "#d5d0c5", "#b2292f", "#e1a444"],
  ["#1c4b43", "#f5f0e6", "#d5533f", "#11110f"],
  ["#efe8d2", "#20201d", "#426d88", "#c6a047"],
  ["#222224", "#f0ede6", "#8f2f40", "#d9b765"],
  ["#d85f3b", "#f3e1bd", "#183b39", "#0f0f0d"],
  ["#101111", "#f7f4ed", "#cd4031", "#447d70"],
  ["#2b2a26", "#e0d4bc", "#a4342c", "#5e7d9c"],
  ["#f4f0e8", "#181816", "#c84832", "#222f45"],
  ["#163a32", "#f0e1b6", "#de6a3c", "#0e0e0d"],
  ["#2b1f1f", "#efede7", "#be3d35", "#345a50"],
  ["#11110f", "#e9d9b0", "#d9513b", "#4c7188"],
];

let localMusicCovers = loadLocalMusicCache();
let state = loadState();
let covers = buildSeedCovers(120);
let tileObserver = null;

function loadState() {
  try {
    return {
      theme: "dark",
      motion: true,
      count: 28,
      gap: 14,
      featureLevel: 1,
      ...JSON.parse(localStorage.getItem(storageKey) || "{}"),
    };
  } catch {
    return { theme: "dark", motion: true, count: 28, gap: 14, featureLevel: 1 };
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      theme: state.theme,
      motion: state.motion,
      count: state.count,
      gap: state.gap,
      featureLevel: state.featureLevel,
    }),
  );
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeedCovers(total) {
  return Array.from({ length: total }, (_, index) => ({
    id: `seed-${index}`,
    front: createCover(index, false),
    back: createCover(index + 97, true),
  }));
}

function createCover(index, alternate) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const colors = palette[index % palette.length];
  const random = mulberry32(index * 911 + (alternate ? 37 : 0));

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors[alternate ? 1 : 0]);
  gradient.addColorStop(0.52, colors[alternate ? 3 : 1]);
  gradient.addColorStop(1, colors[alternate ? 0 : 2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.88;
  const motif = index % 6;
  if (motif === 0) drawBands(ctx, size, colors, random);
  if (motif === 1) drawCircles(ctx, size, colors, random);
  if (motif === 2) drawGrid(ctx, size, colors, random);
  if (motif === 3) drawPoster(ctx, size, colors, random);
  if (motif === 4) drawWaves(ctx, size, colors, random);
  if (motif === 5) drawBlocks(ctx, size, colors, random);

  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#fff";
  ctx.fillRect(26, 26, size - 52, 1);
  ctx.fillRect(26, size - 27, size - 52, 1);
  ctx.globalAlpha = 1;

  ctx.fillStyle = alternate ? colors[2] : "rgba(255,255,255,0.9)";
  ctx.font = "700 24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(String(index + 1).padStart(2, "0"), 30, size - 36);

  return canvas.toDataURL("image/jpeg", 0.88);
}

function drawBands(ctx, size, colors, random) {
  for (let i = 0; i < 8; i += 1) {
    ctx.save();
    ctx.translate(size * random(), size * random());
    ctx.rotate((random() - 0.5) * 1.2);
    ctx.fillStyle = colors[(i + 2) % colors.length];
    ctx.fillRect(-size, -18, size * 2.4, 18 + random() * 54);
    ctx.restore();
  }
}

function drawCircles(ctx, size, colors, random) {
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.fillStyle = colors[(i + 1) % colors.length];
    ctx.arc(size * random(), size * random(), 24 + random() * 140, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGrid(ctx, size, colors, random) {
  const step = 52 + Math.round(random() * 28);
  ctx.strokeStyle = colors[2];
  ctx.lineWidth = 10;
  for (let x = -step; x < size + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + step * 1.8, size);
    ctx.stroke();
  }
  ctx.fillStyle = colors[3];
  ctx.fillRect(size * 0.18, size * 0.18, size * 0.42, size * 0.42);
}

function drawPoster(ctx, size, colors, random) {
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(60, 64, size - 120, size - 128);
  ctx.fillStyle = colors[0];
  ctx.fillRect(92, 94, size - 184, 54 + random() * 64);
  ctx.fillStyle = colors[2];
  ctx.fillRect(92, 202, size - 184, 160);
  ctx.fillStyle = colors[3];
  ctx.fillRect(92, 390, size - 184, 18);
}

function drawWaves(ctx, size, colors, random) {
  ctx.lineWidth = 22;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.strokeStyle = colors[i % colors.length];
    const y = 70 + i * 54;
    for (let x = -40; x <= size + 40; x += 30) {
      const wave = Math.sin(x / (42 + i * 3) + random() * 2) * (18 + i * 2);
      if (x === -40) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawBlocks(ctx, size, colors, random) {
  for (let i = 0; i < 18; i += 1) {
    ctx.fillStyle = colors[i % colors.length];
    const block = 48 + random() * 154;
    ctx.fillRect(size * random() - 20, size * random() - 20, block, block);
  }
}

function render() {
  app.dataset.theme = state.theme;
  app.classList.toggle("is-still", !state.motion);
  app.classList.toggle("has-local-music", localMusicCovers.length > 0);
  document.documentElement.style.setProperty("color-scheme", state.theme);
  app.style.setProperty("--gap", `${state.gap}px`);
  themeButton.title = state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  themeButton.setAttribute("aria-label", themeButton.title);
  themeButton.setAttribute("aria-pressed", String(state.theme === "light"));
  motionButton.title = state.motion ? "Pause motion" : "Resume motion";
  motionButton.setAttribute("aria-label", motionButton.title);
  motionButton.setAttribute("aria-pressed", String(!state.motion));
  countRange.value = state.count;
  gapRange.value = state.gap;
  scaleRange.value = state.featureLevel;
  countOutput.value = state.count;
  gapOutput.value = state.gap;
  scaleOutput.value = ["Flat", "Balanced", "Gallery"][state.featureLevel];
  musicStatus.value = localMusicCovers.length ? `${localMusicCovers.length}` : "Local";
  presetButtons.forEach((button) => button.classList.toggle("is-active", Number(button.dataset.count) === state.count));
  updateFullscreenButton();
  updateNativeAirplayState();
  renderWall();
  saveState();
}

function renderWall() {
  const sourceCovers = localMusicCovers.length ? localMusicCovers : covers;
  const activeCovers = sourceCovers;
  const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
  const columns = Math.max(2, Math.round(Math.sqrt(state.count * aspect)));
  wallTrack.style.setProperty("--columns", columns);
  wallTrack.replaceChildren(...activeCovers.map((cover, index) => createTile(cover, index, columns)));
  setupIntersectionObserver();
}

function setupIntersectionObserver() {
  if (tileObserver) {
    tileObserver.disconnect();
  }

  tileObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const tile = entry.target;
      const front = tile.querySelector(".tile-face.front");
      const back = tile.querySelector(".tile-face.back");

      if (entry.isIntersecting) {
        if (!tile.classList.contains("in-view")) {
          front.src = tile.dataset.front;
          back.src = tile.dataset.back;
          tile.classList.add("in-view");
        }
      } else {
        if (tile.classList.contains("in-view")) {
          tile.classList.remove("in-view");
          front.src = "";
          back.src = "";
        }
      }
    });
  }, {
    root: document.querySelector(".wall-stage"),
    rootMargin: "300px 0px 300px 0px"
  });

  const tiles = wallTrack.querySelectorAll(".tile");
  tiles.forEach((tile) => tileObserver.observe(tile));
}

function createTile(cover, index, columns) {
  const tile = document.createElement("article");
  tile.className = "tile";
  tile.dataset.front = cover.front;
  tile.dataset.back = cover.back || cover.front;

  const featureCadence = state.featureLevel === 0 ? 999 : state.featureLevel === 1 ? 11 : 7;
  if (index % featureCadence === 0 && columns > 3) tile.classList.add("feature");
  else if (state.featureLevel === 2 && index % 9 === 4 && columns > 4) tile.classList.add("wide");
  tile.style.setProperty("--flip-delay", `${(index % 13) * -1.35}s`);
  tile.style.setProperty("--flip-duration", `${17 + (index % 7) * 1.7}s`);
  tile.style.setProperty("--float-delay", `${(index % 9) * -0.8}s`);
  tile.style.setProperty("--float-duration", `${11 + (index % 6)}s`);
  tile.style.setProperty("--float-x", `${((index % 5) - 2) * 2.4}px`);
  tile.style.setProperty("--float-y", `${((index % 7) - 3) * 2.1}px`);

  const inner = document.createElement("div");
  inner.className = "tile-inner";
  const front = document.createElement("img");
  front.className = "tile-face front";
  front.alt = "";
  front.decoding = "async";
  const back = document.createElement("img");
  back.className = "tile-face back";
  back.alt = "";
  back.decoding = "async";
  inner.append(front, back);
  tile.append(inner);
  return tile;
}

function loadLocalMusicCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(localMusicCacheKey) || "[]");
    return Array.isArray(cache) ? cache.filter((cover) => cover && cover.front) : [];
  } catch {
    return [];
  }
}

function saveLocalMusicCache(albums) {
  localMusicCovers = albums;
  localStorage.setItem(localMusicCacheKey, JSON.stringify(albums));
}

function setMusicStatus(label) {
  musicStatus.value = label;
}

async function syncLocalMusic({ refresh = true } = {}) {
  connectMusicButton.disabled = true;
  syncMusicButton.disabled = true;
  setMusicStatus(refresh ? "Syncing" : "Loading");

  try {
    const response = await fetch(refresh ? "/api/local-music/sync" : "/api/local-music/albums", {
      method: refresh ? "POST" : "GET",
    });

    if (!response.ok) {
      throw new Error(`Local Music sync returned ${response.status}`);
    }

    const payload = await response.json();
    const albums = Array.isArray(payload.albums) ? payload.albums : [];
    const shuffled = [...albums].sort(() => Math.random() - 0.5);
    saveLocalMusicCache(shuffled);
    setMusicStatus(albums.length ? String(albums.length) : "Empty");
    render();
  } catch (error) {
    console.error(error);
    setMusicStatus("Failed");
  } finally {
    connectMusicButton.disabled = false;
    syncMusicButton.disabled = false;
  }
}

async function loadLocalMusicManifest() {
  if (localMusicCovers.length) return;

  try {
    const response = await fetch("/api/local-music/albums");
    if (!response.ok) return;

    const payload = await response.json();
    const albums = Array.isArray(payload.albums) ? payload.albums : [];
    if (!albums.length) return;

    const shuffled = [...albums].sort(() => Math.random() - 0.5);
    saveLocalMusicCache(shuffled);
    render();
  } catch {
    // Opening index.html directly still works with generated covers.
  }
}

function clearLocalMusic() {
  localMusicCovers = [];
  localStorage.removeItem(localMusicCacheKey);
  render();
}

function toggleSettings(force) {
  const isOpen = typeof force === "boolean" ? force : !settingsPanel.classList.contains("is-open");
  if (isOpen) toggleCastPanel(false);
  settingsPanel.classList.toggle("is-open", isOpen);
  settingsPanel.setAttribute("aria-hidden", String(!isOpen));
  settingsButton.setAttribute("aria-expanded", String(isOpen));
}

function toggleCastPanel(force) {
  const isOpen = typeof force === "boolean" ? force : !castPanel.classList.contains("is-open");
  if (isOpen) toggleSettings(false);
  castPanel.classList.toggle("is-open", isOpen);
  castPanel.setAttribute("aria-hidden", String(!isOpen));
  castButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) updateNativeAirplayState();
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function fullscreenSupported() {
  return Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
}

function updateFullscreenButton() {
  if (!fullscreenButton) return;

  const isActive = Boolean(fullscreenElement());
  const label = isActive ? "Exit fullscreen" : "Enter fullscreen";
  fullscreenButton.title = label;
  fullscreenButton.setAttribute("aria-label", label);
  fullscreenButton.classList.toggle("is-active", isActive);
  app.classList.toggle("is-fullscreen", isActive);
}

async function enterFullscreen({ silent = false } = {}) {
  if (fullscreenElement()) return true;

  try {
    const target = document.documentElement;
    if (target.requestFullscreen) {
      await target.requestFullscreen();
    } else if (target.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
    } else {
      throw new Error("Fullscreen API is not available in this browser");
    }

    updateFullscreenButton();
    return true;
  } catch {
    if (!silent) setCastStatus("Fullscreen is unavailable in this browser");
    return false;
  }
}

async function exitFullscreen() {
  if (!fullscreenElement()) return true;

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }

    updateFullscreenButton();
    return true;
  } catch {
    return false;
  }
}

async function toggleFullscreen() {
  if (!fullscreenSupported()) {
    setCastStatus("Fullscreen is unavailable in this browser");
    toggleCastPanel(true);
    return;
  }

  if (fullscreenElement()) {
    await exitFullscreen();
  } else {
    await enterFullscreen();
  }
}

function setCastStatus(label) {
  if (castStatus) castStatus.value = label;
}

function hasNativeAirplayPicker() {
  return Boolean(airplayVideo && typeof airplayVideo.webkitShowPlaybackTargetPicker === "function");
}

function hasRemotePlaybackPicker() {
  return Boolean(airplayVideo?.remote && typeof airplayVideo.remote.prompt === "function");
}

function updateNativeAirplayState() {
  if (!nativeAirplayButton) return;

  const hasPicker = hasNativeAirplayPicker() || hasRemotePlaybackPicker();
  nativeAirplayButton.disabled = !hasPicker;
  nativeAirplayButton.title = hasPicker
    ? "Open the browser AirPlay picker"
    : "Full-page AirPlay is not available from browser JavaScript";
  if (!hasPicker && castPanel?.classList.contains("is-open")) {
    setCastStatus("No direct webpage casting API");
  }
}

async function prepareAirplayVideo() {
  if (!airplayVideo) return false;
  airplayVideo.muted = true;
  airplayVideo.playsInline = true;
  airplayVideo.setAttribute("x-webkit-airplay", "allow");

  if ("disableRemotePlayback" in airplayVideo) {
    airplayVideo.disableRemotePlayback = false;
  }

  if (!airplayVideo.srcObject && typeof HTMLCanvasElement !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext("2d");
    context.fillStyle = "#10100f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (typeof canvas.captureStream === "function") {
      airplayVideo.srcObject = canvas.captureStream(1);
    }
  }

  try {
    await airplayVideo.play();
  } catch {
    // Some browsers allow the picker without starting hidden muted media.
  }

  return true;
}

async function openNativeAirplayPicker() {
  toggleCastPanel(true);

  if (!hasNativeAirplayPicker() && !hasRemotePlaybackPicker()) {
    setCastStatus("No direct webpage casting API");
    return;
  }

  try {
    await prepareAirplayVideo();

    if (hasNativeAirplayPicker()) {
      airplayVideo.webkitShowPlaybackTargetPicker();
      setCastStatus("AirPlay picker opened");
      return;
    }

    await airplayVideo.remote.prompt();
    setCastStatus("Remote playback picker opened");
  } catch {
    setCastStatus("AirPlay did not accept this page");
  }
}

themeButton.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  render();
});

motionButton.addEventListener("click", () => {
  state.motion = !state.motion;
  render();
});

shuffleButton.addEventListener("click", () => {
  if (localMusicCovers.length) {
    localMusicCovers = [...localMusicCovers].sort(() => Math.random() - 0.5);
    saveLocalMusicCache(localMusicCovers);
  } else {
    covers = [...covers].sort(() => Math.random() - 0.5);
  }
  renderWall();
});

fullscreenButton.addEventListener("click", toggleFullscreen);
castButton.addEventListener("click", openNativeAirplayPicker);
settingsButton.addEventListener("click", () => toggleSettings());
closeSettings.addEventListener("click", () => toggleSettings(false));
closeCast.addEventListener("click", () => toggleCastPanel(false));
nativeAirplayButton.addEventListener("click", openNativeAirplayPicker);

musicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  syncLocalMusic();
});
syncMusicButton.addEventListener("click", () => syncLocalMusic({ refresh: false }));
clearMusicButton.addEventListener("click", clearLocalMusic);

countRange.addEventListener("input", (event) => {
  state.count = Number(event.target.value);
  render();
});

gapRange.addEventListener("input", (event) => {
  state.gap = Number(event.target.value);
  render();
});

scaleRange.addEventListener("input", (event) => {
  state.featureLevel = Number(event.target.value);
  render();
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.count = Number(button.dataset.count);
    render();
  });
});

window.addEventListener("resize", () => {
  window.clearTimeout(window.resizeTimer);
  window.resizeTimer = window.setTimeout(renderWall, 120);
});

document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleSettings(false);
    toggleCastPanel(false);
  }
});

let autoScrollActive = true;
let scrollDirection = 1; // 1 = down, -1 = up
let scrollSpeed = 0.5; // pixels per frame
let isAutoScrolling = false;
let userScrollTimeout = null;
const userScrollPauseMs = 9000;
const panelResumeDelayMs = 1000;
const scrollIntentKeys = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]);

function panelsOpen() {
  return settingsPanel.classList.contains("is-open") || castPanel.classList.contains("is-open");
}

function scheduleAutoScrollResume(delay = userScrollPauseMs) {
  clearTimeout(userScrollTimeout);
  userScrollTimeout = setTimeout(() => {
    userScrollTimeout = null;
    if (!panelsOpen()) {
      autoScrollActive = true;
    }
  }, delay);
}

function pauseAutoScrollForUser(delay = userScrollPauseMs) {
  autoScrollActive = false;
  scheduleAutoScrollResume(delay);
}

function startAutoScroll() {
  const stage = document.querySelector(".wall-stage");
  if (!stage) return;

  function scrollLoop() {
    if (!state.motion || !autoScrollActive || panelsOpen()) {
      requestAnimationFrame(scrollLoop);
      return;
    }

    const maxScroll = stage.scrollHeight - stage.clientHeight;
    if (maxScroll > 0) {
      let currentScroll = stage.scrollTop;
      currentScroll += scrollSpeed * scrollDirection;

      if (currentScroll >= maxScroll) {
        currentScroll = maxScroll;
        scrollDirection = -1;
      } else if (currentScroll <= 0) {
        currentScroll = 0;
        scrollDirection = 1;
      }

      isAutoScrolling = true;
      stage.scrollTop = currentScroll;
      requestAnimationFrame(() => {
        isAutoScrolling = false;
      });
    }
    requestAnimationFrame(scrollLoop);
  }

  stage.addEventListener("scroll", () => {
    if (isAutoScrolling) {
      isAutoScrolling = false;
      return;
    }

    pauseAutoScrollForUser();
  });

  stage.addEventListener("wheel", () => pauseAutoScrollForUser(), { passive: true });
  stage.addEventListener("touchstart", () => pauseAutoScrollForUser(), { passive: true });
  stage.addEventListener("touchmove", () => pauseAutoScrollForUser(), { passive: true });
  stage.addEventListener("pointerdown", () => pauseAutoScrollForUser(), { passive: true });

  document.addEventListener("keydown", (event) => {
    if (!scrollIntentKeys.has(event.key)) return;
    const target = event.target;
    const isEditing = target?.matches?.("input, textarea, select, button, [contenteditable='true']");
    if (!isEditing) pauseAutoScrollForUser();
  });

  const observer = new MutationObserver(() => {
    if (panelsOpen()) {
      clearTimeout(userScrollTimeout);
      userScrollTimeout = null;
      autoScrollActive = false;
    } else {
      scheduleAutoScrollResume(panelResumeDelayMs);
    }
  });
  observer.observe(settingsPanel, { attributes: true, attributeFilter: ["class"] });
  observer.observe(castPanel, { attributes: true, attributeFilter: ["class"] });

  requestAnimationFrame(scrollLoop);
}

render();
loadLocalMusicManifest();
startAutoScroll();
