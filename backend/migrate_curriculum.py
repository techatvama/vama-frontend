"""
Database Migration Script for Curriculum Management System
Adds new tables: subjects, grades, teacher_subject_assignments, exam_sessions,
exam_enrollments, cancellation_rules, class_cancellations
Updates: syllabus table with subject_id and grade_id
"""

from database import engine, SessionLocal
from sqlalchemy import text
import sys

def run_migration():
    db = SessionLocal()
    
    try:
        print("🚀 Starting Curriculum Management System Migration...")
        
        # 1. Create subjects table
        print("\n📚 Creating subjects table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # 2. Create grades table
        print("📊 Creating grades table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS grades (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                level INTEGER NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 3. Create teacher_subject_assignments table
        print("👨‍🏫 Creating teacher_subject_assignments table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
                can_edit_curriculum BOOLEAN DEFAULT TRUE,
                assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(teacher_id, subject_id)
            )
        """))
        
        # 4. Create exam_sessions table
        print("📝 Creating exam_sessions table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS exam_sessions (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                exam_board VARCHAR NOT NULL,
                grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
                subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
                exam_date DATE,
                registration_deadline DATE,
                fee_amount FLOAT DEFAULT 0.0,
                max_students INTEGER,
                is_active BOOLEAN DEFAULT TRUE,
                notes TEXT,
                created_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # 5. Create exam_enrollments table
        print("✍️ Creating exam_enrollments table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS exam_enrollments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                exam_session_id INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
                enrolled_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
                enrollment_status VARCHAR DEFAULT 'enrolled',
                payment_status VARCHAR DEFAULT 'pending',
                enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, exam_session_id)
            )
        """))
        
        # 6. Create cancellation_rules table
        print("📋 Creating cancellation_rules table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS cancellation_rules (
                id SERIAL PRIMARY KEY,
                package_name VARCHAR NOT NULL,
                advance_notice_hours INTEGER DEFAULT 24,
                max_cancellations_per_month INTEGER DEFAULT 2,
                penalty_percentage FLOAT DEFAULT 0.0,
                allows_rescheduling BOOLEAN DEFAULT TRUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 7. Create class_cancellations table
        print("🚫 Creating class_cancellations table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS class_cancellations (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES class_sessions(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                cancellation_type VARCHAR NOT NULL,
                reason TEXT,
                requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR DEFAULT 'pending',
                new_session_id INTEGER REFERENCES class_sessions(id) ON DELETE SET NULL,
                approved_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
                approved_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # 8. Update syllabus table
        print("🔄 Updating syllabus table...")
        try:
            db.execute(text("""
                ALTER TABLE syllabus 
                ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL
            """))
        except Exception as e:
            print(f"   Note: Columns may already exist - {str(e)}")
        
        db.commit()
        
        # 9. Seed initial data
        print("\n🌱 Seeding initial data...")
        
        # Seed subjects
        print("   Adding default subjects...")
        subjects = [
            ('Piano', 'Classical and contemporary piano instruction'),
            ('Guitar', 'Acoustic and electric guitar lessons'),
            ('Vocals', 'Singing and vocal training'),
            ('Drums', 'Percussion and drum kit instruction'),
            ('Violin', 'String instrument - violin'),
            ('Keyboard', 'Electronic keyboard and synthesizer')
        ]
        
        for name, desc in subjects:
            db.execute(text("""
                INSERT INTO subjects (name, description, is_active)
                VALUES (:name, :desc, TRUE)
                ON CONFLICT (name) DO NOTHING
            """), {"name": name, "desc": desc})
        
        # Seed grades
        print("   Adding grade levels...")
        grades = [
            ('Debut', 0, 'Beginner level'),
            ('Grade 1', 1, 'First grade level'),
            ('Grade 2', 2, 'Second grade level'),
            ('Grade 3', 3, 'Third grade level'),
            ('Grade 4', 4, 'Fourth grade level'),
            ('Grade 5', 5, 'Fifth grade level'),
            ('Grade 6', 6, 'Sixth grade level'),
            ('Grade 7', 7, 'Seventh grade level'),
            ('Grade 8', 8, 'Eighth grade level - Advanced')
        ]
        
        for name, level, desc in grades:
            db.execute(text("""
                INSERT INTO grades (name, level, description)
                VALUES (:name, :level, :desc)
                ON CONFLICT DO NOTHING
            """), {"name": name, "level": level, "desc": desc})
        
        # Seed default cancellation rules
        print("   Adding default cancellation rules...")
        rules = [
            ('Monthly', 24, 2, 0.0, True, 'Standard monthly package - 24 hours notice, max 2 cancellations/month'),
            ('Quarterly', 48, 3, 0.0, True, 'Quarterly package - 48 hours notice, max 3 cancellations/month'),
            ('Annual', 72, 4, 0.0, True, 'Annual package - 72 hours notice, max 4 cancellations/month'),
            ('Trial', 12, 1, 10.0, False, 'Trial package - 12 hours notice, max 1 cancellation, 10% penalty, no rescheduling')
        ]
        
        for pkg_name, hours, max_cancel, penalty, allows_reschedule, desc in rules:
            db.execute(text("""
                INSERT INTO cancellation_rules (package_name, advance_notice_hours, max_cancellations_per_month, 
                                                penalty_percentage, allows_rescheduling, description)
                VALUES (:pkg, :hours, :max, :penalty, :reschedule, :desc)
                ON CONFLICT DO NOTHING
            """), {
                "pkg": pkg_name,
                "hours": hours,
                "max": max_cancel,
                "penalty": penalty,
                "reschedule": allows_reschedule,
                "desc": desc
            })
        
        db.commit()
        
        print("\n✅ Migration completed successfully!")
        print("\n📊 Summary:")
        print("   - Created 7 new tables")
        print("   - Updated syllabus table")
        print("   - Seeded 6 subjects")
        print("   - Seeded 9 grade levels")
        print("   - Seeded 4 cancellation rule packages")
        print("\n🎉 Curriculum Management System is ready!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
