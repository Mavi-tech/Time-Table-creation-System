# PostgreSQL Migration - Setup Checklist ✓

Complete these steps in order to get your app running with PostgreSQL:

## Phase 1: Environment Setup

- [ ] **Install PostgreSQL**
  - Windows: Download from https://www.postgresql.org/download/windows/
  - Mac: `brew install postgresql@15`
  - Linux: `sudo apt install postgresql postgresql-contrib`
  - Or use Docker: `docker-compose up -d`

- [ ] **Create Database**
  ```bash
  psql -U postgres -c "CREATE DATABASE timetable_db;"
  ```

- [ ] **Configure Environment**
  - Navigate to `server/` folder
  - Rename or copy `.env.example` to `.env`
  - Update credentials if needed:
    ```
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=timetable_db
    ```

## Phase 2: Dependencies

- [ ] **Install Server Dependencies**
  ```bash
  cd server
  npm install
  ```

- [ ] **Verify Installation**
  ```bash
  npm list pg
  node -e "require('pg')" && echo "✓ PostgreSQL driver installed"
  ```

## Phase 3: Database Verification

- [ ] **Test Database Connection**
  ```bash
  psql -U postgres -d timetable_db -c "SELECT NOW();" -q
  ```
  (Should show current timestamp without errors)

- [ ] **Check Tables**
  - Start server: `npm start`
  - Server logs should show: "Database schema initialized successfully"
  - Query database: `psql -U postgres -d timetable_db -c "\dt"`
  - Should list: departments, courses, teachers, classrooms, batches, enrollments, timetables, users, change_requests

## Phase 4: Application Testing

- [ ] **Start Server**
  ```bash
  npm start
  ```
  - Wait for: "🎓 Server running on http://localhost:5000"

- [ ] **Test Frontend**
  - Open browser: http://localhost:5000
  - Should see login page

- [ ] **Test Login**
  - Username: `admin`
  - Password: `admin123`
  - Should display dashboard

- [ ] **Test Database Operations**
  - Create a new department in admin panel
  - Query database to verify:
    ```bash
    psql -U postgres -d timetable_db -c "SELECT * FROM departments;"
    ```
  - Department should appear in database

## Phase 5: Data Cleanup (Optional)

- [ ] **Remove Old JSON Files** (if not needed)
  ```bash
  rm -rf server/data/*.json  # or delete via File Explorer
  ```

- [ ] **Verify No Dependencies on JSON**
  - Application should work without JSON files

## Phase 6: Production Considerations

- [ ] **Back Up Database**
  ```bash
  pg_dump -U postgres timetable_db > backup.sql
  ```

- [ ] **Configure the Frontend for Split Deployment**
  - Set `REACT_APP_API_URL` in the Vercel project to the deployed backend URL
  - Keep the backend and database on a separate host or container stack
  - Verify browser requests go to the backend domain, not `localhost`

- [ ] **Test Backup/Restore**
  ```bash
  psql -U postgres timetable_db < backup.sql
  ```

- [ ] **Update Documentation**
  - Share `POSTGRES_SETUP.md` with your team
  - Document your server deployment process

## Phase 7: Optional Dashboard Access

- [ ] **Set Up Database GUI** (if using Docker)
  - Access pgAdmin at http://localhost:5050
  - Email: admin@example.com
  - Password: admin
  - Connect to PostgreSQL server for visual management

## Troubleshooting Checklist

If you encounter errors, check:

- [ ] PostgreSQL is running
  ```bash
  psql --version  # Should output version number
  ```

- [ ] Database exists
  ```bash
  psql -U postgres -l  # Should list timetable_db
  ```

- [ ] Environment variables are correct
  ```bash
  cat server/.env  # Verify settings
  ```

- [ ] Node packages are installed
  ```bash
  ls server/node_modules/pg  # Should exist
  ```

- [ ] Check server logs for errors
  ```
  Look for error messages when running 'npm start'
  ```

## Success Indicators ✓

Your setup is complete when you see ALL of these:

1. ✓ Server starts without errors
2. ✓ Login page loads at http://localhost:5000
3. ✓ Can log in with admin credentials
4. ✓ Can create/edit records
5. ✓ Data persists after page reload
6. ✓ No references to JSON files in output
7. ✓ Database tables exist in PostgreSQL

## Quick Undo (Revert to JSON - if needed)

If you need to revert to the old JSON system:
1. Restore from git: `git checkout server/db.js server/index.js server/generator.js`
2. Remove dependencies: Update package.json to remove pg and dotenv
3. Reinstall: `npm install`

---

## Need Help?

1. Read **POSTGRES_SETUP.md** for detailed instructions
2. Read **QUICKSTART.md** for simplified setup
3. Read **MIGRATION_SUMMARY.md** for technical overview
4. Check server console output for specific errors

---

**All setup complete? Your app is ready!** 🚀
