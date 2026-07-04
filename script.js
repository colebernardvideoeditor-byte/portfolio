const tiles = document.querySelectorAll(".tile");
const viewer = document.querySelector(".viewer");
const viewerVideo = document.querySelector(".viewer__video");
const viewerTitle = document.querySelector(".viewer__title");
const closeButton = document.querySelector(".viewer__close");

function setupPreview(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.autoplay = true;
  video.preload = "auto";
  video.src = video.dataset.src;
  video.load();
}

function playPreview(video) {
  const attempt = video.play();

  if (attempt) {
    attempt.catch(() => {});
  }
}

function playAllPreviews() {
  if (viewer.open || document.hidden) {
    return;
  }

  tiles.forEach((tile) => {
    playPreview(tile.querySelector("video"));
  });
}

function pauseAllPreviews() {
  tiles.forEach((tile) => {
    tile.querySelector("video").pause();
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

    pauseAllPreviews();
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

window.addEventListener("load", playAllPreviews);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseAllPreviews();
  } else {
    playAllPreviews();
  }
});
setTimeout(playAllPreviews, 350);
setTimeout(playAllPreviews, 1200);

function closeViewer() {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
  viewer.close();
  playAllPreviews();
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
