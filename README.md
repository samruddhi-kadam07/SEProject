# Attendance Tracker

A simple website to track subject-wise attendance and see at a glance whether you meet the minimum (default 75%) needed for exams. Built as the Software Engineering PBL project.

**Live site:** https://samruddhi-kadam07.github.io/SEProject/ (available after GitHub Pages is switched on, see "Deployment")

## Features

- Add subjects, with optional starting counts
- Mark each class **Present** or **Absent** in one click
- Percentage per subject and overall, with a progress bar and a marker at the minimum
- Status: **Eligible**, **At risk** (within 10 points below the minimum) or **Not eligible**
- Advice: "attend the next N classes in a row" or "you can miss N classes"
- Adjustable minimum percentage (1 to 99)
- Data saved in your browser; nothing is sent anywhere
- Works on phones, supports dark mode and keyboard use

## Project documents

| Document | Covers |
|---|---|
| [docs/SRS.md](docs/SRS.md) | Requirements, use cases, decision table, event table, state transitions |
| [docs/project-plan.md](docs/project-plan.md) | Life cycle model, schedule, COCOMO and function point estimates, risks, configuration management |
| [docs/design.md](docs/design.md) | Architecture, UML (class, sequence, state), CRC cards, design patterns, ISO 9126 quality |
| [docs/test-plan.md](docs/test-plan.md) | Black-box and white-box tests, coverage, manual UI tests, inspection checklist |

## Project structure

```
index.html            the page
css/style.css         styles (light and dark)
js/attendance.js      business rules and data model (no DOM code)
js/app.js             user interface
tests/                automated tests (Node's built-in test runner)
docs/                 SRS, plan, design, test plan
.github/workflows/    test and deploy pipeline
```

## Run it locally

No install needed. Open `index.html` in a browser.

## Run the tests

Needs Node.js 20 or newer.

```
npm test
```

## Deployment (GitHub Pages)

The workflow in `.github/workflows/pages.yml` runs the tests and then publishes the site on every push to `main`.

One-time setup (the repository must be public on the free GitHub plan):

1. Open the repo on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or open the **Actions** tab and run the workflow). When it finishes, the site is live at the URL above.

## Team

| Member (add full names) | GitHub |
|---|---|
| | [@samruddhi-kadam07](https://github.com/samruddhi-kadam07) |
| | [@GayatriRaahul](https://github.com/GayatriRaahul) |
| | (add third member's username) |

## Working as a team

- `main` is always deployable. Create a branch such as `feature/threshold-box`, push it, and open a pull request.
- One other member reviews each pull request using the checklist in `docs/test-plan.md`.
- Everyone should commit their own work so each member appears as a contributor.

## Licence

MIT, see [LICENSE](LICENSE).
