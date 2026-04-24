# PostgreSQL Setup Guide for Timetable System

## Prerequisites

You need PostgreSQL installed on your machine. Here's how to set it up:

### Windows Installation

1. **Download PostgreSQL**
   - Visit https://www.postgresql.org/download/windows/
   - Download the installer (version 14+ recommended)

2. **Run the Installer**
   - Run the downloaded `.exe` file
   - When prompted for a password, set it to `postgres` (or remember it for your `.env` file)
   - Keep the port as `5432` (default)
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt and run:
     ```cmd
     psql --version
     ```

### Mac Installation

```bash
# Using Homebrew (easiest)
brew install postgresql@15
brew services start postgresql@15

# Verify
psql --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start

# Verify
psql --version
```

## Database Setup

1. **Create the Database**
   ```bash
   # Open PostgreSQL command line
   psql -U postgres
   
   # Create database (in postgres shell)
   CREATE DATABASE timetable_db;
   
   # Exit postgres shell
   \q
   ```

2. **Configure Environment Variables**
   - Navigate to your server directory
   - Edit `.env` file (created during setup):
     ```
     DB_USER=postgres
     DB_PASSWORD=postgres
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=timetable_db
     ```

3. **Install Node Packages**
   ```bash
   cd server
   npm install
   ```

4. **Start the Server**
   ```bash
   npm start
   ```
   
   The server will automatically create all required tables on first run.

## Verification

1. Open your browser and go to `http://localhost:5000`
2. Try logging in with:
   - Username: `admin`
   - Password: `admin123`

3. If you see the app load, PostgreSQL is working correctly!

## Default Test Credentials

Once the database is set up, you can use:
- **Admin**: admin / admin123
- **Teacher**: sharma / teacher123
- **Student**: student1 / student123

## Troubleshooting

### "Connection refused"
- Check if PostgreSQL is running:
  ```bash
  # Windows (in Command Prompt as Admin)
  net start PostgreSQL14  # or your version number
  
  # Mac/Linux
  sudo systemctl status postgresql
  ```

### "Database does not exist"
- Make sure you created the database:
  ```bash
  psql -U postgres -c "CREATE DATABASE timetable_db;"
  ```

### "Authentication failed"
- Verify credentials in `.env` match your PostgreSQL setup
- Default password during install is typically `postgres`

### Server won't start
- Check error messages in console
- Ensure `.env` file exists in server directory
- Try: `npm install` then `npm start` again

## Migrating Existing Data

If you have existing JSON data from the old system:
1. Export your current data from JSON files
2. You may need to write a migration script
3. Contact support if needed

## Backing Up Your Database

```bash
# Backup
pg_dump -U postgres timetable_db > backup.sql

# Restore
psql -U postgres timetable_db < backup.sql
```

## Need Help?

If you encounter issues, check:
1. PostgreSQL is running: `psql -U postgres -c "SELECT version();"`
2. Database exists: `psql -U postgres -l`
3. Connection string in `.env` is correct
4. Server logs for detailed error messages
