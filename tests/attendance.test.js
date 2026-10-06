/*
 * Automated tests for js/attendance.js.
 * Run with:  node --test   (or: npm test)
 * Test case IDs (TC-xx) match docs/test-plan.md.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../js/attendance.js');

const { STATUS } = A;

/* ---------- Black-box: percentage (equivalence classes) ---------- */

test('TC-01 percentage is 0 when no classes were held', () => {
  assert.equal(A.calculatePercentage(0, 0), 0);
});

test('TC-02 percentage of 3 out of 4 is exactly 75', () => {
  assert.equal(A.calculatePercentage(3, 4), 75);
});

test('TC-03 percentage is rounded to 2 decimals', () => {
  assert.equal(A.calculatePercentage(1, 3), 33.33);
});

test('TC-04 percentage of full attendance is 100', () => {
  assert.equal(A.calculatePercentage(10, 10), 100);
});

test('TC-05 negative counts are rejected', () => {
  assert.throws(() => A.calculatePercentage(-1, 5), RangeError);
  assert.throws(() => A.calculatePercentage(0, -5), RangeError);
});

test('TC-06 attended greater than total is rejected', () => {
  assert.throws(() => A.calculatePercentage(6, 5), RangeError);
});

test('TC-07 non-integer counts are rejected', () => {
  assert.throws(() => A.calculatePercentage(2.5, 5), TypeError);
  assert.throws(() => A.calculatePercentage('3', 5), TypeError);
});

/* ---------- Black-box: eligibility status (boundary values, threshold 75) ---------- */

test('TC-08 no classes held gives NO_DATA', () => {
  assert.equal(A.getStatus(0, 0, 75), STATUS.NO_DATA);
});

test('TC-09 boundary 74% is AT_RISK', () => {
  assert.equal(A.getStatus(74, 100, 75), STATUS.AT_RISK);
});

test('TC-10 boundary 75% is ELIGIBLE', () => {
  assert.equal(A.getStatus(75, 100, 75), STATUS.ELIGIBLE);
});

test('TC-11 boundary 76% is ELIGIBLE', () => {
  assert.equal(A.getStatus(76, 100, 75), STATUS.ELIGIBLE);
});

test('TC-12 boundary 64% is DETAINED', () => {
  assert.equal(A.getStatus(64, 100, 75), STATUS.DETAINED);
});

test('TC-13 boundary 65% is AT_RISK', () => {
  assert.equal(A.getStatus(65, 100, 75), STATUS.AT_RISK);
});

test('TC-14 boundary 66% is AT_RISK', () => {
  assert.equal(A.getStatus(66, 100, 75), STATUS.AT_RISK);
});

test('TC-15 exact 75% with a small class count (3 of 4) is ELIGIBLE', () => {
  assert.equal(A.getStatus(3, 4, 75), STATUS.ELIGIBLE);
});

test('TC-16 default threshold is 75 when none is given', () => {
  assert.equal(A.getStatus(75, 100), STATUS.ELIGIBLE);
  assert.equal(A.getStatus(74, 100), STATUS.AT_RISK);
});

test('TC-17 a custom threshold changes the result', () => {
  assert.equal(A.getStatus(70, 100, 60), STATUS.ELIGIBLE);
  assert.equal(A.getStatus(70, 100, 80), STATUS.AT_RISK);
});

test('TC-18 invalid thresholds are rejected', () => {
  assert.throws(() => A.getStatus(1, 2, 0), RangeError);
  assert.throws(() => A.getStatus(1, 2, 100), RangeError);
  assert.throws(() => A.getStatus(1, 2, 75.5), RangeError);
});

/* ---------- Black-box: advice calculations ---------- */

test('TC-19 classesNeeded returns 0 when already eligible', () => {
  assert.equal(A.classesNeeded(3, 4, 75), 0);
  assert.equal(A.classesNeeded(0, 0, 75), 0);
});

test('TC-20 classesNeeded finds the fewest classes to reach 75%', () => {
  assert.equal(A.classesNeeded(7, 10, 75), 2); // 9/12 = 75%
  assert.equal(A.classesNeeded(0, 4, 75), 12); // 12/16 = 75%
});

test('TC-21 classesNeeded result really reaches the threshold and one less does not', () => {
  for (let total = 1; total <= 30; total++) {
    for (let attended = 0; attended <= total; attended++) {
      const n = A.classesNeeded(attended, total, 75);
      assert.ok((attended + n) * 100 >= 75 * (total + n), 'reaches 75%');
      if (n > 0) {
        assert.ok((attended + n - 1) * 100 < 75 * (total + n - 1), 'minimal');
      }
    }
  }
});

