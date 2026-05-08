#!/usr/bin/env python3
"""
Test script for the Payment Management System
Run this after setting up your database to create sample payment data
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/admin"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_connection():
    """Test if the backend is running"""
    print_section("Testing Backend Connection")
    try:
        response = requests.get(BASE_URL)
        print(f"✅ Backend is running: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Backend is not running: {e}")
        print("Please start the backend with: uvicorn main:app --reload")
        return False

def get_students():
    """Get list of students"""
    print_section("Fetching Students")
    try:
        response = requests.get(f"{BASE_URL}/students")
        students = response.json()
        print(f"✅ Found {len(students)} students")
        if students:
            for i, s in enumerate(students[:5], 1):
                print(f"  {i}. {s['first_name']} {s['last_name']} (ID: {s['id']})")
        return students
    except Exception as e:
        print(f"❌ Error fetching students: {e}")
        return []

def create_sample_payments(students):
    """Create sample payment records"""
    print_section("Creating Sample Payments")
    
    if not students:
        print("❌ No students found. Please add students first.")
        return
    
    payment_types = [
        "Monthly Tuition",
        "Exam Fee",
        "Material Fee",
        "Registration Fee"
    ]
    
    created_payments = []
    
    for i, student in enumerate(students[:5]):  # Create payments for first 5 students
        payment_data = {
            "student_id": student['id'],
            "amount": 2500.00 + (i * 500),
            "payment_type": payment_types[i % len(payment_types)],
            "description": f"{payment_types[i % len(payment_types)]} for {student['first_name']} {student['last_name']}",
            "due_date": (datetime.now() + timedelta(days=15 + i*2)).strftime("%Y-%m-%d"),
            "status": "pending" if i % 3 != 0 else "paid"
        }
        
        try:
            response = requests.post(f"{API_URL}/payments", json=payment_data)
            if response.status_code == 200:
                payment = response.json()
                created_payments.append(payment)
                status_emoji = "✅" if payment['status'] == "paid" else "⏳"
                print(f"{status_emoji} Payment #{payment['id']} created: ₹{payment['amount']} - {payment['payment_type']}")
            else:
                print(f"❌ Failed to create payment: {response.text}")
        except Exception as e:
            print(f"❌ Error creating payment: {e}")
    
    print(f"\n✅ Created {len(created_payments)} sample payments")
    return created_payments

def get_all_payments():
    """Get all payments"""
    print_section("Fetching All Payments")
    try:
        response = requests.get(f"{API_URL}/payments")
        payments = response.json()
        print(f"✅ Found {len(payments)} payments\n")
        
        if payments:
            print(f"{'ID':<8} {'Student':<20} {'Amount':<12} {'Type':<20} {'Status':<12}")
            print("-" * 80)
            for p in payments[:10]:
                print(f"{p['id']:<8} {p['student_name']:<20} ₹{p['amount']:<10.2f} {p['payment_type']:<20} {p['status']:<12}")
        
        return payments
    except Exception as e:
        print(f"❌ Error fetching payments: {e}")
        return []

def test_mark_as_paid(payments):
    """Test marking a payment as paid"""
    print_section("Testing Mark as Paid")
    
    # Find a pending payment
    pending = [p for p in payments if p['status'] == 'pending']
    
    if not pending:
        print("⚠️  No pending payments found")
        return
    
    payment = pending[0]
    print(f"Marking payment #{payment['id']} as paid...")
    
    try:
        response = requests.post(
            f"{API_URL}/payments/{payment['id']}/mark-paid",
            params={"payment_method": "Cash"}
        )
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Payment marked as paid!")
            print(f"   Status: {result['status']}")
            print(f"   Paid Date: {result['paid_date']}")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_get_overdue():
    """Test getting overdue payments"""
    print_section("Testing Overdue Payments")
    try:
        response = requests.get(f"{API_URL}/payments/overdue/list")
        overdue = response.json()
        print(f"✅ Found {len(overdue)} overdue payments\n")
        
        if overdue:
            for p in overdue[:5]:
                print(f"  Invoice #{p['id']}: {p['student_name']} - ₹{p['amount']} ({p['days_overdue']} days overdue)")
        else:
            print("  No overdue payments found (that's good!)")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_payment_filters():
    """Test payment filtering by status"""
    print_section("Testing Payment Filters")
    
    statuses = ['paid', 'pending', 'overdue']
    
    for status in statuses:
        try:
            response = requests.get(f"{API_URL}/payments/status/{status}")
            payments = response.json()
            print(f"  {status.upper()}: {len(payments)} payments")
        except Exception as e:
            print(f"  ❌ Error getting {status} payments: {e}")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  PAYMENT MANAGEMENT SYSTEM - TEST SUITE")
    print("="*60)
    
    # Test connection
    if not test_connection():
        return
    
    # Get students
    students = get_students()
    
    if not students:
        print("\n⚠️  Warning: No students found in database.")
        print("Please add some students first before creating payments.")
        return
    
    # Create sample payments
    choice = input("\nCreate sample payment data? (y/n): ").lower()
    if choice == 'y':
        create_sample_payments(students)
    
    # Get all payments
    payments = get_all_payments()
    
    if payments:
        # Test mark as paid
        test_mark_as_paid(payments)
        
        # Test payment filters
        test_payment_filters()
        
        # Test overdue
        test_get_overdue()
    
    print_section("Test Complete!")
    print("✅ All tests completed successfully!")
    print(f"\n🌐 Open the Payment Manager UI:")
    print(f"   http://localhost:5173/admin/payments\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
