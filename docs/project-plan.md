# Software Project Management Plan

**Project:** Attendance Tracker
**Team size:** 3

---

## 1. Life cycle model

**Chosen model: Incremental / Agile (three short iterations).**

| Model considered | Why / why not |
|---|---|
| Waterfall | Requirements are clear, but we want working software early to show the teacher and fix mistakes cheaply. |
| Prototype | Useful for the UI only. We use one prototype review inside iteration 1. |
| Spiral | Too heavy for a project this small. |
| **Incremental / Agile** | Each iteration ends with a working, tested, deployed version. Fits a 3-person student team. |

| Iteration | Goal | Milestone (deliverable) |
|---|---|---|
| 0. Setup | Repo, collaborators, plan, SRS draft | M0: SRS v0.1 and empty site deployed |
| 1. Core | Add subject, mark present/absent, percentage | M1: first working version on GitHub Pages |
| 2. Rules | Eligibility status, advice, threshold, persistence | M2: all functional requirements working |
| 3. Quality | Tests, validation, accessibility, docs, final report | M3: v1.0 tagged, all documents baselined |

## 2. Activities, resources and schedule

Suggested allocation. **Team: replace the names and dates with your real ones.**

| # | Activity | Owner (suggested) | Effort (person-days) | Depends on |
|---|---|---|---|---|
| 1 | Feasibility study and topic approval | All | 0.5 | - |
| 2 | Requirement elicitation and SRS | Member 1 | 2 | 1 |
| 3 | Project plan, estimation, risk table | Member 2 | 1.5 | 1 |
| 4 | UML design (use case, class, state, CRC) | Member 3 | 2 | 2 |
| 5 | Coding: logic (`attendance.js`) | Member 1 | 2 | 4 |
| 6 | Coding: UI (`index.html`, `style.css`, `app.js`) | Member 2 | 2 | 4 |
| 7 | Unit and UI testing, test report | Member 3 | 2 | 5, 6 |
| 8 | Deployment on GitHub Pages | Member 1 | 0.5 | 5, 6 |
| 9 | Final report and presentation | All | 1.5 | 7, 8 |
| | **Total** | | **14** | |

Resources: 3 students, laptops, GitHub (free plan), Node.js (to run tests), any modern browser. No paid tools.

## 3. Feasibility study

| Type | Assessment |
|---|---|
| Technical | Feasible. Only HTML, CSS and JavaScript are needed, which the team knows. No server or database. |
| Economic | Feasible. Zero licence and hosting cost (GitHub Pages is free for public repos). |
| Operational | Feasible. Students already track attendance by hand, so the tool fits their routine. |
| Schedule | Feasible. About 14 person-days of work over 4 weeks. |
| Legal | Original code under the MIT licence. No personal data leaves the user's browser. |

## 4. Size, effort and schedule estimation

### 4.1 Size measurement

**Lines of code (measured on the finished code).** Counting non-blank, non-comment lines of JavaScript: `attendance.js` = 231, `app.js` = 147, total **378 SLOC = 0.378 KLOC**. HTML (78 lines), CSS (156 lines) and tests (326 lines) are not counted in the COCOMO size.

**Function points (unadjusted, all components "simple").**

| Component type | Count | Weight | Points |
|---|---|---|---|
| External inputs (add, present, absent, threshold, remove, clear) | 6 | 3 | 18 |
| External outputs (subject card, overall summary, advice, messages) | 4 | 4 | 16 |
| External inquiries (view list of subjects) | 1 | 3 | 3 |
| Internal logical files (saved store) | 1 | 7 | 7 |
| External interface files | 0 | 5 | 0 |
| **Unadjusted function points** | | | **44** |

### 4.2 Effort and time: Basic COCOMO, organic mode

For a small project built by a small team that knows the domain, organic mode applies: `E = 2.4 x (KLOC)^1.05` person-months, `D = 2.5 x E^0.38` months.

