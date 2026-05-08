"""
Student routes for enhanced attendance filtering and class cancellations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from datetime import datetime, timedelta, date
from database import get_db
from models import Attendance, ClassSession, ClassCancellation, CancellationRule, Student
from curriculum_schemas import (
    AttendanceFilterRequest,
    AttendanceStatsResponse,
    ClassCancellationCreate,
    ClassCancellationResponse
)
from schemas import AttendanceResponse

router = APIRouter(prefix="/student", tags=["student"])

# ==================== Enhanced Attendance Filtering ====================

@router.post("/{student_id}/attendance/filter", response_model=List[AttendanceResponse])
async def get_filtered_attendance(
    student_id: int,
    filter_request: AttendanceFilterRequest,
    db: Session = Depends(get_db)
):
    """Get student attendance with advanced filtering"""
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    
    # Calculate date range based on filter type
    today = date.today()
    
    if filter_request.filter_type == "last30days":
        start_date = today - timedelta(days=30)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= today
        )
    
    elif filter_request.filter_type == "week":
        # Current week (Monday to Sunday)
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    
    elif filter_request.filter_type == "month":
        # Current month
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    
    elif filter_request.filter_type == "quarter":
        # Current quarter
        quarter = (today.month - 1) // 3
        start_month = quarter * 3 + 1
        start_date = today.replace(month=start_month, day=1)
        
        if start_month + 2 == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=start_month + 3, day=1) - timedelta(days=1)
        
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    
    elif filter_request.filter_type == "custom":
        if not filter_request.start_date or not filter_request.end_date:
            raise HTTPException(status_code=400, detail="Custom filter requires start_date and end_date")
        
        query = query.join(ClassSession).filter(
            ClassSession.date >= filter_request.start_date,
            ClassSession.date <= filter_request.end_date
        )
    
    # For "alltime", no date filter is applied
    
    return query.order_by(Attendance.created_at.desc()).all()

@router.get("/{student_id}/attendance/stats")
async def get_attendance_stats(
    student_id: int,
    filter_type: str = "alltime",
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    """Get attendance statistics for a student"""
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    
    # Apply same filtering logic as above
    today = date.today()
    
    if filter_type == "last30days":
        start_date = today - timedelta(days=30)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= today
        )
    elif filter_type == "week":
        start_date = today - timedelta(days=today.weekday())
        end_date = start_date + timedelta(days=6)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    elif filter_type == "month":
        start_date = today.replace(day=1)
        if today.month == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    elif filter_type == "quarter":
        quarter = (today.month - 1) // 3
        start_month = quarter * 3 + 1
        start_date = today.replace(month=start_month, day=1)
        if start_month + 2 == 12:
            end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = today.replace(month=start_month + 3, day=1) - timedelta(days=1)
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    elif filter_type == "custom" and start_date and end_date:
        query = query.join(ClassSession).filter(
            ClassSession.date >= start_date,
            ClassSession.date <= end_date
        )
    
    all_records = query.all()
    total_classes = len(all_records)
    present = len([r for r in all_records if r.status == 'present'])
    absent = len([r for r in all_records if r.status == 'absent'])
    with_feedback = len([r for r in all_records if r.notes and len(r.notes) > 0])
    
    attendance_percentage = (present / total_classes * 100) if total_classes > 0 else 0
    
    return {
        "total_classes": total_classes,
        "present": present,
        "absent": absent,
        "attendance_percentage": round(attendance_percentage, 2),
        "with_feedback": with_feedback
    }

# ==================== Class Cancellation and Rescheduling ====================

@router.post("/{student_id}/sessions/{session_id}/cancel")
async def cancel_session(
    student_id: int,
    session_id: int,
    reason: str = None,
    db: Session = Depends(get_db)
):
    """Cancel only this student's attendance for a session (does NOT cancel the slot for others)."""
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Mark personal attendance as student_cancelled — other students are unaffected
    att = db.query(Attendance).filter(
        Attendance.session_id == session_id,
        Attendance.student_id == student_id,
    ).first()
    note_text = reason or "Cancelled by student"
    if att:
        att.status = "student_cancelled"
        att.notes = note_text
    else:
        db.add(Attendance(
            session_id=session_id,
            student_id=student_id,
            status="student_cancelled",
            notes=note_text,
        ))

    # Audit log
    db.add(ClassCancellation(
        student_id=student_id,
        session_id=session_id,
        cancellation_type="cancel",
        reason=note_text,
        requested_at=datetime.now(),
    ))
    db.commit()

    return {"success": True, "message": "Your class has been cancelled", "session_id": session_id}

