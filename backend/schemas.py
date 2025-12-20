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
    pass

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


# Student Schemas
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

class StudentCreate(StudentBase):
    pass

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


# For /read-sheet endpoint compatibility
class StudentDashboard(BaseModel):
    """Timestamp": "Joined On",
    "Email": "Email",
    "First Name": "First Name",
    "Last Name": "Last Name",
    "Desired Course": "Course",
    "Primary Phone Number": "Phone",
    "Select your nearest Vama Center ": "Center"
    """
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
    enrollments: List[EnrollmentResponse] = []
    
    class Config:
        from_attributes = True

