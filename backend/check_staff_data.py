from database import SessionLocal
from models import Staff

def check_staff():
    db = SessionLocal()
    try:
        staff_members = db.query(Staff).all()
        print(f"Total staff members: {len(staff_members)}")
        for s in staff_members:
            print(f"ID: {s.id}, Name: {s.name}, Role: {s.role}, Takes Classes: {s.takes_classes}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_staff()
