"""
Razorpay Payment Gateway Integration for VAMA Music Academy
Handles payment processing, verification, and webhooks
"""

import razorpay
import hmac
import hashlib
import os
from typing import Optional, Dict

class RazorpayService:
    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None):
        """
        Initialize Razorpay client
        
        Get your keys from: https://dashboard.razorpay.com/app/keys
        
        Use environment variables for production:
        - RAZORPAY_KEY_ID
        - RAZORPAY_KEY_SECRET
        """
        self.key_id = key_id or os.getenv('RAZORPAY_KEY_ID', 'rzp_test_XXXXXXXXXXXX')
        self.key_secret = key_secret or os.getenv('RAZORPAY_KEY_SECRET', 'XXXXXXXXXXXXXXXXXXXX')
        
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
        self.client.set_app_details({
            "title": "VAMA Music Academy",
            "version": "1.0.0"
        })
    
    def create_order(self, amount: float, currency: str = "INR", 
                    receipt: str = None, notes: Dict = None) -> Dict:
        """
        Create a Razorpay order
        
        Args:
            amount: Amount in INR (will be converted to paise)
            currency: Currency code (default: INR)
            receipt: Receipt number/invoice number
            notes: Additional notes as dict
        
        Returns:
            Dict with order details including order_id
        """
        try:
            # Convert amount to paise (smallest currency unit)
            amount_paise = int(amount * 100)
            
            order_data = {
                'amount': amount_paise,
                'currency': currency,
                'payment_capture': 1  # Auto capture payment
            }
            
            if receipt:
                order_data['receipt'] = str(receipt)
            
            if notes:
                order_data['notes'] = notes
            
            order = self.client.order.create(data=order_data)
            
            print(f"✅ Razorpay order created: {order['id']}")
            return {
                'success': True,
                'order_id': order['id'],
                'amount': amount,
                'amount_paise': amount_paise,
                'currency': currency,
                'key_id': self.key_id  # Send to frontend
            }
            
        except Exception as e:
            print(f"❌ Error creating Razorpay order: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment_signature(self, razorpay_order_id: str, 
                                razorpay_payment_id: str, 
                                razorpay_signature: str) -> bool:
        """
        Verify payment signature for security
        
        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_signature: Signature from Razorpay
        
        Returns:
            bool: True if signature is valid
        """
        try:
            # Create the signature string
            message = f"{razorpay_order_id}|{razorpay_payment_id}"
            
            # Generate signature
            generated_signature = hmac.new(
                self.key_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
            
            if is_valid:
                print(f"✅ Payment signature verified for order: {razorpay_order_id}")
            else:
                print(f"❌ Invalid payment signature for order: {razorpay_order_id}")
            
            return is_valid
            
        except Exception as e:
            print(f"❌ Error verifying signature: {e}")
            return False
    
    def get_payment_details(self, payment_id: str) -> Optional[Dict]:
        """
        Get payment details from Razorpay
        
        Args:
            payment_id: Razorpay payment ID
        
        Returns:
            Dict with payment details or None
        """
        try:
            payment = self.client.payment.fetch(payment_id)
            return {
                'payment_id': payment['id'],
                'order_id': payment.get('order_id'),
                'amount': payment['amount'] / 100,  # Convert from paise
                'currency': payment['currency'],
                'status': payment['status'],
                'method': payment.get('method'),
                'email': payment.get('email'),
                'contact': payment.get('contact'),
                'created_at': payment['created_at']
            }
        except Exception as e:
            print(f"❌ Error fetching payment details: {e}")
            return None
    
    def initiate_refund(self, payment_id: str, amount: Optional[float] = None, 
                       notes: Optional[Dict] = None) -> Dict:
        """
        Initiate a refund
        
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to refund (None for full refund)
            notes: Additional notes
        
        Returns:
            Dict with refund details
        """
        try:
            refund_data = {}
            
            if amount:
                refund_data['amount'] = int(amount * 100)  # Convert to paise
            
            if notes:
                refund_data['notes'] = notes
            
            refund = self.client.payment.refund(payment_id, refund_data)
            
            print(f"✅ Refund initiated: {refund['id']}")
            return {
                'success': True,
                'refund_id': refund['id'],
                'amount': refund['amount'] / 100,
                'status': refund['status']
            }
            
        except Exception as e:
            print(f"❌ Error initiating refund: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def create_payment_link(self, amount: float, description: str,
                          customer_name: str, customer_email: str,
                          customer_phone: str, reference_id: str = None) -> Dict:
        """
        Create a payment link for students to pay online
        
        Args:
            amount: Amount in INR
            description: Payment description
            customer_name: Student name
            customer_email: Student email
            customer_phone: Student phone
            reference_id: Invoice/payment reference ID
        
        Returns:
            Dict with payment link details
        """
        try:
            link_data = {
                'amount': int(amount * 100),  # Convert to paise
                'currency': 'INR',
                'description': description,
                'customer': {
                    'name': customer_name,
                    'email': customer_email,
                    'contact': customer_phone
                },
                'notify': {
                    'sms': True,
                    'email': True
                },
                'reminder_enable': True,
                'callback_url': 'https://your-domain.com/payment/callback',
                'callback_method': 'get'
            }
            
            if reference_id:
                link_data['reference_id'] = str(reference_id)
            
            payment_link = self.client.payment_link.create(link_data)
            
            print(f"✅ Payment link created: {payment_link['short_url']}")
            return {
                'success': True,
                'link_id': payment_link['id'],
                'short_url': payment_link['short_url'],
                'reference_id': payment_link.get('reference_id'),
                'amount': amount
            }
            
        except Exception as e:
            print(f"❌ Error creating payment link: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_webhook_signature(self, webhook_body: str, webhook_signature: str) -> bool:
        """
        Verify webhook signature from Razorpay
        
        Args:
            webhook_body: Raw webhook request body
            webhook_signature: X-Razorpay-Signature header value
        
        Returns:
            bool: True if signature is valid
        """
        try:
            # Get webhook secret from environment
            webhook_secret = os.getenv('RAZORPAY_WEBHOOK_SECRET', '')
            
            # Generate signature
            generated_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                webhook_body.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(generated_signature, webhook_signature)
            
        except Exception as e:
            print(f"❌ Error verifying webhook signature: {e}")
            return False


# Singleton instance
razorpay_service = RazorpayService()
