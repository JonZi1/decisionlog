# Decision Log

A local-first app for tracking decisions and reviewing their outcomes. Log your reasoning, set review dates, then come back to see how things turned out. Over time, spot patterns in your decision-making and calibrate your confidence.

## Why

- Remember why you made that choice 6 months ago
- Stop second-guessing yourself
- See if you're overconfident or underconfident
- Learn from your wins and losses

## How It Works

### 1. Log a Decision

Record what you decided, why, and what you expect to happen:
- **Options considered** - What were the alternatives?
- **Reasoning** - Why this choice?
- **Expected outcome** - What do you think will happen?
- **Confidence** (0-100) - How sure are you?
- **Stakes** - Low/medium/high
- **Review timeline** - When will you know the outcome?

### 2. Wait for Review Date

The app calculates when to review based on your timeline (1 week, 1 month, 6 months, etc.). The dashboard shows which decisions are due for review.

### 3. Review the Outcome

When the review date arrives:
- **Actual outcome** - What really happened?
- **Rating** (1-5) - How well did it go?
- **Lessons learned** - What would you do differently?
- **Same choice again?** - Knowing what you know now

### 4. Track Your Calibration

The dashboard shows your **calibration gap** - the difference between your average confidence and how decisions actually turned out. This tells you if you're:
- **Overconfident** (positive gap) - Dial it back
- **Underconfident** (negative gap) - Trust yourself more
- **Well-calibrated** (near zero) - Nice

## Features

- Filter/sort decisions by category, stakes, review status
- Search by title, reasoning, or tags
- Export/import JSON backups
- All data stored locally in your browser (IndexedDB)

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm test
```

Built with React, TypeScript, Vite, Tailwind CSS, and Dexie (IndexedDB).
