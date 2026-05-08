from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Enum, Text, Float
from sqlalchemy.orm import relationship
import enum
from sqlalchemy.sql import func
from database import Base

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    role = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True) # For teacher login
    calendar = Column(Boolean, default=True)
    takes_classes = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subject_assignments = relationship("TeacherSubjectAssignment", back_populates="teacher", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    primary_phone_number = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    state_code = Column(String, nullable=True)
    desired_course = Column(String, nullable=True)
    class_frequency = Column(String, nullable=True)
    nearest_vama_center = Column(String, nullable=True)
    preferred_mode_of_contact = Column(String, nullable=True)
    parent_name = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    referrer = Column(String, nullable=True)
    
    # New Fields for Teacher Portal
    current_grade = Column(String, nullable=True, default="Debut") # Debut, Grade 1, ..., Grade 8
    syllabus_type = Column(String, nullable=True) # Trinity, RSL, etc.
    is_exam_student = Column(Boolean, default=False)
    exam_date = Column(Date, nullable=True)
    password_hash = Column(String, nullable=True) # For student login
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    name = Column(String, nullable=True) # Optional custom name
    capacity = Column(Integer, default=10)
    color_tag = Column(String, nullable=True) # Color tag for visual differentiation
    
    # Recurrence
    is_recurring = Column(Boolean, default=False)
    days_of_week = Column(String, nullable=True) # JSON list: ["Mon", "Wed"]
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    
    start_time = Column(String, nullable=False) # HH:MM
    end_time = Column(String, nullable=False) # HH:MM

    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    co_teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sessions = relationship("ClassSession", back_populates="batch", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="batch", cascade="all, delete-orphan")
    batch_enrollments = relationship("BatchEnrollment", back_populates="batch", cascade="all, delete-orphan")
    batch_teachers = relationship("BatchTeacher", back_populates="batch", cascade="all, delete-orphan")
    teacher = relationship("Staff", foreign_keys=[teacher_id])

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    recurrence_id = Column(String, nullable=True) # Identifier for recurring series
    
    date = Column(Date, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=True) # If override needed
    status = Column(String, default="scheduled") # scheduled, cancelled, completed
    is_published = Column(Boolean, default=True) # If False, hidden from students/teachers
    notes = Column(Text, nullable=True) # Admin notes for this session

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    batch = relationship("Batch", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    enrollment_type = Column(String, default="recurring") # recurring, single_session, makeup
    # JSON array of class_session IDs. NULL = applies to all sessions (recurring).
    # For single_session: [session_id_1, session_id_2, ...] — explicit allowlist.
    session_ids = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")
    batch = relationship("Batch", back_populates="enrollments")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(String, default="present") # present, absent, late, excused
    notes = Column(String, nullable=True)
    
    marked_by = Column(Integer, ForeignKey("staff.id"), nullable=True)  # Teacher who marked
    marked_at = Column(DateTime(timezone=True), nullable=True)  # When it was marked
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ClassSession", back_populates="attendances")
    student = relationship("Student")

class Feedback(Base):
    """Teacher feedback and syllabus progress tracking"""
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    
    feedback = Column(Text, nullable=True)
    syllabus_covered = Column(Text, nullable=True)  # What was covered in this session
    performance_rating = Column(Integer, nullable=True)  # 1-5 stars
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    session = relationship("ClassSession")
    student = relationship("Student")
    teacher = relationship("Staff", foreign_keys=[teacher_id])

class Syllabus(Base):

    __tablename__ = "syllabus"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    modules = relationship("Module", back_populates="syllabus", cascade="all, delete-orphan")
    subject = relationship("Subject", back_populates="syllabi")
    grade = relationship("Grade", back_populates="syllabi")

class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(Integer, ForeignKey("syllabus.id"), nullable=False)
    name = Column(String, nullable=False)
    weight = Column(Integer, default=0) # Percentage weight of this module in syllabus
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    
    
    syllabus = relationship("Syllabus", back_populates="modules")
    contents = relationship("Content", back_populates="module", cascade="all, delete-orphan")

class Content(Base):
    __tablename__ = "contents"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    name = Column(String, nullable=False)
    content_type = Column(String, nullable=False) # e.g., 'song', 'exercise', 'theory'
    weight = Column(Integer, default=1) # Weight of this item within the module
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())    
    
    module = relationship("Module", back_populates="contents")
    progress_records = relationship("StudentProgress", back_populates="content", cascade="all, delete-orphan")

class StudentProgress(Base):
    __tablename__ = "student_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id"), nullable=False)
    status = Column(String, default="not-yet") # not-yet, in-progress, done
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    student = relationship("Student")
    content = relationship("Content", back_populates="progress_records")

