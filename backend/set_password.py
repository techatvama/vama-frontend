from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from models import Staff
import bcrypt

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def set_staff_password(email, password):
    db = SessionLocal()
    staff = db.query(Staff).filter(Staff.email == email).first()
    if staff:
        # Passlib bcrypt hashes look like $2b$12$...
        # Standard bcrypt.hashpw returns bytes like b'$2b$12$...'
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        staff.password_hash = hashed.decode('utf-8')
        db.commit()
        print(f"Password set for {email}")
    else:
        print(f"Staff with email {email} not found")
    db.close()

if __name__ == "__main__":
    set_staff_password("yadavvignesh.k@gmail.com", "vama123")
