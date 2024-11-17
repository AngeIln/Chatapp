# api/models.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId

# Existing models...

# Add MessageCreate model
class MessageCreate(BaseModel):
    content: Optional[str] = None
    media: Optional[str] = None
# User Models
class UserBase(BaseModel):
    name: str
    bio: Optional[str] = None  # Bio field

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str
    avatar_url: Optional[str] = None  # Avatar URL

class User(UserBase):
    id: str
    avatar_url: Optional[str] = None

# Message Models
class Message(BaseModel):
    sender: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    media: Optional[str] = None  # URL to the media file
    reactions: Dict[str, int] = {}  # Emoji reactions

# Conversation Models
class ConversationCreate(BaseModel):
    participants: List[str]
    name: Optional[str] = None

class Conversation(BaseModel):
    id: str
    name: Optional[str] = None  # Optional group name
    participants: List[str]
    messages: List[Message] = []