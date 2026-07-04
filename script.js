const tiles = document.querySelectorAll(".tile");
const viewer = document.querySelector(".viewer");
const viewerVideo = document.querySelector(".viewer__video");
const viewerTitle = document.querySelector(".viewer__title");
const closeButton = document.querySelector(".viewer__close");
const toggleButton = document.querySelector(".viewer__toggle");
const scrub = document.querySelector(".viewer__scrub");
const muteButton = document.querySelector(".viewer__mute");
let previewsSuspended = false;
let isScrubbing = false;

function setupPreview(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;
  video.preload = "auto";

  if (!video.getAttribute("src")) {
    video.src = video.dataset.src;
    video.load();
  }
}

function playPreview(video) {
  if (previewsSuspended || document.hidden) {
    return;
  }

  const attempt = video.play();

  if (attempt) {
    attempt.catch(() => {});
  }
}

function playAllPreviews() {
  if (viewer.open || previewsSuspended || document.hidden) {
    return;
  }

  tiles.forEach((tile) => {
    const video = tile.querySelector("video");
    setupPreview(video);
    playPreview(video);
  });
}

function suspendPreviews() {
  previewsSuspended = true;

  tiles.forEach((tile) => {
    const video = tile.querySelector("video");
    video.pause();
    video.removeAttribute("src");
    video.src = "";
    video.load();
  });
}

function restorePreviews() {
  previewsSuspended = false;
  playAllPreviews();
}

function updateControls() {
  const duration = Number.isFinite(viewerVideo.duration) ? viewerVideo.duration : 0;
  scrub.max = duration ? duration.toString() : "100";

  if (!isScrubbing) {
    scrub.value = Number.isFinite(viewerVideo.currentTime) ? viewerVideo.currentTime.toString() : "0";
  }

  toggleButton.textContent = viewerVideo.paused ? "PLAY" : "PAUSE";
  toggleButton.setAttribute("aria-label", viewerVideo.paused ? "Play video" : "Pause video");
  muteButton.textContent = viewerVideo.muted ? "MUTED" : "SOUND";
}

function setViewerShape(tile) {
  viewer.classList.remove("viewer--portrait", "viewer--four-five", "viewer--wide");

  if (tile.classList.contains("tile--nine-sixteen")) {
    viewer.classList.add("viewer--portrait");
  } else if (tile.classList.contains("tile--four-five")) {
    viewer.classList.add("viewer--four-five");
  } else {
    viewer.classList.add("viewer--wide");
  }
}

function playViewer(allowMutedFallback = true) {
  const attempt = viewerVideo.play();

  if (attempt) {
    attempt.catch(() => {
      if (!allowMutedFallback) {
        updateControls();
        return;
      }

      viewerVideo.muted = true;
      const mutedAttempt = viewerVideo.play();

      if (mutedAttempt) {
        mutedAttempt.catch(() => updateControls());
      }
    });
  }
}

tiles.forEach((tile) => {
  const previewVideo = tile.querySelector("video");
  const tileButton = tile.querySelector("button");

  setupPreview(previewVideo);
  previewVideo.addEventListener("canplay", () => playPreview(previewVideo));

  tileButton.addEventListener("pointerenter", () => playPreview(previewVideo));
  tileButton.addEventListener("focus", () => playPreview(previewVideo));

  tileButton.addEventListener("click", () => {
    const src = tile.dataset.video;
    const title = tile.querySelector("span").textContent + " / " + tile.querySelector("b").textContent;

    suspendPreviews();
    setViewerShape(tile);
    viewerVideo.pause();
    viewerVideo.controls = false;
    viewerVideo.muted = false;
    viewerVideo.preload = "auto";
    viewerVideo.src = src;
    viewerTitle.textContent = title;
    scrub.value = "0";
    updateControls();
    viewer.showModal();
    viewerVideo.load();
    playViewer(true);
  });
});

function handleTogglePlay() {
  if (viewerVideo.paused) {
    viewerVideo.muted = true;
    playViewer(false);
  } else {
    viewerVideo.pause();
  }

  updateControls();
}

toggleButton.addEventListener("click", handleTogglePlay);
viewerVideo.addEventListener("click", handleTogglePlay);

muteButton.addEventListener("click", () => {
  viewerVideo.muted = !viewerVideo.muted;
  updateControls();
});

scrub.addEventListener("pointerdown", () => {
  isScrubbing = true;
});

scrub.addEventListener("pointerup", () => {
  isScrubbing = false;
});

scrub.addEventListener("input", () => {
  const nextTime = Number(scrub.value);

  if (Number.isFinite(nextTime)) {
    viewerVideo.currentTime = nextTime;
  }
});

["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "volumechange", "canplay"].forEach((eventName) => {
  viewerVideo.addEventListener(eventName, updateControls);
});

window.addEventListener("load", playAllPreviews);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    suspendPreviews();
  } else if (!viewer.open) {
    restorePreviews();
  }
});
setTimeout(playAllPreviews, 350);
setTimeout(playAllPreviews, 1200);

function closeViewer() {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.src = "";
  viewerVideo.load();
  viewer.close();
  restorePreviews();
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