"""
Run database migration to add marked_by and marked_at columns to attendance table
"""
import sys
sys.path.insert(0, '/Users/yadavvignesh/vama-frontend/backend')

from database import engine
from sqlalchemy import text

def run_migration():
    print("Running database migration...")
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            # Add marked_by column
            print("Adding marked_by column to attendance table...")
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='attendance' AND column_name='marked_by'
                    ) THEN
                        ALTER TABLE attendance ADD COLUMN marked_by INTEGER REFERENCES staff(id);
                    END IF;
                END $$;
            """))
            
            # Add marked_at column
            print("Adding marked_at column to attendance table...")
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='attendance' AND column_name='marked_at'
                    ) THEN
                        ALTER TABLE attendance ADD COLUMN marked_at TIMESTAMP WITH TIME ZONE;
                    END IF;
                END $$;
            """))
            
            # Add index
            print("Adding index on marked_by...")
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);
            """))
            
            # Create feedback table
            print("Creating feedback table if not exists...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
                    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                    teacher_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
                    
                    feedback TEXT,
                    syllabus_covered TEXT,
                    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
                    
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            # Add feedback indexes
            print("Adding feedback indexes...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON feedback(student_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_feedback_teacher_id ON feedback(teacher_id);"))
            
            # Commit transaction
            trans.commit()
            print("✅ Migration completed successfully!")
            
            # Verify
            print("\nVerifying attendance table structure...")
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'attendance' 
                AND column_name IN ('marked_by', 'marked_at')
            """))
            for row in result:
                print(f"  ✓ {row[0]}: {row[1]}")
                
            print("\nVerifying feedback table...")
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'feedback'
            """))
            count = result.fetchone()[0]
            if count > 0:
                print(f"  ✓ Feedback table exists")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    run_migration()
