# Plan: Result Feature Overhaul (Grilled & Finalized)

> Source PRD: School Result Checker PRD — Section 3.3 (Result Page) & 3.4 (Admin Dashboard → Result Management)
> Grilled: 45 design decisions resolved via grill-me session (March 31, 2026)

---

## Complete Decision Log

| # | Topic | Decision |
|---|-------|----------|
| 1 | Migration safety | Drop `ca_score` directly, no backfill |
| 2 | `class_average` | Manually entered per subject row by admin |
| 3 | Grade scale | A≥70, B≥60, C≥50, D≥40, F<40 (subject to change) |
| 4 | Subject scope | Show all system subjects; filter out empty ones on result display |
| 5 | Empty rows | Blank = 0; all visible rows save |
| 6 | Unique constraint | Add `UNIQUE(student_id, subject_id, session, term)` on `results` table |
| 7 | Mode switching | Tabs + unsaved-changes prompt |
| 8 | Post-save filter | Auto-filter results table to that student after bulk save |
| 9 | Attendance field | Plain `TEXT` — admin types anything |
| 10 | Print mechanism | `@media print` CSS |
| 11 | `next_term_begins` | `TEXT` column (freeform) |
| 12 | Teacher's remark | Dropdown of 10 presets + "Other..." with custom text input |
| 13 | Subject add/remove | X button to remove, "+ Add Subject" to re-add |
| 14 | Overwrite warning | Inline yellow banner when existing data loads |
| 15 | Default tab | "By Student" default; class filter narrows the student dropdown |
| 16 | Initial state | Empty with dropdowns + helper text |
| 17 | Attendance type | TEXT (admin types anything) |
| 18 | Remark presets | Excellent, Very Good, Good, Fair, Needs Improvement, Poor, Shows Great Potential, Keep It Up, Can Do Better, Below Average + "Other..." |
| 19 | Result page layout | Header = factual data, Footer = comments; mobile-first |
| 20 | Session/term source | Hardcoded recent years ±2 + fixed ["First", "Second", "Third"] |
| 21 | Student ordering | Alphabetically by surname, then first name |
| 22 | Subject add/remove UX | X button per row, "+ Add Subject" button below table |
| 23 | Overwrite warning UX | Inline yellow banner (non-blocking) |
| 24 | Class filter flow | Class → Student → Session → Term; class auto-syncs on student selection |
| 25 | Batch validation | All-or-nothing — entire batch fails if any row invalid |
| 26 | Score validation | Client-side only (input limits + visual errors) |
| 27 | X button = delete | Removing = student doesn't take subject → delete from DB if saved |
| 28 | Term metadata placement | Collapsible section below score table, above Save button (By Student only) |
| 29 | Save scope | Single "Save All" — scores + term metadata in one click |
| 30 | Term metadata in By Class & Subject | Not shown in that mode |
| 31 | X-delete confirmation | Confirm dialog for saved rows; silent remove for unsaved |
| 32 | Single Entry tab | Removed — only 2 tabs: "By Student" and "By Class & Subject" |
| 33 | X-remove in By Class & Subject | Yes — same pattern for removing students who don't take subject |
| 34 | Footer totals | ALL manually entered by admin (total_score, average_score, overall_grade) |
| 35 | Mobile score table | Sticky Subject column on left, horizontal scroll for rest |
| 36 | Deletion safety | Confirmation dialog only, no undo |
| 37 | Loading state | Skeleton rows |
| 38 | Per-subject computation | Admin types: first_ass, second_ass, exam_score, class_average, teacher_remark. System auto-computes: total, grade |
| 39 | Footer fields storage | `total_score`, `average_score`, `overall_grade` in `term_metadata` table |
| 40 | Grade field | Auto-computed from total using grading scale, not manually entered |
| 41 | term_metadata types | All admin-entered fields as TEXT |
| 42 | Class avg in By Class & Subject | Single field at top of table, auto-fills all rows |
| 43 | Post-save behavior | Stay on same student, show success toast |
| 44 | Class avg in By Student | Per-row editable field (each subject gets its own class average) |
| 45 | total & grade storage | Stored in `results` table (computed on save) — grade scale locked at time of entry |

---

## Architectural Decisions

- **Score columns**: `ca_score` is dropped. Replaced by `first_ass` (0–20) + `second_ass` (0–20) + `exam_score` (0–60). `total` and `grade` are auto-computed on save and stored in the `results` row.
- **Per-result fields**: `class_average` (TEXT, manually entered) and `teacher_remark` (TEXT, dropdown + custom) live on the `results` row.
- **Unique constraint**: `UNIQUE(student_id, subject_id, session, term)` on `results` table — enables upsert.
- **Term metadata**: New `term_metadata` table with all TEXT fields for admin-entered values. Includes `total_score`, `average_score`, `overall_grade` (footer data).
- **Tabs**: Two tabs — "By Student" (default) and "By Class & Subject". No Single Entry tab.
- **Bulk endpoint**: `POST /api/admin/results/bulk` — upserts array, all-or-nothing validation.
- **Delete endpoint**: `DELETE /api/admin/results` — deletes by result ID (used when admin X-removes a saved subject).
- **Save All**: Single button saves scores (bulk endpoint) + term metadata (term-metadata endpoint) in parallel.
- **Result page**: Mobile-first, `@media print` for A4 output. Sticky subject column, horizontal scroll.

