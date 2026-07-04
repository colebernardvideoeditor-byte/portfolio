const tiles = document.querySelectorAll(".tile");
const viewer = document.querySelector(".viewer");
const viewerVideo = document.querySelector(".viewer__video");
const viewerTitle = document.querySelector(".viewer__title");
const closeButton = document.querySelector(".viewer__close");
let previewsSuspended = false;

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

function playViewer() {
  viewerVideo.muted = false;
  const attempt = viewerVideo.play();

  if (attempt) {
    attempt.catch(() => {
      viewerVideo.muted = true;
      const mutedAttempt = viewerVideo.play();

      if (mutedAttempt) {
        mutedAttempt.catch(() => {});
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
    viewerVideo.pause();
    viewerVideo.controls = true;
    viewerVideo.muted = false;
    viewerVideo.preload = "auto";
    viewerVideo.src = src;
    viewerTitle.textContent = title;
    viewer.showModal();
    viewerVideo.load();
    playViewer();
  });
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