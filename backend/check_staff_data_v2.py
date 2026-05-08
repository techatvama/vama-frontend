from database import SessionLocal
from models import Staff

def check_staff():
    db = SessionLocal()
    try:
        staff_members = db.query(Staff).all()
        print(f"Total staff members: {len(staff_members)}")
        for s in staff_members:
            print(f"ID: {s.id}")
            print(f"  Name: '{s.name}'")
            print(f"  First Name: '{s.first_name}'")
            print(f"  Last Name: '{s.last_name}'")
            print(f"  Role: '{s.role}'")
            print(f"  Takes Classes: {s.takes_classes}")
            print(f"  Email: {s.email}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_staff()
