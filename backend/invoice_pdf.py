"""
PDF Invoice Generator for VAMA Music Academy
Generates professional invoices using ReportLab
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfgen import canvas
from datetime import datetime
import os

class InvoicePDF:
    def __init__(self, output_dir="invoices"):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        self.styles = getSampleStyleSheet()
        self.add_custom_styles()
    
    def add_custom_styles(self):
        """Add custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#463a7a'),
            spaceAfter=30,
            alignment=1  # Center
        ))
        
        self.styles.add(ParagraphStyle(
            name='CompanyName',
            parent=self.styles['Normal'],
            fontSize=16,
            textColor=colors.HexColor('#463a7a'),
            fontName='Helvetica-Bold',
            alignment=1
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#463a7a'),
            spaceBefore=12,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
    
    def generate_invoice(self, payment_data, student_data, company_info=None):
        """
        Generate PDF invoice
        
        Args:
            payment_data: Dict with payment information
            student_data: Dict with student information
            company_info: Optional dict with company details
        
        Returns:
            str: Path to generated PDF file
        """
        # Set default company info
        if not company_info:
            company_info = {
                'name': 'VAMA Music Academy',
                'address': 'Your Academy Address',
                'city': 'City, State - Pincode',
                'phone': '+91 XXXXXXXXXX',
                'email': 'contact@vamamusic.com',
                'website': 'www.vamamusic.com',
                'gstin': 'GSTIN (if applicable)'
            }
        
        # Generate filename
        invoice_number = payment_data.get('id', 'DRAFT')
        filename = f"invoice_{invoice_number}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = os.path.join(self.output_dir, filename)
        
        # Create PDF
        doc = SimpleDocTemplate(filepath, pagesize=A4)
        story = []
        
        # Company Header
        story.append(Paragraph(company_info['name'], self.styles['CompanyName']))
        story.append(Paragraph(
            f"{company_info['address']}<br/>{company_info['city']}<br/>"
            f"Phone: {company_info['phone']} | Email: {company_info['email']}<br/>"
            f"Website: {company_info['website']}",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Invoice Title
        story.append(Paragraph("INVOICE", self.styles['InvoiceTitle']))
        story.append(Spacer(1, 0.2*inch))
        
        # Invoice Details Table
        invoice_details = [
            ['Invoice Number:', f"#{invoice_number}"],
            ['Issue Date:', payment_data.get('issue_date', datetime.now().strftime('%d %B, %Y'))],
            ['Due Date:', payment_data.get('due_date', '-')],
            ['Status:', payment_data.get('status', 'Pending').upper()]
        ]
        
        invoice_table = Table(invoice_details, colWidths=[2.5*inch, 3*inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(invoice_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Bill To Section
        story.append(Paragraph("BILL TO:", self.styles['SectionHeader']))
        story.append(Paragraph(
            f"<b>{student_data.get('name', 'Student Name')}</b><br/>"
            f"{student_data.get('email', '')}<br/>"
            f"{student_data.get('phone', '')}<br/>"
            f"{student_data.get('address', '')}",
            self.styles['Normal']
        ))
        story.append(Spacer(1, 0.3*inch))
        
        # Payment Details Table
        story.append(Paragraph("PAYMENT DETAILS:", self.styles['SectionHeader']))
        
        payment_table_data = [
            ['#', 'Description', 'Amount'],
            ['1', payment_data.get('payment_type', 'Payment'), f"₹{payment_data.get('amount', 0):.2f}"]
        ]
        
        if payment_data.get('description'):
            payment_table_data.append(['', payment_data['description'], ''])
        
        payment_table = Table(payment_table_data, colWidths=[0.5*inch, 4*inch, 1.5*inch])
        payment_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#463a7a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Body
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (-1, 1), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(payment_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Total Section
        total_data = [
            ['Total Amount:', f"₹{payment_data.get('amount', 0):.2f}"]
        ]
        
        if payment_data.get('status') == 'paid':
            total_data.append(['Amount Paid:', f"₹{payment_data.get('amount', 0):.2f}"])
            total_data.append(['Balance Due:', '₹0.00'])
        else:
            total_data.append(['Amount Paid:', '₹0.00'])
            total_data.append(['Balance Due:', f"₹{payment_data.get('amount', 0):.2f}"])
        
        total_table = Table(total_data, colWidths=[4.5*inch, 1.5*inch])
        total_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#463a7a')),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 0.5*inch))
        
        # Payment Information
        if payment_data.get('status') != 'paid':
            story.append(Paragraph("PAYMENT INFORMATION:", self.styles['SectionHeader']))
            story.append(Paragraph(
                "Please make payment via:<br/>"
                "• Bank Transfer<br/>"
                "• UPI<br/>"
                "• Cash at Academy<br/>"
                "• Online Payment Gateway",
                self.styles['Normal']
            ))
            story.append(Spacer(1, 0.2*inch))
        
        # Terms and Conditions
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("TERMS & CONDITIONS:", self.styles['SectionHeader']))
        story.append(Paragraph(
            "1. Payment is due by the due date mentioned above<br/>"
            "2. Late payment may result in suspension of services<br/>"
            "3. For any queries, please contact us at the above details",
            self.styles['Normal']
        ))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        story.append(Paragraph(
            "<i>Thank you for choosing VAMA Music Academy!</i><br/>"
            "<i>This is a computer-generated invoice and does not require a signature.</i>",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        
        return filepath


def generate_invoice_pdf(payment, student, company_info=None):
    """
    Helper function to generate invoice PDF
    
    Args:
        payment: Payment model instance
        student: Student model instance
        company_info: Optional company information dict
    
    Returns:
        str: Path to generated PDF file
    """
    pdf_generator = InvoicePDF()
    
    payment_data = {
        'id': payment.id,
        'amount': payment.amount,
        'payment_type': payment.payment_type,
        'description': payment.description,
        'status': payment.status,
        'issue_date': payment.issue_date.strftime('%d %B, %Y') if payment.issue_date else None,
        'due_date': payment.due_date.strftime('%d %B, %Y') if payment.due_date else None,
    }
    
    student_data = {
        'name': f"{student.first_name} {student.last_name}",
        'email': student.email,
        'phone': student.primary_phone_number,
        'address': f"{student.address}, {student.city}, {student.state}" if student.address else ""
    }
    
    return pdf_generator.generate_invoice(payment_data, student_data, company_info)
