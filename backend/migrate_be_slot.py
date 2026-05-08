"""Add day_of_week + slot_start_time columns to batch_enrollments.

day_of_week   NULL = all days in batch (batch-level enrollment)
              "Saturday" = only sessions on that weekday
slot_start_time  NULL = any time
              "16:00"  = only sessions at that start time
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE batch_enrollments
            ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20) DEFAULT NULL
        """))
        conn.execute(text("""
            ALTER TABLE batch_enrollments
            ADD COLUMN IF NOT EXISTS slot_start_time VARCHAR(10) DEFAULT NULL
        """))
        conn.commit()
    print("Migration complete: day_of_week + slot_start_time added to batch_enrollments")
    print("Existing rows keep NULL (= covers all days/times, unchanged behaviour)")

if __name__ == "__main__":
    run()
