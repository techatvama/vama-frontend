from sqlalchemy import text
from database import engine, Base
import models # ensure models are registered

def migrate():
    # Helper to add a column if it doesn't exist
    def add_col(table, col, col_type):
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column {col} to {table}")
        except Exception as e:
            # Column likely exists
            pass

    # Staff
    add_col("staff", "password_hash", "VARCHAR")

    # Students
    add_col("students", "current_grade", "VARCHAR DEFAULT 'Debut'")
    add_col("students", "syllabus_type", "VARCHAR")
    add_col("students", "is_exam_student", "BOOLEAN DEFAULT FALSE")
    add_col("students", "exam_date", "DATE")
    add_col("students", "password_hash", "VARCHAR")

    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
