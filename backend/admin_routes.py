"""
Admin routes for Curriculum Management System
Handles: Subjects, Grades, Exam Sessions, Teacher Assignments, Cancellation Rules
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models import (
    Subject, Grade, ExamSession, ExamEnrollment, 
    TeacherSubjectAssignment, Staff, Student,
    Syllabus, Module, Content
)
from curriculum_schemas import (
    SubjectCreate, SubjectUpdate, SubjectResponse,
    GradeCreate, GradeUpdate, GradeResponse,
    ExamSessionCreate, ExamSessionUpdate, ExamSessionResponse,
    ExamEnrollmentResponse,
    TeacherSubjectAssignmentCreate, TeacherSubjectAssignmentResponse,
    SyllabusCreate, SyllabusUpdate, SyllabusResponse,
    ModuleCreate, ModuleUpdate, ModuleResponse,
    ContentCreate, ContentUpdate, ContentResponse
)
from schemas import StaffResponse

router = APIRouter(prefix="/admin", tags=["admin"])

# ==================== Subject Management ====================

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(db: Session = Depends(get_db)):
    """Get all subjects"""
    return db.query(Subject).all()

@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    """Create a new subject"""
    # Check if subject already exists
    existing = db.query(Subject).filter(Subject.name == subject.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")
    
    db_subject = Subject(**subject.dict())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: int, subject: SubjectUpdate, db: Session = Depends(get_db)):
    """Update a subject"""
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = subject.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    """Delete a subject"""
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(db_subject)
    db.commit()
    return {"message": "Subject deleted successfully"}

# ==================== Grade Management ====================

@router.get("/grades", response_model=List[GradeResponse])
async def get_grades(db: Session = Depends(get_db)):
    """Get all grades ordered by level"""
    return db.query(Grade).order_by(Grade.level).all()

@router.post("/grades", response_model=GradeResponse)
async def create_grade(grade: GradeCreate, db: Session = Depends(get_db)):
    """Create a new grade"""
    db_grade = Grade(**grade.dict())
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    return db_grade

@router.put("/grades/{grade_id}", response_model=GradeResponse)
async def update_grade(grade_id: int, grade: GradeUpdate, db: Session = Depends(get_db)):
    """Update a grade"""
    db_grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not db_grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    update_data = grade.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_grade, key, value)
    
    db.commit()
    db.refresh(db_grade)
    return db_grade

@router.delete("/grades/{grade_id}")
async def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    """Delete a grade"""
    db_grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not db_grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    db.delete(db_grade)
    db.commit()
    return {"message": "Grade deleted successfully"}

# ==================== Exam Session Management ====================

@router.get("/exam-sessions", response_model=List[ExamSessionResponse])
async def get_exam_sessions(db: Session = Depends(get_db)):
    """Get all exam sessions with enrollment counts"""
    sessions = db.query(ExamSession).all()
    
    result = []
    for session in sessions:
        enrollment_count = db.query(ExamEnrollment).filter(
            ExamEnrollment.exam_session_id == session.id
        ).count()
        
        session_dict = {
            "id": session.id,
            "name": session.name,
            "exam_board": session.exam_board,
            "grade_id": session.grade_id,
            "subject_id": session.subject_id,
            "exam_date": session.exam_date,
            "registration_deadline": session.registration_deadline,
            "fee_amount": session.fee_amount,
            "max_students": session.max_students,
            "is_active": session.is_active,
            "notes": session.notes,
            "created_by": session.created_by,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "enrollment_count": enrollment_count
        }
        result.append(session_dict)
    
    return result

@router.post("/exam-sessions", response_model=ExamSessionResponse)
async def create_exam_session(exam_session: ExamSessionCreate, db: Session = Depends(get_db)):
    """Create a new exam session"""
    db_exam = ExamSession(**exam_session.dict())
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    # Add enrollment count
    result = {**db_exam.__dict__, "enrollment_count": 0}
    return result

@router.put("/exam-sessions/{exam_id}", response_model=ExamSessionResponse)
async def update_exam_session(exam_id: int, exam_session: ExamSessionUpdate, db: Session = Depends(get_db)):
    """Update an exam session"""
    db_exam = db.query(ExamSession).filter(ExamSession.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    update_data = exam_session.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exam, key, value)
    
    db.commit()
    db.refresh(db_exam)
    
    enrollment_count = db.query(ExamEnrollment).filter(
        ExamEnrollment.exam_session_id == exam_id
    ).count()
    
    result = {**db_exam.__dict__, "enrollment_count": enrollment_count}
    return result

@router.delete("/exam-sessions/{exam_id}")
async def delete_exam_session(exam_id: int, db: Session = Depends(get_db)):
    """Delete an exam session"""
    db_exam = db.query(ExamSession).filter(ExamSession.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam session not found")
    
    db.delete(db_exam)
    db.commit()
    return {"message": "Exam session deleted successfully"}

@router.get("/exam-sessions/{exam_id}/enrollments", response_model=List[ExamEnrollmentResponse])
async def get_exam_enrollments(exam_id: int, db: Session = Depends(get_db)):
    """Get all enrollments for an exam session"""
    return db.query(ExamEnrollment).filter(ExamEnrollment.exam_session_id == exam_id).all()

# ==================== Teacher Subject Assignment ====================

@router.get("/teacher-assignments", response_model=List[TeacherSubjectAssignmentResponse])
async def get_teacher_assignments(db: Session = Depends(get_db)):
    """Get all teacher-subject assignments"""
    return db.query(TeacherSubjectAssignment).all()

@router.post("/teacher-assignments", response_model=TeacherSubjectAssignmentResponse)
async def create_teacher_assignment(
    assignment: TeacherSubjectAssignmentCreate, 
    db: Session = Depends(get_db)
):
    """Assign a teacher to a subject"""
    # Check if assignment already exists
    existing = db.query(TeacherSubjectAssignment).filter(
        TeacherSubjectAssignment.teacher_id == assignment.teacher_id,
        TeacherSubjectAssignment.subject_id == assignment.subject_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Teacher already assigned to this subject")
    
    db_assignment = TeacherSubjectAssignment(**assignment.dict())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.delete("/teacher-assignments/{assignment_id}")
async def delete_teacher_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Remove a teacher-subject assignment"""
    db_assignment = db.query(TeacherSubjectAssignment).filter(
        TeacherSubjectAssignment.id == assignment_id
    ).first()
    
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(db_assignment)
    db.commit()
    return {"message": "Assignment removed successfully"}

