"""
WebSocket Manager for Real-time Calendar Updates
Handles live sync between Admin, Teachers, and Students
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections by user type and ID
        self.active_connections: Dict[str, Set[WebSocket]] = {
            'admin': set(),
            'teachers': {},  # teacher_id: {websockets}
            'students': {}   # student_id: {websockets}
        }
    
    async def connect(self, websocket: WebSocket, user_type: str, user_id: int = None):
        """Connect a user to WebSocket"""
        await websocket.accept()
        
        if user_type == 'admin':
            self.active_connections['admin'].add(websocket)
        elif user_type == 'teacher':
            if user_id not in self.active_connections['teachers']:
                self.active_connections['teachers'][user_id] = set()
            self.active_connections['teachers'][user_id].add(websocket)
        elif user_type == 'student':
            if user_id not in self.active_connections['students']:
                self.active_connections['students'][user_id] = set()
            self.active_connections['students'][user_id].add(websocket)
        
        print(f"✅ {user_type} {user_id if user_id else ''} connected to WebSocket")
    
    def disconnect(self, websocket: WebSocket, user_type: str, user_id: int = None):
        """Disconnect a user from WebSocket"""
        if user_type == 'admin':
            self.active_connections['admin'].discard(websocket)
        elif user_type == 'teacher' and user_id in self.active_connections['teachers']:
            self.active_connections['teachers'][user_id].discard(websocket)
            if not self.active_connections['teachers'][user_id]:
                del self.active_connections['teachers'][user_id]
        elif user_type == 'student' and user_id in self.active_connections['students']:
            self.active_connections['students'][user_id].discard(websocket)
            if not self.active_connections['students'][user_id]:
                del self.active_connections['students'][user_id]
        
        print(f"❌ {user_type} {user_id if user_id else ''} disconnected from WebSocket")
    
    async def broadcast_to_admin(self, message: dict):
        """Send message to all admin connections"""
        disconnected = set()
        for connection in self.active_connections['admin']:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.active_connections['admin'].discard(conn)
    
    async def send_to_teacher(self, teacher_id: int, message: dict):
        """Send message to a specific teacher"""
        if teacher_id in self.active_connections['teachers']:
            disconnected = set()
            for connection in self.active_connections['teachers'][teacher_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Clean up disconnected
            for conn in disconnected:
                self.active_connections['teachers'][teacher_id].discard(conn)
    
    async def send_to_student(self, student_id: int, message: dict):
        """Send message to a specific student"""
        if student_id in self.active_connections['students']:
            disconnected = set()
            for connection in self.active_connections['students'][student_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Clean up disconnected
            for conn in disconnected:
                self.active_connections['students'][student_id].discard(conn)
    
    async def broadcast_session_update(self, session_data: dict, student_ids: List[int], teacher_id: int):
        """Broadcast session update to all affected users"""
        message = {
            'type': 'session_update',
            'timestamp': datetime.now().isoformat(),
            'data': session_data
        }
        
        # Notify admin
        await self.broadcast_to_admin(message)
        
        # Notify teacher
        if teacher_id:
            await self.send_to_teacher(teacher_id, message)
        
        # Notify all enrolled students
        for student_id in student_ids:
            await self.send_to_student(student_id, message)
    
    async def broadcast_enrollment_update(self, session_id: int, student_id: int, action: str):
        """Broadcast enrollment change"""
        message = {
            'type': 'enrollment_update',
            'timestamp': datetime.now().isoformat(),
            'data': {
                'session_id': session_id,
                'student_id': student_id,
                'action': action  # 'added' or 'removed'
            }
        }
        
        # Notify admin
        await self.broadcast_to_admin(message)
        
        # Notify student
        await self.send_to_student(student_id, message)
    
    async def broadcast_attendance_update(self, session_id: int, student_id: int, status: str):
        """Broadcast attendance update"""
        message = {
            'type': 'attendance_update',
            'timestamp': datetime.now().isoformat(),
            'data': {
                'session_id': session_id,
                'student_id': student_id,
                'status': status
            }
        }
        
        # Notify admin
        await self.broadcast_to_admin(message)
        
        # Notify student
        await self.send_to_student(student_id, message)


# Singleton instance
manager = ConnectionManager()
