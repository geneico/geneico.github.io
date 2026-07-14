(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var viewport = carousel.querySelector('[data-carousel-viewport]');
    var track = carousel.querySelector('.carousel-track');
    var cards = Array.prototype.slice.call(carousel.querySelectorAll('.product-card'));
    var previous = carousel.querySelector('[data-carousel-previous]');
    var next = carousel.querySelector('[data-carousel-next]');
    var pagination = carousel.querySelector('[data-carousel-pagination]');
    var pageStarts = [];
    var activePage = 0;
    var scrollFrame = 0;
    var resizeFrame = 0;
    var pointerState = null;
    var suppressClickFromDrag = false;

    if (!viewport || !track || !cards.length || !previous || !next || !pagination) {
      return;
    }

    cards.forEach(function (card) {
      card.setAttribute('draggable', 'false');
      var cardImage = card.querySelector('img');
      if (!cardImage) {
        return;
      }
      cardImage.setAttribute('draggable', 'false');
      cardImage.addEventListener('dragstart', function (event) {
        event.preventDefault();
      });
    });

    function targetForPage(page) {
      var card = cards[pageStarts[page]];
      var maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      return Math.min(card ? card.offsetLeft - track.offsetLeft : 0, maxScroll);
    }

    function nearestPage() {
      var nearest = 0;
      var distance = Infinity;

      pageStarts.forEach(function (_, page) {
        var pageDistance = Math.abs(viewport.scrollLeft - targetForPage(page));
        if (pageDistance < distance) {
          distance = pageDistance;
          nearest = page;
        }
      });

      return nearest;
    }

    function updateControls() {
      activePage = nearestPage();
      previous.disabled = activePage === 0;
      next.disabled = activePage === pageStarts.length - 1;

      Array.prototype.forEach.call(pagination.children, function (dot, index) {
        dot.setAttribute('aria-current', index === activePage ? 'true' : 'false');
      });
    }

    function goToPage(page) {
      var destination = Math.max(0, Math.min(page, pageStarts.length - 1));
      viewport.scrollTo({
        left: targetForPage(destination),
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
      activePage = destination;
      updateControls();
    }

    function buildPagination() {
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      var cardWidth = cards[0].getBoundingClientRect().width;
      var visible = Math.max(1, Math.round((viewport.clientWidth + gap) / (cardWidth + gap)));
      var finalStart = Math.max(0, cards.length - visible);
      var start;

      pageStarts = [];
      for (start = 0; start < finalStart; start += visible) {
        pageStarts.push(start);
      }
      pageStarts.push(finalStart);
      pageStarts = pageStarts.filter(function (value, index, values) {
        return index === 0 || value !== values[index - 1];
      });

      pagination.replaceChildren();
      pageStarts.forEach(function (_, page) {
        var dot = document.createElement('button');
        var isGreek = document.documentElement.lang === 'el';
        dot.className = 'carousel-dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', (isGreek ? 'Μετάβαση στη θέση ' : 'Go to carousel position ') + (page + 1));
        dot.addEventListener('click', function () {
          goToPage(page);
        });
        pagination.appendChild(dot);
      });

      updateControls();
    }

    previous.addEventListener('click', function () {
      goToPage(nearestPage() - 1);
    });

    next.addEventListener('click', function () {
      goToPage(nearestPage() + 1);
    });

    viewport.addEventListener('keydown', function (event) {
      if (event.target !== viewport || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
        return;
      }
      event.preventDefault();
      goToPage(nearestPage() + (event.key === 'ArrowRight' ? 1 : -1));
    });

    viewport.addEventListener('scroll', function () {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(updateControls);
    }, { passive: true });

    viewport.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
        return;
      }
      suppressClickFromDrag = false;
      pointerState = {
        id: event.pointerId,
        type: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        startScroll: viewport.scrollLeft,
        dragging: false
      };
    });

    viewport.addEventListener('pointermove', function (event) {
      if (!pointerState || event.pointerId !== pointerState.id) {
        return;
      }
      var distanceX = event.clientX - pointerState.startX;
      var distanceY = event.clientY - pointerState.startY;

      if (!pointerState.dragging && Math.abs(distanceX) > 12 && Math.abs(distanceX) > Math.abs(distanceY)) {
        pointerState.dragging = true;
        viewport.classList.add('is-dragging');
        if (pointerState.type === 'mouse') {
          viewport.setPointerCapture(event.pointerId);
        }
      }

      if (!pointerState.dragging || pointerState.type !== 'mouse') {
        return;
      }
      viewport.scrollLeft = pointerState.startScroll - distanceX;
      event.preventDefault();
    });

    function finishPointer(event) {
      if (!pointerState || event.pointerId !== pointerState.id) {
        return;
      }
      var completedDrag = pointerState.dragging;
      var pointerType = pointerState.type;
      var pointerId = pointerState.id;
      pointerState = null;
      viewport.classList.remove('is-dragging');
      if (viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
      }

      if (event.type === 'pointercancel') {
        suppressClickFromDrag = false;
        return;
      }

      suppressClickFromDrag = completedDrag;
      if (completedDrag && pointerType === 'mouse') {
        goToPage(nearestPage());
      }
    }

    viewport.addEventListener('pointerup', finishPointer);
    viewport.addEventListener('pointercancel', finishPointer);
    viewport.addEventListener('click', function (event) {
      if (suppressClickFromDrag && event.detail > 0) {
        event.preventDefault();
      }
      suppressClickFromDrag = false;
    }, true);

    window.addEventListener('resize', function () {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(buildPagination);
    });

    buildPagination();
  });
}());