test('TC-22 classesCanSkip returns how many classes can be missed', () => {
  assert.equal(A.classesCanSkip(9, 10, 75), 2); // 9/12 = 75%
  assert.equal(A.classesCanSkip(3, 4, 75), 0);  // exactly at the limit
});

test('TC-23 classesCanSkip is 0 below the threshold or with no classes', () => {
  assert.equal(A.classesCanSkip(5, 10, 75), 0);
  assert.equal(A.classesCanSkip(0, 0, 75), 0);
});

test('TC-24 skipping the allowed number stays eligible, one more does not', () => {
  for (let total = 1; total <= 30; total++) {
    for (let attended = 0; attended <= total; attended++) {
      if (attended * 100 < 75 * total) continue;
      const x = A.classesCanSkip(attended, total, 75);
      assert.ok(attended * 100 >= 75 * (total + x), 'still eligible');
      assert.ok(attended * 100 < 75 * (total + x + 1), 'one more breaks it');
    }
  }
});

/* ---------- Subject class ---------- */

test('TC-25 markPresent increases attended and total', () => {
  const s = new A.Subject('Maths');
  s.markPresent();
  assert.deepEqual([s.attended, s.total], [1, 1]);
});

test('TC-26 markAbsent increases only total', () => {
  const s = new A.Subject('Maths');
  s.markAbsent();
  assert.deepEqual([s.attended, s.total], [0, 1]);
});

test('TC-27 subject name is trimmed and spaces collapsed', () => {
  assert.equal(new A.Subject('  Software    Engineering  ').name, 'Software Engineering');
});

test('TC-28 empty, blank and too long names are rejected', () => {
  assert.throws(() => new A.Subject(''), RangeError);
  assert.throws(() => new A.Subject('   '), RangeError);
  assert.throws(() => new A.Subject('x'.repeat(A.MAX_NAME_LENGTH + 1)), RangeError);
  assert.doesNotThrow(() => new A.Subject('x'.repeat(A.MAX_NAME_LENGTH)));
});

test('TC-29 non-text name is rejected', () => {
  assert.throws(() => new A.Subject(42), TypeError);
});

/* ---------- State transitions ---------- */

test('TC-30 ELIGIBLE -> AT_RISK after an absence', () => {
  const s = new A.Subject('DBMS', 15, 20); // 75%
  assert.equal(s.status(75), STATUS.ELIGIBLE);
  s.markAbsent(); // 15/21 = 71.4%
  assert.equal(s.status(75), STATUS.AT_RISK);
});

test('TC-31 AT_RISK -> ELIGIBLE after enough presents', () => {
  const s = new A.Subject('DBMS', 7, 10);
  assert.equal(s.status(75), STATUS.AT_RISK);
  s.markPresent();
  s.markPresent(); // 9/12 = 75%
  assert.equal(s.status(75), STATUS.ELIGIBLE);
});

test('TC-32 AT_RISK -> DETAINED after repeated absences', () => {
  const s = new A.Subject('OS', 7, 10);
  s.markAbsent(); // 7/11 = 63.6%
  assert.equal(s.status(75), STATUS.DETAINED);
});

test('TC-33 NO_DATA -> ELIGIBLE on the first present', () => {
  const s = new A.Subject('CN');
  assert.equal(s.status(75), STATUS.NO_DATA);
  s.markPresent();
  assert.equal(s.status(75), STATUS.ELIGIBLE);
});

/* ---------- Store (Singleton, Observer, persistence) ---------- */

function freshStore() {
  return new A.AttendanceStore(new A.MemoryAdapter());
}

test('TC-34 addSubject stores a subject', () => {
  const store = freshStore();
  store.addSubject('Maths', 3, 4);
  assert.equal(store.subjects.length, 1);
  assert.equal(store.subjects[0].percentage(), 75);
});

test('TC-35 duplicate subject names are rejected, ignoring case', () => {
  const store = freshStore();
  store.addSubject('Maths');
  assert.throws(() => store.addSubject('  maths '), /already exists/);
  assert.equal(store.subjects.length, 1);
});

test('TC-36 invalid input does not add anything', () => {
  const store = freshStore();
  assert.throws(() => store.addSubject('Maths', 5, 2));
  assert.equal(store.subjects.length, 0);
});

