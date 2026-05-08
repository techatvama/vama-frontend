from sqlalchemy.orm import Session
from database import SessionLocal
from crud import update_student, get_student_by_email
from schemas import StudentUpdate

def set_student_password(email, password):
    db = SessionLocal()
    try:
        student = get_student_by_email(db, email)
        if not student:
            print(f"Student {email} not found")
            return
        
        update_data = StudentUpdate(password=password)
        update_student(db, student.id, update_data)
        print(f"Password set for {email}")
    finally:
        db.close()

if __name__ == "__main__":
    # Assuming there's a student with this email for testing
    set_student_password("vignesh@example.com", "student123")
