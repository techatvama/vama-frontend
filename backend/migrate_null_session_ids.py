"""Migrate Enrollment rows with session_ids=NULL to batch_enrollments.

These rows were created by the old POST /enrollments endpoint (batch-level enrollment).
They matched every session in the batch, causing all students to appear in every class.
We convert them to BatchEnrollment(enrolled_from=batch.start_date) so they still cover
all sessions but go through the correct enrollment source.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # Find all Enrollment rows with session_ids=NULL
        rows = conn.execute(text(
            "SELECT e.id, e.student_id, e.batch_id, b.start_date "
            "FROM enrollments e "
            "JOIN batches b ON b.id = e.batch_id "
            "WHERE e.session_ids IS NULL"
        )).fetchall()

        if not rows:
            print("No NULL session_ids enrollments to migrate.")
            return

        migrated = 0
        skipped = 0
        deleted_ids = []

        for row in rows:
            enrollment_id, student_id, batch_id, start_date = row

            # Check if a batch_enrollment already exists for this student+batch
            existing = conn.execute(text(
                "SELECT id FROM batch_enrollments "
                "WHERE student_id = :sid AND batch_id = :bid"
            ), {"sid": student_id, "bid": batch_id}).fetchone()

            if existing:
                skipped += 1
            else:
                conn.execute(text(
                    "INSERT INTO batch_enrollments (student_id, batch_id, enrolled_from, status) "
                    "VALUES (:sid, :bid, :from_date, 'active')"
                ), {"sid": student_id, "bid": batch_id, "from_date": start_date})
                migrated += 1

            deleted_ids.append(enrollment_id)

        # Delete the old NULL session_ids rows
        if deleted_ids:
            conn.execute(text(
                f"DELETE FROM enrollments WHERE id IN ({','.join(str(i) for i in deleted_ids)})"
            ))

        conn.commit()
        print(f"✓ Migrated {migrated} enrollments → batch_enrollments")
        print(f"  Skipped {skipped} (batch_enrollment already existed)")
        print(f"  Deleted {len(deleted_ids)} old NULL session_ids rows from enrollments")

if __name__ == "__main__":
    run()
