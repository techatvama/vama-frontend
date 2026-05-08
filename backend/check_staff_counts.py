from database import SessionLocal
from models import Staff

def check_staff_counts():
    db = SessionLocal()
    try:
        all_staff = db.query(Staff).all()
        print(f"Total staff: {len(all_staff)}")
        for s in all_staff:
            print(f"ID: {s.id}, Role: '{s.role}'")
        
        teachers = db.query(Staff).filter(Staff.role == 'Teacher').count()
        print(f"Count with role 'Teacher': {teachers}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_staff_counts()
