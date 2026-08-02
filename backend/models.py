from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    identifier: str  # Email or Username
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    status: str = "Available"
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MessageCreate(BaseModel):
    chat_id: str
    receiver_id: str
    text: Optional[str] = None
    msg_type: str = "text"  # text, image, file, audio
    media_url: Optional[str] = None
    file_name: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    receiver_id: str
    text: Optional[str] = None
    msg_type: str = "text"
    media_url: Optional[str] = None
    file_name: Optional[str] = None
    timestamp: datetime
    reaction: Optional[str] = None

class ChatCreate(BaseModel):
    chat_name: Optional[str] = None
    is_group: bool = False
    participants: List[str]  # List of User IDs
