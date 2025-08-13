# Vercel build failure: StudyStatus mappings and confirm variant type

- Date: 2025-08-13
- Scope: study-platform-backoffice
- Impact: Backoffice build failed on Vercel (TypeScript errors)

## Symptoms
- TypeScript errors during build:
  - TS7053: Element implicitly has an 'any' type because expression of type 'StudyStatus' can't be used to index type {...}
    - Property 'IN_PROGRESS' does not exist on type '{ PENDING; APPROVED; REJECTED; TERMINATED; }'
  - TS2322: Type '"success"' is not assignable to type '"warning" | "info" | "danger" | undefined'

## Root cause
- `StudyStatus` type includes `IN_PROGRESS` and `COMPLETED`, but UI mapping objects in `StudyCard` and `StudyDetailModal` did not define keys for these values, causing unsafe indexing.
- Confirm modal `variant` prop only supports 'danger' | 'warning' | 'info', but code passed 'success'.

## Changes
- Add missing `IN_PROGRESS` and `COMPLETED` entries and type the maps as `Record<StudyStatus, ...>`:
  - `src/components/study/StudyCard.tsx`
    - Status → BadgeVariant
    - Status → text
    - Introduced strict `CardVariant` mapping for card styles
  - `src/components/study/StudyDetailModal.tsx`
    - Status → color
    - Status → text
- Align confirm dialog variant to supported types:
  - `src/pages/StudyManagement.tsx`
    - Changed `variant: 'success'` to `variant: 'info'`

## Verification
- Local build succeeded:
  - Backoffice: `npm run build` (vite + tsc) OK
  - Web: `npm run build` OK (with unrelated CSS warning)

## Commit
- fix(backoffice): add IN_PROGRESS/COMPLETED status mappings and align confirm variant to resolve TS7053/TS2322 build errors

## Follow-ups
- Consider adding a dedicated visual style for `COMPLETED` distinct from `TERMINATED`.
- Consider extending `ConfirmModal` to support a 'success' variant if needed.