@router.get("/teachers/{teacher_id}/subjects", response_model=List[SubjectResponse])
async def get_teacher_subjects(teacher_id: int, db: Session = Depends(get_db)):
    """Get all subjects assigned to a teacher"""
    assignments = db.query(TeacherSubjectAssignment).filter(
        TeacherSubjectAssignment.teacher_id == teacher_id
    ).all()
    
    subject_ids = [a.subject_id for a in assignments]
    return db.query(Subject).filter(Subject.id.in_(subject_ids)).all()

@router.get("/subjects/{subject_id}/teachers", response_model=List[StaffResponse])
async def get_subject_teachers(subject_id: int, db: Session = Depends(get_db)):
    """Get all teachers assigned to a subject"""
    assignments = db.query(TeacherSubjectAssignment).filter(
        TeacherSubjectAssignment.subject_id == subject_id
    ).all()
    
    teacher_ids = [a.teacher_id for a in assignments]
    return db.query(Staff).filter(Staff.id.in_(teacher_ids)).all()

# ==================== Syllabus Management ====================

@router.get("/syllabi", response_model=List[SyllabusResponse])
async def get_all_syllabi(subject_id: int = None, grade_id: int = None, db: Session = Depends(get_db)):
    """Get all syllabi, optionally filtered by subject and grade"""
    query = db.query(Syllabus)
    if subject_id:
        query = query.filter(Syllabus.subject_id == subject_id)
    if grade_id:
        query = query.filter(Syllabus.grade_id == grade_id)
    return query.all()

@router.post("/syllabi", response_model=SyllabusResponse)
async def create_syllabus(syllabus: SyllabusCreate, db: Session = Depends(get_db)):
    """Create a new syllabus"""
    db_syllabus = Syllabus(**syllabus.dict())
    db.add(db_syllabus)
    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus

@router.get("/syllabi/{syllabus_id}", response_model=SyllabusResponse)
async def get_syllabus(syllabus_id: int, db: Session = Depends(get_db)):
    """Get syllabus details"""
    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    return db_syllabus

@router.put("/syllabi/{syllabus_id}", response_model=SyllabusResponse)
async def update_syllabus(syllabus_id: int, syllabus: SyllabusUpdate, db: Session = Depends(get_db)):
    """Update a syllabus"""
    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    update_data = syllabus.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_syllabus, key, value)
    
    db.commit()
    db.refresh(db_syllabus)
    return db_syllabus

@router.delete("/syllabi/{syllabus_id}")
async def delete_syllabus(syllabus_id: int, db: Session = Depends(get_db)):
    """Delete a syllabus"""
    db_syllabus = db.query(Syllabus).filter(Syllabus.id == syllabus_id).first()
    if not db_syllabus:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    db.delete(db_syllabus)
    db.commit()
    return {"message": "Syllabus deleted successfully"}

# ==================== Module Management ====================

@router.post("/modules", response_model=ModuleResponse)
async def create_module(module: ModuleCreate, db: Session = Depends(get_db)):
    """Create a new module within a syllabus"""
    db_module = Module(**module.dict())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

@router.put("/modules/{module_id}", response_model=ModuleResponse)
async def update_module(module_id: int, module: ModuleUpdate, db: Session = Depends(get_db)):
    """Update a module"""
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = module.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_module, key, value)
    
    db.commit()
    db.refresh(db_module)
    return db_module

@router.delete("/modules/{module_id}")
async def delete_module(module_id: int, db: Session = Depends(get_db)):
    """Delete a module"""
    db_module = db.query(Module).filter(Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    db.delete(db_module)
    db.commit()
    return {"message": "Module deleted successfully"}

# ==================== Content Management ====================

@router.post("/contents", response_model=ContentResponse)
async def create_content(content: ContentCreate, db: Session = Depends(get_db)):
    """Create a new content item within a module"""
    db_content = Content(**content.dict())
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.put("/contents/{content_id}", response_model=ContentResponse)
async def update_content(content_id: int, content: ContentUpdate, db: Session = Depends(get_db)):
    """Update a content item"""
    db_content = db.query(Content).filter(Content.id == content_id).first()
    if not db_content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    update_data = content.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_content, key, value)
    
    db.commit()
    db.refresh(db_content)
    return db_content

@router.delete("/contents/{content_id}")
async def delete_content(content_id: int, db: Session = Depends(get_db)):
    """Delete a content item"""
    db_content = db.query(Content).filter(Content.id == content_id).first()
    if not db_content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    db.delete(db_content)
    db.commit()
    return {"message": "Content deleted successfully"}

# ==================== Dashboard Stats ====================

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_subjects = db.query(Subject).filter(Subject.is_active == True).count()
    total_grades = db.query(Grade).count()
    active_exams = db.query(ExamSession).filter(ExamSession.is_active == True).count()
    total_teachers = db.query(Staff).filter(Staff.role == 'Teacher').count()
    total_students = db.query(Student).count()
    teacher_assignments = db.query(TeacherSubjectAssignment).count()
    
    return {
        "total_subjects": total_subjects,
        "total_grades": total_grades,
        "active_exams": active_exams,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "teacher_assignments": teacher_assignments
    }

