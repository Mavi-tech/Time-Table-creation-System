# Timetable Server - MySQL Edition

This is the backend server for the University Timetable System, running with MySQL.

## Quick Start

### Option 1: Docker (Easiest)
```bash
# From project root
docker-compose up -d
npm install
npm start
```

### Option 2: Native MySQL
```bash
# Create database
mysql -uroot -p -e "CREATE DATABASE timetable_db;"

# Configure
cd server
# Create a .env file with your MySQL credentials

# Install & Run
npm install
npm start
```

## Render Deployment

Render can host the backend as a Node web service, but it does not provide a managed MySQL database for this project. Use an external MySQL provider, then configure the Render service with those credentials.

### Recommended Render settings

- **Root directory**: `server`
- **Build command**: `npm install`
- **Start command**: `npm start`
- **Health check path**: `/api/days`

### Required environment variables

Set these in the Render dashboard or as blueprint variables:

```env
PORT=10000
NODE_ENV=production
DB_HOST=<your-mysql-host>
DB_PORT=3306
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=<your-mysql-database>
```

### Deployment steps

1. Create the MySQL database on your chosen provider.
2. Create a new Render Web Service from this repository.
3. Point the service root to `server` and use the settings above.
4. Add the environment variables.
5. Deploy and verify `https://<your-service>.onrender.com/api/days` returns the available days.

## Configuration

Create a `.env` file:
```env
DB_USER=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=3306
DB_NAME=timetable_db
PORT=5000
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/login` - Login with username/password

### Departments
- `GET /api/departments` - List all
- `POST /api/departments` - Create
- `PUT /api/departments/:id` - Update
- `DELETE /api/departments/:id` - Delete

### Courses
- `GET /api/courses` - List (supports filtering)
- `POST /api/courses` - Create
- `PUT /api/courses/:id` - Update
- `DELETE /api/courses/:id` - Delete

### Teachers
- `GET /api/teachers` - List
- `POST /api/teachers` - Create
- `PUT /api/teachers/:id` - Update
- `DELETE /api/teachers/:id` - Delete

### Classrooms
- `GET /api/classrooms` - List
- `POST /api/classrooms` - Create
- `PUT /api/classrooms/:id` - Update
- `DELETE /api/classrooms/:id` - Delete

### Batches
- `GET /api/batches` - List
- `POST /api/batches` - Create
- `PUT /api/batches/:id` - Update
- `DELETE /api/batches/:id` - Delete
- `POST /api/batches/auto-split` - Split students into batches

### Timetable
- `GET /api/timetable` - Get filtered timetable
- `GET /api/timetable/all` - Get all entries
- `POST /api/timetable/generate` - Generate new timetable
- `PUT /api/timetable/:id` - Update entry
- `DELETE /api/timetable/:id` - Delete entry
- `POST /api/timetable/:id/cancel` - Cancel entry
- `POST /api/timetable/:id/restore` - Restore entry

### Enrollments
- `GET /api/enrollments` - List
- `POST /api/enrollments` - Create
- `DELETE /api/enrollments/:id` - Delete
- `POST /api/enrollments/unenroll` - Bulk unenroll

### Change Requests
- `GET /api/change-requests` - List
- `POST /api/change-requests` - Create
- `PUT /api/change-requests/:id` - Update

### Metadata
- `GET /api/timeslots` - Available time slots
- `GET /api/days` - Available days

## Database Schema

PostgreSQL tables are automatically created on startup:

- **departments** - Department info
- **courses** - Course details with teacher assignments
- **teachers** - Teacher profiles and department assignments
- **classrooms** - Room/facility information
- **batches** - Student batch sections
- **enrollments** - Student course enrollments
- **timetables** - Generated schedule entries
- **users** - User credentials for login
- **change_requests** - Timetable modification requests

## Default Users

After startup, use these credentials to login:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teacher | sharma | teacher123 |
| Student | student1 | student123 |

## File Structure

```
server/
├── index.js           # Main Express app
├── db.js              # PostgreSQL database layer
├── generator.js       # Timetable generation engine
├── package.json       # Dependencies
├── .env               # Configuration (local, not in git)
├── .env.example       # Configuration template
└── data/              # (Legacy - no longer used)
```

## Development

### Install Dependencies
```bash
npm install
```

### Start in Development Mode
```bash
npm start
```

### Debug Mode
```bash
DEBUG=* npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_USER | postgres | PostgreSQL username |
| DB_PASSWORD | postgres | PostgreSQL password |
| DB_HOST | localhost | Database host |
| DB_PORT | 5432 | Database port |
| DB_NAME | timetable_db | Database name |
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |

## Database Management

### Connect to PostgreSQL
```bash
psql -U postgres -d timetable_db
```

### View All Tables
```bash
psql -U postgres -d timetable_db -c "\dt"
```

### Backup Database
```bash
pg_dump -U postgres timetable_db > backup.sql
```

### Restore Database
```bash
psql -U postgres timetable_db < backup.sql
```

### Drop and Recreate
```bash
psql -U postgres -c "DROP DATABASE timetable_db;"
psql -U postgres -c "CREATE DATABASE timetable_db;"
npm start  # Tables recreated automatically
```

## Error Handling

All endpoints return standard JSON responses:

### Success (200)
```json
{ "data": "..." }
```

### Client Error (400/404)
```json
{ "error": "Description" }
```

### Server Error (500)
```json
{ "error": "Error message" }
```

## Performance Notes

- PostgreSQL handles concurrent users better than JSON files
- Indexing is automatic on primary keys
- Large timetables generate faster with proper database setup
- Regular backups recommended for production

## Troubleshooting

**Server won't start:**
1. Check PostgreSQL is running: `psql --version`
2. Verify database exists: `psql -U postgres -l`
3. Check .env file: `cat .env`
4. Check Node modules: `ls node_modules/pg`

**"Connection refused":**
- PostgreSQL service not running
- Start Docker: `docker-compose up -d`
- Or start PostgreSQL manually

**"Database does not exist":**
```bash
psql -U postgres -c "CREATE DATABASE timetable_db;"
```

**Port already in use:**
```bash
# Change PORT in .env or:
PORT=3000 npm start
```

## Support Files

- `POSTGRES_SETUP.md` - Full PostgreSQL installation guide
- `QUICKSTART.md` - Quick setup options
- `MIGRATION_SUMMARY.md` - Technical migration details
- `SETUP_CHECKLIST.md` - Step-by-step checklist

---

Built with Express.js and PostgreSQL 🚀
