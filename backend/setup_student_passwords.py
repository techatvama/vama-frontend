"""
Quick script to set passwords for existing students
"""
from database import get_db
from models import Student
import crud

db = next(get_db())

# Get all students
students = db.query(Student).all()

print(f"Found {len(students)} students")
print("\nSetting password 'student123' for all students without passwords...\n")

updated_count = 0
for student in students:
    if not student.password_hash:
        # Set default password
        student.password_hash = crud.get_password_hash("student123")
        updated_count += 1
        print(f"✅ Set password for: {student.email}")
    else:
        print(f"⏭️  Already has password: {student.email}")

db.commit()

print(f"\n✅ Updated {updated_count} students")
print("\n" + "="*60)
print("LOGIN CREDENTIALS FOR STUDENT PORTAL:")
print("="*60)

for student in db.query(Student).all():
    print(f"\nEmail: {student.email}")
    print(f"Password: student123")
    print(f"Name: {student.first_name} {student.last_name}")
    print("-" * 40)

print("\n✨ All students can now login with password: student123")
