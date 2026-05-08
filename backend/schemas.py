from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from typing import Optional, List
from datetime import datetime, date

# Staff Schemas
class StaffBase(BaseModel):
    name: str
    role: str
    phone: str
    email: EmailStr
    calendar: bool = True
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    takesClasses: Optional[bool] = True

class StaffCreate(StaffBase):
    password: Optional[str] = None

class StaffResponse(StaffBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    calendar: Optional[bool] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    takesClasses: Optional[bool] = None
    password: Optional[str] = None

class TeacherLogin(BaseModel):
    email: EmailStr
    password: str

class StudentLogin(BaseModel):
    email: EmailStr
    password: str

# Student Schemas
class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    primary_phone_number: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    desired_course: Optional[str] = None
    class_frequency: Optional[str] = None
    nearest_vama_center: Optional[str] = None
    preferred_mode_of_contact: Optional[str] = None
    parent_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    referrer: Optional[str] = None
    current_grade: Optional[str] = "Debut"
    syllabus_type: Optional[str] = None
    is_exam_student: Optional[bool] = False
    exam_date: Optional[date] = None

class StudentCreate(StudentBase):
    password: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    primary_phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    state_code: Optional[str] = None
    desired_course: Optional[str] = None
    class_frequency: Optional[str] = None
    nearest_vama_center: Optional[str] = None
    preferred_mode_of_contact: Optional[str] = None
    parent_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    referrer: Optional[str] = None
    current_grade: Optional[str] = None
    syllabus_type: Optional[str] = None
    is_exam_student: Optional[bool] = None
    exam_date: Optional[date] = None
    password: Optional[str] = None

# Material Schemas
class MaterialBase(BaseModel):
    title: str
    file_url: str
    file_type: str # pdf, image, audio, video
    student_id: Optional[int] = None

class MaterialCreate(MaterialBase):
    teacher_id: int

class MaterialResponse(MaterialBase):
    id: int
    teacher_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# For /read-sheet endpoint compatibility
class StudentDashboard(BaseModel):
    pass

# Scheduling Schemas
class AttendanceBase(BaseModel):
    student_id: int
    status: str = "present"
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    session_id: int
    created_at: datetime
    student: Optional[StudentResponse] = None
    
    class Config:
        from_attributes = True

class EnrollmentBase(BaseModel):
    student_id: int
    enrollment_type: str = "recurring"
    # JSON-encoded list of session IDs; None means all sessions (recurring)
    session_ids: Optional[str] = None

class EnrollmentCreate(EnrollmentBase):
    batch_id: int

class EnrollmentResponse(EnrollmentBase):
    id: int
    batch_id: int
    created_at: datetime
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True

class BatchSummary(BaseModel):
    id: int
    subject: str
    name: Optional[str] = None
    capacity: int
    teacher_id: int
    teacher: Optional[StaffResponse] = None
    
    class Config:
        from_attributes = True

class ClassSessionBase(BaseModel):
    date: date
    start_time: str
    end_time: str
    status: str = "scheduled"
    teacher_id: Optional[int] = None

class ClassSessionCreate(ClassSessionBase):
    batch_id: int

class ClassSessionResponse(ClassSessionBase):
    id: int
    batch_id: int
    created_at: datetime
    attendances: List[AttendanceResponse] = []
    batch: Optional[BatchSummary] = None
    
    class Config:
        from_attributes = True

class BatchBase(BaseModel):
    subject: str
    name: Optional[str] = None
    capacity: int = 10
    color_tag: Optional[str] = None
    is_recurring: bool = False
    days_of_week: Optional[List[str]] = None # List of days ["Mon", "Fri"]
    start_date: date
    end_date: Optional[date] = None
    start_time: str
    end_time: str
    teacher_id: int
    co_teacher_id: Optional[int] = None

    @field_validator('days_of_week', mode='before')
    @classmethod
    def parse_days_of_week(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except:
                return []
        return v

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: int
    created_at: datetime
    sessions: List[ClassSessionResponse] = []
    # enrollments removed — students are now tracked per session via batch_enrollments / session_ids

    class Config:
        from_attributes = True

# Progress schemas
class StudentProgressBase(BaseModel):
    status: str = "not-yet"
    notes: Optional[str] = None

class StudentProgressCreate(StudentProgressBase):
    content_id: int
    student_id: int
    completed_at: Optional[datetime] = None

class StudentProgressResponse(StudentProgressBase):
    id: int
    content_id: int
    student_id: int
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ContentBase(BaseModel):
    name: str
    content_type: str
    weight: int = 1
    order: int = 0

class ContentResponse(ContentBase):
    id: int
    module_id: int
    progress: Optional[StudentProgressResponse] = None # Nested for specific student queries

    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    name: str
    weight: int = 0
    order: int = 0

class ModuleResponse(ModuleBase):
    id: int
    syllabus_id: int
    contents: List[ContentResponse] = []

    class Config:
        from_attributes = True

class SyllabusBase(BaseModel):
    name: str
    description: Optional[str] = None

class SyllabusResponse(SyllabusBase):
    id: int
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True

class StudentProgressUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

# Payment Schemas
class PaymentBase(BaseModel):
    student_id: int
    amount: float
    payment_type: str = "Monthly Tuition"
    description: Optional[str] = None
    due_date: date
    status: str = "pending"
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_type: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    paid_date: Optional[datetime] = None

class PaymentResponse(PaymentBase):
    id: int
    issue_date: datetime
    paid_date: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True


# BatchEnrollment schemas
class BatchEnrollmentCreate(BaseModel):
    student_id: int
    batch_id: int
    enrolled_from: date

class BatchEnrollmentResponse(BaseModel):
    id: int
    student_id: int
    batch_id: int
    enrolled_from: date
    status: str
    created_at: datetime
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True


# BatchTeacher schemas
class BatchTeacherCreate(BaseModel):
    batch_id: int
    staff_id: int

class BatchTeacherResponse(BaseModel):
    id: int
    batch_id: int
    staff_id: int
    created_at: datetime
    staff: Optional[StaffResponse] = None

    class Config:
        from_attributes = True
