# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run all tests
npx vitest run   # Run tests once
```

## Architecture

This is a local-first Decision Log app built with React + TypeScript + Vite. All data is stored in IndexedDB via Dexie.

### Core Data Flow

- **Database**: `src/lib/db.ts` - Dexie IndexedDB setup with a single `decisions` table
- **Service Layer**: `src/lib/decisionService.ts` - CRUD operations, filtering, sorting, export/import
- **Stats/Analytics**: `src/lib/stats.ts` - Calibration metrics comparing confidence vs actual outcomes
- **Types**: `src/lib/types.ts` - Decision model, constants (categories, horizon options)

### Key Concepts

**Decision Model**: Users log decisions with confidence (0-100), expected outcomes, and review dates. After the review date, they record actual outcomes and ratings (1-5). The app calculates calibration gap (confidence - normalized rating) to show if users are over/under-confident.

**Review Date Calculation**: `calculateReviewDate(date, horizonDays)` adds horizon days to decision date.

### Pages

- `Dashboard` - Stats overview, due reviews, recent decisions
- `NewDecision` - Form to create decision
- `DecisionsList` - Filterable/sortable list of all decisions
- `DecisionDetail` - View decision + review form when due
- `Settings` - JSON export/import

### Components

- `DecisionForm` - Reusable form for creating decisions
- `ReviewForm` - Form for reviewing decisions (outcome, rating, lessons learned)
- `DecisionCard` - Decision list item with status indicators
- `Layout` - Navigation wrapper