@router.post("/reschedule-request")
async def request_reschedule(
    original_session_id: int,
    new_session_id: int,
    student_id: int,
    reason: str = None,
    db: Session = Depends(get_db)
):
    """Request to reschedule a session"""
    # Verify both sessions exist
    original_session = db.query(ClassSession).filter(ClassSession.id == original_session_id).first()
    new_session = db.query(ClassSession).filter(ClassSession.id == new_session_id).first()
    
    if not original_session or not new_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Log the reschedule request
    reschedule = ClassCancellation(
        student_id=student_id,
        session_id=original_session_id,
        cancellation_type="reschedule",
        reason=reason,
        requested_at=datetime.now()
    )
    db.add(reschedule)
    db.commit()
    
    return {
        "success": True,
        "message": "Reschedule request submitted successfully",
        "original_session_id": original_session_id,
        "new_session_id": new_session_id
    }

@router.get("/{student_id}/sessions")
async def get_student_sessions(
    student_id: int,
    start: date,
    end: date,
    db: Session = Depends(get_db)
):
    """Get all sessions for a student in a date range with full batch/teacher info embedded."""
    from models import Batch, Enrollment

    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    batch_ids = [e.batch_id for e in enrollments]

    sessions = db.query(ClassSession).filter(
        ClassSession.batch_id.in_(batch_ids),
        ClassSession.date >= start,
        ClassSession.date <= end,
        ClassSession.is_published != False,
    ).all()

    result = []
    for s in sessions:
        batch = s.batch
        teacher = batch.teacher if batch else None

        # Student's personal attendance for this session
        att = db.query(Attendance).filter(
            Attendance.session_id == s.id,
            Attendance.student_id == student_id,
        ).first()

        result.append({
            "id": s.id,
            "date": s.date.isoformat() if s.date else None,
            "start_time": str(s.start_time) if s.start_time else None,
            "end_time": str(s.end_time) if s.end_time else None,
            "status": s.status or "scheduled",
            "recurrence_id": s.recurrence_id,
            "batch_id": s.batch_id,
            "my_attendance": att.status if att else None,
            "my_attendance_notes": att.notes if att else None,
            "batch": {
                "id": batch.id,
                "name": batch.name,
                "subject": batch.subject,
                "capacity": batch.capacity,
                "teacher": {
                    "id": teacher.id,
                    "name": teacher.name,
                } if teacher else None,
            } if batch else None,
        })
    return result

@router.get("/{student_id}/teacher-availability")
async def get_teacher_availability(
    student_id: int,
    start: date,
    end: date,
    db: Session = Depends(get_db)
):
    """Get teacher availability for rescheduling"""
    from models import Batch, Enrollment
    
    # Get student's enrollments to find their teachers
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    batch_ids = [e.batch_id for e in enrollments]
    batches = db.query(Batch).filter(Batch.id.in_(batch_ids)).all()
    teacher_ids = list(set([b.teacher_id for b in batches if b.teacher_id]))
    
    # Get all sessions from these teachers
    teacher_sessions = db.query(ClassSession).join(Batch).filter(
        Batch.teacher_id.in_(teacher_ids),
        ClassSession.date >= start,
        ClassSession.date <= end,
        ClassSession.status == "scheduled"
    ).all()
    
    return {
        "sessions": teacher_sessions,
        "teachers": teacher_ids
    }

