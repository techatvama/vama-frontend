"""
Pydantic schemas for Curriculum Management System
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# ==================== Subject Schemas ====================

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ==================== Grade Schemas ====================

class GradeBase(BaseModel):
    name: str
    level: int
    description: Optional[str] = None

class GradeCreate(GradeBase):
    pass

class GradeUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    description: Optional[str] = None

class GradeResponse(GradeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Teacher Subject Assignment Schemas ====================

class TeacherSubjectAssignmentBase(BaseModel):
    teacher_id: int
    subject_id: int
    can_edit_curriculum: bool = True

class TeacherSubjectAssignmentCreate(TeacherSubjectAssignmentBase):
    pass

class TeacherSubjectAssignmentResponse(TeacherSubjectAssignmentBase):
    id: int
    assigned_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Exam Session Schemas ====================

class ExamSessionBase(BaseModel):
    name: str
    exam_board: str
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    exam_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    fee_amount: float = 0.0
    max_students: Optional[int] = None
    is_active: bool = True
    notes: Optional[str] = None

class ExamSessionCreate(ExamSessionBase):
    created_by: Optional[int] = None

class ExamSessionUpdate(BaseModel):
    name: Optional[str] = None
    exam_board: Optional[str] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    exam_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    fee_amount: Optional[float] = None
    max_students: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class ExamSessionResponse(ExamSessionBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    enrollment_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# ==================== Exam Enrollment Schemas ====================

class ExamEnrollmentBase(BaseModel):
    student_id: int
    exam_session_id: int
    enrolled_by: Optional[int] = None

class ExamEnrollmentCreate(ExamEnrollmentBase):
    pass

class ExamEnrollmentUpdate(BaseModel):
    enrollment_status: Optional[str] = None
    payment_status: Optional[str] = None

class ExamEnrollmentResponse(ExamEnrollmentBase):
    id: int
    enrollment_status: str
    payment_status: str
    enrolled_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Cancellation Rule Schemas ====================

class CancellationRuleBase(BaseModel):
    package_name: str
    advance_notice_hours: int = 24
    max_cancellations_per_month: int = 2
    penalty_percentage: float = 0.0
    allows_rescheduling: bool = True
    description: Optional[str] = None

class CancellationRuleCreate(CancellationRuleBase):
    pass

class CancellationRuleUpdate(BaseModel):
    package_name: Optional[str] = None
    advance_notice_hours: Optional[int] = None
    max_cancellations_per_month: Optional[int] = None
    penalty_percentage: Optional[float] = None
    allows_rescheduling: Optional[bool] = None
    description: Optional[str] = None

class CancellationRuleResponse(CancellationRuleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Class Cancellation Schemas ====================

class ClassCancellationBase(BaseModel):
    session_id: int
    student_id: int
    cancellation_type: str  # 'cancel' or 'reschedule'
    reason: Optional[str] = None
    new_session_id: Optional[int] = None

class ClassCancellationCreate(ClassCancellationBase):
    pass

class ClassCancellationUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[int] = None

class ClassCancellationResponse(ClassCancellationBase):
    id: int
    requested_at: datetime
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ==================== Attendance Filter Schemas ====================

class AttendanceFilterRequest(BaseModel):
    filter_type: str  # 'last30days', 'week', 'month', 'quarter', 'alltime', 'custom'
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AttendanceStatsResponse(BaseModel):
    total_classes: int
    present: int
    absent: int
    attendance_percentage: float
    with_feedback: int

# ==================== Syllabus Schemas ====================

class ContentBase(BaseModel):
    name: str
    content_type: str
    weight: int = 1
    order: int = 0

class ContentCreate(ContentBase):
    module_id: int

class ContentUpdate(BaseModel):
    name: Optional[str] = None
    content_type: Optional[str] = None
    weight: Optional[int] = None
    order: Optional[int] = None

class ContentResponse(ContentBase):
    id: int
    module_id: int
    
    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    name: str
    weight: int = 0
    order: int = 0

class ModuleCreate(ModuleBase):
    syllabus_id: int

class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    weight: Optional[int] = None
    order: Optional[int] = None

class ModuleResponse(ModuleBase):
    id: int
    syllabus_id: int
    contents: List[ContentResponse] = []
    
    class Config:
        from_attributes = True

class SyllabusBase(BaseModel):
    name: str
    description: Optional[str] = None
    subject_id: Optional[int] = None
    grade_id: Optional[int] = None

class SyllabusCreate(SyllabusBase):
    pass

class SyllabusUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    subject_id: Optional[int] = None
    grade_id: Optional[int] = None

class SyllabusResponse(SyllabusBase):
    id: int
    created_at: datetime
    modules: List[ModuleResponse] = []
    
    class Config:
        from_attributes = True

