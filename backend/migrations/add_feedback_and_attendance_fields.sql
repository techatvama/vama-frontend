"""Add Feedback model and enhance Attendance tracking

This migration:
1. Creates the 'feedback' table for teacher feedback and syllabus tracking
2. Adds 'marked_by' and 'marked_at' columns to 'attendance' table

Run with: psql -U your_user -d your_database -f add_feedback_and_attendance_fields.sql
Or use Alembic: alembic revision --autogenerate -m "Add Feedback and Attendance enhancements"
"""

-- Create feedback table
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

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_teacher_id ON feedback(teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Add columns to attendance table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='attendance' AND column_name='marked_by'
    ) THEN
        ALTER TABLE attendance ADD COLUMN marked_by INTEGER REFERENCES staff(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='attendance' AND column_name='marked_at'
    ) THEN
        ALTER TABLE attendance ADD COLUMN marked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add index on attendance marked_by
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);

-- Add trigger to update feedback.updated_at
CREATE OR REPLACE FUNCTION update_feedback_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_timestamp
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_timestamp();

-- Verify tables
SELECT 'Feedback table created' AS status, COUNT(*) AS row_count FROM feedback;
SELECT 'Attendance table columns added' AS status, 
       column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
  AND column_name IN ('marked_by', 'marked_at');

COMMIT;
