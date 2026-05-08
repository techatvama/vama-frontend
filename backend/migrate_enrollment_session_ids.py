"""Add session_ids column to enrollments table.

session_ids stores a JSON array of class_session IDs.
NULL  = recurring enrollment (attends all batch sessions)
[1,5] = single_session enrollment covering only sessions 1 and 5
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='enrollments' AND column_name='session_ids'"
        ))
        if result.fetchone():
            print("Column 'session_ids' already exists — skipping.")
            return

        conn.execute(text(
            "ALTER TABLE enrollments ADD COLUMN session_ids TEXT DEFAULT NULL"
        ))
        conn.commit()
        print("✓ Added 'session_ids' column to enrollments table.")

if __name__ == "__main__":
    run()