class Material(Base):
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True) # Optional if shared with all
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # pdf, image, audio, video
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    teacher = relationship("Staff")
    student = relationship("Student")
# ==================== NEW CURRICULUM MANAGEMENT MODELS ====================

class Subject(Base):
    """Subjects that can be taught (Piano, Guitar, Vocals, etc.)"""
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    teacher_assignments = relationship("TeacherSubjectAssignment", back_populates="subject", cascade="all, delete-orphan")
    syllabi = relationship("Syllabus", back_populates="subject")

class Grade(Base):
    """Grade levels (Debut, Grade 1-8, etc.)"""
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    syllabi = relationship("Syllabus", back_populates="grade")

class TeacherSubjectAssignment(Base):
    """Assigns teachers to subjects they can teach"""
    __tablename__ = "teacher_subject_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    can_edit_curriculum = Column(Boolean, default=True)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    teacher = relationship("Staff", back_populates="subject_assignments")
    subject = relationship("Subject", back_populates="teacher_assignments")

class ExamSession(Base):
    """Exam sessions for tracking student exam enrollment"""
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    exam_board = Column(String, nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_date = Column(Date, nullable=True)
    registration_deadline = Column(Date, nullable=True)
    fee_amount = Column(Float, default=0.0)
    max_students = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    grade = relationship("Grade")
    subject = relationship("Subject")
    creator = relationship("Staff", foreign_keys=[created_by])
    enrollments = relationship("ExamEnrollment", back_populates="exam_session", cascade="all, delete-orphan")

class ExamEnrollment(Base):
    """Student enrollment in exam sessions"""
    __tablename__ = "exam_enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    exam_session_id = Column(Integer, ForeignKey("exam_sessions.id"), nullable=False)
    enrolled_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    enrollment_status = Column(String, default="enrolled")
    payment_status = Column(String, default="pending")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("Student")
    exam_session = relationship("ExamSession", back_populates="enrollments")
    enrolled_by_teacher = relationship("Staff", foreign_keys=[enrolled_by])

class CancellationRule(Base):
    """Rules for class cancellation based on fee packages"""
    __tablename__ = "cancellation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    package_name = Column(String, nullable=False)
    advance_notice_hours = Column(Integer, default=24)
    max_cancellations_per_month = Column(Integer, default=2)
    penalty_percentage = Column(Float, default=0.0)
    allows_rescheduling = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClassCancellation(Base):
    """Track class cancellations and reschedules"""
    __tablename__ = "class_cancellations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    cancellation_type = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="pending")
    new_session_id = Column(Integer, ForeignKey("class_sessions.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    session = relationship("ClassSession", foreign_keys=[session_id])
    student = relationship("Student")
    new_session = relationship("ClassSession", foreign_keys=[new_session_id])
    approver = relationship("Staff", foreign_keys=[approved_by])

class Payment(Base):
    """Track payments and invoices for students"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_type = Column(String, default="Monthly Tuition")  # Monthly Tuition, Exam Fee, Material Fee, etc.
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, paid, overdue, cancelled
    
    # Dates
    issue_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(Date, nullable=False)
    paid_date = Column(DateTime(timezone=True), nullable=True)
    
    # Payment tracking
    payment_method = Column(String, nullable=True)  # Cash, Card, Online, Bank Transfer
    transaction_id = Column(String, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    student = relationship("Student")
    creator = relationship("Staff", foreign_keys=[created_by])


class BatchEnrollment(Base):
    """Student enrolled in all sessions of a batch from a specific date (recurring)."""
    __tablename__ = "batch_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    enrolled_from = Column(Date, nullable=False)  # include sessions on/after this date
    status = Column(String, default="active")  # active, dropped

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student")
    batch = relationship("Batch", back_populates="batch_enrollments")


class BatchTeacher(Base):
    """Additional co-teachers assigned to a batch."""
    __tablename__ = "batch_teachers"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="batch_teachers")
    staff = relationship("Staff")
