/* MA1508 Chapter 3 — print handling for collapsible worked solutions.
 *
 * Example solutions are wrapped in <details class="example-solution"> so students
 * see only the problem until they click "Show answer". Browsers hide the content
 * of a closed <details> with an internal mechanism that CSS cannot override, so
 * on a real print/PDF render we open every solution first and restore the
 * on-screen state afterwards. Browsers without beforeprint simply print the
 * page as it appears on screen.
 */
(function () {
  'use strict';

  function solutions() {
    return document.querySelectorAll('details.example-solution');
  }

  var reopened = [];

  window.addEventListener('beforeprint', function () {
    reopened = [];
    solutions().forEach(function (details) {
      if (!details.open) {
        details.open = true;
        reopened.push(details);
      }
    });
  });

  window.addEventListener('afterprint', function () {
    reopened.forEach(function (details) {
      details.open = false;
    });
    reopened = [];
  });
})();
