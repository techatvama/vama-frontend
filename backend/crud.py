from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, timedelta
import json
from models import Staff, Student, Batch, ClassSession, Enrollment, Attendance, Syllabus, Module, Content, StudentProgress, Material, BatchEnrollment, BatchTeacher
from schemas import (
    StaffCreate, StudentCreate, StudentUpdate, BatchCreate, ClassSessionCreate, 
    EnrollmentCreate, AttendanceCreate, StudentProgressCreate, StudentProgressUpdate,
    MaterialCreate
)
import bcrypt

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt"""
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

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
        takes_classes=staff.takesClasses if staff.takesClasses is not None else True,
        password_hash=get_password_hash(staff.password) if staff.password else None
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
    staff_data = staff.dict(exclude_unset=True)
    for key, value in staff_data.items():
        if key == "firstName":
            db_staff.first_name = value
        elif key == "lastName":
            db_staff.last_name = value
        elif key == "takesClasses":
            db_staff.takes_classes = value
        elif key == "password" and value:
            db_staff.password_hash = get_password_hash(value)
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
        referrer=student.referrer,
        current_grade=student.current_grade,
        syllabus_type=student.syllabus_type,
        is_exam_student=student.is_exam_student,
        password_hash=get_password_hash(student.password) if student.password else None
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
        if key == "password" and value:
            db_student.password_hash = get_password_hash(value)
        elif hasattr(db_student, key):
            setattr(db_student, key, value)
            
    db.commit()
    db.refresh(db_student)
    return db_student

def authenticate_student(db: Session, email: str, password: str) -> Optional[Student]:
    """Authenticate a student"""
    db_student = get_student_by_email(db, email)
    if not db_student:
        return None
    if verify_password(password, db_student.password_hash):
        return db_student
    return None


# Scheduling CRUD Operations

def create_batch(db: Session, batch: BatchCreate) -> Batch:
    """Create a new batch and generate sessions"""
    import uuid
    # Convert list of days to JSON string if needed, or handle validation
    days_json = json.dumps(batch.days_of_week) if batch.days_of_week else None
    
    db_batch = Batch(
        subject=batch.subject,
        name=batch.name,
        capacity=batch.capacity,
        color_tag=batch.color_tag,
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
    recurrence_id = str(uuid.uuid4()) if batch.is_recurring else None
    
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
                    status="scheduled",
                    recurrence_id=recurrence_id
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
            status="scheduled",
            recurrence_id=None
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

def compute_enrollment_counts(db: Session, sessions) -> dict:
    """Return {session_id: count} for a list of ClassSession objects.

    Uses 2 bulk queries (not N+1), merges BatchEnrollment + session-specific Enrollment.
    """
    from collections import defaultdict

    if not sessions:
        return {}

    batch_ids = list({s.batch_id for s in sessions})

    be_rows = db.query(
        BatchEnrollment.batch_id, BatchEnrollment.student_id, BatchEnrollment.enrolled_from
    ).filter(
        BatchEnrollment.batch_id.in_(batch_ids),
        BatchEnrollment.status == "active",
    ).all()

    ss_rows = db.query(
        Enrollment.batch_id, Enrollment.student_id, Enrollment.session_ids
    ).filter(
        Enrollment.batch_id.in_(batch_ids),
        Enrollment.session_ids.isnot(None),
    ).all()

    be_map = defaultdict(list)
    for batch_id, student_id, enrolled_from in be_rows:
        be_map[batch_id].append((student_id, enrolled_from))

    ss_map = defaultdict(set)
    for batch_id, student_id, sids_json in ss_rows:
        try:
            allowed = json.loads(sids_json)
        except (ValueError, TypeError):
            continue
        for sid in allowed:
            ss_map[sid].add(student_id)

    counts = {}
    for s in sessions:
        recurring = {
            student_id
            for student_id, enrolled_from in be_map.get(s.batch_id, [])
            if enrolled_from <= s.date
        }
        specific = ss_map.get(s.id, set()) - recurring
        counts[s.id] = len(recurring) + len(specific)

    return counts


def get_teacher_sessions(db: Session, teacher_id: int, start_date: date, end_date: date) -> List[ClassSession]:
    """Get sessions for a specific teacher"""
    return db.query(ClassSession).join(Batch).filter(
        (Batch.teacher_id == teacher_id) | (Batch.co_teacher_id == teacher_id) | (ClassSession.teacher_id == teacher_id),
        ClassSession.date >= start_date,
        ClassSession.date <= end_date
    ).all()

def get_student_sessions(db: Session, student_id: int, start_date: date, end_date: date) -> List[ClassSession]:
    """Get sessions for a specific student through enrollments"""
    from sqlalchemy.orm import joinedload
    return db.query(ClassSession).options(
        joinedload(ClassSession.batch).joinedload(Batch.teacher)
    ).join(Batch).join(Enrollment).filter(
        Enrollment.student_id == student_id,
        ClassSession.date >= start_date,
        ClassSession.date <= end_date
    ).distinct().order_by(ClassSession.date, ClassSession.start_time).all()

def get_teacher_students(db: Session, teacher_id: int) -> List[Student]:
    """Get all students assigned to a teacher through batches"""
    return db.query(Student).join(Enrollment).join(Batch).filter(
        (Batch.teacher_id == teacher_id) | (Batch.co_teacher_id == teacher_id)
    ).distinct().all()

def enroll_student(db: Session, enrollment: EnrollmentCreate):
    """Enroll a student in a batch (batch-level / recurring from batch start).

    Creates a BatchEnrollment so the student appears in all sessions from the
    batch start date, instead of the old NULL-session_ids Enrollment row that
    leaked into every session.
    """
    from models import Batch as BatchModel
    batch = db.query(BatchModel).filter(BatchModel.id == enrollment.batch_id).first()
    enrolled_from = batch.start_date if batch else __import__('datetime').date.today()

    existing = db.query(BatchEnrollment).filter(
        BatchEnrollment.student_id == enrollment.student_id,
        BatchEnrollment.batch_id == enrollment.batch_id,
    ).first()
    if existing:
        existing.status = "active"
        if enrolled_from < existing.enrolled_from:
            existing.enrolled_from = enrolled_from
        db.commit()
        db.refresh(existing)
        return existing

    be = BatchEnrollment(
        student_id=enrollment.student_id,
        batch_id=enrollment.batch_id,
        enrolled_from=enrolled_from,
        status="active",
    )
    db.add(be)
    db.commit()
    db.refresh(be)
    return be

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



def get_student_by_id(db: Session, student_id: int) -> Optional[Student]:
    """Get student by ID"""
    return db.query(Student).filter(Student.id == student_id).first()

# Progress CRUD Operations
def get_syllabus(db: Session) -> List[Syllabus]:
    """Fetch all syllabus records with modules and content"""
    return db.query(Syllabus).options(joinedload(Syllabus.modules).joinedload(Module.contents)).all()

def get_student_progress(db: Session, student_id: int) -> List[StudentProgress]:
    """Fetch all progress records for a student"""
    return db.query(StudentProgress).filter(StudentProgress.student_id == student_id).all()

def update_or_create_student_progress(
    db: Session, 
    student_id: int, 
    content_id: int, 
    progress_data: StudentProgressUpdate
) -> StudentProgress:
    """Update existing progress or create a new one"""
    db_progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id,
        StudentProgress.content_id == content_id
    ).first()

    if db_progress:
        for key, value in progress_data.dict(exclude_unset=True).items():
            setattr(db_progress, key, value)
    else:
        db_progress = StudentProgress(
            student_id=student_id,
            content_id=content_id,
            **progress_data.dict(exclude_unset=True)
        )
        db.add(db_progress)
    
    db.commit()
    db.refresh(db_progress)
    return db_progress

def get_full_student_progress_view(db: Session, student_id: int):
    """
    Returns a structured view of the syllabus with student progress nested.
    Currently assumes only one default syllabus.
    """
    syllabus = db.query(Syllabus).first() # Get the first one for now
    if not syllabus:
        return None
        
    # Get all progress for this student
    progress_map = {p.content_id: p for p in get_student_progress(db, student_id)}
    
    # We'll return the syllabus object but its contents will be enriched
    return syllabus, progress_map

# Material CRUD Operations
def create_material(db: Session, material: MaterialCreate) -> Material:
    db_material = Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

def get_teacher_materials(db: Session, teacher_id: int) -> List[Material]:
    return db.query(Material).filter(Material.teacher_id == teacher_id).all()

def get_student_materials(db: Session, student_id: int) -> List[Material]:
    return db.query(Material).filter((Material.student_id == student_id) | (Material.student_id == None)).all()

# ==================== ENHANCED CALENDAR FEATURES ====================

def get_sessions_with_enrollment_count(db: Session, start_date: date, end_date: date, enrollment_filter: Optional[str] = None):
    """Get sessions with per-session enrollment count from both enrollment sources.

    Uses 3 bulk queries (not N+1):
      1. Fetch sessions in date range
      2. Fetch all active BatchEnrollments for those batches
      3. Fetch all session-specific Enrollments (session_ids IS NOT NULL)
    Then combines in Python to get accurate per-session counts.
    """
    from collections import defaultdict

    sessions = db.query(ClassSession).filter(
        ClassSession.date >= start_date,
        ClassSession.date <= end_date,
    ).all()

    if not sessions:
        return []

    batch_ids = list({s.batch_id for s in sessions})

    # Recurring enrollments (batch_enrollments)
    be_rows = db.query(
        BatchEnrollment.batch_id,
        BatchEnrollment.student_id,
        BatchEnrollment.enrolled_from,
    ).filter(
        BatchEnrollment.batch_id.in_(batch_ids),
        BatchEnrollment.status == "active",
    ).all()

    # Session-specific enrollments
    ss_rows = db.query(
        Enrollment.batch_id,
        Enrollment.student_id,
        Enrollment.session_ids,
    ).filter(
        Enrollment.batch_id.in_(batch_ids),
        Enrollment.session_ids.isnot(None),
    ).all()

    # be_map: batch_id → [(student_id, enrolled_from)]
    be_map = defaultdict(list)
    for batch_id, student_id, enrolled_from in be_rows:
        be_map[batch_id].append((student_id, enrolled_from))

    # ss_map: session_id → set of student_ids from single-session enrollments
    ss_map = defaultdict(set)
    for batch_id, student_id, sids_json in ss_rows:
        try:
            allowed = json.loads(sids_json)
        except (ValueError, TypeError):
            continue
        for sid in allowed:
            ss_map[sid].add(student_id)

    results = []
    for session in sessions:
        recurring = {
            student_id
            for student_id, enrolled_from in be_map.get(session.batch_id, [])
            if enrolled_from <= session.date
        }
        specific = ss_map.get(session.id, set()) - recurring
        count = len(recurring) + len(specific)
        results.append((session, count))

    if enrollment_filter:
        filtered = []
        for session, count in results:
            capacity = session.batch.capacity if session.batch else 10
            if enrollment_filter == "0" and count == 0:
                filtered.append((session, count))
            elif enrollment_filter == "1" and count == 1:
                filtered.append((session, count))
            elif enrollment_filter == "2" and count == 2:
                filtered.append((session, count))
            elif enrollment_filter == "3" and count == 3:
                filtered.append((session, count))
            elif enrollment_filter == "fully_booked" and count >= capacity:
                filtered.append((session, count))
        return filtered

    return results

def update_session(db: Session, session_id: int, update_data: dict):
    """Update a single session"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return None
    
    for key, value in update_data.items():
        if hasattr(session, key):
            setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    return session

