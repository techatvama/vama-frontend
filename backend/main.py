from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import date, datetime

from database import engine, get_db, Base
from models import Staff as StaffModel, Student as StudentModel, Syllabus, Module, Content, StudentProgress, Material, Batch, ClassSession, Enrollment, Attendance, Subject, Grade, BatchEnrollment, BatchTeacher
from schemas import (
    StaffCreate, StaffResponse, StudentCreate, StudentResponse, StudentUpdate,
    BatchCreate, BatchResponse, ClassSessionResponse, EnrollmentCreate, EnrollmentResponse, AttendanceCreate, AttendanceResponse,
    SyllabusResponse, StudentProgressUpdate, StudentProgressResponse, StudentProgressCreate,
    TeacherLogin, StudentLogin, MaterialResponse, MaterialCreate
)
import crud

app = FastAPI(title="Optimus API", version="1.0.0")

# ==================== CORS Middleware (MUST BE BEFORE ROUTERS) ====================
# Configure CORS to allow frontend requests
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ==================== Include Routers ====================
from admin_routes import router as admin_router
from student_routes import router as student_enhanced_router
from teacher_routes import router as teacher_router

app.include_router(admin_router)
app.include_router(student_enhanced_router)
app.include_router(teacher_router)

# ==================== Teacher Portal Endpoints ====================

@app.post("/teacher/login")
async def teacher_login(login_data: TeacherLogin, db: Session = Depends(get_db)):
    """Login for teachers"""
    teacher = crud.get_staff_by_email(db, login_data.email)
    if not teacher or not crud.verify_password(login_data.password, teacher.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "message": "Login successful",
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "email": teacher.email,
            "role": teacher.role
        }
    }

@app.get("/teacher/{teacher_id}/sessions")
async def get_teacher_sessions(
    teacher_id: int,
    start: date,
    end: date,
    db: Session = Depends(get_db)
):
    """Get sessions assigned to a specific teacher, with per-session enrollment counts."""
    sessions = crud.get_teacher_sessions(db, teacher_id, start, end)
    counts = crud.compute_enrollment_counts(db, sessions)

    result = []
    for s in sessions:
        result.append({
            "id": s.id,
            "batch_id": s.batch_id,
            "date": s.date.isoformat(),
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status,
            "recurrence_id": s.recurrence_id,
            "is_published": getattr(s, "is_published", True),
            "notes": getattr(s, "notes", None),
            "enrollment_count": counts.get(s.id, 0),
            "batch": {
                "id": s.batch.id,
                "subject": s.batch.subject,
                "name": s.batch.name,
                "capacity": s.batch.capacity,
                "color_tag": s.batch.color_tag,
                "teacher_id": s.batch.teacher_id,
                "teacher": {"id": s.batch.teacher.id, "name": s.batch.teacher.name} if s.batch.teacher else None,
            } if s.batch else None,
        })
    return result

@app.get("/teacher/{teacher_id}/students", response_model=List[StudentResponse])
async def get_teacher_students(teacher_id: int, db: Session = Depends(get_db)):
    """Get all students assigned to a teacher"""
    return crud.get_teacher_students(db, teacher_id)

