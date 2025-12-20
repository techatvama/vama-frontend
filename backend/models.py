from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Enum, Text
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
    calendar = Column(Boolean, default=True)
    takes_classes = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    name = Column(String, nullable=True) # Optional custom name
    capacity = Column(Integer, default=10)
    
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
    teacher = relationship("Staff", foreign_keys=[teacher_id])

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    
    date = Column(Date, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    
    teacher_id = Column(Integer, ForeignKey("staff.id"), nullable=True) # If override needed
    status = Column(String, default="scheduled") # scheduled, cancelled, completed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    batch = relationship("Batch", back_populates="sessions")
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    enrollment_type = Column(String, default="recurring") # recurring, single_session, makeup
    
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
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("ClassSession", back_populates="attendances")
    student = relationship("Student")

