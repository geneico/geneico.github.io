(function () {
  var headers = document.querySelectorAll('.geneico-header');

  Array.prototype.forEach.call(headers, function (header) {
    var button = header.querySelector('.geneico-menu-button');
    var navigation = header.querySelector('.geneico-navigation');

    if (!button || !navigation) {
      return;
    }

    function closeMenu() {
      button.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }

    button.addEventListener('click', function () {
      var willOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(willOpen));
      navigation.classList.toggle('is-open', willOpen);
    });

    navigation.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu();
        button.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 800) {
        closeMenu();
      }
    });
  });
}());
