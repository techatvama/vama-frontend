from sqlalchemy import text
from database import engine

def migrate():
    # List of new columns to add: (name, type)
    new_columns = [
        ("date_of_birth", "VARCHAR"),
        ("gender", "VARCHAR"),
        ("address", "VARCHAR"),
        ("city", "VARCHAR"),
        ("state", "VARCHAR"),
        ("state_code", "VARCHAR"),
        ("desired_course", "VARCHAR"),
        ("class_frequency", "VARCHAR"),
        ("nearest_vama_center", "VARCHAR"),
        ("preferred_mode_of_contact", "VARCHAR"),
        ("parent_name", "VARCHAR"),
        ("emergency_contact", "VARCHAR"),
        ("blood_group", "VARCHAR"),
        ("allergies", "VARCHAR"),
        ("referrer", "VARCHAR")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                # Attempt to add column. This will fail if it exists, which is fine to catch or ignore.
                # safely wrap in try/except for existence check equivalent
                print(f"Adding column {col_name}...")
                conn.execute(text(f"ALTER TABLE students ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"✅ Added {col_name}")
            except Exception as e:
                # In some DB versions IF NOT EXISTS might not ensure silence, or other errors.
                # But for Postgres it is supported.
                print(f"⚠️ Could not add {col_name} (might exist): {e}")
        
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
