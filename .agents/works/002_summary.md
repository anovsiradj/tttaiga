# Sprint Planning Mechanism - Implementation Summary

## ✅ Completed Features

### 1. New Standalone Page: `sprint_plan_form.php`
- **URL**: `/sprint_plan_form.php`
- **Access**: Via navbar link "Sprint Planning" or "Planning" button on sprints list/detail pages
- **Layout**: Two-panel drag-and-drop interface (source left, target right)

### 2. Drag-and-Drop Interface (jQuery UI Sortable)
- **Source Panel (Left)**: 
  - Project-scoped sprint selector dropdown (Backlog + all sprints in project)
  - Real-time text search filter (debounced 300ms)
  - Draggable USOR cards with ref, subject, status badge, epic info
- **Target Panel (Right)**:
  - Current sprint's USORs
  - Droppable zone for adding USORs
  - Remove button on each USOR for unidirectional removal
  - Visual indicators for pending additions (green) and removals (red)

### 3. Sprint Selection
- **Primary**: Dropdown on page (project → sprint)
- **Secondary**: URL parameter `?id=SPRINT_ID` (from sprint detail page)
- Auto-loads project → sprints → selects sprint → loads planning data

### 4. Bulk Operations
- **Add USORs**: Drag from source → target (queues addition)
- **Remove USORs**: Click remove button on target USOR (queues removal)
- **Save Changes**: Batch PATCH requests with progress bar
- **Discard Changes**: Reset pending queues and reload data

### 5. API Integration
- `GET /api.php/milestones?project={id}` - Load sprints for project
- `GET /api.php/userstories?project={id}&milestone={0|sprint_id}&page_size=500` - Load USORs
- `PATCH /api.php/userstories/{id}` with `{ milestone: sprintId|null, version }` - Update sprint assignment
- Optimistic locking via version field

### 6. UI/UX Features
- Loading states with spinners
- Toast notifications (success/warning/danger)
- Progress bar during bulk save
- Empty states with helpful messages
- Responsive design (stacks on mobile)
- Pending changes badges and counters

### 7. Navigation Integration
- **Navbar**: "Sprint Planning" link (active highlighting)
- **Sprints List**: "Planning" button in filter toolbar
- **Sprint Detail**: "Planning" button in header (pre-selects sprint)

### 8. Shared Filter Integration (Project Only)
- **Project Selector**: Uses `#projectSelect` with **Select2 AJAX** (handles 100+ projects)
- **Placeholder**: Uses Select2 placeholder "Select Project" (no label)
- **Auto-selection**: Reads from shared filter on page load via `TTTaiga.Filter.read()`
- **Persistence**: Project selection saved to `sessionStorage` via `tttaigaPersistSharedFilters()`
- **Sync**: When navigating from usors.php, sprints.php, epiks.php, etc., the project filter persists
- **Scope**: Only project filter is shared; sprint selection, search, and other filters remain page-local

### 9. Unified Filter Card
- **Single Card**: Project filter + Sprint selector + Load button grouped together
- **Responsive Grid**: col-md-4 / col-md-5 / col-md-3 layout
- **Clean UX**: No separate filter toolbar section

## 📁 Files Created/Modified

### New Files
1. `sprint_plan_form.php` - Main planning page with HTML/CSS (renamed from sprint-planning.php)
2. `assets/app-sprint-planning.js` - All planning logic (drag-drop, API, state management)

### Modified Files
1. `app/layouts/main_navbar.php` - Added "Sprint Planning" nav item (new URL)
2. `sprints.php` - Added "Planning" button in filter toolbar (new URL)
3. `sprint.php` - Added "Planning" button in sprint header (new URL)
4. `assets/taiga-core.js` - Added `sprint_plan_form.php` to shared filter modules
5. `assets/app.js` - Added `sprint_plan_form.php` to shared filter modules
6. `.agents/works/002.md` - Updated checklist with completion status

## 🔧 Technical Details

### State Management
```javascript
pendingAdditions = Map<usorId, { usor, version }>
pendingRemovals = Map<usorId, { usor, version }>
sourceUsors = [] // filtered from selected source
targetUsors = [] // current sprint USORs
```

### Drag-and-Drop Flow
1. User drags USOR from source list
2. jQuery UI Sortable `receive` event fires
3. USOR added to `pendingAdditions`, removed from source display
4. USOR rendered in target list with "pending-add" class
5. User clicks "Save Changes"
6. Batch PATCH requests executed sequentially (10 at a time)
7. On success: clear queues, reload both lists, show toast

### Error Handling
- Version conflicts: Not auto-retry (keeps in queue for manual retry)
- Network errors: Logged, counted, reported in final toast
- Partial success: Reports success/fail counts

## 🎯 Usage Flow

1. **From Sprints List**: Click "Planning" button → Select project → Select sprint → Click "Load Planning"
2. **From Sprint Detail**: Click "Planning" button → Page loads with sprint pre-selected → Auto-loads planning
3. **Direct URL**: `/sprint_plan_form.php?id=123` → Auto-loads sprint 123's planning
4. **Cross-Page Navigation**: Select project on usors.php → Navigate to Sprint Planning → Project pre-selected

## 📝 Checklist Status: ALL PHASES COMPLETE ✅

All 7 phases from the original checklist have been implemented and verified, including shared filter integration for project only with Select2.