| Quantity | Calculation | Result |
|---|---|---|
| Effort | 2.4 x 0.378^1.05 | about 0.86 person-months |
| Duration | 2.5 x 0.86^0.38 | about 2.4 months |
| Average staff | E / D | about 0.4 persons |

**Reading the result.** COCOMO covers coding-centred effort for a professional team and assumes a much larger code size than ours, so at this tiny size it under-estimates a student project that also includes learning, documents, testing and presentation. Our bottom-up estimate in Section 2 (14 person-days, roughly 0.7 person-months of 20 working days) is close to the COCOMO figure for effort, and we plan for 4 calendar weeks because of classes and exams. **After the project, record the real effort here and compare:** actual effort = _____ person-days.

### 4.3 Cost estimation and software engineering economics

Student project cost is zero in money, but a notional cost shows how the estimate would be used. **Assumption (change if you wish):** entry-level developer cost of INR 30,000 per person-month.

| Item | Amount |
|---|---|
| Effort (bottom-up, 14 person-days = 0.7 person-month) | 0.7 PM |
| Labour cost | 0.7 x 30,000 = INR 21,000 |
| Tools and hosting | INR 0 |
| **Notional total** | **INR 21,000** |

Benefit: it saves each student the time spent on manual percentage calculation and avoids being surprised by an exam-eligibility shortage. The product has no running cost.

## 5. Risk management

| ID | Risk | Probability | Impact | Mitigation | Contingency |
|---|---|---|---|---|---|
| R1 | A team member is unavailable (exams, illness) | Medium | High | Pair tasks, keep all work in Git so anyone can continue | Reassign the task, cut Low-priority requirements (FR-11) |
| R2 | Requirements change late | Medium | Medium | Baseline the SRS at M2, track changes through issues | Move change to a later iteration |
| R3 | Bugs in the percentage or eligibility rules | Low | High | Boundary-value unit tests, run on every push | Fix first, release again |
| R4 | Merge conflicts between members | Medium | Low | Short-lived branches, small pull requests | Resolve together in a call |
| R5 | GitHub Pages deployment fails | Low | High | Deploy an empty site in iteration 0 to prove the pipeline | Use another static host as backup |
| R6 | Browser storage blocked or cleared | Medium | Medium | App works without storage and ignores corrupt data (NFR-3) | Tell the user data is only local |
| R7 | Time overrun | Medium | Medium | Incremental delivery: each iteration gives a usable version | Drop Low-priority features |

Risk exposure = probability x impact. Review the table at the end of each iteration.

## 6. Project control and reporting

| Technique | How we do it |
|---|---|
| Task tracking | GitHub Issues and a Projects board (To do, In progress, Done) |
| Progress reporting | Short update in the group chat after each work session; a written status line per iteration in this file |
| Milestone review | At M1, M2 and M3, compare planned and actual dates and effort, update the risk table |
| Metrics tracked | Planned vs actual effort, test cases passed, line coverage, open defects |

## 7. Configuration management (Git and GitHub)

| Item | Rule |
|---|---|
| Configuration items | Source code, tests, SRS, plan, design, test plan, README |
| Branching | `main` is always deployable. Work on `feature/<short-name>` branches and merge by pull request. |
| Review | Every pull request is reviewed by one other member using the checklist in `test-plan.md` (inspection). |
| Commit messages | Short and in present tense, e.g. `Add threshold validation`. |
| Baselines | Tags `v0.1` (M0), `v0.5` (M1), `v0.9` (M2), `v1.0` (M3). |
| Change control | Requirement changes are raised as a GitHub issue labelled `change-request` and approved by all three members. |
| Build and release | GitHub Actions runs the tests and deploys to GitHub Pages on every push to `main`. |

## 8. Quality assurance in the plan

- Quality targets come from ISO 9126 and are listed in `design.md`.
- Each iteration has an exit check: all tests pass and the page works on a phone-width screen.
- Defects found are logged as GitHub issues labelled `bug`. Counting defects found per iteration gives a simple reliability trend: if the count per iteration keeps falling, the product is stabilising.