---

## Database Schema

### `results` table (modified)

```sql
ALTER TABLE results
  ADD COLUMN first_ass INTEGER DEFAULT 0,
  ADD COLUMN second_ass INTEGER DEFAULT 0,
  ADD COLUMN class_average TEXT,
  ADD COLUMN teacher_remark TEXT;

ALTER TABLE results DROP COLUMN ca_score;

ALTER TABLE results
  ADD CONSTRAINT results_unique_combo
  UNIQUE (student_id, subject_id, session, term);
```

Columns after migration: `id`, `student_id`, `subject_id`, `session`, `term`, `first_ass`, `second_ass`, `exam_score`, `total`, `grade`, `class_average`, `teacher_remark`, `created_at`

### `term_metadata` table (new)

```sql
CREATE TABLE term_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  session TEXT NOT NULL,
  term TEXT NOT NULL,
  school_days_opened TEXT,
  attendance TEXT,
  next_term_begins TEXT,
  overall_remark TEXT,
  teacher_comment TEXT,
  principal_comment TEXT,
  total_score TEXT,
  average_score TEXT,
  overall_grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, session, term)
);
```

---

## API Routes

### `POST /api/admin/results/bulk`
- Accepts: `{ results: [{ student_id, subject_id, session, term, first_ass, second_ass, exam_score, class_average, teacher_remark }] }`
- Auto-computes `total = first_ass + second_ass + exam_score` and `grade` per row
- Upserts by `(student_id, subject_id, session, term)` using the unique constraint
- Validation: all-or-nothing — if any row fails, none save; returns all errors
- Returns: `{ saved: number, errors: [] }`

### `DELETE /api/admin/results/[id]` or `DELETE /api/admin/results?id=xxx`
- Deletes a single result row by ID
- Used when admin X-removes a saved subject from bulk view

### `GET/POST/PUT /api/admin/term-metadata`
- CRUD for term metadata by `(student_id, session, term)`
- All fields are TEXT

### `GET /api/admin/results` (existing, updated)
- Returns results with `first_ass`, `second_ass`, `exam_score`, `total`, `grade`, `class_average`, `teacher_remark`
- Existing query params remain: `studentId`, `session`, `term`

### `GET /api/result` (public, updated)
- Returns results + term_metadata for a student
- Includes all new columns

---

## Phase 1: Schema migration & API updates

### What to build
1. Run Supabase migration: drop `ca_score`, add `first_ass`, `second_ass`, `class_average`, `teacher_remark`, add unique constraint
2. Create `term_metadata` table
3. Update `lib/supabase/types.ts` with new columns
4. Update `GET /api/admin/results` — return new fields
5. Update `POST /api/admin/results` — accept new fields, auto-compute `total` and `grade`
6. Update `PUT /api/admin/results` — same
7. Create `POST /api/admin/results/bulk` endpoint
8. Create `DELETE /api/admin/results` endpoint (by ID)
9. Create `/api/admin/term-metadata` CRUD endpoint
10. Update public `GET /api/result` — return new result fields + term_metadata

### Acceptance criteria
- [ ] `results` table has `first_ass`, `second_ass`, `exam_score`, `class_average`, `teacher_remark`; `ca_score` removed
- [ ] `UNIQUE(student_id, subject_id, session, term)` constraint exists
- [ ] `term_metadata` table exists with all columns including `total_score`, `average_score`, `overall_grade`
- [ ] Bulk endpoint upserts correctly, all-or-nothing validation
- [ ] Delete endpoint removes single result by ID
- [ ] Term metadata CRUD works with unique constraint on `(student_id, session, term)`
- [ ] Public result API returns all new fields + term_metadata

---

## Phase 2: Admin results page — "By Student" tab

### What to build

Complete redesign of the admin results page with two tabs (no single entry tab):

**Tab: "By Student" (default)**
1. Selector row: Class (optional filter) → Student → Session → Term
   - Class filter narrows student dropdown; auto-syncs when student is selected
   - Session: hardcoded list (current ±2 academic years), default = current
   - Term: fixed ["First", "Second", "Third"], default = current
2. When student + session + term selected:
   - Show skeleton rows while loading
   - Load all system subjects as editable rows, pre-filled with existing scores
   - If existing data found: show inline yellow banner "Results already exist for [Name] — [Term] [Session]. Editing and saving will overwrite existing scores."
3. Per-row fields: Subject (read-only) | First Ass (input, max 20) | Second Ass (input, max 20) | Exam (input, max 60) | Total (auto-computed, read-only) | Class Average (input) | Grade (auto-computed, read-only) | Teacher's Remark (dropdown + custom) | X button
4. X button: removes row from table. If row had saved data → confirmation dialog → deletes from DB. If unsaved → silent remove.
5. "+ Add Subject" button below table: dropdown of subjects not in table, adds row back
6. Below score table: **collapsible "Term Details" section** (expanded by default when empty, collapsed when pre-filled)
   - Fields: School Days Opened, Attendance, Next Term Begins, Overall Remark, Teacher's Comment, Principal's Comment, Total Score, Average Score, Overall Grade
   - All TEXT inputs
