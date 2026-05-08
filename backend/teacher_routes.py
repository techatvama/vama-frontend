"""
Teacher routes for viewing assigned sessions and managing classes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from datetime import datetime, timedelta, date
from database import get_db
from models import ClassSession, Batch, Enrollment, Attendance, Staff, Student, Feedback

router = APIRouter(prefix="/teacher", tags=["teacher"])

# ==================== Teacher Calendar & Sessions ====================

@router.get("/{teacher_id}/calendar")
async def get_teacher_calendar(
    teacher_id: int,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get teacher's complete calendar showing all assigned sessions
    This is what teachers see in their portal
    """
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
        
        # Get all batches assigned to this teacher
        batches = db.query(Batch).filter(Batch.teacher_id == teacher_id).all()
        batch_ids = [b.id for b in batches]
        
        # Get all sessions for these batches within date range (unpublished still visible to teachers)
        sessions = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids),
            ClassSession.date >= start,
            ClassSession.date <= end
        ).order_by(ClassSession.date, ClassSession.start_time).all()
        
        sessions_data = []
        for session in sessions:
            batch = session.batch
            if not batch:
                continue
            
            # Get enrollment count
            enrollment_count = db.query(Enrollment).filter(
                Enrollment.batch_id == batch.id
            ).count()
            
            # Get attendance stats for this session
            total_attendance = db.query(Attendance).filter(
                Attendance.session_id == session.id
            ).count()
            
            present_count = db.query(Attendance).filter(
                Attendance.session_id == session.id,
                Attendance.status == 'present'
            ).count()
            
            absent_count = db.query(Attendance).filter(
                Attendance.session_id == session.id,
                Attendance.status == 'absent'
            ).count()
            
            sessions_data.append({
                'id': session.id,
                'title': batch.subject or batch.name,
                'subject': batch.subject,
                'batch_name': batch.name,
                'date': session.date.isoformat(),
                'start_time': str(session.start_time),
                'end_time': str(session.end_time),
                'batch_id': batch.id,
                'location': batch.location if hasattr(batch, 'location') else 'TBA',
                'status': session.status if hasattr(session, 'status') else 'scheduled',
                'is_published': getattr(session, 'is_published', True),
                'enrollment_count': enrollment_count,
                'capacity': batch.capacity if batch.capacity else 10,
                'attendance_marked': total_attendance,
                'present_count': present_count,
                'absent_count': absent_count,
                'attendance_pending': enrollment_count - total_attendance
            })
        
        return {
            'sessions': sessions_data,
            'teacher_id': teacher_id,
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'total_sessions': len(sessions_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teacher calendar: {str(e)}")

@router.get("/{teacher_id}/upcoming-sessions")
async def get_teacher_upcoming_sessions(
    teacher_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get upcoming sessions for a teacher"""
    try:
        today = date.today()
        
        # Get batches
        batches = db.query(Batch).filter(Batch.teacher_id == teacher_id).all()
        batch_ids = [b.id for b in batches]
        
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
            
            # Get enrollment count
            enrollment_count = db.query(Enrollment).filter(
                Enrollment.batch_id == batch.id
            ).count()
            
            sessions_data.append({
                'id': session.id,
                'date': session.date.isoformat(),
                'start_time': str(session.start_time),
                'end_time': str(session.end_time),
                'subject': batch.subject,
                'batch_name': batch.name,
                'location': batch.location if hasattr(batch, 'location') else 'TBA',
                'enrollment_count': enrollment_count
            })
        
        return {
            'upcoming_sessions': sessions_data,
            'count': len(sessions_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching upcoming sessions: {str(e)}")

@router.get("/{teacher_id}/session/{session_id}/students")
async def get_session_students(
    teacher_id: int,
    session_id: int,
    db: Session = Depends(get_db)
):
    """Get list of students enrolled in a specific session"""
    try:
        session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Verify teacher owns this session
        if session.batch.teacher_id != teacher_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
        # Get enrollments for this batch
        enrollments = db.query(Enrollment).filter(
            Enrollment.batch_id == session.batch_id
        ).all()
        
        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            if not student:
                continue
            
            # Get attendance for this session
            attendance = db.query(Attendance).filter(
                Attendance.session_id == session_id,
                Attendance.student_id == student.id
            ).first()
            
            # Get feedback for this session
            feedback = db.query(Feedback).filter(
                Feedback.session_id == session_id,
                Feedback.student_id == student.id
            ).first()
            
            students_data.append({
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'attendance_status': attendance.status if attendance else None,
                'has_feedback': bool(feedback),
                'feedback_text': feedback.feedback if feedback else None,
                'syllabus_covered': feedback.syllabus_covered if feedback else None
            })
        
        return {
            'session_id': session_id,
            'students': students_data,
            'total_students': len(students_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session students: {str(e)}")

@router.get("/{teacher_id}/batches")
async def get_teacher_batches(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get all batches assigned to a teacher"""
    try:
        batches = db.query(Batch).filter(Batch.teacher_id == teacher_id).all()
        
        batches_data = []
        for batch in batches:
            # Get enrollment count
            enrollment_count = db.query(Enrollment).filter(
                Enrollment.batch_id == batch.id
            ).count()
            
            # Get total sessions
            session_count = db.query(ClassSession).filter(
                ClassSession.batch_id == batch.id
            ).count()
            
            batches_data.append({
                'id': batch.id,
                'name': batch.name,
                'subject': batch.subject,
                'capacity': batch.capacity if batch.capacity else 10,
                'enrollment_count': enrollment_count,
                'session_count': session_count,
                'start_date': batch.start_date.isoformat() if batch.start_date else None
            })
        
        return {
            'batches': batches_data,
            'total_batches': len(batches_data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teacher batches: {str(e)}")

@router.get("/{teacher_id}/stats")
async def get_teacher_stats(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    """Get teacher statistics"""
    try:
        # Get batches
        batches = db.query(Batch).filter(Batch.teacher_id == teacher_id).all()
        batch_ids = [b.id for b in batches]
        
        # Total students across all batches
        total_students = db.query(Enrollment).filter(
            Enrollment.batch_id.in_(batch_ids)
        ).distinct(Enrollment.student_id).count()
        
        # Total sessions
        total_sessions = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids)
        ).count()
        
        # Upcoming sessions
        upcoming_sessions = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids),
            ClassSession.date >= date.today()
        ).count()
        
        # Sessions taught (past)
        sessions_taught = db.query(ClassSession).filter(
            ClassSession.batch_id.in_(batch_ids),
            ClassSession.date < date.today()
        ).count()
        
        return {
            'teacher_id': teacher_id,
            'total_batches': len(batches),
            'total_students': total_students,
            'total_sessions': total_sessions,
            'upcoming_sessions': upcoming_sessions,
            'sessions_taught': sessions_taught
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teacher stats: {str(e)}")
