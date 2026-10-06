/* app.js - user interface for the Attendance Tracker. All rules live in attendance.js. */
(function () {
  'use strict';

  var A = window.Attendance;
  var store = A.AttendanceStore.getInstance();

  var STATUS_LABEL = {
    NO_DATA: 'No data',
    ELIGIBLE: 'Eligible',
    AT_RISK: 'At risk',
    DETAINED: 'Not eligible'
  };

  var $ = function (id) { return document.getElementById(id); };
  var cards = $('cards');
  var messageBox = $('message');
  var messageTimer = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showMessage(text, kind) {
    messageBox.textContent = text;
    messageBox.className = 'message ' + kind;
    messageBox.hidden = false;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(function () { messageBox.hidden = true; }, 5000);
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 'es'); }

  function adviceFor(subject, threshold) {
    var s = subject.status(threshold);
    if (s === 'NO_DATA') return 'Mark your first class to see your status.';
    if (s === 'ELIGIBLE') {
      var skip = A.classesCanSkip(subject.attended, subject.total, threshold);
      return skip > 0
        ? 'You can miss up to ' + plural(skip, 'class') + ' and stay eligible.'
        : 'You are right at the limit. Do not miss the next class.';
    }
    var need = A.classesNeeded(subject.attended, subject.total, threshold);
    return 'Attend the next ' + plural(need, 'class') + ' in a row to reach ' + threshold + '%.';
  }

  function buildCard(subject, threshold) {
    var status = subject.status(threshold);
    var pct = subject.percentage();

    var card = el('article', 'card');

    var head = el('div', 'card-head');
    var title = el('h3', null, subject.name);
    var badge = el('span', 'badge ' + status, STATUS_LABEL[status]);
    head.appendChild(title);
    head.appendChild(badge);
    card.appendChild(head);

    card.appendChild(el('p', 'pct', pct + '%'));
    card.appendChild(el('p', 'muted', subject.attended + ' of ' + subject.total + ' classes attended'));

    var bar = el('div', 'bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', subject.name + ' attendance ' + pct + ' percent, minimum ' + threshold + ' percent');
    var fill = el('div', 'bar-fill ' + status);
    fill.style.width = Math.min(100, pct) + '%';
    var mark = el('div', 'bar-mark');
    mark.style.left = threshold + '%';
    bar.appendChild(fill);
    bar.appendChild(mark);
    card.appendChild(bar);

    card.appendChild(el('p', 'advice', adviceFor(subject, threshold)));

    var actions = el('div', 'actions');
    var present = el('button', 'btn present', 'Present');
    present.type = 'button';
    present.setAttribute('aria-label', 'Mark present for ' + subject.name);
    present.addEventListener('click', function () { store.mark(subject.id, true); });
    var absent = el('button', 'btn absent', 'Absent');
    absent.type = 'button';
    absent.setAttribute('aria-label', 'Mark absent for ' + subject.name);
    absent.addEventListener('click', function () { store.mark(subject.id, false); });
    var spacer = el('span', 'spacer');
    var remove = el('button', 'btn link', 'Remove');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove ' + subject.name);
    remove.addEventListener('click', function () {
      if (window.confirm('Remove "' + subject.name + '" and its attendance?')) {
        store.removeSubject(subject.id);
      }
    });
    actions.appendChild(present);
    actions.appendChild(absent);
    actions.appendChild(spacer);
    actions.appendChild(remove);
    card.appendChild(actions);

    return card;
  }

  function render() {
    var threshold = store.threshold;
    var overall = store.overall();

    $('overall-pct').textContent = overall.percentage + '%';
    $('overall-detail').textContent = overall.total === 0
      ? 'No classes recorded yet.'
      : overall.attended + ' of ' + overall.total + ' classes attended across ' +
        store.subjects.length + ' subject' + (store.subjects.length === 1 ? '' : 's') + '.';
    var badge = $('overall-badge');
    badge.className = 'badge ' + overall.status;
    badge.textContent = STATUS_LABEL[overall.status];

    var input = $('threshold-input');
    if (document.activeElement !== input) input.value = threshold;

    cards.textContent = '';
    for (var i = 0; i < store.subjects.length; i++) {
      cards.appendChild(buildCard(store.subjects[i], threshold));
    }
    $('empty-state').hidden = store.subjects.length > 0;
    $('clear-btn').hidden = store.subjects.length === 0;
  }

  function readWholeNumber(inputId, label) {
    var raw = $(inputId).value.trim();
    if (raw === '') return 0;
    if (!/^\d+$/.test(raw)) throw new TypeError(label + ' must be a whole number.');
    return parseInt(raw, 10);
  }

  $('add-form').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var attended = readWholeNumber('attended-input', 'Attended classes');
      var total = readWholeNumber('total-input', 'Classes held');
      var subject = store.addSubject($('name-input').value, attended, total);
      $('add-form').reset();
      $('name-input').focus();
      showMessage('Added "' + subject.name + '".', 'info');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });

  $('threshold-form').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var raw = $('threshold-input').value.trim();
      if (!/^\d+$/.test(raw)) throw new TypeError('Threshold must be a whole number from 1 to 99.');
      store.setThreshold(parseInt(raw, 10));
      showMessage('Minimum attendance set to ' + store.threshold + '%.', 'info');
    } catch (err) {
      showMessage(err.message, 'error');
      $('threshold-input').value = store.threshold;
    }
  });

  $('clear-btn').addEventListener('click', function () {
    if (window.confirm('Delete all subjects and attendance records? This cannot be undone.')) {
      store.clearAll();
    }
  });

  store.subscribe(render); // Observer: re-render on every change
  render();
})();
