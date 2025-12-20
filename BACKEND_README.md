# Optimus Backend API

FastAPI backend with Neon PostgreSQL database for the Optimus application.

## Quick Start

### 1. Install Dependencies
```bash
cd /Users/yadavvignesh/vama-backend
pip install -r requirements.txt
```

### 2. Configure Database
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your Neon connection string
# DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
```

### 3. Run the Server
```bash
uvicorn main:app --reload --port 8000
```

On first run, database tables will be created automatically.

### 4. Verify
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/
- DB Info: http://localhost:8000/db-info

## Project Structure
```
vama-backend/
├── main.py           # FastAPI application & routes
├── database.py       # Database connection setup
├── models.py         # SQLAlchemy database models
├── schemas.py        # Pydantic validation schemas
├── crud.py          # Database operations
├── requirements.txt  # Python dependencies
├── .env             # Environment variables (create this)
└── .env.example     # Example environment file
```

## API Endpoints

### Staff
- `GET /staff` - Get all staff members
- `POST /add-staff` - Add new staff member

### Students
- `GET /students` - Get all students
- `POST /add-student` - Add new student
- `GET /read-sheet` - Get students (dashboard format)

### System
- `GET /` - Health check
- `GET /db-info` - Database statistics

## Database Models

**Staff**: id, name, first_name, last_name, role, phone, email, calendar, takes_classes, created_at, updated_at

**Students**: id, first_name, last_name, email, primary_phone_number, date_of_birth, gender, address, desired_course, nearest_vama_center, preferred_mode_of_contact, created_at, updated_at

## Development

### Run with auto-reload
```bash
uvicorn main:app --reload
```

### Run on different port
```bash
uvicorn main:app --reload --port 8001
```

## Frontend Configuration

The frontend expects the backend at `http://localhost:8000`. If running on a different port, update `/Users/yadavvignesh/vama-frontend/src/lib/api.js`:

```javascript
const API_BASE = 'http://localhost:YOUR_PORT';
```

## Troubleshooting

**Connection Error**: Check your DATABASE_URL in `.env`
**Module Not Found**: Run `pip install -r requirements.txt`
**Port in Use**: Change port with `--port 8001`
