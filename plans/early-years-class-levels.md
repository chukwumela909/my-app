# Plan: Early-Years Class Levels (Creche, Pre-Nursery, Nursery)

> Source PRD: School Result Checker PRD — Section 3.4 (Admin Dashboard → Manage Classes)

## Architectural decisions

Durable decisions that apply across all phases:

- **Class levels**: The `level` field in the `classes` table will support three new values: `"Creche"`, `"Pre-Nursery"`, `"Nursery"` in addition to the existing `"JSS 1"` through `"SSS 3"`
- **Level ordering**: Levels are ordered from youngest to oldest: Creche → Pre-Nursery → Nursery → JSS 1 → JSS 2 → JSS 3 → SSS 1 → SSS 2 → SSS 3
- **Schema**: No schema migration required — the `level` column is already a `string` type, so new level values are additive
- **Routes**: No new routes — all changes go through existing `/api/admin/classes` and related endpoints

---

## Phase 1: Add early-years class levels to class management

**User stories**: "As an admin, I want to create and manage Creche, Pre-Nursery, and Nursery classes so that I can assign early-years students to the correct class."

### What to build

Extend the class level dropdown in the admin classes page to include the three new early-years levels (Creche, Pre-Nursery, Nursery) before the existing JSS/SSS levels. When an admin creates or edits a class, these new levels are available for selection and persist to the database through the existing API. The dropdown should present all nine levels in age-ascending order.

### Acceptance criteria

- [x] The class level dropdown shows all 9 levels in order: Creche, Pre-Nursery, Nursery, JSS 1, JSS 2, JSS 3, SSS 1, SSS 2, SSS 3
- [x] Admin can create a new class with any of the three early-years levels
- [x] Admin can edit an existing class to change its level to an early-years level
- [x] Created early-years classes appear correctly in the classes list table

---

## Phase 2: End-to-end verification — student assignment & result display

**User stories**: "As an admin, I want to assign students to early-years classes. As a parent, I want to see the correct early-years class name on my child's result sheet."

### What to build

Verify the full data flow from class creation through to result display. Assign a student to an early-years class and confirm the class name renders correctly on the student result page. This covers the student management class filter/assignment and the public result sheet display — both of which already use dynamic data from the `classes` table join and should work without code changes, but need verification.

### Acceptance criteria

- [x] Admin can assign a student to a Creche, Pre-Nursery, or Nursery class via the student management page
- [x] The student's class name displays correctly on the result sheet when a parent/student checks their result
- [x] Any class-based filters or dropdowns in student management include the early-years classes
