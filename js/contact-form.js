(function () {
  if (!window.fetch || !window.FormData) {
    return;
  }

  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var submitButton = form.querySelector('[data-contact-submit]');
    var status = form.querySelector('[data-contact-status]');
    var defaultButtonText = submitButton ? submitButton.textContent : '';
    var submitting = false;

    if (!submitButton || !status) {
      return;
    }

    function message(name) {
      return form.getAttribute('data-' + name + '-message') || '';
    }

    function showStatus(type, text, shouldFocus) {
      status.hidden = false;
      status.className = 'contact-form__status is-' + type;
      status.textContent = text;
      if (shouldFocus) {
        try {
          status.focus({ preventScroll: true });
        } catch (error) {
          status.focus();
        }
      }
    }

    form.addEventListener('invalid', function () {
      form.classList.add('was-validated');
    }, true);

    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      event.preventDefault();
      if (submitting) {
        return;
      }

      submitting = true;
      submitButton.disabled = true;
      submitButton.textContent = message('loading');
      form.setAttribute('aria-busy', 'true');
      showStatus('loading', message('loading'), false);

      fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: 'application/json'
        }
      }).then(function (response) {
        return response.json().catch(function () {
          return null;
        }).then(function () {
          return response;
        });
      }).then(function (response) {
        if (response.ok) {
          form.reset();
          form.classList.remove('was-validated');
          showStatus('success', message('success'), true);
          return;
        }

        if (response.status === 429) {
          showStatus('error', message('rate-limit'), true);
          return;
        }

        showStatus('error', message('error'), true);
      }).catch(function () {
        showStatus('error', message('error'), true);
      }).finally(function () {
        submitting = false;
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
        form.removeAttribute('aria-busy');
      });
    });
  });
}());
