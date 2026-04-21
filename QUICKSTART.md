# Quick Start Guide - Docker + MySQL Setup

## Option 1: Using Docker (Recommended)

If you have Docker installed, this is the fastest setup:

```bash
# Start MySQL, API server, client, and Adminer
docker-compose up -d
```

**Access Services:**
- Client: http://localhost:3000
- Server API: http://localhost:5000
- Database Admin (Adminer): http://localhost:8080
  - System: MySQL
  - Server: db (inside Docker network)
  - Username: root
  - Password: root
  - Database: timetable_db

---

## Option 2: Native MySQL Installation

1. **Install MySQL 8+**

2. **Create Database:**
   ```bash
   mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS timetable_db;"
   ```

3. **Set Environment Variables:**
   - Create or edit `server/.env`:
     ```
     DB_USER=root
     DB_PASSWORD=root
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=timetable_db
     PORT=5000
     ```

4. **Start Server:**
   ```bash
   cd server
   npm install
   npm start
   ```

5. **Start Client:**
   ```bash
   cd client
   npm install
   npm start
   ```

---

## Testing the Connection

1. Open http://localhost:3000 in your browser
2. Login with `admin` / `admin123`
3. If dashboard loads and data operations work, your setup is correct

---

## Stopping Docker

```bash
docker-compose down
```

To remove all Docker volumes/data:

```bash
docker-compose down -v
```

---

## Useful MySQL Commands

```bash
# Verify MySQL is reachable
mysql -uroot -proot -e "SELECT NOW();"

# Open database shell
mysql -uroot -proot timetable_db

# List databases
SHOW DATABASES;

# List tables
SHOW TABLES;
```

---

## Troubleshooting

**Error: "Connection refused"**
- Ensure MySQL/Docker is running
- Check DB settings in `server/.env`

**Error: "Database does not exist"**
- Run: `mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS timetable_db;"`

**Server won't start**
- Run `npm install` in `server`
- Verify database credentials
- Check server logs for specific errors

---

For more backend setup details, see [server/README.md](./server/README.md)
