import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    create_engine
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

# -------------------------
# DATABASE CONFIG
# -------------------------
DATABASE_URL = "postgresql+psycopg2://user:password@localhost/dbname"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# -------------------------
# STUDENT
# -------------------------
class Student(Base):
    __tablename__ = "students"

    student_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# STAFF (ADMIN / TEACHER)
# -------------------------
class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'teacher')", name="ck_staff_role"),
    )


# -------------------------
# SYLLABUS
# -------------------------
class Syllabus(Base):
    __tablename__ = "syllabus"

    syllabus_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grade = Column(String(50), nullable=False)
    instrument = Column(String(50), nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# MODULE
# -------------------------
class Module(Base):
    __tablename__ = "modules"

    module_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE"),
        nullable=False
    )
    module_type = Column(String(50), nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# CONTENT
# -------------------------
class Content(Base):
    __tablename__ = "content"

    content_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# STUDENT ↔ SYLLABUS (M:M)
# -------------------------
class StudentSyllabus(Base):
    __tablename__ = "student_syllabus"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("students.student_id", ondelete="CASCADE")
    )
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE")
    )
    enrolled_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "syllabus_id", name="uq_student_syllabus"),
    )


# -------------------------
# SYLLABUS ↔ MODULE (M:M)
# -------------------------
class SyllabusModule(Base):
    __tablename__ = "syllabus_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE")
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.module_id", ondelete="CASCADE")
    )

    __table_args__ = (
        UniqueConstraint("syllabus_id", "module_id", name="uq_syllabus_module"),
    )


# -------------------------
# MODULE ↔ CONTENT (M:M)
# -------------------------
class ModuleContent(Base):
    __tablename__ = "module_content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.module_id", ondelete="CASCADE")
    )
    content_id = Column(
        UUID(as_uuid=True),
        ForeignKey("content.content_id", ondelete="CASCADE")
    )

    __table_args__ = (
        UniqueConstraint("module_id", "content_id", name="uq_module_content"),
    )


# -------------------------
# STUDENT ↔ CONTENT PROGRESS
# -------------------------
class StudentContentProgress(Base):
    __tablename__ = "student_content_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("students.student_id", ondelete="CASCADE")
    )
    content_id = Column(
        UUID(as_uuid=True),
        ForeignKey("content.content_id", ondelete="CASCADE")
    )
    status = Column(String(20), nullable=False, default="pending")
    completed_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed')", name="ck_progress_status"),
        UniqueConstraint("student_id", "content_id", name="uq_student_content"),
    )


# -------------------------
# AUTO DDL EXECUTION
# -------------------------
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    create_engine
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

# -------------------------
# DATABASE CONFIG
# -------------------------
DATABASE_URL = "postgresql+psycopg2://user:password@localhost/dbname"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# -------------------------
# STUDENT
# -------------------------
class Student(Base):
    __tablename__ = "students"

    student_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# STAFF (ADMIN / TEACHER)
# -------------------------
class Staff(Base):
    __tablename__ = "staff"

    staff_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    role = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'teacher')", name="ck_staff_role"),
    )


# -------------------------
# SYLLABUS
# -------------------------
class Syllabus(Base):
    __tablename__ = "syllabus"

    syllabus_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    grade = Column(String(50), nullable=False)
    instrument = Column(String(50), nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# MODULE
# -------------------------
class Module(Base):
    __tablename__ = "modules"

    module_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE"),
        nullable=False
    )
    module_type = Column(String(50), nullable=False)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# CONTENT
# -------------------------
class Content(Base):
    __tablename__ = "content"

    content_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("staff.staff_id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(TIMESTAMP, server_default=func.now())


# -------------------------
# STUDENT ↔ SYLLABUS (M:M)
# -------------------------
class StudentSyllabus(Base):
    __tablename__ = "student_syllabus"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("students.student_id", ondelete="CASCADE")
    )
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE")
    )
    enrolled_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "syllabus_id", name="uq_student_syllabus"),
    )


# -------------------------
# SYLLABUS ↔ MODULE (M:M)
# -------------------------
class SyllabusModule(Base):
    __tablename__ = "syllabus_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    syllabus_id = Column(
        UUID(as_uuid=True),
        ForeignKey("syllabus.syllabus_id", ondelete="CASCADE")
    )
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.module_id", ondelete="CASCADE")
    )

    __table_args__ = (
        UniqueConstraint("syllabus_id", "module_id", name="uq_syllabus_module"),
    )


# -------------------------
# MODULE ↔ CONTENT (M:M)
# -------------------------
class ModuleContent(Base):
    __tablename__ = "module_content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True),
        ForeignKey("modules.module_id", ondelete="CASCADE")
    )
    content_id = Column(
        UUID(as_uuid=True),
        ForeignKey("content.content_id", ondelete="CASCADE")
    )

    __table_args__ = (
        UniqueConstraint("module_id", "content_id", name="uq_module_content"),
    )


# -------------------------
# STUDENT ↔ CONTENT PROGRESS
# -------------------------
class StudentContentProgress(Base):
    __tablename__ = "student_content_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(
        UUID(as_uuid=True),
        ForeignKey("students.student_id", ondelete="CASCADE")
    )
    content_id = Column(
        UUID(as_uuid=True),
        ForeignKey("content.content_id", ondelete="CASCADE")
    )
    status = Column(String(20), nullable=False, default="pending")
    completed_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed')", name="ck_progress_status"),
        UniqueConstraint("student_id", "content_id", name="uq_student_content"),
    )


# -------------------------
# AUTO DDL EXECUTION
# -------------------------
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
