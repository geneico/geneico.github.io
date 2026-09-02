(function () {
  "use strict";

  var videos = Array.prototype.slice.call(document.querySelectorAll("[data-product-video]"));
  if (!videos.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var observer;

  function activate(video) {
    if (video.dataset.activated === "true" || reducedMotion.matches) return;

    var sources = video.querySelectorAll("source[data-src]");
    Array.prototype.forEach.call(sources, function (source) {
      source.src = source.dataset.src;
    });

    video.dataset.activated = "true";
    video.load();
  }

  function play(video) {
    if (reducedMotion.matches) return;
    activate(video);
    var playRequest = video.play();
    if (playRequest && typeof playRequest.catch === "function") {
      playRequest.catch(function () {});
    }
  }

  function pauseAll() {
    videos.forEach(function (video) {
      video.pause();
    });
  }

  if (reducedMotion.matches) return;

  if (!("IntersectionObserver" in window)) {
    videos.forEach(play);
    return;
  }

  observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        play(entry.target);
      } else if (entry.target.dataset.activated === "true") {
        entry.target.pause();
      }
    });
  }, {
    rootMargin: "320px 0px",
    threshold: 0.01
  });

  videos.forEach(function (video) {
    observer.observe(video);
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", function (event) {
      if (event.matches) {
        pauseAll();
      } else {
        videos.forEach(function (video) {
          observer.observe(video);
        });
      }
    });
  }
}());
