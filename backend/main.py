from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from database import engine, get_db, Base
from models import Staff as StaffModel, Student as StudentModel
from schemas import (
    StaffCreate, StaffResponse, StudentCreate, StudentResponse, StudentUpdate,
    BatchCreate, BatchResponse, ClassSessionResponse, EnrollmentCreate, EnrollmentResponse, AttendanceCreate, AttendanceResponse
)
from datetime import date
import crud

# Create FastAPI app
app = FastAPI(title="Optimus API", version="1.0.0")

# CORS Middleware
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization
@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Optimus API is running", "status": "healthy"}

# ==================== Staff Endpoints ====================

@app.get("/staff", response_model=List[dict])
async def get_all_staff(db: Session = Depends(get_db)):
    """Get all staff members"""
    staff_list = crud.get_all_staff(db)
    # Convert to dict format for frontend compatibility
    return [
        {
            "id": s.id,
            "name": s.name,
            "firstName": s.first_name,
            "lastName": s.last_name,
            "role": s.role,
            "phone": s.phone,
            "email": s.email,
            "calendar": s.calendar,
            "takesClasses": s.takes_classes
        }
        for s in staff_list
    ]

@app.post("/add-staff")
async def add_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    """Add a new staff member"""
    # Check if staff already exists
    existing_staff = crud.get_staff_by_email(db, staff.email)
    if existing_staff:
        raise HTTPException(
            status_code=400, 
            detail="Staff member with this email already exists"
        )
    
    # Create staff
    new_staff = crud.create_staff(db, staff)
    
    return {
        "message": "Staff added successfully",
        "staff": {
            "id": new_staff.id,
            "name": new_staff.name,
            "role": new_staff.role,
            "email": new_staff.email
        }
    }

@app.put("/staff/{staff_id}")
async def update_staff(staff_id: int, staff: StaffCreate, db: Session = Depends(get_db)):
    """Update a staff member"""
    updated_staff = crud.update_staff(db, staff_id, staff)
    if not updated_staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    
    return {
        "message": "Staff updated successfully",
        "staff": {
            "id": updated_staff.id,
            "name": updated_staff.name
        }
    }


# ==================== Student Endpoints ====================

@app.get("/students", response_model=List[StudentResponse])
async def get_all_students(db: Session = Depends(get_db)):
    """Get all students"""
    return crud.get_all_students(db)

@app.post("/add-student")
async def add_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Add a new student"""
    # Check if student already exists
    existing_student = crud.get_student_by_email(db, student.email)
    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Student with this email already exists"
        )
    
    # Create student
    new_student = crud.create_student(db, student)
    
    return {
        "message": "Student added successfully",
        "student": {
            "id": new_student.id,
            "name": f"{new_student.first_name} {new_student.last_name}",
            "email": new_student.email
        }
    }

@app.put("/students/{student_id}")
async def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):

    """Update a student"""
    updated_student = crud.update_student(db, student_id, student)
    if not updated_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "message": "Student updated successfully",
        "student": {
            "id": updated_student.id,
            "name": f"{updated_student.first_name} {updated_student.last_name}"
        }
    }


@app.get("/read-sheet")
async def read_sheet(db: Session = Depends(get_db)):
    """
    Get students in dashboard format
    Compatible with existing frontend expecting Google Sheets format
    """
    students = crud.get_all_students(db)
    
    # Format for dashboard compatibility
    formatted_data = [
        {
            "Timestamp": student.created_at.strftime("%Y-%m-%d") if student.created_at else "",
            "Email": student.email,
            "First Name": student.first_name,
            "Last Name": student.last_name,
            "Desired Course": student.desired_course or "",
            "Primary Phone Number": student.primary_phone_number,
            "Select your nearest Vama Center ": student.nearest_vama_center or ""
        }
        for student in students
    ]
    
    return {"data": formatted_data}

# ==================== Database Info Endpoint ====================

@app.get("/db-info")
async def database_info(db: Session = Depends(get_db)):
    """Get database statistics"""
    staff_count = db.query(StaffModel).count()
    student_count = db.query(StudentModel).count()
    
    return {
        "database": "Neon PostgreSQL",
        "staff_count": staff_count,
        "student_count": student_count,
        "status": "connected"
    }

# ==================== Scheduling Endpoints ====================

@app.post("/batches", response_model=BatchResponse)
async def create_batch(batch: BatchCreate, db: Session = Depends(get_db)):
    """Create a new class batch"""
    return crud.create_batch(db, batch)

@app.get("/batches", response_model=List[BatchResponse])
async def get_batches(db: Session = Depends(get_db)):
    """Get all batches"""
    return crud.get_batches(db)

@app.get("/calendar", response_model=List[ClassSessionResponse])
async def get_calendar_sessions(
    start: date, 
    end: date, 
    db: Session = Depends(get_db)
):
    """Get sessions for a specific date range"""
    return crud.get_sessions(db, start, end)

@app.post("/enrollments", response_model=EnrollmentResponse)
async def enroll_student(enrollment: EnrollmentCreate, db: Session = Depends(get_db)):
    return crud.enroll_student(db, enrollment)

@app.post("/sessions/{session_id}/attendance", response_model=AttendanceResponse)
async def mark_attendance(
    session_id: int, 
    attendance: AttendanceCreate, 
    db: Session = Depends(get_db)
):
    return crud.mark_attendance(db, attendance, session_id)

@app.get("/sessions/{session_id}", response_model=ClassSessionResponse)
async def get_session_details(session_id: int, db: Session = Depends(get_db)):
    session = crud.get_session_details(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

