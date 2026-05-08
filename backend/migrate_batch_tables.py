"""Create batch_enrollments and batch_teachers tables."""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # batch_enrollments
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_name='batch_enrollments'"
        ))
        if result.fetchone():
            print("Table 'batch_enrollments' already exists — skipping.")
        else:
            conn.execute(text("""
                CREATE TABLE batch_enrollments (
                    id SERIAL PRIMARY KEY,
                    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
                    enrolled_from DATE NOT NULL,
                    status VARCHAR DEFAULT 'active',
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            conn.commit()
            print("✓ Created 'batch_enrollments' table.")

        # batch_teachers
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_name='batch_teachers'"
        ))
        if result.fetchone():
            print("Table 'batch_teachers' already exists — skipping.")
        else:
            conn.execute(text("""
                CREATE TABLE batch_teachers (
                    id SERIAL PRIMARY KEY,
                    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
                    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(batch_id, staff_id)
                )
            """))
            conn.commit()
            print("✓ Created 'batch_teachers' table.")

if __name__ == "__main__":
    run()
