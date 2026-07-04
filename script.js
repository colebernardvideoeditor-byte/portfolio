const tiles = document.querySelectorAll(".tile");
const viewer = document.querySelector(".viewer");
const viewerVideo = document.querySelector(".viewer__video");
const viewerTitle = document.querySelector(".viewer__title");
const closeButton = document.querySelector(".viewer__close");
const playableTiles = new Set();
let priorityTile = null;
let hoveredTile = null;
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

function activateTilePreview(tile, video) {
  priorityTile = tile;
  playableTiles.add(tile);
  playPreview(video);
}

function releaseTilePreview(tile) {
  if (priorityTile === tile) {
    priorityTile = null;
  }

  schedulePreviews();
}

function activatePointPreview(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const tile = element && element.closest ? element.closest(".tile") : null;

  if (!tile || tile === hoveredTile) {
    return;
  }

  if (hoveredTile) {
    releaseTilePreview(hoveredTile);
  }

  hoveredTile = tile;
  activateTilePreview(tile, tile.querySelector("video"));
}

function clearPointPreview(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const tile = element && element.closest ? element.closest(".tile") : null;

  if (!hoveredTile || tile === hoveredTile) {
    return;
  }

  const tileToRelease = hoveredTile;
  hoveredTile = null;
  releaseTilePreview(tileToRelease);
}

function tileDistanceFromViewport(tile) {
  const rect = tile.getBoundingClientRect();
  const tileCenter = rect.top + rect.height / 2;
  const viewportCenter = window.innerHeight / 2;

  return Math.abs(tileCenter - viewportCenter);
}

function schedulePreviews() {
  if (viewer.open) {
    return;
  }

  const prioritizedTiles = [...playableTiles].sort((a, b) => tileDistanceFromViewport(a) - tileDistanceFromViewport(b));

  if (priorityTile) {
    prioritizedTiles.unshift(priorityTile);
  }

  const playingTiles = new Set(prioritizedTiles.slice(0, maxPreviewPlayers));

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

    if (video && video.getAttribute("src") && !playableTiles.has(tile) && isFarAway) {
      unloadPreview(video);
    }
  });
}

function unloadAllPreviews() {
  playableTiles.clear();
  priorityTile = null;
  hoveredTile = null;

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

      if (video && entry.isIntersecting) {
        loadPreview(video);
      }
    });
  },
  { rootMargin: "500px 0px", threshold: 0.01 }
);

const playbackObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        playableTiles.add(entry.target);
      } else {
        playableTiles.delete(entry.target);
      }
    });

    schedulePreviews();
    cleanupFarPreviews();
  },
  { rootMargin: "0px", threshold: 0.2 }
);

tiles.forEach((tile) => {
  const video = tile.querySelector("video");
  const tileButton = tile.querySelector("button");
  const activate = () => activateTilePreview(tile, video);
  const release = () => releaseTilePreview(tile);

  primePreview(video);
  preloadObserver.observe(tile);
  playbackObserver.observe(tile);

  video.addEventListener("loadeddata", schedulePreviews);
  video.addEventListener("canplay", schedulePreviews);

  tile.addEventListener("pointerenter", activate);
  tile.addEventListener("pointerover", activate);
  tile.addEventListener("pointerleave", release);
  tile.addEventListener("mouseenter", activate);
  tile.addEventListener("mouseover", activate);
  tile.addEventListener("mousemove", activate);
  tile.addEventListener("mouseleave", release);

  tileButton.addEventListener("pointerenter", activate);
  tileButton.addEventListener("pointerover", activate);
  tileButton.addEventListener("mouseenter", activate);
  tileButton.addEventListener("mouseover", activate);
  tileButton.addEventListener("mousemove", activate);
  tileButton.addEventListener("focus", activate);
  tileButton.addEventListener("blur", release);

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

document.addEventListener("pointermove", activatePointPreview);
document.addEventListener("mousemove", activatePointPreview);
document.addEventListener("mouseout", clearPointPreview);
window.addEventListener("load", schedulePreviews);
window.addEventListener(
  "scroll",
  () => {
    schedulePreviews();
    cleanupFarPreviews();
  },
  { passive: true }
);
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
