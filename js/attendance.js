/*
 * attendance.js - core logic for the Attendance Tracker.
 *
 * Kept free of any DOM code so it can be unit tested with Node and reused by
 * the UI (js/app.js). Works in the browser (window.Attendance) and in Node
 * (module.exports).
 *
 * Design patterns used (Unit V of the syllabus):
 *   - Singleton : AttendanceStore.getInstance() gives one shared store.
 *   - Observer  : the UI subscribes to the store and re-renders on change.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Attendance = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_THRESHOLD = 75; // minimum attendance % required for exams
  var WARNING_MARGIN = 10;    // "at risk" band: threshold-10 up to threshold
  var MAX_NAME_LENGTH = 40;
  var STORAGE_KEY = 'attendance-tracker-v1';

  var STATUS = Object.freeze({
    NO_DATA: 'NO_DATA',
    ELIGIBLE: 'ELIGIBLE',
    AT_RISK: 'AT_RISK',
    DETAINED: 'DETAINED'
  });

  /* ---------------------------------------------------------------- *
   *  Pure functions (the rules of the system)
   * ---------------------------------------------------------------- */

  function validateCounts(attended, total) {
    if (!Number.isInteger(attended) || !Number.isInteger(total)) {
      throw new TypeError('Attended and total classes must be whole numbers.');
    }
    if (attended < 0 || total < 0) {
      throw new RangeError('Attended and total classes cannot be negative.');
    }
    if (attended > total) {
      throw new RangeError('Attended classes cannot exceed total classes.');
    }
  }

  function validateThreshold(threshold) {
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 99) {
      throw new RangeError('Threshold must be a whole number from 1 to 99.');
    }
  }

  /** Attendance percentage rounded to 2 decimals. 0 classes held -> 0. */
  function calculatePercentage(attended, total) {
    validateCounts(attended, total);
    if (total === 0) return 0;
    return Math.round((attended / total) * 10000) / 100;
  }

  /**
   * Decision table for exam eligibility:
   *   total = 0                         -> NO_DATA
   *   pct >= threshold                  -> ELIGIBLE
   *   threshold-10 <= pct < threshold   -> AT_RISK
   *   pct < threshold-10                -> DETAINED
   * Integer arithmetic is used so there are no floating point surprises at
   * the boundaries (e.g. exactly 75%).
   */
  function getStatus(attended, total, threshold) {
    if (threshold === undefined) threshold = DEFAULT_THRESHOLD;
    validateCounts(attended, total);
    validateThreshold(threshold);
    if (total === 0) return STATUS.NO_DATA;
    if (attended * 100 >= threshold * total) return STATUS.ELIGIBLE;
    if (attended * 100 >= (threshold - WARNING_MARGIN) * total) return STATUS.AT_RISK;
    return STATUS.DETAINED;
  }

  /** Fewest consecutive classes to attend to reach the threshold. */
  function classesNeeded(attended, total, threshold) {
    if (threshold === undefined) threshold = DEFAULT_THRESHOLD;
    validateCounts(attended, total);
    validateThreshold(threshold);
    if (attended * 100 >= threshold * total) return 0;
    return Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
  }

  /** Most classes that can be missed while staying at or above threshold. */
  function classesCanSkip(attended, total, threshold) {
    if (threshold === undefined) threshold = DEFAULT_THRESHOLD;
    validateCounts(attended, total);
    validateThreshold(threshold);
    if (total === 0 || attended * 100 < threshold * total) return 0;
    return Math.floor((100 * attended - threshold * total) / threshold);
  }

  /* ---------------------------------------------------------------- *
   *  Domain class
   * ---------------------------------------------------------------- */

  var idCounter = 0;
  function newId() {
    idCounter += 1;
    return 's' + Date.now().toString(36) + idCounter.toString(36);
  }

  function cleanName(name) {
    if (typeof name !== 'string') throw new TypeError('Subject name must be text.');
    var trimmed = name.trim().replace(/\s+/g, ' ');
    if (trimmed.length === 0) throw new RangeError('Subject name cannot be empty.');
    if (trimmed.length > MAX_NAME_LENGTH) {
      throw new RangeError('Subject name must be at most ' + MAX_NAME_LENGTH + ' characters.');
    }
    return trimmed;
  }

  function Subject(name, attended, total, id) {
    attended = attended === undefined ? 0 : attended;
    total = total === undefined ? 0 : total;
    validateCounts(attended, total);
    this.id = id || newId();
    this.name = cleanName(name);
    this.attended = attended;
    this.total = total;
  }

  Subject.prototype.markPresent = function () {
    this.attended += 1;
    this.total += 1;
  };

  Subject.prototype.markAbsent = function () {
    this.total += 1;
  };

  Subject.prototype.percentage = function () {
    return calculatePercentage(this.attended, this.total);
  };

  Subject.prototype.status = function (threshold) {
    return getStatus(this.attended, this.total, threshold);
  };

  Subject.prototype.toJSON = function () {
    return { id: this.id, name: this.name, attended: this.attended, total: this.total };
  };

  /* ---------------------------------------------------------------- *
   *  Storage adapters
   * ---------------------------------------------------------------- */

  function MemoryAdapter() {
    this.data = null;
  }
  MemoryAdapter.prototype.load = function () { return this.data; };
  MemoryAdapter.prototype.save = function (text) { this.data = text; };

  function LocalStorageAdapter() {}
  LocalStorageAdapter.prototype.load = function () {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  };
  LocalStorageAdapter.prototype.save = function (text) {
    try { window.localStorage.setItem(STORAGE_KEY, text); } catch (e) { /* storage blocked */ }
  };

  function defaultAdapter() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return new LocalStorageAdapter();
    }
    return new MemoryAdapter();
  }

  /* ---------------------------------------------------------------- *
   *  Store: Singleton + Observer
   * ---------------------------------------------------------------- */

  var instance = null;

  function AttendanceStore(adapter) {
    this.adapter = adapter || defaultAdapter();
    this.subjects = [];
    this.threshold = DEFAULT_THRESHOLD;
    this.listeners = [];
    this._load();
  }

  /** Singleton accessor: every caller gets the same store. */
  AttendanceStore.getInstance = function () {
    if (!instance) instance = new AttendanceStore();
    return instance;
  };

  /** For tests only: forget the shared instance. */
  AttendanceStore._resetInstance = function () { instance = null; };

  /** Observer: register a function to be called after every change. */
  AttendanceStore.prototype.subscribe = function (listener) {
    this.listeners.push(listener);
    var self = this;
    return function unsubscribe() {
      self.listeners = self.listeners.filter(function (l) { return l !== listener; });
    };
  };

  AttendanceStore.prototype._notify = function () {
    this._save();
    for (var i = 0; i < this.listeners.length; i++) this.listeners[i](this);
  };

  AttendanceStore.prototype._save = function () {
    this.adapter.save(JSON.stringify({
      threshold: this.threshold,
      subjects: this.subjects.map(function (s) { return s.toJSON(); })
    }));
  };

  AttendanceStore.prototype._load = function () {
    var text = this.adapter.load();
    if (!text) return;
    try {
      var data = JSON.parse(text);
      if (Number.isInteger(data.threshold) && data.threshold >= 1 && data.threshold <= 99) {
        this.threshold = data.threshold;
      }
      var list = Array.isArray(data.subjects) ? data.subjects : [];
      for (var i = 0; i < list.length; i++) {
        try {
          this.subjects.push(new Subject(list[i].name, list[i].attended, list[i].total, list[i].id));
        } catch (e) { /* skip a corrupt record */ }
      }
    } catch (e) { /* corrupt saved data: start fresh */ }
  };

  AttendanceStore.prototype.findSubject = function (id) {
    for (var i = 0; i < this.subjects.length; i++) {
      if (this.subjects[i].id === id) return this.subjects[i];
    }
    return null;
  };

  AttendanceStore.prototype.addSubject = function (name, attended, total) {
    var subject = new Subject(name, attended, total); // validates input
    var lower = subject.name.toLowerCase();
    for (var i = 0; i < this.subjects.length; i++) {
      if (this.subjects[i].name.toLowerCase() === lower) {
        throw new Error('A subject named "' + subject.name + '" already exists.');
      }
    }
    this.subjects.push(subject);
    this._notify();
    return subject;
  };

  AttendanceStore.prototype.removeSubject = function (id) {
    var before = this.subjects.length;
    this.subjects = this.subjects.filter(function (s) { return s.id !== id; });
    if (this.subjects.length === before) throw new Error('Subject not found.');
    this._notify();
  };

  AttendanceStore.prototype.mark = function (id, present) {
    var subject = this.findSubject(id);
    if (!subject) throw new Error('Subject not found.');
    if (present) subject.markPresent(); else subject.markAbsent();
    this._notify();
  };

  AttendanceStore.prototype.setThreshold = function (threshold) {
    validateThreshold(threshold);
    this.threshold = threshold;
    this._notify();
  };

  AttendanceStore.prototype.clearAll = function () {
    this.subjects = [];
    this._notify();
  };

  /** Combined attendance across all subjects. */
  AttendanceStore.prototype.overall = function () {
    var attended = 0, total = 0;
    for (var i = 0; i < this.subjects.length; i++) {
      attended += this.subjects[i].attended;
      total += this.subjects[i].total;
    }
    return {
      attended: attended,
      total: total,
      percentage: calculatePercentage(attended, total),
      status: getStatus(attended, total, this.threshold)
    };
  };

  return {
    DEFAULT_THRESHOLD: DEFAULT_THRESHOLD,
    WARNING_MARGIN: WARNING_MARGIN,
    MAX_NAME_LENGTH: MAX_NAME_LENGTH,
    STATUS: STATUS,
    calculatePercentage: calculatePercentage,
    getStatus: getStatus,
    classesNeeded: classesNeeded,
    classesCanSkip: classesCanSkip,
    Subject: Subject,
    AttendanceStore: AttendanceStore,
    MemoryAdapter: MemoryAdapter
  };
});