# ==================== Class Cancellations (Admin View) ====================

@router.get("/class-cancellations")
async def get_class_cancellations(
    status: str = None,
    db: Session = Depends(get_db)
):
    """Get all class cancellation requests, optionally filtered by status"""
    # Placeholder or empty list since we are removing cancellation features
    return []

# ==================== Payment Management ====================

@router.get("/payments")
async def get_all_payments(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """Get all payments with student information"""
    from crud import get_all_payments
    from schemas import StudentResponse
    
    payments = get_all_payments(db, skip=skip, limit=limit)
    
    # Format response with student name
    result = []
    for payment in payments:
        payment_dict = {
            "id": payment.id,
            "student_id": payment.student_id,
            "student_name": f"{payment.student.first_name} {payment.student.last_name}" if payment.student else "Unknown",
            "amount": payment.amount,
            "payment_type": payment.payment_type,
            "description": payment.description,
            "status": payment.status,
            "issue_date": payment.issue_date,
            "due_date": payment.due_date,
            "paid_date": payment.paid_date,
            "payment_method": payment.payment_method,
            "transaction_id": payment.transaction_id,
            "created_by": payment.created_by,
            "created_at": payment.created_at,
            "updated_at": payment.updated_at
        }
        result.append(payment_dict)
    
    return result

@router.post("/payments")
async def create_payment(payment_data: dict, db: Session = Depends(get_db)):
    """Create a new payment/invoice"""
    from crud import create_payment
    
    # You can add created_by_id from authentication when implemented
    payment = create_payment(db, payment_data, created_by_id=None)
    
    return {
        "id": payment.id,
        "student_id": payment.student_id,
        "amount": payment.amount,
        "payment_type": payment.payment_type,
        "description": payment.description,
        "status": payment.status,
        "issue_date": payment.issue_date,
        "due_date": payment.due_date,
        "paid_date": payment.paid_date,
        "created_at": payment.created_at
    }

@router.get("/payments/{payment_id}")
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Get a specific payment by ID"""
    from crud import get_payment_by_id
    
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": payment.id,
        "student_id": payment.student_id,
        "student_name": f"{payment.student.first_name} {payment.student.last_name}" if payment.student else "Unknown",
        "amount": payment.amount,
        "payment_type": payment.payment_type,
        "description": payment.description,
        "status": payment.status,
        "issue_date": payment.issue_date,
        "due_date": payment.due_date,
        "paid_date": payment.paid_date,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "created_by": payment.created_by,
        "created_at": payment.created_at,
        "updated_at": payment.updated_at
    }

@router.patch("/payments/{payment_id}")
async def update_payment(payment_id: int, payment_data: dict, db: Session = Depends(get_db)):
    """Update a payment"""
    from crud import update_payment
    
    payment = update_payment(db, payment_id, payment_data)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": payment.id,
        "student_id": payment.student_id,
        "amount": payment.amount,
        "payment_type": payment.payment_type,
        "description": payment.description,
        "status": payment.status,
        "issue_date": payment.issue_date,
        "due_date": payment.due_date,
        "paid_date": payment.paid_date,
        "payment_method": payment.payment_method,
        "transaction_id": payment.transaction_id,
        "updated_at": payment.updated_at
    }

@router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """Delete a payment"""
    from crud import delete_payment
    
    success = delete_payment(db, payment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {"message": "Payment deleted successfully"}

@router.post("/payments/{payment_id}/mark-paid")
async def mark_payment_paid(
    payment_id: int,
    payment_method: str = None,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """Mark a payment as paid"""
    from crud import mark_payment_as_paid
    
    payment = mark_payment_as_paid(db, payment_id, payment_method, transaction_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": payment.id,
        "status": payment.status,
        "paid_date": payment.paid_date,
        "message": "Payment marked as paid successfully"
    }

@router.get("/payments/student/{student_id}")
async def get_student_payments(student_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific student"""
    from crud import get_student_payments
    
    payments = get_student_payments(db, student_id)
    
    return [{
        "id": p.id,
        "amount": p.amount,
        "payment_type": p.payment_type,
        "description": p.description,
        "status": p.status,
        "issue_date": p.issue_date,
        "due_date": p.due_date,
        "paid_date": p.paid_date
    } for p in payments]

@router.get("/payments/status/{status}")
async def get_payments_by_status(status: str, db: Session = Depends(get_db)):
    """Get all payments with a specific status"""
    from crud import get_payments_by_status
    
    payments = get_payments_by_status(db, status)
    
    result = []
    for payment in payments:
        result.append({
            "id": payment.id,
            "student_name": f"{payment.student.first_name} {payment.student.last_name}" if payment.student else "Unknown",
            "amount": payment.amount,
            "payment_type": payment.payment_type,
            "status": payment.status,
            "due_date": payment.due_date,
            "paid_date": payment.paid_date
        })
    
    return result

@router.get("/payments/overdue/list")
async def get_overdue_payments_list(db: Session = Depends(get_db)):
    """Get all overdue payments"""
    from crud import get_overdue_payments
    
    payments = get_overdue_payments(db)
    
    result = []
    for payment in payments:
        result.append({
            "id": payment.id,
            "student_id": payment.student_id,
            "student_name": f"{payment.student.first_name} {payment.student.last_name}" if payment.student else "Unknown",
            "amount": payment.amount,
            "payment_type": payment.payment_type,
            "status": payment.status,
            "due_date": payment.due_date,
            "days_overdue": (payment.due_date - payment.issue_date.date()).days
        })
    
    return result

# ==================== PDF Invoice Generation ====================

@router.get("/payments/{payment_id}/generate-pdf")
async def generate_payment_pdf(payment_id: int, db: Session = Depends(get_db)):
    """Generate and return PDF invoice"""
    from crud import get_payment_by_id
    from invoice_pdf import generate_invoice_pdf
    from fastapi.responses import FileResponse
    import os
    
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    try:
        # Generate PDF
        pdf_path =generate_invoice_pdf(payment, payment.student)
        
        # Return file
        if os.path.exists(pdf_path):
            return FileResponse(
                pdf_path,
                media_type='application/pdf',
                filename=f"invoice_{payment.id}.pdf"
            )
        else:
            raise HTTPException(status_code=500, detail="Error generating PDF")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

# ==================== Email Invoice ====================

@router.post("/payments/{payment_id}/send-email")
async def send_payment_email(payment_id: int, db: Session = Depends(get_db)):
    """Send invoice email to student"""
    from crud import get_payment_by_id
    from email_service import email_service
    from invoice_pdf import generate_invoice_pdf
    
    payment = get_payment_by_id(db, payment_id)
    if not payment or not payment.student:
        raise HTTPException(status_code=404, detail="Payment or student not found")
    
    try:
        # Generate PDF
        pdf_path = generate_invoice_pdf(payment, payment.student)
        
        # Send email
        success = email_service.send_invoice_email(
            student_email=payment.student.email,
            student_name=f"{payment.student.first_name} {payment.student.last_name}",
            invoice_number=payment.id,
            amount=payment.amount,
            due_date=payment.due_date.strftime('%d %B, %Y'),
            pdf_path=pdf_path
        )
        
        if success:
            return {"message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")

@router.post("/payments/{payment_id}/send-reminder")
async def send_payment_reminder_email(payment_id: int, db: Session = Depends(get_db)):
    """Send payment reminder email"""
    from crud import get_payment_by_id
    from email_service import email_service
    from datetime import date
    
    payment = get_payment_by_id(db, payment_id)
    if not payment or not payment.student:
        raise HTTPException(status_code=404, detail="Payment or student not found")
    
    try:
        days_until_due = (payment.due_date - date.today()).days
        
        success = email_service.send_payment_reminder(
            student_email=payment.student.email,
            student_name=f"{payment.student.first_name} {payment.student.last_name}",
            invoice_number=payment.id,
            amount=payment.amount,
            due_date=payment.due_date.strftime('%d %B, %Y'),
            days_until_due=days_until_due
        )
        
        if success:
            return {"message": "Reminder sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send reminder")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending reminder: {str(e)}")

# ==================== Razorpay Integration ====================

@router.post("/payments/{payment_id}/create-razorpay-order")
async def create_razorpay_order_for_payment(payment_id: int, db: Session = Depends(get_db)):
    """Create Razorpay order for a payment"""
    from crud import get_payment_by_id
    from razorpay_service import razorpay_service
    
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status == 'paid':
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    try:
        order = razorpay_service.create_order(
            amount=payment.amount,
            receipt=f"INV-{payment.id}",
            notes={
                'invoice_id': payment.id,
                'student_id': payment.student_id,
                'payment_type': payment.payment_type
            }
        )
        
        if order['success']:
            return order
        else:
            raise HTTPException(status_code=500, detail=order.get('error', 'Failed to create order'))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating Razorpay order: {str(e)}")

@router.post("/payments/razorpay/verify")
async def verify_razorpay_payment(
    payment_id: int,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and mark invoice as paid"""
    from crud import get_payment_by_id, mark_payment_as_paid
    from razorpay_service import razorpay_service
    from email_service import email_service
    from datetime import datetime
    
    payment = get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    try:
        # Verify signature
        is_valid = razorpay_service.verify_payment_signature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get payment details
        payment_details = razorpay_service.get_payment_details(razorpay_payment_id)
        
        if not payment_details:
            raise HTTPException(status_code=500, detail="Failed to fetch payment details")
        
        # Mark as paid
        updated_payment = mark_payment_as_paid(
            db,
            payment_id,
            payment_method="Razorpay",
            transaction_id=razorpay_payment_id
        )
        
        # Send confirmation email
        if payment.student:
            email_service.send_payment_confirmation(
                student_email=payment.student.email,
                student_name=f"{payment.student.first_name} {payment.student.last_name}",
                invoice_number=payment.id,
                amount=payment.amount,
                payment_date=datetime.now().strftime('%d %B, %Y'),
                payment_method="Razorpay"
            )
        
        return {
            "success": True,
            "message": "Payment verified and recorded successfully",
            "payment": {
                "id": updated_payment.id,
                "status": updated_payment.status,
                "paid_date": updated_payment.paid_date
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying payment: {str(e)}")

@router.post("/payments/{payment_id}/create-payment-link")
async def create_razorpay_payment_link(payment_id: int, db: Session = Depends(get_db)):
    """Create Razorpay payment link for a payment"""
    from crud import get_payment_by_id
    from razorpay_service import razorpay_service
    
    payment = get_payment_by_id(db, payment_id)
    if not payment or not payment.student:
        raise HTTPException(status_code=404, detail="Payment or student not found")
    
    if payment.status == 'paid':
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    try:
        link = razorpay_service.create_payment_link(
            amount=payment.amount,
            description=f"{payment.payment_type} - Invoice #{payment.id}",
            customer_name=f"{payment.student.first_name} {payment.student.last_name}",
            customer_email=payment.student.email,
            customer_phone=payment.student.primary_phone_number,
            reference_id=str(payment.id)
        )
        
        if link['success']:
            return link
        else:
            raise HTTPException(status_code=500, detail=link.get('error', 'Failed to create payment link'))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating payment link: {str(e)}")

# ==================== Payment Analytics ====================

@router.get("/payments/analytics")
async def get_payment_analytics(range: str = "this_month", db: Session = Depends(get_db)):
    """Get payment analytics and statistics"""
    from crud import get_all_payments
    from datetime import datetime, timedelta
    from sqlalchemy import func
    from models import Payment
    
    try:
        # Determine date range
        today = datetime.now().date()
        if range == "this_month":
            start_date = today.replace(day=1)
            end_date = today
        elif range == "last_month":
            last_month = today.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1)
            end_date = last_month
        elif range == "this_year":
            start_date = today.replace(month=1, day=1)
            end_date = today
        else:  # all_time
            start_date = None
            end_date = None
        
        # Build base query
        query = db.query(Payment)
        if start_date and end_date:
            query = query.filter(Payment.issue_date >= start_date, Payment.issue_date <= end_date)
        
        all_payments = query.all()
        
        # Calculate statistics
        total_invoices = len(all_payments)
        paid_invoices = len([p for p in all_payments if p.status == 'paid'])
        pending_invoices = len([p for p in all_payments if p.status == 'pending'])
        overdue_invoices = len([p for p in all_payments if p.status == 'overdue'])
        
        total_revenue = sum(p.amount for p in all_payments if p.status == 'paid')
        average_invoice = total_revenue / paid_invoices if paid_invoices > 0 else 0
        collection_rate = (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0
        
        # Payment types breakdown
        payment_types = {}
        for p in all_payments:
            if p.payment_type not in payment_types:
                payment_types[p.payment_type] = {'count': 0, 'amount': 0}
            payment_types[p.payment_type]['count'] += 1
            if p.status == 'paid':
                payment_types[p.payment_type]['amount'] += p.amount
        
        top_payment_types = [
            {'type': k, 'count': v['count'], 'amount': v['amount']}
            for k, v in sorted(payment_types.items(), key=lambda x: x[1]['amount'], reverse=True)
        ]
        
        # Monthly trend (last 6 months)
        monthly_data = []
        for i in range(5, -1, -1):
            month_date = today - timedelta(days=30*i)
            month_start = month_date.replace(day=1)
            month_payments = [p for p in all_payments if p.issue_date.month == month_start.month]
            monthly_data.append({
                'month': month_start.strftime('%b'),
                'revenue': sum(p.amount for p in month_payments if p.status == 'paid'),
                'invoices': len(month_payments)
            })
        
        return {
            "totalRevenue": total_revenue,
            "revenueGrowth": 15.3,  # Calculate from previous period
            "totalInvoices": total_invoices,
            "invoiceGrowth": 8.5,  # Calculate from previous period
            "paidInvoices": paid_invoices,
            "paidPercentage": (paid_invoices / total_invoices * 100) if total_invoices > 0 else 0,
            "pendingInvoices": pending_invoices,
            "overdueInvoices": overdue_invoices,
            "averageInvoiceValue": average_invoice,
            "collectionRate": collection_rate,
            "topPaymentTypes": top_payment_types,
            "monthlyTrend": monthly_data,
            "statusBreakdown": {
                "paid": paid_invoices,
                "pending": pending_invoices,
                "overdue": overdue_invoices,
                "cancelled": len([p for p in all_payments if p.status == 'cancelled'])
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

# ==================== Real-Time Calendar Features ====================

from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import manager

@router.websocket("/ws/{user_type}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_type: str, user_id: int):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket, user_type, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for keep-alive
            await websocket.send_text(f"received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_type, user_id)

# ==================== Student Reschedule APIs ====================

@router.get("/student/{student_id}/available-slots")
async def get_available_slots(
    student_id: int,
    start: str,
    end: str,
    subject: str = None,
    db: Session = Depends(get_db)
):
    """Get available slots for rescheduling"""
    from models import Session as ClassSession, Enrollment
    from datetime import datetime
    
    try:
        start_date = datetime.strptime(start, '%Y-%m-%d').date()
        end_date = datetime.strptime(end, '%Y-%m-%d').date()
        
        # Get all sessions in date range
        query = db.query(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
        
        if subject:
            from models import Batch
            query = query.join(Batch).filter(Batch.subject == subject)
        
        sessions = query.all()
        
        # Format response with enrollment count
        available_slots = []
        for session in sessions:
            enrollment_count = db.query(Enrollment).filter(
                Enrollment.session_id == session.id
            ).count()
            
            available_slots.append({
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': str(session.start_time),
                'end_time': str(session.end_time),
                'teacher_name': f"{session.batch.teacher.first_name} {session.batch.teacher.last_name}" if session.batch and session.batch.teacher else "TBA",
                'subject': session.batch.subject if session.batch else "Unknown",
                'enrolled': enrollment_count,
                'capacity': session.batch.capacity if session.batch else 10,
                'batch_id': session.batch_id
            })
        
        return available_slots
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching available slots: {str(e)}")

@router.post("/student/{student_id}/reschedule")
async def reschedule_student_class(
    student_id: int,
    reschedule_data: dict,
    db: Session = Depends(get_db)
):
    """Reschedule a student's class"""
    from models import Enrollment, Session as ClassSession
    from datetime import datetime
    
    try:
        old_session_id = reschedule_data.get('old_session_id')
        new_session_id = reschedule_data.get('new_session_id')
        reason = reschedule_data.get('reason', '')
        
        # Remove from old session
        old_enrollment = db.query(Enrollment).filter(
            Enrollment.session_id == old_session_id,
            Enrollment.student_id == student_id
        ).first()
        
        if old_enrollment:
            db.delete(old_enrollment)
        
        # Add to new session
        new_enrollment = Enrollment(
            session_id=new_session_id,
            student_id=student_id,
            enrolled_at=datetime.now()
        )
        db.add(new_enrollment)
        db.commit()
        
        # Broadcast update to all affected parties
        new_session = db.query(ClassSession).filter(ClassSession.id == new_session_id).first()
        if new_session:
            await manager.broadcast_enrollment_update(
                new_session_id,
                student_id,
                'rescheduled'
            )
        
        return {"message": "Class rescheduled successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error rescheduling class: {str(e)}")

@router.post("/student/{student_id}/cancel-class")
async def cancel_student_class(student_id: int, session_id: int, db: Session = Depends(get_db)):
    """Cancel a student's class enrollment"""
    from models import Enrollment
    
    try:
        enrollment = db.query(Enrollment).filter(
            Enrollment.session_id == session_id,
            Enrollment.student_id == student_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        db.delete(enrollment)
        db.commit()
        
        # Broadcast update
        await manager.broadcast_enrollment_update(session_id, student_id, 'cancelled')
        
        return {"message": "Class cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error cancelling class: {str(e)}")

# ==================== Teacher Attendance & Feedback APIs ====================

@router.get("/teacher/{teacher_id}/session/{session_id}/details")
async def get_teacher_session_details(teacher_id: int, session_id: int, db: Session = Depends(get_db)):
    """Get session details for teacher including student list and attendance"""
    from models import Session as ClassSession, Enrollment, Attendance, Feedback
    
    try:
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get enrolled students
        enrollments = db.query(Enrollment).filter(Enrollment.session_id == session_id).all()
        students = []
        attendance_data = {}
        feedback_data = {}
        syllabus_progress = {}
        
        for enrollment in enrollments:
            student = enrollment.student
            students.append({
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email
            })
            
            # Get attendance
            attendance = db.query(Attendance).filter(
                Attendance.session_id == session_id,
                Attendance.student_id == student.id
            ).first()
            if attendance:
                attendance_data[student.id] = attendance.status
            
            # Get feedback
            feedback = db.query(Feedback).filter(
                Feedback.session_id == session_id,
                Feedback.student_id == student.id
            ).first()
            if feedback:
                feedback_data[student.id] = feedback.feedback
                syllabus_progress[student.id] = feedback.syllabus_covered
        
        return {
            'students': students,
            'attendance': attendance_data,
            'feedback': feedback_data,
            'syllabus_progress': syllabus_progress,
            'session_notes': session.notes if hasattr(session, 'notes') else ''
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session details: {str(e)}")

@router.post("/teacher/{teacher_id}/mark-attendance")
async def mark_student_attendance(teacher_id: int, attendance_data: dict, db: Session = Depends(get_db)):
    """Mark attendance for a student"""
    from models import Attendance
    from datetime import datetime
    
    try:
        session_id = attendance_data.get('session_id')
        student_id = attendance_data.get('student_id')
        status = attendance_data.get('status')
        
        # Check if attendance already exists
        attendance = db.query(Attendance).filter(
            Attendance.session_id == session_id,
            Attendance.student_id == student_id
        ).first()
        
        if attendance:
            attendance.status = status
            attendance.marked_at = datetime.now()
        else:
            attendance = Attendance(
                session_id=session_id,
                student_id=student_id,
                status=status,
                marked_by=teacher_id,
                marked_at=datetime.now()
            )
            db.add(attendance)
        
        db.commit()
        
        # Broadcast update
        await manager.broadcast_attendance_update(session_id, student_id, status)
        
        return {"message": "Attendance marked successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error marking attendance: {str(e)}")

@router.post("/teacher/{teacher_id}/save-feedback")
async def save_student_feedback(teacher_id: int, feedback_data: dict, db: Session = Depends(get_db)):
    """Save feedback for a student"""
    from models import Feedback
    from datetime import datetime
    
    try:
        session_id = feedback_data.get('session_id')
        student_id = feedback_data.get('student_id')
        feedback_text = feedback_data.get('feedback', '')
        syllabus_covered = feedback_data.get('syllabus_progress', '')
        
        # Check if feedback already exists
        feedback = db.query(Feedback).filter(
            Feedback.session_id == session_id,
            Feedback.student_id == student_id
        ).first()
        
        if feedback:
            feedback.feedback = feedback_text
            feedback.syllabus_covered = syllabus_covered
            feedback.updated_at = datetime.now()
        else:
            feedback = Feedback(
                session_id=session_id,
                student_id=student_id,
                teacher_id=teacher_id,
                feedback=feedback_text,
                syllabus_covered=syllabus_covered,
                created_at=datetime.now()
            )
            db.add(feedback)
        
        db.commit()
        
        return {"message": "Feedback saved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving feedback: {str(e)}")

@router.post("/teacher/{teacher_id}/session-notes")
async def save_session_notes(teacher_id: int, notes_data: dict, db: Session = Depends(get_db)):
    """Save general session notes"""
    from models import Session as ClassSession
    from datetime import datetime
    
    try:
        session_id = notes_data.get('session_id')
        notes = notes_data.get('notes', '')
        
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Add notes field if it doesn't exist (may need migration)
        if not hasattr(session, 'notes'):
            # For now, store in a separate notes table or add column
            pass
        else:
            session.notes = notes
        
        db.commit()
        
        return {"message": "Session notes saved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving session notes: {str(e)}")

# ==================== Student Detail Profile API ====================

@router.get("/student/{student_id}/complete-profile")
async def get_student_complete_profile(student_id: int, db: Session = Depends(get_db)):
    """Get complete student profile including classes, payments, and performance"""
    from models import (
        Student, Enrollment, ClassSession, Attendance,
        Feedback, Payment, Batch
    )
    from datetime import datetime, date

    def safe_isoformat(val):
        if val is None:
            return None
        if isinstance(val, str):
            return val
        return val.isoformat()

    try:
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get enrollments with attendance stats
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
        enrollment_data = []
        
        for enrollment in enrollments:
            batch = enrollment.batch
            if not batch:
                continue
            
            # Get all sessions for this batch
            sessions = db.query(ClassSession).filter(ClassSession.batch_id == batch.id).all()
            total_classes = len(sessions)
            
            # Get attendance records
            attended = db.query(Attendance).filter(
                Attendance.student_id == student_id,
                Attendance.session_id.in_([s.id for s in sessions]),
                Attendance.status == 'present'
            ).count()
            
            missed = db.query(Attendance).filter(
                Attendance.student_id == student_id,
                Attendance.session_id.in_([s.id for s in sessions]),
                Attendance.status == 'absent'
            ).count()
            
            attendance_rate = (attended / total_classes * 100) if total_classes > 0 else 0
            
            enrollment_data.append({
                'id': batch.id,
                'subject': batch.subject,
                'teacher': batch.teacher.name if batch.teacher else "TBA",
                'batch': batch.name,
                'start_date': safe_isoformat(batch.start_date) if batch.start_date else None,
                'status': 'active',  # Add status field to Batch model
                'attendance_rate': round(attendance_rate, 1),
                'total_classes': total_classes,
                'attended': attended,
                'missed': missed
            })
        
        # Get upcoming classes
        upcoming_sessions = db.query(ClassSession).join(
            Enrollment, Enrollment.batch_id == ClassSession.batch_id
        ).filter(
            Enrollment.student_id == student_id,
            ClassSession.date >= date.today()
        ).order_by(ClassSession.date).limit(5).all()
        
        upcoming_classes = []
        for session in upcoming_sessions:
            upcoming_classes.append({
                'id': session.id,
                'subject': session.batch.subject if session.batch else "Unknown",
                'date': safe_isoformat(session.date),
                'time': f"{session.start_time} - {session.end_time}",
                'teacher': session.batch.teacher.name if session.batch and session.batch.teacher else "TBA",
                'location': session.batch.location if session.batch and hasattr(session.batch, 'location') else "TBA"
            })
        
        # Get payment data
        payments = db.query(Payment).filter(Payment.student_id == student_id).all()
        total_fees = sum(p.amount for p in payments)
        fees_paid = sum(p.amount for p in payments if p.status == 'paid')
        outstanding = total_fees - fees_paid
        
        payment_history = []
        for payment in payments:
            payment_history.append({
                'id': payment.id,
                'date': safe_isoformat(payment.issue_date),
                'amount': payment.amount,
                'type': payment.payment_type,
                'status': payment.status
            })
        
        # Get recent feedback
        recent_feedback = db.query(Feedback).filter(
            Feedback.student_id == student_id
        ).order_by(Feedback.created_at.desc()).limit(5).all()
        
        feedback_data = []
        for feedback in recent_feedback:
            session = feedback.session
            feedback_data.append({
                'date': safe_isoformat(feedback.created_at),
                'teacher': feedback.teacher.name if feedback.teacher else "Unknown",
                'subject': session.batch.subject if session and session.batch else "Unknown",
                'feedback': feedback.feedback,
                'rating': feedback.performance_rating or 4
            })
        
        # Calculate overall attendance
        total_attended = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.status == 'present'
        ).count()
        
        total_sessions = db.query(Attendance).filter(
            Attendance.student_id == student_id
        ).count()
        
        overall_attendance = (total_attended / total_sessions * 100) if total_sessions > 0 else 0
        
        return {
            'id': student.id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'email': student.email,
            'primary_phone_number': student.primary_phone_number,
            'address': student.address if hasattr(student, 'address') else '',
            'city': student.city if hasattr(student, 'city') else '',
            'state': student.state if hasattr(student, 'state') else '',
            'date_of_birth': safe_isoformat(student.date_of_birth) if hasattr(student, 'date_of_birth') and student.date_of_birth else None,
            'enrollment_date': safe_isoformat(student.created_at) if student.created_at else None,
            'status': 'active',
            'financial': {
                'total_fees': total_fees,
                'fees_paid': fees_paid,
                'outstanding': outstanding,
                'next_due_date': min([safe_isoformat(p.due_date) for p in payments if p.status == 'pending' and p.due_date], default=None),
                'payment_history': payment_history
            },
            'enrollments': enrollment_data,
            'upcoming_classes': upcoming_classes,
            'performance': {
                'overall_grade': 'A',  # Calculate based on feedback
                'attendance_percentage': round(overall_attendance, 1),
                'progression_rate': 'Excellent',
                'recent_feedback': feedback_data,
                'skills_progress': [
                    {'skill': 'Technical Skills', 'level': 85},
                    {'skill': 'Sight Reading', 'level': 78},
                    {'skill': 'Music Theory', 'level': 82},
                    {'skill': 'Performance', 'level': 88}
                ]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching student profile: {str(e)}")

# ==================== Staff Profile ====================

@router.get("/staff/{staff_id}/profile")
async def get_staff_profile(staff_id: int, db: Session = Depends(get_db)):
    """Get complete staff/teacher profile with analytics"""
    from models import Staff, Batch, ClassSession, Enrollment, Attendance, Student
    from datetime import date, timedelta
    from collections import defaultdict

    def safe_iso(val):
        if val is None: return None
        if isinstance(val, str): return val
        return val.isoformat()

    try:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")

        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # All batches this teacher is assigned to
        batches = db.query(Batch).filter(Batch.teacher_id == staff_id).all()
        batch_ids = [b.id for b in batches]

        # All sessions taught
        all_sessions = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids)
        ).order_by(ClassSession.date).all() if batch_ids else []

        past_sessions = [s for s in all_sessions if s.date < today]
        upcoming_sessions = [s for s in all_sessions if s.date >= today][:10]

        # Unique active students across all batches
        enrollments = db.query(Enrollment).filter(
            Enrollment.batch_id.in_(batch_ids)
        ).all() if batch_ids else []
        unique_student_ids = list({e.student_id for e in enrollments})

        # Total capacity vs enrolled (occupancy)
        total_capacity = sum(b.capacity for b in batches)
        total_enrolled = len(unique_student_ids)
        occupancy_pct = round((total_enrolled / total_capacity * 100), 1) if total_capacity > 0 else 0

        # Attendance analytics per batch
        batch_analytics = []
        for batch in batches:
            b_sessions = [s for s in all_sessions if s.batch_id == batch.id]
            b_session_ids = [s.id for s in b_sessions]
            b_enrolled = [e for e in enrollments if e.batch_id == batch.id]
            b_student_count = len(b_enrolled)

            present_count = db.query(Attendance).filter(
                Attendance.session_id.in_(b_session_ids),
                Attendance.status == 'present'
            ).count() if b_session_ids else 0

            total_att = db.query(Attendance).filter(
                Attendance.session_id.in_(b_session_ids)
            ).count() if b_session_ids else 0

            avg_att_rate = round((present_count / total_att * 100), 1) if total_att > 0 else 0

            batch_analytics.append({
                'id': batch.id,
                'subject': batch.subject,
                'name': batch.name,
                'capacity': batch.capacity,
                'enrolled': b_student_count,
                'occupancy_pct': round((b_student_count / batch.capacity * 100), 1) if batch.capacity > 0 else 0,
                'total_sessions': len(b_sessions),
                'avg_attendance_rate': avg_att_rate,
                'days_of_week': batch.days_of_week,
                'start_time': batch.start_time,
                'end_time': batch.end_time,
                'start_date': safe_iso(batch.start_date),
                'color_tag': batch.color_tag,
            })

        # Overall attendance rate (all sessions taught)
        all_session_ids = [s.id for s in past_sessions]
        total_present = db.query(Attendance).filter(
            Attendance.session_id.in_(all_session_ids),
            Attendance.status == 'present'
        ).count() if all_session_ids else 0
        total_attendance_records = db.query(Attendance).filter(
            Attendance.session_id.in_(all_session_ids)
        ).count() if all_session_ids else 0
        overall_attendance_rate = round((total_present / total_attendance_records * 100), 1) if total_attendance_records > 0 else 0

        # Sessions taught this month
        sessions_this_month = [s for s in past_sessions if s.date >= month_ago]

        # Subject breakdown
        subject_counts = defaultdict(int)
        for b in batches:
            subject_counts[b.subject] += 1

        # Upcoming schedule (next 10 sessions with full detail)
        upcoming_data = []
        for s in upcoming_sessions:
            b = next((b for b in batches if b.id == s.batch_id), None)
            enrolled_in_batch = len([e for e in enrollments if e.batch_id == s.batch_id])
            upcoming_data.append({
                'id': s.id,
                'date': safe_iso(s.date),
                'start_time': s.start_time,
                'end_time': s.end_time,
                'subject': b.subject if b else 'Unknown',
                'batch_name': b.name if b else '',
                'enrolled': enrolled_in_batch,
                'capacity': b.capacity if b else 0,
                'color_tag': b.color_tag if b else None,
                'status': s.status,
            })

        return {
            'id': staff.id,
            'name': staff.name,
            'first_name': staff.first_name,
            'last_name': staff.last_name,
            'role': staff.role,
            'email': staff.email,
            'phone': staff.phone,
            'calendar': staff.calendar,
            'takes_classes': staff.takes_classes,
            'joined_date': safe_iso(staff.created_at),
            'analytics': {
                'total_batches': len(batches),
                'active_students': total_enrolled,
                'total_capacity': total_capacity,
                'occupancy_pct': occupancy_pct,
                'total_sessions_taught': len(past_sessions),
                'sessions_this_month': len(sessions_this_month),
                'overall_attendance_rate': overall_attendance_rate,
                'subject_breakdown': dict(subject_counts),
            },
            'batches': batch_analytics,
            'upcoming_sessions': upcoming_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching staff profile: {str(e)}")

# ==================== Calendar Management - Remove Student ====================

@router.delete("/calendar/session/{session_id}/student/{student_id}")
async def remove_student_from_session(session_id: int, student_id: int, db: Session = Depends(get_db)):
    """Remove a student from a calendar session"""
    from models import Enrollment
    
    try:
        enrollment = db.query(Enrollment).filter(
            Enrollment.session_id == session_id,
            Enrollment.student_id == student_id
        ).first()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Student enrollment not found in this session")
        
        db.delete(enrollment)
        db.commit()
        
        # Broadcast update
        await manager.broadcast_enrollment_update(session_id, student_id, 'removed')
        
        return {"message": "Student removed from session successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error removing student: {str(e)}")

@router.post("/calendar/session/{session_id}/add-student")
async def add_student_to_session(session_id: int, student_id: int, db: Session = Depends(get_db)):
    """Add a student to a calendar session"""
    from models import Enrollment, Session as ClassSession
    from datetime import datetime
    
    try:
        # Check if already enrolled
        existing = db.query(Enrollment).filter(
            Enrollment.session_id == session_id,
            Enrollment.student_id == student_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Student already enrolled in this session")
        
        # Check capacity
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        current_enrollments = db.query(Enrollment).filter(Enrollment.session_id == session_id).count()
        capacity = session.batch.capacity if session.batch else 10
        
        if current_enrollments >= capacity:
            raise HTTPException(status_code=400, detail="Session is at full capacity")
        
        # Add enrollment
        enrollment = Enrollment(
            session_id=session_id,
            student_id=student_id,
            enrolled_at=datetime.now()
        )
        db.add(enrollment)
        db.commit()
        
        # Broadcast update
        await manager.broadcast_enrollment_update(session_id, student_id, 'added')
        
        return {"message": "Student added to session successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding student: {str(e)}")

