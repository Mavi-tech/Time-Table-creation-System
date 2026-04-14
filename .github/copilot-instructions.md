# Timetable System Workspace Guidelines

## Quick Start

**Full setup**: See [QUICKSTART.md](../QUICKSTART.md)

```bash
# Option 1: Docker (recommended)
docker-compose up -d

# Option 2: Native PostgreSQL
psql -U postgres -c "CREATE DATABASE timetable_db;"
cd server && npm install && npm start
```

**Default credentials**: `admin` / `admin123`

---

## Code Style & Structure

### Backend (Express server)

- **CRUD pattern**: All resources follow `GET /api/resource`, `POST /api/resource`, `PUT /api/resource/:id`, `DELETE /api/resource/:id`
- **Error responses**: Return `{ error: "message" }` with appropriate HTTP status
- **Success responses**: Return the resource object or `{ ok: true }`
- **Type coercion**: Always coerce numeric fields: `['year', 'semester', 'capacity'].forEach(k => { if (val[k]) val[k] = +val[k] })`
- **ID generation**: Use `db.uid('prefix-')` which returns `prefix-timestamp-random` (e.g., `u-1712521...abc123`)

**File organization**:
- `server/db.js` - Database abstraction layer (async wrappers around JSON or PostgreSQL)
- `server/generator.js` - CSP-based timetable scheduling algorithm
- `server/index.js` - Express routes and API endpoints
- `server/setup.js` - Database schema initialization

### Frontend (React)

- **Routing**: Role-based paths (`/admin`, `/teacher`, `/student`) guarded by `RequireAuth` wrapper checking `user.role`
- **Auth**: React Context (`AuthContext.js`) + sessionStorage (expires on tab close—no persistence)
- **Component hierarchy**: Each role gets a layout template (`AdminLayout`, `TeacherLayout`, `StudentLayout`) with shared Sidebar + WorkspaceHeader
- **API calls**: Centralized through `client/src/api.js` using Axios

---

## Architecture: Core Concepts

### Database Layer (db.js)

Currently uses **JSON files** in `server/data/` but designed to migrate to PostgreSQL. The API is **always async** to future-proof.

**Core methods**:
- `db.read(collection)` → array of all records
- `db.findById(collection, id)` → single record or null
- `db.add(collection, object)` → returns created object
- `db.update(collection, id, updates)` → returns updated object
- `db.remove(collection, id)` → returns true/false

⚠️ **Gotcha**: No schema validation—db.js accepts any object structure.

### Timetable Generation Algorithm (generator.js)

The system uses **Constraint Satisfaction Problem (CSP) solving** with backtracking and soft-constraint scoring.

**Process**:
1. Break courses into individual sessions (lectures/labs per week)
2. Apply **hard constraints** (no conflicts, room type match, lunch-break rules)
3. Score **soft constraints** (day spread +15, time preference +4, room fit, capacity, etc.)
4. Schedule most-constrained sessions first (MRV heuristic)
5. Backtrack up to 50 times if conflicts found

**Hard constraints** (must satisfy):
- No teacher/room/student double-booking
- Student group capacity fits room
- Labs cannot cross lunch (slot 4→5)
- Room type matches session type (lecture vs lab)

**Key input fields**:
```javascript
{
  courses: [],           // With week structure: { week: [{ day, slot, lecture/lab }] }
  batches: [],           // Student groups by dept+semester+batch
  rooms: [],             // With type: 'lecture' | 'lab'
  departmentId: "dept-X",
  semester: 3,
  preferences: {}        // Optional: { daySpread: 15, timePref: 4, ... }
}
```

⚠️ **Known limitation**: Single-department per call only.

### Authentication Pattern

- **Flow**: POST `/api/login` with `{ username, password }` → returns user object (minus password)
- **Storage**: sessionStorage (browser tab scoped, not persistent)
- **Roles**: Exactly `'admin'`, `'teacher'`, or `'student'` (string values)
- **Default users**: Created in `server/setup.js` with hardcoded passwords—change in production

---

## Common Patterns & Anti-Patterns

### ✅ Do This

- Use `db.uid(prefix)` for IDs ensuring consistent prefixes (`u-`, `t-`, `c-`, etc.)
- Coerce numeric strings to numbers before storing
- Return `{ error: "specific message" }` on API errors
- Guard admin routes with `RequireAuth allowedRoles={['admin']}`
- Check `user.role` to determine which layout to render

### ❌ Don't Do This

