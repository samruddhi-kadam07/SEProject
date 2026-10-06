# Test Plan and Report

**Project:** Attendance Tracker

## 1. Scope and approach

| Level | What | How |
|---|---|---|
| Unit | Rule functions, `Subject`, `AttendanceStore` | 49 automated tests (`tests/attendance.test.js`), run with `npm test` or `node --test` |
| Integration | Store with storage adapter, observer notification | Automated (TC-34 to TC-48) |
| System / UI | The page in a browser | Manual test cases UI-01 to UI-09 below |
| Non-functional | Volume and efficiency | TC-49 (automated), UI-07 (screen sizes) |

Verification is done by tests and inspection (static review). Validation is done by the UI test cases and by showing the site to a few classmates.

**Run the automated tests**

```
npm test
```

(Needs Node.js 20 or newer. There is nothing to install.)

## 2. Black-box testing

### 2.1 Equivalence classes: counts

| Input | Valid classes | Invalid classes |
|---|---|---|
| attended | whole number, 0 up to total | negative; larger than total; not a whole number |
| total | whole number, 0 or more | negative; not a whole number |
| subject name | 1 to 40 characters after trimming | empty or blank; longer than 40; not text; duplicate (ignoring case) |
| threshold | whole number 1 to 99 | 0 or less; 100 or more; not a whole number |

### 2.2 Boundary value tests: eligibility (threshold 75, classes held 100)

| Attended | Percentage | Expected status | Test |
|---|---|---|---|
| 64 | 64% | Not eligible | TC-12 |
| 65 | 65% | At risk | TC-13 |
| 66 | 66% | At risk | TC-14 |
| 74 | 74% | At risk | TC-09 |
| 75 | 75% | Eligible | TC-10 |
| 76 | 76% | Eligible | TC-11 |
| 0 of 0 | no data | No data | TC-08 |
| 3 of 4 | exactly 75% | Eligible | TC-15 |

Other boundaries: name length 40 (valid) and 41 (invalid) in TC-28; threshold 0, 1, 99, 100 handled in TC-18 and TC-40.

### 2.3 Decision table testing
The decision table in `SRS.md` Section 4.2 has four rules. R1 is TC-08, R2 is TC-10, R3 is TC-09, R4 is TC-12.

### 2.4 State table testing
Transitions from `SRS.md` Section 4.4:

| Transition | Test |
|---|---|
| No data to Eligible (present) | TC-33 |
| Eligible to At risk (absent) | TC-30 |
| At risk to Eligible (presents) | TC-31 |
| At risk to Not eligible (absent) | TC-32 |

### 2.5 Use case and transaction-based testing
Each use case is run as a complete user transaction in the UI tests: UC-1 (UI-01, UI-02), UC-2 (UI-03), UC-3 (UI-03), UC-4 (UI-05), UC-5 (UI-06). The "mark attendance" transaction (click, update counts, recalculate, save, redraw) is also covered in code by TC-37, TC-43 and TC-44.

## 3. Automated test case list

