const tiles = document.querySelectorAll(".tile");
const viewer = document.querySelector(".viewer");
const viewerVideo = document.querySelector(".viewer__video");
const viewerTitle = document.querySelector(".viewer__title");
const closeButton = document.querySelector(".viewer__close");
const preloadedTiles = new Set();
const maxPreviewPlayers = 1;

function primePreview(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
}

function loadPreview(video) {
  if (!video.getAttribute("src")) {
    video.preload = "metadata";
    video.src = video.dataset.src;
    video.load();
  }
}

function pausePreview(video) {
  video.pause();
}

function unloadPreview(video) {
  video.pause();
  video.removeAttribute("src");
  video.load();
}

function playPreview(video) {
  if (viewer.open || !video) {
    return;
  }

  primePreview(video);
  loadPreview(video);
  video.play().catch(() => {});
}

function visibleRatio(rect) {
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  return visibleHeight / rect.height;
}

function tileDistanceFromViewport(tile) {
  const rect = tile.getBoundingClientRect();
  const tileCenter = rect.top + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;

  return Math.abs(tileCenter - viewportCenter);
}

function getVisibleTiles() {
  return [...tiles].filter((tile) => visibleRatio(tile.getBoundingClientRect()) >= 0.2);
}

function getScheduledTiles() {
  return getVisibleTiles()
    .sort((a, b) => tileDistanceFromViewport(a) - tileDistanceFromViewport(b))
    .slice(0, maxPreviewPlayers);
}

function tryHoverBackup(tile, video) {
  if (!getScheduledTiles().includes(tile)) {
    return;
  }

  playPreview(video);
}

function schedulePreviews() {
  if (viewer.open) {
    return;
  }

  const playingTiles = new Set(getScheduledTiles());

  tiles.forEach((tile) => {
    const video = tile.querySelector("video");

    if (!video) {
      return;
    }

    if (playingTiles.has(tile)) {
      playPreview(video);
    } else {
      pausePreview(video);
    }
  });
}

function cleanupFarPreviews() {
  if (viewer.open) {
    return;
  }

  tiles.forEach((tile) => {
    const video = tile.querySelector("video");
    const isFarAway = tileDistanceFromViewport(tile) > window.innerHeight * 2.4;

    if (video && video.getAttribute("src") && !preloadedTiles.has(tile) && isFarAway) {
      unloadPreview(video);
    }
  });
}

function unloadAllPreviews() {
  preloadedTiles.clear();

  tiles.forEach((tile) => {
    const video = tile.querySelector("video");

    if (video && video.getAttribute("src")) {
      unloadPreview(video);
    }
  });
}

function playViewer() {
  const attempt = viewerVideo.play();

  if (attempt) {
    attempt.catch(() => {
      viewerVideo.muted = true;
      viewerVideo.play().catch(() => {});
    });
  }
}

const preloadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");

      if (entry.isIntersecting) {
        preloadedTiles.add(entry.target);
      } else {
        preloadedTiles.delete(entry.target);
      }

      if (video && entry.isIntersecting) {
        loadPreview(video);
      }
    });
  },
  { rootMargin: "500px 0px", threshold: 0.01 }
);

tiles.forEach((tile) => {
  const video = tile.querySelector("video");
  const tileButton = tile.querySelector("button");
  const activate = () => tryHoverBackup(tile, video);

  primePreview(video);
  preloadObserver.observe(tile);

  video.addEventListener("loadeddata", schedulePreviews);
  video.addEventListener("canplay", schedulePreviews);

  tile.addEventListener("pointerenter", activate);
  tile.addEventListener("pointerover", activate);
  tile.addEventListener("mouseenter", activate);
  tile.addEventListener("mouseover", activate);
  tile.addEventListener("mousemove", activate);

  tileButton.addEventListener("pointerenter", activate);
  tileButton.addEventListener("pointerover", activate);
  tileButton.addEventListener("mouseenter", activate);
  tileButton.addEventListener("mouseover", activate);
  tileButton.addEventListener("mousemove", activate);
  tileButton.addEventListener("focus", activate);

  tileButton.addEventListener("click", () => {
    const src = tile.dataset.video;
    const title = tile.querySelector("span").textContent + " / " + tile.querySelector("b").textContent;

    unloadAllPreviews();
    viewerVideo.pause();
    viewerVideo.muted = false;
    viewerVideo.preload = "auto";
    viewerVideo.src = src;
    viewerTitle.textContent = title;
    viewer.showModal();
    viewerVideo.load();
    playViewer();
    viewerVideo.addEventListener("canplay", playViewer, { once: true });
  });
});

window.addEventListener("load", schedulePreviews);
window.addEventListener(
  "scroll",
  () => {
    schedulePreviews();
    cleanupFarPreviews();
  },
  { passive: true }
);
window.addEventListener("resize", schedulePreviews);
document.addEventListener("visibilitychange", schedulePreviews);
setTimeout(schedulePreviews, 350);
setTimeout(schedulePreviews, 1200);

function closeViewer() {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
  viewer.close();
  schedulePreviews();
}

closeButton.addEventListener("click", closeViewer);

viewer.addEventListener("click", (event) => {
  if (event.target === viewer) {
    closeViewer();
  }
});

viewer.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeViewer();
});
