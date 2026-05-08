"""Set default password for all staff and students that don't have one.

Default password: Vama@1234
"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from sqlalchemy import text
from crud import get_password_hash

DEFAULT_PASSWORD = "Vama@1234"

def run():
    hashed = get_password_hash(DEFAULT_PASSWORD)

    with engine.connect() as conn:
        # ── Staff ──────────────────────────────────────────────────────────
        staff_rows = conn.execute(text(
            "SELECT id, name, email FROM staff WHERE password_hash IS NULL OR password_hash = ''"
        )).fetchall()

        for row in staff_rows:
            conn.execute(text(
                "UPDATE staff SET password_hash = :h WHERE id = :id"
            ), {"h": hashed, "id": row[0]})
            print(f"  ✓ Staff   | {row[1]:<30} | {row[2]}")

        # ── Students ───────────────────────────────────────────────────────
        student_rows = conn.execute(text(
            "SELECT id, first_name, last_name, email FROM students WHERE password_hash IS NULL OR password_hash = ''"
        )).fetchall()

        for row in student_rows:
            conn.execute(text(
                "UPDATE students SET password_hash = :h WHERE id = :id"
            ), {"h": hashed, "id": row[0]})
            print(f"  ✓ Student | {row[1]} {row[2]:<25} | {row[3]}")

        conn.commit()

    print()
    print(f"Done. Default password set: {DEFAULT_PASSWORD}")
    print(f"Staff updated:   {len(staff_rows)}")
    print(f"Students updated: {len(student_rows)}")

if __name__ == "__main__":
    run()
