# api/models.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# User Models
class UserBase(BaseModel):
    name: str
    bio: Optional[str] = None  # Champ bio
    avatar_url: Optional[str] = None  # Champ avatar_url ajouté

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class User(UserBase):
    id: str

# MessageCreate model (ajouté)
class MessageCreate(BaseModel):
    content: Optional[str] = None
    media: Optional[str] = None

# Message Models
class Message(BaseModel):
    sender: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    media: Optional[str] = None  # URL vers le fichier média
    reactions: Dict[str, int] = {}  # Réactions sous forme d'émojis

# Conversation Models
class ConversationCreate(BaseModel):
    participants: List[str]
    name: Optional[str] = None

class Conversation(BaseModel):
    id: str
    name: Optional[str] = None  # Nom du groupe (facultatif)
    participants: List[str]
    messages: List[Message] = []