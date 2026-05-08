from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from models import Staff

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_staff():
    db = SessionLocal()
    staff_members = db.query(Staff).all()
    print(f"Found {len(staff_members)} staff members:")
    for s in staff_members:
        print(f"ID: {s.id}, Name: {s.name}, Email: {s.email}, Role: {s.role}, HasPassword: {bool(s.password_hash)}")
    db.close()

if __name__ == "__main__":
    check_staff()
