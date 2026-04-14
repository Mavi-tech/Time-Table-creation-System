# Quick Start Guide - PostgreSQL Setup

## Option 1: Using Docker (Recommended - Easiest)

If you have Docker installed, this is the quickest way:

```bash
# Start PostgreSQL and pgAdmin in Docker
docker-compose up -d

# That's it! Your database is running.
```

Then:
```bash
cd server
npm install
npm start
```

**Access Database:**
- Server: http://localhost:5000
- Database Admin (pgAdmin): http://localhost:5050
  - Email: admin@example.com
  - Password: admin

---

## Option 2: Native PostgreSQL Installation

1. **Install PostgreSQL** (see POSTGRES_SETUP.md for detailed instructions)

2. **Create Database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE timetable_db;"
   ```

3. **Update Environment File:**
   - Edit `server/.env`:
     ```
     DB_USER=postgres
     DB_PASSWORD=postgres
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=timetable_db
     ```

4. **Start Server:**
   ```bash
   cd server
   npm install
   npm start
   ```

---

## Testing the Connection

Once server is running:

1. Open http://localhost:5000 in your browser
2. Login with: `admin` / `admin123`
3. If you see the dashboard, PostgreSQL is connected! ✅

---

## Stopping Docker (if using Option 1)

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

---

## Useful PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d timetable_db

# List all databases
\l

# List all tables
\dt

# View table structure
\d table_name

# Exit
\q
```

---

## Troubleshooting

**Error: "Connection refused"**
- Ensure PostgreSQL/Docker is running
- Check `.env` file settings

**Error: "Database does not exist"**
- Run: `psql -U postgres -c "CREATE DATABASE timetable_db;"`

**Server won't start**
- Run: `npm install` in server directory
- Check that `.env` file exists
- View error messages in console

---

For more detailed setup instructions, see [POSTGRES_SETUP.md](./POSTGRES_SETUP.md)