7. Single **"Save All"** button below term details:
   - Fires bulk results endpoint + term metadata endpoint in parallel
   - All-or-nothing: if any score row fails validation, show errors inline, don't save
   - On success: green toast "Results saved successfully", stay on same student, data refreshes
8. Client-side validation: `first_ass` 0–20, `second_ass` 0–20, `exam_score` 0–60 (red borders + helper text)
9. Tab switching: if unsaved changes exist, prompt "You have unsaved changes. Discard?"

### Acceptance criteria
- [ ] Two tabs: "By Student" (default) and "By Class & Subject"
- [ ] Class filter narrows student dropdown, auto-syncs on student selection
- [ ] Skeleton rows show while data loads
- [ ] All subjects load as editable rows, pre-filled with existing scores
- [ ] Yellow overwrite banner appears when existing data detected
- [ ] X removes subject (with confirmation for saved rows, with DB delete)
- [ ] "+ Add Subject" re-adds removed subjects
- [ ] Teacher's Remark has dropdown (10 presets + "Other..." with custom input)
- [ ] Total and Grade auto-compute in real-time as admin types scores
- [ ] Term Details collapsible section with all 9 fields
- [ ] Single "Save All" saves scores + term metadata in parallel
- [ ] Success toast, stays on same student
- [ ] Client-side validation with visual feedback
- [ ] Unsaved-changes prompt on tab switch

---

## Phase 3: Admin results page — "By Class & Subject" tab

### What to build

1. Selector row: Class → Subject → Session → Term
2. When all selected:
   - Show skeleton rows while loading
   - Load all students in that class as editable rows, pre-filled with existing scores
   - Students ordered alphabetically by surname, then first name
   - If existing data found: inline yellow banner
3. **Class Average field**: single input at top of table (one value for the whole class/subject), auto-fills the `class_average` field in every row
4. Per-row fields: Student Name (read-only) | First Ass (input, max 20) | Second Ass (input, max 20) | Exam (input, max 60) | Total (auto-computed) | Grade (auto-computed) | Teacher's Remark (dropdown + custom) | X button
5. X button: removes student row (same confirmation logic as By Student tab, deletes from DB if saved)
6. No term metadata in this view
7. "Save All" button saves all visible rows via bulk endpoint
8. Same validation, all-or-nothing, success toast

### Acceptance criteria
- [ ] Class + Subject + Session + Term selectors load students
- [ ] Students ordered alphabetically by surname
- [ ] Single class average field at top, auto-fills all rows
- [ ] X removes student row (with confirmation for saved, DB delete)
- [ ] Total and Grade auto-compute
- [ ] Teacher's Remark dropdown + custom
- [ ] All-or-nothing save via bulk endpoint
- [ ] No term metadata fields in this view

---

## Phase 4: Mobile-first result page redesign

### What to build

Redesign the public result page (`/result`):

**Header section:**
- School name, term label, "Continuous Assessment Report Record"
- Student info: Name, Admission No, Class, Session, Term

**Student info bar (factual data):**
- School Days Opened, Attendance, Next Term Begins
- All from `term_metadata`, show "—" if absent

**Score table:**
- Columns: Subject | First Ass (20) | Second Ass (20) | Exam (60) | Total (100) | Class Average | Grade | Teacher's Remark
- **Sticky Subject column** on left, horizontal scroll for remaining columns
- Renders correctly on 320px+

**Footer (evaluative text):**
- Total Score, Average Score, Overall Grade (from `term_metadata`)
- Overall Remark (from `term_metadata`)
- Teacher's Comment (from `term_metadata`)
- Principal's Comment (from `term_metadata`)
- Principal's Signature line

**Print:**
- `@media print` CSS hides nav/buttons, formats for A4
- Uses `window.print()`

### Acceptance criteria
- [ ] Result page renders correctly on mobile (320px+)
- [ ] Subject column is sticky on horizontal scroll
- [ ] Header shows factual student data, footer shows comments
- [ ] All term metadata fields display when present, show "—" when absent
- [ ] Total Score, Average Score, Overall Grade from term_metadata (not computed)
- [ ] `@media print` produces clean A4 layout matching sample report card
- [ ] Page works with or without term metadata

---

## Teacher's Remark Presets

```typescript
const REMARK_PRESETS = [
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
  "Needs Improvement",
  "Poor",
  "Shows Great Potential",
  "Keep It Up",
  "Can Do Better",
  "Below Average",
];
// + "Other..." option that opens a custom text input
```

---

## Implementation Order

1. **Phase 1**: DB migration + all API endpoints (schema, types, routes)
2. **Phase 2**: Admin "By Student" tab (the primary workflow)
3. **Phase 3**: Admin "By Class & Subject" tab
4. **Phase 4**: Public result page redesign + print CSS