- ❌ Store passwords in responses (they're filtered client-side—fragile)
- ❌ Use localStorage for auth (use sessionStorage instead)
- ❌ Skip numeric type coercion (causes scheduling bugs)
- ❌ Create multiple teacher-user links manually (use CASCADE on delete)
- ❌ Call generator for multiple departments at once (single-dept limitation)
- ❌ Assume concurrent timetable generation is safe (race conditions possible)

---

## Database & Migration

### Schema

Core tables (see `server/setup.js` for current schema):
- `users` - Authentication (username, password, role)
- `departments` - Academic departments
- `courses` - Course definitions with semester/year
- `teachers` - Instructor records (linked to users)
- `classrooms` - Physical rooms with capacity/type
- `batches` - Student groups (dept+semester+batch)
- `enrollments` - Student-course assignments
- `timetables` - Generated schedules with session details
- `change_requests` - Teacher-submitted timetable changes

### Migration: JSON → PostgreSQL

Run: `node server/migrate-json-to-postgres.js`

This:
1. Loads JSON files from `server/data/`
2. Normalizes types (numeric coercion, ISO dates)
3. Truncates PostgreSQL tables
4. Re-inserts via `db.add()`

⚠️ **Note**: No foreign key validation during migration—relies on column name mapping.

---

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `npm start` (from `server/`) | Start Express server on port 5000 |
| `npm run dev` | Same as start (alias) |
| `npm run migrate` | Migrate JSON files to PostgreSQL |
| `npm start` (from `client/`) | Start React dev server on port 3000 (proxies to localhost:5000) |
| `npm run build` (from `client/`) | Build React production bundle |

**Docker**:
```bash
docker-compose up -d     # Start PostgreSQL + pgAdmin
docker-compose down      # Stop services
docker-compose down -v   # Stop and remove data
```

---

## Conventions Specific to This Project

### ID Prefixes
- `u-` → user
- `t-` → teacher
- `c-` → course
- `dept-` → department
- `b-` → batch
- `sess-` → session (in timetables)

### Field Naming
- **JavaScript layer**: camelCase (`departmentId`, `yearOfStudy`)
- **Database layer**: snake_case (`department_id`, `year_of_study`)
- ⚠️ **Gotcha**: Duplicate collection mappings exist (e.g., `changeRequests` and `change_requests`)

### Soft Constraint Scoring (Timetable Generator)

Values are NOT normalized—larger numbers dominate. Current weights:
- Preferred placement: +1000
- New day for course: +15
- Early weekday bonus: +1
- Daily balance penalty: up to -100
- Consecutive session bonus: +4
- Time-of-day preference: +4

⚠️ **Known issue**: Unbalanced weights can skew scheduling preferences.

---

## Key Files & When to Edit Them

| File | Purpose | When to Edit |
|------|---------|--------------|
| `server/db.js` | Database abstraction | Adding new read/write methods, schema changes |
| `server/generator.js` | Timetable algorithm | Tuning constraints, adjusting soft weights, adding new rules |
| `server/index.js` | REST API endpoints | Adding new resources, new routes, filters |
| `server/setup.js` | Schema initialization | Modifying default data, adding new tables/columns |
| `client/src/api.js` | API client wrapper | Adding new endpoints, changing request structure |
| `client/src/context/AuthContext.js` | Authentication state | Changing auth flow, persistence strategy |
| `.env` (server/) | Environment config | Database credentials, environment-specific settings |

---

## Documentation Reference

- **System Requirements**: [SRS_TimeTable_Creation_System.md](../SRS_TimeTable_Creation_System.md) — Full spec with use cases, data flows, algorithms
- **Setup Checklist**: [SETUP_CHECKLIST.md](../SETUP_CHECKLIST.md) — Step-by-step environment setup
- **PostgreSQL Setup**: [POSTGRES_SETUP.md](../POSTGRES_SETUP.md) — Detailed database installation
- **API Reference**: [server/README.md](../server/README.md) — Complete endpoint documentation
- **Migration Guide**: [MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md) — JSON → PostgreSQL transition notes

---

## Debugging Tips

**Auth issues?**
- Check `sessionStorage` for `auth` key (not `localStorage`)
- Verify user role is exactly `'admin'`, `'teacher'`, or `'student'`
- Check if tab was closed (sessionStorage clears on close)

**Timetable generation fails?**
- Verify semester and year match existing course definitions
- Check room types match session types (lecture vs lab)
- Look for circular teacher/course dependencies
- Ensure batch auto-split was run if enrollments > room capacity

**Database connection issues?**
- Run `psql -U postgres -d timetable_db -c "SELECT NOW();"` to verify PostgreSQL is running
- Check `.env` credentials match your environment
- Verify port 5432 is not blocked by firewall

**Type coercion bugs?**
- If numeric fields are strings, check the API endpoint isn't coercing them
- Look for `year`, `semester`, `capacity` fields that need explicit `+` conversion
