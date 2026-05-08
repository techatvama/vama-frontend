from crud import verify_password
import bcrypt

# Test with a known hash from DB
hashed = "$2b$12$DqXb/FpU4Y6wU9uWfS6GveB6t1uU6S3e6o/v5v5v5v5v5v5v5v5v5" # Dummy
plain = "vama123"

try:
    # Get actual hash for testing
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import os
    from dotenv import load_dotenv
    from models import Staff
    
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    staff = db.query(Staff).filter(Staff.email == "yadavvignesh.k@gmail.com").first()
    if staff:
        print(f"Testing for {staff.email}")
        print(f"Stored hash: {staff.password_hash}")
        result = verify_password(plain, staff.password_hash)
        print(f"Verify result: {result}")
    db.close()
except Exception as e:
    print(f"Error during verification test: {e}")
    import traceback
    traceback.print_exc()
