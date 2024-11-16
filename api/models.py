# models.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Modèles pour l'utilisateur
class UserBase(BaseModel):
    name: str
    bio: Optional[str] = None  # Ajout du champ bio

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

class User(UserBase):
    id: str

# Modèles pour les messages
class Message(BaseModel):
    sender: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Modèles pour les conversations
class Conversation(BaseModel):
    id: str
    name: Optional[str] = None  # Nom du groupe (optionnel)
    participants: List[str]
    messages: List[Message] = []