"""Make grade_id and subject_id optional in exam_sessions table."""
from sqlalchemy import create_engine, text
from database import DATABASE_URL

def run():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        for col in ("grade_id", "subject_id"):
            try:
                conn.execute(text(f"ALTER TABLE exam_sessions ALTER COLUMN {col} DROP NOT NULL"))
                conn.commit()
                print(f"✅ {col} is now nullable")
            except Exception as e:
                print(f"⚠️  {col}: {e}")
    print("Done.")

if __name__ == "__main__":
    run()