@router.get("/{student_id}/attendance")
async def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get all attendance records with session + batch context for the student portal."""
    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    result = []
    for a in records:
        session = a.session
        batch = session.batch if session else None
        result.append({
            "id": a.id,
            "session_id": a.session_id,
            "student_id": a.student_id,
            "status": a.status,
            "notes": a.notes,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "session": {
                "id": session.id,
                "date": session.date.isoformat() if session.date else None,
                "start_time": str(session.start_time) if session.start_time else None,
                "end_time": str(session.end_time) if session.end_time else None,
                "batch": {
                    "subject": batch.subject,
                    "name": batch.name,
                } if batch else None,
            } if session else None,
        })
    return result

# ==================== Student Calendar & Real-Time Updates ====================

@router.get("/{student_id}/calendar")
async def get_student_calendar(
    student_id: int,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get student's complete calendar showing all enrolled sessions
    This is what students see in their portal
    """
    from models import Enrollment, Batch, Staff
    from datetime import datetime
    
    try:
        # Parse dates
        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            # Default to current month
            today = date.today()
            start = today.replace(day=1)
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        
        # Get all enrollments for this student
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id
        ).all()
        
        # Get all sessions from enrolled batches within date range
        sessions_data = []
        for enrollment in enrollments:
            # Get sessions for this batch
            sessions = db.query(ClassSession).filter(
                ClassSession.batch_id == enrollment.batch_id,
                ClassSession.date >= start,
                ClassSession.date <= end
            ).all()
            
            for session in sessions:
                batch = enrollment.batch
                if not batch:
                    continue
                    
                # Get teacher info
                teacher = batch.teacher
                teacher_name = f"{teacher.first_name} {teacher.last_name}" if teacher else "TBA"
                
                # Get enrollment count for this session
                enrollment_count = db.query(Enrollment).filter(
                    Enrollment.session_id == session.id
                ).count()
                
                # Check if student has attendance for this session
                attendance = db.query(Attendance).filter(
                    Attendance.session_id == session.id,
                    Attendance.student_id == student_id
                ).first()
                
                sessions_data.append({
                    'id': session.id,
                    'title': batch.subject or batch.name,
                    'subject': batch.subject,
                    'batch_name': batch.name,
                    'date': session.date.isoformat(),
                    'start_time': str(session.start_time),
                    'end_time': str(session.end_time),
                    'teacher_id': batch.teacher_id,
                    'teacher_name': teacher_name,
                    'location': batch.location if hasattr(batch, 'location') else 'TBA',
                    'status': session.status if hasattr(session, 'status') else 'scheduled',
                    'batch_id': batch.id,
                    'enrollment_count': enrollment_count,
                    'capacity': batch.capacity if batch.capacity else 10,
                    'attendance_status': attendance.status if attendance else None,
                    'is_enrolled': True  # Since we're querying from enrollments
                })
        
        return {
            'sessions': sessions_data,
            'student_id': student_id,
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'total_sessions': len(sessions_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching student calendar: {str(e)}")

@router.get("/{student_id}/enrolled-sessions")
async def get_enrolled_sessions(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all sessions the student is currently enrolled in (for checking enrollment status)
    """
    from models import Enrollment
    
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).all()
    
    session_ids = []
    for enrollment in enrollments:
        if enrollment.session_id:
            session_ids.append(enrollment.session_id)
        elif enrollment.batch_id:
            # Get all sessions for this batch
            sessions = db.query(ClassSession).filter(
                ClassSession.batch_id == enrollment.batch_id
            ).all()
            session_ids.extend([s.id for s in sessions])
    
    return {
        'student_id': student_id,
        'enrolled_session_ids': list(set(session_ids)),
        'total_enrollments': len(enrollments)
    }

# ── Reschedule: get instructor slots for a date ────────────────────────────

@router.get("/{student_id}/instructor-slots")
async def get_instructor_slots(
    student_id: int,
    session_id: int,
    slot_date: date,
    db: Session = Depends(get_db)
):
    """Return all available slots from the session's instructor on slot_date (for rescheduling)."""
    from models import Batch, Enrollment, Staff

    original = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Session not found")

    batch = original.batch
    instructor_id = batch.teacher_id if batch else None
    if not instructor_id:
        return []

    sessions = db.query(ClassSession).join(Batch).filter(
        Batch.teacher_id == instructor_id,
        ClassSession.date == slot_date,
        ClassSession.status == "scheduled",
        ClassSession.is_published != False,
        ClassSession.id != session_id,
    ).all()

    result = []
    for s in sessions:
        count = db.query(Enrollment).filter(Enrollment.batch_id == s.batch_id).count()
        cap = s.batch.capacity if s.batch else 10
        teacher = s.batch.teacher if s.batch else None
        result.append({
            "id": s.id,
            "date": s.date.isoformat(),
            "start_time": str(s.start_time),
            "end_time": str(s.end_time),
            "subject": s.batch.subject if s.batch else "",
            "batch_name": s.batch.name if s.batch else "",
            "batch_id": s.batch_id,
            "teacher_name": teacher.name if teacher else "TBA",
            "enrollment_count": count,
            "capacity": cap,
            "available_slots": max(0, cap - count),
            "is_fully_booked": count >= cap,
        })
    return result


@router.post("/{student_id}/do-reschedule")
async def do_reschedule(
    student_id: int,
    original_session_id: int,
    new_session_id: int,
    reason: str = None,
    db: Session = Depends(get_db)
):
    """Move student from one session to another and sync across all portals."""
    from models import Enrollment

    original = db.query(ClassSession).filter(ClassSession.id == original_session_id).first()
    new_s = db.query(ClassSession).filter(ClassSession.id == new_session_id).first()
    if not original or not new_s:
        raise HTTPException(status_code=404, detail="Session not found")

    # Capacity guard
    count = db.query(Enrollment).filter(Enrollment.batch_id == new_s.batch_id).count()
    cap = new_s.batch.capacity if new_s.batch else 10
    if count >= cap:
        raise HTTPException(status_code=400, detail="That slot is fully booked")

    # Enroll student in new batch (single session type)
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.batch_id == new_s.batch_id,
    ).first()
    if not existing:
        db.add(Enrollment(
            student_id=student_id,
            batch_id=new_s.batch_id,
            enrollment_type="single_session",
        ))

    # Log with new_session_id for full audit trail
    log = ClassCancellation(
        student_id=student_id,
        session_id=original_session_id,
        new_session_id=new_session_id,
        cancellation_type="reschedule",
        reason=reason or "Rescheduled by student",
        requested_at=datetime.now(),
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": "Class rescheduled successfully", "new_session_id": new_session_id}


@router.get("/{student_id}/upcoming-sessions")
async def get_upcoming_sessions(
    student_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get upcoming sessions for a student"""
    from models import Enrollment, Batch
    
    try:
        today = date.today()
        
        # Get enrollments
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id
        ).all()
        
        batch_ids = [e.batch_id for e in enrollments]
        
        # Get upcoming sessions
        upcoming = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids),
            ClassSession.date >= today
        ).order_by(ClassSession.date, ClassSession.start_time).limit(limit).all()
        
        sessions_data = []
        for session in upcoming:
            batch = session.batch
            if not batch:
                continue
            
            teacher = batch.teacher
            teacher_name = f"{teacher.first_name} {teacher.last_name}" if teacher else "TBA"
            
            sessions_data.append({
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': str(session.start_time),
                'end_time': str(session.end_time),
                'subject': batch.subject,
                'batch_name': batch.name,
                'teacher_name': teacher_name,
                'location': batch.location if hasattr(batch, 'location') else 'TBA'
            })
        
        return {
            'upcoming_sessions': sessions_data,
            'count': len(sessions_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching upcoming sessions: {str(e)}")
