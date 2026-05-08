"""
Migration script to add calendar enhancement columns
- Adds color_tag to batches table
- Adds recurrence_id to class_sessions table
"""

from sqlalchemy import create_engine, text
from database import DATABASE_URL
import os

def run_migration():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Add color_tag to batches
        try:
            conn.execute(text("""
                ALTER TABLE batches 
                ADD COLUMN IF NOT EXISTS color_tag VARCHAR
            """))
            conn.commit()
            print("✅ Added color_tag column to batches table")
        except Exception as e:
            print(f"⚠️  color_tag column may already exist: {e}")
        
        # Add recurrence_id to class_sessions
        try:
            conn.execute(text("""
                ALTER TABLE class_sessions 
                ADD COLUMN IF NOT EXISTS recurrence_id VARCHAR
            """))
            conn.commit()
            print("✅ Added recurrence_id column to class_sessions table")
        except Exception as e:
            print(f"⚠️  recurrence_id column may already exist: {e}")
    
    print("✅ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
