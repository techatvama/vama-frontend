from sqlalchemy.orm import Session
from models import Staff, Student
from schemas import StaffCreate, StudentCreate, StudentUpdate
from typing import List, Optional
from datetime import date, timedelta
import json
from models import Staff, Student, Batch, ClassSession, Enrollment, Attendance
from schemas import StaffCreate, StudentCreate, StudentUpdate, BatchCreate, ClassSessionCreate, EnrollmentCreate, AttendanceCreate

# Staff CRUD Operations
def get_all_staff(db: Session) -> List[Staff]:
    """Fetch all staff members"""
    return db.query(Staff).order_by(Staff.created_at.desc()).all()

def get_staff_by_email(db: Session, email: str) -> Optional[Staff]:
    """Get staff member by email"""
    return db.query(Staff).filter(Staff.email == email).first()

def create_staff(db: Session, staff: StaffCreate) -> Staff:
    """Create a new staff member"""
    db_staff = Staff(
        name=staff.name,
        first_name=staff.firstName,
        last_name=staff.lastName,
        role=staff.role,
        phone=staff.phone,
        email=staff.email,
        calendar=staff.calendar,
        takes_classes=staff.takesClasses if staff.takesClasses is not None else True
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

def update_staff(db: Session, staff_id: int, staff: StaffCreate) -> Optional[Staff]:
    """Update a staff member"""
    db_staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not db_staff:
        return None
    
    # Update fields
    for key, value in staff.dict(exclude_unset=True).items():
        if key == "firstName":
            db_staff.first_name = value
        elif key == "lastName":
            db_staff.last_name = value
        elif key == "takesClasses":
            db_staff.takes_classes = value
        elif hasattr(db_staff, key):
             setattr(db_staff, key, value)
    
    db.commit()
    db.refresh(db_staff)
    return db_staff


# Student CRUD Operations
def get_all_students(db: Session) -> List[Student]:
    """Fetch all students"""
    return db.query(Student).order_by(Student.created_at.desc()).all()

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Get student by email"""
    return db.query(Student).filter(Student.email == email).first()

def create_student(db: Session, student: StudentCreate) -> Student:
    """Create a new student"""
    db_student = Student(
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email,
        primary_phone_number=student.primary_phone_number,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        address=student.address,
        city=student.city,
        state=student.state,
        state_code=student.state_code,
        desired_course=student.desired_course,
        class_frequency=student.class_frequency,
        nearest_vama_center=student.nearest_vama_center,
        preferred_mode_of_contact=student.preferred_mode_of_contact,
        parent_name=student.parent_name,
        emergency_contact=student.emergency_contact,
        blood_group=student.blood_group,
        allergies=student.allergies,
        referrer=student.referrer
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: StudentUpdate) -> Optional[Student]:
    """Update a student"""
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        return None
    
    # Update fields
    student_data = student.dict(exclude_unset=True)
    for key, value in student_data.items():
        if hasattr(db_student, key):
            setattr(db_student, key, value)
            
    db.commit()
    db.refresh(db_student)
    return db_student


# Scheduling CRUD Operations

def create_batch(db: Session, batch: BatchCreate) -> Batch:
    """Create a new batch and generate sessions"""
    # Convert list of days to JSON string if needed, or handle validation
    days_json = json.dumps(batch.days_of_week) if batch.days_of_week else None
    
    db_batch = Batch(
        subject=batch.subject,
        name=batch.name,
        capacity=batch.capacity,
        is_recurring=batch.is_recurring,
        days_of_week=days_json,
        start_date=batch.start_date,
        end_date=batch.end_date,
        start_time=batch.start_time,
        end_time=batch.end_time,
        teacher_id=batch.teacher_id,
        co_teacher_id=batch.co_teacher_id
    )
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    
    # Generate Sessions
    sessions = []
    if batch.is_recurring and batch.days_of_week and batch.end_date:
        weekdays_map = {
            "Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6
        }
        target_days = [weekdays_map[d] for d in batch.days_of_week if d in weekdays_map]
        
        current_date = batch.start_date
        while current_date <= batch.end_date:
            if current_date.weekday() in target_days:
                sessions.append(ClassSession(
                    batch_id=db_batch.id,
                    date=current_date,
                    start_time=batch.start_time,
                    end_time=batch.end_time,
                    teacher_id=batch.teacher_id,
                    status="scheduled"
                ))
            current_date += timedelta(days=1)
    else:
        # Single session or no recurrence specified properly
        sessions.append(ClassSession(
            batch_id=db_batch.id,
            date=batch.start_date,
            start_time=batch.start_time,
            end_time=batch.end_time,
            teacher_id=batch.teacher_id,
            status="scheduled"
        ))
        
    if sessions:
        db.add_all(sessions)
        db.commit()
        
    return db_batch

def get_batches(db: Session) -> List[Batch]:
    return db.query(Batch).all()

def get_sessions(db: Session, start_date: date, end_date: date) -> List[ClassSession]:
    return db.query(ClassSession).filter(
        ClassSession.date >= start_date,
        ClassSession.date <= end_date
    ).all()

def enroll_student(db: Session, enrollment: EnrollmentCreate) -> Enrollment:
    db_enrollment = Enrollment(
        student_id=enrollment.student_id,
        batch_id=enrollment.batch_id,
        enrollment_type=enrollment.enrollment_type
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

def mark_attendance(db: Session, attendance: AttendanceCreate, session_id: int) -> Attendance:
    # Check if exists
    existing = db.query(Attendance).filter(
        Attendance.session_id == session_id, 
        Attendance.student_id == attendance.student_id
    ).first()
    
    if existing:
        existing.status = attendance.status
        existing.notes = attendance.notes
        db.commit()
        db.refresh(existing)
        return existing
    
    db_attendance = Attendance(
        session_id=session_id,
        student_id=attendance.student_id,
        status=attendance.status,
        notes=attendance.notes
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_session_details(db: Session, session_id: int) -> Optional[ClassSession]:
    return db.query(ClassSession).filter(ClassSession.id == session_id).first()