test('TC-37 mark updates the right subject only', () => {
  const store = freshStore();
  const a = store.addSubject('A');
  const b = store.addSubject('B');
  store.mark(a.id, true);
  store.mark(b.id, false);
  assert.deepEqual([a.attended, a.total, b.attended, b.total], [1, 1, 0, 1]);
});

test('TC-38 mark and remove with an unknown id fail', () => {
  const store = freshStore();
  assert.throws(() => store.mark('nope', true), /not found/);
  assert.throws(() => store.removeSubject('nope'), /not found/);
});

test('TC-39 removeSubject deletes the subject', () => {
  const store = freshStore();
  const s = store.addSubject('A');
  store.removeSubject(s.id);
  assert.equal(store.subjects.length, 0);
});

test('TC-40 setThreshold validates and applies the value', () => {
  const store = freshStore();
  store.setThreshold(80);
  assert.equal(store.threshold, 80);
  assert.throws(() => store.setThreshold(100), RangeError);
  assert.equal(store.threshold, 80);
});

test('TC-41 overall combines all subjects', () => {
  const store = freshStore();
  store.addSubject('A', 3, 4);
  store.addSubject('B', 1, 4);
  const o = store.overall();
  assert.deepEqual([o.attended, o.total, o.percentage], [4, 8, 50]);
  assert.equal(o.status, STATUS.DETAINED);
});

test('TC-42 overall with no subjects is NO_DATA', () => {
  assert.equal(freshStore().overall().status, STATUS.NO_DATA);
});

test('TC-43 observers are notified on change and can unsubscribe', () => {
  const store = freshStore();
  let calls = 0;
  const unsubscribe = store.subscribe(() => { calls += 1; });
  const s = store.addSubject('A');
  store.mark(s.id, true);
  assert.equal(calls, 2);
  unsubscribe();
  store.mark(s.id, true);
  assert.equal(calls, 2);
});

test('TC-44 data persists through the storage adapter', () => {
  const adapter = new A.MemoryAdapter();
  const first = new A.AttendanceStore(adapter);
  first.addSubject('Maths', 3, 4);
  first.setThreshold(80);
  const second = new A.AttendanceStore(adapter);
  assert.equal(second.subjects.length, 1);
  assert.equal(second.subjects[0].name, 'Maths');
  assert.equal(second.threshold, 80);
});

test('TC-45 corrupt saved data is ignored safely', () => {
  const adapter = new A.MemoryAdapter();
  adapter.save('{not valid json');
  const store = new A.AttendanceStore(adapter);
  assert.equal(store.subjects.length, 0);
  assert.equal(store.threshold, A.DEFAULT_THRESHOLD);
});

test('TC-46 invalid saved records are skipped', () => {
  const adapter = new A.MemoryAdapter();
  adapter.save(JSON.stringify({
    threshold: 75,
    subjects: [
      { id: 'x1', name: 'Good', attended: 1, total: 2 },
      { id: 'x2', name: 'Bad', attended: 9, total: 2 }
    ]
  }));
  const store = new A.AttendanceStore(adapter);
  assert.equal(store.subjects.length, 1);
  assert.equal(store.subjects[0].name, 'Good');
});

test('TC-47 getInstance always returns the same store (Singleton)', () => {
  A.AttendanceStore._resetInstance();
  assert.equal(A.AttendanceStore.getInstance(), A.AttendanceStore.getInstance());
  A.AttendanceStore._resetInstance();
});

test('TC-48 clearAll removes every subject', () => {
  const store = freshStore();
  store.addSubject('A');
  store.addSubject('B');
  store.clearAll();
  assert.equal(store.subjects.length, 0);
});

/* ---------- Non-functional: volume and efficiency ---------- */

test('TC-49 handles 100 subjects with 200 marks each within 5 seconds', () => {
  const store = freshStore();
  const start = Date.now();
  const ids = [];
  for (let i = 0; i < 100; i++) ids.push(store.addSubject('Subject ' + i).id);
  for (let round = 0; round < 200; round++) {
    for (const id of ids) store.mark(id, round % 4 !== 0); // 75% present
  }
  const o = store.overall();
  assert.equal(o.total, 100 * 200);
  assert.equal(o.attended, 100 * 150);
  assert.equal(o.status, STATUS.ELIGIBLE);
  assert.ok(Date.now() - start < 5000, 'finished in time');
});
