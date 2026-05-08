"""
Email Service for VAMA Music Academy
Sends invoices, payment reminders, and receipts via email
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime, timedelta
import os
from typing import List, Optional

class EmailService:
    def __init__(self, smtp_server=None, smtp_port=None, email=None, password=None):
        """
        Initialize email service
        
        Use environment variables for production:
        - SMTP_SERVER
        - SMTP_PORT
        - SMTP_EMAIL
        - SMTP_PASSWORD
        """
        self.smtp_server = smtp_server or os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = smtp_port or int(os.getenv('SMTP_PORT', '587'))
        self.email = email or os.getenv('SMTP_EMAIL', 'your-email@gmail.com')
        self.password = password or os.getenv('SMTP_PASSWORD', 'your-app-password')
        
        self.company_name = "VAMA Music Academy"
        self.company_email = self.email
        self.company_phone = "+91 XXXXXXXXXX"
    
    def send_email(self, to_email: str, subject: str, html_body: str, 
                   attachments: Optional[List[str]] = None, cc: Optional[List[str]] = None):
        """
        Send an email with optional attachments
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email content
            attachments: List of file paths to attach
            cc: List of CC email addresses
        
        Returns:
            bool: True if sent successfully
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.company_name} <{self.email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # Attach HTML body
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Attach files
            if attachments:
                for filepath in attachments:
                    if os.path.exists(filepath):
                        with open(filepath, 'rb') as f:
                            part = MIMEApplication(f.read(), Name=os.path.basename(filepath))
                            part['Content-Disposition'] = f'attachment; filename="{os.path.basename(filepath)}"'
                            msg.attach(part)
            
            # Send email
            recipients = [to_email] + (cc if cc else [])
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    def send_invoice_email(self, student_email: str, student_name: str, 
                          invoice_number: int, amount: float, due_date: str,
                          pdf_path: Optional[str] = None):
        """Send invoice email to student"""
        
        subject = f"Invoice #{invoice_number} from {self.company_name}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #463a7a 0%, #2d2550 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .invoice-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .amount {{ font-size: 32px; color: #463a7a; font-weight: bold; }}
                .button {{ display: inline-block; background: #463a7a; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 25px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎵 {self.company_name}</h1>
                    <p>Invoice #<strong>{invoice_number}</strong></p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{student_name}</strong>,</p>
                    
                    <p>Thank you for being a valued student at {self.company_name}! 
                    This email contains your invoice for the current billing period.</p>
                    
                    <div class="invoice-details">
                        <h2 style="color: #463a7a; margin-top: 0;">Invoice Details</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0;">Invoice Number:</td>
                                <td style="padding: 10px 0; font-weight: bold;">#{invoice_number}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0;">Due Date:</td>
                                <td style="padding: 10px 0; font-weight: bold; color: #ff6b6b;">{due_date}</td>
                            </tr>
                            <tr style="border-top: 2px solid #463a7a;">
                                <td style="padding: 15px 0; font-size: 18px;">Total Amount:</td>
                                <td style="padding: 15px 0;">
                                    <span class="amount">₹{amount:.2f}</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="#" class="button">Pay Now</a>
                    </p>
                    
                    <h3 style="color: #463a7a;">Payment Methods:</h3>
                    <ul>
                        <li><strong>UPI:</strong> your-upi@bank</li>
                        <li><strong>Bank Transfer:</strong> Account details in attached invoice</li>
                        <li><strong>Cash:</strong> At academy reception</li>
                        <li><strong>Online:</strong> Click "Pay Now" button above</li>
                    </ul>
                    
                    <p><small>💡 <em>Please find the detailed invoice attached to this email.</em></small></p>
                    
                    <div class="footer">
                        <p>If you have any questions, please contact us at:<br>
                        📧 {self.company_email} | 📱 {self.company_phone}</p>
                        <p style="margin-top: 20px;">&copy; {datetime.now().year} {self.company_name}. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        attachments = [pdf_path] if pdf_path and os.path.exists(pdf_path) else None
        return self.send_email(student_email, subject, html_body, attachments)
    
    def send_payment_reminder(self, student_email: str, student_name: str,
                            invoice_number: int, amount: float, due_date: str,
                            days_until_due: int):
        """Send payment reminder email"""
        
        if days_until_due < 0:
            subject = f"⚠️ Overdue Payment Reminder - Invoice #{invoice_number}"
            urgency = "OVERDUE"
            urgency_color = "#ff4444"
        elif days_until_due <= 3:
            subject = f"🔔 Payment Reminder - Invoice #{invoice_number} Due Soon"
            urgency = "DUE SOON"
            urgency_color = "#ff9800"
        else:
            subject = f"📋 Upcoming Payment - Invoice #{invoice_number}"
            urgency = "UPCOMING"
            urgency_color = "#4CAF50"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #463a7a 0%, #2d2550 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .urgency {{ background: {urgency_color}; color: white; padding: 15px; border-radius: 8px;
                           text-align: center; font-weight: bold; font-size: 18px; margin: 20px 0; }}
                .amount {{ font-size: 32px; color: #463a7a; font-weight: bold; }}
                .button {{ display: inline-block; background: #463a7a; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 25px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎵 {self.company_name}</h1>
                    <p>Payment Reminder</p>
                </div>
                
                <div class="content">
                    <p>Dear <strong>{student_name}</strong>,</p>
                    
                    <div class="urgency">{urgency}</div>
                    
                    <p>This is a friendly reminder about your pending payment:</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td>Invoice Number:</td>
                                <td style="font-weight: bold;">#{invoice_number}</td>
                            </tr>
                            <tr>
                                <td>Due Date:</td>
                                <td style="font-weight: bold; color: {urgency_color};">{due_date}</td>
                            </tr>
                            <tr>
                                <td>Days {'overdue' if days_until_due < 0 else 'remaining'}:</td>
                                <td style="font-weight: bold;">{abs(days_until_due)} days</td>
                            </tr>
                            <tr style="border-top: 2px solid #463a7a;">
                                <td style="padding-top: 15px; font-size: 18px;">Amount Due:</td>
                                <td style="padding-top: 15px;">
                                    <span class="amount">₹{amount:.2f}</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="#" class="button">Pay Now</a>
                    </p>
                    
                    <p>For any questions or payment assistance, please contact us.</p>
                    
                    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                        <p>📧 {self.company_email} | 📱 {self.company_phone}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(student_email, subject, html_body)
    
    def send_payment_confirmation(self, student_email: str, student_name: str,
                                 invoice_number: int, amount: float, 
                                 payment_date: str, payment_method: str,
                                 receipt_path: Optional[str] = None):
        """Send payment confirmation email"""
        
        subject = f"✅ Payment Received - Invoice #{invoice_number}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success-box {{ background: #d1fae5; border: 2px solid #10b981; padding: 20px; 
                              border-radius: 8px; text-align: center; margin: 20px 0; }}
                .checkmark {{ font-size: 48px; color: #10b981; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎵 {self.company_name}</h1>
                    <p>Payment Confirmation</p>
                </div>
                
                <div class="content">
                    <div class="success-box">
                        <div class="checkmark">✓</div>
                        <h2 style="color: #059669; margin: 10px 0;">Payment Successful!</h2>
                    </div>
                    
                    <p>Dear <strong>{student_name}</strong>,</p>
                    
                    <p>Thank you for your payment! We have successfully received your payment.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #463a7a; margin-top: 0;">Payment Details</h3>
                        <table style="width: 100%;">
                            <tr>
                                <td>Invoice Number:</td>
                                <td style="font-weight: bold;">#{invoice_number}</td>
                            </tr>
                            <tr>
                                <td>Payment Date:</td>
                                <td style="font-weight: bold;">{payment_date}</td>
                            </tr>
                            <tr>
                                <td>Payment Method:</td>
                                <td style="font-weight: bold;">{payment_method}</td>
                            </tr>
                            <tr style="border-top: 2px solid #10b981;">
                                <td style="padding-top: 15px; font-size: 18px;">Amount Paid:</td>
                                <td style="padding-top: 15px; font-size: 24px; font-weight: bold; color: #10b981;">
                                    ₹{amount:.2f}
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>Your receipt is attached to this email for your records.</p>
                    
                    <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                        💡 <strong>Tip:</strong> Please keep this email and receipt for your records.
                    </p>
                    
                    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                        <p>Thank you for choosing {self.company_name}!</p>
                        <p>📧 {self.company_email} | 📱 {self.company_phone}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        attachments = [receipt_path] if receipt_path and os.path.exists(receipt_path) else None
        return self.send_email(student_email, subject, html_body, attachments)


# Singleton instance
email_service = EmailService()
