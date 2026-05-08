"""
Automated Payment Reminder Scheduler for VAMA Music Academy
Sends automated reminders for upcoming and overdue payments
"""

from datetime import datetime, timedelta, date
from typing import List
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from models import Payment, Student
from email_service import email_service

class PaymentReminderScheduler:
    def __init__(self):
        """Initialize the scheduler"""
        self.scheduler = BackgroundScheduler(timezone=pytz.timezone('Asia/Kolkata'))
        self.is_running = False
    
    def start(self):
        """Start the scheduler"""
        if not self.is_running:
            # Schedule reminder checks
            # Run every day at 9 AM IST
            self.scheduler.add_job(
                self.send_daily_reminders,
                CronTrigger(hour=9, minute=0),
                id='daily_reminders',
                name='Send Daily Payment Reminders',
                replace_existing=True
            )
            
            # Run overdue check every day at 10 AM IST
            self.scheduler.add_job(
                self.send_overdue_reminders,
                CronTrigger(hour=10, minute=0),
                id='overdue_reminders',
                name='Send Overdue Payment Reminders',
                replace_existing=True
            )
            
            # Weekly summary every Monday at 9 AM IST
            self.scheduler.add_job(
                self.send_weekly_summary,
                CronTrigger(day_of_week='mon', hour=9, minute=0),
                id='weekly_summary',
                name='Send Weekly Payment Summary',
                replace_existing=True
            )
            
            self.scheduler.start()
            self.is_running = True
            print("✅ Payment reminder scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            print("⏹️ Payment reminder scheduler stopped")
    
    def send_daily_reminders(self):
        """Send reminders for payments due in the next 3 days"""
        from database import SessionLocal
        
        db = SessionLocal()
        try:
            print(f"📅 Running daily reminder check at {datetime.now()}")
            
            # Get today and 3 days from now
            today = date.today()
            three_days_later = today + timedelta(days=3)
            
            # Find payments due within next 3 days
            upcoming_payments = db.query(Payment).filter(
                Payment.status.in_(['pending', 'overdue']),
                Payment.due_date >= today,
                Payment.due_date <= three_days_later
            ).all()
            
            reminder_count = 0
            for payment in upcoming_payments:
                if payment.student:
                    days_until_due = (payment.due_date - today).days
                    
                    # Send reminder
                    success = email_service.send_payment_reminder(
                        student_email=payment.student.email,
                        student_name=f"{payment.student.first_name} {payment.student.last_name}",
                        invoice_number=payment.id,
                        amount=payment.amount,
                        due_date=payment.due_date.strftime('%d %B, %Y'),
                        days_until_due=days_until_due
                    )
                    
                    if success:
                        reminder_count += 1
            
            print(f"✅ Sent {reminder_count} payment reminders")
            
        except Exception as e:
            print(f"❌ Error sending daily reminders: {e}")
        finally:
            db.close()
    
    def send_overdue_reminders(self):
        """Send reminders for overdue payments"""
        from database import SessionLocal
        
        db = SessionLocal()
        try:
            print(f"⚠️ Running overdue reminder check at {datetime.now()}")
            
            today = date.today()
            
            # Find overdue payments
            overdue_payments = db.query(Payment).filter(
                Payment.status.in_(['pending', 'overdue']),
                Payment.due_date < today
            ).all()
            
            reminder_count = 0
            for payment in overdue_payments:
                # Update status to overdue if it's still pending
                if payment.status == 'pending':
                    payment.status = 'overdue'
                    db.commit()
                
                if payment.student:
                    days_overdue = (today - payment.due_date).days
                    
                    # Send overdue reminder
                    success = email_service.send_payment_reminder(
                        student_email=payment.student.email,
                        student_name=f"{payment.student.first_name} {payment.student.last_name}",
                        invoice_number=payment.id,
                        amount=payment.amount,
                        due_date=payment.due_date.strftime('%d %B, %Y'),
                        days_until_due=-days_overdue  # Negative for overdue
                    )
                    
                    if success:
                        reminder_count += 1
            
            print(f"✅ Sent {reminder_count} overdue reminders")
            
        except Exception as e:
            print(f"❌ Error sending overdue reminders: {e}")
        finally:
            db.close()
    
    def send_weekly_summary(self):
        """Send weekly payment summary to admin"""
        from database import SessionLocal
        
        db = SessionLocal()
        try:
            print(f"📊 Generating weekly payment summary at {datetime.now()}")
            
            today = date.today()
            week_ago = today - timedelta(days=7)
            
            # Calculate statistics
            total_paid_this_week = db.query(Payment).filter(
                Payment.status == 'paid',
                Payment.paid_date >= week_ago,
                Payment.paid_date <= datetime.now()
            ).count()
            
            total_amount_collected = db.query(Payment).filter(
                Payment.status == 'paid',
                Payment.paid_date >= week_ago,
                Payment.paid_date <= datetime.now()
            ).with_entities(db.func.sum(Payment.amount)).scalar() or 0
            
            total_overdue = db.query(Payment).filter(
                Payment.status == 'overdue'
            ).count()
            
            total_pending = db.query(Payment).filter(
                Payment.status == 'pending',
                Payment.due_date >= today
            ).count()
            
            # This would be sent to admin email
            # For now, just log it
            print(f"""
            📊 Weekly Payment Summary:
            - Payments collected: {total_paid_this_week}
            - Amount collected: ₹{total_amount_collected:.2f}
            - Overdue payments: {total_overdue}
            - Pending payments: {total_pending}
            """)
            
        except Exception as e:
            print(f"❌ Error generating weekly summary: {e}")
        finally:
            db.close()
    
    def send_custom_reminder(self, payment_id: int, db: Session):
        """Send a custom reminder for a specific payment"""
        try:
            payment = db.query(Payment).filter(Payment.id == payment_id).first()
            
            if not payment or not payment.student:
                print(f"❌ Payment {payment_id} or student not found")
                return False
            
            today = date.today()
            days_until_due = (payment.due_date - today).days
            
            success = email_service.send_payment_reminder(
                student_email=payment.student.email,
                student_name=f"{payment.student.first_name} {payment.student.last_name}",
                invoice_number=payment.id,
                amount=payment.amount,
                due_date=payment.due_date.strftime('%d %B, %Y'),
                days_until_due=days_until_due
            )
            
            if success:
                print(f"✅ Custom reminder sent for payment {payment_id}")
            
            return success
            
        except Exception as e:
            print(f"❌ Error sending custom reminder: {e}")
            return False


# Singleton instance
reminder_scheduler = PaymentReminderScheduler()


# Helper functions for manual operations
def send_reminder_now(payment_id: int, db: Session):
    """Send a reminder immediately for a specific payment"""
    return reminder_scheduler.send_custom_reminder(payment_id, db)


def get_upcoming_reminders(db: Session, days: int = 7) -> List[Payment]:
    """Get list of payments that will get reminders in next X days"""
    today = date.today()
    future_date = today + timedelta(days=days)
    
    return db.query(Payment).filter(
        Payment.status.in_(['pending', 'overdue']),
        Payment.due_date >= today,
        Payment.due_date <= future_date
    ).all()