@app.post("/teacher/upload-material", response_model=MaterialResponse)
async def upload_material(
    teacher_id: int = Form(...),
    student_id: Optional[int] = Form(None),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload material for students"""
    file_extension = file.filename.split(".")[-1].lower()
    file_type = "other"
    if file_extension in ["pdf"]:
        file_type = "pdf"
    elif file_extension in ["jpg", "jpeg", "png", "gif"]:
        file_type = "image"
    elif file_extension in ["mp3", "wav", "m4a"]:
        file_type = "audio"
    elif file_extension in ["mp4", "mov", "avi"]:
        file_type = "video"
        
    file_name = f"{datetime.now().timestamp()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/{file_name}"
    
    material_data = MaterialCreate(
        teacher_id=teacher_id,
        student_id=student_id,
        title=title,
        file_url=file_url,
        file_type=file_type
    )
    
    return crud.create_material(db, material_data)

@app.get("/teacher/{teacher_id}/materials", response_model=List[MaterialResponse])
async def get_teacher_materials(teacher_id: int, db: Session = Depends(get_db)):
    """Get all materials uploaded by a teacher"""
    return crud.get_teacher_materials(db, teacher_id)

@app.get("/students/{student_id}/materials", response_model=List[MaterialResponse])
async def get_student_materials(student_id: int, db: Session = Depends(get_db)):
    """Get all materials shared with a student"""
    return crud.get_student_materials(db, student_id)

# ==================== Student Portal Endpoints ====================

@app.post("/student/login")
async def student_login(login_data: StudentLogin, db: Session = Depends(get_db)):
    """Login for students"""
    student = crud.authenticate_student(db, login_data.email, login_data.password)
    if not student:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "message": "Login successful",
        "student": {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "course": student.desired_course
        }
    }


@app.get("/student/{student_id}/sessions", response_model=List[ClassSessionResponse])
async def get_student_sessions(
    student_id: int,
    start: date,
    end: date,
    db: Session = Depends(get_db)
):
    """Get sessions for a specific student"""
    return crud.get_student_sessions(db, student_id, start, end)

@app.get("/student/{student_id}/attendance", response_model=List[AttendanceResponse])
async def get_student_attendance(student_id: int, db: Session = Depends(get_db)):
    """Get attendance and feedback for a student"""
    return db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.created_at.desc()).all()

@app.get("/student/{student_id}/teacher-availability")
async def get_teacher_availability(
    student_id: int,
    start: date,
    end: date,
    db: Session = Depends(get_db)
):
    """Get teacher's available slots for rescheduling"""
    # Get student's batches and teachers
    enrollments = db.query(crud.Enrollment).filter(crud.Enrollment.student_id == student_id).all()
    
    if not enrollments:
        return {"teachers": [], "sessions": []}
    
    # Get all teachers from student's batches
    teacher_ids = set()
    for enrollment in enrollments:
        batch = db.query(crud.Batch).filter(crud.Batch.id == enrollment.batch_id).first()
        if batch:
            teacher_ids.add(batch.teacher_id)
            if batch.co_teacher_id:
                teacher_ids.add(batch.co_teacher_id)
    
    # Get all sessions for these teachers in the date range
    all_sessions = db.query(crud.ClassSession).join(crud.Batch).filter(
        crud.Batch.teacher_id.in_(teacher_ids),
        crud.ClassSession.date >= start,
        crud.ClassSession.date <= end
    ).all()
    
    # Get teacher details
    teachers = db.query(crud.Staff).filter(crud.Staff.id.in_(teacher_ids)).all()
    
    return {
        "teachers": teachers,
        "sessions": all_sessions
    }

@app.post("/student/reschedule-request")
async def create_reschedule_request(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """Create a reschedule request from student"""
    # In a production app, you'd store this in a RescheduleRequest table
    # For now, we'll just return success
    # You can extend this to send notifications to teachers
    return {
        "success": True,
        "message": "Reschedule request submitted successfully. Your teacher will be notified."
    }

@app.get("/student/{student_id}/available-slots")
async def get_available_slots(
    student_id: int,
    start: date,
    end: date,
    subject: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get available slots from the student's teacher(s) for rescheduling"""
    from sqlalchemy import func
    
    # Get student's batches and teachers
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    
    if not enrollments:
        return []
    
    # Get all teachers from student's batches
    teacher_ids = set()
    for enrollment in enrollments:
        batch = db.query(Batch).filter(Batch.id == enrollment.batch_id).first()
        if batch:
            teacher_ids.add(batch.teacher_id)
            if batch.co_teacher_id:
                teacher_ids.add(batch.co_teacher_id)
    
    # Get all sessions for these teachers in the date range
    sessions_query = db.query(
        ClassSession
    ).select_from(ClassSession).join(
        Batch, ClassSession.batch_id == Batch.id
    ).filter(
        Batch.teacher_id.in_(teacher_ids),
        ClassSession.date >= start,
        ClassSession.date <= end,
        ClassSession.status == "scheduled"
    ).all()
    
    # Filter by subject if specified
    if subject:
        sessions_query = [s for s in sessions_query if s.batch and s.batch.subject == subject]
    
    # Format response with availability
    available_slots = []
    for session in sessions_query:
        # Count enrollments for this specific batch
        enrolled_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.batch_id == session.batch_id
        ).scalar() or 0
        
        capacity = session.batch.capacity if session.batch else 10
        if enrolled_count < capacity:  # Only include sessions with available spots
            available_slots.append({
                "id": session.id,
                "date": session.date.isoformat(),
                "start_time": session.start_time,
                "end_time": session.end_time,
                "subject": session.batch.subject if session.batch else "",
                "teacher_name": session.batch.teacher.name if session.batch and session.batch.teacher else "",
                "enrolled": enrolled_count,
                "capacity": capacity,
                "batch_id": session.batch_id
            })
    
    return available_slots

@app.post("/student/{student_id}/reschedule")
async def reschedule_session(
    student_id: int,
    reschedule_data: dict,
    db: Session = Depends(get_db)
):
    """Reschedule a student from one session to another"""
    old_session_id = reschedule_data.get("old_session_id")
    new_session_id = reschedule_data.get("new_session_id")
    reason = reschedule_data.get("reason", "")
    
    # Get both sessions
    old_session = db.query(ClassSession).filter(ClassSession.id == old_session_id).first()
    new_session = db.query(ClassSession).filter(ClassSession.id == new_session_id).first()
    
    if not old_session or not new_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Remove from old session (cancel enrollment)
    old_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.batch_id == old_session.batch_id
    ).first()
    
    if old_enrollment:
        # Mark attendance as cancelled for the old session
        crud.mark_attendance(
            db, 
            AttendanceCreate(student_id=student_id, status="cancelled", notes=f"Rescheduled: {reason}"),
            old_session_id
        )
    
    # Enroll in new session
    crud.enroll_student_in_session(db, student_id, new_session_id, "single_session")
    
    return {
        "success": True,
        "message": "Session rescheduled successfully",
        "old_session": {
            "id": old_session.id,
            "date": old_session.date.isoformat(),
            "start_time": old_session.start_time
        },
        "new_session": {
            "id": new_session.id,
            "date": new_session.date.isoformat(),
            "start_time": new_session.start_time
        }
    }

@app.post("/student/{student_id}/sessions/{session_id}/cancel")
async def cancel_student_session(
    student_id: int,
    session_id: int,
    cancel_data: dict,
    db: Session = Depends(get_db)
):
    """Cancel a student's enrollment in a specific session"""
    reason = cancel_data.get("reason", "Cancelled by student")
    
    # Get the session
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Mark attendance as cancelled
    attendance = crud.mark_attendance(
        db,
        AttendanceCreate(student_id=student_id, status="cancelled", notes=reason),
        session_id
    )
    
    # Optionally, you could also remove the enrollment if it's a single session
    # For now, we just mark the attendance as cancelled
    
    return {
        "success": True,
        "message": "Session cancelled successfully",
        "session_id": session_id,
        "student_id": student_id
    }



# ==================== Student Progress Endpoints ====================

@app.get("/syllabus", response_model=List[SyllabusResponse])
async def get_syllabus(db: Session = Depends(get_db)):
    """Get all structured syllabus content"""
    return crud.get_syllabus(db)

@app.get("/students/{student_id}/progress")
async def get_student_progress_view(student_id: int, db: Session = Depends(get_db)):
    """Get a full view of student progress across one syllabus"""
    # Check if student exists
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Helper: does a syllabus have at least one content item?
    def _has_content(syl):
        if syl is None:
            return False
        return any(len(m.contents) > 0 for m in syl.modules)

    # Syllabus selection priority:
    # 1. Exact match (subject + grade) that has content
    # 2. Subject-only match that has content
    # 3. Any syllabus that has content
    # 4. Exact match even if empty (so teacher can see the structure)
    # 5. Any syllabus (last resort)
    subject = db.query(Subject).filter(Subject.name == student.desired_course).first()
    grade   = db.query(Grade).filter(Grade.name == student.current_grade).first()

    syllabus = None

    if subject and grade:
        syllabus = db.query(Syllabus).filter(
            Syllabus.subject_id == subject.id,
            Syllabus.grade_id == grade.id,
        ).first()
        if not _has_content(syllabus):
            syllabus = None  # try to find one with content

    if not syllabus and subject:
        for syl in db.query(Syllabus).filter(Syllabus.subject_id == subject.id).order_by(Syllabus.id).all():
            if _has_content(syl):
                syllabus = syl
                break

    if not syllabus:
        syllabus = (
            db.query(Syllabus)
            .join(Module, Module.syllabus_id == Syllabus.id)
            .join(Content, Content.module_id == Module.id)
            .first()
        )

    if not syllabus and subject and grade:
        # Accept an empty syllabus if it's the correct subject/grade
        syllabus = db.query(Syllabus).filter(
            Syllabus.subject_id == subject.id,
            Syllabus.grade_id == grade.id,
        ).first()

    if not syllabus:
        syllabus = db.query(Syllabus).first()

    def _student_dict(s):
        return {
            "id": s.id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "name": f"{s.first_name} {s.last_name}",
            "email": s.email,
            "primary_phone_number": s.primary_phone_number,
            "nearest_vama_center": s.nearest_vama_center,
            "instrument": s.desired_course,
            "desired_course": s.desired_course,
            "current_grade": s.current_grade,
            "grade": s.current_grade,
            "syllabus_type": s.syllabus_type,
            "is_exam_student": getattr(s, 'is_exam_student', False),
            "exam_date": s.exam_date,
        }

    if not syllabus:
        return {"student": _student_dict(student), "syllabus": None}

    # Get all progress for this student
    progress_records = db.query(StudentProgress).filter(StudentProgress.student_id == student_id).all()
    progress_map = {p.content_id: p for p in progress_records}
    
    # Manually structure the response to include progress in content
    # This avoids complex nested Pydantic configurations for now
    serialized_modules = []
    for m in syllabus.modules:
        serialized_contents = []
        for c in m.contents:
            prog = progress_map.get(c.id)
            serialized_contents.append({
                "id": c.id,
                "name": c.name,
                "content_type": c.content_type,
                "weight": c.weight,
                "order": c.order,
                "progress": {
                    "status": prog.status if prog else "not-yet",
                    "notes": prog.notes if prog else "",
                    "completed_at": prog.completed_at if prog else None
                }
            })
        serialized_modules.append({
            "id": m.id,
            "name": m.name,
            "weight": m.weight,
            "order": m.order,
            "contents": serialized_contents
        })
        
    return {
        "student": _student_dict(student),
        "syllabus": {
            "id": syllabus.id,
            "name": syllabus.name,
            "modules": serialized_modules
        }
    }

@app.post("/students/{student_id}/progress/{content_id}", response_model=StudentProgressResponse)
async def update_progress(
    student_id: int, 
    content_id: int, 
    progress: StudentProgressUpdate, 
    db: Session = Depends(get_db)
):
    """Update progress for a specific student and content item"""
    return crud.update_or_create_student_progress(db, student_id, content_id, progress)

@app.post("/setup-demo-syllabus")
async def setup_demo_syllabus(db: Session = Depends(get_db)):
    """Seed the database with a sample syllabus if none exists"""
    existing = db.query(Syllabus).first()
    if existing:
        return {"message": "Syllabus already exists", "id": existing.id}
        
    # Create Syllabus
    syllabus = Syllabus(name="Vama Music Excellence - Piano", description="Comprehensive Piano Syllabus")
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    
    # Create Modules
    m1 = Module(syllabus_id=syllabus.id, name="Songs & Pieces", weight=40, order=1)
    m2 = Module(syllabus_id=syllabus.id, name="Technical Exercises", weight=35, order=2)
    m3 = Module(syllabus_id=syllabus.id, name="Supporting Tests", weight=25, order=3)
    db.add_all([m1, m2, m3])
    db.commit()
    db.refresh(m1); db.refresh(m2); db.refresh(m3)
    
    # Create Content for m1
    c1 = Content(module_id=m1.id, name="Für Elise - Beethoven", content_type="song", weight=2, order=1)
    c2 = Content(module_id=m1.id, name="Minuet in G - Bach", content_type="song", weight=1, order=2)
    c3 = Content(module_id=m1.id, name="Clair de Lune", content_type="song", weight=3, order=3)
    
    # Create Content for m2
    c4 = Content(module_id=m2.id, name="C Major Scale", content_type="exercise", weight=1, order=1)
    c5 = Content(module_id=m2.id, name="Arpeggios - C, G, F", content_type="exercise", weight=2, order=2)
    
    # Create Content for m3
    c6 = Content(module_id=m3.id, name="Sight Reading Test", content_type="test", weight=2, order=1)
    c7 = Content(module_id=m3.id, name="Music Theory Quiz", content_type="test", weight=1, order=2)
    
    db.add_all([c1, c2, c3, c4, c5, c6, c7])
    db.commit()
    
    return {"message": "Demo syllabus created", "id": syllabus.id}








# Database initialization
@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
    # Incremental migrations for new columns (safe: silently skips if already exists)
    from sqlalchemy import text as sql_text
    with engine.connect() as conn:
        for ddl in [
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE",
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS notes TEXT",
        ]:
            try:
                conn.execute(sql_text(ddl))
                conn.commit()
            except Exception:
                pass  # Dialect may not support IF NOT EXISTS — ignore

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

@app.patch("/staff/{staff_id}/calendar")
async def set_staff_calendar(staff_id: int, enabled: bool, db: Session = Depends(get_db)):
    """Toggle whether this staff member appears in the schedule calendar teacher filter."""
    from models import Staff as StaffModel
    staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff.calendar = enabled
    db.commit()
    return {"id": staff_id, "calendar": staff.calendar}


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

@app.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a single student by ID"""
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@app.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: int, student: StudentUpdate, db: Session = Depends(get_db)):
    """Update a student"""
    updated_student = crud.update_student(db, student_id, student)
    if not updated_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return updated_student
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

@app.post("/enrollments")
async def enroll_student(enrollment: EnrollmentCreate, db: Session = Depends(get_db)):
    be = crud.enroll_student(db, enrollment)
    return {
        "id": be.id,
        "student_id": be.student_id,
        "batch_id": be.batch_id,
        "enrollment_type": "recurring",
        "enrolled_from": be.enrolled_from.isoformat(),
        "status": be.status,
        "message": "Student enrolled (recurring from batch start)",
    }

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

# ==================== ENHANCED CALENDAR ENDPOINTS ====================

@app.get("/calendar/filtered")
async def get_filtered_calendar_sessions(
    start: date,
    end: date,
    enrollment_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get sessions with enrollment count filtering"""
    results = crud.get_sessions_with_enrollment_count(db, start, end, enrollment_filter)

    # Format response
    sessions_data = []
    for session, enrollment_count in results:
        # Fetch enrolled students for this batch (up to 4 for card preview)
        session_students = crud.get_session_students(db, session.id)
        enrolled_students = [
            {"id": d["student"].id, "first_name": d["student"].first_name, "last_name": d["student"].last_name}
            for d in session_students[:4]
        ]

        session_dict = {
            "id": session.id,
            "batch_id": session.batch_id,
            "date": session.date.isoformat(),
            "start_time": session.start_time,
            "end_time": session.end_time,
            "status": session.status,
            "is_published": getattr(session, 'is_published', True),
            "notes": getattr(session, 'notes', None),
            "recurrence_id": session.recurrence_id,
            "enrollment_count": enrollment_count,
            "enrolled_students": enrolled_students,
            "capacity": session.batch.capacity if session.batch else 0,
            "batch": {
                "id": session.batch.id,
                "subject": session.batch.subject,
                "name": session.batch.name,
                "color_tag": session.batch.color_tag,
                "capacity": session.batch.capacity,
                "teacher_id": session.batch.teacher_id,
                "teacher": {
                    "id": session.batch.teacher.id,
                    "name": session.batch.teacher.name
                } if session.batch.teacher else None
            } if session.batch else None
        }
        sessions_data.append(session_dict)

    return sessions_data

@app.put("/sessions/{session_id}")
async def update_single_session(
    session_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Update a single session"""
    updated = crud.update_session(db, session_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session updated successfully", "session": updated}

@app.put("/sessions/{session_id}/update-future")
async def update_session_and_future(
    session_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Update this session and all future recurring sessions"""
    updated = crud.update_session_and_future(db, session_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Sessions updated successfully", "count": len(updated) if isinstance(updated, list) else 1}

@app.delete("/sessions/{session_id}")
async def delete_single_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a single session"""
    success = crud.delete_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

@app.delete("/sessions/{session_id}/delete-future")
async def delete_session_and_future_sessions(session_id: int, db: Session = Depends(get_db)):
    """Delete this session and all future recurring sessions"""
    success = crud.delete_session_and_future(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Sessions deleted successfully"}

@app.post("/sessions/{session_id}/archive")
async def archive_single_session(session_id: int, db: Session = Depends(get_db)):
    """Archive a session instead of deleting"""
    archived = crud.archive_session(db, session_id)
    if not archived:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session archived successfully", "session": archived}

@app.put("/sessions/{session_id}/cancel")
async def cancel_session(session_id: int, db: Session = Depends(get_db)):
    """Cancel a session (keeps attendance records, just marks status)"""
    session = crud.cancel_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session cancelled", "status": session.status}

@app.put("/sessions/{session_id}/publish")
async def toggle_publish(session_id: int, db: Session = Depends(get_db)):
    """Toggle is_published flag — unpublished sessions are hidden from students/teachers"""
    session = crud.toggle_publish_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Updated", "is_published": getattr(session, 'is_published', True)}

@app.get("/sessions/{session_id}/series")
async def get_session_series(session_id: int, db: Session = Depends(get_db)):
    """Get all sessions in the same recurrence series"""
    def safe(v):
        if v is None: return None
        if isinstance(v, str): return v
        return v.isoformat()
    series = crud.get_session_series(db, session_id)
    return [{
        "id": s.id,
        "date": safe(s.date),
        "start_time": s.start_time,
        "end_time": s.end_time,
        "status": s.status,
        "is_published": getattr(s, 'is_published', True),
        "recurrence_id": s.recurrence_id,
        "batch": {
            "id": s.batch.id,
            "name": s.batch.name,
            "subject": s.batch.subject,
            "capacity": s.batch.capacity,
            "days_of_week": s.batch.days_of_week,
            "teacher": {"name": s.batch.teacher.name} if s.batch.teacher else None,
        } if s.batch else None
    } for s in series]

@app.delete("/sessions/{session_id}/students/{student_id}")
async def remove_student_from_session(
    session_id: int,
    student_id: int,
    scope: str = "this_class",  # "this_class" | "all_future"
    db: Session = Depends(get_db),
):
    """Remove a student from a session.

    scope='this_class'  → removes only this session
    scope='all_future'  → removes from all future recurring sessions
    """
    success = crud.remove_student_from_session(db, session_id, student_id, scope)
    if not success:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return {"message": "Student removed"}

@app.post("/sessions/{session_id}/enroll")
async def enroll_student_in_class(
    session_id: int,
    student_id: int,
    enrollment_type: str = "single_session",  # or "recurring"
    db: Session = Depends(get_db)
):
    """Enroll a student in a session (single or recurring)"""
    enrollment = crud.enroll_student_in_session(db, student_id, session_id, enrollment_type)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Student enrolled successfully", "enrollment": enrollment}

@app.get("/sessions/{session_id}/students")
async def get_session_enrolled_students(session_id: int, db: Session = Depends(get_db)):
    """Get all students enrolled in a session with attendance"""
    try:
        students_data = crud.get_session_students(db, session_id)
        
        # Format response
        formatted_students = []
        for data in students_data:
            try:
                student = data["student"]
                enrollment = data["enrollment"]
                attendance = data["attendance"]
                
                enrollment_source = data.get("enrollment_source", "session")
                # Determine enrollment_type from the enrollment object
                if enrollment_source == "batch":
                    enroll_type = "recurring"
                else:
                    enroll_type = getattr(enrollment, 'enrollment_type', 'single_session') if enrollment else 'unknown'

                formatted_students.append({
                    "id": student.id,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "email": student.email if hasattr(student, 'email') else '',
                    "phone": getattr(student, 'primary_phone_number', None) or getattr(student, 'phone', ''),
                    "enrollment_type": enroll_type,
                    "enrollment_source": enrollment_source,
                    "attendance": {
                        "id": attendance.id,
                        "status": attendance.status,
                        "notes": attendance.notes,
                        "created_at": attendance.created_at.isoformat() if attendance.created_at else None
                    } if attendance else None
                })
            except Exception as e:
                print(f"Error formatting student data: {e}")
                print(f"Student data: {data}")
                continue
        
        return formatted_students
    except Exception as e:
        print(f"Error in get_session_enrolled_students: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching students: {str(e)}")

@app.delete("/batches/{batch_id}/students/{student_id}")
async def remove_student_from_batch(batch_id: int, student_id: int, db: Session = Depends(get_db)):
    """Remove a student from a batch by deleting their enrollment"""
    from models import Enrollment as EnrollmentModel
    enrollment = db.query(EnrollmentModel).filter(
        EnrollmentModel.batch_id == batch_id,
        EnrollmentModel.student_id == student_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return {"message": "Student removed from batch"}

@app.put("/batches/{batch_id}")
async def update_batch(
    batch_id: int,
    update_data: dict,
    regenerate: bool = True,
    db: Session = Depends(get_db)
):
    """Update batch fields. regenerate=true (default) drops and recreates all future sessions."""
    batch = crud.update_batch_and_regenerate(db, batch_id, update_data, regenerate=regenerate)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch updated successfully", "batch_id": batch.id}

@app.get("/batches/{batch_id}")
async def get_batch(batch_id: int, db: Session = Depends(get_db)):
    """Get full batch details"""
    from models import Batch as BatchModel
    batch = db.query(BatchModel).filter(BatchModel.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    def safe(v):
        if v is None: return None
        if isinstance(v, str): return v
        return v.isoformat()
    return {
        "id": batch.id,
        "subject": batch.subject,
        "name": batch.name,
        "capacity": batch.capacity,
        "color_tag": batch.color_tag,
        "is_recurring": batch.is_recurring,
        "days_of_week": json.loads(batch.days_of_week) if batch.days_of_week else [],
        "start_date": safe(batch.start_date),
        "end_date": safe(batch.end_date),
        "start_time": batch.start_time,
        "end_time": batch.end_time,
        "teacher_id": batch.teacher_id,
        "co_teacher_id": batch.co_teacher_id,
        "teacher": {"id": batch.teacher.id, "name": batch.teacher.name} if batch.teacher else None,
    }

@app.put("/batches/{batch_id}/color")
async def update_batch_color_tag(
    batch_id: int,
    color_tag: str,
    db: Session = Depends(get_db)
):
    """Update the color tag of a batch"""
    updated = crud.update_batch_color(db, batch_id, color_tag)
    if not updated:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch color updated successfully", "batch": updated}

@app.put("/sessions/{session_id}/attendance/{student_id}")
async def update_student_attendance(
    session_id: int,
    student_id: int,
    status: str,
    notes: Optional[str] = None,
    require_feedback: bool = False,
    db: Session = Depends(get_db)
):
    """Update or create attendance. Pass require_feedback=true (teacher portal) to enforce notes."""
    if require_feedback and status in ("present", "absent") and not (notes and notes.strip()):
        raise HTTPException(status_code=422, detail="Feedback is required before marking attendance.")
    attendance_data = AttendanceCreate(student_id=student_id, status=status, notes=notes)
    attendance = crud.mark_attendance(db, attendance_data, session_id)
    return {"message": "Attendance updated", "attendance": {
        "id": attendance.id,
        "status": attendance.status,
        "notes": attendance.notes,
        "session_id": attendance.session_id,
        "student_id": attendance.student_id,
    }}


# ─── Batch Teachers ───────────────────────────────────────────────────────────

@app.get("/batches/{batch_id}/teachers")
async def get_batch_teachers(batch_id: int, db: Session = Depends(get_db)):
    """Get all co-teachers for a batch"""
    teachers = crud.get_batch_teachers(db, batch_id)
    return [
        {
            "id": bt.id,
            "staff_id": bt.staff_id,
            "batch_id": bt.batch_id,
            "name": bt.staff.name if bt.staff else None,
            "email": bt.staff.email if bt.staff else None,
        }
        for bt in teachers
    ]

@app.post("/batches/{batch_id}/teachers")
async def add_batch_teacher(batch_id: int, staff_id: int, db: Session = Depends(get_db)):
    """Add a co-teacher to a batch"""
    bt = crud.add_batch_teacher(db, batch_id, staff_id)
    return {"message": "Teacher added", "id": bt.id, "staff_id": bt.staff_id}

@app.delete("/batches/{batch_id}/teachers/{staff_id}")
async def remove_batch_teacher(batch_id: int, staff_id: int, db: Session = Depends(get_db)):
    """Remove a co-teacher from a batch"""
    success = crud.remove_batch_teacher(db, batch_id, staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Teacher not found in batch")
    return {"message": "Teacher removed"}