| ID | Test | Expected result |
|---|---|---|
| TC-01 | Percentage with 0 classes | 0 |
| TC-02 | 3 of 4 | 75 |
| TC-03 | 1 of 3 | 33.33 |
| TC-04 | 10 of 10 | 100 |
| TC-05 | Negative counts | RangeError |
| TC-06 | Attended greater than total | RangeError |
| TC-07 | Non-integer counts | TypeError |
| TC-08 | 0 of 0 status | No data |
| TC-09 to TC-14 | Boundary values 74, 75, 76, 64, 65, 66 of 100 | See 2.2 |
| TC-15 | 3 of 4 | Eligible |
| TC-16 | Default threshold used | 75 |
| TC-17 | Custom threshold changes result | 70% eligible at 60, at risk at 80 |
| TC-18 | Invalid thresholds | RangeError |
| TC-19 | Classes needed when already eligible | 0 |
| TC-20 | 7 of 10, and 0 of 4 | 2 and 12 |
| TC-21 | Classes needed is correct and minimal for every case up to 30 classes | Pass |
| TC-22 | Classes that can be skipped, 9 of 10 | 2 |
| TC-23 | Below threshold or no classes | 0 |
| TC-24 | Skip count is correct and maximal for every case up to 30 classes | Pass |
| TC-25, TC-26 | markPresent, markAbsent | Counts change correctly |
| TC-27 to TC-29 | Name trimming, empty, too long, not text | Accepted or rejected as specified |
| TC-30 to TC-33 | State transitions | See 2.4 |
| TC-34 to TC-36 | Add subject, duplicate, invalid input | Added or rejected, nothing half-added |
| TC-37 to TC-39 | Mark, unknown id, remove | Correct subject changed only |
| TC-40 | Set threshold | Valid applied, invalid rejected |
| TC-41, TC-42 | Overall summary | Combined counts, No data when empty |
| TC-43 | Observer notified, unsubscribe works | Pass |
| TC-44 | Save and reload through adapter | Same data |
| TC-45, TC-46 | Corrupt saved data, invalid saved records | Ignored safely |
| TC-47 | Singleton | Same instance every time |
| TC-48 | Clear all | No subjects |
| TC-49 | Volume: 100 subjects, 200 marks each | Correct totals, under 5 s |

## 4. White-box testing

Coverage measured with Node's built-in coverage (`npm test`) on the final code:

| File | Line | Branch | Function |
|---|---|---|---|
| `js/attendance.js` | 98.06% | 93.33% | 92.68% |
| all files (including test file) | 99.08% | 96.22% | 97.27% |

**Not covered (by design):** the browser-only parts, i.e. the `window.Attendance` export (lines 16 to 17) and `LocalStorageAdapter` (the `window.localStorage` calls), which cannot run in Node. They are exercised by the UI tests UI-04.

**Coverage types used**
- *Statement / code coverage:* every rule function and class method is executed by at least one test.
- *Branch coverage:* each `if` outcome in `getStatus` (no data, eligible, at risk, not eligible) has a test (TC-08, TC-10, TC-09, TC-12).
- *Condition coverage:* in `classesCanSkip` the two parts of `total === 0 || attended * 100 < threshold * total` are each made true on their own (TC-23).
- *Loop testing:* TC-21 and TC-24 run the formulas for every combination up to 30 classes.

## 5. Manual UI test cases

Run these in a browser and record the result. **Team: fill the "Result" and "Tester" columns.**

| ID | Steps | Expected | Result | Tester |
|---|---|---|---|---|
| UI-01 | Enter "Maths", attended 3, held 4, click Add | Card shows 75%, badge Eligible, "Added" message | | |
| UI-02 | Try: empty name; 41-character name; "Maths" again; attended 5 and held 2; attended -1 | Each shows a clear error, nothing added | | |
| UI-03 | Add a subject, click Present twice and Absent once | Counts and percentage update after each click; advice text changes | | |
| UI-04 | Add data, reload the page, then close and reopen the tab | Same subjects and threshold are shown | | |
| UI-05 | Set minimum to 80, then to 0, 100, abc | 80 is applied and all badges recalculated; others show an error and keep 80 | | |
| UI-06 | Click Remove then Cancel, then Remove then OK; same for Clear all | Cancel changes nothing; OK deletes | | |
| UI-07 | Resize to 320 px wide (browser developer tools) | No sideways scrolling, buttons still usable | | |
| UI-08 | Use only the keyboard (Tab, Enter, Space) to add and mark | Everything reachable, focus outline visible | | |
| UI-09 | Add a subject named `<b>Test</b>` | Shown as plain text, not bold | | |

## 6. Inspection (code review) checklist

Reviewer ticks each item on every pull request:

- [ ] Change matches a requirement ID in the SRS
- [ ] No business rule added to `app.js`
- [ ] Inputs validated; errors have clear messages
- [ ] No user text inserted as HTML
- [ ] New logic has a test; `npm test` passes
- [ ] Names are clear; no leftover debug code
- [ ] Docs updated if behaviour changed

## 7. Defect log

| ID | Description | Found in | Severity | Status |
|---|---|---|---|---|
| | | | | |

(Use GitHub Issues with the `bug` label and copy the summary here before submission.)