def update_session_and_future(db: Session, session_id: int, update_data: dict):
    """Update a session and all future sessions in the same recurrence"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session or not session.recurrence_id:
        return update_session(db, session_id, update_data)
    
    # Get all future sessions in the same recurrence
    future_sessions = db.query(ClassSession).filter(
        ClassSession.recurrence_id == session.recurrence_id,
        ClassSession.date >= session.date
    ).all()
    
    for s in future_sessions:
        for key, value in update_data.items():
            if hasattr(s, key):
                setattr(s, key, value)
    
    db.commit()
    return future_sessions

def delete_session(db: Session, session_id: int):
    """Delete a single session"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
        return True
    return False

def delete_session_and_future(db: Session, session_id: int):
    """Delete a session and all future sessions in the same recurrence"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return False
    
    if not session.recurrence_id:
        return delete_session(db, session_id)
    
    # Delete all future sessions in the same recurrence
    db.query(ClassSession).filter(
        ClassSession.recurrence_id == session.recurrence_id,
        ClassSession.date >= session.date
    ).delete()
    
    db.commit()
    return True

def archive_session(db: Session, session_id: int):
    """Archive a session by setting status to 'archived'"""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if session:
        session.status = "archived"
        db.commit()
        db.refresh(session)
        return session
    return None

def enroll_student_in_session(db: Session, student_id: int, session_id: int, enrollment_type: str = "single_session"):
    """Enroll a student in a session.

    enrollment_type='recurring'      → creates/updates a BatchEnrollment (all future sessions from session.date)
    enrollment_type='single_session' → creates/updates an Enrollment with session_ids allowlist
    """
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return None

    if enrollment_type == "recurring":
        # Use batch_enrollments table for recurring
        existing_be = db.query(BatchEnrollment).filter(
            BatchEnrollment.student_id == student_id,
            BatchEnrollment.batch_id == session.batch_id,
        ).first()
        if existing_be:
            # Re-activate and update enrolled_from if earlier
            existing_be.status = "active"
            if session.date < existing_be.enrolled_from:
                existing_be.enrolled_from = session.date
            db.commit()
            db.refresh(existing_be)
            return existing_be
        be = BatchEnrollment(
            student_id=student_id,
            batch_id=session.batch_id,
            enrolled_from=session.date,
            status="active",
        )
        db.add(be)
        db.commit()
        db.refresh(be)
        return be
    else:
        # single_session: use Enrollment with session_ids allowlist
        existing = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.batch_id == session.batch_id,
        ).first()
        if existing:
            ids = json.loads(existing.session_ids) if existing.session_ids else []
            if session_id not in ids:
                ids.append(session_id)
            existing.session_ids = json.dumps(ids)
            db.commit()
            db.refresh(existing)
            return existing
        enrollment = Enrollment(
            student_id=student_id,
            batch_id=session.batch_id,
            enrollment_type="single_session",
            session_ids=json.dumps([session_id]),
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment


def get_session_students(db: Session, session_id: int):
    """Get all students enrolled in a session with their attendance.

    Merges two enrollment sources:
    1. batch_enrollments (recurring): rows where enrolled_from <= session.date, status='active'
    2. enrollments (single_session): rows whose session_ids JSON array contains session_id

    Students that appear in batch_enrollments take precedence (enrollment_type='recurring').
    """
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return []

    seen_student_ids = set()
    students_data = []

    # 1. Batch-enrolled (recurring) students
    batch_enrolls = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == session.batch_id,
        BatchEnrollment.enrolled_from <= session.date,
        BatchEnrollment.status == "active",
    ).all()

    for be in batch_enrolls:
        student = be.student
        seen_student_ids.add(student.id)
        attendance = db.query(Attendance).filter(
            Attendance.session_id == session_id,
            Attendance.student_id == student.id,
        ).first()
        students_data.append({
            "student": student,
            "enrollment": be,
            "enrollment_source": "batch",
            "attendance": attendance,
        })

    # 2. Session-specific enrollments (session_ids IS NOT NULL only)
    enrollments = db.query(Enrollment).filter(
        Enrollment.batch_id == session.batch_id,
        Enrollment.session_ids.isnot(None),
    ).all()

    for enrollment in enrollments:
        if enrollment.student_id in seen_student_ids:
            continue  # already covered by batch_enrollment
        try:
            allowed = json.loads(enrollment.session_ids)
        except (ValueError, TypeError):
            continue
        if session_id not in allowed:
            continue
        student = enrollment.student
        attendance = db.query(Attendance).filter(
            Attendance.session_id == session_id,
            Attendance.student_id == student.id,
        ).first()
        students_data.append({
            "student": student,
            "enrollment": enrollment,
            "enrollment_source": "session",
            "attendance": attendance,
        })

    return students_data

def cancel_session(db: Session, session_id: int):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if session:
        session.status = "cancelled"
        db.commit()
        db.refresh(session)
        return session
    return None

def toggle_publish_session(db: Session, session_id: int):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if session:
        current = getattr(session, 'is_published', True)
        session.is_published = not current
        db.commit()
        db.refresh(session)
        return session
    return None

def get_session_series(db: Session, session_id: int):
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return []
    if not session.recurrence_id:
        return [session]
    return db.query(ClassSession).filter(
        ClassSession.recurrence_id == session.recurrence_id
    ).order_by(ClassSession.date).all()

def remove_student_from_session(db: Session, session_id: int, student_id: int, scope: str = "this_class"):
    """Remove a student from a session.

    scope='this_class'   → remove only from this session
    scope='all_future'   → remove from all future recurring sessions
    """
    from datetime import timedelta

    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        return False

    removed = False

    # ── Handle BatchEnrollment (new recurring system) ──────────────────────
    be = db.query(BatchEnrollment).filter(
        BatchEnrollment.batch_id == session.batch_id,
        BatchEnrollment.student_id == student_id,
        BatchEnrollment.status == "active",
    ).first()
    if be:
        if scope == "all_future":
            db.delete(be)
        else:
            # Push enrolled_from past this session so it no longer covers it
            new_from = session.date + timedelta(days=1)
            batch_end = be.batch.end_date if (be.batch and be.batch.end_date) else None
            if batch_end and new_from > batch_end:
                db.delete(be)
            else:
                be.enrolled_from = new_from
        removed = True

    # ── Handle Enrollment table (single_session OR old-style recurring) ────
    enrollment = db.query(Enrollment).filter(
        Enrollment.batch_id == session.batch_id,
        Enrollment.student_id == student_id,
    ).first()
    if enrollment:
        if enrollment.session_ids is None:
            # Old-style recurring (NULL session_ids = covers all sessions)
            if scope == "all_future":
                db.delete(enrollment)
            # For this_class: leave enrollment intact, just remove attendance below
            removed = True
        else:
            ids = json.loads(enrollment.session_ids)
            if session_id in ids:
                ids.remove(session_id)
                if ids:
                    enrollment.session_ids = json.dumps(ids)
                else:
                    db.delete(enrollment)
                removed = True
            elif scope == "all_future":
                db.delete(enrollment)
                removed = True

    # ── Remove attendance record for this session ──────────────────────────
    att = db.query(Attendance).filter(
        Attendance.session_id == session_id,
        Attendance.student_id == student_id,
    ).first()
    if att:
        db.delete(att)

    db.commit()
    return removed

def update_batch_and_regenerate(db: Session, batch_id: int, update_data: dict, regenerate: bool = True):
    """Update batch fields and optionally regenerate all future sessions."""
    import uuid as _uuid
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return None

    # Apply batch-level field updates
    for key, value in update_data.items():
        if key == 'days_of_week' and isinstance(value, list):
            batch.days_of_week = json.dumps(value)
        elif key in ('teacher_id', 'co_teacher_id', 'capacity'):
            setattr(batch, key, int(value) if value else None)
        elif hasattr(batch, key) and key not in ('id', 'created_at', 'sessions', 'enrollments'):
            setattr(batch, key, value)

    db.commit()
    db.refresh(batch)

    if not regenerate:
        return batch

    # Preserve recurrence_id from existing future sessions (or create a new one)
    today = date.today()
    existing = db.query(ClassSession).filter(
        ClassSession.batch_id == batch_id,
        ClassSession.date >= today
    ).first()
    recurrence_id = existing.recurrence_id if (existing and existing.recurrence_id) else str(_uuid.uuid4())

    # Delete all future sessions
    db.query(ClassSession).filter(
        ClassSession.batch_id == batch_id,
        ClassSession.date >= today
    ).delete()
    db.commit()

    # Determine end_date
    raw_end = update_data.get('end_date', batch.end_date)
    if isinstance(raw_end, str):
        raw_end = date.fromisoformat(raw_end) if raw_end else None

    raw_start = update_data.get('start_date', batch.start_date)
    if isinstance(raw_start, str):
        raw_start = date.fromisoformat(raw_start) if raw_start else None
    gen_start = max(today, raw_start) if raw_start else today

    new_sessions = []
    is_recurring = update_data.get('is_recurring', batch.is_recurring)

    if is_recurring and batch.days_of_week and raw_end:
        days_list = json.loads(batch.days_of_week) if isinstance(batch.days_of_week, str) else batch.days_of_week
        weekdays_map = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
        target_days = {weekdays_map[d] for d in days_list if d in weekdays_map}
        current = gen_start
        while current <= raw_end:
            if current.weekday() in target_days:
                new_sessions.append(ClassSession(
                    batch_id=batch_id,
                    date=current,
                    start_time=batch.start_time,
                    end_time=batch.end_time,
                    teacher_id=batch.teacher_id,
                    status="scheduled",
                    recurrence_id=recurrence_id,
                    is_published=True,
                ))
            current += timedelta(days=1)
    else:
        # Non-recurring: create one session on start_date (or today if past)
        session_date = max(today, raw_start) if raw_start else today
        new_sessions.append(ClassSession(
            batch_id=batch_id,
            date=session_date,
            start_time=batch.start_time,
            end_time=batch.end_time,
            teacher_id=batch.teacher_id,
            status="scheduled",
            recurrence_id=None,
            is_published=True,
        ))

    if new_sessions:
        db.add_all(new_sessions)
        db.commit()

    return batch

def update_batch_color(db: Session, batch_id: int, color_tag: str):
    """Update the color tag of a batch"""
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if batch:
        batch.color_tag = color_tag
        db.commit()
        db.refresh(batch)
        return batch
    return None


# Payment CRUD Operations
def create_payment(db: Session, payment_data: dict, created_by_id: Optional[int] = None):
    """Create a new payment/invoice"""
    from models import Payment
    from datetime import datetime
    
    db_payment = Payment(
        student_id=payment_data['student_id'],
        amount=payment_data['amount'],
        payment_type=payment_data.get('payment_type', 'Monthly Tuition'),
        description=payment_data.get('description'),
        due_date=payment_data['due_date'],
        status=payment_data.get('status', 'pending'),
        payment_method=payment_data.get('payment_method'),
        transaction_id=payment_data.get('transaction_id'),
        created_by=created_by_id
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_all_payments(db: Session, skip: int = 0, limit: int = 1000):
    """Get all payments with student information"""
    from models import Payment
    return db.query(Payment).options(joinedload(Payment.student)).order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

def get_payment_by_id(db: Session, payment_id: int):
    """Get a specific payment by ID"""
    from models import Payment
    return db.query(Payment).options(joinedload(Payment.student)).filter(Payment.id == payment_id).first()

def get_student_payments(db: Session, student_id: int):
    """Get all payments for a specific student"""
    from models import Payment
    return db.query(Payment).filter(Payment.student_id == student_id).order_by(Payment.due_date.desc()).all()

def update_payment(db: Session, payment_id: int, payment_data: dict):
    """Update a payment"""
    from models import Payment
    from datetime import datetime
    
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        return None
    
    for key, value in payment_data.items():
        if hasattr(db_payment, key) and value is not None:
            setattr(db_payment, key, value)
    
    # If status is changed to 'paid', set paid_date
    if payment_data.get('status') == 'paid' and not db_payment.paid_date:
        db_payment.paid_date = datetime.now()
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

def delete_payment(db: Session, payment_id: int):
    """Delete a payment"""
    from models import Payment
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if db_payment:
        db.delete(db_payment)
        db.commit()
        return True
    return False

def get_payments_by_status(db: Session, status: str):
    """Get all payments with a specific status"""
    from models import Payment
    return db.query(Payment).options(joinedload(Payment.student)).filter(Payment.status == status).order_by(Payment.due_date).all()

def get_overdue_payments(db: Session):
    """Get all overdue payments (due date passed and status not paid)"""
    from models import Payment
    from datetime import datetime
    
    today = datetime.now().date()
    return db.query(Payment).options(joinedload(Payment.student)).filter(
        Payment.status.in_(['pending', 'overdue']),
        Payment.due_date < today
    ).order_by(Payment.due_date).all()

def mark_payment_as_paid(db: Session, payment_id: int, payment_method: Optional[str] = None, transaction_id: Optional[str] = None):
    """Mark a payment as paid"""
    from models import Payment
    from datetime import datetime
    
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        return None
    
    db_payment.status = 'paid'
    db_payment.paid_date = datetime.now()
    if payment_method:
        db_payment.payment_method = payment_method
    if transaction_id:
        db_payment.transaction_id = transaction_id

    db.commit()
    db.refresh(db_payment)
    return db_payment


# BatchTeacher CRUD
def get_batch_teachers(db: Session, batch_id: int):
    return db.query(BatchTeacher).filter(BatchTeacher.batch_id == batch_id).all()

def add_batch_teacher(db: Session, batch_id: int, staff_id: int):
    existing = db.query(BatchTeacher).filter(
        BatchTeacher.batch_id == batch_id,
        BatchTeacher.staff_id == staff_id,
    ).first()
    if existing:
        return existing
    bt = BatchTeacher(batch_id=batch_id, staff_id=staff_id)
    db.add(bt)
    db.commit()
    db.refresh(bt)
    return bt

def remove_batch_teacher(db: Session, batch_id: int, staff_id: int):
    bt = db.query(BatchTeacher).filter(
        BatchTeacher.batch_id == batch_id,
        BatchTeacher.staff_id == staff_id,
    ).first()
    if not bt:
        return False
    db.delete(bt)
    db.commit()
    return True

